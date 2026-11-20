import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let environment: RulesTestEnvironment;
const version = "test-01";
const prefix = "REST-CAJ-";
const questions = Array.from({ length: 18 }, (_, index) => ({ prompt: "Ítem sintético " + (index + 1), options: ["A", "B"] }));
const instrument = {
  version, questions, consentVersion: version,
  consentText: "Este consentimiento sintético se usa exclusivamente para comprobar reglas en el emulador.",
  validationDate: "2026-11-17",
};
const key = { correctIndices: Array(18).fill(0), points: Array(18).fill(1), scoringSummary: "Regla sintética de prueba." };
const allAnswers = Array(18).fill(0);

const user = (id: string, claims: Record<string, unknown> = { email_verified: true }) => environment.authenticatedContext(id, claims).firestore() as unknown as Firestore;
const admin = () => user("admin-user", { admin: true });
const researcher = () => user("research-team", { researcher: true });
const response = (db: Firestore, code: string, stage: "pretest" | "postest") => doc(db, "research_responses", code, "stages", stage);

async function enroll(db: Firestore, uid: string, code: string) {
  const batch = writeBatch(db);
  batch.set(doc(db, "research_enrollments", uid), { code, version });
  batch.set(doc(db, "research_slots", code), { uid, version });
  await batch.commit();
}

async function publish(db: Firestore, data = instrument) {
  const batch = writeBatch(db);
  batch.set(doc(db, "research_instruments", data.version), data);
  batch.set(doc(db, "research_answer_keys", data.version), key);
  batch.set(doc(db, "research_study", "active"), { version: data.version, publishedAt: serverTimestamp(), publishedBy: "research-team" });
  await batch.commit();
}

function submit(db: Firestore, code: string, stage: "pretest" | "postest", overrides = {}) {
  return setDoc(response(db, code, stage), { stage, version, answers: allAnswers, submittedAt: serverTimestamp(), ...overrides });
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-crea",
    firestore: { host: "127.0.0.1", port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(":").at(-1) ?? 8080), rules: readFileSync("firestore.rules", "utf8") },
  });
  await environment.clearFirestore();
});

afterAll(async () => {
  await environment?.clearFirestore();
  await environment?.cleanup();
});

describe("Separación de permisos en el emulador local", () => {
  it("aísla restaurantes y tareas, permite crear con transacción e impide transferencias de propietario", async () => {
    const owner = user("owner");
    const stranger = user("stranger");
    const target = doc(owner, "businesses", "business-one");
    await assertSucceeds(runTransaction(owner, async (transaction) => {
      expect((await transaction.get(target)).exists()).toBe(false);
      transaction.set(target, { owner_id: "owner", context: {} });
    }));
    await assertSucceeds(getDoc(target));
    await assertSucceeds(getDocs(query(collection(owner, "businesses"), where("owner_id", "==", "owner"))));
    await assertFails(getDocs(collection(owner, "businesses")));
    await assertFails(getDoc(doc(stranger, "businesses", "business-one")));
    await assertFails(updateDoc(target, { owner_id: "stranger" }));
    await assertSucceeds(setDoc(doc(owner, "businesses", "business-one", "task_status", "2026-03-NRUS"), { completed: ["task"] }));
    await assertFails(getDoc(doc(stranger, "businesses", "business-one", "task_status", "2026-03-NRUS")));
  });

  it("usa claims para la autorización y conserva una revisión aprobada como registro inmutable", async () => {
    const owner = user("owner");
    const anonymous = environment.unauthenticatedContext().firestore() as unknown as Firestore;
    await assertFails(setDoc(doc(owner, "users", "owner"), { role: "ADMIN" }));
    await assertSucceeds(setDoc(doc(owner, "users", "owner"), { role: "USER" }));
    await assertFails(updateDoc(doc(owner, "users", "owner"), { role: "RESEARCHER" }));
    await assertSucceeds(getDoc(doc(anonymous, "official_sources", "sunat")));
    await assertFails(setDoc(doc(owner, "official_sources", "sunat"), { url: "https://www.sunat.gob.pe" }));
    await assertSucceeds(setDoc(doc(admin(), "official_sources", "sunat"), { url: "https://www.sunat.gob.pe" }));

    const revision = {
      kind: "source", targetId: "sunat", title: "Fuente de prueba", version: "test-01", status: "BORRADOR",
      proposedChange: "Descripción sintética para pruebas", sourceUrl: "https://www.sunat.gob.pe",
      createdAt: serverTimestamp(), createdBy: "admin-user",
    };
    await assertFails(setDoc(doc(researcher(), "catalog_revisions", "one"), revision));
    await assertSucceeds(setDoc(doc(admin(), "catalog_revisions", "one"), revision));
    await assertSucceeds(updateDoc(doc(admin(), "catalog_revisions", "one"), { status: "APROBADA", reviewedAt: serverTimestamp(), reviewedBy: "admin-user" }));
    await assertFails(updateDoc(doc(admin(), "catalog_revisions", "one"), { title: "Alterado" }));
    await assertFails(getDoc(doc(anonymous, "catalog_revisions", "one")));
  });

  it("aplica consentimientos, 18 respuestas, inscripción única y secuencia pretest–intervención–postest", async () => {
    const staff = researcher();
    const account = user("one");
    const outsider = user("two");
    const unverified = user("one", { email_verified: false });
    const code = prefix + "01";

    const exposedQuestion = { ...questions[0], correctIndex: 0 };
    await assertFails(publish(staff, { ...instrument, questions: [...questions.slice(0, 17), exposedQuestion] }));
    await assertSucceeds(publish(staff));
    await assertFails(publish(staff, { ...instrument, version: "test-02" }));
    await assertFails(getDoc(doc(outsider, "research_instruments", version)));
    await assertFails(enroll(staff, "one", prefix + "37"));
    await assertSucceeds(enroll(staff, "one", code));
    await assertFails(enroll(staff, "two", code));
    await assertFails(enroll(staff, "one", prefix + "03"));
    await assertFails(getDoc(doc(unverified, "research_instruments", version)));
    await assertSucceeds(getDoc(doc(account, "research_instruments", version)));
    await assertFails(getDoc(doc(account, "research_answer_keys", version)));
    await assertSucceeds(getDoc(doc(staff, "research_answer_keys", version)));

    const consent = { version, consentVersion: version, role: "PROPIETARIO", acceptedAt: serverTimestamp() };
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore() as unknown as Firestore, "research_consents", code), { legacy: true });
    });
    await assertFails(getDoc(doc(account, "research_consents", code)));
    await assertFails(submit(account, code, "pretest"));
    await assertFails(setDoc(doc(outsider, "research_participant_consents", code), consent));
    await assertSucceeds(setDoc(doc(account, "research_participant_consents", code), consent));
    await assertFails(getDoc(doc(outsider, "research_participant_consents", code)));
    await assertFails(submit(account, code, "pretest", { answers: [0] }));
    await assertFails(submit(account, code, "pretest", { answers: [...allAnswers.slice(0, 17), 2] }));
    await assertSucceeds(submit(account, code, "pretest"));
    await assertFails(submit(account, code, "pretest"));
    await assertFails(getDoc(response(outsider, code, "pretest")));
    await assertFails(submit(account, code, "postest"));
    const intervention = { version, modules: ["Diagnóstico"], confirmedAt: serverTimestamp() };
    await assertFails(setDoc(doc(account, "research_interventions", code), intervention));
    await assertSucceeds(setDoc(doc(staff, "research_interventions", code), intervention));
    await assertFails(submit(account, code, "postest"));

    // Retrocede solo el fixture del emulador para comprobar el cambio de día en Lima.
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(response(context.firestore() as unknown as Firestore, code, "pretest"), { submittedAt: Timestamp.fromMillis(Date.now() - 2 * 86400000) });
    });
    await assertFails(submit(account, code, "postest", { version: "test-02" }));
    await assertSucceeds(submit(account, code, "postest"));
    const score = { participantCode: code, version, pretest: 18, postest: 18, maximum: 18 };
    await assertFails(setDoc(doc(account, "research_results", code), score));
    await assertSucceeds(setDoc(doc(staff, "research_results", code), score));
    await assertFails(getDoc(doc(account, "research_results", code)));

    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore() as unknown as Firestore, "research_evaluations", code), { legacy: true });
    });
    await assertFails(getDoc(doc(account, "research_evaluations", code)));
    await assertSucceeds(getDoc(doc(staff, "research_evaluations", code)));
    await assertFails(setDoc(doc(admin(), "research_evaluations", code), { legacy: false }));
  });
});

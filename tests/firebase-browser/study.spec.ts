import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { Timestamp } from "firebase/firestore";

const identity = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/";
const project = "demo-crea";
const clientKey = "?key=emulator-only-crea";
const code = "REST-CAJ-01";
const samplePassword = "emulator-only-" + Date.now();
const sample = {
  version: "test-browser-01",
  consentVersion: "test-consent-01",
  validationDate: "2026-11-17",
  consentText: "Consentimiento sintético para una prueba automatizada en el emulador de Firebase.",
  scoringSummary: "Fixture de prueba de un punto por acierto.",
  questions: Array.from({ length: 18 }, (_, index) => ({
    prompt: "Pregunta sintética " + (index + 1),
    options: ["Opción de prueba A", "Opción de prueba B"],
    correctIndex: 0,
    points: 1,
  })),
};

let local: RulesTestEnvironment;
test.beforeAll(async () => {
  local = await initializeTestEnvironment({ projectId: project, firestore: { host: "127.0.0.1", port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(":").at(-1) ?? 8080) } });
  await local.clearFirestore();
});
test.afterAll(async () => {
  await local?.clearFirestore();
  await local?.cleanup();
});

async function fakeAdmin(request: APIRequestContext, email: string) {
  const account = await request.post(identity + "accounts:signUp" + clientKey, {
    data: { email, password: samplePassword, returnSecureToken: true },
  });
  expect(account.ok()).toBeTruthy();
  const { localId } = await account.json();
  const claims = await request.post(identity + "projects/" + project + "/accounts:update", {
    headers: { Authorization: "Bearer owner" },
    data: { localId, emailVerified: true, customAttributes: JSON.stringify({ admin: true }) },
  });
  expect(claims.ok()).toBeTruthy();
}

async function auth(page: Page, email: string, register = false) {
  await page.goto(register ? "/registro" : "/ingresar");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(samplePassword);
  await page.getByRole("button", { name: register ? "Crear cuenta" : "Ingresar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
}

async function expectRestrictedAssistant(page: Page) {
  const cloud = page.getByRole("button", { name: "CREA IA, asistente de orientación" });
  await cloud.click();
  const panel = page.getByRole("dialog", { name: "CREA IA" });
  await expect(panel.getByText(/La asistencia está deshabilitada/)).toBeVisible();
  await expect(panel.getByRole("textbox")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(cloud).toBeFocused();
}

async function answerQuiz(page: Page, title: "Pretest" | "Postest") {
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  for (let block = 0; block < 3; block++) {
    const options = page.getByRole("radio", { name: "Opción de prueba A" });
    await expect(options).toHaveCount(6);
    for (const option of await options.all()) await option.check();
    await page.getByRole("button", { name: block === 2 ? "Enviar respuestas" : "Continuar", exact: true }).click();
  }
}

test("registro, persistencia, administración y estudio completo en Firebase Emulator Suite", async ({ browser, page, request }) => {
  const run = Date.now();
  const participantEmail = "participante-" + run + "@example.test";
  const adminEmail = "admin-" + run + "@example.test";
  await fakeAdmin(request, adminEmail);
  await auth(page, participantEmail, true);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Se requiere permiso de administración" })).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Ingresar", exact: true })).toBeVisible();

  await page.goto("/negocios/nuevo");
  const { fillProfile, fillOrigins } = await import("../helpers/assessment");
  await fillProfile(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await fillOrigins(page, "Todavía no tengo cifras", "Todavía no tengo cifras");
  for (let step = 0; step < 2; step++) await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre del restaurante (opcional)").fill("Ficha sintética de prueba");
  await page.getByRole("button", { name: "Ver mi diagnóstico" }).click();
  await page.getByRole("link", { name: "Guardar en mi cuenta" }).click();
  await page.getByLabel("Correo electrónico").fill(participantEmail);
  await page.getByLabel("Contraseña", { exact: true }).fill(samplePassword);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByText("Ficha sintética de prueba", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Guardar evaluación" }).click();
  await expect(page.getByText("Evaluación guardada en tu cuenta.")).toBeVisible();
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page.getByRole("link", { name: "Ingresar", exact: true }).first()).toBeVisible();
  await auth(page, participantEmail);
  await page.goto("/negocios");
  await expect(page.getByLabel("Evaluaciones guardadas").getByRole("option", { name: "Ficha sintética de prueba" })).toHaveCount(1);
  await page.goto("/investigacion");
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByText("Enviamos un enlace de verificación a tu correo.")).toBeVisible();
  const codes = await request.get("http://127.0.0.1:9099/emulator/v1/projects/" + project + "/oobCodes");
  const payload = await codes.json() as { oobCodes: Array<{ email: string; oobCode: string }> };
  const verification = payload.oobCodes.find(({ email }) => email === participantEmail);
  expect(verification).toBeDefined();
  const verify = await request.get("http://127.0.0.1:9099/emulator/action?mode=verifyEmail&oobCode=" + verification!.oobCode + "&apiKey=emulator-only-crea");
  expect(verify.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Ya confirmé mi correo" }).click();
  await expect(page.getByRole("heading", { name: "Tu cuenta aún no está inscrita" })).toBeVisible();

  const account = await request.post(identity + "accounts:signInWithPassword" + clientKey, {
    data: { email: participantEmail, password: samplePassword, returnSecureToken: true },
  });
  expect(account.ok()).toBeTruthy();
  const { localId: uid } = await account.json();

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  try {
    const app = process.env.CREA_FIREBASE_E2E_URL || "http://127.0.0.1:3101";
    await staff.goto(app + "/ingresar");
    await staff.getByLabel("Correo electrónico").fill(adminEmail);
    await staff.getByLabel("Contraseña", { exact: true }).fill(samplePassword);
    await staff.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(staff.getByRole("button", { name: "Salir" })).toBeVisible();
    await staff.goto(app + "/admin");
    await staff.getByRole("searchbox", { name: "Buscar reglas" }).fill("TR-NRUS-01");
    await expect(staff.getByRole("button", { name: "Proponer ajuste" })).toHaveCount(1);
    await staff.getByRole("button", { name: "Proponer ajuste" }).first().click();
    await expect(staff.getByRole("heading", { name: /Nueva revisión/ })).toBeFocused();
    await staff.getByLabel("Versión propuesta").fill("2026.4-test");
    await staff.getByLabel("Cambio y sustento").fill("Revisión sintética del catálogo durante la prueba local.");
    await staff.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(staff.getByText("Borrador registrado.")).toBeVisible();
    await staff.getByRole("button", { name: "Aprobar revisión" }).click();
    await expect(staff.getByText(/Revisión aprobada para una próxima/)).toBeVisible();

    await staff.goto(app + "/investigacion");
    await staff.getByLabel("Archivo del instrumento").setInputFiles({
      name: "instrumento-sintetico.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(sample)),
    });
    await staff.getByRole("checkbox", { name: /Confirmo que el instrumento/ }).check();
    await staff.getByRole("button", { name: "Publicar versión" }).click();
    await staff.getByLabel("UID de Firebase").fill(uid);
    await staff.getByLabel("Código disponible").selectOption(code);
    await staff.getByRole("button", { name: "Asignar código" }).click();
    await expect(staff.getByText("Cuenta inscrita en el estudio.")).toBeVisible();
    await staff.getByRole("searchbox", { name: "Buscar por código" }).fill("sin coincidencia");
    await expect(staff.getByText("No encontramos participantes con ese código.")).toBeVisible();
    await staff.getByRole("searchbox", { name: "Buscar por código" }).fill(code);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Consentimiento informado" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Etapas del estudio" }).locator("[aria-current=step]")).toHaveText("Consentimiento");
    await page.getByRole("radio", { name: "Propietario/a", exact: true }).check();
    await page.getByRole("checkbox", { name: /Acepto participar/ }).check();
    await page.getByRole("button", { name: "Registrar consentimiento" }).click();
    await expectRestrictedAssistant(page);
    await answerQuiz(page, "Pretest");
    await expect(page.getByRole("heading", { name: "Pretest registrado" })).toBeVisible();

    await staff.getByRole("button", { name: "Actualizar", exact: true }).click();
    await staff.getByRole("button", { name: "Registrar intervención" }).click();
    await staff.getByRole("checkbox", { name: "Diagnóstico", exact: true }).check();
    await staff.getByRole("button", { name: "Confirmar intervención" }).click();
    await expect(staff.getByText("Intervención registrada.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Actualizar estado" }).click();
    await expect(page.getByText(/siguiente día calendario/)).toBeVisible();

    await local.withSecurityRulesDisabled(async (testContext) => {
      await testContext.firestore().doc("research_responses/" + code + "/stages/pretest").update({
        submittedAt: Timestamp.fromMillis(Date.now() - 2 * 86400000),
      });
    });

    await page.getByRole("button", { name: "Actualizar estado" }).click();
    await expectRestrictedAssistant(page);
    await answerQuiz(page, "Postest");
    await expect(page.getByRole("heading", { name: "Participación registrada" })).toBeVisible();
    await staff.getByRole("button", { name: "Actualizar", exact: true }).click();
    await staff.getByRole("button", { name: "Calificar par" }).click();
    await expect(staff.getByText("Pretest 18 · Postest 18 · Máximo 18")).toBeVisible();
    const download = staff.waitForEvent("download");
    await staff.getByRole("button", { name: "Exportar CSV" }).click();
    const stream = await (await download).createReadStream();
    const buffers = [];
    for await (const chunk of stream) buffers.push(chunk);
    const csv = Buffer.concat(buffers).toString("utf8");
    expect(csv).toContain(code + "," + sample.version + ",18,18,0,18");
    expect(csv).not.toContain(participantEmail);
  } finally {
    await staffContext.close();
  }
});

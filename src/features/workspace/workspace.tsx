"use client";

import { ArrowRight, FlaskConical, Save } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LinkButton, Notice, PageHeading } from "@/components/ui/primitives";
import { useSession } from "@/features/auth/session";
import { emptyDraft, toBusinessContext } from "@/features/evaluation/assessment";
import { SelectField } from "@/features/evaluation/assessment-fields";
import { useUnfinishedAssessment } from "@/features/evaluation/assessment-entry";
import { Results } from "@/features/evaluation/results";
import { limaDay, readAssessment, saveAssessment, type AssessmentSnapshot } from "@/features/evaluation/session-storage";
import type { StoredBusiness } from "@/lib/firebase/businesses";
import { RuleEngine } from "@/lib/rule-engine";
import type { BusinessContext } from "@/lib/types";

const loadingPanel = () => <p role="status">Cargando sección…</p>;
const Simulation = dynamic(() => import("./simulation").then((module) => module.Simulation), { loading: loadingPanel });
const Obligations = dynamic(() => import("./obligations").then((module) => module.Obligations), { loading: loadingPanel });
const Reports = dynamic(() => import("./reports").then((module) => module.Reports), { loading: loadingPanel });
const FormalizationRoute = dynamic(() => import("./formalization-route").then((module) => module.FormalizationRoute), { ssr: false, loading: loadingPanel });
const Examples = dynamic(() => import("./examples").then((module) => module.Examples), { loading: loadingPanel });
const Assistant = dynamic(() => import("./assistant").then((module) => module.Assistant), { loading: loadingPanel });
const Guides = dynamic(() => import("./guides").then((module) => module.Guides), { ssr: false, loading: loadingPanel });

const sections = [
  { key: "diagnostico", label: "Diagnóstico", title: "Tu diagnóstico" },
  { key: "ruta", label: "Formalización", title: "Tu ruta de formalización" },
  { key: "obligaciones", label: "Obligaciones", title: "Organiza tus obligaciones" },
  { key: "simulador", label: "Simulador", title: "Simula tus impuestos" },
  { key: "reportes", label: "Reportes", title: "Tu reporte" },
  { key: "orientacion", label: "Guías y fuentes", title: "Guías y fuentes oficiales" },
  { key: "ejemplos", label: "Ejemplos", title: "Explora negocios ficticios" },
  { key: "crea-ia", label: "Crea IA", title: "Consulta a Crea IA" },
] as const;

const blankScenario = toBusinessContext({ ...emptyDraft, stage: "idea" });
const blankRecommendations = RuleEngine.recommendTax(blankScenario);

function snapshotFromCloud(item: StoredBusiness): AssessmentSnapshot {
  return {
    id: item.id,
    saved: true,
    date: item.evaluationDate ?? limaDay(item.createdAt?.toDate() ?? new Date()),
    context: item.context,
  };
}

function readLegacyAssessment(email?: string | null) {
  const owner = email ? encodeURIComponent(email.trim().toLowerCase()) : "guest";
  try {
    const raw = localStorage.getItem("efp-business-context:" + owner);
    const possible = raw ? JSON.parse(raw) as BusinessContext : null;
    return possible && typeof possible.legalPerson === "string" ? possible : null;
  } catch {
    return null;
  }
}

export function Workspace({ initialSection = "diagnostico" }: { initialSection?: "diagnostico" | "ruta" } = {}) {
  const session = useSession();
  if (session.loading) return <div className="container-site page-shell"><p role="status">Cargando tu espacio…</p></div>;
  return <WorkspaceContent key={session.user?.uid ?? "guest"} initialSection={initialSection} />;
}

function WorkspaceContent({ initialSection }: { initialSection: "diagnostico" | "ruta" }) {
  const router = useRouter();
  const search = useSearchParams();
  const requested = search.get("restaurante");
  const saveIntent = search.get("guardar") === "1";
  const section = sections.find((item) => item.key === (search.get("seccion") ?? initialSection)) ?? sections[0];
  const { user, mode } = useSession();
  const unfinished = useUnfinishedAssessment();
  const uid = user?.uid;
  const ownerEmail = user?.emailVerified ? user.email : undefined;
  const [activeAssessment, setAssessment] = useState<AssessmentSnapshot | null>(null);
  const [example, setExample] = useState<AssessmentSnapshot | null>(null);
  const assessment = example ?? activeAssessment;
  const [businesses, setBusinesses] = useState<StoredBusiness[]>([]);
  const [legacy, setLegacy] = useState<BusinessContext | null>(null);
  const [guest, setGuest] = useState<AssessmentSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failure, setFailure] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const saveSection = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousSection = useRef(section.key);

  useEffect(() => {
    if (previousSection.current !== section.key) {
      heading.current?.focus();
      previousSection.current = section.key;
    }
  }, [section.key]);

  useEffect(() => {
    let active = true;
    async function load() {
      await Promise.resolve();
      if (!active) return;
      setLoaded(false);
      setFailure("");
      const oldRoute = window.location.pathname.match(/^\/negocios\/([A-Za-z0-9_-]{1,100})\/ruta\/?$/)?.[1];
      const target = requested ?? (oldRoute !== "demo" ? oldRoute : undefined);
      let local = readAssessment(uid);
      setLegacy(!uid || ownerEmail ? readLegacyAssessment(ownerEmail) : null);
      if (!uid) {
        setAssessment(target ? null : local);
        if (target) setFailure("Ingresa con la cuenta propietaria para abrir esa evaluación.");
        setLoaded(true);
        return;
      }

      const guestSnapshot = readAssessment();
      setGuest(guestSnapshot);
      const guestDiffers = guestSnapshot && (!local || local.id !== guestSnapshot.id
        || local.date !== guestSnapshot.date || JSON.stringify(local.context) !== JSON.stringify(guestSnapshot.context));
      if (saveIntent && !target && guestSnapshot && !guestSnapshot.demo && guestDiffers) {
        local = { ...guestSnapshot, id: guestSnapshot.id ?? crypto.randomUUID(), saved: false };
        try { saveAssessment(local, uid); } catch { /* La copia está disponible en esta vista. */ }
      }
      if (local && (!target || local.id === target)) {
        setAssessment(local);
        setLoaded(true);
      } else {
        setAssessment(null);
      }
      try {
        const api = await import("@/lib/firebase/businesses");
        const items = await api.getUserBusinesses();
        if (!active) return;
        setBusinesses(items);
        if (local && (!target || local.id === target)) return;
        const item = target ? items.find((item) => item.id === target) : items[0];
        const snapshot = item ? snapshotFromCloud(item) : null;
        setAssessment(snapshot);
        if (snapshot) {
          try { saveAssessment(snapshot, uid); } catch { /* El acceso desde Firestore sigue disponible. */ }
        }
        if (target && !item) setFailure("Esta evaluación no está disponible para tu cuenta.");
      } catch {
        if (active) setFailure("No pudimos cargar las evaluaciones guardadas. Comprueba tu conexión e inténtalo de nuevo.");
      } finally {
        if (active) setLoaded(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [ownerEmail, requested, retry, saveIntent, uid]);

  useEffect(() => {
    if (loaded && saveIntent && uid && assessment && !assessment.saved && section.key === "diagnostico") {
      saveSection.current?.focus();
    }
  }, [assessment, loaded, saveIntent, section.key, uid]);

  const evaluation = useMemo(() => assessment ? RuleEngine.evaluate(assessment.context, undefined, assessment.date) : null, [assessment]);
  const activeId = assessment?.saved ? assessment.id : requested;
  const base = "/negocios?" + (activeId ? "restaurante=" + encodeURIComponent(activeId) + "&" : "");

  function activate(snapshot: AssessmentSnapshot) {
    try {
      saveAssessment(snapshot, uid);
      setAssessment(snapshot);
      setExample(null);
      setFailure("");
      setFeedback("");
    } catch {
      setFailure("No pudimos conservar la evaluación en esta pestaña. Revisa los permisos de almacenamiento.");
    }
  }

  async function loadDemo(presetId?: string) {
    try {
      const { DEMO_PRESETS } = await import("@/lib/demo-presets");
      const preset = DEMO_PRESETS.find(({ id }) => id === presetId) ?? DEMO_PRESETS[0];
      setExample({ id: "demo-" + preset.id, context: preset.context, date: limaDay(new Date()), demo: true });
      setFailure("");
      setFeedback("");
      router.push(base + "seccion=diagnostico");
    } catch {
      setFailure("No pudimos abrir la demostración.");
    }
  }

  async function save() {
    if (!assessment || !uid || assessment.demo || saving) return;
    const id = assessment.id ?? crypto.randomUUID();
    setSaving(true);
    setFeedback("");
    setFailure("");
    try {
      const api = await import("@/lib/firebase/businesses");
      await api.saveBusinessToFirestore(id, assessment.context, assessment.date);
      const saved = { ...assessment, id, saved: true };
      setAssessment(saved);
      setBusinesses((items) => [
        { id, owner_id: uid, name: saved.context.businessName || "Mi restaurante", context: saved.context, evaluationDate: saved.date },
        ...items.filter((item) => item.id !== id),
      ]);
      try { saveAssessment(saved, uid); } catch { /* La escritura en Firestore ya terminó. */ }
      setFeedback("Evaluación guardada en tu cuenta.");
    } catch {
      setFailure("No pudimos guardar tu evaluación. Tus datos siguen disponibles en esta pestaña para reintentar.");
    } finally {
      setSaving(false);
    }
  }

  function edit() {
    if (assessment) {
      try { saveAssessment(assessment, uid); } catch { return; }
    }
  }

  return <div className="container-site page-shell workspace-shell">
    <div className="print-hidden">
      <PageHeading headingRef={heading} title={!assessment && loaded && section.key === "diagnostico" ? "Mis evaluaciones" : section.title}
        description={assessment ? assessment.context.businessName || undefined : undefined} />
      <nav className="workspace-nav" aria-label="Herramientas de la evaluación">
        {sections.filter(({ key }) => assessment || key === section.key || key === "diagnostico" || key === "obligaciones" || key === "orientacion" || key === "simulador" || key === "ejemplos")
          .map(({ key, label }) => <Link key={key} href={base + "seccion=" + key} aria-current={section.key === key ? "page" : undefined}>{label}</Link>)}
      </nav>
    </div>
      <div className="min-w-0 space-y-4">
        {failure && <div className="print-hidden"><Notice tone="error">{failure}</Notice>{uid && <Button variant="ghost" onClick={() => setRetry((value) => value + 1)}>Volver a cargar</Button>}</div>}
        {section.key === "orientacion" ? <Guides />
        : section.key === "ejemplos" ? <Examples open={(id) => void loadDemo(id)} />
        : !loaded ? <p role="status">Cargando evaluación…</p>
        : !assessment && section.key === "obligaciones" ? <Obligations />
        : !assessment && section.key === "simulador" ? <Simulation context={blankScenario} recommendations={blankRecommendations} />
        : !assessment || !evaluation ? <div className="grid gap-4">
          <EmptyState title="Aún no hay una evaluación abierta">{
            section.key === "simulador" ? "Evalúa tu restaurante para estimar qué pagarías en los regímenes que podrían aplicar."
              : section.key === "reportes" ? "Completa una evaluación para generar tu informe y guardarlo como PDF."
                : section.key === "crea-ia" ? "Abre un diagnóstico para hacer consultas relacionadas con tu restaurante."
                  : "Evalúa tu restaurante para conocer su situación y revisar tus próximos pasos."
          }</EmptyState>
          {section.key === "ruta" && <LinkButton href="/negocios/nuevo" className="justify-self-start">Preparar mi ruta</LinkButton>}
          {guest && !guest.demo && <Card className="grid justify-items-start gap-3 p-5"><h2 className="font-bold">Evaluación de invitado en esta pestaña</h2><Button variant="outline" onClick={() => activate({ ...guest, id: crypto.randomUUID(), saved: false })}>Usar esta evaluación</Button></Card>}
          {legacy && <Card className="grid justify-items-start gap-3 p-5"><h2 className="font-bold">Evaluación de una versión anterior</h2><p className="text-sm text-muted-foreground">Recupera los datos de este navegador y revisa los campos antes de tomar decisiones.</p><Button variant="outline" onClick={() => activate({ id: crypto.randomUUID(), context: legacy, date: limaDay(new Date()) })}>Recuperar evaluación anterior</Button></Card>}
          {mode === "demo" && <Button variant="outline" className="justify-self-start" onClick={() => router.push(base + "seccion=ejemplos")}><FlaskConical aria-hidden="true" /> Abrir un ejemplo de demostración</Button>}
        </div> : <>
          {!assessment.demo && assessment.context.assessmentVersion !== 3 && <div className="print-hidden"><Notice tone="warning">Esta evaluación corresponde a una versión anterior. Revisa tus datos con el asistente actualizado.</Notice></div>}
          {assessment.demo && <div className="print-hidden flex flex-wrap items-center gap-2"><Notice tone="warning">Simulación con datos ficticios.</Notice>
            <Button variant="outline" onClick={() => setExample(null)}>Salir del ejemplo</Button>
          </div>}
          {section.key === "diagnostico" && <Results evaluation={evaluation} context={assessment.context} workspaceHref={base} prepareEdit={assessment.demo ? undefined : edit} />}
          {section.key === "diagnostico" && <div className="print-hidden grid gap-3">
            {!assessment.saved && !assessment.demo && <section ref={saveSection} tabIndex={-1} aria-label="Guardar tu evaluación">
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <h2 className="font-bold">{mode === "firebase" ? "Guarda tu evaluación" : "Tu evaluación está disponible en esta pestaña"}</h2>
                  {mode === "firebase" && <p className="text-sm text-muted-foreground">Guárdala en tu cuenta para consultarla desde otros dispositivos.</p>}
                </div>
                {uid ? <Button variant={saveIntent ? "default" : "outline"} disabled={saving} onClick={() => void save()}><Save aria-hidden="true" /> {saving ? "Guardando…" : "Guardar evaluación"}</Button>
                  : mode === "firebase" && <LinkButton href="/ingresar?volver=%2Fnegocios%3Fguardar%3D1" variant="outline">Guardar en mi cuenta</LinkButton>}
              </Card>
            </section>}
            {businesses.length > 0 && <Card className="p-4">
              <SelectField id="saved-restaurant" label="Evaluaciones guardadas" value={assessment.id ?? ""} onChange={(id) => {
                const item = businesses.find((business) => business.id === id);
                if (item) {
                  activate(snapshotFromCloud(item));
                  router.replace("/negocios?restaurante=" + encodeURIComponent(item.id) + "&seccion=diagnostico");
                }
              }}>
                <option value="">Selecciona una evaluación</option>
                {businesses.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </SelectField>
            </Card>}
            {feedback && <Notice tone="success">{feedback}</Notice>}
            {guest && !guest.demo && assessment.saved && <Button variant="ghost" className="justify-self-start" onClick={() => activate({ ...guest, id: crypto.randomUUID(), saved: false })}>Abrir evaluación de invitado de esta pestaña</Button>}
          </div>}
          {section.key === "simulador" && <Simulation key={assessment.id ?? assessment.date} context={assessment.context} recommendations={evaluation.taxRecommendations} />}
          {section.key === "ruta" && <FormalizationRoute key={assessment.id ?? assessment.date} assessment={assessment} uid={uid} />}
          {section.key === "obligaciones" && <Obligations key={assessment.id ?? assessment.date} assessment={assessment} uid={uid} recommendations={evaluation.taxRecommendations} />}
          {section.key === "reportes" && <Reports context={assessment.context} evaluation={evaluation} demo={assessment.demo} />}
          {section.key === "crea-ia" && <Assistant key={assessment.id ?? assessment.date} context={assessment.context} evaluation={evaluation} />}
        </>}
      </div>
    {assessment && section.key === "diagnostico" && <div className="print-hidden mt-6 border-t border-border pt-3"><Link className="hero-secondary" href="/negocios/nuevo">{unfinished ? "Continuar evaluación en curso" : "Nueva evaluación"} <ArrowRight size={16} aria-hidden="true" /></Link></div>}
  </div>;
}

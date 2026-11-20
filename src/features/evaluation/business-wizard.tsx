"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SourceLink } from "@/components/ui/primitives";
import { useAssistantContext } from "@/features/assistant/cloud";
import { localAssistantTopic } from "@/lib/assistant-topics";
import { ciiuCatalog, isCiiuCode } from "@/lib/ciiu-catalog";
import { locations } from "@/lib/locations";
import { ClassificationField } from "./classification";
import { ProjectionCalculator } from "@/features/workspace/projection-calculator";
import { LinkButton, Notice, PageHeading } from "@/components/ui/primitives";
import { useSession } from "@/features/auth/session";
import { useUnfinishedAssessment } from "./assessment-entry";
import { activities, assessmentFieldLabels, assessmentFields, choices, customers, emptyDraft, fromBusinessContext, isPlanning, modes, origins, regimes, registration, relevantAssessmentFields, risks, stages, toBusinessContext, validateAssessmentStep, type AssessmentDraft, type AssessmentField } from "./assessment";
import { ChoiceField, SelectField, TextField } from "./assessment-fields";
import { limaDay, readAssessment, readDraft, saveAssessment, storeDraft, type AssessmentSnapshot, type DraftSnapshot } from "./session-storage";

const steps = [
  { label: "Tu negocio", description: "Cuéntanos en qué etapa estás, qué ofreces y cómo funciona el negocio." },
  { label: "Ventas y compras", description: "Usa un ejercicio de 2026 como referencia. Distingue proyecciones, cifras reales y montos desconocidos." },
  { label: "Condiciones tributarias", description: "Revisa las condiciones de los regímenes que siguen abiertos. Si un dato se desconoce, déjalo pendiente." },
  { label: "Revisa tus datos", description: "Comprueba tus respuestas antes de ver el diagnóstico." },
];

const diagnosisHref = "/negocios?seccion=diagnostico";
const reviewStep = steps.length - 1;
type Edit = { fields: AssessmentField[]; original: AssessmentDraft; returnToDiagnosis?: boolean };
type Errors = ReturnType<typeof validateAssessmentStep>;

export function BusinessWizard() {
  const { user, loading } = useSession();
  const search = useSearchParams();
  const editing = search.get("editar") === "1";
  const requested = search.get("campo");
  const requestedField = assessmentFields.flat().find((field) => field === requested);

  return <AssessmentEditor key={JSON.stringify([loading, user?.uid, editing, requestedField])} loading={loading} uid={user?.uid} requestedField={requestedField} editing={editing} />;
}

function AssessmentEditor({ loading, uid, requestedField, editing }: { loading: boolean; uid?: string; requestedField?: AssessmentField; editing: boolean }) {
  const [initial, setInitial] = useState<{ snapshot?: AssessmentSnapshot; restored?: DraftSnapshot }>();
  useEffect(() => {
    if (loading) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (editing) setInitial({ snapshot: readAssessment(uid) ?? undefined });
      else setInitial({ restored: readDraft(uid) ?? undefined });
    });
    return () => { active = false; };
  }, [loading, editing, uid]);

  if (loading || !initial) return <div className="container-site page-shell"><p role="status">Cargando evaluación…</p></div>;
  if (editing && !initial.snapshot) return <div className="container-site page-shell">
    <PageHeading title="Abre una evaluación para editarla" description="Puedes volver a tus evaluaciones o comenzar una nueva." />
    <LinkButton href={diagnosisHref}>Volver a mis evaluaciones</LinkButton>
  </div>;
  return <Wizard uid={uid} previous={initial.snapshot} restored={initial.restored} requestedField={requestedField} />;
}

function Wizard({ uid, previous, restored, requestedField }: { uid?: string; previous?: AssessmentSnapshot; restored?: DraftSnapshot; requestedField?: AssessmentField }) {
  const router = useRouter();
  const unfinished = useUnfinishedAssessment();
  const [draft, setDraft] = useState<AssessmentDraft>(() => previous ? fromBusinessContext(previous.context) : { ...emptyDraft, ...restored?.answers });
  const [step, setStep] = useState(() => {
    if (previous) return reviewStep;
    if (!restored) return 0;
    const visible = relevantAssessmentFields(draft);
    if (!draft.stage) return 0;
    const restoredStep = assessmentFields[restored.step];
    return restoredStep?.some((field) => visible.includes(field)) ? restored.step : reviewStep;
  });
  const [edit, setEdit] = useState<Edit | null>(() => requestedField && relevantAssessmentFields(draft).includes(requestedField)
    ? { fields: [requestedField], original: draft, returnToDiagnosis: true } : null);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<AssessmentField | null>(null);
  const moved = useRef(Boolean(edit));
  const visible = relevantAssessmentFields(draft);
  const activeSteps = steps.map((_, index) => index).filter((index) => assessmentFields[index].some((field) => visible.includes(field)));
  const chapter = activeSteps.indexOf(step);
  const [focusedQuestion, setFocusedQuestion] = useState("");
  const helpField = edit?.fields[0];
  const focusTopic = localAssistantTopic(focusedQuestion);
  const stageAnswered = Boolean(draft.stage);
  const planning = isPlanning(draft.stage);
  const assistantContext = useMemo(() => ({
    stage: steps[step].label,
    question: focusedQuestion || (helpField ? assessmentFieldLabels[helpField] : steps[step].description),
    topics: focusTopic ? [focusTopic] : helpField === "assets" ? ["assets" as const]
      : step === 1 ? ["sales" as const] : step === 2 ? ["assets" as const, "tax" as const]
        : ["ciiu" as const, "legal" as const, "invoice" as const],
    stageAnswered,
    planning,
    code: isCiiuCode(draft.activity) ? draft.activity : undefined,
  }), [draft.activity, focusedQuestion, focusTopic, helpField, planning, stageAnswered, step]);
  useAssistantContext(assistantContext);

  useEffect(() => {
    if (previous) return;
    const answers = edit?.original ?? draft;
    if (Object.values(answers).some(Boolean)) storeDraft({ answers, step }, uid);
    else storeDraft(null, uid);
  }, [draft, edit, previous, step, uid]);

  useEffect(() => {
    if (!moved.current) return;
    const trigger = returnFocus.current && document.getElementById("change-" + returnFocus.current);
    (trigger || heading.current)?.focus();
    returnFocus.current = null;
  }, [step, edit]);

  function update(key: AssessmentField, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "stage" && isPlanning(value)) {
        if (next.salesOrigin === "real") next.salesOrigin = "";
        if (next.purchasesOrigin === "real") next.purchasesOrigin = "";
      }
      if (key === "province" && current.province !== value) next.district = "";
      if (key === "description" && current.description !== value && isCiiuCode(current.activity)) next.activity = "";
      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function goTo(index: number) {
    moved.current = true;
    returnFocus.current = null;
    setErrors({});
    setFocusedQuestion("");
    setStep(index);
  }

  function startEdit(field: AssessmentField) {
    moved.current = true;
    setFocusedQuestion("");
    setErrors({});
    returnFocus.current = null;
    setEdit({ fields: [field], original: draft });
  }

  function endEdit(cancel: boolean) {
    if (!edit) return;
    if (cancel) setDraft(edit.original);
    returnFocus.current = edit.fields[0];
    setFocusedQuestion("");
    setEdit(null);
    setErrors({});
  }

  function finish() {
    try {
      const context = toBusinessContext(draft, previous?.context);
      saveAssessment({
        id: previous?.id ?? crypto.randomUUID(),
        context,
        date: previous?.date ?? limaDay(new Date()),
        demo: previous?.demo,
      }, uid);
      if (!previous) storeDraft(null, uid);
      router.push(diagnosisHref);
    } catch {
      setFailure("Habilita el almacenamiento de sesión del navegador para poder abrir el diagnóstico.");
    }
  }

  function focusField(field: AssessmentField) {
    requestAnimationFrame(() => document.getElementById(field)?.focus());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (edit) {
      const before = relevantAssessmentFields(edit.original);
      const issues = Object.assign({}, ...activeSteps.map((index) => validateAssessmentStep(draft, index, visible))) as Errors;
      const invalid = Object.keys(issues) as AssessmentField[];
      const additional = visible.filter((field) => !edit.fields.includes(field)
        && ((!before.includes(field) && (!draft[field] || draft[field] === "unknown")) || invalid.includes(field)));
      if (additional.length) {
        setEdit({ ...edit, fields: [...edit.fields, ...additional] });
        setErrors(issues);
        focusField(invalid[0] ?? additional[0]);
        return;
      }
      if (invalid[0]) {
        setErrors(issues);
        focusField(invalid[0]);
        return;
      }
      if (edit.returnToDiagnosis) finish();
      else endEdit(false);
      return;
    }

    if (step === 0 && !draft.stage) {
      setErrors({ stage: "Selecciona la etapa de tu negocio." });
      focusField("stage");
      return;
    }
    const nextErrors = validateAssessmentStep(draft, step, visible);
    const invalid = Object.keys(nextErrors)[0] as AssessmentField | undefined;
    if (invalid) {
      setErrors(nextErrors);
      focusField(invalid);
      return;
    }
    if (step !== reviewStep) {
      goTo(activeSteps[chapter + 1]);
      return;
    }
    for (const index of activeSteps) {
      const issues = validateAssessmentStep(draft, index, visible);
      const field = Object.keys(issues)[0] as AssessmentField | undefined;
      if (field) {
        goTo(index);
        setErrors(issues);
        focusField(field);
        return;
      }
    }
    finish();
  }

  const currentFields = edit ? edit.fields.filter((field, index) => index === 0 || visible.includes(field))
    : assessmentFields[step].filter((field) => visible.includes(field));
  const field = (id: AssessmentField) => id === "activity" && draft.stage ?
    <ClassificationField key={id} description={draft.description} evidence={draft.activityEvidence} primary={draft.activity}
      secondary={draft.secondary} error={errors.activity} onPrimary={(value) => update("activity", value)}
      onEvidence={(value) => update("activityEvidence", value)} onSecondary={(value) => update("secondary", value)} /> :
    <Question key={id} id={id} draft={draft} value={draft[id]} error={errors[id]} onChange={(value) => update(id, value)} />;

  return <div className="container-site page-shell">
    <PageHeading title={previous ? "Actualiza tu evaluación" : "Evalúa tu negocio gastronómico"}
      description={previous ? previous.context.businessName || undefined : restored ? "Tu borrador se recuperó en esta pestaña." : undefined}
      actions={!previous && !edit && unfinished && <LinkButton href="/" variant="ghost">Pausar evaluación</LinkButton>} />
    <div className="wizard-grid">
      <nav className="wizard-nav" aria-label="Progreso de la evaluación">
        <ol className="wizard-progress">
          {activeSteps.map((index) => <li key={index} className={index < step ? "step-done" : undefined} aria-current={index === step ? "step" : undefined}>
            <span className="step-number">{index < step ? <Check size={16} aria-label="Completado" /> : activeSteps.indexOf(index) + 1}</span> {steps[index].label}
          </li>)}
        </ol>
      </nav>
      <Card className="p-5 sm:p-8">
        <form onSubmit={submit} noValidate className="grid gap-7" onFocus={(event) => {
          const input = event.target;
          if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return;
          const question = input.closest("fieldset")?.querySelector("legend")?.textContent ?? input.labels?.[0]?.textContent;
          if (question) setFocusedQuestion(question.trim());
        }}>
          <div key={edit ? "edit-" + edit.fields[0] : step} className="flow-step">
            {!edit && <>
              <p className="eyebrow mb-2">Paso {chapter + 1} de {activeSteps.length}</p>
              <div className="step-track" aria-hidden="true">
                {activeSteps.map((index) => <span key={index} data-reached={index <= step} />)}
              </div>
            </>}
            <h2 ref={heading} tabIndex={-1} className="editorial-title">{edit ? "Cambiar " + assessmentFieldLabels[edit.fields[0]].toLowerCase() : steps[step].label}</h2>
            <p className="mt-2 text-muted-foreground">{edit
              ? (edit.returnToDiagnosis ? "Al guardar verás tu diagnóstico actualizado." : "Al guardar volverás a la revisión.")
              : steps[step].description}</p>
          </div>
          {edit ? <>
            {field(currentFields[0])}
            {currentFields.length > 1 && <section className="grid gap-5 rounded-lg border border-border p-4">
              <h3 className="font-bold">Datos relacionados con el cambio</h3>
              {currentFields.slice(1).map(field)}
            </section>}
          </> : step === reviewStep ? <>
            <Review draft={draft} visible={visible} edit={startEdit} />
            {field("name")}
          </> : step === 1 && draft.stage ? <>
            <section className="grid gap-4">
              {field("salesOrigin")}
              {draft.salesOrigin === "proyectado" && <ProjectionCalculator
                taxBreakdown={{ required: !visible.includes("grossAnnualSales"), reducedAvailable: draft.activity === "5610" }}
                onApply={(amounts, _month, netAnnual) => {
                  update("grossAnnualSales", amounts.annual.toFixed(2));
                  update("maxMonthlySales", amounts.maxMonth.toFixed(2));
                  if (netAnnual !== undefined) update("annualSales", netAnnual.toFixed(2));
                }} />}
              <div className="grid gap-5 sm:grid-cols-2">{currentFields.filter((id) => ["annualSales", "grossAnnualSales", "maxMonthlySales"].includes(id)).map(field)}</div>
            </section>
            <section className="grid gap-4 border-t border-border pt-4">
              {field("purchasesOrigin")}
              <div className="grid gap-5 sm:grid-cols-2">{currentFields.filter((id) => ["annualPurchases", "grossPurchases", "maxMonthlyPurchases"].includes(id)).map(field)}</div>
            </section>
          </> : (step === 0 && !draft.stage ? ["stage" as const] : currentFields).map(field)}
          {failure && <Notice tone="error">{failure}</Notice>}
          <div className="wizard-actions flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            {edit?.returnToDiagnosis || (previous && !edit) ? <LinkButton href={diagnosisHref} variant="ghost">Cancelar</LinkButton>
              : edit ? <Button type="button" variant="ghost" onClick={() => endEdit(true)}>Cancelar</Button>
                : chapter > 0 ? <Button type="button" variant="ghost" onClick={() => goTo(activeSteps[chapter - 1])}><ArrowLeft aria-hidden="true" /> Atrás</Button> : <span />}
            <Button type="submit">{edit ? "Guardar cambio" : step === reviewStep ? "Ver mi diagnóstico" : "Continuar"} <ArrowRight aria-hidden="true" /></Button>
          </div>
        </form>
      </Card>
    </div>
  </div>;
}

const numberQuestions = {
  annualSales: ["Ventas anuales", "Para RER y RMT usa los ingresos netos de todo el ejercicio, sin IGV si corresponde. Si el año sigue abierto, proyecta el cierre o deja el dato pendiente."],
  grossAnnualSales: ["Ingresos brutos anuales", "Para el Nuevo RUS indica el total bruto del ejercicio."],
  annualPurchases: ["Compras anuales", "Para el RER suma las adquisiciones afectadas al negocio y excluye los activos fijos."],
  grossPurchases: ["Compras brutas anuales", "Para el Nuevo RUS indica las adquisiciones brutas afectadas a la actividad, incluidos los tributos."],
  maxMonthlySales: ["Ventas del mes más alto", "Indica el total del mes de 2026 con más ventas."],
  maxMonthlyPurchases: ["Compras del mes más alto", "Indica el total del mes de 2026 con más compras."],
  locations: ["Número de locales o unidades de operación", "Incluye todos los espacios desde los que opera tu negocio."],
  assets: ["Valor de los equipos y muebles del negocio", "Incluye equipos y mobiliario de trabajo. Excluye terrenos, inmuebles y vehículos."],
  workers: ["Máximo de trabajadores en un turno", "Cuenta el turno con más personas. Si no tienes trabajadores, escribe 0."],
} as const;

type QuestionProps = { id: AssessmentField; draft: AssessmentDraft; value: string; error?: string; onChange: (value: string) => void };
const provinces = [...new Set(locations.filter(({ department }) => department === "Cajamarca").map(({ province }) => province))].sort();

function Question({ draft, ...props }: QuestionProps) {
  switch (props.id) {
    case "stage":
      return <ChoiceField {...props} label="¿En qué etapa está tu negocio?" options={stages} />;
    case "description":
      return <TextField {...props} label="Describe lo que ofrece tu negocio" hint="Ejemplo: vendo almuerzos por delivery y atiendo celebraciones por encargo. Evita incluir datos personales." maxLength={500} />;
    case "mode":
      return <ChoiceField {...props} label="¿Cómo atenderás a tus clientes?" options={modes} />;
    case "fixedPlace":
      return <ChoiceField {...props} label="¿Tienes o tendrás un local fijo para preparar, almacenar o vender?" options={choices} compact />;
    case "province":
      return <SelectField {...props} label="Provincia de Cajamarca" hint="La municipalidad depende de dónde operes.">
        <option value="">Aún no está definida</option>
        {provinces.map((province) => <option key={province}>{province}</option>)}
      </SelectField>;
    case "district":
      return <TextField {...props} label="Distrito" hint="Escribe el distrito de operación si ya lo conoces." maxLength={70} />;
    case "partners":
      return <TextField {...props} label="¿Cuántos socios habrá, aparte de ti?" hint="Deja en blanco si aún no lo sabes." numeric whole maxLength={5} />;
    case "customers":
      return <ChoiceField {...props} label="¿Quiénes serán tus clientes?" options={customers} />;
    case "rucStatus":
      return <ChoiceField {...props} label="¿El negocio ya está inscrito en el RUC?" hint="Solo indica el estado de inscripción." options={choices} compact />;
    case "workforce":
      return <ChoiceField {...props} label="¿Tienes o tendrás trabajadores dependientes?" options={choices} compact />;
    case "domicile":
      return <ChoiceField {...props} label="¿El contribuyente está o estará domiciliado en Perú para fines tributarios?" options={choices} compact />;
    case "priorRmt":
      return <ChoiceField {...props} label="¿Los ingresos netos del ejercicio anterior superaron las 1 700 UIT?" hint="Usa la UIT del año anterior. Marca No si el negocio inició en este ejercicio." options={choices} compact />;
    case "risk":
      return <ChoiceField {...props} label="¿Qué nivel de riesgo asignó la municipalidad al local?" options={risks} />;
    case "license":
      return <ChoiceField {...props} label="¿El local ya tiene licencia de funcionamiento?" options={choices} compact />;
    case "itse":
      return <ChoiceField {...props} label="¿El local ya tiene certificado ITSE?" hint="ITSE es la Inspección Técnica de Seguridad en Edificaciones." options={choices} compact />;
    case "salesOrigin":
    case "purchasesOrigin":
      return <ChoiceField {...props} label={props.id === "salesOrigin" ? "¿De dónde salen tus cifras de ventas?" : "¿De dónde salen tus cifras de compras?"}
        options={isPlanning(draft.stage) ? origins.slice(1) : origins} />;
    case "nrusRestriction":
    case "rerRestriction": {
      const nrus = props.id === "nrusRestriction";
      return <div className="grid gap-2">
        <ChoiceField {...props} label={nrus ? "¿Realizas actividades excluidas del Nuevo RUS?" : "¿Realizas actividades excluidas del RER?"}
          hint={nrus ? "Por ejemplo, organizar espectáculos públicos o realizar operaciones gravadas con ISC."
            : "Por ejemplo, organizar espectáculos públicos, prestar servicios de comisión o despachar mercancías en aduana."}
          options={choices} compact />
        <SourceLink href={nrus ? "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/nuevo-regimen-unico-simplificado-nuevo-rus"
          : "https://orientacion.sunat.gob.pe/2937-empresas-no-comprendidas-en-el-regimen-especial"}>Consultar exclusiones de SUNAT</SourceLink>
      </div>;
    }
    case "activityEvidence":
    case "secondary":
      return null;
    case "name":
      return <TextField {...props} label="Nombre del restaurante (opcional)" maxLength={100} />;
    case "regime":
      return <SelectField {...props} label="¿En qué régimen estás inscrito?" hint="Consúltalo en tu ficha RUC. Puedes continuar si no lo sabes.">
        <option value="">Elige una opción</option>
        {regimes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>;
    case "activity":
      return <ChoiceField {...props} label="¿A qué se dedica principalmente tu negocio?" options={activities} />;
    case "legal":
      return <ChoiceField {...props} label={isPlanning(draft.stage) ? "¿Cómo planeas operar?" : "¿Operas a tu nombre o como empresa?"} options={registration} />;
    case "invoice":
      return <ChoiceField {...props} label="¿Emites o necesitas emitir facturas de venta?" hint="La factura permite al cliente sustentar un gasto o crédito fiscal cuando cumple los requisitos." options={choices} compact />;
    case "foreignBranch":
      return <ChoiceField {...props} label="¿Tu negocio es una sucursal, agencia o local de una empresa constituida fuera del Perú?" options={choices} compact />;
    case "linkage":
      return <ChoiceField {...props} label="¿Tu negocio está vinculado por capital a otras empresas y sus ingresos en conjunto superan 1 700 UIT al año?" hint="Si tu negocio es independiente, marca No. En 2026, 1 700 UIT equivalen a S/ 9 350 000." options={choices} compact />;
    default: {
      const [label, hint] = numberQuestions[props.id];
      const whole = props.id === "workers" || props.id === "locations";
      return <TextField {...props} label={label} hint={hint} numeric whole={whole} maxLength={whole ? 5 : 15} />;
    }
  }
}

function Review({ draft, visible, edit }: { draft: AssessmentDraft; visible: AssessmentField[]; edit: (field: AssessmentField) => void }) {
  const options = { activity: activities, legal: registration, regime: regimes, invoice: choices, linkage: choices, foreignBranch: choices,
    stage: stages, salesOrigin: origins, purchasesOrigin: origins, mode: modes, customers, risk: risks,
    fixedPlace: choices, rucStatus: choices, workforce: choices, domicile: choices, priorRmt: choices, license: choices, itse: choices, nrusRestriction: choices, rerRestriction: choices };
  function value(field: AssessmentField) {
    if (field === "activity" && draft.stage) {
      if (!isCiiuCode(draft.activity)) return "Clasificación pendiente";
      const secondary = draft.secondary.split(",").filter(isCiiuCode);
      return draft.activity + " · " + ciiuCatalog[draft.activity].name + (secondary.length ? " · Secundarias " + secondary.join(", ") : "");
    }
    if (field in options) return options[field as keyof typeof options].find(([key]) => key === draft[field])?.[1];
    if (!draft[field]) return;
    return ["workers", "locations", "partners", "description", "province", "district"].includes(field) ? draft[field] : "S/ " + draft[field];
  }

  return <div className="grid gap-5">
    {assessmentFields.slice(0, reviewStep).map((group, index) => {
      const fields = group.filter((field) => visible.includes(field));
      if (!fields.length) return null;
      return <section key={steps[index].label} className="rounded-lg border border-border p-4">
        <h3 className="mb-2 font-bold">{steps[index].label}</h3>
        <dl className="divide-y divide-border">
          {fields.map((field) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5" key={field}>
            <dt className="text-sm text-muted-foreground">{assessmentFieldLabels[field]}</dt>
            <dd className="col-start-1 row-start-2 min-w-0 break-words font-semibold">{value(field) || "Sin indicar"}</dd>
            <dd className="col-start-2 row-span-2 row-start-1">
              <Button id={"change-" + field} type="button" variant="ghost" aria-label={"Cambiar " + assessmentFieldLabels[field].toLowerCase()} onClick={() => edit(field)}>Cambiar</Button>
            </dd>
          </div>)}
        </dl>
      </section>;
    })}
  </div>;
}

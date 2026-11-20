import { ArrowRight, CheckCircle2, CircleAlert, CircleHelp } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LinkButton, SourceLink } from "@/components/ui/primitives";
import { sourceById } from "@/lib/seed-catalog";
import { ciiuCatalog, CIIU_TABLE, isCiiuCode } from "@/lib/ciiu-catalog";
import type { FullWorkspaceEvaluation } from "@/lib/rule-engine";
import type { BusinessContext, TaxRecommendation } from "@/lib/types";
import { assessmentEditHref, assessmentFieldLabels, nextAssessmentGap } from "./assessment";

const statuses = {
  COMPATIBLE: { label: "Compatible según tus datos", icon: CheckCircle2, className: "status-compatible" },
  INCOMPATIBLE: { label: "Incompatible", icon: CircleAlert, className: "status-incompatible" },
  INFORMACION_INSUFICIENTE: { label: "Información insuficiente", icon: CircleHelp, className: "status-pending" },
};

export function RegimeStatus({ status }: { status: TaxRecommendation["status"] }) {
  const { label, icon: Icon, className } = statuses[status];
  return <span className={"status-badge " + className}><Icon size={15} aria-hidden="true" /> {label}</span>;
}

function RuleDetails({ regime }: { regime: TaxRecommendation }) {
  const source = sourceById(regime.sourceId);
  return <details className="rule-details border-t border-border">
    <summary>Ver las reglas evaluadas</summary>
    <ul className="divide-y divide-border">
      {regime.evaluatedRules.map((rule, index) => <li key={rule.ruleId + "-" + index} className="py-3 text-sm">
        <strong>{rule.title}</strong>
        <p className="text-muted-foreground">{rule.explanation}</p>
        <SourceLink href={rule.sourceUrl}>{rule.legalBasis}</SourceLink>
        <p className="text-xs text-muted-foreground">Versión {rule.version} · Vigente desde {rule.effectiveDate}</p>
      </li>)}
    </ul>
    {source && <SourceLink href={source.url}>Fuente oficial de SUNAT</SourceLink>}
  </details>;
}

function RegimeReasons({ regime }: { regime: TaxRecommendation }) {
  const reasons = [...regime.breachedConditions, ...regime.missingDataFields];
  return <>
    {regime.verification !== "VIGENTE" && <p className="text-sm text-muted-foreground">La fuente requiere una revisión de vigencia.</p>}
    {reasons.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>}
  </>;
}

function RegimeResult({ regime }: { regime: TaxRecommendation }) {
  return <article className="grid min-w-0 gap-2 border-t border-border py-3.5">
    <div className="flex flex-wrap items-start justify-between gap-2.5">
      <h4 className="text-lg font-bold">{regime.title}</h4><RegimeStatus status={regime.status} />
    </div>
    <RegimeReasons regime={regime} />
    <RuleDetails regime={regime} />
  </article>;
}

const alternativeGroups = [
  { status: "COMPATIBLE", title: "Opciones compatibles según tus datos" },
  { status: "INFORMACION_INSUFICIENTE", title: "Opciones que requieren más información" },
  { status: "INCOMPATIBLE", title: "Opciones con condiciones incompatibles" },
] as const;

export function Results({ evaluation, context, workspaceHref, prepareEdit }: {
  evaluation: FullWorkspaceEvaluation;
  context: BusinessContext;
  workspaceHref: string;
  prepareEdit?: () => void;
}) {
  const { currentRegimeDiagnostic: current, taxRecommendations: regimes, ruleEngineVersion } = evaluation;
  const declared = current?.evaluation;
  const alternatives = regimes.filter((regime) => regime.code !== declared?.code);
  const gap = declared && prepareEdit ? nextAssessmentGap(declared, context) : undefined;

  const starting = context.stage === "idea" || context.stage === "preparacion";
  const originLabels = { real: "Reales declaradas", proyectado: "Proyectadas", desconocido: "Desconocidas" } as const;
  let summary = starting ? "Revisa las opciones para tu escenario y completa los datos cuando los conozcas."
    : current?.declaredRegime === "SIN_REGIMEN"
    ? "Indicaste que tu restaurante todavía no tiene un régimen. Revisa qué condiciones cumple según los datos que ingresaste."
    : "Puedes revisar las opciones con tus datos actuales. Si encuentras tu régimen en la ficha RUC, indícalo para evaluarlo directamente.";
  let next = { label: "Revisar opciones evaluadas", href: "#alternativas" };
  if (declared?.status === "COMPATIBLE") {
    summary = "Tu restaurante cumple las condiciones evaluadas de este régimen. Consulta qué debes declarar, qué documentos preparar y cuándo hacerlo.";
    next = { label: "Ver mis obligaciones", href: workspaceHref + "seccion=obligaciones" };
  } else if (declared?.status === "INCOMPATIBLE") {
    summary = declared.breachedConditions[0] ?? "Encontramos condiciones que tu restaurante no cumple para este régimen.";
    next = { label: "Ver alternativas", href: "#alternativas" };
  } else if (declared) {
    summary = declared.verification !== "VIGENTE" ? "La compatibilidad está pendiente de verificar la vigencia de la fuente."
      : declared.breachedConditions[0] ?? gap?.explanation ?? declared.missingDataFields[0] ?? "Con los datos disponibles, la compatibilidad sigue pendiente.";
    next = gap
      ? { label: "Completar " + assessmentFieldLabels[gap.field].toLowerCase(), href: assessmentEditHref(gap.field) }
      : { label: "Revisar condiciones pendientes", href: "#condiciones" };
  }

  return <div className="grid gap-6">
    <Card className="result-overview grid justify-items-start gap-3 p-5 sm:p-7">
      <p className="eyebrow">{starting ? "Etapa inicial" : declared ? "Régimen actual declarado" : "Régimen actual"}</p>
      <h2 className="editorial-title">{starting ? "Tu escenario antes de abrir" : current?.regimeName ?? "Régimen por confirmar"}</h2>
      {declared && <RegimeStatus status={declared.status} />}
      <p className="max-w-prose text-foreground">{summary}</p>
      <div className="mt-1 grid justify-items-start gap-2">
        <LinkButton href={next.href} onClick={gap ? prepareEdit : undefined}>{next.label} <ArrowRight aria-hidden="true" /></LinkButton>
        {!starting && context.hasRuc !== false && !declared && prepareEdit && <Link className="hero-secondary" href={assessmentEditHref("regime")} onClick={prepareEdit}>Indicar mi régimen</Link>}
      </div>
    </Card>

    {context.assessmentVersion === 3 && <Card className="grid gap-3 p-5 sm:p-6">
      <h2 className="text-lg font-bold">Actividad y origen de tus cifras</h2>
      {isCiiuCode(context.ciiu) ? <>
        <p><strong>{context.ciiu}</strong> · {ciiuCatalog[context.ciiu].name}</p>
        {(context.ciiuClassification?.secondary.length ?? 0) > 0 && <p className="text-sm">Actividades secundarias · {context.ciiuClassification?.secondary.join(", ")}</p>}
        <SourceLink href={CIIU_TABLE}>{context.ciiuClassification?.version ?? "Tabla CIIU Rev. 4"}</SourceLink>
      </> : <p>Clasificación pendiente. Puedes volver a indicar qué actividad aporta más a tu negocio.</p>}
      {context.financialOrigins && <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt>Ventas</dt><dd className="font-bold">{originLabels[context.financialOrigins.sales]}</dd></div>
        <div><dt>Compras</dt><dd className="font-bold">{originLabels[context.financialOrigins.purchases]}</dd></div>
      </dl>}
    </Card>}
    {declared && <section id="condiciones" tabIndex={-1} className="flow-anchor grid gap-3">
      <h2 className="editorial-title">Condiciones de tu régimen actual</h2>
      <div className="grid gap-3">
        <RegimeReasons regime={declared} />
        <RuleDetails regime={declared} />
      </div>
    </section>}

    <section id="alternativas" tabIndex={-1} className="flow-anchor grid gap-4">
      <div>
        <h2 className="editorial-title">{declared ? "Alternativas evaluadas" : "Opciones evaluadas"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Consulta las condiciones de cada régimen antes de decidir si corresponde cambiar o inscribirte.</p>
      </div>
      {alternativeGroups.map(({ status, title }) => {
        const items = alternatives.filter((item) => item.status === status);
        if (!items.length) return null;
        return <div className="grid gap-2.5" key={status}>
          <h3 className="font-bold">{title}</h3>
          <div>{items.map((regime) => <RegimeResult key={regime.code} regime={regime} />)}</div>
        </div>;
      })}
    </section>

    <div className="border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">Evaluación del {current?.diagnosticDate} · Catálogo {ruleEngineVersion}</p>
      <div className="flex flex-wrap gap-x-5">
        <Link className="hero-secondary" href={workspaceHref + "seccion=ruta"}>Ver mi ruta de formalización</Link>
        <Link className="hero-secondary" href={workspaceHref + "seccion=reportes"}>Ver informe y guardar PDF</Link>
        <Link className="hero-secondary" href={workspaceHref + "seccion=simulador"}>Ir al simulador</Link>
        {prepareEdit && <Link className="hero-secondary" href={assessmentEditHref()} onClick={prepareEdit}>Revisar mis datos</Link>}
      </div>
    </div>
  </div>;
}

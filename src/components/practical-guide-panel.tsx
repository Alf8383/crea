import Link from "next/link";
import { getTaxPath, practicalGuides } from "@/lib/practical-guides";
import { activities, sourceById } from "@/lib/seed-catalog";
import type { BusinessContext } from "@/lib/types";

export function PracticalGuidePanel({
  requirementId,
  context,
}: {
  requirementId: string;
  context: BusinessContext;
}) {
  const guide = practicalGuides[requirementId];
  if (!guide) return null;
  const source = sourceById(guide.sourceId);
  const isMunicipal = requirementId === "license";

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3.5 py-2 text-xs">
        <span className="font-extrabold text-blue-800">
          {guide.areaLabel} ({guide.objectiveCode})
        </span>
        <span className="font-semibold text-slate-600">{guide.title}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Dónde realizarlo / consultar
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-700">{guide.where}</p>
          {isMunicipal && (
            <p className="mt-1.5 text-xs font-bold text-slate-900">
              📍{" "}
              {[context.district, context.province, context.department]
                .filter(Boolean)
                .join(", ") || "Cajamarca, Perú"}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Qué verificar para tu restaurante
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-700">{guide.askFor}</p>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Pasos recomendados
          </h4>
          <ol className="mt-2 space-y-1.5">
            {guide.steps.map((step, index) => (
              <li
                key={step}
                className="flex gap-2 text-xs leading-5 text-slate-700"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-extrabold text-blue-600">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-3.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              Documentos e información a preparar
            </h4>
            <ul className="mt-1.5 space-y-1">
              {guide.prepare.map((item) => (
                <li
                  key={item}
                  className="flex gap-1.5 text-xs leading-5 text-slate-700"
                >
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              Ejemplo aplicado a restaurantes en Cajamarca
            </h4>
            <p className="mt-1 text-xs leading-5 text-amber-950">
              {guide.restaurantExample}
            </p>
          </section>
        </div>
      </div>

      {source && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Ver fuente oficial verificada ({source.institution} · v
            {source.version || "2026.1"}) ↗
          </a>
          <span className="text-[11px] text-slate-500">
            Base legal: {source.legalBasis} · Revisado: {source.reviewedAt}
          </span>
        </div>
      )}
    </div>
  );
}

export function BusinessSetupAdvicePanel({
  context,
}: {
  context: BusinessContext;
}) {
  const activity = activities.find((item) => item.id === context.activityId);
  const ciiu = activity
    ? `${activity.ciiu} · ${activity.name}`
    : `${context.ciiu || "5610"} · Actividades de restaurantes y de servicio móvil de comidas`;

  const isJuridica =
    context.personType === "PERSONA_JURIDICA" ||
    context.legalPerson === "juridica";
  const legalAdvice = isJuridica
    ? "Persona Jurídica (RUC 20): Habilitada para RER, RMT y Régimen General. Excluida legalmente del Nuevo RUS."
    : "Persona Natural con Negocio (RUC 10): Habilitada para Nuevo RUS (si cumple topes y no emite factura), RER, RMT y Régimen General.";

  const rucAdvice = context.ruc
    ? `RUC registrado: ${context.ruc} (Último dígito «${context.ruc.replace(/\D/g, "").slice(-1)}» para cronograma oficial de SUNAT).`
    : "Registra los 11 dígitos del RUC de tu restaurante en «Mi restaurante» para personalizar el calendario de vencimientos.";

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          1. Actividad gastronómica (CIIU)
        </span>
        <p className="mt-1 text-sm font-extrabold text-slate-900">{ciiu}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Establecimiento:{" "}
          {context.businessName || "Restaurante formalizado en Cajamarca"}.
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          2. Tipo de contribuyente
        </span>
        <p className="mt-1 text-xs leading-5 text-slate-700">{legalAdvice}</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
          3. Identificación RUC y Cronograma
        </span>
        <p className="mt-1 text-xs leading-5 text-slate-700">{rucAdvice}</p>
      </article>
    </div>
  );
}

export function TaxPathPanel({
  context,
  onExplore,
}: {
  context: BusinessContext;
  onExplore?: () => void;
}) {
  const advice = getTaxPath(context);

  const taxItems = [
    {
      key: "ruc",
      label: "RUC y régimen actual",
      done: Boolean(context.ruc && context.currentRegime),
    },
    {
      key: "sales",
      label: "Ventas mensuales y anuales",
      done:
        context.monthlyRevenue !== undefined ||
        context.annualRevenue !== undefined,
    },
    {
      key: "purchases",
      label: "Compras mensuales de insumos",
      done: context.monthlyPurchases !== undefined,
    },
    {
      key: "assets",
      label: "Activos fijos de cocina y salón",
      done:
        context.fixedAssetsValue !== undefined ||
        context.fixedAssets !== undefined,
    },
    {
      key: "employees",
      label: "Trabajadores por turno",
      done:
        context.employees !== undefined ||
        context.employeeCountPerShift !== undefined,
    },
  ];

  const missingItems = taxItems.filter((item) => !item.done);

  return (
    <section
      className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs"
      aria-labelledby="tax-path-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Resumen del motor de reglas para restaurantes
          </span>
          <h2
            id="tax-path-title"
            className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl"
          >
            {advice.title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {advice.reason}
          </p>
        </div>
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-bold " +
            (advice.status === "PRESELECCION"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800")
          }
        >
          {advice.status === "PRESELECCION"
            ? "Datos completos verificados"
            : `Faltan ${missingItems.length} datos obligatorios`}
        </span>
      </div>

      {advice.status === "PRESELECCION" ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {advice.checks.map((check) => (
            <div
              key={check}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-5 text-slate-700"
            >
              <span className="mr-1.5 font-extrabold text-blue-600">✓</span>
              {check}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
          <p className="text-xs font-bold text-amber-900">
            Completa estos datos en «Mi restaurante» para evaluar todos los
            regímenes sin información insuficiente:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {missingItems.map((item) => (
              <Link
                key={item.key}
                href="/negocios/nuevo"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:border-blue-400 hover:text-blue-600"
              >
                + {item.label} →
              </Link>
            ))}
          </div>
        </div>
      )}

      {onExplore && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onExplore}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
          >
            Ir al comparador y simulador →
          </button>
        </div>
      )}
    </section>
  );
}

export function LegalFormRecommendationPanel({
  context,
}: {
  context: BusinessContext;
}) {
  const isJuridica =
    context.personType === "PERSONA_JURIDICA" ||
    context.legalPerson === "juridica";
  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-slate-700">
      <b className="text-slate-900">Condición de contribuyente del restaurante:</b>{" "}
      {isJuridica
        ? "Tu restaurante está registrado como Persona Jurídica (RUC 20). Recuerda que las personas jurídicas no pueden acogerse al Nuevo RUS; tributan en RER, RMT o Régimen General."
        : "Tu restaurante opera como Persona Natural con Negocio (RUC 10). Puedes tributar en NRUS, RER, RMT o RG siempre que cumplas los límites de cada régimen."}
    </div>
  );
}

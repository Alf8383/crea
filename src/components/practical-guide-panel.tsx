import Link from "next/link";
import { getTaxPath, practicalGuides } from "@/lib/practical-guides";
import { activities, sourceById } from "@/lib/seed-catalog";
import type { BusinessContext } from "@/lib/types";

export function PracticalGuidePanel({ requirementId, context }: { requirementId: string; context: BusinessContext }) {
  const guide = practicalGuides[requirementId];
  if (!guide) return null;
  const source = sourceById(guide.sourceId);
  const isMunicipal = requirementId === "license" || requirementId === "itse";

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Dónde realizarlo</h4>
          <p className="mt-1 text-xs leading-5 text-slate-700">{guide.where}</p>
          {isMunicipal && (
            <p className="mt-1.5 text-xs font-bold text-slate-900">
              📍 {[context.district, context.province, context.department].filter(Boolean).join(", ") || "Ubicación no indicada"}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Qué solicitar</h4>
          <p className="mt-1 text-xs leading-5 text-slate-700">{guide.askFor}</p>
        </section>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-3.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Pasos clave</h4>
          <ol className="mt-2 space-y-1.5">
            {guide.steps.map((step, index) => (
              <li key={step} className="flex gap-2 text-xs leading-5 text-slate-700">
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
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Qué tener listo</h4>
            <ul className="mt-1.5 space-y-1">
              {guide.prepare.map((item) => (
                <li key={item} className="flex gap-1.5 text-xs leading-5 text-slate-700">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">Costo / tasa referencial</h4>
            <p className="mt-1 text-xs leading-5 text-amber-950">{guide.cost}</p>
          </section>
        </div>
      </div>

      {source && (
        <div>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Ir al portal oficial de {source.institution} ↗
          </a>
        </div>
      )}
    </div>
  );
}

export function BusinessSetupAdvicePanel({ context }: { context: BusinessContext }) {
  const description = `${context.businessName} ${context.otherActivity}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
  const isTourism = context.sectorId === "turismo";
  const doesBothTourism = isTourism && /ambos|agencia.*tour|tour.*agencia/.test(description);
  const activity = activities.find((item) => item.id === context.activityId);
  const ciiu = isTourism
    ? doesBothTourism
      ? "7911 y 7912"
      : activity?.ciiu === "7912"
      ? "7912"
      : activity?.ciiu === "7911"
      ? "7911"
      : "7911 o 7912"
    : activity && activity.ciiu !== "0000"
    ? `${activity.ciiu} · ${activity.name}`
    : "Por confirmar según giro";

  const legalChoice = context.legalPerson;
  const legalAdvice =
    legalChoice === "natural"
      ? "Persona natural con negocio: inscripción directa de RUC 10 sin gastos notariales; respondes con tu patrimonio personal."
      : legalChoice === "juridica"
      ? "Persona jurídica: requiere constitución en SID-SUNARP + Notaría antes de activar el RUC 20 en SUNAT."
      : "Compara Persona Natural (más simple y rápida) frente a Persona Jurídica (separa patrimonio y permite socios).";

  const alreadyHasRuc = context.questionnaire?.P32 === "Sí";
  const rucAdvice = alreadyHasRuc
    ? "Ya cuentas con RUC: verifica en SUNAT Operaciones en Línea que esté habido/activo y con el CIIU actualizado."
    : "Tramita tu RUC antes de iniciar ventas. Con DNI puedes hacerlo desde la App Personas SUNAT o SUNAT Virtual.";

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">1. Código CIIU referencial</span>
        <p className="mt-1 text-sm font-extrabold text-slate-900">{ciiu}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Sugerido según la actividad declarada («{context.otherActivity || context.businessName}»).
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">2. Personería legal</span>
        <p className="mt-1 text-xs leading-5 text-slate-700">{legalAdvice}</p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">3. Inscripción RUC</span>
        <p className="mt-1 text-xs leading-5 text-slate-700">{rucAdvice}</p>
      </article>
    </div>
  );
}

export function TaxPathPanel({ context, onExplore }: { context: BusinessContext; onExplore?: () => void }) {
  const advice = getTaxPath(context);
  const q = context.questionnaire;
  const answer = (key: string) => String(q?.[key] || "").trim();
  const salesAnswer = answer("P20");

  const taxItems = [
    { key: "P02", label: "Actividad principal", done: Boolean(answer("P02") || answer("P01.1")) },
    {
      key: "P09",
      label: "Personería legal",
      done: Boolean(answer("P07") && answer("P09") && answer("P09") !== "Todavía no lo sé"),
    },
    { key: "P20", label: "Ventas mensuales en S/", done: salesAnswer.startsWith("monto:") },
    {
      key: "P23",
      label: "Tipo de clientes y facturas",
      done: Boolean(answer("P22") && answer("P23") && !answer("P23").startsWith("No lo sé")),
    },
    { key: "TAX_PURCHASES", label: "Compras mensuales", done: Boolean(answer("TAX_PURCHASES")) },
    { key: "TAX_ASSETS", label: "Valor de activos fijos", done: Boolean(answer("TAX_ASSETS")) },
    {
      key: "P28",
      label: "Trabajadores por turno",
      done: answer("P28") === "No" || (answer("P28") === "Sí" && Boolean(answer("P29")) && Boolean(answer("P29.1"))),
    },
  ];

  const missingItems = taxItems.filter((item) => !item.done);

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs" aria-labelledby="tax-path-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Preselección del motor de reglas</span>
          <h2 id="tax-path-title" className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            {advice.title}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">{advice.reason}</p>
        </div>
        <span
          className={
            "rounded-full px-3 py-1 text-xs font-bold " +
            (advice.status === "PRESELECCION" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")
          }
        >
          {advice.status === "PRESELECCION" ? "Preselección completa" : `Faltan ${missingItems.length} datos`}
        </span>
      </div>

      {advice.status === "PRESELECCION" ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {advice.checks.map((check) => (
            <div key={check} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-5 text-slate-700">
              <span className="mr-1.5 font-extrabold text-blue-600">✓</span>
              {check}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
          <p className="text-xs font-bold text-amber-900">
            Completa estos datos en el cuestionario para obtener una preselección exacta:
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {missingItems.map((item) => (
              <Link
                key={item.key}
                href={`/negocios/nuevo?continuar=${item.key}`}
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
            Comparar los 4 regímenes →
          </button>
        </div>
      )}
    </section>
  );
}

export function LegalFormRecommendationPanel({ context }: { context: BusinessContext }) {
  const hasCoOwners = context.hasPartners || context.partnerCount > 1;
  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-5 text-slate-700">
      <b className="text-slate-900">Recomendación de personería:</b>{" "}
      {hasCoOwners
        ? "Al contar con más de un propietario, evalúa constituir una Persona Jurídica (S.R.L. o S.A.C.) en SUNARP."
        : "Si inicias de forma individual, compara Persona Natural con Negocio (trámite inmediato) frente a una E.I.R.L. (patrimonio separado)."}
    </div>
  );
}

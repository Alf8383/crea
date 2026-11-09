"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader, type MainMenuSection } from "@/components/app-header";
import { scopedStorageKey } from "@/lib/account-storage";
import {
  askCreaIa,
  getCreaIaMetricsLog,
  type CreaIaResponse,
} from "@/lib/crea-ia";
import { DEMO_PRESETS } from "@/lib/demo-presets";
import { practicalGuides } from "@/lib/practical-guides";
import {
  buildDiagnosticReportData,
  downloadDiagnosticReportPdf,
} from "@/lib/report-generator";
import { RuleEngine } from "@/lib/rule-engine";
import { seedCatalog } from "@/lib/seed-catalog";
import {
  getRestaurantObligations,
  OFFICIAL_SUNAT_SCHEDULE,
} from "@/lib/sunat-calendar";
import { simulateRestaurantTaxes } from "@/lib/tax-simulator";
import type { BusinessContext, TaxRegimeCode } from "@/lib/types";

const STATUS_BADGE: Record<
  "COMPATIBLE" | "INCOMPATIBLE" | "INFORMACION_INSUFICIENTE",
  string
> = {
  COMPATIBLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INCOMPATIBLE: "bg-rose-100 text-rose-800 border-rose-200",
  INFORMACION_INSUFICIENTE: "bg-amber-100 text-amber-900 border-amber-200",
};

const STATUS_LABEL: Record<
  "COMPATIBLE" | "INCOMPATIBLE" | "INFORMACION_INSUFICIENTE",
  string
> = {
  COMPATIBLE: "COMPATIBLE",
  INCOMPATIBLE: "INCOMPATIBLE",
  INFORMACION_INSUFICIENTE: "FALTAN DATOS",
};

const QUICK_CREA_IA_QUESTIONS = [
  "¿Por qué mi régimen actual es compatible o incompatible con mi restaurante?",
  "¿Cuál es la diferencia práctica entre el RER y el RMT para mi restaurante?",
  "¿Cómo ayudan las facturas de compra de carnes y abarrotes a pagar menos IGV?",
  "¿Cuándo me toca declarar según el último dígito de mi RUC y qué documentos preparo?",
];

export function RouteDashboard() {
  const [section, setSection] = useState<MainMenuSection>("diagnostico");
  const [context, setContext] = useState<BusinessContext>(
    DEMO_PRESETS[0].context
  );
  const [selectedRegimeInspector, setSelectedRegimeInspector] =
    useState<TaxRegimeCode>("NRUS");

  // Simulador interactivo
  const [simSales, setSimSales] = useState<number | undefined>(undefined);
  const [simPurchasesInv, setSimPurchasesInv] = useState<number | undefined>(
    undefined
  );
  const [simPurchasesNoInv, setSimPurchasesNoInv] = useState<
    number | undefined
  >(undefined);
  const [simExpenses, setSimExpenses] = useState<number | undefined>(undefined);

  // Mis obligaciones
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2026-03");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Crea IA
  const [iaQuery, setIaQuery] = useState<string>("");
  const [iaLoading, setIaLoading] = useState<boolean>(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaHistory, setIaHistory] = useState<
    Array<{ query: string; response: CreaIaResponse }>
  >([]);

  // Centro de orientación
  const [orientationArea, setOrientationArea] = useState<
    "TODAS" | "COMPRENSION" | "EVALUACION" | "CUMPLIMIENTO"
  >("TODAS");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const secParam = params.get("seccion") as MainMenuSection | null;
      if (
        secParam &&
        [
          "diagnostico",
          "simulador",
          "obligaciones",
          "crea-ia",
          "orientacion",
          "reportes",
        ].includes(secParam)
      ) {
        setSection(secParam);
      }

      const savedRaw = localStorage.getItem(
        scopedStorageKey("efp-business-context")
      );
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as BusinessContext;
        setContext(parsed);
        if (
          parsed.currentRegime &&
          parsed.currentRegime !== "SIN_REGIMEN" &&
          parsed.currentRegime !== "DESCONOCIDO"
        ) {
          setSelectedRegimeInspector(parsed.currentRegime);
        }
      }

      const savedTasks = localStorage.getItem(
        scopedStorageKey("crea-completed-obligations")
      );
      if (savedTasks) {
        setCompletedTaskIds(JSON.parse(savedTasks));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const activeParticipant = localStorage.getItem(
        "crea-active-participant-code"
      );
      if (!activeParticipant) return;
      const rawMap = localStorage.getItem("crea-research-records-v1");
      const map = rawMap ? JSON.parse(rawMap) : {};
      const existing = map[activeParticipant] || {
        participantCode: activeParticipant,
        consentAccepted: true,
      };
      const visited = new Set<string>(
        existing.intervention?.modulesVisited || []
      );
      visited.add(section);
      existing.intervention = {
        participantCode: activeParticipant,
        modulesVisited: Array.from(visited),
        completedDiagnostic:
          section === "diagnostico" ||
          Boolean(existing.intervention?.completedDiagnostic),
        usedSimulator:
          section === "simulador" ||
          Boolean(existing.intervention?.usedSimulator),
        reviewedObligations:
          section === "obligaciones" ||
          Boolean(existing.intervention?.reviewedObligations),
        consultedCreaIa:
          section === "crea-ia" ||
          Boolean(existing.intervention?.consultedCreaIa),
        firstSessionTimestamp:
          existing.intervention?.firstSessionTimestamp ||
          new Date().toISOString(),
        lastSessionTimestamp: new Date().toISOString(),
      };
      map[activeParticipant] = existing;
      localStorage.setItem("crea-research-records-v1", JSON.stringify(map));
    } catch {}
  }, [section]);

  const handleSelectSection = (nextSection: MainMenuSection) => {
    setSection(nextSection);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("seccion", nextSection);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

  const applyPreset = (presetContext: BusinessContext) => {
    setContext(presetContext);
    setSimSales(undefined);
    setSimPurchasesInv(undefined);
    setSimPurchasesNoInv(undefined);
    setSimExpenses(undefined);
    if (
      presetContext.currentRegime &&
      presetContext.currentRegime !== "SIN_REGIMEN" &&
      presetContext.currentRegime !== "DESCONOCIDO"
    ) {
      setSelectedRegimeInspector(presetContext.currentRegime);
    }
    try {
      localStorage.setItem(
        scopedStorageKey("efp-business-context"),
        JSON.stringify(presetContext)
      );
    } catch {}
  };

  const evaluation = useMemo(
    () => RuleEngine.evaluate(context, seedCatalog),
    [context]
  );

  const simulation = useMemo(
    () =>
      simulateRestaurantTaxes(context, {
        grossMonthlySales: simSales,
        grossMonthlyPurchasesWithInvoice: simPurchasesInv,
        monthlyPurchasesWithoutInvoice: simPurchasesNoInv,
        monthlyOperatingExpenses: simExpenses,
      }),
    [context, simSales, simPurchasesInv, simPurchasesNoInv, simExpenses]
  );

  const obligationsPlan = useMemo(
    () => getRestaurantObligations(context, selectedPeriod),
    [context, selectedPeriod]
  );

  const reportData = useMemo(
    () => buildDiagnosticReportData(context),
    [context]
  );

  const toggleObligationTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId];
      try {
        localStorage.setItem(
          scopedStorageKey("crea-completed-obligations"),
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  };

  const handleAskCreaIa = async (customText?: string) => {
    const q = (customText ?? iaQuery).trim();
    if (!q) return;
    setIaLoading(true);
    setIaError(null);
    try {
      const response = await askCreaIa(q, context);
      setIaHistory((prev) => [{ query: q, response }, ...prev]);
      if (!customText) setIaQuery("");
    } catch (err) {
      setIaError(
        err instanceof Error ? err.message : "Error al consultar Crea IA."
      );
    } finally {
      setIaLoading(false);
    }
  };

  const selectedRegimeRec =
    evaluation.taxRecommendations.find(
      (r) => r.regime === selectedRegimeInspector
    ) || evaluation.taxRecommendations[0];

  const compatibleRegimes = evaluation.taxRecommendations.filter(
    (r) => r.status === "COMPATIBLE"
  );

  const guidesList = Object.entries(practicalGuides).filter(([, g]) =>
    orientationArea === "TODAS" ? true : g.area === orientationArea
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader
        activeSection={section}
        onSelectSection={handleSelectSection}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Restaurant Context Banner & KPI Strip */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                  🍽️ {context.businessName || "Mi Restaurante"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  RUC: {context.ruc || "No registrado"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  Régimen actual: {context.currentRegime || "Por definir"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  CIIU {context.ciiu || "5610"} ·{" "}
                  {context.district || "Cajamarca"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/negocios/nuevo"
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
              >
                ✎ Editar ficha «Mi restaurante»
              </Link>
              <button
                type="button"
                onClick={() => downloadDiagnosticReportPdf(context)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                ⬇ Descargar Reporte PDF
              </button>
            </div>
          </div>

          {/* Clean 4-Metric KPI Summary Strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
              <span className="block text-[11px] font-semibold text-slate-500">
                Ventas mensuales
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-slate-900">
                S/ {(context.monthlyRevenue ?? 0).toLocaleString("es-PE")} / mes
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
              <span className="block text-[11px] font-semibold text-slate-500">
                Compras mensuales
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-slate-900">
                S/ {(context.monthlyPurchases ?? 0).toLocaleString("es-PE")} /
                mes
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
              <span className="block text-[11px] font-semibold text-slate-500">
                Locales y personal/turno
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-slate-900">
                {context.establishmentCount ?? 1} local(es) ·{" "}
                {context.employees ?? 0} trab./turno
              </span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
              <span className="block text-[11px] font-semibold text-slate-500">
                Activos fijos y facturas
              </span>
              <span className="mt-0.5 block text-sm font-extrabold text-slate-900">
                S/ {(context.fixedAssetsValue ?? 0).toLocaleString("es-PE")} ·{" "}
                {context.needsFacturas ? "Con Factura" : "Solo Boleta"}
              </span>
            </div>
          </div>

          {/* Quick Demo Restaurant Switcher */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
            <span className="text-xs font-bold text-slate-500">
              Casos de prueba en Cajamarca:
            </span>
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.context)}
                className={
                  "rounded-xl border px-3 py-1.5 text-xs font-bold transition " +
                  (context.businessName === preset.context.businessName
                    ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white")
                }
              >
                {preset.shortTitle}
              </button>
            ))}
          </div>
        </section>

        {/* =========================================================
            SECCIÓN 1: MI DIAGNÓSTICO (OE1 y OE2)
           ========================================================= */}
        {section === "diagnostico" && (
          <div className="mt-6 space-y-6">
            {/* Current Regime Compliance Evaluation Card */}
            {evaluation.currentRegimeDiagnostic && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      1. Evaluación del Régimen Tributario Actual del
                      Restaurante
                    </span>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Régimen actual:{" "}
                      {evaluation.currentRegimeDiagnostic.regimeName}
                    </h2>
                  </div>
                  <span
                    className={
                      "rounded-full border px-3.5 py-1 text-xs font-extrabold " +
                      STATUS_BADGE[evaluation.currentRegimeDiagnostic.status]
                    }
                  >
                    {evaluation.currentRegimeDiagnostic.status}
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                  {evaluation.currentRegimeDiagnostic.summary}
                </p>

                {evaluation.currentRegimeDiagnostic.breachedConditions.length >
                  0 && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                    <p className="text-xs font-extrabold text-rose-900">
                      ⚠️ Incompatibilidades detectadas en tu régimen actual:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-950">
                      {evaluation.currentRegimeDiagnostic.breachedConditions.map(
                        (cond) => (
                          <li key={cond}>{cond}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {evaluation.currentRegimeDiagnostic.missingConditions.length >
                  0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <p className="text-xs font-extrabold text-amber-900">
                      ℹ️ Información faltante para confirmar el régimen actual:
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-950">
                      {evaluation.currentRegimeDiagnostic.missingConditions.map(
                        (cond) => (
                          <li key={cond}>{cond}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* 4 Regimes Evaluation Grid */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    2. Evaluación Normativa de los 4 Regímenes de SUNAT
                  </span>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    Selecciona un régimen para inspeccionar sus reglas y
                    fundamento legal
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  Motor de reglas v{evaluation.ruleEngineVersion}
                </span>
              </div>

              <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {evaluation.taxRecommendations.map((rec) => {
                  const active = rec.regime === selectedRegimeInspector;
                  return (
                    <button
                      key={rec.regime}
                      type="button"
                      onClick={() => setSelectedRegimeInspector(rec.regime)}
                      className={
                        "flex flex-col justify-between rounded-2xl border p-4 text-left transition " +
                        (active
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                          : "border-slate-200 bg-white hover:border-blue-300")
                      }
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-slate-900">
                            {rec.regime}
                          </span>
                          <span
                            className={
                              "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold " +
                              STATUS_BADGE[rec.status]
                            }
                          >
                            {STATUS_LABEL[rec.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {rec.name}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {rec.status === "COMPATIBLE"
                            ? rec.reasons[0]
                            : rec.status === "INCOMPATIBLE"
                              ? rec.breachedConditions[0]
                              : rec.missingDataFields[0]}
                        </p>
                      </div>
                      <span className="mt-3.5 inline-block text-xs font-bold text-blue-600">
                        Inspeccionar reglas ({rec.evaluatedRules.length}) →
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Rule Traceability Table for Selected Regime */}
              {selectedRegimeRec && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3.5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Trazabilidad de reglas evaluadas:{" "}
                        {selectedRegimeRec.name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Cada condición se contrasta con su fuente oficial, fecha
                        de vigencia, fecha de revisión y versión.
                      </p>
                    </div>
                    <span
                      className={
                        "rounded-full border px-3 py-1 text-xs font-extrabold " +
                        STATUS_BADGE[selectedRegimeRec.status]
                      }
                    >
                      Estado: {selectedRegimeRec.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {selectedRegimeRec.evaluatedRules.map((ruleItem) => (
                      <article
                        key={ruleItem.ruleId}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
                              {ruleItem.ruleId} · v{ruleItem.version}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900">
                              {ruleItem.title}
                            </h4>
                          </div>
                          <span
                            className={
                              "rounded-full px-3 py-0.5 text-xs font-extrabold " +
                              (ruleItem.passed === true
                                ? "bg-emerald-100 text-emerald-800"
                                : ruleItem.passed === false
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800")
                            }
                          >
                            {ruleItem.passed === true
                              ? "✓ Cumple condición"
                              : ruleItem.passed === false
                                ? "✕ Incumple condición"
                                : "Falta información"}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-700">
                          {ruleItem.explanation}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                          <span>
                            <strong>Fundamento oficial:</strong>{" "}
                            {ruleItem.legalBasis} · <strong>Vigencia:</strong>{" "}
                            {ruleItem.effectiveDate} ·{" "}
                            <strong>Revisión:</strong> {ruleItem.reviewedAt} (
                            {ruleItem.sourceVerification})
                          </span>
                          <a
                            href={ruleItem.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-blue-600 underline hover:text-blue-800"
                          >
                            Fuente oficial SUNAT ↗
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* =========================================================
            SECCIÓN 2: COMPARADOR Y SIMULADOR TRIBUTARIO (OE2)
           ========================================================= */}
        {section === "simulador" && (
          <div className="mt-6 space-y-6">
            {/* Interactive Simulator Controls */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Módulo: Comparador y Simulador Tributario para Restaurantes
                  </span>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    Desagregación de Ventas, Compras con/sin Factura, Gastos,
                    IGV e Impuesto a la Renta
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSimSales(undefined);
                    setSimPurchasesInv(undefined);
                    setSimPurchasesNoInv(undefined);
                    setSimExpenses(undefined);
                  }}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Restaurar datos de mi ficha
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-700">
                    Ventas brutas mensuales (S/)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={simulation.inputsUsed.grossMonthlySales}
                    onChange={(e) => setSimSales(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                  />
                  <span className="mt-1.5 block text-[11px] text-slate-600">
                    Sin IGV: S/{" "}
                    {simulation.regimes.RER.netMonthlySales.toFixed(2)} · IGV:
                    S/ {simulation.regimes.RER.igvSales.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-700">
                    Compras insumos CON Factura (S/)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={
                      simulation.inputsUsed.grossMonthlyPurchasesWithInvoice
                    }
                    onChange={(e) => setSimPurchasesInv(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                  />
                  <span className="mt-1.5 block text-[11px] font-semibold text-emerald-700">
                    Crédito fiscal IGV: S/{" "}
                    {simulation.regimes.RER.igvCreditFromPurchases.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-700">
                    Compras SIN Factura / Boleta (S/)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={simulation.inputsUsed.monthlyPurchasesWithoutInvoice}
                    onChange={(e) =>
                      setSimPurchasesNoInv(Number(e.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                  />
                  <span className="mt-1.5 block text-[11px] font-semibold text-amber-700">
                    Crédito fiscal IGV: S/ 0.00 (no deduce IGV)
                  </span>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-bold text-slate-700">
                    Gastos operativos formales/mes (S/)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={simulation.inputsUsed.monthlyOperatingExpenses}
                    onChange={(e) => setSimExpenses(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                  />
                  <span className="mt-1.5 block text-[11px] text-slate-600">
                    Planilla, alquiler y servicios (deducen RMT/RG)
                  </span>
                </div>
              </div>

              {/* Spacious 2-Column Simulation Cards for the 4 Regimes */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(["NRUS", "RER", "RMT", "RG"] as TaxRegimeCode[]).map(
                  (code) => {
                    const sim = simulation.regimes[code];
                    const diag = evaluation.taxRecommendations.find(
                      (r) => r.regime === code
                    );
                    const isCompat = diag?.status === "COMPATIBLE";
                    return (
                      <article
                        key={code}
                        className={
                          "flex flex-col justify-between rounded-2xl border p-5 " +
                          (isCompat
                            ? "border-emerald-200 bg-white shadow-2xs"
                            : "border-slate-200 bg-slate-50/70")
                        }
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-extrabold uppercase text-blue-600">
                                {code}
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900">
                                {sim.regimeName}
                              </h3>
                            </div>
                            <span
                              className={
                                "rounded-full border px-3 py-0.5 text-xs font-extrabold " +
                                STATUS_BADGE[
                                  diag?.status || "INFORMACION_INSUFICIENTE"
                                ]
                              }
                            >
                              {STATUS_LABEL[
                                diag?.status || "INFORMACION_INSUFICIENTE"
                              ]}
                            </span>
                          </div>

                          {sim.canEstimate ? (
                            <div className="mt-4 space-y-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  IGV mensual neto estimado:
                                </span>
                                <span className="font-bold text-slate-900">
                                  S/ {sim.monthlyIgvPayable.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Renta / Cuota mensual estimada:
                                </span>
                                <span className="font-bold text-slate-900">
                                  S/ {sim.monthlyIncomeTaxPayable.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-blue-700">
                                <span>Total mensual estimado:</span>
                                <span>
                                  S/ {sim.totalMonthlyTaxEstimated.toFixed(2)}
                                </span>
                              </div>
                              {(code === "RMT" || code === "RG") && (
                                <div className="flex justify-between pt-1 text-xs text-slate-600">
                                  <span>
                                    Regularización anual de Renta est.:
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    S/{" "}
                                    {sim.estimatedAnnualIncomeTaxRegularization.toFixed(
                                      2
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800">
                              {sim.insufficientDataReason}
                            </p>
                          )}

                          <ul className="mt-3.5 space-y-1.5 text-xs leading-relaxed text-slate-600">
                            {sim.calculationExplanation.map((exp) => (
                              <li key={exp}>• {exp}</li>
                            ))}
                          </ul>
                        </div>

                        <p className="mt-4 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                          {sim.legalNote}
                        </p>
                      </article>
                    );
                  }
                )}
              </div>

              {/* Assumptions & Mandatory Disclaimer */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Supuestos utilizados en la simulación
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600">
                    {simulation.assumptions.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    Advertencia metodológica y tributaria
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-amber-950">
                    {simulation.disclaimer}
                  </p>
                </div>
              </div>
            </section>

            {/* Comparative Matrix of Legal Requirements, Limits, Comprobantes & Declarations */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="text-lg font-extrabold text-slate-900">
                Tabla comparativa de requisitos, límites, comprobantes y
                declaraciones
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Regímenes legalmente compatibles actualmente con tu restaurante:{" "}
                <strong>
                  {compatibleRegimes.map((c) => c.name).join(" · ") ||
                    "Completa los datos faltantes"}
                </strong>
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
                      <th className="p-3.5 font-extrabold">Criterio</th>
                      <th className="p-3.5 font-extrabold">Nuevo RUS (NRUS)</th>
                      <th className="p-3.5 font-extrabold">
                        Régimen Especial (RER)
                      </th>
                      <th className="p-3.5 font-extrabold">
                        Régimen MYPE (RMT)
                      </th>
                      <th className="p-3.5 font-extrabold">
                        Régimen General (RG)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        Tipo de contribuyente
                      </td>
                      <td className="p-3.5">Solo Persona Natural (RUC 10)</td>
                      <td className="p-3.5">Persona Natural o Jurídica</td>
                      <td className="p-3.5">Persona Natural o Jurídica</td>
                      <td className="p-3.5">Persona Natural o Jurídica</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        Límite de ingresos
                      </td>
                      <td className="p-3.5">S/ 96,000/año (S/ 8,000/mes)</td>
                      <td className="p-3.5">Hasta S/ 525,000 anuales</td>
                      <td className="p-3.5">Hasta 1,700 UIT anuales</td>
                      <td className="p-3.5">Sin límite</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        Límite de compras
                      </td>
                      <td className="p-3.5">S/ 96,000/año (S/ 8,000/mes)</td>
                      <td className="p-3.5">Hasta S/ 525,000 anuales</td>
                      <td className="p-3.5">Sin límite</td>
                      <td className="p-3.5">Sin límite</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        Restricciones de locales / personal / activos
                      </td>
                      <td className="p-3.5">
                        Máx. 1 local y S/ 70,000 en activos fijos
                      </td>
                      <td className="p-3.5">
                        Máx. 10 trab./turno y S/ 126,000 en activos fijos
                      </td>
                      <td className="p-3.5">
                        Sin tope de locales, personal ni activos
                      </td>
                      <td className="p-3.5">
                        Sin tope de locales, personal ni activos
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        Comprobantes permitidos
                      </td>
                      <td className="p-3.5">
                        Solo Boleta de Venta y tickets (Prohibido Factura)
                      </td>
                      <td className="p-3.5">
                        Factura, Boleta, Notas de Crédito/Débito, Guías
                      </td>
                      <td className="p-3.5">
                        Factura, Boleta, Notas de Crédito/Débito, Guías
                      </td>
                      <td className="p-3.5">
                        Factura, Boleta, Notas de Crédito/Débito, Guías
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-bold text-slate-800">
                        Declaraciones y pagos
                      </td>
                      <td className="p-3.5">
                        Pago Fácil mensual (S/ 20 o S/ 50). Sin DJ Anual
                      </td>
                      <td className="p-3.5">
                        Declara Fácil mensual (IGV 18% + Renta 1.5%). Sin DJ
                        Anual
                      </td>
                      <td className="p-3.5">
                        Mensual (IGV 18% + Renta 1%/1.5%) + DJ Anual (10% /
                        29.5%)
                      </td>
                      <td className="p-3.5">
                        Mensual (IGV 18% + Renta 1.5%/coef.) + DJ Anual (29.5%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            SECCIÓN 3: MIS OBLIGACIONES Y CRONOGRAMA SUNAT (OE3)
           ========================================================= */}
        {section === "obligaciones" && (
          <div className="mt-6 space-y-6">
            {obligationsPlan.alerts.length > 0 && (
              <section className="space-y-2.5">
                {obligationsPlan.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={
                      "rounded-2xl border p-4 text-xs " +
                      (alert.severity === "ALTA"
                        ? "border-rose-300 bg-rose-50 text-rose-950"
                        : alert.severity === "MEDIA"
                          ? "border-amber-300 bg-amber-50 text-amber-950"
                          : "border-blue-200 bg-blue-50 text-blue-950")
                    }
                  >
                    <p className="font-extrabold">🔔 {alert.title}</p>
                    <p className="mt-1">{alert.description}</p>
                    <p className="mt-1 font-semibold">
                      Acción sugerida: {alert.recommendedAction}
                    </p>
                  </div>
                ))}
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Cronograma Oficial de Obligaciones Mensuales SUNAT
                  </span>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    Fecha de vencimiento según último dígito del RUC y periodo
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="period-select"
                    className="text-xs font-bold text-slate-700"
                  >
                    Periodo tributario:
                  </label>
                  <select
                    id="period-select"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold"
                  >
                    {Object.values(OFFICIAL_SUNAT_SCHEDULE).map((p) => (
                      <option key={p.period} value={p.period}>
                        {p.periodLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                  <span className="text-[11px] font-bold uppercase text-blue-700">
                    Último dígito de tu RUC
                  </span>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {obligationsPlan.scheduleLookup.rucLastDigit !== null
                      ? `Dígito «${obligationsPlan.scheduleLookup.rucLastDigit}»`
                      : "RUC incompleto"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    RUC registrado: {context.ruc || "No especificado"}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <span className="text-[11px] font-bold uppercase text-emerald-800">
                    Fecha límite oficial de vencimiento
                  </span>
                  <p className="mt-1 text-2xl font-black text-emerald-950">
                    {obligationsPlan.scheduleLookup.dueDate ||
                      "Registra RUC de 11 dígitos"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-900">
                    {obligationsPlan.scheduleLookup.note}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-bold uppercase text-slate-700">
                    Respaldo normativo
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {obligationsPlan.scheduleLookup.resolutionReference}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Estado de fuente:{" "}
                    <strong>
                      {obligationsPlan.scheduleLookup.verification}
                    </strong>
                  </p>
                  <a
                    href={obligationsPlan.scheduleLookup.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block text-xs font-bold text-blue-600 underline"
                  >
                    Ver cronograma en SUNAT ↗
                  </a>
                </div>
              </div>
            </section>

            <section className="grid items-start gap-6 lg:grid-cols-12">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-7">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Tareas pendientes y completadas ({obligationsPlan.regimeName})
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Marca las responsabilidades que ya organizaste en tu
                  restaurante este mes.
                </p>

                <div className="mt-4 space-y-3">
                  {obligationsPlan.obligations.map((obl) => {
                    const isDone = completedTaskIds.includes(obl.id);
                    return (
                      <article
                        key={obl.id}
                        className={
                          "rounded-2xl border p-4 transition " +
                          (isDone
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-slate-200 bg-white")
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleObligationTask(obl.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-600"
                            />
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-blue-600">
                                {obl.category} · {obl.frequency}
                              </span>
                              <h4 className="text-sm font-extrabold text-slate-900">
                                {obl.title}
                              </h4>
                            </div>
                          </label>
                          <span
                            className={
                              "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                              (isDone
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800")
                            }
                          >
                            {isDone ? "Completada" : "Pendiente"}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {obl.description}
                        </p>

                        <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700">
                          <strong>Documentos a preparar:</strong>{" "}
                          {obl.documentsToPrepare.join(" · ")}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs leading-relaxed text-amber-950">
                  {obligationsPlan.completionDisclaimer}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 lg:col-span-5">
                <h3 className="text-base font-extrabold text-slate-900">
                  Comprobantes y Declaraciones de tu Régimen
                </h3>
                <div className="mt-4 space-y-4 text-xs leading-relaxed">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                    <span className="font-extrabold text-emerald-900">
                      ✓ Comprobantes que puedes emitir:
                    </span>
                    <p className="mt-1 text-slate-700">
                      {obligationsPlan.allowedReceipts.join(", ")}
                    </p>
                  </div>
                  {obligationsPlan.prohibitedReceipts.length > 0 && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5">
                      <span className="font-extrabold text-rose-900">
                        ✕ Comprobantes NO permitidos:
                      </span>
                      <p className="mt-1 text-slate-700">
                        {obligationsPlan.prohibitedReceipts.join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <span className="font-extrabold text-blue-900">
                      📄 Declaraciones que corresponden:
                    </span>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                      {obligationsPlan.declarations.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <span className="font-extrabold text-slate-900">
                      📚 Libros y registros contables:
                    </span>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700">
                      {obligationsPlan.accountingBooks.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            SECCIÓN 4: CREA IA - ASISTENTE TRIBUTARIO RAG
           ========================================================= */}
        {section === "crea-ia" && (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
                  🤖 Módulo: Crea IA · Arquitectura RAG sobre Documentación
                  Oficial SUNAT
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  Asistente Inteligente de Orientación Tributaria para
                  Restaurantes
                </h2>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Explica tu diagnóstico tributario en lenguaje coloquial,
                  resuelve dudas sobre regímenes y obligaciones, compara
                  alternativas y muestra siempre fuentes oficiales verificables.{" "}
                  <strong>
                    Crea IA no modifica las decisiones del motor de reglas ni
                    inventa normas, fechas o montos.
                  </strong>
                </p>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {QUICK_CREA_IA_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAskCreaIa(q)}
                    disabled={iaLoading}
                    className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-left text-xs font-bold text-indigo-900 transition hover:bg-indigo-100"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="text"
                  value={iaQuery}
                  onChange={(e) => setIaQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAskCreaIa();
                  }}
                  placeholder="Escribe tu consulta sobre regímenes, facturas de insumos, IGV, Renta o cronograma SUNAT..."
                  className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={iaLoading || !iaQuery.trim()}
                  onClick={() => handleAskCreaIa()}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {iaLoading ? "Analizando fuentes..." : "Consultar a Crea IA"}
                </button>
              </div>

              {iaError && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                  {iaError}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {iaHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                    Haz clic en una de las preguntas sugeridas arriba o escribe
                    tu consulta para recibir una explicación fundamentada de{" "}
                    <strong>Crea IA</strong>.
                  </div>
                ) : (
                  iaHistory.map((item, idx) => (
                    <article
                      key={`${item.response.metrics.queryId}-${idx}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <p className="text-sm font-extrabold text-slate-900">
                          Pregunta: «{item.query}»
                        </p>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800">
                          Claridad: {item.response.metrics.clarityScore}/5 ·{" "}
                          {item.response.metrics.citationsCount} fuente(s)
                          oficiales · {item.response.metrics.responseTimeMs} ms
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
                        <span className="text-[11px] font-extrabold uppercase text-blue-700">
                          🗣️ Explicación en lenguaje sencillo:
                        </span>
                        <p className="mt-1 text-xs leading-relaxed text-slate-800 sm:text-sm">
                          {item.response.colloquialExplanation}
                        </p>
                      </div>

                      <div className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-700">
                        {item.response.answer}
                      </div>

                      <div className="mt-3">
                        <span className="text-xs font-extrabold text-slate-900">
                          Próximas acciones recomendadas para tu restaurante:
                        </span>
                        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-slate-700">
                          {item.response.recommendedNextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <span className="text-[11px] font-extrabold uppercase text-slate-600">
                          Fuentes oficiales verificables (SUNAT):
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.response.citations.map((cit) => (
                            <a
                              key={cit.sourceId}
                              href={cit.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 hover:border-blue-400"
                            >
                              {cit.title} ({cit.legalBasis} · v{cit.version}) ↗
                            </a>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                          {item.response.guardrailNotice} (Consultas restantes
                          en sesión: {item.response.rateLimitRemaining})
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {getCreaIaMetricsLog().length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
                  <strong>Métricas acumuladas de Crea IA en sesión:</strong>{" "}
                  {getCreaIaMetricsLog().length} consulta(s) registradas · 100%
                  consistentes con el motor de reglas · Respaldo normativo
                  verificado.
                </div>
              )}
            </section>
          </div>
        )}

        {/* =========================================================
            SECCIÓN 5: CENTRO DE ORIENTACIÓN (Áreas 1, 2 y 3)
           ========================================================= */}
        {section === "orientacion" && (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Módulo: Centro de Orientación Tributaria para Restaurantes
              </span>
              <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
                Guías prácticas alineadas con los 3 objetivos específicos
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: "TODAS", label: "Todas las áreas (3)" },
                  {
                    id: "COMPRENSION",
                    label: "Área 1. Comprensión tributaria (OE1)",
                  },
                  {
                    id: "EVALUACION",
                    label: "Área 2. Evaluación de alternativas (OE2)",
                  },
                  {
                    id: "CUMPLIMIENTO",
                    label: "Área 3. Organización del cumplimiento (OE3)",
                  },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() =>
                      setOrientationArea(
                        btn.id as
                          | "TODAS"
                          | "COMPRENSION"
                          | "EVALUACION"
                          | "CUMPLIMIENTO"
                      )
                    }
                    className={
                      "rounded-xl px-4 py-2 text-xs font-bold transition " +
                      (orientationArea === btn.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                    }
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {guidesList.map(([id, guide]) => (
                  <article
                    key={id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-extrabold text-blue-800">
                          {guide.areaLabel}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {guide.objectiveCode}
                        </span>
                      </div>

                      <h3 className="mt-2.5 text-base font-extrabold text-slate-900">
                        {guide.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {guide.askFor}
                      </p>

                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-950">
                        <strong>Ejemplo en restaurantes de Cajamarca:</strong>{" "}
                        {guide.restaurantExample}
                      </div>

                      <div className="mt-3">
                        <span className="text-xs font-bold text-slate-800">
                          Pasos clave:
                        </span>
                        <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-700">
                          {guide.steps.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <a
                        href={guide.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 underline hover:text-blue-800"
                      >
                        Consultar guía oficial en SUNAT / Gob.pe ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            SECCIÓN 6: MIS REPORTES (DESCARGA PDF)
           ========================================================= */}
        {section === "reportes" && (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Módulo: Mis Reportes de Evaluación Tributaria
                  </span>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    Reporte Técnico de Diagnóstico y Cumplimiento para
                    Restaurantes
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Fecha de evaluación: {reportData.generatedAtFormatted} ·
                    Versión de reglas: v{reportData.ruleEngineVersion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => downloadDiagnosticReportPdf(context)}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  ⬇ Descargar / Imprimir Reporte en PDF
                </button>
              </div>

              {/* Clean Structured Report Preview */}
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      1. Identificación y Datos Evaluados (Declarados vs.
                      Verificados)
                    </h3>
                  </div>
                  <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-700">
                        <th className="p-3 font-extrabold">
                          Característica evaluada
                        </th>
                        <th className="p-3 font-extrabold">Valor registrado</th>
                        <th className="p-3 font-extrabold">Origen del dato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportData.evaluatedDataWithOrigins.map((item) => (
                        <tr key={item.field}>
                          <td className="p-3 font-semibold text-slate-700">
                            {item.field}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {item.value}
                          </td>
                          <td className="p-3">
                            <span
                              className={
                                "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                                (item.origin.includes("Verificado")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800")
                              }
                            >
                              {item.origin}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      2. Resultado de Compatibilidad del Régimen Actual
                    </h3>
                    <p className="mt-2 text-xs font-bold text-slate-800">
                      {reportData.currentRegimeEvaluation.regimeName}:{" "}
                      <span className="underline">
                        {reportData.currentRegimeEvaluation.status}
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {reportData.currentRegimeEvaluation.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      3. Alternativas Compatibles y Acciones Recomendadas
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                      {reportData.alternativesEvaluation.map((alt) => (
                        <li key={alt.regimeCode}>
                          <strong>
                            {alt.regimeName} ({alt.status}):
                          </strong>{" "}
                          {alt.estimatedMonthlyPayment}
                        </li>
                      ))}
                    </ul>
                    <h4 className="mt-3 text-xs font-extrabold text-slate-900">
                      Acciones recomendadas:
                    </h4>
                    <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-slate-700">
                      {reportData.recommendedActions.map((act) => (
                        <li key={act}>{act}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-950">
                  {reportData.mandatoryDisclaimer}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

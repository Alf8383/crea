"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { BusinessSetupAdvicePanel, LegalFormRecommendationPanel, PracticalGuidePanel, TaxPathPanel } from "@/components/practical-guide-panel";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS } from "@/lib/demo-presets";
import { getTaxPath } from "@/lib/practical-guides";
import { RuleEngine } from "@/lib/rule-engine";
import { categories, requirementById, rules, sourceById, sources } from "@/lib/seed-catalog";
import type { AppliedRequirement, BusinessContext, RequirementStatus, TaxRecommendation } from "@/lib/types";

const defaultDemoContext: BusinessContext = DEMO_PRESETS[0].context;

const taxLabel = {
  COMPATIBLE: "Cumple lo evaluado",
  INCOMPATIBLE: "No compatible",
  INFORMACION_INSUFICIENTE: "Por verificar",
} as const;

const taxBadgeStyle = {
  COMPATIBLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INCOMPATIBLE: "bg-rose-50 text-rose-700 border-rose-200",
  INFORMACION_INSUFICIENTE: "bg-amber-50 text-amber-800 border-amber-200",
} as const;

const tabs = [
  { id: "Mi ruta", label: "1. Ruta de formalización" },
  { id: "Comparar regímenes", label: "2. Regímenes y Simulador SUNAT" },
  { id: "Herramientas prácticas", label: "3. Herramientas prácticas" },
  { id: "Mis obligaciones", label: "4. Cronograma SUNAT" },
] as const;

type Tab = (typeof tabs)[number]["id"];

function TaxPaymentSimulator({ context }: { context: BusinessContext }) {
  const [customSales, setCustomSales] = useState<number | null>(null);
  const [customPurchases, setCustomPurchases] = useState<number | null>(null);
  const sales = customSales ?? (context.monthlyRevenue > 0 ? context.monthlyRevenue : 4200);
  const purchases = customPurchases ?? (context.monthlyPurchases > 0 ? context.monthlyPurchases : 1800);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.max(0, n));

  const netSales = sales / 1.18;
  const netPurchases = purchases / 1.18;
  const igvSales = sales - netSales;
  const igvPurchases = purchases - netPurchases;
  const igvPayable = Math.max(0, igvSales - igvPurchases);

  const nrusAllowed = context.legalPerson !== "juridica" && context.needsInvoices !== true && sales <= 8000 && purchases <= 8000;
  const nrusQuota = sales <= 5000 && purchases <= 5000 ? 20 : 50;
  const rerAllowed = sales * 12 <= 525000 && purchases * 12 <= 525000;
  const rerIncomeTax = netSales * 0.015;
  const rmtIncomeTax = netSales * (sales * 12 <= 300 * 5500 ? 0.01 : 0.015);
  const rgIncomeTax = netSales * 0.015;

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs" aria-labelledby="tax-sim-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simulador financiero mensual</span>
          <h2 id="tax-sim-title" className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Calcula tu pago mensual aproximado en cada régimen
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Desliza o edita tus ventas y compras con factura para observar el efecto del crédito fiscal del IGV (18%) y el Impuesto a la Renta.
          </p>
        </div>
        {(customSales !== null || customPurchases !== null) && (
          <button
            type="button"
            onClick={() => {
              setCustomSales(null);
              setCustomPurchases(null);
            }}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Restaurar valores iniciales
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:grid-cols-2">
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Ventas mensuales estimadas (S/)</span>
            <span className="text-xs font-semibold text-slate-500">Anual: S/ {fmt(sales * 12)}</span>
          </div>
          <input
            type="number"
            min={0}
            step={100}
            value={sales}
            onChange={(e) => setCustomSales(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-extrabold text-slate-900 outline-none focus:border-blue-600"
          />
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={Math.min(50000, sales)}
            onChange={(e) => setCustomSales(Number(e.target.value))}
            className="mt-2 w-full cursor-pointer accent-blue-600"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Compras mensuales con factura (S/)</span>
            <span className="text-xs font-bold text-emerald-700">Crédito fiscal IGV: S/ {fmt(igvPurchases)}</span>
          </div>
          <input
            type="number"
            min={0}
            step={100}
            value={purchases}
            onChange={(e) => setCustomPurchases(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-extrabold text-slate-900 outline-none focus:border-blue-600"
          />
          <input
            type="range"
            min={0}
            max={40000}
            step={250}
            value={Math.min(40000, purchases)}
            onChange={(e) => setCustomPurchases(Number(e.target.value))}
            className="mt-2 w-full cursor-pointer accent-blue-600"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <article
          className={
            "rounded-2xl border p-4 " +
            (nrusAllowed ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50/60")
          }
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900">Nuevo RUS</span>
            <span
              className={
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                (nrusAllowed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700")
              }
            >
              {nrusAllowed ? (nrusQuota === 20 ? "Categoría 1" : "Categoría 2") : "No aplicable"}
            </span>
          </div>
          {nrusAllowed ? (
            <>
              <p className="mt-3 text-2xl font-extrabold text-blue-600">S/ {fmt(nrusQuota)}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Cuota fija única al mes</p>
              <p className="mt-2.5 text-xs leading-5 text-slate-600">
                Hasta S/ 5,000 pagas S/ 20; de S/ 5,001 a S/ 8,000 pagas S/ 50. Sin libros contables.
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-rose-700">
              {sales > 8000 || purchases > 8000
                ? "Supera el límite mensual de S/ 8,000 del Nuevo RUS."
                : context.legalPerson === "juridica"
                ? "No aplica a personas jurídicas."
                : "No aplica si necesitas emitir facturas."}
            </p>
          )}
        </article>

        <article
          className={
            "rounded-2xl border p-4 " +
            (rerAllowed ? "border-blue-200 bg-blue-50/20" : "border-slate-200 bg-slate-50/60")
          }
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900">RER</span>
            <span
              className={
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold " +
                (rerAllowed ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700")
              }
            >
              {rerAllowed ? "1.5% Renta + IGV" : "Supera tope"}
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-blue-600">S/ {fmt(rerIncomeTax + igvPayable)}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            Renta: S/ {fmt(rerIncomeTax)} · IGV: S/ {fmt(igvPayable)}
          </p>
          <p className="mt-2.5 text-xs leading-5 text-slate-600">
            Sin Declaración Anual. Tope anual de S/ 525,000 y máx. 10 trabajadores por turno.
          </p>
        </article>

        <article className="rounded-2xl border border-blue-200 bg-blue-50/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900">RMT (MYPE)</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">1.0% Renta + IGV</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-blue-600">S/ {fmt(rmtIncomeTax + igvPayable)}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            Renta: S/ {fmt(rmtIncomeTax)} · IGV: S/ {fmt(igvPayable)}
          </p>
          <p className="mt-2.5 text-xs leading-5 text-slate-600">
            Admite cualquier giro y regulariza Renta Anual sobre utilidad neta (10% primeras 15 UIT).
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-900">Régimen General</span>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">1.5% Renta + IGV</span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">S/ {fmt(rgIncomeTax + igvPayable)}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            Renta: S/ {fmt(rgIncomeTax)} · IGV: S/ {fmt(igvPayable)}
          </p>
          <p className="mt-2.5 text-xs leading-5 text-slate-600">
            Sin tope de ingresos ni compras. Renta Anual del 29.5% sobre la utilidad neta.
          </p>
        </article>
      </div>
    </section>
  );
}

function TaxComparisonTable() {
  const rows = [
    ["¿Quiénes pueden acogerse?", "Solo Persona Natural", "Persona Natural o Jurídica", "Persona Natural o Jurídica", "Persona Natural o Jurídica"],
    ["Límite de ingresos anuales", "Hasta S/ 96,000 (S/ 8,000/mes)", "Hasta S/ 525,000 al año", "Hasta 1,700 UIT al año", "Sin límite"],
    ["Límite de compras anuales", "Hasta S/ 96,000 (S/ 8,000/mes)", "Hasta S/ 525,000 al año", "Sin límite", "Sin límite"],
    ["Comprobantes permitidos", "Boleta de venta y tickets (No Factura)", "Factura, boleta y demás permitidos", "Factura, boleta y demás permitidos", "Factura, boleta y demás permitidos"],
    ["Pago mensual", "Cuota fija: S/ 20 o S/ 50", "Renta 1.5% + IGV 18%", "Renta 1% (hasta 300 UIT) + IGV 18%", "Renta 1.5% o coef. + IGV 18%"],
    ["Declaración Anual", "No presenta", "No presenta", "Sí (10% hasta 15 UIT; 29.5% exceso)", "Sí (29.5% sobre utilidad)"],
    ["Límite de activos fijos", "Hasta S/ 70,000", "Hasta S/ 126,000", "Sin límite", "Sin límite"],
    ["Trabajadores", "Sin límite fijo", "Máx. 10 por turno", "Sin límite", "Sin límite"],
    ["Libros contables", "Ninguno", "Registro de Compras y Ventas", "Según tramo de ingresos", "Según tramo de ingresos"],
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <h2 className="text-xl font-extrabold text-slate-900">Cuadro comparativo resumen SUNAT</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-800">
              <th className="p-3 font-bold">Criterio</th>
              <th className="p-3 font-bold">Nuevo RUS</th>
              <th className="p-3 font-bold">RER</th>
              <th className="p-3 font-bold">RMT (MYPE)</th>
              <th className="p-3 font-bold">Régimen General</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([criterion, nrus, rer, rmt, rg]) => (
              <tr key={criterion} className="hover:bg-slate-50/80">
                <td className="p-3 font-bold text-slate-900">{criterion}</td>
                <td className="p-3 text-slate-600">{nrus}</td>
                <td className="p-3 text-slate-600">{rer}</td>
                <td className="p-3 text-slate-600">{rmt}</td>
                <td className="p-3 text-slate-600">{rg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PracticalToolsTab({ context }: { context: BusinessContext }) {
  const [buyerType, setBuyerType] = useState<"persona" | "empresa">(
    context.customerType === "empresas" ? "empresa" : "persona",
  );
  const [saleAmount, setSaleAmount] = useState<number>(850);
  const [entityType, setEntityType] = useState<"natural" | "eirl" | "srl" | "sac">(
    context.legalPerson === "juridica" ? "sac" : "natural",
  );
  const [areaSize, setAreaSize] = useState<"menor100" | "100a500" | "mayor500">("menor100");
  const [hasHighRiskFactor, setHasHighRiskFactor] = useState<boolean>(false);

  const entityDetails = {
    natural: {
      title: "Persona Natural con Negocio (RUC 10)",
      owners: "1 sola persona (tú mismo)",
      liability: "Ilimitada: respondes con tu patrimonio personal.",
      constitution: "Trámite digital gratuito de RUC 10 en SUNAT Virtual / App Personas.",
      regimes: "Nuevo RUS, RER, RMT o Régimen General.",
      idealFor: "Bodegas, cafeterías, oficios y comercios pequeños que buscan iniciar rápido y sin costos notariales.",
    },
    eirl: {
      title: "E.I.R.L. (Empresa Individual de Responsabilidad Limitada)",
      owners: "1 solo titular (sin socios)",
      liability: "Limitada al patrimonio aportado a la empresa.",
      constitution: "SID-SUNARP + Notaría + Activación de RUC 20 en SUNAT.",
      regimes: "RER, RMT o Régimen General (No aplica Nuevo RUS).",
      idealFor: "Emprendedores individuales que desean separar su patrimonio personal y vender a empresas.",
    },
    srl: {
      title: "S.R.L. (Sociedad Comercial de Responsabilidad Limitada)",
      owners: "De 2 a 20 socios",
      liability: "Limitada al capital social aportado en participaciones.",
      constitution: "SID-SUNARP + Notaría + Activación de RUC 20 en SUNAT.",
      regimes: "RER, RMT o Régimen General.",
      idealFor: "Negocios familiares o de pocos socios de confianza.",
    },
    sac: {
      title: "S.A.C. (Sociedad Anónima Cerrada)",
      owners: "De 2 a 20 accionistas",
      liability: "Limitada al aporte de capital representado en acciones.",
      constitution: "SID-SUNARP + Notaría + Activación de RUC 20 en SUNAT.",
      regimes: "RER, RMT o Régimen General.",
      idealFor: "Empresas con socios que buscan crecer, licitar o sumar inversión.",
    },
  }[entityType];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Herramienta 1 · Comprobantes</span>
        <h2 className="mt-1 text-xl font-extrabold text-slate-900">Asistente de Comprobantes de Pago (¿Boleta o Factura?)</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
            <div>
              <span className="block text-xs font-bold text-slate-700">1. ¿Quién es tu cliente en esta venta?</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBuyerType("persona")}
                  className={
                    "rounded-xl border px-3 py-2.5 text-xs font-bold transition " +
                    (buyerType === "persona"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700")
                  }
                >
                  Consumidor final (Persona)
                </button>
                <button
                  type="button"
                  onClick={() => setBuyerType("empresa")}
                  className={
                    "rounded-xl border px-3 py-2.5 text-xs font-bold transition " +
                    (buyerType === "empresa"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700")
                  }
                >
                  Empresa o entidad con RUC
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-slate-700">2. Importe total de la venta (S/)</span>
              <input
                type="number"
                min={1}
                step={50}
                value={saleAmount}
                onChange={(e) => setSaleAmount(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-extrabold text-slate-900 outline-none focus:border-blue-600"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[35, 250, 700, 1200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSaleAmount(val)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50"
                  >
                    S/ {val}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
              {buyerType === "empresa" ? "Emitir: FACTURA ELECTRÓNICA" : "Emitir: BOLETA DE VENTA"}
            </span>
            <h3 className="mt-2.5 text-lg font-extrabold text-slate-900">
              {buyerType === "empresa"
                ? "Factura Electrónica con RUC del cliente"
                : saleAmount >= 700
                ? "Boleta de Venta con DNI obligatorio (≥ S/ 700)"
                : "Boleta de Venta simple a consumidor final"}
            </h3>
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-700">
              {buyerType === "empresa" ? (
                <>
                  <li>• Requiere estar acogido a <b>RER, RMT o Régimen General</b> (el Nuevo RUS no emite facturas).</li>
                  <li>
                    • Desglose: Valor venta <b>S/ {(saleAmount / 1.18).toFixed(2)}</b> + IGV (18%):{" "}
                    <b>S/ {(saleAmount - saleAmount / 1.18).toFixed(2)}</b>.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    • <b>Regla de S/ 700:</b>{" "}
                    {saleAmount >= 700
                      ? "Al ser igual o mayor a S/ 700, es obligatorio registrar el DNI y nombre completo del comprador."
                      : "Al ser menor a S/ 700, no es obligatorio consignar el DNI del cliente salvo que lo solicite."}
                  </li>
                  <li>• Puedes emitirla gratuitamente desde la App Emprender o Portal SOL de SUNAT.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Herramienta 2 · Personería</span>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">Comparador de Forma Legal</h2>
          <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {([
              ["natural", "P. Natural"],
              ["eirl", "E.I.R.L."],
              ["srl", "S.R.L."],
              ["sac", "S.A.C."],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEntityType(key)}
                className={
                  "rounded-lg py-2 transition " +
                  (entityType === key ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs">
            <p className="text-sm font-extrabold text-slate-900">{entityDetails.title}</p>
            <p>
              <b className="text-slate-700">Integrantes:</b> {entityDetails.owners}
            </p>
            <p>
              <b className="text-slate-700">Responsabilidad:</b> {entityDetails.liability}
            </p>
            <p>
              <b className="text-slate-700">Trámite:</b> {entityDetails.constitution}
            </p>
            <p>
              <b className="text-slate-700">Regímenes admitidos:</b> {entityDetails.regimes}
            </p>
            <p className="rounded-xl bg-white p-2.5 text-slate-600">
              <b className="text-blue-600">Ideal para:</b> {entityDetails.idealFor}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Herramienta 3 · Municipalidad</span>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">Orientador de Riesgo ITSE</h2>
          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-700">Área techada del establecimiento:</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-xs font-bold">
                {([
                  ["menor100", "Hasta 100 m²"],
                  ["100a500", "100 a 500 m²"],
                  ["mayor500", "> 500 m²"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAreaSize(key)}
                    className={
                      "rounded-xl border py-2 transition " +
                      (areaSize === key
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 bg-white text-slate-600")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700">¿Usa GLP mayor a 45 kg, inflamables o alto aforo?</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setHasHighRiskFactor(false)}
                  className={
                    "rounded-xl border py-2 transition " +
                    (!hasHighRiskFactor
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 bg-white text-slate-600")
                  }
                >
                  No (Comercio / oficina estándar)
                </button>
                <button
                  type="button"
                  onClick={() => setHasHighRiskFactor(true)}
                  className={
                    "rounded-xl border py-2 transition " +
                    (hasHighRiskFactor
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-slate-200 bg-white text-slate-600")
                  }
                >
                  Sí (Exigencia mayor)
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs leading-5">
              {areaSize !== "mayor500" && !hasHighRiskFactor ? (
                <>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                    Riesgo Bajo o Medio · ITSE Posterior
                  </span>
                  <p className="mt-2 text-slate-700">
                    Presentas Declaración Jurada de Condiciones de Seguridad; la municipalidad emite la Licencia de Funcionamiento y realiza la inspección técnica con posterioridad.
                  </p>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-900">
                    Riesgo Alto o Muy Alto · ITSE Previa
                  </span>
                  <p className="mt-2 text-slate-700">
                    Requiere presentar expediente técnico (planos eléctricos, arquitectura y seguridad) y aprobar la inspección ITSE antes de emitirse la Licencia.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function RouteDashboard() {
  const [context, setContext] = useState<BusinessContext>(defaultDemoContext);
  const [results, setResults] = useState<AppliedRequirement[]>([]);
  const [taxes, setTaxes] = useState<TaxRecommendation[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RequirementStatus>>({});
  const [tab, setTab] = useState<Tab>("Mi ruta");
  const [selected, setSelected] = useState<TaxRecommendation["code"]>("NRUS");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExample, setIsExample] = useState(true);
  const [hasSavedUserEvaluation, setHasSavedUserEvaluation] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(DEMO_PRESETS[0].id);
  const [rucDigit, setRucDigit] = useState<string>("0");

  const evaluateContext = (targetContext: BusinessContext, exampleMode: boolean) => {
    setLoading(true);
    fetch("/api/diagnostics/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(targetContext),
    })
      .then((response) => response.json())
      .then((body) => {
        setContext(targetContext);
        setResults(body.results || []);
        setTaxes(body.taxRecommendations || []);
        setIsExample(exampleMode);
        const advice = getTaxPath(targetContext);
        setSelected(
          advice.code ||
            body.taxRecommendations?.find((item: TaxRecommendation) => item.status === "COMPATIBLE")?.code ||
            "NRUS",
        );
      })
      .catch(() => {
        const localResults = RuleEngine.evaluate(targetContext, rules, sources);
        const localTaxes = RuleEngine.recommendTax(targetContext, "sunat-regimes", "VIGENTE");
        const advice = getTaxPath(targetContext);
        setContext(targetContext);
        setResults(localResults);
        setTaxes(localTaxes);
        setIsExample(exampleMode);
        setSelected(advice.code || localTaxes.find((item) => item.status === "COMPATIBLE")?.code || "NRUS");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "regimenes") setTab("Comparar regímenes");
      else if (tabParam === "herramientas") setTab("Herramientas prácticas");
      else if (tabParam === "obligaciones") setTab("Mis obligaciones");

      const saved = localStorage.getItem(scopedStorageKey("efp-business-context"));
      const savedStatuses = JSON.parse(localStorage.getItem(scopedStorageKey("efp-requirement-statuses")) || "{}");
      const parsedSaved = saved ? (JSON.parse(saved) as BusinessContext) : null;
      const hasCompleteSaved = Boolean(
        parsedSaved && parsedSaved.questionnaire && Object.keys(parsedSaved.questionnaire).length > 0,
      );
      const initialContext = hasCompleteSaved && parsedSaved ? parsedSaved : defaultDemoContext;
      setHasSavedUserEvaluation(hasCompleteSaved);
      setStatuses(savedStatuses);
      evaluateContext(initialContext, !hasCompleteSaved);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const switchPreset = (presetId: string) => {
    const found = DEMO_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    evaluateContext(found.context, true);
  };

  const restoreUserEvaluation = () => {
    try {
      const saved = localStorage.getItem(scopedStorageKey("efp-business-context"));
      if (saved) {
        const parsed = JSON.parse(saved) as BusinessContext;
        evaluateContext(parsed, false);
      }
    } catch {}
  };

  const category = categories.find((item) => item.id === context.sectorId);
  const selectedTax = taxes.find((item) => item.code === selected) || taxes[0];
  const taxAdvice = useMemo(() => getTaxPath(context), [context]);

  const completed = results.filter((item) => statuses[item.requirementId] === "COMPLETADO").length;
  const progressPercent = results.length > 0 ? Math.round((completed / results.length) * 100) : 0;

  const change = (id: string, status: RequirementStatus) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    localStorage.setItem(scopedStorageKey("efp-requirement-statuses"), JSON.stringify(next));
  };

  const today = new Date();
  const month = today.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const first = (new Date(today.getFullYear(), today.getMonth(), 1).getDay() + 6) % 7;
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const rucDayOffset: Record<string, number> = {
    "0": 14,
    "1": 15,
    "2": 16,
    "3": 16,
    "4": 17,
    "5": 17,
    "6": 18,
    "7": 18,
    "8": 19,
    "9": 19,
    BC: 22,
  };
  const suggestedDueDay = Math.min(last, rucDayOffset[rucDigit] || 15);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader
        rightActions={
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:inline-block"
          >
            Imprimir / PDF
          </button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        {/* Scenario Switcher Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-2xs print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {isExample ? "Escenario de demostración:" : "Modo diagnóstico:"}
            </span>
            {DEMO_PRESETS.map((preset) => {
              const active = isExample && activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => switchPreset(preset.id)}
                  className={
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition " +
                    (active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600")
                  }
                >
                  {preset.shortTitle} ({preset.targetRegime})
                </button>
              );
            })}
            {isExample && hasSavedUserEvaluation && (
              <button
                type="button"
                onClick={restoreUserEvaluation}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Volver a mi evaluación
              </button>
            )}
          </div>

          <Link
            href="/negocios/nuevo"
            className="rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
          >
            {isExample ? "Crear mi propia evaluación →" : "Editar mis respuestas ✎"}
          </Link>
        </div>

        {/* Executive Overview Card */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-blue-600">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1">{category?.name || "Mi negocio"}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  📍 {[context.district, context.province, context.department].filter(Boolean).join(", ") || "Cajamarca"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
                  {context.legalPerson === "natural"
                    ? "Persona Natural"
                    : context.legalPerson === "juridica"
                    ? "Persona Jurídica"
                    : "Personería por definir"}
                </span>
              </div>

              <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {context.businessName}
              </h1>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>
                  Ventas:{" "}
                  <b className="text-slate-800">
                    S/ {new Intl.NumberFormat("es-PE").format(context.monthlyRevenue)}/mes
                  </b>
                </span>
                <span>
                  Compras:{" "}
                  <b className="text-slate-800">
                    S/ {new Intl.NumberFormat("es-PE").format(context.monthlyPurchases)}/mes
                  </b>
                </span>
                <span>
                  Comprobantes:{" "}
                  <b className="text-slate-800">{context.needsInvoices ? "Factura y Boleta" : "Solo Boleta"}</b>
                </span>
                <span>
                  Trabajadores: <b className="text-slate-800">{context.employeeCount || 0}</b>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setTab("Comparar regímenes")}
                className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-left transition hover:bg-emerald-100/80"
              >
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Régimen preseleccionado
                </span>
                <span className="mt-0.5 block text-base font-extrabold text-emerald-950">
                  {taxAdvice.code ? `${taxAdvice.code} · Ver simulador →` : "Comparar opciones →"}
                </span>
              </button>

              <div className="min-w-[165px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Avance de ruta</span>
                  <span className="text-blue-600">{progressPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {completed} de {results.length} pasos listos
                </p>
              </div>
            </div>
          </div>

          {/* 4-Tab Bar */}
          <div className="mt-6 flex gap-1.5 overflow-x-auto border-t border-slate-100 pt-4 print:hidden">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={
                  "whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition sm:text-sm " +
                  (tab === item.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="py-16 text-center text-sm font-medium text-slate-500">Evaluando reglas de decisión…</p>
        ) : (
          <div className="mt-6">
            {/* TAB 1: RUTA DE FORMALIZACIÓN */}
            {tab === "Mi ruta" && (
              <div className="space-y-6">
                <section id="ruta" className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">
                        Pasos para formalizar tu negocio ({results.length})
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                        Marca tus avances y despliega cada paso para ver dónde ir, costos y requisitos.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("Comparar regímenes")}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      Ir al simulador tributario →
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {results.map((item, index) => {
                      const req = requirementById(item.requirementId);
                      if (!req) return null;
                      const source = sourceById(item.sourceId);
                      const status = statuses[req.id] || "PENDIENTE";
                      const isOpen = expanded === req.id;

                      return (
                        <article
                          key={req.id}
                          className={
                            "rounded-2xl border p-4 transition " +
                            (status === "COMPLETADO"
                              ? "border-emerald-200 bg-emerald-50/20"
                              : isOpen
                              ? "border-blue-300 bg-white shadow-xs"
                              : "border-slate-200/90 bg-white hover:border-slate-300")
                          }
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() =>
                                  change(req.id, status === "COMPLETADO" ? "PENDIENTE" : "COMPLETADO")
                                }
                                title="Marcar como completado o pendiente"
                                className={
                                  "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold transition " +
                                  (status === "COMPLETADO"
                                    ? "bg-emerald-500 text-white"
                                    : status === "EN_PROCESO"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600")
                                }
                              >
                                {status === "COMPLETADO" ? "✓" : index + 1}
                              </button>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                                    {req.category}
                                  </span>
                                  <span className="text-xs font-medium text-slate-400">{req.institution}</span>
                                </div>
                                <h3 className="mt-1 text-base font-extrabold text-slate-900">{req.title}</h3>
                                <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{req.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                aria-label={"Estado de " + req.title}
                                value={status}
                                onChange={(event) => change(req.id, event.target.value as RequirementStatus)}
                                className={
                                  "rounded-xl border px-3 py-2 text-xs font-bold outline-none " +
                                  (status === "COMPLETADO"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : status === "EN_PROCESO"
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600")
                                }
                              >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_PROCESO">En proceso</option>
                                <option value="COMPLETADO">Completado</option>
                              </select>

                              <button
                                type="button"
                                aria-expanded={isOpen}
                                onClick={() => setExpanded(isOpen ? null : req.id)}
                                className={
                                  "rounded-xl border px-3.5 py-2 text-xs font-bold transition " +
                                  (isOpen
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600")
                                }
                              >
                                {isOpen ? "Cerrar guía" : "Cómo hacerlo ↓"}
                              </button>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                              <div className="grid gap-3 rounded-xl bg-slate-50 p-3.5 text-xs sm:grid-cols-2">
                                <p>
                                  <b className="text-slate-800">¿Por qué aplica a tu caso?</b> {item.reason}
                                </p>
                                <p>
                                  <b className="text-slate-800">Entidad:</b>{" "}
                                  {req.category === "Municipalidad"
                                    ? `Municipalidad de ${context.district || "tu distrito"}`
                                    : req.institution}
                                </p>
                              </div>
                              <PracticalGuidePanel requirementId={req.id} context={context} />
                              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                                {source && (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-blue-600 underline"
                                  >
                                    Fuente oficial ({source.institution}) ↗
                                  </a>
                                )}
                                <Link href={`/requisitos/${req.id}`} className="font-bold text-slate-600 hover:underline">
                                  Ver ficha técnica →
                                </Link>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>

                {/* Collapsible Orientation Detail */}
                <details className="group rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-extrabold text-slate-900">
                    <span>💡 Orientación detallada sobre código CIIU sugerido, personería y RUC</span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-blue-600 group-open:hidden">
                      Ver detalle +
                    </span>
                  </summary>
                  <div className="mt-3">
                    <BusinessSetupAdvicePanel context={context} />
                    {context.legalPerson === "aun-no-se" && <LegalFormRecommendationPanel context={context} />}
                  </div>
                </details>
              </div>
            )}

            {/* TAB 2: REGÍMENES Y SIMULADOR SUNAT */}
            {tab === "Comparar regímenes" && (
              <div className="space-y-6">
                <TaxPathPanel context={context} />

                <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
                  <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                    <h2 className="text-xl font-extrabold text-slate-900">Evaluación por régimen tributario</h2>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Selecciona cualquiera de los 4 regímenes para inspeccionar qué reglas cumple tu negocio.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {taxes.map((tax) => (
                        <button
                          key={tax.code}
                          type="button"
                          aria-pressed={selected === tax.code}
                          onClick={() => setSelected(tax.code)}
                          className={
                            "rounded-2xl border p-4 text-left transition " +
                            (selected === tax.code
                              ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/15"
                              : "border-slate-200 hover:border-blue-300")
                          }
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xl font-extrabold text-slate-900">{tax.code}</span>
                            <span className={"rounded-full border px-2.5 py-0.5 text-[11px] font-bold " + taxBadgeStyle[tax.status]}>
                              {taxLabel[tax.status]}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-bold text-slate-800">{tax.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{tax.reasons[0]}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <aside className="flex flex-col justify-between rounded-3xl bg-slate-900 p-6 text-white shadow-xs">
                    {selectedTax && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                          Reglas evaluadas
                        </span>
                        <h3 className="mt-1.5 text-2xl font-extrabold">{selectedTax.title}</h3>
                        <span className="mt-2.5 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                          {taxLabel[selectedTax.status]}
                        </span>
                        <ul className="mt-4 space-y-2">
                          {selectedTax.reasons.map((reason) => (
                            <li key={reason} className="flex gap-2 text-xs leading-5 text-slate-300">
                              <span className="font-bold text-blue-400">→</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-5 border-t border-white/10 pt-4">
                      {selectedTax && sourceById(selectedTax.sourceId) && (
                        <a
                          href={sourceById(selectedTax.sourceId)?.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl bg-blue-600 px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-blue-500"
                        >
                          Ver normativa oficial SUNAT ↗
                        </a>
                      )}
                    </div>
                  </aside>
                </section>

                <TaxPaymentSimulator context={context} />
                <TaxComparisonTable />
              </div>
            )}

            {/* TAB 3: HERRAMIENTAS PRÁCTICAS */}
            {tab === "Herramientas prácticas" && <PracticalToolsTab context={context} />}

            {/* TAB 4: CRONOGRAMA SUNAT */}
            {tab === "Mis obligaciones" && (
              <section id="obligaciones" className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-extrabold capitalize text-slate-900">{month}</h2>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      Simulador de vencimientos SUNAT
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-xs font-bold text-slate-700">
                      Último dígito de tu RUC:
                      <select
                        value={rucDigit}
                        onChange={(e) => setRucDigit(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                      >
                        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                          <option key={d} value={d}>
                            RUC terminado en {d}
                          </option>
                        ))}
                        <option value="BC">Buenos Contribuyentes</option>
                      </select>
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      Día orientativo de vencimiento mensual resaltado en ámbar: <b>día {suggestedDueDay}</b>.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs">
                    {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((day) => (
                      <b key={day} className="py-1.5 text-slate-400">
                        {day}
                      </b>
                    ))}
                    {Array.from({ length: first }, (_, i) => (
                      <span key={"empty" + i} />
                    ))}
                    {Array.from({ length: last }, (_, i) => {
                      const dayNum = i + 1;
                      const isToday = today.getDate() === dayNum;
                      const isDue = suggestedDueDay === dayNum;
                      return (
                        <span
                          key={i}
                          className={
                            "grid h-9 place-items-center rounded-xl " +
                            (isDue
                              ? "bg-amber-400 font-extrabold text-amber-950"
                              : isToday
                              ? "bg-blue-600 font-bold text-white"
                              : "text-slate-600")
                          }
                        >
                          {dayNum}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <h2 className="text-xl font-extrabold text-slate-900">Resumen de avance</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Actualiza el estado de cada trámite de tu ruta de formalización.
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {results.map((item) => {
                      const req = requirementById(item.requirementId);
                      const currentStatus = statuses[item.requirementId] || "PENDIENTE";
                      return req ? (
                        <div
                          key={req.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                        >
                          <div>
                            <b className="text-xs font-bold text-slate-900">{req.title}</b>
                            <p className="text-[11px] text-slate-400">{req.institution}</p>
                          </div>
                          <select
                            aria-label={"Cambiar estado de " + req.title}
                            value={currentStatus}
                            onChange={(e) => change(req.id, e.target.value as RequirementStatus)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700"
                          >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="EN_PROCESO">En proceso</option>
                            <option value="COMPLETADO">Completado</option>
                          </select>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

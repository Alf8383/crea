"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PracticalGuidePanel } from "@/components/practical-guide-panel";
import { ACTIVE_ACCOUNT_KEY, getDemoAccounts, scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS, type DemoPreset } from "@/lib/demo-presets";
import { getTaxPath } from "@/lib/practical-guides";
import { RuleEngine } from "@/lib/rule-engine";
import { activities, categories, requirementById, rules, sourceById, sources } from "@/lib/seed-catalog";
import type { AppliedRequirement, BusinessContext, RequirementStatus, TaxRecommendation } from "@/lib/types";

const defaultDemoContext: BusinessContext = DEMO_PRESETS[0].context;

const taxLabel = {
  COMPATIBLE: "Compatible",
  INCOMPATIBLE: "No aplicable",
  INFORMACION_INSUFICIENTE: "Faltan datos",
} as const;

const taxBadgeStyle = {
  COMPATIBLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INCOMPATIBLE: "bg-rose-100 text-rose-700 border-rose-200",
  INFORMACION_INSUFICIENTE: "bg-amber-100 text-amber-800 border-amber-200",
} as const;

const tabs = [
  { id: "Comparar regímenes", icon: "⚖️", label: "Diagnóstico Tributario y Simulador" },
  { id: "Mi ruta", icon: "🗺️", label: "Ruta de Formalización Paso a Paso" },
  { id: "Herramientas prácticas", icon: "🧰", label: "Herramientas (Comprobantes, Empresa y RUC)" },
] as const;

type Tab = (typeof tabs)[number]["id"];

function VisualTaxSimulator({
  context,
  taxes,
  selectedCode,
  onSelectCode,
}: {
  context: BusinessContext;
  taxes: TaxRecommendation[];
  selectedCode: TaxRecommendation["code"];
  onSelectCode: (code: TaxRecommendation["code"]) => void;
}) {
  const [customSales, setCustomSales] = useState<number | null>(null);
  const [customPurchases, setCustomPurchases] = useState<number | null>(null);
  const [showFullTable, setShowFullTable] = useState(false);

  const sales = customSales ?? (context.monthlyRevenue > 0 ? context.monthlyRevenue : 4200);
  const purchases = customPurchases ?? (context.monthlyPurchases > 0 ? context.monthlyPurchases : 1800);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));
  const fmtDec = (n: number) =>
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

  const regimeSimData: Record<
    TaxRecommendation["code"],
    { monthlyTotal: number; quotaText: string; capLabel: string; capPercent: number }
  > = {
    NRUS: {
      monthlyTotal: nrusQuota,
      quotaText: nrusAllowed ? `S/ ${nrusQuota} fijo/mes` : "Excluido",
      capLabel: `Tope mensual: S/ 8,000`,
      capPercent: Math.min(100, Math.round((Math.max(sales, purchases) / 8000) * 100)),
    },
    RER: {
      monthlyTotal: rerIncomeTax + igvPayable,
      quotaText: rerAllowed ? `S/ ${fmt(rerIncomeTax + igvPayable)} / mes` : "Supera tope",
      capLabel: `Tope anual: S/ 525,000`,
      capPercent: Math.min(100, Math.round(((sales * 12) / 525000) * 100)),
    },
    RMT: {
      monthlyTotal: rmtIncomeTax + igvPayable,
      quotaText: `S/ ${fmt(rmtIncomeTax + igvPayable)} / mes`,
      capLabel: `Tope anual: 1,700 UIT`,
      capPercent: Math.min(100, Math.round(((sales * 12) / (1700 * 5500)) * 100)),
    },
    RG: {
      monthlyTotal: rgIncomeTax + igvPayable,
      quotaText: `S/ ${fmt(rgIncomeTax + igvPayable)} / mes`,
      capLabel: `Sin límite de ingresos`,
      capPercent: 25,
    },
  };

  const selectedTax = taxes.find((t) => t.code === selectedCode) || taxes[0];

  const rows = [
    ["¿Quiénes pueden acogerse?", "Solo Persona Natural", "Persona Natural o Jurídica", "Persona Natural o Jurídica", "Persona Natural o Jurídica"],
    ["Límite de ingresos anuales", "Hasta S/ 96,000 (S/ 8,000/mes)", "Hasta S/ 525,000 al año", "Hasta 1,700 UIT al año", "Sin límite"],
    ["Límite de compras anuales", "Hasta S/ 96,000 (S/ 8,000/mes)", "Hasta S/ 525,000 al año", "Sin límite", "Sin límite"],
    ["Comprobantes permitidos", "Boleta de venta y tickets (No Factura)", "Factura, boleta y demás permitidos", "Factura, boleta y demás permitidos", "Factura, boleta y demás permitidos"],
    ["Pago mensual", "Cuota fija: S/ 20 o S/ 50", "Renta 1.5% + IGV 18%", "Renta 1% (hasta 300 UIT) + IGV 18%", "Renta 1.5% o coef. + IGV 18%"],
    ["Declaración Anual", "No presenta", "No presenta", "Sí (10% hasta 15 UIT; 29.5% exceso)", "Sí (29.5% sobre utilidad)"],
    ["Libros contables", "Ninguno", "Registro de Compras y Ventas", "Según tramo de ingresos", "Según tramo de ingresos"],
  ];

  return (
    <div className="space-y-6">
      {/* 4 Visual Regime Cards + Selected Rule Inspector */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Comparativa visual de regímenes SUNAT
            </span>
            <h2 className="mt-0.5 text-xl font-extrabold text-slate-900 sm:text-2xl">
              Haz clic en cada régimen para revisar sus condiciones
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {taxes.map((tax) => {
            const sim = regimeSimData[tax.code];
            const isSelected = selectedCode === tax.code;
            const isCompatible = tax.status === "COMPATIBLE";
            return (
              <button
                key={tax.code}
                type="button"
                onClick={() => onSelectCode(tax.code)}
                className={
                  "flex flex-col justify-between rounded-2xl border p-4 text-left transition " +
                  (isSelected
                    ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/15"
                    : "border-slate-200 bg-white hover:border-blue-300")
                }
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-extrabold text-slate-900">{tax.code}</span>
                    <span className={"rounded-full border px-2.5 py-0.5 text-[11px] font-bold " + taxBadgeStyle[tax.status]}>
                      {taxLabel[tax.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-600">{tax.title}</p>

                  <div className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Pago mensual estimado</span>
                    <span className={"text-base font-extrabold " + (isCompatible ? "text-blue-600" : "text-slate-400")}>
                      {sim.quotaText}
                    </span>
                  </div>
                </div>

                {/* Visual Limit Meter */}
                <div className="mt-3 pt-2">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>{sim.capLabel}</span>
                    <span>{sim.capPercent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={
                        "h-full rounded-full transition-all " +
                        (sim.capPercent >= 100 && tax.code !== "RG"
                          ? "bg-rose-500"
                          : isCompatible
                          ? "bg-emerald-500"
                          : "bg-amber-400")
                      }
                      style={{ width: `${sim.capPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Regime Explanation Bar */}
        {selectedTax && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-black">{selectedTax.code}</span>
                <div>
                  <h3 className="text-base font-extrabold">{selectedTax.title}</h3>
                  <p className="text-xs text-slate-300">Evaluación del motor de reglas para tu negocio</p>
                </div>
              </div>
              {sourceById(selectedTax.sourceId) && (
                <a
                  href={sourceById(selectedTax.sourceId)?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  Consultar fuente oficial SUNAT ↗
                </a>
              )}
            </div>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {selectedTax.reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2 rounded-xl bg-white/5 p-3 text-xs leading-5 text-slate-200">
                  <span className="font-bold text-blue-400">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Interactive Financial Sliders + Visual Breakdown */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simulador dinámico en soles</span>
            <h2 className="mt-0.5 text-xl font-extrabold text-slate-900">
               Ajusta tus ventas y compras para simular tu impuesto mensual
            </h2>
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
              Restaurar montos de mi cuestionario
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Sliders */}
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Ventas mensuales estimadas</span>
                <span className="text-base font-extrabold text-blue-600">S/ {fmt(sales)} / mes</span>
              </div>
              <input
                type="range"
                min={500}
                max={50000}
                step={500}
                value={Math.min(50000, sales)}
                onChange={(e) => setCustomSales(Number(e.target.value))}
                className="mt-2 w-full cursor-pointer accent-blue-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>S/ 500</span>
                <span>Anual: S/ {fmt(sales * 12)}</span>
                <span>S/ 50,000</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Compras mensuales con factura</span>
                <span className="text-base font-extrabold text-emerald-700">S/ {fmt(purchases)} / mes</span>
              </div>
              <input
                type="range"
                min={0}
                max={40000}
                step={250}
                value={Math.min(40000, purchases)}
                onChange={(e) => setCustomPurchases(Number(e.target.value))}
                className="mt-2 w-full cursor-pointer accent-blue-600"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>S/ 0</span>
                <span>Crédito fiscal IGV: S/ {fmtDec(igvPurchases)}</span>
                <span>S/ 40,000</span>
              </div>
            </div>
          </div>

          {/* Visual IGV & Renta Breakdown Box */}
          <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                ¿Cómo se calcula el IGV y la Renta mensual? (RER / RMT / RG)
              </span>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between rounded-lg bg-white p-2.5">
                  <span className="text-slate-600">1. IGV de tus ventas (18% incluido):</span>
                  <b className="text-slate-900">+ S/ {fmtDec(igvSales)}</b>
                </div>
                <div className="flex justify-between rounded-lg bg-white p-2.5">
                  <span className="text-slate-600">2. Menos IGV de tus compras con factura:</span>
                  <b className="text-emerald-700">− S/ {fmtDec(igvPurchases)}</b>
                </div>
                <div className="flex justify-between rounded-lg border border-blue-200 bg-white p-2.5">
                  <span className="font-bold text-slate-800">= IGV neto a pagar a SUNAT:</span>
                  <b className="text-blue-600">S/ {fmtDec(igvPayable)}</b>
                </div>
                <div className="flex justify-between rounded-lg bg-white p-2.5">
                  <span className="text-slate-600">+ Pago a cuenta de Renta (1% RMT / 1.5% RER):</span>
                  <b className="text-slate-900">
                    S/ {fmtDec(rmtIncomeTax)} a S/ {fmtDec(rerIncomeTax)}
                  </b>
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              * En el <b>Nuevo RUS</b> no se hace este cálculo: solo pagas una cuota fija de <b>S/ 20</b> o <b>S/ 50</b> si no superas S/ 8,000.
            </p>
          </div>
        </div>

        {/* Toggleable Comparison Table */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowFullTable((v) => !v)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {showFullTable ? "Ocultar tabla comparativa completa ↑" : "Ver tabla comparativa completa de los 4 regímenes ↓"}
          </button>

          {showFullTable && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
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
          )}
        </div>
      </section>
    </div>
  );
}

function PracticalToolsTab({ context }: { context: BusinessContext }) {
  const [buyerType, setBuyerType] = useState<"persona" | "empresa">(
    context.customerType === "empresas" ? "empresa" : "persona",
  );
  const [saleAmount, setSaleAmount] = useState<number>(850);
  const [ownerCount, setOwnerCount] = useState<"1" | "socios">(context.hasPartners ? "socios" : "1");
  const [separateAssets, setSeparateAssets] = useState<boolean>(context.legalPerson === "juridica");
  const [rucDigit, setRucDigit] = useState<string>("0");

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

  const recommendedEntity =
    ownerCount === "1" && !separateAssets
      ? {
          code: "Persona Natural con Negocio (RUC 10)",
          desc: "Inscripción digital gratuita e inmediata en SUNAT sin gastos de notaría ni SUNARP. Ideal para empezar rápido.",
          pros: ["Trámite 100% gratuito en SUNAT", "Permite acogerse al Nuevo RUS (cuota de S/ 20 o S/ 50)", "Sin minuta ni escritura pública"],
          note: "Respondes con tu patrimonio personal frente a deudas del negocio.",
        }
      : ownerCount === "1" && separateAssets
      ? {
          code: "E.I.R.L. (Empresa Individual de Responsabilidad Limitada)",
          desc: "Eres el único dueño (sin socios), pero creas una persona jurídica con RUC 20 que separa los bienes de la empresa de tus bienes personales.",
          pros: ["Responsabilidad limitada al capital aportado", "Imagen corporativa con RUC 20 para vender a empresas", "Un solo titular"],
          note: "Requiere reserva de nombre, acto constitutivo en SID-SUNARP, firma en notaría y RUC 20 (No aplica Nuevo RUS).",
        }
      : {
          code: "S.A.C. (Sociedad Anónima Cerrada) o S.R.L.",
          desc: "Para 2 a 20 socios. Permite dividir acciones o participaciones entre los propietarios y protege el patrimonio personal de cada socio.",
          pros: ["De 2 a 20 socios o accionistas", "Patrimonio personal protegido", "Facilita sumar inversión y licitar con empresas o el Estado"],
          note: "Se constituye mediante SID-SUNARP y notaría antes de activar el RUC 20 en SUNAT.",
        };

  return (
    <div className="space-y-6">
      {/* Tool 1: Visual Receipt Simulator (Boleta vs. Factura) */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Herramienta visual 1 · Comprobantes de pago
        </span>
        <h2 className="mt-0.5 text-xl font-extrabold text-slate-900">
          Simulador de emisión: ¿Boleta de Venta o Factura Electrónica?
        </h2>

        <div className="mt-5 grid items-center gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <span className="block text-xs font-bold text-slate-700">1. ¿A quién le estás vendiendo?</span>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBuyerType("persona")}
                  className={
                    "rounded-xl border p-3 text-left text-xs font-bold transition " +
                    (buyerType === "persona"
                      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700")
                  }
                >
                  👤 Consumidor final (Persona)
                </button>
                <button
                  type="button"
                  onClick={() => setBuyerType("empresa")}
                  className={
                    "rounded-xl border p-3 text-left text-xs font-bold transition " +
                    (buyerType === "empresa"
                      ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700")
                  }
                >
                  🏢 Empresa / Entidad con RUC
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">2. Monto total de la operación (S/)</span>
                <span className="text-blue-600">S/ {saleAmount}</span>
              </div>
              <input
                type="number"
                min={1}
                step={50}
                value={saleAmount}
                onChange={(e) => setSaleAmount(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-extrabold text-slate-900 outline-none focus:border-blue-600"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[45, 350, 700, 1500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSaleAmount(val)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50"
                  >
                    Probar S/ {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Visual Receipt Preview */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 font-mono text-xs shadow-sm">
            <div className="border-b border-slate-200 pb-3 text-center">
              <p className="font-sans text-xs font-extrabold uppercase text-slate-900">{context.businessName}</p>
              <span className="mt-1 inline-block rounded-md bg-blue-600 px-2.5 py-0.5 font-sans text-[11px] font-bold text-white">
                {buyerType === "empresa" ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA"}
              </span>
              <p className="mt-1 text-[11px] text-slate-400">{buyerType === "empresa" ? "E001-000124" : "EB01-000458"}</p>
            </div>

            <div className="my-3 space-y-1.5 border-b border-slate-200 pb-3 text-[11px]">
              {buyerType === "empresa" ? (
                <>
                  <p className="flex justify-between">
                    <span className="text-slate-500">RUC Cliente:</span>
                    <b className="text-slate-900">20601234567 (Obligatorio)</b>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Régimen emisor:</span>
                    <b className="text-blue-600">RER / RMT / RG</b>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex justify-between">
                    <span className="text-slate-500">DNI Cliente:</span>
                    <b className={saleAmount >= 700 ? "text-amber-700" : "text-slate-600"}>
                      {saleAmount >= 700 ? "⚠️ OBLIGATORIO (Venta ≥ S/ 700)" : "Opcional (< S/ 700)"}
                    </b>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Régimen emisor:</span>
                    <b className="text-emerald-700">NRUS / RER / RMT / RG</b>
                  </p>
                </>
              )}
            </div>

            <div className="space-y-1 text-right text-xs">
              {buyerType === "empresa" && (
                <>
                  <p className="flex justify-between text-slate-500">
                    <span>Op. Gravada:</span>
                    <span>S/ {(saleAmount / 1.18).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between text-slate-500">
                    <span>IGV (18%):</span>
                    <span>S/ {(saleAmount - saleAmount / 1.18).toFixed(2)}</span>
                  </p>
                </>
              )}
              <p className="flex justify-between border-t border-slate-200 pt-2 font-sans text-sm font-extrabold text-slate-900">
                <span>IMPORTE TOTAL:</span>
                <span className="text-blue-600">S/ {saleAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tool 2: Interactive Legal Entity Selector */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Herramienta visual 2 · Tipo de empresa
          </span>
          <h2 className="mt-0.5 text-xl font-extrabold text-slate-900">
            ¿Persona Natural, E.I.R.L. o S.A.C.?
          </h2>

          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-700">1. ¿Cuántas personas serán dueñas del negocio?</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOwnerCount("1")}
                  className={
                    "rounded-xl border py-2.5 transition " +
                    (ownerCount === "1" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600")
                  }
                >
                  👤 Solo yo (1 dueño)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOwnerCount("socios");
                    setSeparateAssets(true);
                  }}
                  className={
                    "rounded-xl border py-2.5 transition " +
                    (ownerCount === "socios" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600")
                  }
                >
                  👥 2 o más socios
                </button>
              </div>
            </div>

            {ownerCount === "1" && (
              <div>
                <span className="text-xs font-bold text-slate-700">
                  2. ¿Qué priorizas al iniciar?
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSeparateAssets(false)}
                    className={
                      "rounded-xl border p-2.5 transition " +
                      (!separateAssets ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600")
                    }
                  >
                    ⚡ Cero costo notarial (RUC 10 rápido)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeparateAssets(true)}
                    className={
                      "rounded-xl border p-2.5 transition " +
                      (separateAssets ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600")
                    }
                  >
                    🛡️ Separar mi patrimonio (RUC 20)
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                Modalidad recomendada
              </span>
              <h3 className="mt-0.5 text-base font-extrabold text-slate-900">{recommendedEntity.code}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">{recommendedEntity.desc}</p>
              <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                {recommendedEntity.pros.map((p) => (
                  <li key={p}>
                    <span className="font-bold text-emerald-600">✓</span> {p}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 rounded-lg bg-white p-2 text-[11px] text-slate-500">
                <b>Ten en cuenta:</b> {recommendedEntity.note}
              </p>
            </div>
          </div>
        </section>

        {/* Tool 3: SUNAT RUC Calendar */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Herramienta visual 3 · Cronograma SUNAT
              </span>
              <h2 className="mt-0.5 text-xl font-extrabold capitalize text-slate-900">
                Vencimiento según tu RUC ({month})
              </h2>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-3.5">
            <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
              <span>Último dígito de tu RUC:</span>
              <select
                value={rucDigit}
                onChange={(e) => setRucDigit(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-blue-600 outline-none"
              >
                {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <option key={d} value={d}>
                    Terminado en {d}
                  </option>
                ))}
                <option value="BC">Buenos Contribuyentes</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((day) => (
              <b key={day} className="py-1 text-slate-400">
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
                    "grid h-8 place-items-center rounded-lg text-xs " +
                    (isDue
                      ? "bg-amber-400 font-extrabold text-amber-950 ring-2 ring-amber-200"
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
          <p className="mt-3 text-center text-xs text-slate-500">
            Fecha orientativa de declaración mensual resaltada en ámbar: <b>día {suggestedDueDay}</b>.
          </p>
        </section>
      </div>
    </div>
  );
}

export function RouteDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Emprendedor");
  const [context, setContext] = useState<BusinessContext>(defaultDemoContext);
  const [results, setResults] = useState<AppliedRequirement[]>([]);
  const [taxes, setTaxes] = useState<TaxRecommendation[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RequirementStatus>>({});
  const [tab, setTab] = useState<Tab>("Comparar regímenes");
  const [selected, setSelected] = useState<TaxRecommendation["code"]>("NRUS");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExample, setIsExample] = useState(false);
  const [hasSavedUserEvaluation, setHasSavedUserEvaluation] = useState(false);
  const [exploringExample, setExploringExample] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(DEMO_PRESETS[0].id);

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
      const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
      if (!activeId) {
        router.replace("/ingresar?requiere=sesion");
        return;
      }
      const foundAccount = getDemoAccounts().find((a) => a.id === activeId);
      if (foundAccount) setUserName(foundAccount.name);

      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "ruta") setTab("Mi ruta");
      else if (tabParam === "herramientas") setTab("Herramientas prácticas");

      const saved = localStorage.getItem(scopedStorageKey("efp-business-context"));
      const savedStatuses = JSON.parse(localStorage.getItem(scopedStorageKey("efp-requirement-statuses")) || "{}");
      const parsedSaved = saved ? (JSON.parse(saved) as BusinessContext) : null;
      const hasCompleteSaved = Boolean(
        parsedSaved && parsedSaved.questionnaire && Object.keys(parsedSaved.questionnaire).length > 0,
      );
      setHasSavedUserEvaluation(hasCompleteSaved);
      setStatuses(savedStatuses);

      if (hasCompleteSaved && parsedSaved) {
        evaluateContext(parsedSaved, false);
      } else {
        setLoading(false);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [router]);

  const openExamplePreset = (preset: DemoPreset) => {
    setActivePresetId(preset.id);
    setExploringExample(true);
    evaluateContext(preset.context, true);
  };

  const restoreUserEvaluation = () => {
    try {
      const saved = localStorage.getItem(scopedStorageKey("efp-business-context"));
      if (saved) {
        const parsed = JSON.parse(saved) as BusinessContext;
        setExploringExample(false);
        evaluateContext(parsed, false);
      }
    } catch {}
  };

  const startFreshEvaluation = () => {
    try {
      localStorage.removeItem(scopedStorageKey("efp-questionnaire-draft"));
    } catch {}
    router.push("/negocios/nuevo");
  };

  const category = categories.find((item) => item.id === context.sectorId);
  const activity = activities.find((item) => item.id === context.activityId);
  const taxAdvice = useMemo(() => getTaxPath(context), [context]);

  const completed = results.filter((item) => statuses[item.requirementId] === "COMPLETADO").length;
  const progressPercent = results.length > 0 ? Math.round((completed / results.length) * 100) : 0;

  const change = (id: string, status: RequirementStatus) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    localStorage.setItem(scopedStorageKey("efp-requirement-statuses"), JSON.stringify(next));
  };

  // Onboarding Empty State when the logged-in user hasn't evaluated their business yet
  if (!loading && !hasSavedUserEvaluation && !exploringExample) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xs sm:p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-3xl">🚀</span>
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              ¡Hola, {userName}! Comienza el diagnóstico de tu negocio
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              Responde unas breves preguntas sobre tu actividad, ubicación y ventas proyectadas para generar tu recomendación de régimen tributario SUNAT y tu ruta de formalización.
            </p>

            <div className="mt-6">
              <Link
                href="/negocios/nuevo"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:text-base"
              >
                📝 Iniciar cuestionario de mi negocio →
              </Link>
            </div>

            <div className="mt-8 grid gap-4 border-t border-slate-100 pt-7 text-left sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="text-lg">1️⃣</span>
                <h2 className="mt-1 text-xs font-extrabold text-slate-900">4 bloques breves</h2>
                <p className="mt-0.5 text-xs text-slate-500">Preguntas sencillas sin tecnicismos contables.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="text-lg">2️⃣</span>
                <h2 className="mt-1 text-xs font-extrabold text-slate-900">Simulador SUNAT</h2>
                <p className="mt-0.5 text-xs text-slate-500">Compara NRUS, RER, RMT y RG con pagos en soles.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="text-lg">3️⃣</span>
                <h2 className="mt-1 text-xs font-extrabold text-slate-900">Checklist paso a paso</h2>
                <p className="mt-0.5 text-xs text-slate-500">RUC, SUNARP, Licencia Municipal e ITSE.</p>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ¿Solo deseas explorar cómo luce el panel? Abre un caso de ejemplo:
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => openExamplePreset(preset)}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-400 hover:shadow-xs"
                >
                  <div>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {preset.badge}
                    </span>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">{preset.shortTitle}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{preset.summary}</p>
                  </div>
                  <span className="mt-3 text-xs font-bold text-blue-600">Explorar este ejemplo →</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader
        rightActions={
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:inline-block"
          >
            🖨️ Imprimir / PDF
          </button>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
        {/* Only show Example Banner if the user explicitly clicked to view an example preset */}
        {isExample && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-amber-900">👀 Viendo caso de ejemplo:</span>
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => openExamplePreset(preset)}
                  className={
                    "rounded-lg px-2.5 py-1 font-bold transition " +
                    (activePresetId === preset.id
                      ? "bg-amber-900 text-white"
                      : "bg-white text-amber-900 hover:bg-amber-100")
                  }
                >
                  {preset.shortTitle} ({preset.targetRegime})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {hasSavedUserEvaluation && (
                <button
                  type="button"
                  onClick={restoreUserEvaluation}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
                >
                  Volver a mi negocio
                </button>
              )}
              <Link
                href="/negocios/nuevo"
                className="rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-700"
              >
                Evaluar mi propio negocio →
              </Link>
            </div>
          </div>
        )}

        {/* Visual Executive Business Card */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-2xl">
                {category?.icon || "🏢"}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-blue-700">
                    {category?.name || "Mi negocio"}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-slate-700">
                    📍 {[context.district, context.province, context.department].filter(Boolean).join(", ") || "Cajamarca"}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-slate-700">
                    {context.legalPerson === "natural"
                      ? "Persona Natural"
                      : context.legalPerson === "juridica"
                      ? "Persona Jurídica"
                      : "Personería por definir"}
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {context.businessName}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Link
                href="/negocios/nuevo"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                ✎ Editar mis respuestas
              </Link>
              <button
                type="button"
                onClick={startFreshEvaluation}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
              >
                + Nueva evaluación
              </button>
            </div>
          </div>

          {/* 3 Visual KPI Cards inside Executive Header */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setTab("Comparar regímenes")}
              className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left transition hover:bg-emerald-50"
            >
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                  Régimen tributario recomendado
                </span>
                <span className="mt-0.5 block text-lg font-extrabold text-emerald-950">
                  {taxAdvice.code ? `${taxAdvice.code} · ${taxAdvice.title.replace("Primera opción a revisar: ", "")}` : "Revisar opciones"}
                </span>
              </div>
              <span className="text-xl">⚖️</span>
            </button>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Proyección mensual declarada
                </span>
                <span className="mt-0.5 block text-sm font-extrabold text-slate-900">
                  Ventas: S/ {new Intl.NumberFormat("es-PE").format(context.monthlyRevenue)} · Compras: S/{" "}
                  {new Intl.NumberFormat("es-PE").format(context.monthlyPurchases)}
                </span>
                <span className="text-[11px] text-slate-500">
                  {context.needsInvoices ? "Emite Factura y Boleta" : "Emite solo Boleta"}
                </span>
              </div>
              <span className="text-xl">💵</span>
            </div>

            <button
              type="button"
              onClick={() => setTab("Mi ruta")}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left transition hover:border-blue-300"
            >
              <div className="flex w-full items-center justify-between text-xs font-bold">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Progreso de formalización
                </span>
                <span className="text-blue-600">
                  {completed}/{results.length} pasos ({progressPercent}%)
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </button>
          </div>

          {/* 3 Clean Visual Navigation Tabs */}
          <div className="mt-6 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-3 print:hidden">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={
                    "flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold transition sm:text-sm " +
                    (active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <p className="py-16 text-center text-sm font-medium text-slate-500">Actualizando diagnóstico…</p>
        ) : (
          <div className="mt-6">
            {/* TAB 1: DIAGNÓSTICO TRIBUTARIO Y SIMULADOR */}
            {tab === "Comparar regímenes" && (
              <VisualTaxSimulator
                context={context}
                taxes={taxes}
                selectedCode={selected}
                onSelectCode={setSelected}
              />
            )}

            {/* TAB 2: RUTA DE FORMALIZACIÓN PASO A PASO */}
            {tab === "Mi ruta" && (
              <div className="space-y-6">
                {/* 3 Concise Visual Orientation Cards */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      🏷️ Código CIIU referencial
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {activity && activity.ciiu !== "0000" ? `${activity.ciiu} · ${activity.name}` : "Por confirmar en SUNAT"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Para registrar tu actividad económica en el RUC.</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      🏛️ Ruta de personería
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {context.legalPerson === "juridica"
                        ? "SUNARP (Notaría) → RUC 20 SUNAT"
                        : "Inscripción directa RUC 10 SUNAT"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {context.legalPerson === "juridica"
                        ? "Primero constituyes la empresa y luego activas el RUC."
                        : "Sin trámite notarial; te inscribes gratis con tu DNI."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      📍 Entidad municipal
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      Municipalidad de {context.district || "Cajamarca"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {context.hasPhysicalLocation
                        ? "Requiere Licencia de Funcionamiento e inspección ITSE."
                        : "Sin local abierto al público."}
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Interactive Roadmap */}
                <section id="ruta" className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">
                        Checklist de trámites de tu negocio ({completed} de {results.length} listos)
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Haz clic en el círculo de cada paso para marcarlo como completado, o abre su guía práctica.
                      </p>
                    </div>
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
                            <div className="flex min-w-0 flex-1 items-start gap-3.5">
                              <button
                                type="button"
                                onClick={() =>
                                  change(req.id, status === "COMPLETADO" ? "PENDIENTE" : "COMPLETADO")
                                }
                                title="Marcar como completado"
                                className={
                                  "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold transition " +
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
                                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                    Paso {index + 1} · {req.category}
                                  </span>
                                  <span className="text-xs font-medium text-slate-400">{req.institution}</span>
                                </div>
                                <h3 className="mt-1 text-base font-extrabold text-slate-900">{req.title}</h3>
                                <p className="mt-0.5 text-xs text-slate-600">{req.description}</p>
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
                                <option value="COMPLETADO">Completado ✓</option>
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
                                {isOpen ? "Ocultar guía" : "Cómo hacerlo ↓"}
                              </button>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                              <PracticalGuidePanel requirementId={req.id} context={context} />
                              {source && (
                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                                  <span className="text-slate-500"> Motivo: {item.reason}</span>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-blue-600 underline"
                                  >
                                    Ver enlace oficial ({source.institution}) ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 3: HERRAMIENTAS INTERACTIVAS */}
            {tab === "Herramientas prácticas" && <PracticalToolsTab context={context} />}
          </div>
        )}
      </main>
    </div>
  );
}

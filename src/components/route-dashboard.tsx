"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { categories, requirementById, rules, sourceById, sources } from "@/lib/seed-catalog";
import { RuleEngine } from "@/lib/rule-engine";
import type { AppliedRequirement, BusinessContext, RequirementStatus, TaxRecommendation } from "@/lib/types";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS } from "@/lib/demo-presets";
import { getTaxPath } from "@/lib/practical-guides";
import { BusinessSetupAdvicePanel, LegalFormRecommendationPanel, PracticalGuidePanel, TaxPathPanel } from "@/components/practical-guide-panel";

const defaultDemoContext: BusinessContext = DEMO_PRESETS[0].context;

const taxLabel = {
  COMPATIBLE: "Cumple lo evaluado",
  INCOMPATIBLE: "No compatible",
  INFORMACION_INSUFICIENTE: "Por verificar",
} as const;

const taxColor = {
  COMPATIBLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  INCOMPATIBLE: "bg-rose-100 text-rose-800 border-rose-200",
  INFORMACION_INSUFICIENTE: "bg-amber-100 text-amber-900 border-amber-200",
} as const;

const tabs = [
  "Mi ruta",
  "Comparar regímenes",
  "Mis obligaciones",
  "Herramientas prácticas",
] as const;
type Tab = (typeof tabs)[number];

const documentGuides: Record<string, { purpose: string; where: string; how: string; example: string; visual: string; url: string; link: string }> = {
  DNI: {
    purpose: "Sirve para confirmar tu identidad cuando sacas el RUC de tu negocio.",
    where: "SUNAT. Si eres persona natural, puedes iniciar el trámite desde la app Personas SUNAT.",
    how: "Ten tu DNI vigente a la mano. Si lo haces por la app, no necesitas llevarlo a una oficina.",
    example: "Es como cuando muestras tu DNI para confirmar que una cuenta o trámite es tuyo.",
    visual: "Tu DNI",
    url: "https://www.gob.pe/284-sacar-ruc-persona-natural",
    link: "Ver cómo sacar el RUC",
  },
  "Actividad económica": {
    purpose: "Es contar en palabras simples qué harás en tu negocio para que SUNAT lo registre correctamente.",
    where: "SUNAT, al inscribir o actualizar el RUC.",
    how: "No es un papel para llevar: describe tu actividad. Por ejemplo: “organizo tours en Cajamarca y acompaño a los visitantes”.",
    example: "En vez de escribir solo “turismo”, cuenta qué servicio ofrecerás y a quién.",
    visual: "¿Qué harás?",
    url: "https://centrovirtual.sunat.gob.pe/tramites/inscribete-ruc",
    link: "Ver qué declarar en el RUC",
  },
  "Domicilio fiscal": {
    purpose: "Es la dirección que registras para que SUNAT sepa dónde ubicar tu negocio en sus registros.",
    where: "SUNAT, al inscribir o actualizar tu RUC.",
    how: "Ten clara la dirección completa. Si es distinta a la de tu DNI y haces el trámite presencial, podrían pedirte un documento donde aparezca esa dirección.",
    example: "Por ejemplo: la dirección desde donde atiendes o administras el negocio.",
    visual: "La dirección",
    url: "https://www.gob.pe/284-sacar-ruc-persona-natural",
    link: "Ver requisitos para sacar el RUC",
  },
  "Proyección de ingresos y compras": {
    purpose: "Te ayuda a comparar los regímenes y pensar cuál podría ajustarse a tu negocio.",
    where: "Es información para preparar tu decisión antes de elegir régimen en SUNAT; normalmente no se entrega como documento.",
    how: "Anota un cálculo aproximado por mes. Ejemplo: espero cobrar S/ 4,000 y gastar S/ 1,400 en productos, ingredientes o materiales.",
    example: "No tiene que ser exacto: sirve para comparar opciones y luego confirmar cuál te corresponde.",
    visual: "Ingresos − compras",
    url: "https://centrovirtual.sunat.gob.pe/tramites/inscribete-ruc",
    link: "Ver qué considerar antes de elegir régimen",
  },
  "Datos del proveedor": {
    purpose: "Son los datos de tu negocio que deben aparecer en el Libro de Reclamaciones para que tus clientes sepan quién les vendió o brindó el servicio.",
    where: "En el Libro de Reclamaciones de tu negocio. No se llevan a SUNAT ni se registra el libro ante Indecopi.",
    how: "Cuando tengas tu negocio registrado, coloca su nombre, RUC y dirección en el Libro de Reclamaciones.",
    example: "Es parecido a poner los datos de tu negocio en un letrero de atención al cliente.",
    visual: "Libro de reclamos",
    url: "https://consumidor.gob.pe/libro-de-reclamaciones/",
    link: "Ver guía de Indecopi",
  },
};

function ReferenceIllustration({ kind, label }: { kind: string; label: string }) {
  const art: Record<string, ReactNode> = {
    DNI: (
      <>
        <rect x="8" y="12" width="48" height="34" rx="4" fill="#fff" stroke="#1464f6" strokeWidth="2" />
        <circle cx="20" cy="26" r="6" fill="#cfe2ff" />
        <path d="M12 40c1.5-6 14.5-6 16 0" fill="#cfe2ff" />
        <path d="M34 23h15M34 29h12M34 35h10" stroke="#7a91b5" strokeWidth="2" strokeLinecap="round" />
        <text x="11" y="18" fontSize="5" fill="#1464f6" fontWeight="700">
          IDENTIDAD
        </text>
      </>
    ),
    "Actividad económica": (
      <>
        <rect x="15" y="9" width="34" height="40" rx="4" fill="#fff" stroke="#1464f6" strokeWidth="2" />
        <path d="M22 21h20M22 28h20M22 35h16" stroke="#7a91b5" strokeWidth="2" strokeLinecap="round" />
        <path d="M39 42l4 4 8-9" fill="none" stroke="#12a879" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    "Domicilio fiscal": (
      <>
        <path d="M32 49s17-17 17-28a17 17 0 1 0-34 0c0 11 17 28 17 28Z" fill="#dcebff" stroke="#1464f6" strokeWidth="2" />
        <circle cx="32" cy="21" r="6" fill="#fff" stroke="#1464f6" strokeWidth="2" />
        <path d="M22 53h20" stroke="#7a91b5" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    "Proyección de ingresos y compras": (
      <>
        <rect x="14" y="10" width="36" height="42" rx="5" fill="#fff" stroke="#1464f6" strokeWidth="2" />
        <rect x="20" y="16" width="24" height="8" rx="2" fill="#e8f1ff" />
        <path d="M22 31h5m7 0h5M22 38h5m7 0h5M22 45h5m7 0h5" stroke="#1464f6" strokeWidth="3" strokeLinecap="round" />
        <text x="25" y="22" fontSize="7" fill="#10295b">
          S/
        </text>
      </>
    ),
    "Datos del proveedor": (
      <>
        <rect x="12" y="17" width="40" height="31" rx="3" fill="#fff" stroke="#1464f6" strokeWidth="2" />
        <path d="M12 25h40M20 17v-5h24v5" fill="none" stroke="#1464f6" strokeWidth="2" />
        <path d="M20 32h24M20 38h18" stroke="#7a91b5" strokeWidth="2" strokeLinecap="round" />
        <path d="m45 41 3 3 6-7" fill="none" stroke="#12a879" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };
  return (
    <div className="flex h-28 items-center gap-4 rounded-xl bg-gradient-to-r from-blue-50 to-white px-4">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="h-16 w-16 shrink-0">
        {art[kind] || (
          <>
            <rect x="14" y="10" width="36" height="44" rx="5" fill="#fff" stroke="#1464f6" strokeWidth="2" />
            <path d="M22 23h20M22 31h20M22 39h14" stroke="#7a91b5" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1464f6]">Ejemplo visual</span>
        <p className="font-bold text-[#10295b]">{label}</p>
        <p className="text-xs text-slate-500">Ilustración orientativa</p>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: RequirementStatus }) {
  return (
    <span
      className={
        "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white " +
        (status === "COMPLETADO" ? "bg-emerald-500" : status === "EN_PROCESO" ? "bg-[#1464f6]" : "bg-slate-300")
      }
    >
      {status === "COMPLETADO" ? "✓" : status === "EN_PROCESO" ? "◐" : "·"}
    </span>
  );
}

function TaxPaymentSimulator({ context }: { context: BusinessContext }) {
  const [customSales, setCustomSales] = useState<number | null>(null);
  const [customPurchases, setCustomPurchases] = useState<number | null>(null);
  const sales = customSales ?? (context.monthlyRevenue > 0 ? context.monthlyRevenue : 4200);
  const purchases = customPurchases ?? (context.monthlyPurchases > 0 ? context.monthlyPurchases : 1800);
  const fmt = (n: number) => new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.max(0, n));
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
    <section className="mt-7 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm" aria-labelledby="tax-sim-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1464f6]">Simulador pedagógico interactivo</p>
          <h2 id="tax-sim-title" className="mt-1 text-2xl font-black">
            Simula tus pagos mensuales aproximados ante SUNAT
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ajusta tus ventas y tus compras con factura para observar cómo varía la cuota fija o el IGV + Impuesto a la Renta en cada régimen.
          </p>
        </div>
        {(customSales !== null || customPurchases !== null) && (
          <button
            type="button"
            onClick={() => {
              setCustomSales(null);
              setCustomPurchases(null);
            }}
            className="rounded-xl border border-blue-200 px-3.5 py-2 text-xs font-bold text-[#1464f6] hover:bg-blue-50"
          >
            Restaurar montos del negocio
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl bg-blue-50/60 p-4 sm:grid-cols-2">
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#10295b]">Ventas mensuales estimadas (S/)</span>
            <span className="text-xs font-semibold text-slate-500">Anual: S/ {fmt(sales * 12)}</span>
          </div>
          <input
            type="number"
            min={0}
            step={100}
            value={sales}
            onChange={(e) => setCustomSales(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-lg font-bold text-[#10295b] outline-none focus:border-[#1464f6]"
          />
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={Math.min(50000, sales)}
            onChange={(e) => setCustomSales(Number(e.target.value))}
            className="mt-2 w-full accent-[#1464f6]"
          />
        </label>
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#10295b]">Compras mensuales con factura (S/)</span>
            <span className="text-xs font-semibold text-emerald-700">Crédito fiscal IGV: S/ {fmt(igvPurchases)}</span>
          </div>
          <input
            type="number"
            min={0}
            step={100}
            value={purchases}
            onChange={(e) => setCustomPurchases(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1.5 w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-lg font-bold text-[#10295b] outline-none focus:border-[#1464f6]"
          />
          <input
            type="range"
            min={0}
            max={40000}
            step={250}
            value={Math.min(40000, purchases)}
            onChange={(e) => setCustomPurchases(Number(e.target.value))}
            className="mt-2 w-full accent-[#1464f6]"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={"rounded-2xl border p-4 " + (nrusAllowed ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50/70")}>
          <div className="flex items-center justify-between">
            <span className="font-black text-[#10295b]">Nuevo RUS</span>
            <span className={"rounded-full px-2.5 py-0.5 text-xs font-bold " + (nrusAllowed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
              {nrusAllowed ? (nrusQuota === 20 ? "Categoría 1" : "Categoría 2") : "No aplicable"}
            </span>
          </div>
          {nrusAllowed ? (
            <>
              <p className="mt-3 text-3xl font-black text-[#1464f6]">S/ {fmt(nrusQuota)}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Cuota fija mensual única (incluye IGV y Renta)</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">
                Hasta S/ 5,000 pagas S/ 20; de S/ 5,001 a S/ 8,000 pagas S/ 50. No lleva libros contables ni declaración anual.
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-rose-800">
              {sales > 8000 || purchases > 8000
                ? "Supera el tope mensual de S/ 8,000 del Nuevo RUS."
                : context.legalPerson === "juridica"
                ? "No aplica a personas jurídicas (empresas)."
                : "No aplica si necesitas emitir facturas comerciales."}
            </p>
          )}
        </article>

        <article className={"rounded-2xl border p-4 " + (rerAllowed ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-slate-50/70")}>
          <div className="flex items-center justify-between">
            <span className="font-black text-[#10295b]">RER</span>
            <span className={"rounded-full px-2.5 py-0.5 text-xs font-bold " + (rerAllowed ? "bg-blue-100 text-[#1464f6]" : "bg-rose-100 text-rose-800")}>
              {rerAllowed ? "1.5% Renta + IGV" : "Supera tope anual"}
            </span>
          </div>
          <p className="mt-3 text-3xl font-black text-[#1464f6]">S/ {fmt(rerIncomeTax + igvPayable)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Renta (1.5%): S/ {fmt(rerIncomeTax)} · IGV neto: S/ {fmt(igvPayable)}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            Pago definitivo mensual sin Declaración Anual. Tope anual de S/ 525,000 y máx. 10 trabajadores por turno.
          </p>
        </article>

        <article className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-[#10295b]">RMT (MYPE)</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#1464f6]">1.0% Renta + IGV</span>
          </div>
          <p className="mt-3 text-3xl font-black text-[#1464f6]">S/ {fmt(rmtIncomeTax + igvPayable)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Pago a cuenta Renta: S/ {fmt(rmtIncomeTax)} · IGV neto: S/ {fmt(igvPayable)}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            Admite cualquier actividad económica y regulariza Renta Anual sobre tu ganancia neta (10% primeras 15 UIT; 29.5% exceso).
          </p>
        </article>

        <article className="rounded-2xl border border-blue-100 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-[#10295b]">Régimen General</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#1464f6]">1.5% Renta + IGV</span>
          </div>
          <p className="mt-3 text-3xl font-black text-[#1464f6]">S/ {fmt(rgIncomeTax + igvPayable)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Pago a cuenta Renta: S/ {fmt(rgIncomeTax)} · IGV neto: S/ {fmt(igvPayable)}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            Sin límite de ingresos ni compras. Regularización anual del 29.5% sobre la utilidad neta del ejercicio.
          </p>
        </article>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Nota: El cálculo asume operaciones gravadas con IGV (18%) y descuenta el crédito fiscal de tus compras con factura. Es un simulador educativo orientativo y no reemplaza la liquidación contable ante SUNAT.
      </p>
    </section>
  );
}

function TaxComparisonTable() {
  const rows = [
    ["¿Quiénes pueden acogerse?", "Solo Persona Natural", "Persona Natural o Jurídica", "Persona Natural o Jurídica", "Persona Natural o Jurídica"],
    ["Límite de ingresos anuales", "Hasta S/ 96,000 (máx. S/ 8,000/mes)", "Hasta S/ 525,000 al año", "Hasta 1,700 UIT al año", "Sin límite"],
    ["Límite de compras anuales", "Hasta S/ 96,000 (máx. S/ 8,000/mes)", "Hasta S/ 525,000 al año", "Sin límite", "Sin límite"],
    ["Comprobantes que emite", "Boleta de venta y tickets (No emite Factura)", "Factura, boleta y todos los permitidos", "Factura, boleta y todos los permitidos", "Factura, boleta y todos los permitidos"],
    ["Pago mensual", "Cuota fija: S/ 20 (Cat. 1) o S/ 50 (Cat. 2)", "Renta: 1.5% ingresos netos + IGV (18%)", "Renta: 1% (hasta 300 UIT) + IGV (18%)", "Renta: 1.5% o coeficiente + IGV (18%)"],
    ["Declaración Jurada Anual", "No presenta", "No presenta", "Sí (10% hasta 15 UIT de utilidad; 29.5% exceso)", "Sí (29.5% sobre utilidad neta)"],
    ["Límite de activos fijos", "Hasta S/ 70,000 (sin contar predios ni vehículos)", "Hasta S/ 126,000 (sin contar predios ni vehículos)", "Sin límite", "Sin límite"],
    ["Límite de trabajadores", "Sin límite fijo", "Máximo 10 por turno", "Sin límite", "Sin límite"],
    ["Libros contables", "Ninguno (solo archivar comprobantes)", "Registro de Compras y Registro de Ventas", "Según ingresos (Compras, Ventas, Diario Simplificado)", "Según ingresos (hasta contabilidad completa)"],
  ];
  return (
    <section className="mt-7 overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 shadow-sm" aria-labelledby="comparison-table-title">
      <h2 id="comparison-table-title" className="text-2xl font-bold">
        Cuadro comparativo resumen de regímenes SUNAT
      </h2>
      <p className="mt-1 text-sm text-slate-600">Compara de un vistazo las reglas y límites generales de cada régimen tributario empresarial.</p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-blue-100 bg-blue-50/70 text-[#10295b]">
              <th className="p-3.5 font-bold">Criterio</th>
              <th className="p-3.5 font-bold">Nuevo RUS (NRUS)</th>
              <th className="p-3.5 font-bold">Régimen Especial (RER)</th>
              <th className="p-3.5 font-bold">MYPE Tributario (RMT)</th>
              <th className="p-3.5 font-bold">Régimen General (RG)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([criterion, nrus, rer, rmt, rg]) => (
              <tr key={criterion} className="hover:bg-blue-50/30">
                <td className="p-3.5 font-semibold text-[#10295b]">{criterion}</td>
                <td className="p-3.5 text-slate-700">{nrus}</td>
                <td className="p-3.5 text-slate-700">{rer}</td>
                <td className="p-3.5 text-slate-700">{rmt}</td>
                <td className="p-3.5 text-slate-700">{rg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PracticalToolsTab({ context }: { context: BusinessContext }) {
  const [buyerType, setBuyerType] = useState<"persona" | "empresa">(context.customerType === "empresas" ? "empresa" : "persona");
  const [saleAmount, setSaleAmount] = useState<number>(850);
  const [entityType, setEntityType] = useState<"natural" | "eirl" | "srl" | "sac">(context.legalPerson === "juridica" ? "sac" : "natural");
  const [areaSize, setAreaSize] = useState<"menor100" | "100a500" | "mayor500">("menor100");
  const [hasHighRiskFactor, setHasHighRiskFactor] = useState<boolean>(false);

  const entityDetails = {
    natural: {
      title: "Persona Natural con Negocio",
      owners: "1 sola persona (tú mismo)",
      liability: "Ilimitada: respondes con tu patrimonio personal ante deudas del negocio.",
      constitution: "Inscripción gratuita de RUC 10 en SUNAT Virtual o App Personas. No requiere minuta ni SUNARP.",
      regimes: "Puede acogerse a Nuevo RUS, RER, RMT o Régimen General.",
      idealFor: "Bodegas, cafeterías, servicios personales, comercios pequeños que inician rápido y sin socios.",
    },
    eirl: {
      title: "E.I.R.L. (Empresa Individual de Responsabilidad Limitada)",
      owners: "1 solo titular (no admite socios)",
      liability: "Limitada al patrimonio aportado a la empresa.",
      constitution: "Minuta + Escritura Pública en Notaría + Inscripción en SID-SUNARP + RUC 20 en SUNAT.",
      regimes: "RER, RMT o Régimen General (No puede usar Nuevo RUS).",
      idealFor: "Emprendedores individuales que desean separar su patrimonio personal y vender a empresas con RUC 20.",
    },
    srl: {
      title: "S.R.L. (Sociedad Comercial de Responsabilidad Limitada)",
      owners: "De 2 a 20 socios",
      liability: "Limitada al capital aportado por los socios (participaciones iguales, sin acciones).",
      constitution: "Constitución por SID-SUNARP + Notaría + RUC 20 en SUNAT.",
      regimes: "RER, RMT o Régimen General.",
      idealFor: "Negocios familiares o de pocos socios de confianza en Cajamarca.",
    },
    sac: {
      title: "S.A.C. (Sociedad Anónima Cerrada)",
      owners: "De 2 a 20 accionistas",
      liability: "Limitada al aporte de capital representado en acciones. Directorio opcional.",
      constitution: "Constitución por SID-SUNARP + Notaría + RUC 20 en SUNAT.",
      regimes: "RER, RMT o Régimen General.",
      idealFor: "Empresas con socios que proyectan crecer, licitar con el Estado o incorporar inversionistas.",
    },
  }[entityType];

  return (
    <div className="mt-6 space-y-6">
      {/* Tool 1: Asistente de Comprobantes de Pago */}
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1464f6]">Herramienta interactiva 1</p>
            <h2 className="mt-1 text-2xl font-black">Asistente de Comprobantes de Pago (¿Boleta o Factura?)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Simula una venta para saber qué comprobante emitir y qué datos exige SUNAT (incluyendo la regla de identificación a partir de S/ 700).
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1464f6]">Reglamento de Comprobantes SUNAT</span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <span className="block text-sm font-bold text-[#10295b]">1. ¿Quién te compra en esta operación?</span>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBuyerType("persona")}
                  className={
                    "rounded-xl border px-4 py-3 text-sm font-bold transition " +
                    (buyerType === "persona" ? "border-[#1464f6] bg-blue-50 text-[#1464f6]" : "border-slate-200 bg-white text-slate-600")
                  }
                >
                  Consumidor final (Persona)
                </button>
                <button
                  type="button"
                  onClick={() => setBuyerType("empresa")}
                  className={
                    "rounded-xl border px-4 py-3 text-sm font-bold transition " +
                    (buyerType === "empresa" ? "border-[#1464f6] bg-blue-50 text-[#1464f6]" : "border-slate-200 bg-white text-slate-600")
                  }
                >
                  Empresa o entidad con RUC
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-[#10295b]">2. Monto total de la operación (S/)</span>
              <input
                type="number"
                min={1}
                step={50}
                value={saleAmount}
                onChange={(e) => setSaleAmount(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-[#10295b] outline-none focus:border-[#1464f6]"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[35, 250, 700, 1200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSaleAmount(val)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-[#1464f6] hover:bg-blue-50"
                  >
                    Probar S/ {val}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-5">
            <div>
              <span className="inline-block rounded-full bg-[#1464f6] px-3 py-1 text-xs font-bold text-white">
                {buyerType === "empresa" ? "Emitir: FACTURA ELECTRÓNICA" : "Emitir: BOLETA DE VENTA"}
              </span>
              <h3 className="mt-3 text-xl font-black text-[#10295b]">
                {buyerType === "empresa"
                  ? "Factura Electrónica (Sustenta gasto/costo y crédito fiscal)"
                  : saleAmount >= 700
                  ? "Boleta de Venta con identificación obligatoria del cliente"
                  : "Boleta de Venta simple a consumidor final"}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {buyerType === "empresa" ? (
                  <>
                    <li>
                      • <b>Dato obligatorio:</b> Número de RUC activo y razón social del cliente empresarial.
                    </li>
                    <li>
                      • <b>Régimen requerido:</b> Debes estar en <b>RER, RMT o Régimen General</b> (el Nuevo RUS no permite emitir facturas).
                    </li>
                    <li>
                      • <b>Desglose:</b> Base imponible: <b>S/ {(saleAmount / 1.18).toFixed(2)}</b> + IGV (18%): <b>S/ {(saleAmount - saleAmount / 1.18).toFixed(2)}</b>.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      • <b>Regla de los S/ 700:</b>{" "}
                      {saleAmount >= 700 ? (
                        <span className="font-bold text-amber-900">
                          Como la venta es de S/ 700 o más (S/ {saleAmount}), es OBLIGATORIO consignar el DNI y nombres completos del comprador.
                        </span>
                      ) : (
                        <span>Como el importe es menor a S/ 700, no es obligatorio colocar el DNI del comprador (salvo que el cliente lo solicite).</span>
                      )}
                    </li>
                    <li>
                      • <b>Régimen permitido:</b> Puedes emitirla desde <b>Nuevo RUS, RER, RMT o Régimen General</b>.
                    </li>
                    <li>• <b>Emisión gratuita:</b> Puedes emitirla desde el Portal SOL o la App Emprender de SUNAT.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tool 2: Comparador de Tipo de Empresa */}
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1464f6]">Herramienta interactiva 2</p>
        <h2 className="mt-1 text-2xl font-black">Comparador de Forma Legal (Persona Natural vs. E.I.R.L. vs. S.R.L. vs. S.A.C.)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona cada modalidad para comparar cantidad de socios, protección patrimonial y trámites de constitución.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {([
            ["natural", "Persona Natural"],
            ["eirl", "E.I.R.L."],
            ["srl", "S.R.L."],
            ["sac", "S.A.C."],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setEntityType(key)}
              className={
                "rounded-2xl border px-4 py-3.5 text-sm font-bold transition " +
                (entityType === key ? "border-[#1464f6] bg-[#1464f6] text-white shadow-sm" : "border-slate-200 bg-slate-50 text-[#10295b] hover:border-blue-300")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <h3 className="text-xl font-black text-[#10295b]">{entityDetails.title}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4">
              <span className="text-xs font-bold uppercase text-[#1464f6]">Propietarios / Socios</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{entityDetails.owners}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <span className="text-xs font-bold uppercase text-[#1464f6]">Responsabilidad patrimonial</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{entityDetails.liability}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <span className="text-xs font-bold uppercase text-[#1464f6]">Pasos de registro</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{entityDetails.constitution}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <span className="text-xs font-bold uppercase text-[#1464f6]">Regímenes tributarios admitidos</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{entityDetails.regimes}</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-white p-3.5 text-sm text-slate-700">
            <b className="text-[#10295b]">¿Cuándo suele convenir?</b> {entityDetails.idealFor}
          </p>
        </div>
      </section>

      {/* Tool 3: Pre-evaluador de Licencia Municipal + ITSE */}
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1464f6]">Herramienta interactiva 3</p>
        <h2 className="mt-1 text-2xl font-black">Orientador de Nivel de Riesgo ITSE y Licencia Municipal</h2>
        <p className="mt-1 text-sm text-slate-600">
          En la Municipalidad Provincial de Cajamarca y municipalidades distritales, el plazo y requisito de inspección ITSE dependen del nivel de riesgo del establecimiento.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <span className="block text-sm font-bold text-[#10295b]">1. Área techada aproximada del local</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  ["menor100", "Hasta 100 m²"],
                  ["100a500", "100 a 500 m²"],
                  ["mayor500", "Más de 500 m²"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAreaSize(key)}
                    className={
                      "rounded-xl border px-3 py-2.5 text-xs font-bold transition " +
                      (areaSize === key ? "border-[#1464f6] bg-blue-50 text-[#1464f6]" : "border-slate-200 bg-white text-slate-600")
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-bold text-[#10295b]">
                2. ¿Usa balón de GLP mayor a 45 kg, calderos, insumos inflamables o gran aforo público?
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasHighRiskFactor(false)}
                  className={
                    "rounded-xl border px-4 py-2.5 text-xs font-bold transition " +
                    (!hasHighRiskFactor ? "border-[#1464f6] bg-blue-50 text-[#1464f6]" : "border-slate-200 bg-white text-slate-600")
                  }
                >
                  No (Comercio / oficina estándar)
                </button>
                <button
                  type="button"
                  onClick={() => setHasHighRiskFactor(true)}
                  className={
                    "rounded-xl border px-4 py-2.5 text-xs font-bold transition " +
                    (hasHighRiskFactor ? "border-[#1464f6] bg-blue-50 text-[#1464f6]" : "border-slate-200 bg-white text-slate-600")
                  }
                >
                  Sí (Mayor exigencia técnica)
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            {areaSize !== "mayor500" && !hasHighRiskFactor ? (
              <>
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  Orientación: Riesgo Bajo o Medio (ITSE Posterior)
                </span>
                <h3 className="mt-3 text-lg font-black text-[#10295b]">Licencia de aprobación rápida con inspección posterior</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Para locales pequeños o medianos sin factores críticos, la municipalidad suele clasificar el giro como <b>Riesgo Bajo o Medio</b>:
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <li>• Presentas una <b>Declaración Jurada de Cumplimiento de Condiciones de Seguridad</b>.</li>
                  <li>• Se emite la Licencia de Funcionamiento y luego el inspector visita tu local para verificar extintor vigente, luces de emergencia, botiquín y señalética.</li>
                </ul>
              </>
            ) : (
              <>
                <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  Orientación: Riesgo Alto o Muy Alto (ITSE Previa)
                </span>
                <h3 className="mt-3 text-lg font-black text-[#10295b]">Requiere inspección técnica antes de otorgar la licencia</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Por el tamaño o factores de riesgo, la municipalidad puede exigir <b>ITSE Previa</b>:
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <li>• Debes adjuntar planos de arquitectura, instalaciones eléctricas, plan de seguridad y certificados vigentes.</li>
                  <li>• Los inspectores verifican el local <b>antes</b> de que se emita la Licencia de Funcionamiento.</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
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
  const [showDocuments, setShowDocuments] = useState(false);
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
      const saved = localStorage.getItem(scopedStorageKey("efp-business-context"));
      const savedStatuses = JSON.parse(localStorage.getItem(scopedStorageKey("efp-requirement-statuses")) || "{}");
      const parsedSaved = saved ? (JSON.parse(saved) as BusinessContext) : null;
      const hasCompleteSaved = Boolean(parsedSaved && parsedSaved.questionnaire && Object.keys(parsedSaved.questionnaire).length > 0);
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
  const preparingToStart = ["Solo tengo la idea", "Estoy preparando el negocio"].includes(String(context.questionnaire?.P03 || ""));

  const documentList = useMemo(
    () => [...new Set(results.flatMap((item) => requirementById(item.requirementId)?.documents || []))].sort((a, b) => a.localeCompare(b, "es")),
    [results],
  );
  const documentReferences = useMemo(
    () =>
      documentList.map((document) => {
        const linked = results
          .map((item) => ({ item, requirement: requirementById(item.requirementId) }))
          .filter((entry) => entry.requirement?.documents.includes(document));
        const guide = documentGuides[document];
        const firstSource = linked[0] ? sourceById(linked[0].item.sourceId) : undefined;
        return {
          document,
          linked,
          guide,
          url: guide?.url || firstSource?.url,
          link: guide?.link || firstSource?.title || "Consultar fuente oficial",
        };
      }),
    [documentList, results],
  );

  const counts = useMemo(
    () => ({
      steps: results.length,
      entities: new Set(results.map((item) => requirementById(item.requirementId)?.institution).filter(Boolean)).size,
      documents: documentList.length,
    }),
    [results, documentList],
  );

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
  const rucDayOffset: Record<string, number> = { "0": 14, "1": 15, "2": 16, "3": 16, "4": 17, "5": 17, "6": 18, "7": 18, "8": 19, "9": 19, BC: 22 };
  const suggestedDueDay = Math.min(last, rucDayOffset[rucDigit] || 15);

  return (
    <main className="min-h-screen bg-[#edf5fb] text-[#071c56]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[260px_1fr]">
        {/* Left Navigation Sidebar */}
        <aside className="hidden flex-col bg-[#102542] px-5 py-8 text-white lg:flex print:hidden">
          <Link href="/" className="px-4 text-4xl font-black tracking-tight text-white">
            Crea
          </Link>
          <p className="mt-1 px-4 text-xs font-medium text-blue-200">Formalización y Regímenes SUNAT</p>

          <nav className="mt-10 space-y-1.5">
            <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-blue-300/80">Panel de diagnóstico</p>
            {([
              ["Mi ruta paso a paso", "Mi ruta", "☷"],
              ["Régimen y simulador", "Comparar regímenes", "⚖"],
              ["Cronograma y tareas", "Mis obligaciones", "▢"],
              ["Herramientas prácticas", "Herramientas prácticas", "✦"],
            ] as const).map(([label, targetTab, icon]) => (
              <button
                key={targetTab}
                type="button"
                onClick={() => setTab(targetTab)}
                className={
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition " +
                  (tab === targetTab ? "bg-[#1464f6] font-bold text-white shadow-md" : "text-blue-100 hover:bg-white/10")
                }
              >
                <span aria-hidden="true" className="text-base">
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            ))}

            <div className="my-5 border-t border-white/10 pt-5">
              <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-blue-300/80">Navegación</p>
              <Link href="/negocios/nuevo" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-white/10">
                <span>✎</span> Ir al cuestionario
              </Link>
              <Link href="/negocios" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10">
                <span>▣</span> Mi espacio
              </Link>
              <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10">
                <span>⌂</span> Inicio
              </Link>
            </div>
          </nav>

          <div className="mt-auto rounded-2xl bg-white/10 p-4 text-xs leading-5 text-blue-100">
            <b className="block text-white">Orientación trazable</b>
            Basado en reglas de decisión verificables con SUNAT, SUNARP, Municipalidades e Indecopi.
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-white px-5 py-4 sm:px-10 print:hidden">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl font-black text-[#0a318c] lg:hidden">
                Crea
              </Link>
              <span className="hidden text-sm font-semibold text-slate-500 sm:inline">
                {isExample ? "Modo de demostración interactiva" : "Diagnóstico personalizado de tu negocio"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isExample && (
                <button
                  type="button"
                  onClick={() => switchPreset(DEMO_PRESETS[0].id)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Ver casos de ejemplo
                </button>
              )}
              {isExample && hasSavedUserEvaluation && (
                <button
                  type="button"
                  onClick={restoreUserEvaluation}
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Volver a mi evaluación guardada
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-[#10295b] hover:bg-slate-50"
              >
                Imprimir / PDF
              </button>
              <Link href="/negocios/nuevo" className="rounded-xl bg-[#1464f6] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                {isExample ? "Evaluar mi propio negocio →" : "Editar mis respuestas"}
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-7 sm:px-10">
            {/* Compact Demo Scenario Selector Bar */}
            {isExample && (
              <section className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-sm print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1464f6]">
                    ✦ Casos demo:
                  </span>
                  {DEMO_PRESETS.map((preset) => {
                    const active = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => switchPreset(preset.id)}
                        className={
                          "rounded-xl px-3.5 py-1.5 text-xs font-bold transition " +
                          (active
                            ? "bg-[#1464f6] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#1464f6]")
                        }
                      >
                        {preset.shortTitle} ({preset.targetRegime})
                      </button>
                    );
                  })}
                </div>
                <Link
                  href="/negocios/nuevo"
                  className="text-xs font-bold text-[#1464f6] underline hover:text-[#0a318c]"
                >
                  Hacer mi propio cuestionario →
                </Link>
              </section>
            )}

            {/* Executive Summary Header Card */}
            <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1464f6]">
                    <span>{category?.name || "Mi negocio"}</span>
                    <span>•</span>
                    <span>{[context.district, context.province, context.department].filter(Boolean).join(", ") || "Cajamarca, Perú"}</span>
                    <span>•</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                      {context.legalPerson === "natural"
                        ? "Persona Natural"
                        : context.legalPerson === "juridica"
                        ? "Persona Jurídica"
                        : "Personería por definir"}
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-black text-[#071c56] sm:text-4xl">{context.businessName}</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Ventas estimadas: <b>S/ {new Intl.NumberFormat("es-PE").format(context.monthlyRevenue)}/mes</b> · Compras:{" "}
                    <b>S/ {new Intl.NumberFormat("es-PE").format(context.monthlyPurchases)}/mes</b> · Trabajadores:{" "}
                    <b>{context.employeeCount || 0}</b>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTab("Comparar regímenes")}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700">Régimen preseleccionado</span>
                    <span className="mt-0.5 block text-lg font-black text-emerald-900">
                      {taxAdvice.code ? `${taxAdvice.code} (Ver detalle →)` : "Revisar opciones →"}
                    </span>
                  </button>

                  <div className="min-w-[170px] rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Avance de ruta</span>
                      <span className="text-[#1464f6]">{progressPercent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                      <div className="h-full rounded-full bg-[#1464f6] transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {completed} de {results.length} pasos completados
                    </p>
                  </div>
                </div>
              </div>

              {/* Top-Level Tab Bar right inside the executive card */}
              <div className="mt-6 flex gap-2 overflow-x-auto border-t border-slate-100 pt-4 print:hidden">
                {tabs.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setTab(name)}
                    className={
                      "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition " +
                      (tab === name ? "bg-[#1464f6] text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#1464f6]")
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>

            {loading ? (
              <p className="py-16 text-center text-slate-500">Preparando tu ruta y evaluando reglas de decisión…</p>
            ) : (
              <>
                {/* TAB 1: MI RUTA */}
                {tab === "Mi ruta" && (
                  <div className="mt-6 space-y-6">
                    {/* 3 KPI Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pasos identificados</p>
                        <p className="mt-1 text-3xl font-black text-[#1464f6]">{counts.steps}</p>
                        <p className="mt-1 text-xs text-slate-500">Según tu rubro, personería, local y trabajadores</p>
                      </div>
                      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Entidades involucradas</p>
                        <p className="mt-1 text-3xl font-black text-[#1464f6]">{counts.entities}</p>
                        <p className="mt-1 text-xs text-slate-500">SUNAT, Municipalidad de {context.district || "Cajamarca"}, etc.</p>
                      </div>
                      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Referencias y requisitos</p>
                        <div className="mt-1 flex items-baseline justify-between">
                          <p className="text-3xl font-black text-[#1464f6]">{counts.documents}</p>
                          <button
                            type="button"
                            onClick={() => setShowDocuments((open) => !open)}
                            aria-expanded={showDocuments}
                            aria-controls="reference-documents-list"
                            className="text-xs font-bold text-[#1464f6] underline"
                          >
                            {showDocuments ? "Ocultar guía visual" : "Ver para qué sirven →"}
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Explicación sencilla de cada requisito</p>
                      </div>
                    </div>

                    {/* Collapsible Visual Document References */}
                    {showDocuments && (
                      <section id="reference-documents-list" className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm" aria-label="Documentos e información para preparar">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold">¿Qué hago con cada documento o requisito?</h2>
                          <button type="button" onClick={() => setShowDocuments(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800">
                            Cerrar ×
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Te lo explicamos con ejemplos. Algunas cosas las muestras al tramitar; otras solo las anotas para responder.
                        </p>
                        {preparingToStart && (
                          <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-[#10295b]">
                            Como recién estás preparando tu negocio, <b>no necesitas haber vendido ni tener todos estos datos ahora</b>.
                          </p>
                        )}
                        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
                          {documentReferences.map(({ document, linked, guide, url, link }) => (
                            <li key={document} className="overflow-hidden rounded-2xl border border-blue-100 bg-white p-4">
                              <ReferenceIllustration kind={document} label={guide?.visual || document} />
                              <h3 className="mt-3 text-base font-bold text-[#10295b]">{document}</h3>
                              <p className="mt-1 text-sm text-slate-700">
                                <b>En sencillo:</b> {guide?.purpose || "Referencia útil para los trámites de tu ruta."}
                              </p>
                              <p className="mt-1 text-sm text-slate-700">
                                <b>¿Dónde se usa?</b> {guide?.where || [...new Set(linked.map((e) => e.requirement?.institution).filter(Boolean))].join(", ")}
                              </p>
                              {url && (
                                <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-[#1464f6] underline">
                                  {link} ↗
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Main Interactive Step-by-Step Checklist */}
                    <section id="ruta" className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h2 className="text-2xl font-black text-[#071c56]">Pasos de tu ruta de formalización</h2>
                          <p className="mt-0.5 text-sm text-slate-600">
                            Haz clic en <b>Ver guía paso a paso</b> en cualquier fila para conocer dónde ir, qué pedir y cuánto cuesta.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTab("Comparar regímenes")}
                          className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#1464f6] hover:bg-blue-100"
                        >
                          Ir al simulador tributario →
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {results.map((item, index) => {
                          const req = requirementById(item.requirementId);
                          if (!req) return null;
                          const source = sourceById(item.sourceId);
                          const status = statuses[req.id] || "PENDIENTE";
                          const isOpen = expanded === req.id;

                          return (
                            <article key={req.id} className="py-5 first:pt-4 last:pb-1">
                              <div className="grid gap-4 sm:grid-cols-[52px_minmax(0,1fr)_auto_auto] sm:items-center">
                                <div className="relative">
                                  <StatusDot status={status} />
                                  {index < results.length - 1 && <span className="absolute left-[21px] top-11 hidden h-8 border-l-2 border-blue-100 sm:block" />}
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase text-[#1464f6]">
                                      Paso {index + 1} · {req.category}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">{req.institution}</span>
                                  </div>
                                  <h3 className="mt-1.5 text-lg font-bold text-[#071c56]">{req.title}</h3>
                                  <p className="mt-0.5 text-sm text-slate-600">{req.description}</p>
                                </div>

                                <select
                                  aria-label={"Estado de " + req.title}
                                  value={status}
                                  onChange={(event) => change(req.id, event.target.value as RequirementStatus)}
                                  className={
                                    "rounded-xl border px-3 py-2.5 text-xs font-bold outline-none " +
                                    (status === "COMPLETADO"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : status === "EN_PROCESO"
                                      ? "border-blue-200 bg-blue-50 text-[#1464f6]"
                                      : "border-slate-200 bg-slate-50 text-slate-600")
                                  }
                                >
                                  <option value="PENDIENTE">Pendiente</option>
                                  <option value="EN_PROCESO">En proceso</option>
                                  <option value="COMPLETADO">Completado</option>
                                  <option value="NO_APLICA">No aplica</option>
                                </select>

                                <button
                                  type="button"
                                  className={
                                    "rounded-xl border px-4 py-2.5 text-sm font-bold transition " +
                                    (isOpen ? "border-[#1464f6] bg-[#1464f6] text-white" : "border-blue-200 bg-white text-[#1464f6] hover:bg-blue-50")
                                  }
                                  aria-expanded={isOpen}
                                  onClick={() => setExpanded(isOpen ? null : req.id)}
                                >
                                  {isOpen ? "Ocultar guía" : "Ver guía paso a paso"}
                                </button>
                              </div>

                              {isOpen && (
                                <div className="mt-4 rounded-2xl bg-blue-50/60 p-5 sm:ml-14">
                                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                                    <p>
                                      <b>¿Por qué se activa este paso?</b> {item.reason}
                                    </p>
                                    <p>
                                      <b>Entidad competente:</b>{" "}
                                      {req.category === "Municipalidad"
                                        ? `Municipalidad correspondiente a ${context.district || "tu distrito"}`
                                        : req.institution}
                                    </p>
                                  </div>
                                  {req.documents.length > 0 && (
                                    <p className="mt-2 text-sm">
                                      <b>Requisitos / referencias:</b> {req.documents.join(", ")}.
                                    </p>
                                  )}
                                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                                    {source && (
                                      <a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-[#1464f6] underline">
                                        Consultar enlace oficial ({source.institution}) ↗
                                      </a>
                                    )}
                                    <Link href={`/requisitos/${req.id}`} className="font-bold text-[#10295b] underline">
                                      Abrir ficha individual →
                                    </Link>
                                  </div>
                                  <PracticalGuidePanel requirementId={req.id} context={context} />
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </section>

                    {/* Collapsible Orientation Panels (CIIU, Personería, RUC) */}
                    <details className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                      <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-[#071c56]">
                        <span>💡 Ver orientación adicional sobre código CIIU, personería y RUC</span>
                        <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-[#1464f6] group-open:hidden">
                          Mostrar detalle
                        </span>
                      </summary>
                      <div className="mt-2">
                        <BusinessSetupAdvicePanel context={context} />
                        {context.legalPerson === "aun-no-se" && <LegalFormRecommendationPanel context={context} />}
                      </div>
                    </details>
                  </div>
                )}

                {/* TAB 2: COMPARAR REGÍMENES Y SIMULADOR */}
                {tab === "Comparar regímenes" && (
                  <div className="mt-6 space-y-6">
                    <TaxPathPanel context={context} />

                    <section className="grid gap-5 xl:grid-cols-[1fr_370px]">
                      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-bold">Evaluación de los 4 regímenes tributarios SUNAT</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Haz clic en cada régimen para inspeccionar las reglas evaluadas según tus ingresos, compras, activos y comprobantes.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {taxes.map((tax) => (
                            <button
                              key={tax.code}
                              type="button"
                              aria-pressed={selected === tax.code}
                              onClick={() => setSelected(tax.code)}
                              className={
                                "rounded-2xl border p-5 text-left transition " +
                                (selected === tax.code
                                  ? "border-[#1464f6] bg-blue-50/80 ring-2 ring-blue-200"
                                  : "border-slate-200 hover:border-blue-300")
                              }
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-2xl font-black text-[#071c56]">{tax.code}</span>
                                <span className={"rounded-full border px-2.5 py-0.5 text-xs font-bold " + taxColor[tax.status]}>
                                  {taxLabel[tax.status]}
                                </span>
                              </div>
                              <p className="mt-2 font-bold text-[#10295b]">{tax.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{tax.reasons[0]}</p>
                            </button>
                          ))}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3" role="img" aria-label="Resumen visual de compatibilidad de regímenes tributarios">
                          {taxes.map((tax) => (
                            <div key={tax.code} className="flex min-w-28 flex-1 flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3.5">
                              <div
                                className={
                                  "h-2.5 w-full rounded-full " +
                                  (tax.status === "COMPATIBLE"
                                    ? "bg-emerald-500"
                                    : tax.status === "INCOMPATIBLE"
                                    ? "bg-rose-500"
                                    : "bg-amber-400")
                                }
                              />
                              <b className="text-sm">{tax.code}</b>
                              <span className="text-center text-[11px] text-slate-600">{taxLabel[tax.status]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <aside className="flex flex-col justify-between rounded-3xl bg-[#102c68] p-6 text-white shadow-sm">
                        {selectedTax && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Detalle de reglas evaluadas</p>
                            <h2 className="mt-2 text-2xl font-black">{selectedTax.title}</h2>
                            <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-[#102c68]">
                              {taxLabel[selectedTax.status]}
                            </span>
                            <ul className="mt-5 space-y-2.5">
                              {selectedTax.reasons.map((reason) => (
                                <li key={reason} className="flex gap-2 text-sm leading-6 text-blue-100">
                                  <span aria-hidden="true" className="font-bold text-cyan-300">
                                    →
                                  </span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="mt-6 border-t border-white/15 pt-4">
                          {selectedTax && sourceById(selectedTax.sourceId) && (
                            <a
                              href={sourceById(selectedTax.sourceId)?.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-[#102c68] hover:bg-blue-50"
                            >
                              Abrir guía oficial de SUNAT ↗
                            </a>
                          )}
                          <p className="mt-3 text-xs leading-5 text-blue-200">
                            Usa el simulador de abajo para calcular tus pagos mensuales con distintos niveles de ventas y compras.
                          </p>
                        </div>
                      </aside>
                    </section>

                    <TaxPaymentSimulator context={context} />
                    <TaxComparisonTable />
                  </div>
                )}

                {/* TAB 3: MIS OBLIGACIONES */}
                {tab === "Mis obligaciones" && (
                  <section id="obligaciones" className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-2xl font-bold capitalize">{month}</h2>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1464f6]">Simulador de cronograma SUNAT</span>
                      </div>
                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                        <label className="block text-sm font-bold text-[#10295b]">
                          Selecciona el último dígito de tu RUC para simular tu fecha orientativa de declaración:
                          <select
                            value={rucDigit}
                            onChange={(e) => setRucDigit(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#10295b] outline-none focus:border-[#1464f6]"
                          >
                            {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                              <option key={d} value={d}>
                                RUC terminado en {d}
                              </option>
                            ))}
                            <option value="BC">Buenos Contribuyentes y UESP</option>
                          </select>
                        </label>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          SUNAT organiza los vencimientos mensuales entre los días 14 y 22 del mes siguiente según el último dígito del RUC. Día orientativo resaltado en ámbar:{" "}
                          <b>día {suggestedDueDay}</b>.
                        </p>
                      </div>
                      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-sm">
                        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((day) => (
                          <b key={day} className="py-2 text-slate-500">
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
                              title={isDue ? `Vencimiento orientativo para RUC terminado en ${rucDigit}` : isToday ? "Hoy" : undefined}
                              className={
                                "grid h-10 place-items-center rounded-full " +
                                (isDue
                                  ? "bg-amber-400 font-black text-amber-950 ring-2 ring-amber-200"
                                  : isToday
                                  ? "bg-[#1464f6] font-bold text-white"
                                  : "text-slate-600")
                              }
                            >
                              {dayNum}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-[#1464f6]" />
                          Hoy
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full bg-amber-400" />
                          Vencimiento orientativo RUC ({rucDigit})
                        </span>
                      </div>
                      <p className="mt-4 rounded-xl bg-blue-50 p-3.5 text-xs leading-5 text-[#102c68]">
                        Consulta siempre el cronograma oficial de obligaciones mensuales vigente en SUNAT, ya que las fechas exactas varían según días hábiles y feriados.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
                      <h2 className="text-2xl font-bold">Control de tareas de tu ruta</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Actualiza el estado de tus requisitos conforme avances en la formalización de tu negocio.
                      </p>
                      <div className="mt-5 space-y-3">
                        {results.map((item) => {
                          const req = requirementById(item.requirementId);
                          const currentStatus = statuses[item.requirementId] || "PENDIENTE";
                          return req ? (
                            <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 p-4">
                              <div className="flex items-start gap-3">
                                <StatusDot status={currentStatus} />
                                <div>
                                  <b className="text-[#10295b]">{req.title}</b>
                                  <p className="text-xs text-slate-500">{req.institution}</p>
                                </div>
                              </div>
                              <select
                                aria-label={"Cambiar estado de " + req.title}
                                value={currentStatus}
                                onChange={(e) => change(req.id, e.target.value as RequirementStatus)}
                                className="rounded-xl border border-blue-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#10295b]"
                              >
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_PROCESO">En proceso</option>
                                <option value="COMPLETADO">Completado</option>
                                <option value="NO_APLICA">No aplica</option>
                              </select>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* TAB 4: HERRAMIENTAS PRÁCTICAS */}
                {tab === "Herramientas prácticas" && <PracticalToolsTab context={context} />}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

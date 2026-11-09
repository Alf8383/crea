"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { UIT_2026 } from "@/lib/tax-simulator";

const moduleCards = [
  {
    icon: "🍽️",
    title: "Mi restaurante",
    desc: "Registra tu RUC, ventas, compras de insumos, locales, personal por turno y activos.",
    href: "/negocios/nuevo",
  },
  {
    icon: "🩺",
    title: "Mi diagnóstico",
    desc: "Evalúa si cumples tu régimen actual y revisa alternativas con base legal de SUNAT.",
    href: "/negocios?seccion=diagnostico",
  },
  {
    icon: "🧮",
    title: "Comparador y simulador",
    desc: "Desagrega ventas, compras con/sin factura, gastos operativos, IGV y Renta.",
    href: "/negocios?seccion=simulador",
  },
  {
    icon: "📅",
    title: "Mis obligaciones",
    desc: "Consulta tu fecha oficial de vencimiento SUNAT según el último dígito del RUC.",
    href: "/negocios?seccion=obligaciones",
  },
  {
    icon: "🤖",
    title: "Crea IA",
    desc: "Resuelve dudas tributarias en lenguaje sencillo con respaldo normativo verificado.",
    href: "/negocios?seccion=crea-ia",
  },
  {
    icon: "📚",
    title: "Centro de orientación",
    desc: "Guías prácticas para restaurantes organizadas en las 3 áreas de gestión.",
    href: "/negocios?seccion=orientacion",
  },
  {
    icon: "📄",
    title: "Mis reportes (PDF)",
    desc: "Descarga un reporte completo de tu evaluación, obligaciones y fuentes oficiales.",
    href: "/negocios?seccion=reportes",
  },
  {
    icon: "🎓",
    title: "Investigación (36)",
    desc: "Módulo preexperimental anónimo con pretest, intervención y postest para Cajamarca.",
    href: "/investigacion",
  },
];

const thesisObjectives = [
  {
    code: "OE1 · Comprensión Tributaria",
    icon: "📘",
    title: "Comprende tu régimen actual y tus obligaciones",
    desc: "Traduce la normativa oficial de SUNAT a lenguaje sencillo para propietarios y administradores de restaurantes formalizados en Cajamarca.",
  },
  {
    code: "OE2 · Evaluación de Alternativas",
    icon: "⚖️",
    title: "Evalúa regímenes legalmente compatibles",
    desc: "Verifica con reglas trazables si tu restaurante cumple los requisitos de Nuevo RUS, RER, RMT o Régimen General, detectando incompatibilidades y simulando impuestos.",
  },
  {
    code: "OE3 · Organización del Cumplimiento",
    icon: "📅",
    title: "Organiza declaraciones, comprobantes y vencimientos",
    desc: "Consulta el cronograma oficial de SUNAT según el último dígito de tu RUC, prepara tus documentos mensuales y descarga tu reporte de evaluación en PDF.",
  },
];

const faqs = [
  {
    q: "¿Por qué este sistema está dedicado exclusivamente a restaurantes formalizados de Cajamarca?",
    a: "Porque las reglas de comprobantes, compras de insumos perecibles, límites de trabajadores por turno (en cocina y salón), activos fijos gastronómicos y obligaciones tributarias requieren un diagnóstico especializado en el sector de restaurantes (CIIU 5610 / 5621).",
  },
  {
    q: "¿El sistema solicita mi Clave SOL o contraseñas de SUNAT?",
    a: "Nunca. Por seguridad y privacidad, Crea jamás solicita tu Clave SOL. La plataforma distingue claramente entre los datos verificados en fuentes oficiales públicas y los datos operativos declarados por el usuario.",
  },
  {
    q: "¿El régimen con menor pago estimado mensual es siempre el mejor para mi restaurante?",
    a: "No necesariamente. Primero debe verificarse que el régimen sea legalmente compatible con tu tipo de contribuyente (RUC 10 o RUC 20), número de locales, emisión de facturas y trabajadores por turno. Además, los pagos son estimaciones orientativas que dependen de tus facturas de compras y gastos sustentados.",
  },
];

export default function Home() {
  const [sales, setSales] = useState<number>(12000);
  const [purchasesWithInvoice, setPurchasesWithInvoice] =
    useState<number>(6500);
  const [needsInvoice, setNeedsInvoice] = useState<boolean>(true);
  const [isCompany, setIsCompany] = useState<boolean>(false);
  const [workersPerShift, setWorkersPerShift] = useState<number>(4);
  const [establishments, setEstablishments] = useState<number>(1);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(n)));

  const netSales = sales / 1.18;
  const netPurchases = purchasesWithInvoice / 1.18;
  const igvPayable = Math.max(
    0,
    sales - netSales - (purchasesWithInvoice - netPurchases)
  );

  const nrusCompatible =
    !isCompany &&
    !needsInvoice &&
    establishments === 1 &&
    sales <= 8000 &&
    purchasesWithInvoice <= 8000;
  const nrusQuota = sales <= 5000 && purchasesWithInvoice <= 5000 ? 20 : 50;

  const rerCompatible =
    sales * 12 <= 525000 &&
    purchasesWithInvoice * 12 <= 525000 &&
    workersPerShift <= 10;

  const rmtCompatible = netSales * 12 <= 1700 * UIT_2026;

  const rerMonthlyTotal = netSales * 0.015 + igvPayable;
  const rmtMonthlyTotal = netSales * 0.01 + igvPayable;
  const rgMonthlyTotal = netSales * 0.015 + igvPayable;

  const compatibleList = [
    nrusCompatible ? "Nuevo RUS (NRUS)" : null,
    rerCompatible ? "Régimen Especial (RER)" : null,
    rmtCompatible ? "Régimen MYPE Tributario (RMT)" : null,
    "Régimen General (RG)",
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main>
        {/* Hero Section: Balanced 2-Column Layout */}
        <section
          id="simulador"
          className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Left Column (5 cols on desktop): Clear, Proportional Value Proposition */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Restaurantes formalizados · Cajamarca, Perú (2026)
              </div>

              <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Orientación, diagnóstico y{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  organización tributaria inteligente
                </span>{" "}
                para tu restaurante
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Registra las características de tu restaurante, verifica si
                cumples los requisitos de tu régimen actual en SUNAT, compara
                alternativas compatibles, simula tus impuestos mensuales y
                organiza tus fechas de vencimiento con apoyo de{" "}
                <strong className="text-slate-800">Crea IA</strong>.
              </p>

              {/* Key Highlights */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-base">
                    🛡️
                  </span>
                  <div>
                    <h2 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                      Diagnóstico normativo verificable (CIIU 5610 / 5621)
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      Cada regla evaluada muestra su base legal de SUNAT,
                      vigencia y versión. Nunca solicitamos tu Clave SOL.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-base">
                    📊
                  </span>
                  <div>
                    <h2 className="text-xs font-extrabold text-slate-900 sm:text-sm">
                      Distingue compras con Factura y con Boleta
                    </h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      Comprende cómo las facturas de insumos (carnes, abarrotes,
                      gas) generan crédito fiscal de IGV en tu restaurante.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/negocios/nuevo"
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <span>Registrar «Mi restaurante»</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/negocios?seccion=diagnostico"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  Ir a Mi diagnóstico
                </Link>
              </div>
            </div>

            {/* Right Column (7 cols on desktop): Spacious, Unclipped Interactive Simulator */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      🍽️ Simulador rápido para restaurantes
                    </span>
                    <h2 className="mt-0.5 text-lg font-extrabold text-slate-900">
                      Pre-evaluación de compatibilidad y pago mensual
                    </h2>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                    Estimación orientativa
                  </span>
                </div>

                {/* Sliders */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-700">
                        Ventas mensuales (S/)
                      </span>
                      <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-sm font-extrabold text-blue-800">
                        S/ {fmt(sales)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2000}
                      max={60000}
                      step={500}
                      value={sales}
                      onChange={(e) => setSales(Number(e.target.value))}
                      aria-label="Ventas mensuales del restaurante"
                      className="mt-3 w-full cursor-pointer accent-blue-600"
                    />
                    <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-500">
                      <span>S/ 2,000</span>
                      <span>Tope NRUS: S/ 8,000</span>
                      <span>S/ 60,000</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-700">
                        Compras con Factura (S/)
                      </span>
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-sm font-extrabold text-emerald-800">
                        S/ {fmt(purchasesWithInvoice)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={45000}
                      step={500}
                      value={purchasesWithInvoice}
                      onChange={(e) =>
                        setPurchasesWithInvoice(Number(e.target.value))
                      }
                      aria-label="Compras mensuales con factura"
                      className="mt-3 w-full cursor-pointer accent-blue-600"
                    />
                    <div className="mt-1.5 flex justify-between text-[11px] font-medium text-slate-500">
                      <span>S/ 0</span>
                      <span>Descuenta IGV</span>
                      <span>S/ 45,000</span>
                    </div>
                  </div>
                </div>

                {/* 2x2 Spacious Toggle Grid (Never cuts off text) */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                    <span className="block text-xs font-bold text-slate-700">
                      1. Tipo de contribuyente (RUC)
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setIsCompany(false)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (!isCompany
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        RUC 10 (Natural)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompany(true)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (isCompany
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        RUC 20 (Jurídica)
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                    <span className="block text-xs font-bold text-slate-700">
                      2. ¿Necesitas emitir Facturas?
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(false)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (!needsInvoice
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        Solo Boleta
                      </button>
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(true)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (needsInvoice
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        Sí, Factura
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                    <span className="block text-xs font-bold text-slate-700">
                      3. Trabajadores por turno
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setWorkersPerShift(4)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (workersPerShift <= 10
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        Hasta 10 por turno
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkersPerShift(12)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (workersPerShift > 10
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        Más de 10 por turno
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                    <span className="block text-xs font-bold text-slate-700">
                      4. Cantidad de locales
                    </span>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setEstablishments(1)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (establishments === 1
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        1 solo local
                      </button>
                      <button
                        type="button"
                        onClick={() => setEstablishments(2)}
                        className={
                          "rounded-lg py-2 px-2 transition " +
                          (establishments > 1
                            ? "bg-white text-blue-700 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900")
                        }
                      >
                        2 o más locales
                      </button>
                    </div>
                  </div>
                </div>

                {/* Result Box with 2x2 Regime Grid */}
                <div className="mt-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                        Alternativas legalmente compatibles detectadas
                      </span>
                      <h3 className="mt-0.5 text-base font-extrabold text-slate-900">
                        {compatibleList.join(" · ")}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                    {/* NRUS */}
                    <div
                      className={
                        "rounded-xl border p-3.5 " +
                        (nrusCompatible
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-rose-200 bg-rose-50/40")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Nuevo RUS (NRUS)
                        </span>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                            (nrusCompatible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800")
                          }
                        >
                          {nrusCompatible ? "COMPATIBLE" : "INCOMPATIBLE"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-black text-slate-900">
                        {nrusCompatible
                          ? `S/ ${nrusQuota} / mes (cuota fija)`
                          : "No aplicable"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {!nrusCompatible
                          ? isCompany
                            ? "Exige Persona Natural (RUC 10)."
                            : needsInvoice
                              ? "Prohíbe emitir Facturas comerciales."
                              : establishments > 1
                                ? "Permite máximo 1 solo local."
                                : "Supera el tope de S/ 8,000 al mes."
                          : "Reemplaza IGV y Renta con cuota única."}
                      </p>
                    </div>

                    {/* RER */}
                    <div
                      className={
                        "rounded-xl border p-3.5 " +
                        (rerCompatible
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-rose-200 bg-rose-50/40")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Régimen Especial (RER)
                        </span>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                            (rerCompatible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800")
                          }
                        >
                          {rerCompatible ? "COMPATIBLE" : "INCOMPATIBLE"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-black text-slate-900">
                        {rerCompatible
                          ? `S/ ${fmt(rerMonthlyTotal)} / mes est.`
                          : "No aplicable"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {!rerCompatible
                          ? workersPerShift > 10
                            ? "Supera el tope de 10 trabajadores por turno."
                            : "Supera el tope anual de S/ 525,000."
                          : "Renta cancelatoria 1.5% + IGV neto (Sin DJ Anual)."}
                      </p>
                    </div>

                    {/* RMT */}
                    <div
                      className={
                        "rounded-xl border p-3.5 " +
                        (rmtCompatible
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-rose-200 bg-rose-50/40")
                      }
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Régimen MYPE (RMT)
                        </span>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                            (rmtCompatible
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800")
                          }
                        >
                          {rmtCompatible ? "COMPATIBLE" : "INCOMPATIBLE"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-black text-slate-900">
                        S/ {fmt(rmtMonthlyTotal)} / mes est.
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Pago a cuenta 1% + IGV neto y Renta Anual según utilidad.
                      </p>
                    </div>

                    {/* RG */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Régimen General (RG)
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          COMPATIBLE
                        </span>
                      </div>
                      <p className="mt-1.5 text-base font-black text-slate-900">
                        S/ {fmt(rgMonthlyTotal)} / mes est.
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Pago a cuenta 1.5% + IGV neto y Renta Anual (29.5%).
                      </p>
                    </div>
                  </div>

                  <p className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs leading-relaxed text-amber-950">
                    <strong>Nota importante:</strong> Estos montos son
                    estimaciones orientativas mensuales y no impuestos
                    definitivos. El régimen con menor pago estimado no es
                    necesariamente el mejor para tu restaurante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width 8 Modules Grid (Zero Truncation, Clean Proportions) */}
        <section className="border-t border-slate-200/80 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  Módulos integrados del sistema
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Explora las herramientas diseñadas para tu restaurante
                </h2>
              </div>
              <Link
                href="/negocios/nuevo"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Comenzar registrando mi restaurante →
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {moduleCards.map((mod) => (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-xl transition group-hover:bg-blue-600 group-hover:text-white">
                        {mod.icon}
                      </span>
                      <span className="text-xs font-bold text-blue-600 opacity-0 transition group-hover:opacity-100">
                        Abrir →
                      </span>
                    </div>
                    <h3 className="mt-3.5 text-base font-extrabold text-slate-900 group-hover:text-blue-600">
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {mod.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Thesis Objectives Alignment */}
        <section className="border-t border-slate-200/70 bg-slate-50/70 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Fundamento metodológico de la investigación
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Tres dimensiones para fortalecer la capacidad de gestión
                tributaria
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {thesisObjectives.map((obj) => (
                <article
                  key={obj.code}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-2xl">
                      {obj.icon}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-extrabold text-blue-800">
                      {obj.code}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-slate-900">
                    {obj.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {obj.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-200/70 bg-white py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-extrabold text-slate-900">
              Preguntas frecuentes de propietarios y administradores
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition open:border-blue-200 open:bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-900">
                    <span>{faq.q}</span>
                    <span className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200/70 text-sm text-blue-600 transition group-open:rotate-45 group-open:bg-blue-50">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-[11px] font-black text-white">
              C
            </span>
            <span className="font-bold text-slate-800">Crea</span>
            <span>
              · Sistema web inteligente de orientación tributaria para
              restaurantes formalizados de Cajamarca, 2026
            </span>
          </div>
          <div className="flex flex-wrap gap-4 font-semibold text-slate-600">
            <Link href="/negocios/nuevo" className="hover:text-blue-600">
              Mi restaurante
            </Link>
            <Link
              href="/negocios?seccion=diagnostico"
              className="hover:text-blue-600"
            >
              Mi diagnóstico
            </Link>
            <Link href="/investigacion" className="hover:text-blue-600">
              Investigación (36)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ACTIVE_ACCOUNT_KEY } from "@/lib/account-storage";
import { UIT_2026 } from "@/lib/tax-simulator";

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
  const [purchasesWithInvoice, setPurchasesWithInvoice] = useState<number>(6500);
  const [needsInvoice, setNeedsInvoice] = useState<boolean>(true);
  const [isCompany, setIsCompany] = useState<boolean>(false);
  const [workersPerShift, setWorkersPerShift] = useState<number>(4);
  const [establishments, setEstablishments] = useState<number>(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setIsLoggedIn(Boolean(localStorage.getItem(ACTIVE_ACCOUNT_KEY)));
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-PE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(n)));

  const netSales = sales / 1.18;
  const netPurchases = purchasesWithInvoice / 1.18;
  const igvPayable = Math.max(0, sales - netSales - (purchasesWithInvoice - netPurchases));

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
        {/* Hero Section */}
        <section
          id="simulador"
          className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-8 lg:pt-10"
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
            {/* Left Column */}
            <div className="lg:pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Exclusivo para restaurantes formalizados de Cajamarca · 2026
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">
                Sistema web inteligente de{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  orientación, diagnóstico y organización tributaria
                </span>{" "}
                para restaurantes
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Registra las características de tu restaurante, evalúa si cumples
                los requisitos de tu régimen actual en SUNAT, conoce alternativas
                legalmente compatibles, simula tus impuestos con transparencia,
                organiza tus vencimientos y recibe orientación con{" "}
                <strong>Crea IA</strong>.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/negocios/nuevo"
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Registrar o actualizar «Mi restaurante» →
                </Link>
                <Link
                  href="/negocios?seccion=diagnostico"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                >
                  Ver diagnóstico y módulos
                </Link>
              </div>

              {/* Quick Access to the 8 Modules */}
              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { icon: "🍽️", label: "Mi restaurante", href: "/negocios/nuevo" },
                  {
                    icon: "🩺",
                    label: "Mi diagnóstico",
                    href: "/negocios?seccion=diagnostico",
                  },
                  {
                    icon: "🧮",
                    label: "Simulador",
                    href: "/negocios?seccion=simulador",
                  },
                  {
                    icon: "📅",
                    label: "Mis obligaciones",
                    href: "/negocios?seccion=obligaciones",
                  },
                  {
                    icon: "🤖",
                    label: "Crea IA",
                    href: "/negocios?seccion=crea-ia",
                  },
                  {
                    icon: "📚",
                    label: "Centro orientación",
                    href: "/negocios?seccion=orientacion",
                  },
                  {
                    icon: "📄",
                    label: "Reporte PDF",
                    href: "/negocios?seccion=reportes",
                  },
                  {
                    icon: "🎓",
                    label: "Investigación (36)",
                    href: "/investigacion",
                  },
                ].map((mod) => (
                  <Link
                    key={mod.label}
                    href={mod.href}
                    className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white p-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-blue-300 hover:text-blue-600"
                  >
                    <span className="text-base">{mod.icon}</span>
                    <span className="truncate">{mod.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Restaurant Tax Preview */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    🍽️ Vista rápida para restaurantes (CIIU 5610)
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Pre-evaluación de compatibilidad y simulador
                  </h2>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
                  Estimación orientativa
                </span>
              </div>

              <div className="mt-4 space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Ventas mensuales del restaurante
                      </span>
                      <span className="font-extrabold text-blue-600">
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
                      className="mt-2 w-full cursor-pointer accent-blue-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>S/ 2,000</span>
                      <span>Tope NRUS: S/ 8,000</span>
                      <span>S/ 60,000</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Compras de insumos con Factura
                      </span>
                      <span className="font-extrabold text-emerald-700">
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
                      className="mt-2 w-full cursor-pointer accent-blue-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>S/ 0</span>
                      <span>Otorga crédito fiscal IGV</span>
                      <span>S/ 45,000</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-600">
                      Contribuyente
                    </span>
                    <div className="mt-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setIsCompany(false)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (!isCompany
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        RUC 10
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompany(true)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (isCompany
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        RUC 20
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-slate-600">
                      ¿Emite Factura?
                    </span>
                    <div className="mt-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(false)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (!needsInvoice
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        Solo Boleta
                      </button>
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(true)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (needsInvoice
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        Sí, Factura
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-slate-600">
                      Trabajadores/turno
                    </span>
                    <div className="mt-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setWorkersPerShift(4)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (workersPerShift <= 10
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        ≤ 10
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkersPerShift(12)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (workersPerShift > 10
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        &gt; 10
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-slate-600">
                      N.° de locales
                    </span>
                    <div className="mt-1 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setEstablishments(1)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (establishments === 1
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        1 local
                      </button>
                      <button
                        type="button"
                        onClick={() => setEstablishments(2)}
                        className={
                          "rounded-lg py-1.5 transition " +
                          (establishments > 1
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-600")
                        }
                      >
                        2+ locales
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Box */}
              <div className="mt-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      Regímenes legalmente compatibles con estos parámetros
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {compatibleList.join(" · ")}
                    </h3>
                  </div>
                </div>

                {/* 4 Regimes Comparison */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div
                    className={
                      "rounded-xl border p-2.5 " +
                      (nrusCompatible
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-rose-200 bg-rose-50/40 opacity-75")
                    }
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>NRUS</span>
                      <span
                        className={
                          nrusCompatible ? "text-emerald-700" : "text-rose-700"
                        }
                      >
                        {nrusCompatible ? "COMPATIBLE" : "INCOMPATIBLE"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {nrusCompatible ? `S/ ${nrusQuota}/mes` : "No aplicable"}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {!nrusCompatible
                        ? isCompany
                          ? "Exige Persona Natural"
                          : needsInvoice
                            ? "Prohíbe emitir Factura"
                            : establishments > 1
                              ? "Máx. 1 solo local"
                              : "Supera S/ 8,000/mes"
                        : "Cuota fija única"}
                    </p>
                  </div>

                  <div
                    className={
                      "rounded-xl border p-2.5 " +
                      (rerCompatible
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-rose-200 bg-rose-50/40 opacity-75")
                    }
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>RER</span>
                      <span
                        className={
                          rerCompatible ? "text-emerald-700" : "text-rose-700"
                        }
                      >
                        {rerCompatible ? "COMPATIBLE" : "INCOMPATIBLE"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {rerCompatible
                        ? `S/ ${fmt(rerMonthlyTotal)}/mes`
                        : "No aplicable"}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {!rerCompatible
                        ? workersPerShift > 10
                          ? "Excede 10 trab./turno"
                          : "Supera S/ 525,000/año"
                        : "Renta 1.5% + IGV neto"}
                    </p>
                  </div>

                  <div
                    className={
                      "rounded-xl border p-2.5 " +
                      (rmtCompatible
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-rose-200 bg-rose-50/40 opacity-75")
                    }
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>RMT</span>
                      <span
                        className={
                          rmtCompatible ? "text-emerald-700" : "text-rose-700"
                        }
                      >
                        {rmtCompatible ? "COMPATIBLE" : "INCOMPATIBLE"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      S/ {fmt(rmtMonthlyTotal)}/mes
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Pago a cta. 1% + IGV (+ Renta Anual)
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>R. General</span>
                      <span className="text-emerald-700">COMPATIBLE</span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      S/ {fmt(rgMonthlyTotal)}/mes
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Pago a cta. 1.5% + IGV (+ Renta Anual)
                    </p>
                  </div>
                </div>

                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] leading-4 text-amber-950">
                  <strong>Nota metodológica:</strong> Los montos mostrados son
                  estimaciones orientativas mensuales y no impuestos definitivos.
                  El régimen con menor pago estimado no es necesariamente el
                  mejor: evalúa los activos fijos, compras sin factura y gastos
                  operativos de tu restaurante en el{" "}
                  <Link
                    href="/negocios?seccion=simulador"
                    className="font-bold underline"
                  >
                    Comparador y simulador completo
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Thesis Objectives Alignment */}
        <section className="border-t border-slate-200/70 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Arquitectura orientada a la gestión tributaria gastronómica
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Tres dimensiones para fortalecer la gestión tributaria de tu restaurante
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {thesisObjectives.map((obj) => (
                <article
                  key={obj.code}
                  className="rounded-3xl border border-slate-200/90 bg-slate-50/50 p-6 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-2xl">
                      {obj.icon}
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-extrabold text-blue-800">
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
        <section className="border-t border-slate-200/70 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-8">
            <h2 className="text-center text-2xl font-extrabold text-slate-900">
              Preguntas frecuentes de propietarios y administradores
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition open:border-blue-200"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-900">
                    <span>{faq.q}</span>
                    <span className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm text-blue-600 transition group-open:rotate-45 group-open:bg-blue-50">
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-8">
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
          <div className="flex gap-4 font-semibold text-slate-600">
            <Link href="/negocios/nuevo" className="hover:text-blue-600">
              Mi restaurante
            </Link>
            <Link
              href="/negocios?seccion=diagnostico"
              className="hover:text-blue-600"
            >
              Diagnóstico
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

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS, type DemoPreset } from "@/lib/demo-presets";

const modules = [
  {
    badge: "01 · Diagnóstico",
    title: "Cuestionario adaptativo",
    desc: "Preguntas claras que se ajustan según tu rubro, si tendrás local físico, socios o trabajadores.",
    href: "/negocios/nuevo",
    cta: "Responder cuestionario →",
  },
  {
    badge: "02 · Tributación",
    title: "Comparador y simulador SUNAT",
    desc: "Evalúa compatibilidad con Nuevo RUS, RER, RMT y Régimen General y simula tu pago mensual en soles.",
    href: "/negocios/demo/ruta?tab=regimenes",
    cta: "Probar simulador →",
  },
  {
    badge: "03 · Formalización",
    title: "Ruta paso a paso verificable",
    desc: "Guía práctica de inscripción en RUC, constitución en SUNARP, Licencia Municipal, ITSE y Planilla.",
    href: "/negocios/demo/ruta",
    cta: "Ver ruta paso a paso →",
  },
  {
    badge: "04 · Utilidades",
    title: "Asistente de comprobantes y empresas",
    desc: "Simula cuándo emitir boleta o factura (regla de S/ 700) y compara Persona Natural vs. E.I.R.L. o S.A.C.",
    href: "/negocios/demo/ruta?tab=herramientas",
    cta: "Abrir herramientas →",
  },
];

const faqs = [
  {
    q: "¿Necesito conocer mi código CIIU o términos contables para usar la plataforma?",
    a: "No. Describes tu actividad con palabras simples y el motor de reglas sugiere el código CIIU referencial, el régimen compatible y los pasos aplicables.",
  },
  {
    q: "¿Qué ocurre si mi negocio aún es una idea y todavía no tengo ventas?",
    a: "Puedes ingresar un estimado mensual aproximado o usar la calculadora integrada por producto/servicio para proyectar tus ingresos y comparar regímenes antes de inscribirte en SUNAT.",
  },
  {
    q: "¿Debo registrarme obligatoriamente para evaluar mi negocio?",
    a: "Puedes usar el cuestionario y el simulador de inmediato sin cuenta, o crear una cuenta rápida para guardar tu progreso y retomar tu ruta cuando quieras.",
  },
];

export default function Home() {
  const router = useRouter();
  const [quickSales, setQuickSales] = useState<number>(4200);
  const [needsInvoice, setNeedsInvoice] = useState<boolean>(false);
  const [isCompany, setIsCompany] = useState<boolean>(false);

  const applyQuickPreset = (preset: DemoPreset) => {
    setQuickSales(preset.context.monthlyRevenue);
    setNeedsInvoice(Boolean(preset.context.needsInvoices));
    setIsCompany(preset.context.legalPerson === "juridica");
  };

  const openFullSimulator = () => {
    const matchedPreset =
      !isCompany && !needsInvoice && quickSales <= 8000
        ? DEMO_PRESETS[0]
        : !isCompany
        ? DEMO_PRESETS[1]
        : DEMO_PRESETS[2];

    const customContext = {
      ...matchedPreset.context,
      monthlyRevenue: quickSales,
      monthlyPurchases: Math.round(quickSales * 0.45),
      annualPurchases: Math.round(quickSales * 0.45) * 12,
      needsInvoices: needsInvoice,
      legalPerson: isCompany ? ("juridica" as const) : ("natural" as const),
      questionnaire: {
        ...matchedPreset.context.questionnaire,
        P09: isCompany ? "Persona jurídica / empresa" : "Persona natural",
        P20: `monto:${quickSales}`,
        P23: needsInvoice
          ? "Sí, mis clientes me pedirán factura"
          : "No, venderé solo a consumidores finales con boleta",
        TAX_PURCHASES: String(Math.round(quickSales * 0.45)),
      },
    };

    try {
      localStorage.setItem(scopedStorageKey("efp-business-context"), JSON.stringify(customContext));
    } catch {}
    router.push("/negocios/demo/ruta");
  };

  // Live calculation for the interactive hero widget
  const nrusEligible = !isCompany && !needsInvoice && quickSales <= 8000;
  const rerEligible = !nrusEligible && quickSales * 12 <= 525000;
  const recommendedCode = nrusEligible ? "Nuevo RUS (NRUS)" : rerEligible ? "Régimen Especial (RER)" : "RMT (MYPE Tributario)";
  const estimatedMonthlyTax = nrusEligible
    ? quickSales <= 5000
      ? "S/ 20.00 fijo / mes"
      : "S/ 50.00 fijo / mes"
    : rerEligible
    ? `S/ ${Math.round((quickSales / 1.18) * 0.015)} Renta + IGV`
    : `S/ ${Math.round((quickSales / 1.18) * 0.01)} Renta + IGV`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main>
        {/* Hero Section with Live Interactive Simulator */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-8 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Sistema basado en reglas de decisión
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[52px]">
                Encuentra tu régimen tributario y formaliza tu negocio{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  paso a paso
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Evalúa tu idea o emprendimiento en minutos. Compara Nuevo RUS, RER, RMT y Régimen General con cálculos claros y obtén tu lista de trámites verificables.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/negocios/nuevo"
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:text-base"
                >
                  Iniciar cuestionario guiado
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/negocios/demo/ruta"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs transition hover:border-blue-300 hover:text-blue-600 sm:text-base"
                >
                  Ver ruta y simulador demo
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 sm:max-w-lg">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">4</p>
                  <p className="text-xs font-medium text-slate-500">Regímenes SUNAT comparados</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">16</p>
                  <p className="text-xs font-medium text-slate-500">Rubros empresariales</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">100%</p>
                  <p className="text-xs font-medium text-slate-500">Fuentes oficiales trazables</p>
                </div>
              </div>
            </div>

            {/* Interactive Live Mini-Simulator Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    ⚡ Simulador rápido interactivo
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">Prueba cómo funciona en segundos</h2>
                </div>
                <div className="flex gap-1.5">
                  {DEMO_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyQuickPreset(preset)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Caso {idx + 1}: {preset.targetRegime}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Controls */}
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Ventas mensuales estimadas</span>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-extrabold text-blue-700">
                      S/ {new Intl.NumberFormat("es-PE").format(quickSales)} / mes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={45000}
                    step={500}
                    value={quickSales}
                    onChange={(e) => setQuickSales(Number(e.target.value))}
                    aria-label="Ventas mensuales estimadas"
                    className="mt-2.5 w-full cursor-pointer accent-blue-600"
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
                    <span>S/ 1,000</span>
                    <span>S/ 8,000 (Tope NRUS)</span>
                    <span>S/ 45,000</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-600">¿Qué comprobantes emitirás?</span>
                    <div className="mt-1.5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(false)}
                        className={
                          "rounded-lg py-2 transition " +
                          (!needsInvoice ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
                        }
                      >
                        Solo Boleta
                      </button>
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(true)}
                        className={
                          "rounded-lg py-2 transition " +
                          (needsInvoice ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
                        }
                      >
                        Factura
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-600">Tipo de personería</span>
                    <div className="mt-1.5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setIsCompany(false)}
                        className={
                          "rounded-lg py-2 transition " +
                          (!isCompany ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
                        }
                      >
                        P. Natural
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompany(true)}
                        className={
                          "rounded-lg py-2 transition " +
                          (isCompany ? "bg-white text-blue-600 shadow-xs" : "text-slate-600")
                        }
                      >
                        Empresa
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Result Output Box */}
              <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      ● Preselección en tiempo real
                    </span>
                    <p className="mt-0.5 text-xl font-extrabold text-slate-900">{recommendedCode}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-semibold text-slate-500">Pago mensual estimado</span>
                    <span className="text-sm font-extrabold text-blue-600">{estimatedMonthlyTax}</span>
                  </div>
                </div>

                <p className="mt-2.5 text-xs leading-5 text-slate-600">
                  {nrusEligible
                    ? "Cumple condiciones de Persona Natural sin emisión de facturas y hasta S/ 8,000 mensuales. No llevas libros contables."
                    : rerEligible
                    ? "Permite emitir facturas y boletas con pago definitivo mensual de 1.5% de Renta e IGV, hasta S/ 525,000 anuales."
                    : "Ideal para empresas o negocios con mayores ingresos o activos, con tasa reducida de renta anual sobre la utilidad."}
                </p>

                <button
                  type="button"
                  onClick={openFullSimulator}
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-blue-600"
                >
                  Abrir diagnóstico completo con estos datos →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Cohesive Platform Modules */}
        <section className="border-t border-slate-200/70 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Arquitectura de la plataforma</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Todo lo que necesitas para decidir con claridad
                </h2>
              </div>
              <Link href="/negocios/nuevo" className="text-sm font-bold text-blue-600 hover:underline">
                Empezar ahora →
              </Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {modules.map((m) => (
                <Link
                  key={m.title}
                  href={m.href}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                      {m.badge}
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold text-slate-900 group-hover:text-blue-600">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.desc}</p>
                  </div>
                  <span className="mt-5 inline-block text-xs font-bold text-blue-600">{m.cta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Minimal FAQ */}
        <section className="border-t border-slate-200/70 py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-8">
            <h2 className="text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">Preguntas frecuentes</h2>
            <div className="mt-7 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition open:border-blue-200"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-900 sm:text-base">
                    <span>{faq.q}</span>
                    <span className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-sm text-blue-600 transition group-open:rotate-45 group-open:bg-blue-50">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
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
            <span>· Orientación tributaria y formalización empresarial</span>
          </div>
          <div className="flex gap-5 font-semibold text-slate-600">
            <Link href="/negocios/nuevo" className="hover:text-blue-600">
              Cuestionario
            </Link>
            <Link href="/negocios/demo/ruta" className="hover:text-blue-600">
              Simulador SUNAT
            </Link>
            <Link href="/admin" className="hover:text-blue-600">
              Catálogo de reglas
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

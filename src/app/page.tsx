"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { ACTIVE_ACCOUNT_KEY } from "@/lib/account-storage";

const steps = [
  {
    num: "01",
    icon: "👤",
    title: "Crea tu cuenta gratuita",
    desc: "Regístrate en segundos para que tus respuestas, diagnóstico y lista de trámites queden guardados en tu panel personal.",
  },
  {
    num: "02",
    icon: "📝",
    title: "Responde el cuestionario guiado",
    desc: "Indica tu rubro, ubicación, proyección de ingresos y forma de trabajo con preguntas sencillas y sin tecnicismos.",
  },
  {
    num: "03",
    icon: "📊",
    title: "Recibe tu régimen y ruta visual",
    desc: "Obtén tu recomendación tributaria explicada, simula tus impuestos mensuales y sigue tu checklist de formalización paso a paso.",
  },
];

const faqs = [
  {
    q: "¿Necesito saber mi código CIIU o tener contador para empezar?",
    a: "No. Solo describes tu actividad con tus propias palabras y el sistema te sugiere el código CIIU referencial, el régimen compatible y los pasos en lenguaje sencillo.",
  },
  {
    q: "¿Qué ocurre si mi negocio aún es una idea y todavía no tengo ventas?",
    a: "En el cuestionario podrás ingresar un estimado mensual aproximado o usar la calculadora por producto/servicio para proyectar tus ingresos antes de inscribirte en SUNAT.",
  },
  {
    q: "¿Por qué necesito iniciar sesión para hacer el cuestionario?",
    a: "Para que tu diagnóstico tributario y el progreso de tus trámites (RUC, SUNARP, Licencia Municipal, ITSE) queden guardados en tu panel personal y puedas retomarlos cuando quieras.",
  },
];

export default function Home() {
  const [sales, setSales] = useState<number>(4500);
  const [purchases, setPurchases] = useState<number>(1800);
  const [needsInvoice, setNeedsInvoice] = useState<boolean>(false);
  const [isCompany, setIsCompany] = useState<boolean>(false);
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
    new Intl.NumberFormat("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.max(0, Math.round(n)));

  // Self-contained live tax calculations right on the landing page
  const netSales = sales / 1.18;
  const netPurchases = purchases / 1.18;
  const igvPayable = Math.max(0, (sales - netSales) - (purchases - netPurchases));

  const nrusCompatible = !isCompany && !needsInvoice && sales <= 8000 && purchases <= 8000;
  const nrusQuota = sales <= 5000 && purchases <= 5000 ? 20 : 50;
  const rerCompatible = sales * 12 <= 525000 && purchases * 12 <= 525000;
  const rmtCompatible = sales * 12 <= 1700 * 5500;

  const rerMonthlyTotal = netSales * 0.015 + igvPayable;
  const rmtMonthlyTotal = netSales * 0.01 + igvPayable;
  const rgMonthlyTotal = netSales * 0.015 + igvPayable;

  const recommended = nrusCompatible
    ? {
        code: "Nuevo RUS (NRUS)",
        badge: sales <= 5000 && purchases <= 5000 ? "Categoría 1 · S/ 20 al mes" : "Categoría 2 · S/ 50 al mes",
        reason:
          "Como operarás como Persona Natural, emitirás solo boleta de venta y tus ingresos/compras no superan S/ 8,000 al mes, el Nuevo RUS es la opción más simple: pagas una única cuota fija y no llevas libros contables.",
      }
    : rerCompatible
    ? {
        code: "Régimen Especial de Renta (RER)",
        badge: `Pago estimado: S/ ${fmt(rerMonthlyTotal)} / mes`,
        reason: isCompany
          ? "Al operar como Persona Jurídica (empresa), no aplica el Nuevo RUS. Por tu nivel de ventas y compras (menores a S/ 525,000 al año), puedes acogerte al RER o al RMT emitiendo facturas y boletas."
          : needsInvoice
          ? "Como necesitas emitir facturas a tus clientes, el Nuevo RUS queda descartado. El RER te permite emitir facturas con un pago definitivo mensual (1.5% Renta + IGV) sin Declaración Anual."
          : "Tus ventas o compras superan los S/ 8,000 mensuales del Nuevo RUS, pero están dentro del tope del RER (hasta S/ 43,750/mes promedio).",
      }
    : {
        code: "Régimen MYPE Tributario (RMT)",
        badge: `Pago estimado: S/ ${fmt(rmtMonthlyTotal)} / mes`,
        reason:
          "Por el volumen proyectado de ingresos o compras, el RMT te permite operar sin exclusiones de giro, emitiendo facturas y boletas con pagos a cuenta del 1% mensual y regularización anual según tu utilidad.",
      };

  const startEvaluationHref = isLoggedIn ? "/negocios/nuevo" : "/registro";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main>
        {/* Hero Section */}
        <section id="simulador" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-8 lg:pt-12">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
            {/* Left Column: Value Proposition */}
            <div className="lg:pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Orientación tributaria y formalización empresarial
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
                Descubre qué régimen tributario te conviene y{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  cómo formalizarte
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Comprende las reglas de SUNAT sin complicaciones. Simula tus pagos mensuales aquí mismo o inicia tu evaluación personalizada para obtener los trámites exactos de tu negocio.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={startEvaluationHref}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:text-base"
                >
                  {isLoggedIn ? "Ir al cuestionario de mi negocio" : "Crear cuenta y evaluar mi negocio"}
                  <span aria-hidden="true">→</span>
                </Link>
                {!isLoggedIn && (
                  <Link
                    href="/ingresar"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 sm:text-base"
                  >
                    Ya tengo cuenta
                  </Link>
                )}
              </div>

              {/* Visual Feature Highlights */}
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg">⚖️</span>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">4 Regímenes SUNAT</h2>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Compara Nuevo RUS, RER, RMT y Régimen General con topes y requisitos claros.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-lg">🗺️</span>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Ruta según tu rubro</h2>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Checklist paso a paso de RUC, SUNARP, Licencia Municipal, ITSE y Planilla.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Self-Contained Interactive Tax Calculator */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] sm:p-7">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    ⚡ Calculadora interactiva instantánea
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Simula tu régimen tributario en vivo
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                  Cálculo referencial
                </span>
              </div>

              {/* Sliders & Toggles */}
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Ventas al mes</span>
                      <span className="font-extrabold text-blue-600">S/ {fmt(sales)}</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={45000}
                      step={500}
                      value={sales}
                      onChange={(e) => setSales(Number(e.target.value))}
                      aria-label="Ventas mensuales estimadas"
                      className="mt-2 w-full cursor-pointer accent-blue-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>S/ 1,000</span>
                      <span>Tope NRUS: S/ 8,000</span>
                      <span>S/ 45,000</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Compras con factura</span>
                      <span className="font-extrabold text-emerald-700">S/ {fmt(purchases)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={35000}
                      step={500}
                      value={purchases}
                      onChange={(e) => setPurchases(Number(e.target.value))}
                      aria-label="Compras mensuales con factura"
                      className="mt-2 w-full cursor-pointer accent-blue-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>S/ 0</span>
                      <span> Reduce IGV</span>
                      <span>S/ 35,000</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-600">¿Emitirás Factura?</span>
                    <div className="mt-1.5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(false)}
                        className={
                          "rounded-lg py-2 transition " +
                          (!needsInvoice ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600")
                        }
                      >
                        Solo Boleta
                      </button>
                      <button
                        type="button"
                        onClick={() => setNeedsInvoice(true)}
                        className={
                          "rounded-lg py-2 transition " +
                          (needsInvoice ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600")
                        }
                      >
                        Sí, Factura
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-600">¿Cómo te registrarás?</span>
                    <div className="mt-1.5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setIsCompany(false)}
                        className={
                          "rounded-lg py-2 transition " +
                          (!isCompany ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600")
                        }
                      >
                        P. Natural
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCompany(true)}
                        className={
                          "rounded-lg py-2 transition " +
                          (isCompany ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600")
                        }
                      >
                        Empresa
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Self-Contained Result Breakdown right inside the widget */}
              <div className="mt-5 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                      Resultado para tus parámetros
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">{recommended.code}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                    {recommended.badge}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{recommended.reason}</p>

                {/* Mini 4-Regime Comparison Grid right inside the card */}
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div
                    className={
                      "rounded-xl border p-2.5 " +
                      (nrusCompatible ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white/80 opacity-60")
                    }
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>NRUS</span>
                      <span className={nrusCompatible ? "text-emerald-700" : "text-rose-600"}>
                        {nrusCompatible ? "✓ Aplica" : "✕ No"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {nrusCompatible ? `S/ ${nrusQuota}` : "Excluido"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {!nrusCompatible
                        ? isCompany
                          ? "Solo P. Natural"
                          : needsInvoice
                          ? "No da factura"
                          : "> S/ 8,000/mes"
                        : "Cuota fija única"}
                    </p>
                  </div>

                  <div
                    className={
                      "rounded-xl border p-2.5 " +
                      (rerCompatible ? "border-blue-200 bg-white" : "border-slate-200 bg-white/80 opacity-60")
                    }
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>RER</span>
                      <span className={rerCompatible ? "text-emerald-700" : "text-rose-600"}>
                        {rerCompatible ? "✓ Aplica" : "✕ No"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                      {rerCompatible ? `S/ ${fmt(rerMonthlyTotal)}` : "> Tope"}
                    </p>
                    <p className="text-[10px] text-slate-500">1.5% Renta + IGV</p>
                  </div>

                  <div
                    className={
                      "rounded-xl border p-2.5 " +
                      (rmtCompatible ? "border-blue-200 bg-white" : "border-slate-200 bg-white/80 opacity-60")
                    }
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>RMT</span>
                      <span className="text-emerald-700">✓ Aplica</span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">S/ {fmt(rmtMonthlyTotal)}</p>
                    <p className="text-[10px] text-slate-500">1.0% Renta + IGV</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>R. General</span>
                      <span className="text-emerald-700">✓ Aplica</span>
                    </div>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">S/ {fmt(rgMonthlyTotal)}</p>
                    <p className="text-[10px] text-slate-500">1.5% Renta + IGV</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 pt-3">
                  <span className="text-[11px] text-slate-500">
                    ¿Quieres evaluar las reglas de tu rubro, activos, trabajadores y distrito?
                  </span>
                  <Link
                    href={startEvaluationHref}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    Hacer diagnóstico de mi negocio →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works: 3 Clear Visual Steps */}
        <section id="como-funciona" className="border-t border-slate-200/70 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Flujo ordenado</span>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                ¿Cómo funciona la plataforma?
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <article
                  key={s.num}
                  className="relative rounded-3xl border border-slate-200/90 bg-slate-50/50 p-6 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl">{s.icon}</span>
                    <span className="text-2xl font-black text-slate-200">{s.num}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="border-t border-slate-200/70 py-14">
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
            <span>· Sistema de recomendación tributaria y formalización empresarial</span>
          </div>
          <div className="flex gap-5 font-semibold text-slate-600">
            <Link href={startEvaluationHref} className="hover:text-blue-600">
              Evaluar mi negocio
            </Link>
            <Link href="/ingresar" className="hover:text-blue-600">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

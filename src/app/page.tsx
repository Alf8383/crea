"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS, type DemoPreset } from "@/lib/demo-presets";

const stepsPreview = [
  {
    step: "Paso 1",
    title: "Cuéntanos tu idea",
    short: "En 3 minutos",
    desc: "Elige tu rubro, ubicación y cuánto estimas vender, sin tecnicismos ni códigos complicados.",
    tags: ["16 rubros", "Calculadora de ventas", "Lenguaje claro"],
  },
  {
    step: "Paso 2",
    title: "Compara tu régimen SUNAT",
    short: "Simulador en vivo",
    desc: "Descubre si te conviene Nuevo RUS, RER, RMT o Régimen General y simula tu pago mensual aproximado.",
    tags: ["Nuevo RUS", "RER", "RMT (MYPE)", "Régimen General"],
  },
  {
    step: "Paso 3",
    title: "Sigue tu ruta paso a paso",
    short: "Checklist práctico",
    desc: "Marca tu avance en RUC, SUNARP, Licencia Municipal e ITSE con enlaces directos a cada entidad oficial.",
    tags: ["SUNAT", "SUNARP", "Municipalidad", "Indecopi"],
  },
];

const faqs = [
  {
    q: "¿Necesito saber mi código CIIU o tener contador para empezar?",
    a: "No. Solo describes tu actividad con tus propias palabras y la plataforma te sugiere el código CIIU y los pasos en lenguaje sencillo.",
  },
  {
    q: "¿Qué pasa si recién tengo la idea y aún no vendo nada?",
    a: "Puedes usar nuestra calculadora rápida por producto o servicio para proyectar tus ventas mensuales y comparar qué régimen te convendrá.",
  },
  {
    q: "¿Puedo probar la plataforma sin crear una cuenta?",
    a: "Sí. Puedes responder el cuestionario o explorar los 3 casos reales de demostración al instante. Si creas una cuenta, tu avance queda guardado con tu correo.",
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const activePreset: DemoPreset = DEMO_PRESETS[selectedPresetIdx] || DEMO_PRESETS[0];

  const openPreset = (preset: DemoPreset) => {
    try {
      localStorage.setItem(scopedStorageKey("efp-business-context"), JSON.stringify(preset.context));
      if (preset.context.questionnaire) {
        localStorage.setItem(
          scopedStorageKey("efp-questionnaire-draft"),
          JSON.stringify({ answers: preset.context.questionnaire, section: 4, position: 0 }),
        );
      }
    } catch {}
    router.push("/negocios/demo/ruta");
  };

  return (
    <main className="min-h-screen bg-[#edf5fb] px-3 py-4 text-[#071c56] sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_rgba(11,53,117,0.10)]">
        {/* Clean Navigation */}
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-12">
          <Link href="/" className="text-4xl font-black tracking-tight text-[#0a318c]">
            Crea
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#explorar" className="transition hover:text-[#1464f6]">
              Casos interactivos
            </a>
            <a href="#como-funciona" className="transition hover:text-[#1464f6]">
              ¿Cómo funciona?
            </a>
            <a href="#preguntas" className="transition hover:text-[#1464f6]">
              Preguntas frecuentes
            </a>
          </div>

          <div className="flex items-center gap-2.5 text-sm font-bold">
            <Link
              href="/ingresar"
              className="rounded-xl px-4 py-2.5 text-[#10295b] transition hover:bg-slate-100"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="rounded-xl bg-[#1464f6] px-5 py-2.5 text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>

        {/* Hero Section: Lighter, Friendlier & Interactive */}
        <section id="explorar" className="grid items-center gap-10 px-6 py-10 sm:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#1464f6]">
              ✦ Guía interactiva para emprendedores en Cajamarca y Perú
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-[54px]">
              Elige tu régimen tributario y formaliza tu negocio sin enredos
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Responde preguntas simples y obtén al instante tu comparación de regímenes SUNAT, simulador de pagos mensuales y ruta de trámites paso a paso.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-xs font-bold text-[#10295b]">
              <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-emerald-800">✓ Sin lenguaje técnico</span>
              <span className="rounded-full bg-blue-50 px-3.5 py-1.5 text-[#1464f6]">✓ Simulador de impuestos en S/</span>
              <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-slate-700">✓ Enlaces oficiales verificables</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/negocios/nuevo"
                className="inline-flex items-center gap-3 rounded-2xl bg-[#1464f6] px-7 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Comenzar mi evaluación <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/negocios/demo/ruta"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-[#10295b] transition hover:border-blue-300 hover:bg-blue-50/50"
              >
                Explorar demo
              </Link>
            </div>
          </div>

          {/* Interactive Case Explorer Card over Cajamarca Backdrop */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-[#0d275c] to-[#1464f6] p-5 text-white shadow-xl sm:p-7">
            <Image
              src="/cajamarca-plaza.jpg"
              alt="Plaza de Armas de Cajamarca"
              fill
              priority
              className="object-cover opacity-20 mix-blend-luminosity"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                  ⚡ Prueba un caso real en 1 clic
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Cajamarca
                </span>
              </div>

              {/* 3 Interactive Scenario Tabs */}
              <div className="mt-3.5 grid grid-cols-3 gap-2">
                {[
                  ["☕ Cafetería", "NRUS"],
                  ["🏪 Minimarket", "RER"],
                  ["💻 Empresa S.A.C.", "RMT"],
                ].map(([label, code], idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedPresetIdx(idx)}
                    className={
                      "rounded-xl px-3 py-2.5 text-left text-xs font-bold transition " +
                      (selectedPresetIdx === idx
                        ? "bg-white text-[#0a318c] shadow-md"
                        : "bg-white/10 text-blue-100 hover:bg-white/20")
                    }
                  >
                    <span className="block truncate">{label}</span>
                    <span className={"text-[10px] " + (selectedPresetIdx === idx ? "text-[#1464f6]" : "text-cyan-200")}>
                       Caso {code}
                    </span>
                  </button>
                ))}
              </div>

              {/* Dynamic Preview Card */}
              <div className="mt-4 rounded-2xl bg-white p-5 text-[#071c56] shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Recomendación: {activePreset.targetRegime}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {activePreset.context.district}, {activePreset.context.department}
                  </span>
                </div>

                <h2 className="mt-2.5 text-lg font-black">{activePreset.context.businessName}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{activePreset.summary}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Ventas/mes</span>
                    <b className="text-sm text-[#10295b]">
                      S/ {new Intl.NumberFormat("es-PE").format(activePreset.context.monthlyRevenue)}
                    </b>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Comprobante</span>
                    <b className="text-sm text-[#10295b]">
                      {activePreset.context.needsInvoices ? "Factura y Boleta" : "Solo Boleta"}
                    </b>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Pago estimado</span>
                    <b className="text-sm text-[#1464f6]">
                      {activePreset.targetRegime === "NRUS"
                        ? "S/ 20 / mes"
                        : activePreset.targetRegime === "RER"
                        ? "1.5% + IGV"
                        : "1.0% + IGV"}
                    </b>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openPreset(activePreset)}
                  className="mt-4 w-full rounded-xl bg-[#0a318c] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#1464f6]"
                >
                  Ver simulación y ruta de este negocio →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive 3-Step Section */}
        <section id="como-funciona" className="border-t border-slate-100 bg-slate-50/70 px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1464f6]">Simple y directo</p>
            <h2 className="mt-1.5 text-2xl font-black sm:text-3xl">¿Cómo te ayuda Crea?</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stepsPreview.map((item, idx) => {
              const active = activeStepIdx === idx;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={
                    "flex flex-col justify-between rounded-2xl border p-6 text-left transition " +
                    (active
                      ? "border-[#1464f6] bg-white shadow-md ring-2 ring-blue-100"
                      : "border-slate-200/80 bg-white/80 hover:border-blue-300 hover:bg-white")
                  }
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-[#1464f6]">
                        {item.step}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{item.short}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black text-[#071c56]">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.desc}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Minimal Friendly FAQ */}
        <section id="preguntas" className="border-t border-slate-100 px-6 py-12 sm:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-black sm:text-3xl">Preguntas rápidas</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition open:border-blue-200 open:bg-blue-50/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-[#071c56]">
                    <span>{faq.q}</span>
                    <span className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-sm text-[#1464f6] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Clean Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 text-xs text-slate-500 sm:px-12">
          <span>Crea · Orientación tributaria y formalización empresarial</span>
          <a
            href="https://commons.wikimedia.org/wiki/File:PLAZA_DE_ARMAS_DE_CAJAMARCA.jpg"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Foto: Carlos jc / Wikimedia Commons · CC BY-SA 4.0
          </a>
        </footer>
      </div>
    </main>
  );
}

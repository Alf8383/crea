"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS, type DemoPreset } from "@/lib/demo-presets";
import { getTaxPath } from "@/lib/practical-guides";
import { categories, rules, sources } from "@/lib/seed-catalog";
import { RuleEngine } from "@/lib/rule-engine";
import type { BusinessContext, RequirementStatus } from "@/lib/types";

export default function BusinessesPage() {
  const router = useRouter();
  const [savedContext, setSavedContext] = useState<BusinessContext | null>(null);
  const [statuses, setStatuses] = useState<Record<string, RequirementStatus>>({});
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const rawContext = localStorage.getItem(scopedStorageKey("efp-business-context"));
        if (rawContext) setSavedContext(JSON.parse(rawContext) as BusinessContext);
        const rawStatuses = localStorage.getItem(scopedStorageKey("efp-requirement-statuses"));
        if (rawStatuses) setStatuses(JSON.parse(rawStatuses));
        const rawDraft = localStorage.getItem(scopedStorageKey("efp-questionnaire-draft"));
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          setHasDraft(Boolean(parsed?.answers && Object.keys(parsed.answers).length > 0));
        }
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const startFresh = () => {
    try {
      localStorage.removeItem(scopedStorageKey("efp-questionnaire-draft"));
      localStorage.removeItem(scopedStorageKey("efp-business-context"));
      localStorage.removeItem(scopedStorageKey("efp-requirement-statuses"));
    } catch {}
    router.push("/negocios/nuevo");
  };

  const loadPresetAndOpen = (preset: DemoPreset) => {
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

  const category = savedContext ? categories.find((item) => item.id === savedContext.sectorId) : undefined;
  const steps = savedContext ? RuleEngine.evaluate(savedContext, rules, sources) : [];
  const completedSteps = steps.filter((item) => statuses[item.requirementId] === "COMPLETADO").length;
  const taxAdvice = savedContext ? getTaxPath(savedContext) : undefined;

  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <AppHeader admin />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Mi espacio de emprendimiento</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#053b78] sm:text-4xl">Tus evaluaciones empresariales</h1>
            <p className="mt-2 text-slate-600">
              Consulta el diagnóstico de tu negocio, compara regímenes tributarios o inicia una evaluación guiada.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/negocios/demo/ruta"
              className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0069c7] hover:bg-blue-50"
            >
              Ver panel de ruta →
            </Link>
            <Link href="/negocios/nuevo" className="rounded-xl bg-[#0069c7] px-5 py-3 text-sm font-bold text-white hover:bg-[#0058a8]">
              {hasDraft || savedContext ? "Continuar o editar cuestionario" : "+ Iniciar cuestionario"}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {savedContext ? (
            <article className="flex flex-col justify-between rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-2xl">{category?.icon || "✦"}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {taxAdvice?.code ? `Preselección: ${taxAdvice.code}` : "Evaluación guardada"}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-black text-[#053b78]">{savedContext.businessName}</h2>
                <p className="mt-1 text-sm font-semibold text-[#1464f6]">
                  {category?.name || "Negocio"} · {[savedContext.district, savedContext.province, savedContext.department].filter(Boolean).join(", ") || "Perú"}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600">
                  <div>
                    <span className="block font-bold uppercase text-slate-400">Personería</span>
                    <span className="font-semibold text-[#10295b]">
                      {savedContext.legalPerson === "natural"
                        ? "Persona Natural"
                        : savedContext.legalPerson === "juridica"
                        ? "Persona Jurídica"
                        : "Por definir"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold uppercase text-slate-400">Ventas / mes</span>
                    <span className="font-semibold text-[#10295b]">
                      S/ {new Intl.NumberFormat("es-PE").format(savedContext.monthlyRevenue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold uppercase text-slate-400">Avance</span>
                    <span className="font-semibold text-[#10295b]">
                      {completedSteps}/{steps.length} pasos
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <Link href="/negocios/demo/ruta" className="rounded-xl bg-[#1464f6] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                  Abrir mi ruta y simulador →
                </Link>
                <Link href="/negocios/nuevo" className="text-sm font-bold text-[#0069c7] hover:underline">
                  Editar respuestas
                </Link>
              </div>
            </article>
          ) : (
            <div className="flex flex-col justify-between rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1464f6]">
                  ✦ Paso recomendado
                </span>
                <h2 className="mt-4 text-2xl font-black text-[#053b78]">Comienza el cuestionario de tu negocio</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Responde preguntas sencillas sobre tu rubro, ubicación en Cajamarca, ventas proyectadas y comprobantes para recibir tu ruta personalizada.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/negocios/nuevo" className="rounded-xl bg-[#1464f6] px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                  Ir al cuestionario guiado →
                </Link>
                <Link href="/negocios/demo/ruta" className="rounded-xl border border-blue-200 px-4 py-3 text-sm font-bold text-[#0069c7] hover:bg-blue-50">
                  Ver ruta de demostración
                </Link>
              </div>
            </div>
          )}

          <div className="flex min-h-60 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/70 p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl font-bold text-[#0069c7] shadow-sm">+</span>
            <h2 className="mt-3 text-xl font-bold text-[#053b78]">
              {savedContext || hasDraft ? "Evaluar un nuevo negocio desde cero" : "Simulación limpia desde cero"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Limpia el borrador actual e inicia una nueva evaluación paso a paso para otro giro o idea de negocio.
            </p>
            <button
              type="button"
              onClick={startFresh}
              className="mt-5 rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-bold text-[#0069c7] shadow-sm hover:bg-blue-50"
            >
              {savedContext || hasDraft ? "Reiniciar y crear nueva evaluación" : "Iniciar cuestionario →"}
            </button>
          </div>
        </div>

        {/* Quick Demo Scenarios for Cajamarca */}
        <section className="mt-10 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#1464f6]">Plantillas rápidas de prueba</p>
              <h2 className="mt-1 text-2xl font-black text-[#053b78]">Casos prácticos de emprendimientos en Cajamarca</h2>
              <p className="mt-1 text-sm text-slate-600">
                Carga cualquiera de estos escenarios con un clic para explorar cómo el motor de reglas recomienda NRUS, RER o RMT.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {DEMO_PRESETS.map((preset) => (
              <article key={preset.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-blue-300 hover:bg-white">
                <div>
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#1464f6]">{preset.badge}</span>
                  <h3 className="mt-3 text-lg font-black text-[#053b78]">{preset.shortTitle}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{preset.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadPresetAndOpen(preset)}
                  className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-bold text-[#1464f6] hover:bg-[#1464f6] hover:text-white"
                >
                  Cargar este caso y ver ruta →
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

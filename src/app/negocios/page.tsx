"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { scopedStorageKey } from "@/lib/account-storage";
import { DEMO_PRESETS, type DemoPreset } from "@/lib/demo-presets";
import { getTaxPath } from "@/lib/practical-guides";
import { RuleEngine } from "@/lib/rule-engine";
import { categories, rules, sources } from "@/lib/seed-catalog";
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader admin />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Panel de emprendedor</span>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Mi espacio de evaluación
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Retoma tu diagnóstico guardado, inicia una nueva evaluación o carga uno de los escenarios de prueba.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/negocios/demo/ruta"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600"
            >
              Abrir ruta y simulador →
            </Link>
            <Link
              href="/negocios/nuevo"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              {hasDraft || savedContext ? "Continuar o editar cuestionario" : "+ Iniciar cuestionario"}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {savedContext ? (
            <article className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {category?.name || "Mi negocio"}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {taxAdvice?.code ? `Preselección: ${taxAdvice.code}` : "Evaluación guardada"}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-extrabold text-slate-900">{savedContext.businessName}</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  📍 {[savedContext.district, savedContext.province, savedContext.department].filter(Boolean).join(", ") || "Perú"}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Personería</span>
                    <b className="text-slate-800">
                      {savedContext.legalPerson === "natural"
                        ? "P. Natural"
                        : savedContext.legalPerson === "juridica"
                        ? "P. Jurídica"
                        : "Por definir"}
                    </b>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Ventas/mes</span>
                    <b className="text-slate-800">
                      S/ {new Intl.NumberFormat("es-PE").format(savedContext.monthlyRevenue || 0)}
                    </b>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Avance</span>
                    <b className="text-blue-600">
                      {completedSteps}/{steps.length} pasos
                    </b>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <Link
                  href="/negocios/demo/ruta"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Abrir mi ruta y simulador →
                </Link>
                <Link href="/negocios/nuevo" className="text-xs font-bold text-slate-600 hover:text-blue-600">
                  Editar respuestas ✎
                </Link>
              </div>
            </article>
          ) : (
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div>
                <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                  Evaluación personalizada
                </span>
                <h2 className="mt-3 text-xl font-extrabold text-slate-900">Aún no has guardado un negocio</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-600 sm:text-sm">
                  Responde el cuestionario guiado para descubrir qué régimen tributario se adapta a tu negocio y qué trámites necesitas cumplir.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href="/negocios/nuevo"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Empezar cuestionario →
                </Link>
                <Link
                  href="/negocios/demo/ruta"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Ver simulador demo
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-lg font-extrabold text-blue-600">
              +
            </span>
            <h2 className="mt-3 text-base font-extrabold text-slate-900">
              {savedContext || hasDraft ? "Iniciar nueva evaluación limpia" : "Simular un negocio desde cero"}
            </h2>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Borra las respuestas anteriores y comienza un diagnóstico nuevo paso a paso.
            </p>
            <button
              type="button"
              onClick={startFresh}
              className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:border-blue-300 hover:text-blue-600"
            >
              {savedContext || hasDraft ? "Reiniciar y crear nueva" : "Ir al cuestionario →"}
            </button>
          </div>
        </div>

        {/* Plantillas rápidas */}
        <section className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Plantillas listas en 1 clic</span>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
            Escenarios empresariales de demostración
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {DEMO_PRESETS.map((preset) => (
              <article
                key={preset.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-blue-300 hover:bg-white"
              >
                <div>
                  <span className="inline-block rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                    {preset.badge}
                  </span>
                  <h3 className="mt-2.5 text-sm font-extrabold text-slate-900">{preset.shortTitle}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{preset.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadPresetAndOpen(preset)}
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                >
                  Cargar y abrir en el simulador →
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

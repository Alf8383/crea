"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { scopedStorageKey } from "@/lib/account-storage";
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

  const category = savedContext ? categories.find((item) => item.id === savedContext.sectorId) : undefined;
  const steps = savedContext ? RuleEngine.evaluate(savedContext, rules, sources) : [];
  const completedSteps = steps.filter((item) => statuses[item.requirementId] === "COMPLETADO").length;
  const taxAdvice = savedContext ? getTaxPath(savedContext) : undefined;

  return (
    <main className="min-h-screen bg-[#f4f8fc]">
      <AppHeader admin />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Mi espacio</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#053b78]">Tus evaluaciones empresariales</h1>
            <p className="mt-2 text-slate-600">
              Consulta el diagnóstico de tu negocio, compara regímenes tributarios o inicia una nueva evaluación.
            </p>
          </div>
          <Link href="/negocios/nuevo" className="rounded-xl bg-[#0069c7] px-5 py-3 font-bold text-white hover:bg-[#0058a8]">
            {hasDraft || savedContext ? "Continuar o editar evaluación" : "+ Nueva evaluación"}
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {savedContext ? (
            <article className="flex flex-col justify-between rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-2xl">
                    {category?.icon || "✦"}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {taxAdvice?.code ? `Preselección: ${taxAdvice.code}` : "Evaluación guardada"}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-black text-[#053b78]">{savedContext.businessName}</h2>
                <p className="mt-1 text-sm font-semibold text-[#1464f6]">
                  {category?.name || "Negocio"} · {[savedContext.district, savedContext.province, savedContext.department].filter(Boolean).join(", ") || "Perú"}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600">
                  <div>
                    <span className="block font-bold text-slate-400 uppercase">Personería</span>
                    <span className="font-semibold text-[#10295b]">
                      {savedContext.legalPerson === "natural"
                        ? "Persona Natural"
                        : savedContext.legalPerson === "juridica"
                        ? "Persona Jurídica"
                        : "Por definir"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase">Avance de ruta</span>
                    <span className="font-semibold text-[#10295b]">
                      {completedSteps} de {steps.length} pasos completados
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <Link href="/negocios/demo/ruta" className="rounded-xl bg-[#1464f6] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                  Ver mi ruta y regímenes →
                </Link>
                <Link href="/negocios/nuevo" className="text-sm font-bold text-[#0069c7] hover:underline">
                  Editar respuestas
                </Link>
              </div>
            </article>
          ) : (
            <Link href="/negocios/demo/ruta" className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-blue-300">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-xl">✦</span>
              <h2 className="mt-5 text-xl font-bold text-[#053b78]">Explorar ruta de demostración</h2>
              <p className="mt-2 text-sm text-slate-500">
                Aún no has completado el cuestionario. Abre el escenario de ejemplo en Cajamarca o inicia tu propia evaluación.
              </p>
              <p className="mt-6 text-sm font-bold text-[#0069c7]">Ver ejemplo →</p>
            </Link>
          )}

          <div className="flex min-h-60 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/70 p-6 text-center">
            <span className="text-3xl font-bold text-[#0069c7]">+</span>
            <h2 className="mt-3 text-xl font-bold text-[#053b78]">
              {savedContext || hasDraft ? "Evaluar un nuevo negocio desde cero" : "Comenzar mi evaluación"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Responde preguntas simples sobre tu actividad, ingresos estimados y forma de operar para conocer tu régimen tributario y requisitos.
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
      </div>
    </main>
  );
}

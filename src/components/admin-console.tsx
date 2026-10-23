"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { questions, visibleQuestions } from "@/lib/questionnaire";
import { requirements, rules, sources } from "@/lib/seed-catalog";

type Tab = "reglas" | "requisitos" | "fuentes" | "preguntas";
const labels: Record<Tab, string> = {
  reglas: "Reglas de decisión",
  requisitos: "Requisitos",
  fuentes: "Fuentes oficiales",
  preguntas: "Banco de preguntas",
};
const sectorNames = [
  "Restaurante / alimentos",
  "Tienda / comercio",
  "Tecnología",
  "Servicios",
  "Construcción",
  "Transporte",
  "Manufactura",
  "Turismo",
  "Hospedaje",
  "Educación",
  "Salud",
  "Belleza",
  "Agropecuario",
  "Importación",
  "Exportación",
  "Entretenimiento",
];
const allQuestions = [
  ...questions.flat(),
  ...sectorNames.flatMap((P01) => visibleQuestions(3, { P01 }).filter((q) => !questions[3].some((base) => base.id === q.id))),
];

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("reglas");
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader admin />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Catálogo del sistema</span>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Base de reglas, requisitos y fuentes</h1>

        <nav aria-label="Secciones de catálogo" className="mt-5 flex gap-1.5 overflow-x-auto">
          {(Object.keys(labels) as Tab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={
                "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition " +
                (tab === item ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100")
              }
            >
              {labels[item]}
            </button>
          ))}
        </nav>

        {tab === "reglas" && (
          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            {rules.map((rule) => (
              <article key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold text-blue-600">
                  {rule.id} · v{rule.version}
                </p>
                <h2 className="mt-1 text-sm font-extrabold text-slate-900">{rule.name}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Conector: {rule.conditions.connector} · {rule.actions.length} acción(es) · Fuente: {rule.sourceId}
                </p>
              </article>
            ))}
          </section>
        )}

        {tab === "requisitos" && (
          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            {requirements.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <span className="text-[11px] font-bold uppercase text-blue-600">{item.category}</span>
                <h2 className="mt-1 text-sm font-extrabold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{item.institution}</p>
              </article>
            ))}
          </section>
        )}

        {tab === "fuentes" && (
          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            {sources.map((source) => (
              <article key={source.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <span className="text-[11px] font-bold uppercase text-blue-600">{source.institution}</span>
                <h2 className="mt-1 text-sm font-extrabold text-slate-900">{source.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{source.evidence}</p>
                <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-blue-600 underline">
                  Abrir enlace oficial ↗
                </a>
              </article>
            ))}
          </section>
        )}

        {tab === "preguntas" && (
          <section className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {allQuestions.map((q) => (
              <article key={q.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <span className="text-[11px] font-bold text-blue-600">{q.id}</span>
                <h2 className="mt-0.5 text-xs font-bold text-slate-800">{q.title}</h2>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

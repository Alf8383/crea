"use client";

import Link from "next/link";
import { useState } from "react";
import { questions, visibleQuestions } from "@/lib/questionnaire";
import { requirements, rules, sources } from "@/lib/seed-catalog";

type Tab = "reglas" | "requisitos" | "fuentes" | "preguntas" | "auditoria";
const labels: Record<Tab, string> = { reglas: "Reglas", requisitos: "Requisitos", fuentes: "Fuentes", preguntas: "Preguntas", auditoria: "Auditoría" };
const sectorNames = ["Restaurante / alimentos", "Tienda / comercio", "Tecnología", "Servicios", "Construcción", "Transporte", "Manufactura", "Turismo", "Hospedaje", "Educación", "Salud", "Belleza", "Agropecuario", "Importación", "Exportación", "Entretenimiento"];
const allQuestions = [...questions.flat(), ...sectorNames.flatMap(P01 => visibleQuestions(3, { P01 }).filter(q => !questions[3].some(base => base.id === q.id)))];

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("reglas");
  return <main className="min-h-screen bg-[#edf5fb] text-[#071c56]">
    <header className="border-b border-blue-100 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link href="/" className="text-3xl font-black text-[#0a318c]">Crea</Link><Link href="/negocios" className="text-sm font-bold text-[#1464f6]">Mi espacio</Link></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8"><p className="text-sm font-bold uppercase tracking-widest text-[#1464f6]">Panel administrativo · vista de consulta</p><h1 className="mt-2 text-4xl font-black">Catálogo y revisión</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Este prototipo permite inspeccionar la configuración. La edición, aprobación humana y auditoría persistente aún no están habilitadas.</p>
      <nav aria-label="Secciones de administración" className="mt-8 flex gap-2 overflow-x-auto border-b border-blue-200">{(Object.keys(labels) as Tab[]).map(item=><button key={item} onClick={()=>setTab(item)} aria-current={tab===item?"page":undefined} className={"whitespace-nowrap border-b-4 px-4 py-3 font-bold "+(tab===item?"border-[#1464f6] text-[#1464f6]":"border-transparent text-slate-500")}>{labels[item]}</button>)}</nav>
      {tab==="reglas"&&<section className="mt-6 space-y-3"><h2 className="text-2xl font-bold">Reglas configuradas</h2>{rules.map(rule=><article key={rule.id} className="rounded-2xl border border-blue-100 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-bold text-[#1464f6]">{rule.id} · versión {rule.version}</p><h3 className="mt-1 text-lg font-bold">{rule.name}</h3><p className="mt-2 text-sm text-slate-600">{rule.conditions.connector} · {rule.actions.length} requisito(s) · Fuente: {rule.sourceId}</p></div><span className="h-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Pendiente de aprobación formal</span></div></article>)}</section>}
      {tab==="requisitos"&&<section className="mt-6"><h2 className="text-2xl font-bold">Requisitos orientativos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{requirements.map(item=><article key={item.id} className="rounded-2xl border border-blue-100 bg-white p-5"><p className="text-xs font-bold uppercase text-[#1464f6]">{item.category}</p><h3 className="mt-1 font-bold">{item.title}</h3><p className="mt-2 text-sm text-slate-600">{item.institution}</p></article>)}</div></section>}
      {tab==="fuentes"&&<section className="mt-6"><h2 className="text-2xl font-bold">Fuentes oficiales por revisar</h2><div className="mt-4 grid gap-3">{sources.map(source=><article key={source.id} className="rounded-2xl border border-blue-100 bg-white p-5"><p className="text-xs font-bold uppercase text-[#1464f6]">{source.institution}</p><h3 className="mt-1 font-bold">{source.title}</h3><p className="mt-2 text-sm text-slate-600">Estado: {source.status==="VIGENTE"?"revisada":"pendiente de verificación formal"}. {source.evidence}</p><a href={source.url} target="_blank" rel="noreferrer" className="mt-3 inline-block font-bold text-[#1464f6]">Abrir fuente ↗</a></article>)}</div></section>}
      {tab==="preguntas"&&<section className="mt-6"><h2 className="text-2xl font-bold">Preguntas del cuestionario</h2><p className="mt-2 text-slate-600">Incluye preguntas comunes, seguimientos y bloques por rubro.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{allQuestions.map(q=><article key={q.id} className="rounded-xl border border-blue-100 bg-white p-4"><p className="text-xs font-bold text-[#1464f6]">{q.id}</p><h3 className="mt-1 font-semibold">{q.title}</h3></article>)}</div></section>}
      {tab==="auditoria"&&<section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6"><h2 className="text-2xl font-bold">Auditoría</h2><p className="mt-3 leading-7 text-slate-600">No hay eventos administrativos persistidos. El registro real aparecerá aquí cuando se habiliten las operaciones de edición y publicación.</p></section>}
    </div>
  </main>;
}

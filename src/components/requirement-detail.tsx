import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requirementById, sourceById } from "@/lib/seed-catalog";

export function RequirementDetail({ id }: { id: string }) {
  const requirement = requirementById(id);
  if (!requirement) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-12 text-center">No encontramos este requisito.</main>
      </div>
    );
  }
  const source = sourceById(requirement.sourceId);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <Link href="/negocios/demo/ruta" className="text-xs font-bold text-blue-600 hover:underline">
          ← Volver a mi ruta de formalización
        </Link>

        <article className="mt-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{requirement.category}</span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{requirement.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{requirement.description}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl bg-slate-50 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Entidad competente</h2>
              <p className="mt-1 text-sm font-bold text-slate-900">{requirement.institution}</p>
            </section>
            <section className="rounded-2xl bg-slate-50 p-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Referencias / requisitos</h2>
              <ul className="mt-1 space-y-1 text-xs font-medium text-slate-700">
                {requirement.documents.map((document) => (
                  <li key={document}>• {document}</li>
                ))}
              </ul>
            </section>
          </div>

          {source && (
            <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-xs font-bold text-blue-700">Fuente oficial vinculada</p>
              <a
                className="mt-1 inline-block text-sm font-extrabold text-slate-900 underline hover:text-blue-600"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.title} ↗
              </a>
              <p className="mt-1 text-xs text-slate-600">{source.evidence}</p>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}

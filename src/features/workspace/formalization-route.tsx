"use client";

import { Building2, ClipboardCheck, ListChecks } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SourceLink } from "@/components/ui/primitives";
import type { AssessmentSnapshot } from "@/features/evaluation/session-storage";
import { buildFormalizationRoute } from "@/lib/formalization";

export function FormalizationRoute({ assessment, uid }: { assessment: AssessmentSnapshot; uid?: string }) {
  const key = "crea:formalizacion:v1:" + (uid ?? "guest") + ":" + (assessment.id ?? assessment.date);
  const tasks = buildFormalizationRoute(assessment.context);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(sessionStorage.getItem(key) ?? "{}") ?? {}; } catch { return {}; }
  });
  const [storageWarning, setStorageWarning] = useState(false);
  const complete = tasks.filter((task) => checked[task.id] ?? task.declaredComplete).length;

  function toggle(id: string, value: boolean) {
    const next = { ...checked, [id]: value };
    setChecked(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { setStorageWarning(true); }
  }

  return <div className="grid gap-6">
    <Card className="route-intro grid gap-3 p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <ListChecks aria-hidden="true" /><h2 className="editorial-title">Tu lista de trámites</h2>
      </div>
      <p id="route-progress-label" aria-live="polite">{complete} de {tasks.length} tareas marcadas</p>
      <progress className="h-3 w-full accent-primary" max={tasks.length} value={complete} aria-labelledby="route-progress-label" />
      <p className="text-sm">Guarda tu progreso en esta pestaña. Las tareas con «Por confirmar» dependen de tu caso y de lo que indique la autoridad.</p>
      {storageWarning && <p role="status">El navegador bloqueó el guardado. El progreso se conserva mientras esta página esté abierta.</p>}
    </Card>
    {(["Identidad y registro", "Permisos y operación"] as const).map((phase, index) => {
      const Icon = index === 0 ? Building2 : ClipboardCheck;
      return <section key={phase} className="grid gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Icon aria-hidden="true" /> {phase}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.filter((task) => task.phase === phase).map((task) => {
            const done = checked[task.id] ?? Boolean(task.declaredComplete);
            return <Card key={task.id} className="grid content-start gap-2 border-l-4 border-l-primary/40 p-4 sm:p-5">
              <label className="flex min-h-11 items-center gap-2 font-bold">
                <input type="checkbox" checked={done} onChange={(event) => toggle(task.id, event.target.checked)} />
                {task.title}
              </label>
              <p className="text-sm">{task.description}</p>
              {task.after && <p className="text-sm text-muted-foreground">Paso previo · {task.after}</p>}
              <p className="text-sm font-semibold">{done ? "Completada" : task.conditional ? "Por confirmar" : "Pendiente"}</p>
              <details className="rule-details border-t border-border">
                <summary>Ver pasos y fuente</summary>
                <ol className="list-decimal space-y-1 pb-2 pl-5 text-sm">{task.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                <SourceLink href={task.url}>{task.institution}</SourceLink>
              </details>
            </Card>;
          })}
        </div>
      </section>;
    })}
  </div>;
}

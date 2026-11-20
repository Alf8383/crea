"use client";

import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_PRESETS } from "@/lib/demo-presets";

export function Examples({ open }: { open: (id: string) => void }) {
  return <div className="grid gap-4">
    <p className="max-w-prose text-muted-foreground">Compara el diagnóstico, la simulación y los trámites de negocios ficticios en Cajamarca.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {DEMO_PRESETS.map(({ id, shortTitle, summary }) => <Card key={id} className="grid content-start justify-items-start gap-3 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><FlaskConical size={16} aria-hidden="true" /> Simulación</p>
        <h2 className="text-xl font-bold">{shortTitle}</h2>
        <p className="text-sm">{summary}</p>
        <Button variant="outline" aria-label={"Abrir ejemplo: " + shortTitle} onClick={() => open(id)}>Abrir ejemplo</Button>
      </Card>)}
    </div>
  </div>;
}

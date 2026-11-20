"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SourceLink } from "@/components/ui/primitives";
import { ciiuCatalog, ciiuCodes, CIIU_SOURCE, CIIU_TABLE, clues, isCiiuCode, suggestedCodes, type CiiuClue } from "@/lib/ciiu-catalog";
import { ChoiceField } from "./assessment-fields";

const endpoint = process.env.NEXT_PUBLIC_CREA_ASSISTANT_URL;

export function ClassificationField({ description, evidence, primary, secondary, error, onPrimary, onEvidence, onSecondary }: {
  description: string; evidence: string; primary: string; secondary: string; error?: string;
  onPrimary: (value: string) => void; onEvidence: (value: string) => void; onSecondary: (value: string) => void;
}) {
  const [assisted, setAssisted] = useState<{ description: string; clues: CiiuClue[] }>();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const suggestions = suggestedCodes(description, assisted?.description === description ? assisted.clues : []);
  const order = [...suggestions, ...ciiuCodes.filter((code) => !suggestions.includes(code))];

  async function suggest() {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(endpoint!, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }), credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error("Provider unavailable");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("clues" in data) || !Array.isArray(data.clues)) throw new Error("Invalid clues");
      setAssisted({ description, clues: data.clues.filter((key): key is CiiuClue => typeof key === "string" && Object.hasOwn(clues, key)) });
      setStatus("Sugerencias asistidas por un modelo. Confirma el modo de operar.");
    } catch {
      setStatus("El proveedor no respondió. Puedes continuar con las preguntas y el catálogo del INEI.");
    } finally {
      setBusy(false);
    }
  }

  function selectEvidence(value: string) {
    onEvidence(value);
    onPrimary(value === "unknown" ? "unknown" : "");
    onSecondary(secondary.split(",").filter((code) => code !== value).join(","));
  }

  return <section id="activity" tabIndex={-1} className="grid gap-4 rounded-xl border border-border p-4">
    <h3 className="font-bold">Clasifica tu actividad con el catálogo CIIU</h3>
    {suggestions.length > 0 && <details className="rule-details">
      <summary>Clases candidatas según la descripción</summary>
      <ul className="grid gap-2 pb-2 text-sm">{suggestions.map((code) => <li key={code}><strong>{code} · {ciiuCatalog[code].name}</strong><br />{ciiuCatalog[code].reason}</li>)}</ul>
    </details>}
    {endpoint && <div className="text-sm">
      <Button type="button" variant="outline" disabled={busy || !description.trim()} onClick={() => void suggest()}>Enviar descripción al proveedor para sugerir actividades</Button>
      <p className="mt-1 text-muted-foreground">Comparte solo lo que ofreces. Evita incluir datos personales.</p>
      {status && <p role="status">{status}</p>}
    </div>}
    <ChoiceField id="activityEvidence" label="¿Qué actividad aporta más al negocio?" value={evidence} onChange={selectEvidence}
      hint="Si vendes comidas y bebidas, indica qué servicio predomina. Separa los eventos puntuales de los contratos continuos."
      options={[...order.map((code) => [code, ciiuCatalog[code].evidence, ""] as const), ["unknown", "Aún no puedo identificarla o mi actividad no figura", ""]]} />
    {isCiiuCode(evidence) ? <div className="grid gap-2 rounded-lg bg-muted p-3 text-sm">
      <p><strong>{evidence} · {ciiuCatalog[evidence].name}</strong></p>
      <p>{ciiuCatalog[evidence].reason}</p>
      <SourceLink href={CIIU_SOURCE + "#page=" + ciiuCatalog[evidence].page}>Consultar las notas del INEI</SourceLink>
      <label className="flex min-h-10 items-center gap-2 font-semibold">
        <input type="checkbox" checked={primary === evidence} onChange={(event) => onPrimary(event.target.checked ? evidence : "")} />
        Confirmo este código como actividad principal
      </label>
    </div> : <p className="font-semibold">Clasificación pendiente</p>}
    {isCiiuCode(primary) && <details className="rule-details">
      <summary>Agregar actividades secundarias</summary>
      <p className="text-sm text-muted-foreground">Marca solo actividades que operas como líneas distintas del negocio.</p>
      {ciiuCodes.filter((code) => code !== primary).map((code) => {
        const selected = secondary.split(",").filter(Boolean);
        return <label className="flex min-h-10 items-center gap-2 text-sm" key={code}>
          <input type="checkbox" checked={selected.includes(code)} onChange={(event) =>
            onSecondary(event.target.checked ? [...selected, code].join(",") : selected.filter((item) => item !== code).join(","))} />
          {code} · {ciiuCatalog[code].name}
        </label>;
      })}
    </details>}
    {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
    <SourceLink href={CIIU_TABLE}>Tabla oficial CIIU Rev. 4</SourceLink>
  </section>;
}

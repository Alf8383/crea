"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputClassName } from "@/components/ui/input";
import { Notice, SourceLink } from "@/components/ui/primitives";
import type { CreaIaResponse } from "@/lib/crea-ia";
import type { FullWorkspaceEvaluation } from "@/lib/rule-engine";
import type { BusinessContext } from "@/lib/types";

const suggestions = ["¿Cuál es la diferencia entre RER y RMT?", "¿Cómo funciona el crédito fiscal del IGV?", "¿Qué obligaciones se revisan cada mes?"];

export function Assistant({ context, evaluation }: { context: BusinessContext; evaluation: FullWorkspaceEvaluation }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [responses, setResponses] = useState<Array<{ query: string; response: CreaIaResponse }>>([]);
  const latest = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (responses.length) latest.current?.focus();
  }, [responses]);

  async function ask(question: string) {
    if (busy) return;
    const text = question.trim();
    if (text.length < 5) {
      setError("Escribe una consulta de al menos cinco caracteres.");
      document.getElementById("crea-query")?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { askCreaIa } = await import("@/lib/crea-ia");
      const response = await askCreaIa(text, context, evaluation);
      setResponses((items) => [{ query: text, response }, ...items]);
      setQuery("");
    } catch {
      setError("No pudimos responder la consulta. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(query);
  }

  return <div className="grid gap-6">
    <div className="grid gap-4">
      <p className="text-muted-foreground">Esta sección explica tu diagnóstico con reglas y documentos seleccionados de SUNAT. Escribe tu duda sin contraseñas ni datos identificables.</p>
      <form onSubmit={submit} className="grid gap-3">
        <Field id="crea-query" label="Tu pregunta">
          <textarea id="crea-query" className={inputClassName} rows={3} maxLength={400} value={query} onChange={(event) => setQuery(event.target.value)} />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" disabled={busy} className="justify-self-start">{busy ? "Consultando…" : "Consultar"} <ArrowRight aria-hidden="true" /></Button>
      </form>
      <div className="border-t border-border pt-3">
        <h2 className="text-sm font-bold text-muted-foreground">Preguntas frecuentes</h2>
        <div className="mt-2 flex flex-wrap gap-2">{suggestions.map((question) => <Button key={question} variant="outline" className="whitespace-normal text-left" onClick={() => void ask(question)} disabled={busy}>{question}</Button>)}</div>
      </div>
    </div>
    <div className="grid gap-4" aria-busy={busy}>
      {responses.map(({ query, response }, index) => <article key={index} className="grid gap-3 border-t border-border py-5">
        <h2 ref={index === 0 ? latest : undefined} tabIndex={-1} className="editorial-title flow-anchor">{query}</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed">{response.answer}</p>
        {response.citations.length > 0 && <ul>{response.citations.map((cite, citeIndex) => <li key={citeIndex}><SourceLink href={cite.url}>{cite.title}</SourceLink></li>)}</ul>}
      </article>)}
    </div>
  </div>;
}

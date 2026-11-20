"use client";

import { Cloud, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/features/auth/session";
import { assistantTopics, isAssistantTopic, localAssistantTopic, type AssistantTopic } from "@/lib/assistant-topics";
import { ciiuCatalog, type CiiuCode } from "@/lib/ciiu-catalog";

type Context = { stage: string; question: string; topics: AssistantTopic[]; stageAnswered: boolean; planning: boolean; code?: CiiuCode };

function contextualHelp(context: Context | null, topic?: AssistantTopic) {
  if (topic === "sales" && context?.planning) return "Para tu etapa inicial, registra la estimación como proyección de todo el ejercicio.";
  if ((topic === "ciiu" || topic === "mixed") && context?.code) {
    const entry = ciiuCatalog[context.code];
    return context.code + " · " + entry.name + ". " + entry.reason;
  }
}
const subscribeToHydration = () => () => {};
const Register = createContext<(value: Context | null) => void>(() => {});
type Message = { question: string; topic?: AssistantTopic; context?: string };

export function useAssistantContext(context: Context) {
  const register = useContext(Register);
  useEffect(() => {
    register(context);
    return () => register(null);
  }, [context, register]);
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Context | null>(null);
  const { user, loading } = useSession();
  return <Register.Provider value={setContext}>
    {children}
    <CloudChat key={loading ? "loading" : user?.uid ?? "guest"} context={context} />
  </Register.Provider>;
}

function CloudChat({ context }: { context: Context | null }) {
  const ready = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const path = usePathname();
  const restricted = path === "/investigacion" || path.startsWith("/investigacion/");
  const [open, setOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [model, setModel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [providerStatus, setProviderStatus] = useState("");
  const button = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const request = useRef<AbortController | null>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const endpoint = process.env.NEXT_PUBLIC_CREA_ASSISTANT_URL;

  useEffect(() => {
    if (open) close.current?.focus();
  }, [open, restricted]);

  useEffect(() => {
    if (restricted) request.current?.abort();
  }, [restricted]);

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages.length]);

  function dismiss() {
    setOpen(false);
    button.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  async function ask(input: string, explicitTopic?: AssistantTopic) {
    const value = input.trim();
    if (!value || restricted || busy) return;
    const topic = explicitTopic ?? localAssistantTopic(value);
    const details = (chosen?: AssistantTopic) => authorized ? contextualHelp(context, chosen) : undefined;
    setQuestion("");
    setProviderStatus("");
    if (topic || !model || !endpoint) {
      setMessages((previous) => [...previous.slice(-19), { question: value, topic, context: details(topic) }]);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value }), credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]) });
      if (!response.ok) throw new Error("Assistant unavailable");
      const data: unknown = await response.json();
      const suggestion = data && typeof data === "object" && "topic" in data ? data.topic : undefined;
      if (!controller.signal.aborted) {
        setProviderStatus("Selección de tema asistida por modelo. Respuesta del contenido verificado.");
        const selected = isAssistantTopic(suggestion) ? suggestion : undefined;
        setMessages((previous) => [...previous.slice(-19), { question: value, topic: selected, context: details(selected) }]);
      }
    } catch {
      if (!controller.signal.aborted) {
        setProviderStatus("El proveedor no respondió. Sigue disponible la ayuda con fuentes verificadas.");
        setMessages((previous) => [...previous.slice(-19), { question: value }]);
      }
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  const topics = context?.topics.length ? context.topics : ["ciiu", "sales", "tax"] as const;

  return <div className="crea-cloud print-hidden">
    {open && <section id="crea-cloud-panel" className="crea-cloud-panel" role="dialog" aria-labelledby="crea-cloud-title">
      <header className="crea-cloud-head">
        <div><h2 id="crea-cloud-title">CREA IA</h2><p>Orientación gastronómica</p></div>
        <Button ref={close} size="icon" variant="ghost" aria-label="Cerrar CREA IA" onClick={dismiss}><X aria-hidden="true" /></Button>
      </header>
      {restricted ? <p className="p-5">La asistencia está deshabilitada en el módulo de investigación para proteger las respuestas del pretest y el postest.</p> : <>
        <div ref={scroll} className="crea-cloud-log" role="log" aria-label="Conversación" aria-live="polite" tabIndex={0}>
          {context && <p className="text-sm"><strong>{context.stage}</strong><br />{context.question}</p>}
          {messages.length === 0 && <p className="text-sm">Consulta explicaciones con fuentes verificadas. Evita incluir RUC, claves o datos personales.</p>}
          {messages.map((message, index) => <div className="grid gap-2 text-sm" key={index}>
            <p className="crea-cloud-question">{message.question}</p>
            <div className="rounded-xl bg-muted p-3">
              {message.topic ? <>
                <p>{assistantTopics[message.topic].text}</p>
                {assistantTopics[message.topic].url.startsWith("/") ?
                  <Link className="underline" href={assistantTopics[message.topic].url}>{assistantTopics[message.topic].source}</Link> :
                  <a className="underline" href={assistantTopics[message.topic].url} target="_blank" rel="noreferrer">{assistantTopics[message.topic].source}</a>}
              </> : <p>No encontré una explicación verificada para esa consulta. Prueba las sugerencias o consulta las <Link href="/negocios?seccion=orientacion" className="underline">guías oficiales</Link>.</p>}
              {authorized && message.context && <p className="mt-2 border-t border-border pt-2">{message.context}</p>}
            </div>
          </div>)}
          {providerStatus && <p className="text-xs">{providerStatus}</p>}
        </div>
        <form className="crea-cloud-form" onSubmit={submit}>
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic) => <button className="crea-cloud-chip" key={topic} type="button" disabled={busy} onClick={() => void ask(assistantTopics[topic].label, topic)}>{assistantTopics[topic].label}</button>)}
          </div>
          {context?.stageAnswered && <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={authorized} onChange={(event) => {
            setAuthorized(event.target.checked);
            if (!event.target.checked) setMessages((previous) => previous.map(({ question, topic }) => ({ question, topic })));
          }} />Usar mi etapa y actividad en esta ayuda local</label>}
          {endpoint ? <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={model} onChange={(event) => setModel(event.target.checked)} />Enviar mi pregunta a un proveedor para identificar el tema</label>
            : <p className="text-xs text-muted-foreground">Modo local con fuentes verificadas. Proveedor de IA sin configurar.</p>}
          <div className="flex gap-2">
            <Input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={320} aria-label="Pregunta para CREA IA" placeholder="Escribe tu pregunta" />
            <Button type="submit" disabled={!question.trim() || busy}>{busy ? "Consultando…" : "Enviar"}</Button>
          </div>
          {messages.length > 0 && <button type="button" className="justify-self-start text-xs underline" onClick={() => {
            request.current?.abort();
            setMessages([]);
            setProviderStatus("");
          }}>Borrar conversación</button>}
        </form>
      </>}
    </section>}
    <button ref={button} type="button" disabled={!ready} aria-label="CREA IA, asistente de orientación" aria-expanded={open} aria-controls={open ? "crea-cloud-panel" : undefined}
      className="crea-cloud-trigger" onClick={() => open ? dismiss() : setOpen(true)}>
      <span className="crea-cloud-icon" aria-hidden="true"><Cloud fill="currentColor" strokeWidth={1.5} /><Sparkles strokeWidth={2} /></span>
      <span className="crea-cloud-label">CREA IA</span>
    </button>
  </div>;
}

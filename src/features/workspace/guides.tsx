"use client";

import {
  Autocomplete, AutocompleteClear, AutocompleteContent, AutocompleteGroup, AutocompleteGroupLabel,
  AutocompleteInput, AutocompleteItem, AutocompleteLabel, AutocompleteList,
} from "@ui-sdk/react/autocomplete";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import { inputClassName } from "@/components/ui/input";
import { SourceLink } from "@/components/ui/primitives";
import { practicalGuides } from "@/lib/practical-guides";
import { requirements, sources } from "@/lib/seed-catalog";
import { searchText } from "@/lib/utils";

function openProcedure(id: string) {
  const guide = document.getElementById(id);
  if (guide instanceof HTMLDetailsElement) {
    guide.open = true;
    requestAnimationFrame(() => guide.querySelector("summary")?.focus());
  }
}

export function Guides() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const term = searchText(query);
  const articles = requirements.filter(({ title, description }) => searchText(title + " " + description).includes(term));
  const procedures = Object.entries(practicalGuides).filter(([, guide]) => searchText(guide.title).includes(term));
  const count = articles.length + procedures.length;
  const groups = [
    { label: "Trámites y documentos", items: articles.map(({ id, title }) => ({ title, href: "/requisitos/" + id })) },
    { label: "Guías paso a paso", items: procedures.map(([id, guide]) => ({ title: guide.title, href: "#guia-" + id })) },
  ];

  function openHighlighted(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || !open) return;
    const active = event.currentTarget.getAttribute("aria-activedescendant");
    const href = active && document.getElementById(active)?.getAttribute("href");
    if (!href || !groups.some(({ items }) => items.some((item) => item.href === href))) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    if (href.startsWith("#")) openProcedure(href.slice(1));
    else router.push(href);
  }

  return <div className="grid gap-6">
    <div className="max-w-xl">
      <Autocomplete
        value={query}
        onValueChange={setQuery}
        open={open && Boolean(term) && count > 0}
        onOpenChange={setOpen}
        openOnFocus
        autoHighlight
        filter={false}
      >
        <div className="grid gap-2">
          <AutocompleteLabel className="font-semibold">Buscar en las guías</AutocompleteLabel>
          <div className="relative">
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
            <AutocompleteInput type="search" onKeyDownCapture={openHighlighted} placeholder="RUC, facturas, planilla…" className={inputClassName + " pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"} />
            <AutocompleteClear aria-label="Limpiar búsqueda" className="absolute inset-y-0 right-0.5 grid w-11 place-items-center rounded-md text-muted-foreground hover:bg-muted">
              <X size={17} aria-hidden="true" />
            </AutocompleteClear>
          </div>
        </div>
        <AutocompleteContent sideOffset={6}
          className="z-20 w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)] max-h-[min(18rem,var(--available-height,18rem))] overflow-auto overscroll-contain rounded-lg border border-border bg-card shadow-md">
          <AutocompleteList className="p-1.5">
            {groups.filter(({ items }) => items.length > 0).map(({ label, items }) => <AutocompleteGroup key={label} className="py-1">
              <AutocompleteGroupLabel className="px-3 py-1 text-xs font-extrabold text-muted-foreground">{label}</AutocompleteGroupLabel>
              {items.map(({ href, title }) => <AutocompleteItem key={href} value={href} label={title}
                render={href.startsWith("#") ? <a href={href} onClick={() => openProcedure(href.slice(1))} /> : <Link href={href} />}
                className="flex min-h-11 cursor-pointer items-center rounded-md px-3 py-2 text-sm leading-snug font-semibold data-[highlighted]:bg-accent data-[highlighted]:text-primary data-[highlighted]:outline data-[highlighted]:-outline-offset-1 data-[highlighted]:outline-ring">
                {title}
              </AutocompleteItem>)}
            </AutocompleteGroup>)}
          </AutocompleteList>
        </AutocompleteContent>
      </Autocomplete>
    </div>
    {term && <p role="status" className="text-sm text-muted-foreground">{count ? (count === 1 ? "1 resultado" : count + " resultados") : "No encontramos guías con esa búsqueda."}</p>}
    {articles.length > 0 && <section aria-labelledby="quick-guides-title">
      <h2 id="quick-guides-title" className="editorial-title mb-3">Trámites y documentos</h2>
      <ul>{articles.map((requirement) => <li key={requirement.id} className="border-t border-border py-3">
        <h3><Link href={"/requisitos/" + requirement.id} className="hero-secondary text-base" aria-label={"Ver guía sobre " + requirement.title}>{requirement.title} <ArrowRight size={16} aria-hidden="true" /></Link></h3>
        <p className="max-w-prose text-sm text-muted-foreground">{requirement.description}</p>
      </li>)}</ul>
    </section>}
    {procedures.length > 0 && <section aria-labelledby="practical-guides-title">
      <h2 id="practical-guides-title" className="editorial-title mb-3">Guías paso a paso</h2>
      {procedures.map(([id, guide]) => <details key={id} id={"guia-" + id} className="rule-details flow-anchor border-t border-border">
          <summary>{guide.title}</summary>
          <div className="pb-2 text-sm">
            <p className="mb-2 text-muted-foreground">{guide.where}</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{guide.prepare.map((item) => <li key={item}>{item}</li>)}</ul>
            <ol className="my-3 list-decimal space-y-1 pl-5">{guide.steps.map((item) => <li key={item}>{item}</li>)}</ol>
            {guide.note && <p className="text-muted-foreground">{guide.note}</p>}
            <SourceLink href={guide.officialUrl}>Consultar la fuente oficial</SourceLink>
          </div>
      </details>)}
    </section>}
    <details className="rule-details border-y border-border pb-2"><summary>Directorio de fuentes oficiales</summary>
      <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">{sources.filter((source) => source.verification === "VIGENTE").map((source) => <li key={source.id}><SourceLink href={source.url}>{source.title}</SourceLink></li>)}</ul>
    </details>
  </div>;
}

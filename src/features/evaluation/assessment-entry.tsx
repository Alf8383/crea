"use client";

import { ArrowRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { LinkButton } from "@/components/ui/primitives";
import { useSession } from "@/features/auth/session";
import { readAssessment, readDraft, subscribeToAssessment } from "./session-storage";

export function useActiveAssessment() {
  const { user, loading } = useSession();
  return useSyncExternalStore(subscribeToAssessment, () => {
    const snapshot = loading ? null : readAssessment(user?.uid);
    return Boolean(snapshot && !snapshot.demo);
  }, () => false);
}

export function useUnfinishedAssessment() {
  const { user, loading } = useSession();
  return useSyncExternalStore(subscribeToAssessment, () => !loading && Boolean(readDraft(user?.uid)), () => false);
}

export function AssessmentEntry({ className }: { className?: string }) {
  const active = useActiveAssessment();
  const unfinished = useUnfinishedAssessment();
  return <LinkButton href={active && !unfinished ? "/negocios?seccion=diagnostico" : "/negocios/nuevo"} size="lg" className={className}>
    {unfinished ? "Continuar mi evaluación" : active ? "Volver a mi diagnóstico" : "Evaluar mi negocio"} <ArrowRight aria-hidden="true" />
  </LinkButton>;
}

import { Suspense } from "react";
import { Workspace } from "@/features/workspace/workspace";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function RoutePage() {
  return <Suspense fallback={<div className="container-site page-shell"><p role="status">Cargando tu espacio…</p></div>}><Workspace initialSection="ruta" /></Suspense>;
}

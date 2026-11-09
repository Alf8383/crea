"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DEMO_PRESETS } from "@/lib/demo-presets";
import { practicalGuides } from "@/lib/practical-guides";
import { RuleEngine, RULE_ENGINE_VERSION } from "@/lib/rule-engine";
import { seedCatalog } from "@/lib/seed-catalog";

type AdminTab =
  | "reglas"
  | "fuentes"
  | "contenidos"
  | "casos"
  | "auditoria"
  | "investigacion";

const TAB_LABELS: Record<AdminTab, string> = {
  reglas: "1. Reglas tributarias y versionado",
  fuentes: "2. Fuentes oficiales y vigencia",
  contenidos: "3. Contenidos educativos",
  casos: "4. Casos de prueba (Restaurantes)",
  auditoria: "5. Registros de auditoría",
  investigacion: "6. Resultados anonimizados",
};

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  version: string;
}

const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "AUD-2026-001",
    timestamp: "2026-01-01T08:00:00Z",
    actor: "Administrador del Sistema",
    action: "PUBLICACION_CATALOGO_REGLAS",
    target: "Motor de Reglas Tributarias para Restaurantes (NRUS, RER, RMT, RG)",
    version: RULE_ENGINE_VERSION,
  },
  {
    id: "AUD-2026-002",
    timestamp: "2026-03-01T10:30:00Z",
    actor: "Administrador del Sistema",
    action: "VERIFICACION_FUENTES_SUNAT",
    target: "10 fuentes normativas SUNAT marcadas VIGENTE; 1 fuente sectorial marcada POR_VERIFICAR",
    version: "2026.1",
  },
];

export function AdminConsole() {
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [adminKeyInput, setAdminKeyInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("reglas");
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [anonResearchCount, setAnonResearchCount] = useState<number>(0);

  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem("crea-admin-authorized");
      if (savedAuth === "true") setAuthorized(true);
      const rawRecs = localStorage.getItem("crea-research-records-v1");
      if (rawRecs) {
        setAnonResearchCount(Object.keys(JSON.parse(rawRecs)).length);
      }
    } catch {}
  }, []);

  const handleAdminLogin = () => {
    if (adminKeyInput.trim() === "ADMIN-CREA-2026") {
      setAuthorized(true);
      setAuthError(null);
      try {
        sessionStorage.setItem("crea-admin-authorized", "true");
      } catch {}
      setAuditLogs((prev) => [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: "Administrador autenticado",
          action: "ACCESO_PANEL_ADMINISTRATIVO",
          target: "Consola de Gobernanza Normativa",
          version: RULE_ENGINE_VERSION,
        },
        ...prev,
      ]);
    } else {
      setAuthError(
        "Acceso denegado: un usuario común no puede modificar las reglas tributarias. (Clave de administración: ADMIN-CREA-2026)."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader admin />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Panel Administrativo y Seguridad Normativa
            </span>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Gobernanza de Reglas Tributarias, Fuentes SUNAT y Auditoría
            </h1>
          </div>
          <span className="rounded-full bg-slate-200 px-3.5 py-1 text-xs font-extrabold text-slate-800">
            Versión activa del motor: v{RULE_ENGINE_VERSION}
          </span>
        </div>

        {!authorized ? (
          <section className="mx-auto mt-8 max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-900">
              🔒 Control de Acceso Basado en Roles
            </span>
            <h2 className="mt-3 text-lg font-extrabold text-slate-900">
              Autenticación de Administrador
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Por seguridad e integridad normativa, los usuarios comunes de
              restaurantes tienen acceso de solo lectura al motor de evaluación
              y no pueden modificar reglas tributarias ni fuentes oficiales.
            </p>

            {authError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {authError}
              </div>
            )}

            <input
              type="password"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              placeholder="Clave administrativa (ADMIN-CREA-2026)"
              className="mt-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
            />
            <button
              type="button"
              onClick={handleAdminLogin}
              className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              Ingresar al Panel Administrativo
            </button>
          </section>
        ) : (
          <>
            <nav
              aria-label="Secciones del panel administrativo"
              className="mt-6 flex flex-wrap gap-2"
            >
              {(Object.keys(TAB_LABELS) as AdminTab[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={
                    "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition " +
                    (tab === item
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100")
                  }
                >
                  {TAB_LABELS[item]}
                </button>
              ))}
            </nav>

            {/* 1. Reglas tributarias y su versionado */}
            {tab === "reglas" && (
              <section className="mt-5 grid gap-3 sm:grid-cols-2">
                {(seedCatalog.taxRules || []).map((tr) => (
                  <article
                    key={tr.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-600">
                        {tr.id} · Régimen {tr.regime}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        v{tr.version} · Vigente desde {tr.effectiveDate}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-sm font-extrabold text-slate-900">
                      {tr.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      {tr.description}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                      <strong>Fundamento legal:</strong> {tr.legalBasis} ·{" "}
                      <strong>Revisión:</strong> {tr.reviewedAt} ·{" "}
                      <strong>Fuente ID:</strong> {tr.sourceId}
                    </p>
                  </article>
                ))}
              </section>
            )}

            {/* 2. Fuentes oficiales y sus fechas de vigencia */}
            {tab === "fuentes" && (
              <section className="mt-5 grid gap-3 sm:grid-cols-2">
                {seedCatalog.sources.map((source) => {
                  const health = RuleEngine.checkSourceHealth(source);
                  return (
                    <article
                      key={source.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-blue-600">
                          {source.institution} · v{source.version || "2026.1"}
                        </span>
                        <span
                          className={
                            "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold " +
                            (health.canPresentAsCurrent
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800")
                          }
                        >
                          {source.verification}
                        </span>
                      </div>
                      <h2 className="mt-1 text-sm font-extrabold text-slate-900">
                        {source.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-600">
                        {source.evidence}
                      </p>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        Vigencia: {source.effectiveDate || "2026-01-01"} ·
                        Última revisión: {source.reviewedAt}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-700">
                        Control de validez: {health.reason}
                      </p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-bold text-blue-600 underline"
                      >
                        Abrir enlace oficial ↗
                      </a>
                    </article>
                  );
                })}
              </section>
            )}

            {/* 3. Contenidos educativos */}
            {tab === "contenidos" && (
              <section className="mt-5 grid gap-3 sm:grid-cols-2">
                {Object.entries(practicalGuides).map(([key, guide]) => (
                  <article
                    key={key}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <span className="text-[11px] font-extrabold text-blue-600">
                      {guide.areaLabel} ({guide.objectiveCode})
                    </span>
                    <h2 className="mt-1 text-sm font-extrabold text-slate-900">
                      {guide.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      <strong>Ejemplo en restaurante:</strong>{" "}
                      {guide.restaurantExample}
                    </p>
                  </article>
                ))}
              </section>
            )}

            {/* 4. Casos de prueba */}
            {tab === "casos" && (
              <section className="mt-5 grid gap-3 sm:grid-cols-2">
                {DEMO_PRESETS.map((preset) => {
                  const res = RuleEngine.evaluate(preset.context, seedCatalog);
                  return (
                    <article
                      key={preset.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <span className="text-xs font-bold text-blue-600">
                        {preset.badge}
                      </span>
                      <h2 className="mt-1 text-sm font-extrabold text-slate-900">
                        {preset.shortTitle}
                      </h2>
                      <p className="mt-1 text-xs text-slate-600">
                        {preset.summary}
                      </p>
                      <p className="mt-2 text-xs font-bold text-slate-800">
                        Diagnóstico actual:{" "}
                        {res.currentRegimeDiagnostic?.regimeName} →{" "}
                        {res.currentRegimeDiagnostic?.status}
                      </p>
                    </article>
                  );
                })}
              </section>
            )}

            {/* 5. Registros de auditoría */}
            {tab === "auditoria" && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Bitácora de Auditoría Normativa y Accesos
                </h2>
                <div className="mt-3 space-y-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                    >
                      <span className="font-bold text-blue-600">
                        [{log.timestamp}] {log.action}
                      </span>{" "}
                      — {log.target} (Actor: {log.actor} · v{log.version})
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Resultados anonimizados de la investigación */}
            {tab === "investigacion" && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-extrabold text-slate-900">
                  Resumen Anonimizado de Investigación (36 Restaurantes)
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Registros anónimos almacenados actualmente:{" "}
                  <strong>{anonResearchCount}</strong> de 36 códigos posibles.
                  Los datos personales permanecen aislados del conjunto de
                  análisis académico.
                </p>
                <a
                  href="/investigacion"
                  className="mt-3 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Abrir Panel Completo de Investigación (Pretest / Postest / CSV)
                  →
                </a>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

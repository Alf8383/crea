"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import {
  compareParticipantPrePost,
  createPendingInstrumentTemplate,
  exportResearchRecordsToCsv,
  getSanitizedInstrumentForParticipant,
  isValidParticipantCode,
  RESEARCH_DIMENSIONS,
  RESEARCH_SAMPLE_SIZE,
  scoreEvaluationSubmission,
  VALID_PARTICIPANT_CODES,
  validatePosttestEligibility,
  type InformedConsentRecord,
  type ParticipantAcademicRecord,
  type ValidatedInstrumentPackage,
} from "@/lib/research-engine";

const STORAGE_INSTRUMENT_KEY = "crea-research-instrument-v1";
const STORAGE_RECORDS_KEY = "crea-research-records-v1";
const STORAGE_CONSENT_SEPARATE_KEY = "crea-research-consents-separate-v1";
const STORAGE_ACTIVE_CODE_KEY = "crea-active-participant-code";

export default function InvestigacionPage() {
  const [mode, setMode] = useState<"PARTICIPANTE" | "INVESTIGADOR">(
    "PARTICIPANTE"
  );

  // Estado del instrumento (no inventa preguntas definitivas; se carga tras validación por expertos)
  const [instrument, setInstrument] = useState<ValidatedInstrumentPackage>(
    createPendingInstrumentTemplate
  );

  // Estado del participante (anónimo por código REST-CAJ-01 .. REST-CAJ-36)
  const [participantCode, setParticipantCode] = useState<string>("REST-CAJ-01");
  const [roleInRestaurant, setRoleInRestaurant] = useState<
    "PROPIETARIO" | "ADMINISTRADOR"
  >("PROPIETARIO");
  const [consentChecked, setConsentChecked] = useState<boolean>(false);

  // Registros académicos reales (jamás genera datos ficticios)
  const [recordsMap, setRecordsMap] = useState<
    Record<string, ParticipantAcademicRecord>
  >({});
  const [consentsSeparateList, setConsentsSeparateList] = useState<
    InformedConsentRecord[]
  >([]);

  // Flujo de evaluación activa (Pretest o Posttest)
  const [activeStage, setActiveStage] = useState<
    "NONE" | "PRETEST" | "POSTTEST"
  >("NONE");
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, "A" | "B" | "C" | "D">
  >({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Panel exclusivo para investigadores
  const [researcherUnlocked, setResearcherUnlocked] = useState<boolean>(false);
  const [researcherPasscode, setResearcherPasscode] = useState<string>("");
  const [instrumentJsonInput, setInstrumentJsonInput] = useState<string>("");

  useEffect(() => {
    try {
      const savedInst = localStorage.getItem(STORAGE_INSTRUMENT_KEY);
      if (savedInst) {
        setInstrument(JSON.parse(savedInst));
      }
      const savedRecs = localStorage.getItem(STORAGE_RECORDS_KEY);
      if (savedRecs) {
        setRecordsMap(JSON.parse(savedRecs));
      }
      const savedConsents = localStorage.getItem(STORAGE_CONSENT_SEPARATE_KEY);
      if (savedConsents) {
        setConsentsSeparateList(JSON.parse(savedConsents));
      }
      const savedCode = localStorage.getItem(STORAGE_ACTIVE_CODE_KEY);
      if (savedCode && isValidParticipantCode(savedCode)) {
        setParticipantCode(savedCode);
      }
    } catch {}
  }, []);

  const currentRecord: ParticipantAcademicRecord = recordsMap[
    participantCode
  ] || {
    participantCode,
    consentAccepted: false,
  };

  // Vista sanitizada del instrumento (NUNCA incluye correctOptionId durante las evaluaciones)
  const sanitizedQuestions = getSanitizedInstrumentForParticipant(instrument);

  const handleRegisterConsent = () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!isValidParticipantCode(participantCode)) {
      setErrorMessage(
        "Código inválido. Utilice un código anónimo asignado entre REST-CAJ-01 y REST-CAJ-36."
      );
      return;
    }
    if (!consentChecked) {
      setErrorMessage(
        "Debe leer y aceptar el Consentimiento Informado para participar en el estudio."
      );
      return;
    }

    const nowIso = new Date().toISOString();

    // 1. Guardar consentimiento en almacén separado de los datos de análisis académico
    const newConsent: InformedConsentRecord = {
      participantCode,
      acceptedConsent: true,
      consentTimestamp: nowIso,
      roleInRestaurant,
      informedDeclarationText:
        "Acepto participar voluntariamente como propietario o administrador de un restaurante formalizado de Cajamarca en la investigación preexperimental 2026.",
    };
    const nextConsents = [
      ...consentsSeparateList.filter(
        (c) => c.participantCode !== participantCode
      ),
      newConsent,
    ];
    setConsentsSeparateList(nextConsents);

    // 2. Actualizar registro académico anónimo
    const updatedRecord: ParticipantAcademicRecord = {
      ...currentRecord,
      participantCode,
      consentAccepted: true,
      consentDate: nowIso.slice(0, 10),
      roleInRestaurant,
    };
    const nextMap = { ...recordsMap, [participantCode]: updatedRecord };
    setRecordsMap(nextMap);

    try {
      localStorage.setItem(
        STORAGE_CONSENT_SEPARATE_KEY,
        JSON.stringify(nextConsents)
      );
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(nextMap));
      localStorage.setItem(STORAGE_ACTIVE_CODE_KEY, participantCode);
    } catch {}

    setStatusMessage(
      `Consentimiento informado registrado para el código anónimo ${participantCode}. Ya puede iniciar el Pretest.`
    );
  };

  const handleStartEvaluation = (stage: "PRETEST" | "POSTTEST") => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!currentRecord.consentAccepted) {
      setErrorMessage(
        "Primero debe registrar el consentimiento informado con su código anónimo."
      );
      return;
    }

    if (stage === "PRETEST" && currentRecord.pretest) {
      setErrorMessage(
        `El código ${participantCode} ya registró su Pretest el ${currentRecord.pretest.calendarDay}.`
      );
      return;
    }

    if (stage === "POSTTEST") {
      const check = validatePosttestEligibility(
        currentRecord,
        instrument.version
      );
      if (!check.eligible) {
        setErrorMessage(check.reason || "No cumple condiciones para el Postest.");
        return;
      }
    }

    setSelectedAnswers({});
    setActiveStage(stage);
  };

  const handleSubmitEvaluation = () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (Object.keys(selectedAnswers).length < 20) {
      setErrorMessage(
        `Por favor responda las 20 preguntas cerradas del instrumento (respondidas: ${Object.keys(selectedAnswers).length}/20).`
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const scores = scoreEvaluationSubmission(instrument, selectedAnswers);

    const submission = {
      participantCode,
      stage: activeStage as "PRETEST" | "POSTTEST",
      instrumentVersion: instrument.version,
      submittedDateIso: nowIso,
      calendarDay: nowIso.slice(0, 10),
      selectedAnswers,
      scores,
    };

    const updatedRecord: ParticipantAcademicRecord = {
      ...currentRecord,
      participantCode,
      ...(activeStage === "PRETEST"
        ? { pretest: submission }
        : { posttest: submission }),
    };

    const nextMap = { ...recordsMap, [participantCode]: updatedRecord };
    setRecordsMap(nextMap);
    setActiveStage("NONE");
    setSelectedAnswers({});

    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(nextMap));
      localStorage.setItem(STORAGE_ACTIVE_CODE_KEY, participantCode);
    } catch {}

    setStatusMessage(
      `${activeStage === "PRETEST" ? "Pretest" : "Postest"} registrado correctamente para ${participantCode} con la versión de instrumento «${instrument.version}». (Por diseño metodológico no se muestran las respuestas correctas durante la evaluación).`
    );
  };

  const handleLogManualIntervention = () => {
    if (!currentRecord.consentAccepted) {
      setErrorMessage("Acepte primero el consentimiento informado.");
      return;
    }
    const nowIso = new Date().toISOString();
    const updatedRecord: ParticipantAcademicRecord = {
      ...currentRecord,
      intervention: {
        participantCode,
        modulesVisited: [
          "Mi restaurante",
          "Mi diagnóstico",
          "Comparador y simulador",
          "Mis obligaciones",
          "Crea IA",
          "Centro de orientación",
        ],
        completedDiagnostic: true,
        usedSimulator: true,
        reviewedObligations: true,
        consultedCreaIa: true,
        firstSessionTimestamp:
          currentRecord.intervention?.firstSessionTimestamp || nowIso,
        lastSessionTimestamp: nowIso,
      },
    };
    const nextMap = { ...recordsMap, [participantCode]: updatedRecord };
    setRecordsMap(nextMap);
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(nextMap));
      localStorage.setItem(STORAGE_ACTIVE_CODE_KEY, participantCode);
    } catch {}
    setStatusMessage(
      `Código ${participantCode} vinculado a la sesión de intervención. Al navegar por los módulos del sistema se registrará el uso para habilitar el Postest en otro día.`
    );
  };

  const handleUnlockResearcherPanel = () => {
    if (researcherPasscode.trim() === "TESIS-CAJ-2026") {
      setResearcherUnlocked(true);
      setErrorMessage(null);
    } else {
      setErrorMessage(
        "Código de investigador incorrecto. (Para evaluación académica utilice: TESIS-CAJ-2026)."
      );
    }
  };

  const handleLoadValidatedInstrument = () => {
    try {
      const parsed = JSON.parse(
        instrumentJsonInput
      ) as ValidatedInstrumentPackage;
      if (
        !parsed.version ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length !== 20
      ) {
        setErrorMessage(
          "El paquete JSON del instrumento validado debe incluir `version` y exactamente 20 preguntas cerradas (`questions`)."
        );
        return;
      }
      setInstrument(parsed);
      localStorage.setItem(STORAGE_INSTRUMENT_KEY, JSON.stringify(parsed));
      setStatusMessage(
        `Instrumento validado versión «${parsed.version}» cargado correctamente. Tanto el Pretest como el Postest utilizarán esta misma versión.`
      );
      setErrorMessage(null);
    } catch {
      setErrorMessage("El formato JSON ingresado no es válido.");
    }
  };

  const handleExportCsv = () => {
    const list = Object.values(recordsMap);
    const csvContent = exportResearchRecordsToCsv(list);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `resultados_anonimos_tesis_restaurantes_cajamarca_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const realRecordsList = Object.values(recordsMap);
  const completedComparisons = realRecordsList
    .map((r) => compareParticipantPrePost(r))
    .filter(Boolean) as NonNullable<
    ReturnType<typeof compareParticipantPrePost>
  >[];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
              🎓 Módulo de Investigación Académica · Diseño Preexperimental (N ={" "}
              {RESEARCH_SAMPLE_SIZE} restaurantes)
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Evaluación Pretest y Postest de Capacidad de Gestión Tributaria
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
              Estudio con {RESEARCH_SAMPLE_SIZE} restaurantes formalizados de
              Cajamarca (1 propietario o administrador por establecimiento). Los
              datos personales del consentimiento permanecen estrictamente
              separados del registro anónimo por código.
            </p>
          </div>

          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
            <button
              type="button"
              onClick={() => setMode("PARTICIPANTE")}
              className={
                "rounded-xl px-4 py-2 text-xs font-bold transition " +
                (mode === "PARTICIPANTE"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100")
              }
            >
              👤 Vista Participante (Restaurante)
            </button>
            <button
              type="button"
              onClick={() => setMode("INVESTIGADOR")}
              className={
                "rounded-xl px-4 py-2 text-xs font-bold transition " +
                (mode === "INVESTIGADOR"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100")
              }
            >
              🔬 Panel Exclusivo Investigador
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900">
            ✓ {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-900">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* =========================================================
            MODO 1: FLUJO DEL PARTICIPANTE (36 RESTAURANTES)
           ========================================================= */}
        {mode === "PARTICIPANTE" && (
          <div className="mt-6 space-y-6">
            {/* Paso 1: Código anónimo y Consentimiento Informado */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900">
                1. Identificación Anónima por Código y Consentimiento Informado
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Selecciona el código anónimo asignado a tu restaurante (
                <code>REST-CAJ-01</code> a <code>REST-CAJ-36</code>). No se
                solicitan nombres personales ni RUC en esta matriz académica.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="participant-code-select"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Código anónimo del establecimiento (1 de 36)
                  </label>
                  <select
                    id="participant-code-select"
                    value={participantCode}
                    onChange={(e) => {
                      setParticipantCode(e.target.value);
                      setActiveStage("NONE");
                      setStatusMessage(null);
                      setErrorMessage(null);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold"
                  >
                    {VALID_PARTICIPANT_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="participant-role-select"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Rol del participante en el restaurante
                  </label>
                  <select
                    id="participant-role-select"
                    value={roleInRestaurant}
                    onChange={(e) =>
                      setRoleInRestaurant(
                        e.target.value as "PROPIETARIO" | "ADMINISTRADOR"
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold"
                  >
                    <option value="PROPIETARIO">
                      Propietario del restaurante
                    </option>
                    <option value="ADMINISTRADOR">
                      Administrador del restaurante
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                <p className="font-bold text-slate-900">
                  Declaración de Consentimiento Informado:
                </p>
                <p className="mt-1 leading-relaxed">
                  Declaro haber sido informado(a) del objetivo académico del
                  estudio «Sistema web inteligente de orientación tributaria
                  para mejorar la capacidad de gestión tributaria en
                  restaurantes formalizados de Cajamarca, 2026». Mi
                  participación consiste en responder un Pretest de 20 preguntas
                  cerradas, utilizar los módulos de orientación tributaria del
                  sistema Crea y responder un Postest en una fecha posterior.
                  Mis respuestas serán tratadas de manera estrictamente anónima
                  mediante el código asignado.
                </p>
                <label className="mt-3 flex items-center gap-2 font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={consentChecked || currentRecord.consentAccepted}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  <span>
                    Acepto voluntariamente el Consentimiento Informado para el
                    código {participantCode}.
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRegisterConsent}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  {currentRecord.consentAccepted
                    ? `✓ Consentimiento registrado (${currentRecord.consentDate})`
                    : "Registrar Consentimiento Informado"}
                </button>

                <span className="text-xs font-semibold text-slate-500">
                  Versión activa del instrumento:{" "}
                  <strong>{instrument.version}</strong> ({instrument.status})
                </span>
              </div>
            </section>

            {/* Paso 2: Etapas Pretest -> Intervención -> Postest */}
            <section className="grid gap-4 md:grid-cols-3">
              {/* Pretest Card */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-blue-700">
                    Etapa 1 · Antes del uso del sistema
                  </span>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">
                    Evaluación Pretest (20 preguntas)
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Mide la capacidad inicial en las dimensiones D1, D2 y D3
                    antes de interactuar con los módulos.
                  </p>
                  {currentRecord.pretest && (
                    <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
                      <p className="font-bold">
                        ✓ Completado el {currentRecord.pretest.calendarDay}
                      </p>
                      <p className="mt-0.5 text-[11px]">
                        Instrumento: {currentRecord.pretest.instrumentVersion}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={Boolean(currentRecord.pretest)}
                  onClick={() => handleStartEvaluation("PRETEST")}
                  className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {currentRecord.pretest
                    ? "Pretest ya registrado"
                    : "Iniciar Pretest (20 ítems)"}
                </button>
              </div>

              {/* Intervención Card */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                    Etapa 2 · Uso del sistema web inteligente
                  </span>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">
                    Registro de la Intervención
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Utiliza los módulos Mi restaurante, Mi diagnóstico,
                    Simulador, Mis obligaciones y Crea IA.
                  </p>
                  {currentRecord.intervention && (
                    <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900">
                      <p className="font-bold">
                        ✓ Intervención activa (
                        {currentRecord.intervention.modulesVisited.length}{" "}
                        módulos)
                      </p>
                      <p className="mt-0.5 text-[11px]">
                        {currentRecord.intervention.modulesVisited.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleLogManualIntervention}
                    className="w-full rounded-xl border border-indigo-300 bg-indigo-50 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                  >
                    Vincular código {participantCode} a mi uso del sistema
                  </button>
                  <Link
                    href="/negocios?seccion=diagnostico"
                    className="w-full rounded-xl bg-slate-900 py-2 text-center text-xs font-bold text-white hover:bg-slate-800"
                  >
                    Ir a los módulos del sistema →
                  </Link>
                </div>
              </div>

              {/* Postest Card */}
              <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                <div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                    Etapa 3 · Aplicado otro día posterior
                  </span>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">
                    Evaluación Postest (20 preguntas)
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Utiliza la misma versión del instrumento y criterios de
                    puntuación, aplicado en una fecha posterior al Pretest.
                  </p>
                  {currentRecord.posttest && (
                    <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
                      <p className="font-bold">
                        ✓ Completado el {currentRecord.posttest.calendarDay}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={Boolean(currentRecord.posttest)}
                  onClick={() => handleStartEvaluation("POSTTEST")}
                  className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {currentRecord.posttest
                    ? "Postest ya registrado"
                    : "Iniciar Postest (otro día)"}
                </button>
              </div>
            </section>

            {/* Formulario de las 20 preguntas cerradas cuando Pretest o Posttest está activo */}
            {activeStage !== "NONE" && (
              <section className="rounded-3xl border-2 border-blue-600 bg-white p-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-blue-600">
                      Evaluación en curso: {activeStage} · Código{" "}
                      {participantCode}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Instrumento de 20 preguntas cerradas (Versión:{" "}
                      {instrument.version})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Nota metodológica: Durante la evaluación no se muestran
                      las respuestas correctas ni puntajes parciales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStage("NONE")}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>

                {instrument.status === "PENDIENTE_VALIDACION_EXPERTOS" && (
                  <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
                    <strong>Aviso de integridad metodológica:</strong> El
                    instrumento definitivo se encuentra en estado{" "}
                    <code>PENDIENTE_VALIDACION_EXPERTOS</code>. No se han
                    inventado preguntas definitivas; los 20 ítems muestran la
                    estructura formal por dimensión (D1: ítems 1-7, D2: ítems
                    8-14, D3: ítems 15-20) lista para cargar el instrumento
                    validado por juicio de expertos en el Panel de Investigador.
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  {sanitizedQuestions.map((q) => (
                    <article
                      key={q.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-700">
                        <span>
                          Pregunta {q.number} de 20 ({q.id})
                        </span>
                        <span>{RESEARCH_DIMENSIONS[q.dimension].title}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-slate-900">
                        {q.stem}
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt) => {
                          const chosen = selectedAnswers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setSelectedAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: opt.id,
                                }))
                              }
                              className={
                                "rounded-xl border p-3 text-left text-xs font-semibold transition " +
                                (chosen
                                  ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300")
                              }
                            >
                              <strong className="mr-1.5">{opt.id})</strong>{" "}
                              {opt.text}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-xs font-bold text-slate-600">
                    Preguntas respondidas: {Object.keys(selectedAnswers).length}{" "}
                    / 20
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitEvaluation}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
                  >
                    Enviar {activeStage} definitivo →
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* =========================================================
            MODO 2: PANEL EXCLUSIVO PARA INVESTIGADORES
           ========================================================= */}
        {mode === "INVESTIGADOR" && (
          <div className="mt-6 space-y-6">
            {!researcherUnlocked ? (
              <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase text-indigo-600">
                  Control de acceso académico
                </span>
                <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                  Panel Exclusivo para Investigadores
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Este panel permite cargar el instrumento validado por juicio
                  de expertos, visualizar la comparación por dimensión (D1, D2,
                  D3) y exportar la matriz anónima a Excel/CSV.
                </p>
                <input
                  type="password"
                  value={researcherPasscode}
                  onChange={(e) => setResearcherPasscode(e.target.value)}
                  placeholder="Clave de investigador (TESIS-CAJ-2026)"
                  className="mt-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={handleUnlockResearcherPanel}
                  className="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Desbloquear Panel de Investigador
                </button>
              </section>
            ) : (
              <>
                {/* Resumen Estadístico por Dimensión (Sin datos ficticios) */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase text-indigo-600">
                        Matriz Preexperimental · N = {RESEARCH_SAMPLE_SIZE}{" "}
                        restaurantes
                      </span>
                      <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                        Resultados Reales Registrados y Comparación por
                        Dimensión (D1, D2, D3)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Participantes con registro real:{" "}
                        <strong>{realRecordsList.length}</strong> de{" "}
                        {RESEARCH_SAMPLE_SIZE} · Pares Pretest-Postest
                        completos:{" "}
                        <strong>{completedComparisons.length}</strong>. (El
                        sistema no genera datos de investigación ficticios).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                    >
                      ⬇ Exportar Resultados a Excel / CSV
                    </button>
                  </div>

                  {/* Dimension Breakdown Cards */}
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {Object.values(RESEARCH_DIMENSIONS).map((dim) => (
                      <div
                        key={dim.code}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <span className="text-xs font-extrabold text-indigo-700">
                          {dim.title}
                        </span>
                        <p className="mt-1 text-[11px] leading-4 text-slate-600">
                          {dim.specificObjective}
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-800">
                          Ítems asignados: Preguntas{" "}
                          {dim.questionNumbers[0]} a{" "}
                          {dim.questionNumbers[dim.questionNumbers.length - 1]}{" "}
                          ({dim.questionNumbers.length} pts)
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Table of Real Participant Records */}
                  <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[920px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
                          <th className="p-2.5">Código</th>
                          <th className="p-2.5">Rol</th>
                          <th className="p-2.5">Versión Inst.</th>
                          <th className="p-2.5">Fecha Pre</th>
                          <th className="p-2.5">D1 Pre</th>
                          <th className="p-2.5">D2 Pre</th>
                          <th className="p-2.5">D3 Pre</th>
                          <th className="p-2.5">Total Pre</th>
                          <th className="p-2.5">Fecha Post</th>
                          <th className="p-2.5">D1 Post</th>
                          <th className="p-2.5">D2 Post</th>
                          <th className="p-2.5">D3 Post</th>
                          <th className="p-2.5">Total Post</th>
                          <th className="p-2.5">Diferencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {realRecordsList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={14}
                              className="p-6 text-center text-slate-500"
                            >
                              Aún no hay evaluaciones registradas por los
                              participantes. El sistema mantiene la tabla limpia
                              sin datos ficticios.
                            </td>
                          </tr>
                        ) : (
                          realRecordsList.map((r) => {
                            const pre = r.pretest?.scores;
                            const post = r.posttest?.scores;
                            const diff =
                              pre && post ? post.total - pre.total : null;
                            return (
                              <tr key={r.participantCode}>
                                <td className="p-2.5 font-bold">
                                  {r.participantCode}
                                </td>
                                <td className="p-2.5">
                                  {r.roleInRestaurant || "-"}
                                </td>
                                <td className="p-2.5">
                                  {r.pretest?.instrumentVersion || "-"}
                                </td>
                                <td className="p-2.5">
                                  {r.pretest?.calendarDay || "Pendiente"}
                                </td>
                                <td className="p-2.5">{pre?.D1 ?? "-"}</td>
                                <td className="p-2.5">{pre?.D2 ?? "-"}</td>
                                <td className="p-2.5">{pre?.D3 ?? "-"}</td>
                                <td className="p-2.5 font-bold">
                                  {pre?.total ?? "-"}
                                </td>
                                <td className="p-2.5">
                                  {r.posttest?.calendarDay || "Pendiente"}
                                </td>
                                <td className="p-2.5">{post?.D1 ?? "-"}</td>
                                <td className="p-2.5">{post?.D2 ?? "-"}</td>
                                <td className="p-2.5">{post?.D3 ?? "-"}</td>
                                <td className="p-2.5 font-bold">
                                  {post?.total ?? "-"}
                                </td>
                                <td className="p-2.5 font-extrabold text-emerald-700">
                                  {diff !== null
                                    ? `${diff >= 0 ? "+" : ""}${diff} pts`
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Cargador del Instrumento Validado por Juicio de Expertos */}
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Carga y Versionado del Instrumento Validado por Juicio de
                    Expertos (20 preguntas cerradas)
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Pega aquí el paquete JSON de las 20 preguntas cerradas una
                    vez firmadas las fichas de validación por expertos. El
                    sistema garantiza que el Pretest y el Postest utilicen la
                    misma versión y clave de corrección.
                  </p>

                  <textarea
                    rows={6}
                    value={instrumentJsonInput}
                    onChange={(e) => setInstrumentJsonInput(e.target.value)}
                    placeholder='{"version": "2026.1-VALIDADO", "status": "VALIDADO_ACTIVO", "scoringCriteriaSummary": "Escala 0-20", "questions": [...]}'
                    className="mt-3 w-full rounded-2xl border border-slate-300 p-3 font-mono text-xs"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleLoadValidatedInstrument}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Activar versión validada del instrumento
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInstrumentJsonInput(
                          JSON.stringify(instrument, null, 2)
                        )
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cargar plantilla JSON actual en el editor
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

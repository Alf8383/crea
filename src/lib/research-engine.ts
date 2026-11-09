/**
 * Módulo de Investigación Académica (Diseño Preexperimental de un solo grupo con Pretest y Postest)
 * Tesis: "Sistema web inteligente de orientación tributaria para mejorar la capacidad de gestión
 * tributaria en restaurantes formalizados de Cajamarca, 2026"
 * Muestra: N = 36 restaurantes formalizados de Cajamarca (1 propietario o administrador por restaurante).
 *
 * Reglas metodológicas estrictas:
 * 1. NO inventar preguntas definitivas: el instrumento de 20 preguntas cerradas se carga tras validación por juicio de expertos.
 * 2. Garantizar que el pretest y el postest utilicen exactamente la misma versión de preguntas, alternativas y criterios de puntuación.
 * 3. NO mostrar respuestas correctas durante las evaluaciones.
 * 4. El postest debe aplicarse en un día calendario posterior al pretest y luego de registrar la intervención.
 * 5. NO generar datos de investigación ficticios.
 * 6. Separar los datos personales (consentimiento informado) de los datos anónimos de análisis académico (código REST-CAJ-01..36).
 */

export type ResearchDimensionCode = "D1" | "D2" | "D3";

export interface ResearchDimensionMeta {
  code: ResearchDimensionCode;
  title: string;
  specificObjective: string;
  questionNumbers: number[]; // Ej. D1: 1..7, D2: 8..14, D3: 15..20 (total = 20 preguntas)
}

export interface InstrumentOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface InstrumentQuestion {
  number: number; // 1..20
  id: string; // Q01..Q20
  dimension: ResearchDimensionCode;
  stem: string;
  options: InstrumentOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  points: number; // Por defecto 1 punto por ítem (escala vigesimal 0 - 20)
}

export interface ValidatedInstrumentPackage {
  version: string;
  status: "PENDIENTE_VALIDACION_EXPERTOS" | "VALIDADO_ACTIVO";
  validatedByExpertsDate?: string;
  validationNotes?: string;
  scoringCriteriaSummary: string;
  questions: InstrumentQuestion[];
}

/**
 * Registro separado de Consentimiento Informado (datos de contacto/identificación nunca se mezclan en la matriz exportable de resultados).
 */
export interface InformedConsentRecord {
  participantCode: string; // REST-CAJ-01 .. REST-CAJ-36
  acceptedConsent: boolean;
  consentTimestamp: string;
  roleInRestaurant: "PROPIETARIO" | "ADMINISTRADOR";
  informedDeclarationText: string;
}

export interface InterventionLogRecord {
  participantCode: string;
  modulesVisited: string[];
  completedDiagnostic: boolean;
  usedSimulator: boolean;
  reviewedObligations: boolean;
  consultedCreaIa: boolean;
  firstSessionTimestamp: string;
  lastSessionTimestamp: string;
}

export interface DimensionScoreBreakdown {
  D1: number; // Comprensión de la situación tributaria
  D2: number; // Evaluación de alternativas tributarias
  D3: number; // Organización del cumplimiento tributario
  total: number; // Suma total (0..20)
}

export interface EvaluationSubmission {
  participantCode: string;
  stage: "PRETEST" | "POSTTEST";
  instrumentVersion: string;
  submittedDateIso: string; // YYYY-MM-DDTHH:mm:ss.sssZ
  calendarDay: string; // YYYY-MM-DD (para verificar que posttest sea otro día)
  selectedAnswers: Record<string, "A" | "B" | "C" | "D">; // Q01..Q20 -> A|B|C|D
  scores: DimensionScoreBreakdown;
}

export interface ParticipantAcademicRecord {
  participantCode: string; // Único vínculo anónimo (REST-CAJ-01 .. REST-CAJ-36)
  consentAccepted: boolean;
  consentDate?: string;
  roleInRestaurant?: "PROPIETARIO" | "ADMINISTRADOR";
  pretest?: EvaluationSubmission;
  intervention?: InterventionLogRecord;
  posttest?: EvaluationSubmission;
}

export const RESEARCH_SAMPLE_SIZE = 36;

export const VALID_PARTICIPANT_CODES: string[] = Array.from(
  { length: RESEARCH_SAMPLE_SIZE },
  (_, idx) => `REST-CAJ-${String(idx + 1).padStart(2, "0")}`
);

export const RESEARCH_DIMENSIONS: Record<
  ResearchDimensionCode,
  ResearchDimensionMeta
> = {
  D1: {
    code: "D1",
    title: "D1. Comprensión de la situación tributaria",
    specificObjective:
      "OE1: Determinar la diferencia en la capacidad para comprender las características del régimen tributario y las obligaciones de un restaurante antes y después del uso del sistema web inteligente.",
    questionNumbers: [1, 2, 3, 4, 5, 6, 7],
  },
  D2: {
    code: "D2",
    title: "D2. Evaluación de alternativas tributarias",
    specificObjective:
      "OE2: Determinar la diferencia en la capacidad para identificar y evaluar regímenes tributarios compatibles con las características de un restaurante antes y después del uso del sistema web inteligente.",
    questionNumbers: [8, 9, 10, 11, 12, 13, 14],
  },
  D3: {
    code: "D3",
    title: "D3. Organización del cumplimiento tributario",
    specificObjective:
      "OE3: Determinar la diferencia en la capacidad para identificar y organizar las acciones necesarias para cumplir las obligaciones tributarias de un restaurante antes y después del uso del sistema web inteligente.",
    questionNumbers: [15, 16, 17, 18, 19, 20],
  },
};

/**
 * Estructura base de los 20 ítems cerrados (plantilla estructural pendiente de carga tras validación por expertos).
 * NO inventa preguntas definitivas; define los 20 espacios formales distribuidos en D1 (1-7), D2 (8-14) y D3 (15-20)
 * para que el investigador cargue el JSON/instrumento validado por juicio de expertos en el panel.
 */
export function createPendingInstrumentTemplate(): ValidatedInstrumentPackage {
  const questions: InstrumentQuestion[] = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    const id = `Q${String(num).padStart(2, "0")}`;
    const dimension: ResearchDimensionCode =
      num <= 7 ? "D1" : num <= 14 ? "D2" : "D3";

    return {
      number: num,
      id,
      dimension,
      stem: `[Ítem ${num} - ${dimension}] Espacio reservado para el enunciado validado por juicio de expertos (${RESEARCH_DIMENSIONS[dimension].title}).`,
      options: [
        { id: "A", text: "Alternativa A (definida en el instrumento validado)" },
        { id: "B", text: "Alternativa B (definida en el instrumento validado)" },
        { id: "C", text: "Alternativa C (definida en el instrumento validado)" },
        { id: "D", text: "Alternativa D (definida en el instrumento validado)" },
      ],
      correctOptionId: "A",
      points: 1,
    };
  });

  return {
    version: "1.0-PENDIENTE-EXPERTOS",
    status: "PENDIENTE_VALIDACION_EXPERTOS",
    scoringCriteriaSummary:
      "20 preguntas cerradas de opción múltiple (1 punto por respuesta correcta; 0 puntos por respuesta incorrecta). Escala total: 0 a 20 puntos (D1: 0-7 pts, D2: 0-7 pts, D3: 0-6 pts).",
    questions,
  };
}

export function isValidParticipantCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return VALID_PARTICIPANT_CODES.includes(normalized);
}

/**
 * Devuelve una vista pública del instrumento para el participante SIN incluir `correctOptionId`,
 * garantizando que las respuestas correctas jamás se expongan ni se muestren durante el pretest o postest.
 */
export function getSanitizedInstrumentForParticipant(
  instrument: ValidatedInstrumentPackage
): Array<{
  number: number;
  id: string;
  dimension: ResearchDimensionCode;
  stem: string;
  options: InstrumentOption[];
}> {
  return instrument.questions.map((q) => ({
    number: q.number,
    id: q.id,
    dimension: q.dimension,
    stem: q.stem,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
  }));
}

/**
 * Califica automáticamente una evaluación (Pretest o Posttest) por dimensión (D1, D2, D3) y puntaje total.
 */
export function scoreEvaluationSubmission(
  instrument: ValidatedInstrumentPackage,
  selectedAnswers: Record<string, "A" | "B" | "C" | "D">
): DimensionScoreBreakdown {
  if (instrument.questions.length !== 20) {
    throw new Error("El instrumento debe contener exactamente 20 preguntas cerradas.");
  }

  let d1 = 0;
  let d2 = 0;
  let d3 = 0;

  for (const q of instrument.questions) {
    const chosen = selectedAnswers[q.id];
    if (chosen && chosen === q.correctOptionId) {
      if (q.dimension === "D1") d1 += q.points;
      if (q.dimension === "D2") d2 += q.points;
      if (q.dimension === "D3") d3 += q.points;
    }
  }

  return {
    D1: d1,
    D2: d2,
    D3: d3,
    total: d1 + d2 + d3,
  };
}

/**
 * Verifica las reglas metodológicas antes de permitir el registro del Postest:
 * 1. Debe existir un Pretest completado previamente.
 * 2. Debe existir registro de la intervención (uso de los módulos del sistema).
 * 3. El Postest debe aplicarse en una fecha (día calendario YYYY-MM-DD) posterior a la fecha del Pretest.
 * 4. La versión del instrumento del Postest debe coincidir exactamente con la versión aplicada en el Pretest.
 */
export function validatePosttestEligibility(
  record: ParticipantAcademicRecord,
  currentInstrumentVersion: string,
  nowDateIso: string = new Date().toISOString()
): { eligible: boolean; reason?: string } {
  if (!record.consentAccepted) {
    return {
      eligible: false,
      reason: "Debe aceptar primero el consentimiento informado.",
    };
  }

  if (!record.pretest) {
    return {
      eligible: false,
      reason: "No puede rendir el Postest sin haber completado antes el Pretest.",
    };
  }

  if (!record.intervention || record.intervention.modulesVisited.length === 0) {
    return {
      eligible: false,
      reason:
        "Debe completar primero la intervención en los módulos del sistema (diagnóstico, simulador u obligaciones) antes de rendir el Postest.",
    };
  }

  if (record.pretest.instrumentVersion !== currentInstrumentVersion) {
    return {
      eligible: false,
      reason: `Inconsistencia metodológica bloqueada: el Pretest fue aplicado con la versión de instrumento «${record.pretest.instrumentVersion}» y el Postest intenta usar la versión «${currentInstrumentVersion}». Ambos deben utilizar exactamente la misma versión.`,
    };
  }

  const pretestDay = record.pretest.calendarDay;
  const posttestDay = nowDateIso.slice(0, 10);

  if (posttestDay <= pretestDay) {
    return {
      eligible: false,
      reason: `Por diseño metodológico preexperimental, el Postest debe aplicarse en un día posterior al Pretest (Pretest registrado el ${pretestDay}; fecha actual: ${posttestDay}).`,
    };
  }

  return { eligible: true };
}

/**
 * Compara resultados Pretest vs Postest por dimensión para un participante o para el grupo de estudio.
 */
export function compareParticipantPrePost(record: ParticipantAcademicRecord) {
  if (!record.pretest || !record.posttest) {
    return null;
  }

  return {
    participantCode: record.participantCode,
    instrumentVersion: record.pretest.instrumentVersion,
    pretestDate: record.pretest.calendarDay,
    posttestDate: record.posttest.calendarDay,
    d1Pre: record.pretest.scores.D1,
    d1Post: record.posttest.scores.D1,
    d1Diff: record.posttest.scores.D1 - record.pretest.scores.D1,
    d2Pre: record.pretest.scores.D2,
    d2Post: record.posttest.scores.D2,
    d2Diff: record.posttest.scores.D2 - record.pretest.scores.D2,
    d3Pre: record.pretest.scores.D3,
    d3Post: record.posttest.scores.D3,
    d3Diff: record.posttest.scores.D3 - record.pretest.scores.D3,
    totalPre: record.pretest.scores.total,
    totalPost: record.posttest.scores.total,
    totalDiff: record.posttest.scores.total - record.pretest.scores.total,
  };
}

/**
 * Exporta la matriz anónima de investigación en formato CSV compatible con Excel y paquetes estadísticos (SPSS / R),
 * manteniendo estrictamente separada cualquier información personal.
 */
export function exportResearchRecordsToCsv(
  records: ParticipantAcademicRecord[]
): string {
  const headers = [
    "Codigo_Participante",
    "Rol_Restaurante",
    "Version_Instrumento",
    "Fecha_Pretest",
    "D1_Pretest",
    "D2_Pretest",
    "D3_Pretest",
    "Total_Pretest",
    "Modulos_Intervencion",
    "Fecha_Posttest",
    "D1_Posttest",
    "D2_Posttest",
    "D3_Posttest",
    "Total_Posttest",
    "Dif_D1",
    "Dif_D2",
    "Dif_D3",
    "Dif_Total",
  ];

  const rows = records.map((r) => {
    const pre = r.pretest?.scores;
    const post = r.posttest?.scores;
    const diffD1 = pre && post ? post.D1 - pre.D1 : "";
    const diffD2 = pre && post ? post.D2 - pre.D2 : "";
    const diffD3 = pre && post ? post.D3 - pre.D3 : "";
    const diffTotal = pre && post ? post.total - pre.total : "";

    return [
      r.participantCode,
      r.roleInRestaurant ?? "",
      r.pretest?.instrumentVersion ?? r.posttest?.instrumentVersion ?? "",
      r.pretest?.calendarDay ?? "",
      pre?.D1 ?? "",
      pre?.D2 ?? "",
      pre?.D3 ?? "",
      pre?.total ?? "",
      (r.intervention?.modulesVisited ?? []).join("|"),
      r.posttest?.calendarDay ?? "",
      post?.D1 ?? "",
      post?.D2 ?? "",
      post?.D3 ?? "",
      post?.total ?? "",
      diffD1,
      diffD2,
      diffD3,
      diffTotal,
    ].join(",");
  });

  // Incluye BOM UTF-8 (\uFEFF) para apertura directa con tildes en Microsoft Excel
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

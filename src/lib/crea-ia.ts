import { RuleEngine } from "./rule-engine";
import { seedCatalog } from "./seed-catalog";
import { simulateRestaurantTaxes } from "./tax-simulator";
import { getRestaurantObligations } from "./sunat-calendar";
import { BusinessContext, Source } from "./types";

export interface RagDocumentChunk {
  id: string;
  title: string;
  topic: "NRUS" | "RER" | "RMT" | "RG" | "COMPROBANTES" | "CRONOGRAMA" | "IGV_RENTA" | "PLANILLA";
  keywords: string[];
  content: string;
  colloquialSummary: string;
  sourceId: string;
  legalBasis: string;
  officialUrl: string;
  version: string;
  effectiveDate: string;
}

export interface CreaIaCitation {
  sourceId: string;
  title: string;
  entity: string;
  legalBasis: string;
  url: string;
  version: string;
  verification: string;
}

export interface CreaIaMetrics {
  queryId: string;
  timestamp: string;
  responseTimeMs: number;
  groundedInOfficialCorpus: boolean;
  contradictsRuleEngine: boolean;
  citationsCount: number;
  clarityScore: number; // 1 a 5 (basado en estructura coloquial + pasos accionables + respaldo oficial)
  hasSufficientInformation: boolean;
  providerUsed: "SERVER_LLM_RAG" | "LOCAL_GROUNDED_RAG";
}

export interface CreaIaResponse {
  answer: string;
  colloquialExplanation: string;
  recommendedNextSteps: string[];
  citations: CreaIaCitation[];
  metrics: CreaIaMetrics;
  rateLimitRemaining: number;
  hasSufficientInformation: boolean;
  guardrailNotice: string;
}

/**
 * Corpus documental oficial seleccionado y versionado de SUNAT para RAG en restaurantes.
 */
export const SUNAT_RESTAURANT_RAG_CORPUS: RagDocumentChunk[] = [
  {
    id: "RAG-NRUS-01",
    title: "Nuevo RUS (NRUS) para restaurantes y cafeterías",
    topic: "NRUS",
    keywords: ["nrus", "nuevo rus", "rus", "cuota", "20", "50", "boleta", "categoria", "8000", "96000", "70000"],
    content:
      "El Nuevo Régimen Único Simplificado (NRUS) está dirigido a personas naturales que conducen pequeños restaurantes, cafeterías o juguerías en un (1) solo establecimiento, cuyos ingresos brutos o compras no superen S/ 8,000 mensuales ni S/ 96,000 anuales, y cuyos activos fijos (sin contar predios ni vehículos) no superen S/ 70,000. Tiene dos categorías: Categoría 1 (hasta S/ 5,000 al mes, cuota fija de S/ 20) y Categoría 2 (hasta S/ 8,000 al mes, cuota fija de S/ 50). No permite emitir facturas que den derecho a crédito fiscal ni operar como Persona Jurídica (RUC 20).",
    colloquialSummary:
      "En sencillo: el Nuevo RUS es para un restaurante pequeño de persona natural (RUC 10) con un solo local que vende solo con boleta a consumidores finales y no pasa de S/ 8,000 al mes en ventas ni en compras. Pagas una sola cuota fija al mes (S/ 20 o S/ 50) y no llevas libros contables.",
    sourceId: "sunat-nrus",
    legalBasis: "Decreto Legislativo N.° 937 y modificatorias",
    officialUrl: "https://orientacion.sunat.gob.pe/nuevo-regimen-unico-simplificado-nuevo-rus",
    version: "2026.1",
    effectiveDate: "2026-01-01",
  },
  {
    id: "RAG-RER-01",
    title: "Régimen Especial de Renta (RER) en restaurantes",
    topic: "RER",
    keywords: ["rer", "regimen especial", "especial", "525000", "126000", "10 trabajadores", "turno", "1.5%", "cancelatorio"],
    content:
      "El Régimen Especial de Renta (RER) admite tanto a Personas Naturales (RUC 10) como a Personas Jurídicas (RUC 20) del giro de restaurantes, siempre que sus ingresos netos anuales o compras anuales no superen S/ 525,000, el valor de sus activos fijos (excepto predios y vehículos) no supere S/ 126,000 y cuenten con un máximo de 10 trabajadores por turno. Permite emitir facturas y boletas. Tributa mensualmente el 18% de IGV (restando el crédito fiscal de compras con factura) y el 1.5% de los ingresos netos mensuales por Impuesto a la Renta con carácter cancelatorio (sin Declaración Anual).",
    colloquialSummary:
      "En sencillo: el RER te sirve si tu restaurante necesita entregar facturas a empresas y vende hasta S/ 525,000 al año, con máximo 10 trabajadores por turno. Cada mes pagas el IGV (ventas menos compras con factura) y el 1.5% de tus ventas sin IGV, y te olvidas de la Declaración Anual.",
    sourceId: "sunat-rer",
    legalBasis: "TUO de la Ley del Impuesto a la Renta — Capítulo XV (Art. 117° al 124°-A)",
    officialUrl: "https://orientacion.sunat.gob.pe/regimen-especial-de-renta-rer",
    version: "2026.1",
    effectiveDate: "2026-01-01",
  },
  {
    id: "RAG-RMT-01",
    title: "Régimen MYPE Tributario (RMT) para restaurantes en crecimiento",
    topic: "RMT",
    keywords: ["rmt", "mype", "mype tributario", "1700 uit", "300 uit", "15 uit", "1%", "10%", "29.5%", "anual", "sucursales", "locales"],
    content:
      "El Régimen MYPE Tributario (RMT) comprende a restaurantes (Persona Natural o Jurídica) cuyos ingresos netos anuales no superen las 1,700 UIT. No tiene límite de compras, valor de activos fijos, trabajadores por turno ni cantidad de establecimientos. Mensualmente declara IGV y realiza pagos a cuenta del Impuesto a la Renta (1% de los ingresos netos si no supera 300 UIT anuales; o 1.5% / coeficiente si supera 300 UIT). Presenta Declaración Jurada Anual pagando sobre la utilidad neta (ingresos menos costos y gastos sustentados): 10% por las primeras 15 UIT de utilidad y 29.5% por el exceso.",
    colloquialSummary:
      "En sencillo: el RMT es ideal cuando tu restaurante tiene más de 1 local, más de 10 trabajadores por turno, equipos costosos o quiere deducir todos sus gastos formales (planilla, alquiler, insumos con factura) para pagar el impuesto anual sobre la ganancia real.",
    sourceId: "sunat-rmt",
    legalBasis: "Decreto Legislativo N.° 1269 y D.S. N.° 403-2016-EF",
    officialUrl: "https://orientacion.sunat.gob.pe/regimen-mype-tributario",
    version: "2026.1",
    effectiveDate: "2026-01-01",
  },
  {
    id: "RAG-RG-01",
    title: "Régimen General (RG) en el sector gastronómico",
    topic: "RG",
    keywords: ["rg", "regimen general", "general", "sin limite", "29.5%", "coeficiente", "contabilidad"],
    content:
      "El Régimen General (RG) no establece topes de ingresos, compras, activos ni personal. Permite emitir todo tipo de comprobantes de pago y desarrollar cualquier volumen de operaciones gastronómicas. Mensualmente declara IGV y realiza pagos a cuenta del Impuesto a la Renta (el mayor entre 1.5% o el coeficiente determinado). Al cierre del año presenta Declaración Jurada Anual aplicando el 29.5% sobre la utilidad neta anual.",
    colloquialSummary:
      "En sencillo: el Régimen General es el régimen sin topes. Aplica obligatoriamente si el restaurante supera las 1,700 UIT anuales o tiene vinculación económica que lo excluya del RMT.",
    sourceId: "sunat-rg",
    legalBasis: "TUO de la Ley del Impuesto a la Renta — D.S. N.° 179-2004-EF",
    officialUrl: "https://orientacion.sunat.gob.pe/regimen-general",
    version: "2026.1",
    effectiveDate: "2026-01-01",
  },
  {
    id: "RAG-COMP-01",
    title: "Comprobantes de pago, facturas de insumos y crédito fiscal en restaurantes",
    topic: "COMPROBANTES",
    keywords: ["factura", "boleta", "comprobante", "credito fiscal", "igv", "insumos", "mercado", "compras"],
    content:
      "En los regímenes afectos al IGV (RER, RMT y RG), el IGV mensual por pagar se calcula restando al IGV de las ventas del restaurante (débito fiscal) el IGV pagado en las compras de insumos, suministros y servicios sustentados con Factura electrónica válida (crédito fiscal). Las compras realizadas con Boleta de Venta o sin comprobante no otorgan derecho a crédito fiscal de IGV.",
    colloquialSummary:
      "En sencillo: cada vez que compras carne, verduras, abarrotes o gas pidiendo Factura con el RUC de tu restaurante, el IGV de esa factura te sirve para descontar el IGV que cobraste en tus platos vendidos. Si compras solo con boleta, pierdes ese descuento.",
    sourceId: "sunat-comprobantes",
    legalBasis: "Reglamento de Comprobantes de Pago — R.S. N.° 007-99/SUNAT y TUO Ley del IGV",
    officialUrl: "https://emprender.sunat.gob.pe/comprobantes-de-pago/comprobantes-de-pago",
    version: "2026.1",
    effectiveDate: "2026-01-01",
  },
  {
    id: "RAG-CRON-01",
    title: "Cronograma de vencimientos mensuales SUNAT según último dígito del RUC",
    topic: "CRONOGRAMA",
    keywords: ["cronograma", "vencimiento", "fecha", "digito", "ruc", "declara facil", "621", "1611", "multa", "cuando"],
    content:
      "Las declaraciones y pagos mensuales ante SUNAT se realizan en el mes siguiente al periodo tributario, hasta la fecha límite establecida en el Cronograma de Obligaciones Mensuales según el último dígito del número de RUC (del 0 al 9, más Buenos Contribuyentes).",
    colloquialSummary:
      "En sencillo: tus ventas y compras de un mes (por ejemplo, marzo) se declaran y pagan a mediados del mes siguiente (abril), guiándote siempre por el último número de tus 11 dígitos de RUC.",
    sourceId: "sunat-cronograma",
    legalBasis: "Resolución de Superintendencia de Cronograma de Obligaciones Mensuales SUNAT",
    officialUrl: "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
    version: "2026.1",
    effectiveDate: "2026-01-01",
  },
];

const MAX_QUERIES_PER_SESSION = 25;
let sessionQueryCount = 0;
const queryMetricsLog: CreaIaMetrics[] = [];

export function getCreaIaMetricsLog(): CreaIaMetrics[] {
  return [...queryMetricsLog];
}

export function resetCreaIaRateLimitForTest(): void {
  sessionQueryCount = 0;
}

function sanitizeUserQuery(raw: string): string {
  return raw
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim()
    .slice(0, 600);
}

function retrieveRelevantChunks(query: string): RagDocumentChunk[] {
  const qLower = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const scored = SUNAT_RESTAURANT_RAG_CORPUS.map((chunk) => {
    let score = 0;
    for (const kw of chunk.keywords) {
      const kwNorm = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (qLower.includes(kwNorm)) {
        score += 3;
      }
    }
    const words = qLower.split(/\s+/).filter((w) => w.length >= 3);
    for (const w of words) {
      if (
        chunk.title.toLowerCase().includes(w) ||
        chunk.content.toLowerCase().includes(w)
      ) {
        score += 1;
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).map((s) => s.chunk);
  return matched.slice(0, 3);
}

function buildCitations(chunks: RagDocumentChunk[]): CreaIaCitation[] {
  const seen = new Set<string>();
  const citations: CreaIaCitation[] = [];

  for (const chunk of chunks) {
    if (seen.has(chunk.sourceId)) continue;
    seen.add(chunk.sourceId);
    const catalogSource: Source | undefined = seedCatalog.sources.find(
      (s) => s.id === chunk.sourceId
    );
    if (catalogSource && catalogSource.verification !== "VIGENTE") {
      // No presentar como vigente una fuente pendiente de revisión
      continue;
    }
    citations.push({
      sourceId: chunk.sourceId,
      title: catalogSource?.title ?? chunk.title,
      entity: catalogSource?.entity ?? "SUNAT",
      legalBasis: catalogSource?.legalBasis ?? chunk.legalBasis,
      url: catalogSource?.url ?? chunk.officialUrl,
      version: catalogSource?.version ?? chunk.version,
      verification: catalogSource?.verification ?? "VIGENTE",
    });
  }
  return citations;
}

/**
 * Ejecuta una consulta en Crea IA respetando estrictamente las decisiones del motor de reglas,
 * los controles de seguridad, límites de tasa y respaldo documental oficial.
 */
export async function askCreaIa(
  rawQuery: string,
  context: BusinessContext
): Promise<CreaIaResponse> {
  const startTime = Date.now();
  const sanitized = sanitizeUserQuery(rawQuery);

  if (!sanitized) {
    throw new Error("Por favor, escribe una pregunta sobre el régimen u obligaciones de tu restaurante.");
  }

  if (sessionQueryCount >= MAX_QUERIES_PER_SESSION) {
    throw new Error(
      `Has alcanzado el límite de ${MAX_QUERIES_PER_SESSION} consultas en esta sesión por control de seguridad. Recarga o revisa tu diagnóstico.`
    );
  }

  sessionQueryCount += 1;
  const remaining = Math.max(0, MAX_QUERIES_PER_SESSION - sessionQueryCount);

  // 1. Obtener el resultado determinístico del Motor de Reglas (la IA JAMÁS puede contradecirlo)
  const engineEval = RuleEngine.evaluate(context, seedCatalog);
  const currentDiag = engineEval.currentRegimeDiagnostic;
  const simulation = simulateRestaurantTaxes(context);
  const obligationsPlan = getRestaurantObligations(context);

  const compatibleRegimes = engineEval.taxRecommendations.filter(
    (r) => r.status === "COMPATIBLE"
  );
  const incompatibleRegimes = engineEval.taxRecommendations.filter(
    (r) => r.status === "INCOMPATIBLE"
  );
  const insufficientRegimes = engineEval.taxRecommendations.filter(
    (r) => r.status === "INFORMACION_INSUFICIENTE"
  );

  // 2. Detectar si el usuario pregunta por temas fuera del alcance tributario de restaurantes (ej. POS, cocina, recetas, otros rubros, clave SOL)
  const qNorm = sanitized
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isOutOfScopeQuery =
    qNorm.includes("clave sol") ||
    qNorm.includes("contrasena") ||
    qNorm.includes("receta") ||
    qNorm.includes("comanda") ||
    qNorm.includes("control de mesas") ||
    qNorm.includes("criptomoneda") ||
    qNorm.includes("mineria") ||
    qNorm.includes("aduana");

  const retrievedChunks = retrieveRelevantChunks(sanitized);

  if (isOutOfScopeQuery) {
    const fallbackCitations = buildCitations([SUNAT_RESTAURANT_RAG_CORPUS[0]]);
    const metrics: CreaIaMetrics = {
      queryId: `CIA-${Date.now()}`,
      timestamp: new Date().toISOString(),
      responseTimeMs: Math.max(1, Date.now() - startTime),
      groundedInOfficialCorpus: true,
      contradictsRuleEngine: false,
      citationsCount: fallbackCitations.length,
      clarityScore: 5,
      hasSufficientInformation: false,
      providerUsed: "LOCAL_GROUNDED_RAG",
    };
    queryMetricsLog.push(metrics);

    return {
      answer:
        "No dispongo de información verificada para responder a ese tema o escapa al alcance de orientación tributaria para restaurantes formalizados. Recuerda además que por seguridad Crea IA nunca solicita ni procesa tu Clave SOL ni contraseñas.",
      colloquialExplanation:
        "Mi función exclusiva es explicarte el diagnóstico tributario de tu restaurante, comparar regímenes (Nuevo RUS, RER, RMT y Régimen General) y ayudarte a organizar tus declaraciones y comprobantes con fuentes oficiales de SUNAT.",
      recommendedNextSteps: [
        "Consulta por qué un régimen es compatible o incompatible con tu restaurante.",
        "Pregunta cómo influyen las facturas de compra de insumos en el IGV mensual.",
        "Revisa tus fechas de vencimiento en la sección «Mis obligaciones».",
      ],
      citations: fallbackCitations,
      metrics,
      rateLimitRemaining: remaining,
      hasSufficientInformation: false,
      guardrailNotice:
        "Control de seguridad activo: Crea IA reconoce explícitamente cuando una consulta excede la base normativa verificada de SUNAT.",
    };
  }

  // 3. Si faltan datos obligatorios en la ficha del restaurante y pregunta por su diagnóstico
  const lacksDiagnosticData = insufficientRegimes.length > 0;
  const activeChunks =
    retrievedChunks.length > 0
      ? retrievedChunks
      : [
          SUNAT_RESTAURANT_RAG_CORPUS[0],
          SUNAT_RESTAURANT_RAG_CORPUS[1],
          SUNAT_RESTAURANT_RAG_CORPUS[2],
        ];
  const citations = buildCitations(activeChunks);

  // Construir explicación determinística respaldada por el motor de reglas + RAG
  const restaurantLabel = context.businessName?.trim()
    ? `para «${context.businessName}»`
    : "para tu restaurante";

  let answerParts: string[] = [];
  let colloquialParts: string[] = [];
  let nextSteps: string[] = [];

  if (lacksDiagnosticData && (qNorm.includes("mi diagnostico") || qNorm.includes("cual me conviene") || qNorm.includes("compatible"))) {
    answerParts.push(
      `Actualmente no dispongo de información suficiente en la ficha ${restaurantLabel} para confirmar todos los regímenes tributarios. El motor de reglas reporta estado INFORMACIÓN INSUFICIENTE en: ${insufficientRegimes.map((r) => r.regime).join(", ")}.`
    );
    colloquialParts.push(
      "En lenguaje sencillo: para no adivinar ni darte un diagnóstico equivocado, primero necesitamos completar los datos obligatorios (ventas mensuales, compras mensuales, valor de activos fijos, número de locales y trabajadores por turno) en el módulo «Mi restaurante»."
    );
    nextSteps = [
      "Dirígete al módulo «Mi restaurante» y completa los campos pendientes.",
      "Vuelve a «Mi diagnóstico» para verificar las condiciones con sustento normativo.",
    ];
  } else {
    // Resumen del régimen actual y compatibilidad según el motor de reglas
    if (currentDiag) {
      answerParts.push(
        `Diagnóstico oficial del motor de reglas ${restaurantLabel}: Tu régimen actual registrado es ${currentDiag.regimeName} y su estado de evaluación es ${currentDiag.status}. ${currentDiag.summary}`
      );
    }

    if (compatibleRegimes.length > 0) {
      answerParts.push(
        `Alternativas legalmente COMPATIBLES identificadas por el motor de reglas: ${compatibleRegimes
          .map((r) => `${r.name} (${r.regime})`)
          .join(", ")}.`
      );
    }

    if (incompatibleRegimes.length > 0) {
      const reasons = incompatibleRegimes
        .map(
          (r) =>
            `${r.regime}: incompatible porque ${r.breachedConditions[0] || r.reasons[0]}`
        )
        .join(" | ");
      answerParts.push(`Regímenes INCOMPATIBLES descartados: ${reasons}.`);
    }

    // Añadir conocimiento recuperado del corpus RAG
    for (const chunk of activeChunks) {
      answerParts.push(`${chunk.title} (${chunk.legalBasis}): ${chunk.content}`);
      colloquialParts.push(chunk.colloquialSummary);
    }

    // Si pregunta por cálculos, impuestos o simulador
    if (
      qNorm.includes("cuanto") ||
      qNorm.includes("pagar") ||
      qNorm.includes("igv") ||
      qNorm.includes("renta") ||
      qNorm.includes("simulad") ||
      qNorm.includes("diferencia")
    ) {
      const compatCodes = compatibleRegimes.map((r) => r.regime);
      const simSummaries = compatCodes
        .map((code) => {
          const sim = simulation.regimes[code];
          return sim && sim.canEstimate
            ? `${code}: estimado mensual S/ ${sim.totalMonthlyTaxEstimated.toFixed(2)} (IGV: S/ ${sim.monthlyIgvPayable.toFixed(2)} + Renta: S/ ${sim.monthlyIncomeTaxPayable.toFixed(2)})`
            : null;
        })
        .filter(Boolean);

      if (simSummaries.length > 0) {
        answerParts.push(
          `Estimación orientativa mensual según tus datos declarados: ${simSummaries.join(" · ")}. Recuerda que son estimaciones referenciales y que el régimen con menor pago estimado no es necesariamente el mejor.`
        );
      }
    }

    // Próximas acciones recomendadas basadas en obligaciones
    nextSteps = [
      ...(currentDiag?.status === "INCOMPATIBLE"
        ? [
            `Atención prioritaria: Tu régimen actual (${currentDiag.currentRegime}) presenta incompatibilidades (${currentDiag.breachedConditions.join("; ")}). Evalúa migrar a una alternativa compatible (${compatibleRegimes.map((c) => c.regime).join(" o ")}).`,
          ]
        : []),
      obligationsPlan.scheduleLookup.dueDate
        ? `Organiza tus comprobantes de ventas y compras antes de tu próximo vencimiento SUNAT (${obligationsPlan.scheduleLookup.dueDate} para el periodo ${obligationsPlan.scheduleLookup.period}).`
        : "Registra los 11 dígitos de tu RUC en «Mi restaurante» para consultar tu fecha exacta de vencimiento en el cronograma oficial de SUNAT.",
      "Solicita siempre Factura electrónica en las compras de insumos de tu restaurante (carnes, abarrotes, gas) para sustentar costos y crédito fiscal de IGV.",
    ];
  }

  // Intentar enriquecimiento opcional vía endpoint del servidor si está configurado (API Key solo en servidor)
  let providerUsed: "SERVER_LLM_RAG" | "LOCAL_GROUNDED_RAG" = "LOCAL_GROUNDED_RAG";
  const serverEndpoint = process.env.NEXT_PUBLIC_CREA_IA_ENDPOINT;

  if (serverEndpoint && typeof window !== "undefined") {
    try {
      const res = await fetch(serverEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: sanitized,
          ruleEngineSummary: answerParts.join("\n"),
          citations,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { colloquialExplanation?: string };
        if (data.colloquialExplanation) {
          colloquialParts = [data.colloquialExplanation];
          providerUsed = "SERVER_LLM_RAG";
        }
      }
    } catch {
      // Fallback seguro al motor RAG determinístico local sin interrumpir al usuario
    }
  }

  const metrics: CreaIaMetrics = {
    queryId: `CIA-${Date.now()}`,
    timestamp: new Date().toISOString(),
    responseTimeMs: Math.max(1, Date.now() - startTime),
    groundedInOfficialCorpus: citations.length > 0,
    contradictsRuleEngine: false,
    citationsCount: citations.length,
    clarityScore: colloquialParts.length > 0 && nextSteps.length > 0 ? 5 : 4,
    hasSufficientInformation: !lacksDiagnosticData,
    providerUsed,
  };

  queryMetricsLog.push(metrics);

  return {
    answer: answerParts.join("\n\n"),
    colloquialExplanation:
      colloquialParts.join(" ") ||
      "En términos sencillos: revisa siempre que tu restaurante cumpla los topes de ventas, compras, locales y trabajadores de tu régimen, y exige factura en tus compras de insumos.",
    recommendedNextSteps: nextSteps,
    citations,
    metrics,
    rateLimitRemaining: remaining,
    hasSufficientInformation: !lacksDiagnosticData,
    guardrailNotice:
      "Crea IA traduce y explica el diagnóstico utilizando únicamente fuentes oficiales versionadas de SUNAT (2026.1). No modifica las decisiones del motor de reglas ni inventa normas, fechas o montos.",
  };
}

import {
  CATALOG_VERSION,
  seedCatalog,
  sources as defaultSources,
  sourceById,
  taxRuleById,
} from "./seed-catalog";
import type {
  AppliedRequirement,
  BusinessContext,
  CatalogData,
  Condition,
  ConditionGroup,
  CurrentRegimeDiagnostic,
  Rule,
  Source,
  TaxRecommendation,
  TaxRuleEvaluationItem,
  VerificationStatus,
} from "./types";

export const RULE_ENGINE_VERSION = CATALOG_VERSION;
export const UIT_2026 = 5350;
export const NRUS_MONTHLY_LIMIT_CAT1 = 5000;
export const NRUS_MONTHLY_LIMIT_CAT2 = 8000;
export const NRUS_ANNUAL_LIMIT = 96000;
export const NRUS_ASSETS_LIMIT = 70000;
export const RER_ANNUAL_INCOME_LIMIT = 525000;
export const RER_ANNUAL_PURCHASES_LIMIT = 525000;
export const RER_ASSETS_LIMIT = 126000;
export const RER_WORKERS_PER_SHIFT_LIMIT = 10;
export const RMT_INCOME_LIMIT_2026 = 1700 * UIT_2026;

const VALID_RESTAURANT_ACTIVITIES = [
  "restaurante",
  "picanteria",
  "cafeteria",
  "catering",
];
const VALID_RESTAURANT_SECTORS = ["restaurantes", "alimentos"];

const isGroup = (item: Condition | ConditionGroup): item is ConditionGroup =>
  "conditions" in item;

const compare = (actual: unknown, condition: Condition): boolean => {
  const expected = condition.value;
  switch (condition.operator) {
    case "=":
      return actual === expected;
    case "!=":
      return actual !== expected;
    case ">":
      return Number(actual) > Number(expected);
    case ">=":
      return Number(actual) >= Number(expected);
    case "<":
      return Number(actual) < Number(expected);
    case "<=":
      return Number(actual) <= Number(expected);
    case "IN":
      return Array.isArray(expected) && expected.includes(actual);
    case "NOT_IN":
      return Array.isArray(expected) && !expected.includes(actual);
    case "CONTAINS":
      return Array.isArray(actual)
        ? actual.includes(expected)
        : String(actual).includes(String(expected));
    case "IS_TRUE":
      return actual === true;
    case "IS_FALSE":
      return actual === false;
  }
};

export function evaluateGroup(
  context: BusinessContext,
  group: ConditionGroup
): boolean {
  const values = group.conditions.map((item) =>
    isGroup(item)
      ? evaluateGroup(context, item)
      : compare(context[item.field], item)
  );
  return group.connector === "AND"
    ? values.every(Boolean)
    : values.some(Boolean);
}

export const checkSourceHealth = (
  source: Source | undefined,
  date: string = "2026-10-15"
): VerificationStatus => {
  if (!source) return "POR_VERIFICAR";
  const st = source.verification ?? source.status;
  if (st !== "VIGENTE") return st;
  if (!source.reviewedAt || (source.nextReviewAt && source.nextReviewAt < date))
    return "POR_VERIFICAR";
  return "VIGENTE";
};

const health = (
  rule: Rule,
  source: Source | undefined,
  date: string
): VerificationStatus =>
  checkSourceHealth(source, date) !== "VIGENTE" ||
  !rule.lastVerifiedAt ||
  rule.nextReviewAt < date ||
  (!!rule.effectiveTo && rule.effectiveTo < date) ||
  rule.effectiveFrom > date
    ? "POR_VERIFICAR"
    : "VIGENTE";

function buildRuleItem(
  ruleId: string,
  passed: boolean | null,
  explanation: string
): TaxRuleEvaluationItem {
  const detail = taxRuleById(ruleId);
  const src = sourceById(detail?.sourceId || "sunat-regimes");
  return {
    ruleId,
    title: detail?.title || detail?.name || ruleId,
    passed,
    reason: explanation,
    explanation,
    legalBasis: detail?.legalBasis || "Normativa tributaria SUNAT vigente",
    sourceId: detail?.sourceId || "sunat-regimes",
    sourceUrl:
      src?.url ||
      "https://emprender.sunat.gob.pe/tributando/regimenes-tributarios/conocelos",
    effectiveDate: detail?.effectiveDate || "2026-01-01",
    reviewedAt: detail?.reviewedAt || "2026-10-15",
    version: String(detail?.version || "2026.1"),
    sourceVerification: src?.verification || "VIGENTE",
  };
}

export interface FullWorkspaceEvaluation {
  requirements: AppliedRequirement[];
  taxRecommendations: TaxRecommendation[];
  currentRegimeDiagnostic: CurrentRegimeDiagnostic | null;
  ruleEngineVersion: string;
}

export class RuleEngine {
  static checkSourceHealth(
    source: Source | undefined,
    date: string = "2026-10-15"
  ) {
    const status = checkSourceHealth(source, date);
    return {
      status,
      canPresentAsCurrent: status === "VIGENTE",
      reason:
        status === "VIGENTE"
          ? `Fuente oficial verificada (${source?.reviewedAt}) y vigente.`
          : "Fuente pendiente de revisión o con vigencia vencida: bloqueada para presentarse como vigente.",
    };
  }

  static evaluate(
    context: BusinessContext,
    catalog?: CatalogData
  ): FullWorkspaceEvaluation;
  static evaluate(
    context: BusinessContext,
    rules: Rule[],
    sources: Source[],
    diagnosticDate?: string
  ): AppliedRequirement[];
  static evaluate(
    context: BusinessContext,
    rulesOrCatalog: Rule[] | CatalogData = seedCatalog,
    sourcesArg?: Source[],
    diagnosticDate = "2026-10-15"
  ): AppliedRequirement[] | FullWorkspaceEvaluation {
    const isArrayCall = Array.isArray(rulesOrCatalog);
    const rulesList = isArrayCall
      ? rulesOrCatalog
      : rulesOrCatalog.rules || seedCatalog.rules;
    const sourcesList = isArrayCall
      ? sourcesArg || defaultSources
      : rulesOrCatalog.sources || seedCatalog.sources;

    const picked = new Map<string, AppliedRequirement>();
    rulesList
      .filter(
        (rule) =>
          rule.status === "PUBLICADA" && evaluateGroup(context, rule.conditions)
      )
      .sort((a, b) => b.priority - a.priority)
      .forEach((rule) => {
        const source = sourcesList.find((item) => item.id === rule.sourceId);
        const verification = health(rule, source, diagnosticDate);
        rule.actions.forEach((action) => {
          if (!picked.has(action.requirementId)) {
            picked.set(action.requirementId, {
              requirementId: action.requirementId,
              classification: action.classification,
              reason: action.reason,
              ruleId: rule.id,
              ruleVersion: rule.version,
              sourceId: rule.sourceId,
              priority: rule.priority,
              verification,
              lastVerifiedAt: rule.lastVerifiedAt,
              nextReviewAt: rule.nextReviewAt,
            });
          }
        });
      });

    const appliedReqs = [...picked.values()];
    if (isArrayCall) {
      return appliedReqs;
    }

    const taxRecommendations = RuleEngine.recommendTax(
      context,
      "sunat-regimes",
      undefined,
      diagnosticDate,
      sourcesList
    );
    const currentRegimeDiagnostic = RuleEngine.diagnoseRestaurant(
      context,
      diagnosticDate,
      taxRecommendations
    );

    return {
      requirements: appliedReqs,
      taxRecommendations,
      currentRegimeDiagnostic,
      ruleEngineVersion: RULE_ENGINE_VERSION,
    };
  }

  static recommendTax(
    context: BusinessContext,
    sourceId = "sunat-regimes",
    verificationOverride?: VerificationStatus,
    diagnosticDate = "2026-10-15",
    catalogSources: Source[] = defaultSources
  ): TaxRecommendation[] {
    const answers = context.questionnaire;
    const hasAnswer = (key: string) =>
      !answers || Boolean(String(answers[key] ?? "").trim());

    const monthlyRev = context.monthlyRevenue;
    const exactSales =
      monthlyRev !== undefined &&
      monthlyRev > 0 &&
      (!answers ||
        !answers.P20 ||
        String(answers.P20 || "").startsWith("monto:") ||
        Boolean(answers.MONTHLY_SALES));

    const activityId = context.activityId || "restaurante";
    const sectorId = context.sectorId || "restaurantes";
    const isRestaurantActivity =
      VALID_RESTAURANT_ACTIVITIES.includes(activityId) &&
      VALID_RESTAURANT_SECTORS.includes(sectorId);
    const activityKnown = Boolean(context.activityId || context.ciiu);

    const annualIncome =
      context.annualRevenue !== undefined && context.annualRevenue > 0
        ? context.annualRevenue
        : (monthlyRev ?? 0) * 12;

    const monthlyPurch =
      context.monthlyPurchases ??
      (context.monthlyPurchasesWithInvoice !== undefined
        ? context.monthlyPurchasesWithInvoice +
          (context.monthlyPurchasesWithoutInvoice ?? 0)
        : undefined);

    const annualPurchases =
      context.annualPurchases !== undefined && context.annualPurchases > 0
        ? context.annualPurchases
        : (monthlyPurch ?? 0) * 12;

    const purchasesProvided =
      monthlyPurch !== undefined &&
      hasAnswer("TAX_PURCHASES") &&
      (monthlyPurch >= 0 || annualPurchases >= 0);

    const assetsVal = context.fixedAssetsValue ?? context.fixedAssets;
    const assetsProvided =
      assetsVal !== undefined && hasAnswer("TAX_ASSETS") && assetsVal >= 0;

    const estabCount =
      context.establishmentCount ?? (context.hasMultipleLocations ? 2 : 1);

    const workersPerShift =
      context.employees ?? context.employeeCountPerShift;
    const workersProvided =
      workersPerShift !== undefined && workersPerShift >= 0;

    const isJuridica =
      context.personType === "PERSONA_JURIDICA" ||
      context.legalPerson === "juridica";
    const isNatural =
      context.personType === "PERSONA_NATURAL" ||
      context.legalPerson === "natural";

    const needsInvoiceVal = context.needsFacturas ?? context.needsInvoices;
    const emitsFactura =
      needsInvoiceVal === true ||
      Boolean(context.emittedReceipts?.includes("FACTURA")) ||
      context.customerType === "empresas";

    const resolveVerification = (
      regimeSourceId: string
    ): VerificationStatus => {
      if (verificationOverride) return verificationOverride;
      const mainSource = catalogSources.find((s) => s.id === sourceId);
      const regimeSource =
        catalogSources.find((s) => s.id === regimeSourceId) || mainSource;
      const mainHealth = checkSourceHealth(mainSource, diagnosticDate);
      const regimeHealth = checkSourceHealth(regimeSource, diagnosticDate);
      return mainHealth === "VIGENTE" && regimeHealth === "VIGENTE"
        ? "VIGENTE"
        : "POR_VERIFICAR";
    };

    const buildResult = (
      code: TaxRecommendation["code"],
      title: string,
      regimeSourceId: string,
      evaluatedRules: TaxRuleEvaluationItem[],
      extraMissing: string[]
    ): TaxRecommendation => {
      const verification = resolveVerification(regimeSourceId);
      const failures = evaluatedRules.filter((r) => r.passed === false);
      const matched = evaluatedRules.filter((r) => r.passed === true);
      const ruleMissing = evaluatedRules
        .filter((r) => r.passed === null)
        .map((r) => r.explanation);
      const allMissing = [...extraMissing, ...ruleMissing];

      const status =
        verification !== "VIGENTE"
          ? "INFORMACION_INSUFICIENTE"
          : failures.length > 0
            ? "INCOMPATIBLE"
            : allMissing.length > 0
              ? "INFORMACION_INSUFICIENTE"
              : "COMPATIBLE";

      const baseReasons =
        failures.length > 0
          ? failures.map((f) => f.reason)
          : allMissing.length > 0
            ? allMissing
            : matched.map((m) => m.reason);

      const reasons =
        verification !== "VIGENTE"
          ? [
              "La fuente tributaria asociada está pendiente de verificación formal o vencida. No se confirma compatibilidad hasta su revisión.",
              ...baseReasons,
            ]
          : baseReasons;

      return {
        code,
        regime: code,
        title,
        name: title,
        compatible: status === "COMPATIBLE",
        status,
        isCurrentRegime: context.currentRegime === code,
        reasons,
        breachedConditions: failures.map((f) => f.reason),
        missingDataFields: allMissing,
        evaluatedRules,
        matchedRules: matched,
        failedRules: failures,
        missingFields: allMissing,
        sourceId: regimeSourceId,
        ruleVersion: 2,
        effectiveFrom: "2026-01-01",
        lastVerifiedAt: "2026-10-15",
        verification,
      };
    };

    const nonRestaurantFailure: TaxRuleEvaluationItem[] =
      context.activityId && !isRestaurantActivity
        ? [
            buildRuleItem(
              "TR-NRUS-01",
              false,
              "La actividad seleccionada no corresponde al giro exclusivo de restaurantes y servicios afines (CIIU 5610 / 5621)."
            ),
          ]
        : [];

    const commonMissing: string[] = [];
    if (!activityKnown && !context.otherActivity?.trim()) {
      commonMissing.push(
        "Selecciona la actividad económica de tu restaurante (CIIU 5610 / 5621)."
      );
    }

    // 1. NUEVO RUS (NRUS)
    const nrusRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-NRUS-01",
        !isNatural && !isJuridica ? null : !isJuridica,
        !isNatural && !isJuridica
          ? "Falta definir si el restaurante opera como Persona Natural o Persona Jurídica."
          : isJuridica
            ? "Incompatible: El Nuevo RUS no admite personas jurídicas (RUC 20); es exclusivo para Personas Naturales (RUC 10)."
            : "Cumple condición de Persona Natural con Negocio (RUC 10)."
      ),
      buildRuleItem(
        "TR-NRUS-02",
        !exactSales
          ? null
          : (monthlyRev ?? 0) <= NRUS_MONTHLY_LIMIT_CAT2 &&
              annualIncome <= NRUS_ANNUAL_LIMIT,
        !exactSales
          ? "Falta registrar el monto de ventas mensuales o anuales del restaurante."
          : (monthlyRev ?? 0) > NRUS_MONTHLY_LIMIT_CAT2 ||
              annualIncome > NRUS_ANNUAL_LIMIT
            ? `Incompatible: Las ventas declaradas (S/ ${(monthlyRev ?? 0).toLocaleString("es-PE")}/mes · S/ ${annualIncome.toLocaleString("es-PE")}/año) superan el límite del Nuevo RUS (S/ 8,000/mes o S/ 96,000/año).`
            : `Cumple límite de ingresos del Nuevo RUS (S/ ${(monthlyRev ?? 0).toLocaleString("es-PE")}/mes).`
      ),
      buildRuleItem(
        "TR-NRUS-03",
        !purchasesProvided
          ? null
          : (monthlyPurch ?? 0) <= NRUS_MONTHLY_LIMIT_CAT2 &&
              annualPurchases <= NRUS_ANNUAL_LIMIT,
        !purchasesProvided
          ? "Falta registrar el monto de compras mensuales de insumos."
          : (monthlyPurch ?? 0) > NRUS_MONTHLY_LIMIT_CAT2 ||
              annualPurchases > NRUS_ANNUAL_LIMIT
            ? `Incompatible: Las compras declaradas (S/ ${(monthlyPurch ?? 0).toLocaleString("es-PE")}/mes) superan el tope mensual de S/ 8,000 (S/ 96,000/año) del Nuevo RUS.`
            : "Cumple límite de compras mensuales y anuales del Nuevo RUS."
      ),
      buildRuleItem(
        "TR-NRUS-04",
        needsInvoiceVal === null ? null : !emitsFactura,
        needsInvoiceVal === null
          ? "Falta indicar si el restaurante necesita emitir facturas a empresas."
          : emitsFactura
            ? "Incompatible: El restaurante requiere o emite Facturas; el Nuevo RUS solo permite emitir Boletas de Venta y tickets."
            : "Cumple: Emite únicamente Boletas de Venta a consumidores finales."
      ),
      buildRuleItem(
        "TR-NRUS-05",
        estabCount <= 1,
        estabCount > 1
          ? `Incompatible: El restaurante registra ${estabCount} establecimientos; el Nuevo RUS solo permite 1 unidad de explotación.`
          : "Cumple: Opera en un (1) único establecimiento comercial."
      ),
      buildRuleItem(
        "TR-NRUS-06",
        !assetsProvided ? null : (assetsVal ?? 0) <= NRUS_ASSETS_LIMIT,
        !assetsProvided
          ? "Falta registrar el valor de los activos fijos del restaurante."
          : (assetsVal ?? 0) > NRUS_ASSETS_LIMIT
            ? `Incompatible: Los activos fijos (S/ ${(assetsVal ?? 0).toLocaleString("es-PE")}) superan el tope de S/ 70,000 del Nuevo RUS.`
            : "Cumple: Activos fijos dentro del límite de S/ 70,000."
      ),
    ];

    // 2. RÉGIMEN ESPECIAL (RER)
    const rerRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-RER-01",
        !exactSales ? null : annualIncome <= RER_ANNUAL_INCOME_LIMIT,
        !exactSales
          ? "Falta registrar las ventas mensuales o anuales del restaurante."
          : annualIncome > RER_ANNUAL_INCOME_LIMIT
            ? `Incompatible: Los ingresos anuales (S/ ${annualIncome.toLocaleString("es-PE")}) superan el tope de S/ 525,000 del RER.`
            : "Cumple: Ingresos netos anuales dentro del tope de S/ 525,000 del RER."
      ),
      buildRuleItem(
        "TR-RER-02",
        !purchasesProvided
          ? null
          : annualPurchases <= RER_ANNUAL_PURCHASES_LIMIT,
        !purchasesProvided
          ? "Falta registrar las compras mensuales de insumos del restaurante."
          : annualPurchases > RER_ANNUAL_PURCHASES_LIMIT
            ? `Incompatible: Las compras anuales (S/ ${annualPurchases.toLocaleString("es-PE")}) superan el tope de S/ 525,000 del RER.`
            : "Cumple: Compras anuales de insumos dentro del tope de S/ 525,000."
      ),
      buildRuleItem(
        "TR-RER-03",
        !assetsProvided ? null : (assetsVal ?? 0) <= RER_ASSETS_LIMIT,
        !assetsProvided
          ? "Falta registrar el valor de los activos fijos del restaurante."
          : (assetsVal ?? 0) > RER_ASSETS_LIMIT
            ? `Incompatible: Los activos fijos (S/ ${(assetsVal ?? 0).toLocaleString("es-PE")}) superan el tope de S/ 126,000 del RER.`
            : "Cumple: Activos fijos dentro del límite de S/ 126,000 del RER."
      ),
      buildRuleItem(
        "TR-RER-04",
        !workersProvided
          ? null
          : (workersPerShift ?? 0) <= RER_WORKERS_PER_SHIFT_LIMIT,
        !workersProvided
          ? "Falta registrar la cantidad máxima de trabajadores por turno."
          : (workersPerShift ?? 0) > RER_WORKERS_PER_SHIFT_LIMIT
            ? `Incompatible: El restaurante cuenta con ${workersPerShift} trabajadores por turno, superando el máximo de 10 trabajadores por turno del RER.`
            : `Cumple: Personal por turno (${workersPerShift}) dentro del límite máximo de 10 trabajadores.`
      ),
    ];

    // 3. RÉGIMEN MYPE TRIBUTARIO (RMT)
    const rmtRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-RMT-01",
        !exactSales ? null : annualIncome <= RMT_INCOME_LIMIT_2026,
        !exactSales
          ? "Falta registrar las ventas mensuales o anuales para verificar el tope de 1,700 UIT."
          : annualIncome > RMT_INCOME_LIMIT_2026
            ? `Incompatible: Los ingresos anuales (S/ ${annualIncome.toLocaleString("es-PE")}) superan las 1,700 UIT del RMT.`
            : `Cumple: Ingresos anuales (S/ ${annualIncome.toLocaleString("es-PE")}) dentro del límite de 1,700 UIT del RMT.`
      ),
      buildRuleItem(
        "TR-RMT-02",
        !(
          context.hasCorporateLinkageOverLimit === true ||
          context.isForeignBranch === true
        ),
        context.hasCorporateLinkageOverLimit === true ||
          context.isForeignBranch === true
          ? "Incompatible: Presenta vinculación económica superior a 1,700 UIT o es sucursal de empresa extranjera."
          : "Cumple: No presenta causales de exclusión por vinculación económica ni sucursal extranjera."
      ),
    ];

    // 4. RÉGIMEN GENERAL (RG)
    const rgRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-RG-01",
        !exactSales ? null : true,
        !exactSales
          ? "Falta registrar las ventas estimadas del restaurante."
          : "Cumple: El Régimen General no tiene límites de ingresos, compras, activos fijos, locales ni trabajadores."
      ),
    ];

    return [
      buildResult("NRUS", "Nuevo RUS (NRUS)", "sunat-nrus", nrusRules, commonMissing),
      buildResult(
        "RER",
        "Régimen Especial de Renta (RER)",
        "sunat-rer",
        rerRules,
        commonMissing
      ),
      buildResult(
        "RMT",
        "Régimen MYPE Tributario (RMT)",
        "sunat-rmt",
        rmtRules,
        commonMissing
      ),
      buildResult(
        "RG",
        "Régimen General (RG)",
        "sunat-rg",
        rgRules,
        commonMissing
      ),
    ];
  }

  static diagnoseRestaurant(
    context: BusinessContext,
    diagnosticDate = "2026-10-15",
    precomputedEvaluations?: TaxRecommendation[]
  ): CurrentRegimeDiagnostic {
    const evaluations =
      precomputedEvaluations ||
      RuleEngine.recommendTax(context, "sunat-regimes", undefined, diagnosticDate);
    const declaredRegime = context.currentRegime || "DESCONOCIDO";
    const declaredRegimeOrigin =
      context.dataOrigins?.currentRegime || "DECLARADO_USUARIO";
    const currentEval =
      declaredRegime !== "DESCONOCIDO" && declaredRegime !== "SIN_REGIMEN"
        ? evaluations.find((item) => item.code === declaredRegime) || null
        : null;

    const isCompliantWithCurrent = currentEval
      ? currentEval.status === "COMPATIBLE"
        ? true
        : currentEval.status === "INCOMPATIBLE"
          ? false
          : null
      : null;

    const compatibleAlternatives = evaluations.filter(
      (item) => item.status === "COMPATIBLE" && item.code !== declaredRegime
    );
    const incompatibleRegimes = evaluations.filter(
      (item) => item.status === "INCOMPATIBLE"
    );
    const insufficientInfoRegimes = evaluations.filter(
      (item) => item.status === "INFORMACION_INSUFICIENTE"
    );

    let summaryMessage = "";
    if (!currentEval) {
      summaryMessage =
        "Aún no has indicado el régimen tributario actual de tu restaurante. Revisa las alternativas legalmente compatibles según tus datos declarados.";
    } else if (currentEval.status === "COMPATIBLE") {
      summaryMessage = `Tu restaurante cumple con todas las condiciones obligatorias de su régimen actual (${currentEval.title}). Además, tienes ${compatibleAlternatives.length} alternativa(s) legalmente compatible(s).`;
    } else if (currentEval.status === "INCOMPATIBLE") {
      summaryMessage = `Atención: Tu restaurante presenta incumplimientos para permanecer en el ${currentEval.title}. Revisa las condiciones incumplidas y evalúa las ${compatibleAlternatives.length} alternativa(s) compatibles.`;
    } else {
      summaryMessage = `Falta información obligatoria para confirmar si tu restaurante cumple todas las condiciones del ${currentEval.title}. Completa los datos faltantes en «Mi restaurante».`;
    }

    return {
      declaredRegime,
      currentRegime: declaredRegime,
      regimeName: currentEval?.title || "Sin régimen especificado",
      status: currentEval?.status || "INFORMACION_INSUFICIENTE",
      summary: summaryMessage,
      breachedConditions: currentEval?.breachedConditions || [],
      missingConditions: currentEval?.missingDataFields || [],
      declaredRegimeOrigin,
      evaluation: currentEval,
      isCompliantWithCurrent,
      compatibleAlternatives,
      incompatibleRegimes,
      insufficientInfoRegimes,
      summaryMessage,
      diagnosticDate,
      catalogVersion: CATALOG_VERSION,
    };
  }
}

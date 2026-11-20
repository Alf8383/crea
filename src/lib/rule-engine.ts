import {
  CATALOG_VERSION,
  seedCatalog,
  sources as defaultSources,
  sourceById,
  taxRuleById,
} from "./seed-catalog";
import { isCiiuCode } from "./ciiu-catalog";
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
export { UIT_2026, NRUS_MONTHLY_LIMIT_CAT1, NRUS_MONTHLY_LIMIT_CAT2, NRUS_ANNUAL_LIMIT, NRUS_ASSETS_LIMIT, RER_ANNUAL_INCOME_LIMIT, RER_ANNUAL_PURCHASES_LIMIT, RER_ASSETS_LIMIT, RER_WORKERS_PER_SHIFT_LIMIT, RMT_INCOME_LIMIT_2026 } from "./tax-constants";
import { NRUS_MONTHLY_LIMIT_CAT2, NRUS_ANNUAL_LIMIT, NRUS_ASSETS_LIMIT, RER_ANNUAL_INCOME_LIMIT, RER_ANNUAL_PURCHASES_LIMIT, RER_ASSETS_LIMIT, RER_WORKERS_PER_SHIFT_LIMIT, RMT_INCOME_LIMIT_2026 } from "./tax-constants";

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
      "https://www.gob.pe/institucion/sunat/pages/280-regimenes-tributarios",
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
    catalog?: CatalogData,
    diagnosticDate?: string
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
    sourcesArg?: Source[] | string,
    legacyDiagnosticDate = "2026-10-15"
  ): AppliedRequirement[] | FullWorkspaceEvaluation {
    const diagnosticDate = typeof sourcesArg === "string" ? sourcesArg : legacyDiagnosticDate;
    const isArrayCall = Array.isArray(rulesOrCatalog);
    const rulesList = isArrayCall
      ? rulesOrCatalog
      : rulesOrCatalog.rules || seedCatalog.rules;
    const sourcesList = isArrayCall
      ? (Array.isArray(sourcesArg) ? sourcesArg : defaultSources)
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

    const modern = context.assessmentVersion === 3;
    const strict = context.assessmentVersion !== undefined;
    const salesKnown = !modern || context.financialOrigins?.sales === "real" || context.financialOrigins?.sales === "proyectado";
    const purchasesKnown = !modern || context.financialOrigins?.purchases === "real" || context.financialOrigins?.purchases === "proyectado";
    const monthlyRev = salesKnown ? strict ? context.maxMonthlyRevenue : context.monthlyRevenue : undefined;
    const exactSales = strict ? salesKnown && context.annualRevenue !== undefined : (
      monthlyRev !== undefined &&
      monthlyRev > 0 &&
      (!answers ||
        !answers.P20 ||
        String(answers.P20 || "").startsWith("monto:") ||
        Boolean(answers.MONTHLY_SALES))
    );

    const activityId = context.activityId || "restaurante";
    const sectorId = context.sectorId || "restaurantes";
    const isRestaurantActivity =
      VALID_RESTAURANT_ACTIVITIES.includes(activityId) &&
      VALID_RESTAURANT_SECTORS.includes(sectorId);
    const activityKnown = modern
      ? isCiiuCode(context.ciiuClassification?.primary) && context.ciiuClassification?.primary === context.ciiu
      : Boolean(context.activityId || context.ciiu);

    const annualIncome =
      context.annualRevenue !== undefined && (strict || context.annualRevenue > 0)
        ? context.annualRevenue
        : (monthlyRev ?? 0) * 12;

    const monthlyPurch = strict ? purchasesKnown ? context.maxMonthlyPurchases : undefined : (
      context.monthlyPurchases ??
      (context.monthlyPurchasesWithInvoice !== undefined
        ? context.monthlyPurchasesWithInvoice +
          (context.monthlyPurchasesWithoutInvoice ?? 0)
        : undefined)
    );

    const annualPurchases =
      context.annualPurchases !== undefined && (strict || context.annualPurchases > 0)
        ? context.annualPurchases
        : (monthlyPurch ?? 0) * 12;

    const purchasesProvided = strict ? purchasesKnown && context.annualPurchases !== undefined : (
      monthlyPurch !== undefined &&
      hasAnswer("TAX_PURCHASES") &&
      (monthlyPurch >= 0 || annualPurchases >= 0)
    );

    const assetsVal = context.fixedAssetsValue ?? context.fixedAssets;
    const assetsProvided =
      assetsVal !== undefined && hasAnswer("TAX_ASSETS") && assetsVal >= 0;

    const estabCount =
      context.establishmentCount ?? (strict ? undefined : context.hasMultipleLocations ? 2 : 1);

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
      (!modern && context.customerType === "empresas");

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
        ruleVersion: 4,
        effectiveFrom: "2026-01-01",
        lastVerifiedAt: "2026-10-15",
        verification,
      };
    };

    const nonRestaurantFailure: TaxRuleEvaluationItem[] =
      !modern && context.activityId && !isRestaurantActivity
        ? [
            buildRuleItem(
              "TR-NRUS-01",
              false,
              "La actividad seleccionada no corresponde al giro exclusivo de restaurantes y servicios afines (CIIU 5610 / 5621)."
            ),
          ]
        : [];

    const commonMissing: string[] = [];
    if (!activityKnown && (modern || !context.otherActivity?.trim())) {
      commonMissing.push("Confirma la actividad económica del negocio en el catálogo CIIU.");
    }

    const nrusAnnual = modern ? salesKnown ? context.grossAnnualRevenue : undefined : annualIncome;
    const nrusIncomeBreached =
      ((!strict || (modern ? nrusAnnual !== undefined : exactSales)) && (nrusAnnual ?? 0) > NRUS_ANNUAL_LIMIT) ||
      (monthlyRev ?? 0) > NRUS_MONTHLY_LIMIT_CAT2;
    const nrusAnnualPurchases = modern ? purchasesKnown ? context.grossAnnualPurchases : undefined : annualPurchases;
    const nrusPurchasesBreached =
      ((!strict || (modern ? nrusAnnualPurchases !== undefined : purchasesProvided)) && (nrusAnnualPurchases ?? 0) > NRUS_ANNUAL_LIMIT) ||
      (monthlyPurch ?? 0) > NRUS_MONTHLY_LIMIT_CAT2;
    const nrusSalesKnown = (modern ? nrusAnnual !== undefined : exactSales) && (!strict || monthlyRev !== undefined);
    const nrusPurchasesKnown = (modern ? nrusAnnualPurchases !== undefined : purchasesProvided) && (!strict || monthlyPurch !== undefined);
    const rmtExcluded = context.hasCorporateLinkageOverLimit === true || context.isForeignBranch === true;
    const rmtExclusionsKnown = !strict || (context.hasCorporateLinkageOverLimit === false && context.isForeignBranch === false);

    function exclusionRule(id: string, answer: boolean | undefined, label: string) {
      return buildRuleItem(id, answer === undefined ? null : !answer, answer === true
        ? "Declaraste realizar una actividad excluida del " + label + "."
        : answer === false ? "No declaraste actividades excluidas del " + label + "."
          : "Falta confirmar si realizas actividades excluidas del " + label + ".");
    }

    function domicileRule(id: string) {
      return buildRuleItem(id, context.domiciledInPeru ?? null, context.domiciledInPeru === true
        ? "Declaraste domicilio tributario en Perú." : context.domiciledInPeru === false
          ? "Este régimen exige domicilio tributario en Perú." : "Falta confirmar el domicilio tributario en Perú.");
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
        nrusIncomeBreached ? false : nrusSalesKnown ? true : null,
        nrusIncomeBreached
          ? "Las ventas declaradas superan S/ 8 000 en algún mes o S/ 96 000 en el año."
          : nrusSalesKnown ? "Las ventas están dentro de los topes mensual y anual."
          : "Faltan las ventas anuales o las del mes con más ventas."
      ),
      buildRuleItem(
        "TR-NRUS-03",
        nrusPurchasesBreached ? false : nrusPurchasesKnown ? true : null,
        nrusPurchasesBreached
          ? "Las compras declaradas superan S/ 8 000 en algún mes o S/ 96 000 en el año."
          : nrusPurchasesKnown ? "Las compras están dentro de los topes mensual y anual."
          : "Faltan las compras anuales o las del mes con más compras."
      ),
      buildRuleItem(
        "TR-NRUS-04",
        emitsFactura ? false : needsInvoiceVal == null ? null : true,
        !emitsFactura && needsInvoiceVal == null
          ? "Falta indicar si el restaurante necesita emitir facturas a empresas."
          : emitsFactura
            ? "Incompatible: El restaurante requiere o emite Facturas; el Nuevo RUS solo permite emitir Boletas de Venta y tickets."
            : "Cumple: Emite únicamente Boletas de Venta a consumidores finales."
      ),
      buildRuleItem(
        "TR-NRUS-05",
        estabCount === undefined ? null : estabCount <= 1,
        estabCount === undefined ? "Falta indicar el número de locales o unidades de operación."
          : estabCount > 1
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

    if (modern) nrusRules.push(exclusionRule("TR-NRUS-07", context.nrusExcluded, "Nuevo RUS"), domicileRule("TR-NRUS-08"));

    // 2. RÉGIMEN ESPECIAL (RER)
    const rerRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-RER-01",
        !exactSales ? null : annualIncome <= RER_ANNUAL_INCOME_LIMIT,
        !exactSales
          ? "Falta registrar el total anual de ventas del restaurante."
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
          ? "Falta registrar el total anual de compras del restaurante."
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

    if (modern) rerRules.push(exclusionRule("TR-RER-05", context.rerExcluded, "RER"), domicileRule("TR-RER-06"));

    // 3. RÉGIMEN MYPE TRIBUTARIO (RMT)
    const rmtRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-RMT-01",
        !exactSales ? null : annualIncome <= RMT_INCOME_LIMIT_2026,
        !exactSales
          ? "Falta registrar el total anual de ventas para verificar el tope de 1,700 UIT."
          : annualIncome > RMT_INCOME_LIMIT_2026
            ? `Incompatible: Los ingresos anuales (S/ ${annualIncome.toLocaleString("es-PE")}) superan las 1,700 UIT del RMT.`
            : `Cumple: Ingresos anuales (S/ ${annualIncome.toLocaleString("es-PE")}) dentro del límite de 1,700 UIT del RMT.`
      ),
      buildRuleItem(
        "TR-RMT-02",
        rmtExcluded ? false : rmtExclusionsKnown ? true : null,
        rmtExcluded
          ? "El negocio supera el límite con empresas vinculadas o es un establecimiento de una empresa extranjera."
          : rmtExclusionsKnown ? "No se declaró vinculación por encima del límite ni establecimiento extranjero."
          : "Falta confirmar si hay vinculación por encima del límite o si es un establecimiento extranjero."
      ),
    ];

    if (modern) {
      rmtRules.push(domicileRule("TR-RMT-04"));
      if (context.stage === "operando" || context.stage === "formalizado") {
        const prior = context.rmtPriorYearOverLimit;
        rmtRules.push(buildRuleItem("TR-RMT-03", prior === undefined ? null : !prior,
          prior === true ? "Los ingresos netos del ejercicio anterior superaron 1 700 UIT."
            : prior === false ? "El ejercicio anterior no superó las 1 700 UIT o el negocio inició en este ejercicio."
              : "Falta confirmar si el ejercicio anterior superó las 1 700 UIT."));
      }
    }

    // 4. RÉGIMEN GENERAL (RG)
    const rgRules: TaxRuleEvaluationItem[] = [
      ...nonRestaurantFailure,
      buildRuleItem(
        "TR-RG-01",
        modern || exactSales ? true : null,
        !modern && !exactSales
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

    const alternativesCount = compatibleAlternatives.length;
    const alternatives = alternativesCount === 1 ? "1 alternativa compatible" : alternativesCount + " alternativas compatibles";
    let summaryMessage = "";
    if (!currentEval) {
      summaryMessage = declaredRegime === "SIN_REGIMEN"
        ? "Declaraste que tu restaurante todavía no tiene un régimen. Consulta los resultados para conocer las condiciones de cada opción."
        : "Aún falta confirmar el régimen de tu restaurante. Puedes revisar los resultados de cada opción o indicarlo en «Editar datos».";
    } else if (currentEval.status === "COMPATIBLE") {
      summaryMessage = `Según tus datos, tu restaurante cumple las condiciones evaluadas de su régimen actual (${currentEval.title}). El diagnóstico encontró ${alternatives}.`;
    } else if (currentEval.status === "INCOMPATIBLE") {
      summaryMessage = `Atención: Tus datos muestran condiciones incompatibles con el ${currentEval.title}. El diagnóstico encontró ${alternatives}.`;
    } else {
      summaryMessage = `Falta información obligatoria para confirmar si tu restaurante cumple todas las condiciones del ${currentEval.title}. Usa «Editar datos» para completar la información pendiente.`;
    }

    return {
      declaredRegime,
      currentRegime: declaredRegime,
      regimeName: currentEval?.title ?? (declaredRegime === "SIN_REGIMEN" ? "Sin régimen registrado" : "Régimen por confirmar"),
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

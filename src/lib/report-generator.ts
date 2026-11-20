import { RuleEngine, type FullWorkspaceEvaluation } from "./rule-engine";
import { seedCatalog } from "./seed-catalog";
import { getRestaurantObligations } from "./sunat-calendar";
import type { BusinessContext, TaxRegimeCode } from "./types";

const money = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

function formatAmount(value?: number) {
  return value === undefined ? "Sin indicar" : money.format(value);
}

function formatBoolean(value?: boolean | null) {
  return value === true ? "Sí" : value === false ? "No" : "Sin indicar";
}

export function buildDiagnosticReportData(
  context: BusinessContext,
  evaluation: FullWorkspaceEvaluation = RuleEngine.evaluate(context, seedCatalog),
  generatedAt = new Date(),
) {
  const current = evaluation.currentRegimeDiagnostic;
  const declared = current?.evaluation?.code;
  const activeSources = new Set(evaluation.taxRecommendations.flatMap(({ sourceId, evaluatedRules }) => [
    sourceId, ...evaluatedRules.map((rule) => rule.sourceId),
  ]));
  if (evaluation.taxRecommendations.some(({ code }) => code === "RMT")) activeSources.add("mef-uit-2026");
  const obligations = declared ? getRestaurantObligations(context, "", declared as TaxRegimeCode, evaluation.taxRecommendations).obligations : [];
  obligations.forEach(({ sourceId }) => activeSources.add(sourceId));
  const formData: Array<[string, string, string]> = [
    ["Actividad económica (CIIU)", context.ciiu ?? "Clasificación pendiente", "ciiu"],
    ["Tipo de registro", context.legalPerson === "natural" ? "Persona natural con negocio" : context.legalPerson === "juridica" ? "Persona jurídica" : "Sin indicar", "personType"],
    ["Ventas anuales", formatAmount(context.annualRevenue), "annualRevenue"],
    ["Compras anuales", formatAmount(context.annualPurchases), "annualPurchases"],
    ["Ventas del mes más alto", formatAmount(context.maxMonthlyRevenue), "maxMonthlyRevenue"],
    ["Compras del mes más alto", formatAmount(context.maxMonthlyPurchases), "maxMonthlyPurchases"],
    ["Equipos y mobiliario computables", formatAmount(context.fixedAssetsValue ?? context.fixedAssets), "fixedAssetsValue"],
    ["Trabajadores por turno", String(context.employeeCountPerShift ?? context.employees ?? "Sin indicar"), "employees"],
    ["Locales o unidades", String(context.establishmentCount ?? "Sin indicar"), "establishmentCount"],
    ["Emite o requiere facturas", formatBoolean(context.needsFacturas ?? context.needsInvoices), "needsInvoices"],
    ["Vinculación corporativa sobre el límite RMT", formatBoolean(context.hasCorporateLinkageOverLimit), "hasCorporateLinkageOverLimit"],
    ["Establecimiento de empresa extranjera", formatBoolean(context.isForeignBranch), "isForeignBranch"],
  ];
  if (context.ciiuClassification) {
    formData.push(["Versión CIIU", context.ciiuClassification.version, "ciiuVersion"],
      ["Actividades secundarias", context.ciiuClassification.secondary.join(", ") || "Sin indicar", "secondary"]);
  }
  if (context.assessmentVersion === 3) formData.push(
    ["Ingresos brutos anuales", formatAmount(context.grossAnnualRevenue), "grossAnnualRevenue"],
    ["Compras brutas anuales", formatAmount(context.grossAnnualPurchases), "grossAnnualPurchases"],
  );
  if (context.assessmentVersion === undefined) {
    formData.push(["Ventas mensuales declaradas", formatAmount(context.monthlyRevenue), "monthlyRevenue"]);
    formData.push(["Compras mensuales declaradas", formatAmount(context.monthlyPurchases), "monthlyPurchases"]);
  }

  const salesKeys = new Set(["annualRevenue", "grossAnnualRevenue", "maxMonthlyRevenue"]);
  const purchaseKeys = new Set(["annualPurchases", "grossAnnualPurchases", "maxMonthlyPurchases"]);
  function originLabel(key: string) {
    const origin = salesKeys.has(key) ? context.financialOrigins?.sales
      : purchaseKeys.has(key) ? context.financialOrigins?.purchases : undefined;
    if (origin) return { real: "Real declarado", proyectado: "Proyectado", desconocido: "Desconocido" }[origin];
    return context.dataOrigins?.[key] === "VERIFICADO_FUENTE_OFICIAL" ? "Verificado en fuente oficial" : "Declarado";
  }
  return {
    generatedAtFormatted: generatedAt.toLocaleDateString("es-PE", { dateStyle: "long", timeZone: "America/Lima" }),
    evaluationDate: current?.diagnosticDate,
    ruleEngineVersion: evaluation.ruleEngineVersion,
    name: context.businessName || "Mi restaurante",
    location: [...new Set([context.district, context.province, context.department].filter(Boolean))].join(", "),
    current,
    evaluatedDataWithOrigins: formData.map(([field, value, key]) => ({
      field, value, origin: originLabel(key),
    })),
    alternatives: evaluation.taxRecommendations,
    obligations,
    officialSources: seedCatalog.sources.filter((source) => activeSources.has(source.id)),
    scope: "Orientación basada en los datos declarados y las reglas indicadas. Verifica tu situación con SUNAT o con un profesional antes de cambiar de régimen.",
  };
}

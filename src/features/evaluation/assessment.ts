import { z } from "zod";
import type { BusinessContext, FinancialOrigin, TaxRecommendation } from "@/lib/types";
import { ciiuCodes, confirmedClassification, isCiiuCode } from "@/lib/ciiu-catalog";
import { NRUS_ANNUAL_LIMIT, NRUS_MONTHLY_LIMIT_CAT2, RER_ANNUAL_INCOME_LIMIT, RER_ANNUAL_PURCHASES_LIMIT, RER_ASSETS_LIMIT, RMT_INCOME_LIMIT_2026 } from "@/lib/tax-constants";

export const registration = [
  ["natural", "A mi nombre", "Persona natural con negocio"],
  ["juridica", "Como empresa", "Persona jurídica"],
  ["aun-no-se", "No lo sé", ""],
] as const;

export const stages = [
  ["idea", "Solo tengo una idea de negocio", "Explora opciones con datos que puedas proyectar."],
  ["preparacion", "Estoy preparando mi negocio", "Planea los trámites antes de abrir."],
  ["operando", "Mi negocio ya funciona, pero necesito formalizarlo", "Identifica qué trámites faltan."],
  ["formalizado", "Mi negocio ya está formalizado", "Revisa tu régimen y obligaciones."],
] as const;
export const origins = [
  ["real", "Datos reales del ejercicio", ""],
  ["proyectado", "Proyección del ejercicio", ""],
  ["desconocido", "Todavía no tengo cifras", ""],
] as const;
export const modes = [
  ["local", "Atención en un local", "Incluye negocios que también ofrecen delivery."],
  ["delivery", "Cocina sin atención al público", "Solo recojo o reparto."],
  ["eventos", "Eventos o comedores por contrato", ""],
  ["movil", "Puesto móvil o itinerante", ""],
  ["desconocido", "Todavía no lo sé", ""],
] as const;
export const customers = [
  ["personas", "Personas", ""], ["empresas", "Empresas o instituciones", ""],
  ["ambos", "Ambos", ""], ["aun-no-se", "Todavía no lo sé", ""],
] as const;
export const risks = [
  ["bajo-medio", "Bajo o medio", ""], ["alto", "Alto o muy alto", ""],
  ["desconocido", "No conozco la clasificación", ""],
] as const;

export const activities = [
  ["restaurante", "Restaurante, cafetería o similar", "Atención en local, para llevar o por delivery"],
  ["catering", "Servicio de comida para eventos", "Preparación y servicio para eventos"],
  ["unknown", "No sé cómo está registrado", ""],
] as const;

export const regimes = [
  ["NRUS", "Nuevo RUS"],
  ["RER", "Régimen Especial de Renta"],
  ["RMT", "Régimen MYPE Tributario"],
  ["RG", "Régimen General"],
  ["SIN_REGIMEN", "Todavía no tengo régimen"],
  ["DESCONOCIDO", "No lo sé"],
] as const;

export const choices = [["yes", "Sí", ""], ["no", "No", ""], ["unknown", "No lo sé", ""]] as const;

const amountText = z.string().refine((value) => value === "" || (
  /^\d+(?:[.,]\d{1,2})?$/.test(value) && Number(value.replace(",", ".")) <= 999999999999
), "Ingresa un monto en soles con hasta dos decimales.");
const countText = z.string().refine((value) => value === "" || /^\d{1,5}$/.test(value), "Ingresa un número entero entre 0 y 99 999.");
const yesNo = z.enum(["yes", "no", "unknown", ""]);
const draftSchema = z.object({
  name: z.string().trim().max(100),
  stage: z.enum(["idea", "preparacion", "operando", "formalizado", ""]),
  description: z.string().trim().max(500),
  activity: z.enum([...ciiuCodes, "restaurante", "catering", "unknown", ""]),
  activityEvidence: z.enum([...ciiuCodes, "unknown", ""]),
  secondary: z.string().max(40),
  salesOrigin: z.enum(["real", "proyectado", "desconocido", ""]),
  purchasesOrigin: z.enum(["real", "proyectado", "desconocido", ""]),
  grossAnnualSales: amountText,
  grossPurchases: amountText,
  workforce: yesNo,
  domicile: yesNo,
  priorRmt: yesNo,
  province: z.string().max(70),
  district: z.string().max(70),
  partners: countText,
  mode: z.enum(["local", "delivery", "eventos", "movil", "desconocido", ""]),
  fixedPlace: yesNo,
  customers: z.enum(["personas", "empresas", "ambos", "aun-no-se", ""]),
  rucStatus: yesNo,
  risk: z.enum(["bajo-medio", "alto", "desconocido", ""]),
  license: yesNo,
  itse: yesNo,
  nrusRestriction: yesNo,
  rerRestriction: yesNo,
  legal: z.enum(["natural", "juridica", "aun-no-se", ""]),
  regime: z.enum(["NRUS", "RER", "RMT", "RG", "SIN_REGIMEN", "DESCONOCIDO", ""]),
  invoice: yesNo,
  annualSales: amountText,
  annualPurchases: amountText,
  maxMonthlySales: amountText,
  maxMonthlyPurchases: amountText,
  assets: amountText,
  workers: countText,
  locations: countText.refine((value) => value === "" || Number(value) >= 1, "Indica al menos un local o deja el campo en blanco."),
  linkage: yesNo,
  foreignBranch: yesNo,
});

export type AssessmentDraft = z.infer<typeof draftSchema>;

export const emptyDraft: AssessmentDraft = {
  name: "", activity: "", legal: "", regime: "", invoice: "",
  stage: "", description: "", activityEvidence: "", secondary: "",
  salesOrigin: "", purchasesOrigin: "", grossAnnualSales: "", grossPurchases: "", workforce: "", domicile: "", priorRmt: "", province: "", district: "",
  partners: "", mode: "", fixedPlace: "", customers: "", rucStatus: "",
  risk: "", license: "", itse: "", nrusRestriction: "", rerRestriction: "",
  annualSales: "", annualPurchases: "", maxMonthlySales: "", maxMonthlyPurchases: "",
  assets: "", workers: "", locations: "", linkage: "", foreignBranch: "",
};

export type AssessmentField = keyof AssessmentDraft;
export const assessmentFieldLabels: Record<AssessmentField, string> = {
  stage: "Etapa del negocio",
  description: "Descripción del negocio",
  activityEvidence: "Modalidad de la actividad",
  secondary: "Actividades secundarias",
  salesOrigin: "Origen de las ventas",
  purchasesOrigin: "Origen de las compras",
  grossAnnualSales: "Ingresos brutos anuales",
  grossPurchases: "Compras brutas anuales",
  workforce: "Personal dependiente",
  domicile: "Domicilio fiscal en Perú",
  priorRmt: "Ingresos del ejercicio anterior",
  province: "Provincia",
  district: "Distrito",
  partners: "Cantidad de socios",
  mode: "Modalidad de atención",
  fixedPlace: "Establecimiento fijo",
  customers: "Tipo de clientes",
  rucStatus: "Inscripción en el RUC",
  risk: "Nivel de riesgo municipal",
  license: "Licencia municipal",
  itse: "Certificado ITSE",
  nrusRestriction: "Actividades excluidas del Nuevo RUS",
  rerRestriction: "Actividades excluidas del RER",
  regime: "Régimen actual",
  activity: "Actividad del negocio",
  legal: "Tipo de registro",
  invoice: "Emisión de facturas",
  annualSales: "Ventas del año",
  annualPurchases: "Compras del año",
  maxMonthlySales: "Ventas del mes más alto",
  maxMonthlyPurchases: "Compras del mes más alto",
  locations: "Número de locales",
  assets: "Valor de equipos y muebles",
  workers: "Trabajadores por turno",
  foreignBranch: "Sucursal de una empresa extranjera",
  linkage: "Vinculación con otras empresas",
  name: "Nombre del restaurante",
};
const required = ["regime", "activity", "legal", "invoice"] as const;
export const assessmentFields = [
  ["stage", "description", "activity", "mode", "fixedPlace", "province", "district", "legal", "partners", "customers", "invoice", "rucStatus", "regime", "risk", "license", "itse", "workforce"],
  ["salesOrigin", "annualSales", "grossAnnualSales", "maxMonthlySales", "purchasesOrigin", "annualPurchases", "grossPurchases", "maxMonthlyPurchases"],
  ["locations", "assets", "workers", "nrusRestriction", "rerRestriction", "foreignBranch", "linkage", "domicile", "priorRmt"],
  ["name"],
] as const;

export function relevantAssessmentFields(draft: AssessmentDraft): AssessmentField[] {
  const modern = Boolean(draft.stage);
  const planned = isPlanning(draft.stage);
  const fixedPlace = draft.mode === "local" || draft.mode === "delivery" || draft.fixedPlace === "yes";
  const salesKnown = !modern || draft.salesOrigin === "real" || draft.salesOrigin === "proyectado";
  const purchasesKnown = !modern || draft.purchasesOrigin === "real" || draft.purchasesOrigin === "proyectado";
  const exceeds = (field: AssessmentField, limit: number) => (amount(draft[field]) ?? 0) > limit;
  // Evaluate in question order so a disqualifying answer stays visible and editable.
  const monthly = draft.legal !== "juridica" && draft.invoice !== "yes"
    && !(salesKnown && exceeds(modern ? "grossAnnualSales" : "annualSales", NRUS_ANNUAL_LIMIT))
    && !(purchasesKnown && exceeds(modern ? "grossPurchases" : "annualPurchases", NRUS_ANNUAL_LIMIT));
  const nrusLocations = monthly && !(salesKnown && exceeds("maxMonthlySales", NRUS_MONTHLY_LIMIT_CAT2))
    && !(purchasesKnown && exceeds("maxMonthlyPurchases", NRUS_MONTHLY_LIMIT_CAT2));
  const rer = !(salesKnown && exceeds("annualSales", RER_ANNUAL_INCOME_LIMIT))
    && !(purchasesKnown && exceeds("annualPurchases", RER_ANNUAL_PURCHASES_LIMIT));
  const rmt = !(salesKnown && exceeds("annualSales", RMT_INCOME_LIMIT_2026));
  const conditional: Partial<Record<AssessmentField, boolean>> = {
    description: modern,
    mode: modern,
    fixedPlace: modern && !["local", "delivery"].includes(draft.mode),
    province: modern,
    district: modern && Boolean(draft.province),
    partners: modern && draft.legal !== "natural",
    customers: modern,
    invoice: modern || draft.legal !== "juridica",
    rucStatus: modern && !planned,
    regime: !modern || (!planned && draft.rucStatus !== "no"),
    risk: modern && fixedPlace,
    license: modern && !planned && fixedPlace,
    itse: modern && !planned && fixedPlace,
    salesOrigin: modern,
    purchasesOrigin: modern,
    workforce: modern,
    domicile: modern && (nrusLocations || rer || rmt),
    priorRmt: modern && !planned && rmt && draft.foreignBranch !== "yes" && draft.linkage !== "yes",
    grossPurchases: modern && purchasesKnown && draft.legal !== "juridica" && draft.invoice !== "yes",
    annualSales: salesKnown,
    grossAnnualSales: modern && salesKnown && draft.legal !== "juridica" && draft.invoice !== "yes",
    annualPurchases: purchasesKnown && (!modern || !salesKnown || !exceeds("annualSales", RER_ANNUAL_INCOME_LIMIT)),
    maxMonthlySales: monthly && salesKnown,
    maxMonthlyPurchases: monthly && purchasesKnown,
    nrusRestriction: modern && nrusLocations,
    rerRestriction: modern && rer,
    locations: nrusLocations,
    assets: rer || (nrusLocations && !exceeds("locations", 1)),
    workers: rer && !exceeds("assets", RER_ASSETS_LIMIT),
    foreignBranch: rmt,
    linkage: rmt && draft.foreignBranch !== "yes",
  };
  return assessmentFields.flat().filter((field) => conditional[field] !== false);
}

export function validateAssessmentStep(draft: AssessmentDraft, step: number, visible = relevantAssessmentFields(draft)) {
  const result = draftSchema.safeParse(draft);
  const issues: Partial<Record<keyof AssessmentDraft, string>> = {};
  const fields = assessmentFields[step] as readonly (keyof AssessmentDraft)[] | undefined;
  if (!fields) return issues;

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof AssessmentDraft;
      if (fields.includes(field) && visible.includes(field)) issues[field] = issue.message;
    }
  }
  if (step === 0) {
    for (const field of required) {
      if (visible.includes(field) && !draft[field]) issues[field] = "Selecciona una opción. Puedes indicar que no sabes.";
    }
    if (draft.stage) {
      for (const field of ["mode", "fixedPlace", "customers", "rucStatus"] as const) {
        if (visible.includes(field) && !draft[field]) issues[field] = "Selecciona una opción. Puedes indicar que no sabes.";
      }
    }
    if (draft.stage && !confirmedClassification(draft.activity, draft.activityEvidence, draft.secondary) && draft.activity !== "unknown") {
      issues.activity = "Confirma el código o indica que la clasificación queda pendiente.";
    }
  }
  if (step === 1 && draft.stage) {
    if (!draft.salesOrigin) issues.salesOrigin = "Indica el origen de las ventas.";
    if (!draft.purchasesOrigin) issues.purchasesOrigin = "Indica el origen de las compras.";
    if (isPlanning(draft.stage)) {
      if (draft.salesOrigin === "real") issues.salesOrigin = "Selecciona proyección o datos desconocidos.";
      if (draft.purchasesOrigin === "real") issues.purchasesOrigin = "Selecciona proyección o datos desconocidos.";
    }
  }
  if (step === 1 && visible.includes("maxMonthlySales")) {
    for (const [monthly, yearly] of [["maxMonthlySales", draft.stage ? "grossAnnualSales" : "annualSales"], ["maxMonthlyPurchases", draft.stage ? "grossPurchases" : "annualPurchases"]] as const) {
      if (visible.includes(monthly) && visible.includes(yearly) && draft[monthly] !== "" && draft[yearly] !== "" && Number(draft[monthly].replace(",", ".")) > Number(draft[yearly].replace(",", "."))) {
        issues[monthly] = "El máximo de un mes debe ser menor o igual al total anual.";
      }
    }
  }
  return issues;
}

type MissingRule = readonly [string, ...AssessmentField[]];
const missingRules: Record<TaxRecommendation["code"], readonly MissingRule[]> = {
  NRUS: [
    ["TR-NRUS-02", "grossAnnualSales", "annualSales", "maxMonthlySales", "salesOrigin"],
    ["TR-NRUS-03", "grossPurchases", "annualPurchases", "maxMonthlyPurchases", "purchasesOrigin"],
    ["TR-NRUS-01", "legal"],
    ["TR-NRUS-04", "invoice"],
    ["TR-NRUS-05", "locations"],
    ["TR-NRUS-06", "assets"], ["TR-NRUS-07", "nrusRestriction"], ["TR-NRUS-08", "domicile"],
  ],
  RER: [
    ["TR-RER-01", "annualSales", "salesOrigin"],
    ["TR-RER-02", "annualPurchases", "purchasesOrigin"],
    ["TR-RER-03", "assets"],
    ["TR-RER-04", "workers"], ["TR-RER-05", "rerRestriction"], ["TR-RER-06", "domicile"],
  ],
  RMT: [["TR-RMT-01", "annualSales", "salesOrigin"], ["TR-RMT-02", "foreignBranch", "linkage"], ["TR-RMT-03", "priorRmt"], ["TR-RMT-04", "domicile"]],
  RG: [["TR-RG-01", "annualSales"]],
};

export function nextAssessmentGap(regime: TaxRecommendation, context: BusinessContext) {
  if (regime.verification !== "VIGENTE" || regime.breachedConditions.length || !regime.missingDataFields.length) return;
  const draft = fromBusinessContext(context);
  const visible = relevantAssessmentFields(draft);
  for (const [ruleId, ...fields] of missingRules[regime.code]) {
    const rule = regime.evaluatedRules.find((item) => item.ruleId === ruleId && item.passed === null);
    if (!rule) continue;
    const legacyAmount = context.assessmentVersion === 3 && (ruleId === "TR-NRUS-02" ? "annualSales" : ruleId === "TR-NRUS-03" ? "annualPurchases" : undefined);
    const field = fields.find((field) => field !== legacyAmount && visible.includes(field)
      && (!draft[field] || draft[field] === "unknown" || draft[field] === "aun-no-se" || draft[field] === "desconocido"));
    if (field) return { field, explanation: rule.explanation };
  }
  if (!context.activityId && !context.ciiu && !context.otherActivity?.trim()) {
    return { field: "activity" as const, explanation: "Falta indicar la actividad registrada de tu restaurante." };
  }
}

export function assessmentEditHref(field?: AssessmentField) {
  return "/negocios/nuevo?editar=1" + (field ? "&campo=" + field : "");
}

function amount(text: string) {
  return text === "" ? undefined : Number(text.replace(",", "."));
}

function boolean(text: string) {
  return text === "yes" ? true : text === "no" ? false : undefined;
}

export const isPlanning = (stage: string) => stage === "idea" || stage === "preparacion";

export function toBusinessContext(draft: AssessmentDraft, previous?: BusinessContext): BusinessContext {
  const visible = relevantAssessmentFields(draft);
  const included = (field: AssessmentField) => visible.includes(field) ? draft[field] : "";
  const locations = amount(included("locations"));
  const workers = amount(included("workers"));
  const needsInvoices = boolean(included("invoice"));
  const modern = Boolean(draft.stage);
  const classification = confirmedClassification(draft.activity, draft.activityEvidence, draft.secondary);
  const activity = modern ? classification?.primary ?? "" : draft.activity === "unknown" ? "" : draft.activity;
  const financialOrigin = (value: string): FinancialOrigin =>
    value === "proyectado" || (value === "real" && !isPlanning(draft.stage)) ? value : "desconocido";
  const partnerCount = amount(included("partners"));
  return {
    ...previous,
    assessmentVersion: modern ? 3 : 2,
    stage: draft.stage || undefined,
    financialOrigins: modern ? { sales: financialOrigin(draft.salesOrigin), purchases: financialOrigin(draft.purchasesOrigin) } : undefined,
    ciiuClassification: classification,
    operationMode: draft.mode || undefined,
    grossAnnualRevenue: amount(included("grossAnnualSales")),
    grossAnnualPurchases: amount(included("grossPurchases")),
    domiciledInPeru: boolean(included("domicile")),
    rmtPriorYearOverLimit: boolean(included("priorRmt")),
    hasRuc: boolean(included("rucStatus")),
    municipalRisk: draft.risk && visible.includes("risk") ? draft.risk : undefined,
    licenseStatus: draft.license && visible.includes("license") ? draft.license : undefined,
    itseStatus: draft.itse && visible.includes("itse") ? draft.itse : undefined,
    nrusExcluded: boolean(included("nrusRestriction")),
    rerExcluded: boolean(included("rerRestriction")),
    businessName: draft.name.trim(),
    purpose: isPlanning(draft.stage) ? "crear" : draft.stage === "operando" ? "formalizar" : "revisar",
    sectorId: "restaurantes",
    activityId: activity,
    ciiu: modern ? classification?.primary : activity === "restaurante" ? "5610" : activity === "catering" ? "5621" : undefined,
    otherActivity: modern ? draft.description.trim() : "",
    department: "Cajamarca",
    province: modern ? draft.province : previous?.province ?? "",
    district: modern ? included("district").trim() : previous?.district ?? "",
    legalPerson: draft.legal || "aun-no-se",
    personType: draft.legal === "natural" ? "PERSONA_NATURAL" : draft.legal === "juridica" ? "PERSONA_JURIDICA" : undefined,
    hasPartners: modern ? (partnerCount ?? 0) > 0 : previous?.hasPartners ?? false,
    partnerCount: modern ? partnerCount ?? 0 : previous?.partnerCount ?? 0,
    hasPhysicalLocation: modern ? draft.mode === "local" || draft.mode === "delivery" || included("fixedPlace") === "yes" : locations !== undefined,
    hasLocal: modern ? draft.mode === "local" || draft.mode === "delivery" ? true : boolean(included("fixedPlace")) : previous?.hasLocal,
    servesPublic: modern ? draft.mode === "local" || draft.mode === "movil" : previous?.servesPublic ?? true,
    hasEmployees: modern ? boolean(included("workforce")) : workers === undefined ? undefined : workers > 0,
    employeeCount: workers ?? 0,
    employeeCountPerShift: workers,
    employees: workers,
    sellsOnline: modern ? draft.mode === "delivery" : previous?.sellsOnline ?? false,
    preparesFood: modern ? Boolean(classification && classification.primary !== "5630") : true,
    importsGoods: previous?.importsGoods ?? false,
    exportsGoods: previous?.exportsGoods ?? false,
    providesRegulatedService: previous?.providesRegulatedService ?? false,
    customerType: draft.customers || "aun-no-se",
    needsInvoices: needsInvoices ?? null,
    needsFacturas: needsInvoices,
    emittedReceipts: modern ? undefined : needsInvoices === true ? ["BOLETA", "FACTURA"] : needsInvoices === false ? ["BOLETA"] : undefined,
    establishmentCount: locations,
    hasMultipleLocations: locations !== undefined && locations > 1,
    foreignSourceIncome: previous?.foreignSourceIncome ?? false,
    collectsPersonalData: previous?.collectsPersonalData ?? false,
    currentRegime: modern && (isPlanning(draft.stage) || draft.rucStatus === "no") ? "SIN_REGIMEN" : draft.regime || "DESCONOCIDO",
    annualRevenue: amount(included("annualSales")),
    annualPurchases: amount(included("annualPurchases")),
    maxMonthlyRevenue: amount(included("maxMonthlySales")),
    maxMonthlyPurchases: amount(included("maxMonthlyPurchases")),
    fixedAssets: amount(included("assets")),
    fixedAssetsValue: amount(included("assets")),
    hasCorporateLinkageOverLimit: boolean(included("linkage")),
    isForeignBranch: boolean(included("foreignBranch")),
    questionnaire: undefined,
    dataOrigins: undefined,
  };
}

export function fromBusinessContext(context: BusinessContext): AssessmentDraft {
  const value = (input?: number) => input === undefined ? "" : String(input);
  const choice = (input?: boolean | null) => input === true ? "yes" : input === false ? "no" : "unknown";
  const activity = context.ciiu === "5621" || context.activityId === "catering" ? "catering"
    : context.ciiu === "5610" || context.activityId === "restaurante" ? "restaurante" : "unknown";
  const code = context.ciiuClassification?.primary ?? context.ciiu;
  return {
    ...emptyDraft,
    name: context.businessName ?? "",
    stage: context.stage ?? "",
    description: context.otherActivity ?? "",
    activity: context.stage ? isCiiuCode(code) ? code : "unknown" : activity,
    activityEvidence: isCiiuCode(code) ? code : "unknown",
    secondary: context.ciiuClassification?.secondary.join(",") ?? "",
    salesOrigin: context.financialOrigins?.sales ?? "",
    purchasesOrigin: context.financialOrigins?.purchases ?? "",
    grossAnnualSales: value(context.grossAnnualRevenue),
    grossPurchases: value(context.grossAnnualPurchases),
    domicile: choice(context.domiciledInPeru),
    priorRmt: choice(context.rmtPriorYearOverLimit),
    workforce: choice(context.hasEmployees),
    province: context.province,
    district: context.district,
    mode: context.operationMode ?? "",
    fixedPlace: choice(context.hasLocal),
    partners: context.hasPartners ? value(context.partnerCount) : "",
    customers: context.customerType,
    rucStatus: choice(context.hasRuc),
    risk: context.municipalRisk ?? "",
    license: context.licenseStatus ?? "",
    itse: context.itseStatus ?? "",
    nrusRestriction: choice(context.nrusExcluded),
    rerRestriction: choice(context.rerExcluded),
    legal: context.legalPerson,
    regime: context.currentRegime ?? "DESCONOCIDO",
    invoice: choice(context.needsFacturas ?? context.needsInvoices),
    annualSales: value(context.annualRevenue),
    annualPurchases: value(context.annualPurchases),
    maxMonthlySales: value(context.maxMonthlyRevenue),
    maxMonthlyPurchases: value(context.maxMonthlyPurchases),
    assets: value(context.fixedAssetsValue ?? context.fixedAssets),
    workers: value(context.employeeCountPerShift ?? context.employees),
    locations: value(context.establishmentCount),
    linkage: choice(context.hasCorporateLinkageOverLimit),
    foreignBranch: choice(context.isForeignBranch),
  };
}

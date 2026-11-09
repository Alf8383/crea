export type RequirementStatus = "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "NO_APLICA" | "REQUIERE_REVISION";
export type Classification = "OBLIGATORIO" | "CONDICIONAL" | "RECOMENDADO" | "INFORMATIVO";
export type VerificationStatus = "VIGENTE" | "POR_VERIFICAR" | "DEROGADA" | "REEMPLAZADA";
export type Operator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN" | "NOT_IN" | "CONTAINS" | "IS_TRUE" | "IS_FALSE";

export type TaxRegimeCode = "NRUS" | "RER" | "RMT" | "RG";
export type DataOrigin = "DECLARADO_USUARIO" | "VERIFICADO_FUENTE_OFICIAL";
export type ReceiptType = "BOLETA" | "FACTURA" | "TICKET" | "LIQUIDACION_COMPRA" | "NOTA_CREDITO" | "GUIA_REMISION";
export type RestaurantActivityCode =
  | "5610"
  | "5621"
  | "5629"
  | "5630"
  | "RESTAURANTE_MENU"
  | "POLLERIA_PARRILLERIA"
  | "PICANTERIA_TRADICIONAL"
  | "CAFETERIA_FUENTE_SODA"
  | "CATERING_EVENTOS";

export type BusinessContext = {
  questionnaire?: Record<string, string | string[]>;
  businessName: string;
  purpose: "crear" | "formalizar" | "revisar";
  sectorId: string;
  activityId: string;
  otherActivity: string;
  department: string;
  province: string;
  district: string;
  legalPerson: "natural" | "juridica" | "aun-no-se";
  personType?: "PERSONA_NATURAL" | "PERSONA_JURIDICA";
  hasPartners: boolean;
  partnerCount: number;
  hasPhysicalLocation: boolean;
  hasLocal?: boolean;
  servesPublic: boolean;
  hasEmployees?: boolean;
  employeeCount: number;
  employeeCountPerShift?: number;
  employees?: number;
  sellsOnline: boolean;
  preparesFood: boolean;
  importsGoods: boolean;
  exportsGoods: boolean;
  providesRegulatedService: boolean;
  customerType: "personas" | "empresas" | "ambos" | "aun-no-se";
  monthlyRevenue?: number;
  monthlyPurchases?: number;
  annualPurchases?: number;
  fixedAssets?: number;
  fixedAssetsValue?: number;
  needsInvoices: boolean | null;
  needsFacturas?: boolean;
  hasMultipleLocations: boolean;
  foreignSourceIncome: boolean;
  collectsPersonalData: boolean;

  // Campos específicos de restaurante formalizado (Tesis Cajamarca 2026)
  ruc?: string;
  currentRegime?: TaxRegimeCode | "DESCONOCIDO" | "SIN_REGIMEN";
  ciiu?: string;
  restaurantSpecialty?: RestaurantActivityCode;
  annualRevenue?: number;
  monthlyPurchasesWithInvoice?: number;
  monthlyPurchasesWithoutInvoice?: number;
  monthlyOperatingExpenses?: number;
  establishmentCount?: number;
  emittedReceipts?: ReceiptType[];
  hasCorporateLinkageOverLimit?: boolean | null;
  isForeignBranch?: boolean | null;
  dataOrigins?: Record<string, DataOrigin>;
};

export type BusinessCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
  reviewSourceId?: string;
};

export type BusinessActivity = {
  id: string;
  sectorId: string;
  name: string;
  ciiu: string;
  sectorQuestion?: string;
};

export type Condition = {
  field: keyof BusinessContext;
  operator: Operator;
  value?: unknown;
};

export type ConditionGroup = {
  connector: "AND" | "OR";
  conditions: Array<Condition | ConditionGroup>;
};

export type RuleAction = {
  type: "ADD_REQUIREMENT";
  requirementId: string;
  classification: Classification;
  reason: string;
};

export type Rule = {
  id: string;
  version: number;
  name: string;
  status: "BORRADOR" | "PUBLICADA";
  sourceId: string;
  priority: number;
  conditions: ConditionGroup;
  actions: RuleAction[];
  effectiveFrom: string;
  effectiveTo?: string;
  lastVerifiedAt: string;
  nextReviewAt: string;
  verifiedBy: string;
};

export type TaxRuleDetail = {
  id: string;
  regime: TaxRegimeCode;
  version: number | string;
  name: string;
  title: string;
  conditionDescription: string;
  description: string;
  legalBasis: string;
  sourceId: string;
  effectiveFrom: string;
  effectiveDate: string;
  lastVerifiedAt: string;
  reviewedAt: string;
  nextReviewAt: string;
  verifiedBy: string;
};

export type Source = {
  id: string;
  institution: string;
  entity: string;
  title: string;
  url: string;
  reviewedAt: string;
  nextReviewAt: string;
  reviewFrequencyDays: number;
  status: VerificationStatus;
  verification: VerificationStatus;
  verifiedBy: string;
  evidence: string;
  legalBasis?: string;
  version?: string;
  effectiveDate?: string;
};

export type Requirement = {
  id: string;
  title: string;
  category: string;
  description: string;
  documents: string[];
  institution: string;
  sourceId: string;
  applicableRegimes?: TaxRegimeCode[];
  status?: RequirementStatus;
};

export type AppliedRequirement = {
  requirementId: string;
  classification: Classification;
  reason: string;
  ruleId: string;
  ruleVersion: number;
  sourceId: string;
  priority: number;
  verification: VerificationStatus;
  lastVerifiedAt: string;
  nextReviewAt: string;
};

export type TaxRuleEvaluationItem = {
  ruleId: string;
  title: string;
  passed: boolean | null;
  reason: string;
  explanation: string;
  legalBasis: string;
  sourceId: string;
  sourceUrl: string;
  effectiveDate: string;
  reviewedAt: string;
  version: string;
  sourceVerification: VerificationStatus;
};

export type TaxRecommendation = {
  code: TaxRegimeCode;
  regime: TaxRegimeCode;
  title: string;
  name: string;
  compatible: boolean;
  status: "COMPATIBLE" | "INCOMPATIBLE" | "INFORMACION_INSUFICIENTE";
  isCurrentRegime?: boolean;
  reasons: string[];
  breachedConditions: string[];
  missingDataFields: string[];
  evaluatedRules: TaxRuleEvaluationItem[];
  matchedRules?: TaxRuleEvaluationItem[];
  failedRules?: TaxRuleEvaluationItem[];
  missingFields?: string[];
  sourceId: string;
  ruleVersion?: number;
  effectiveFrom?: string;
  lastVerifiedAt?: string;
  verification: VerificationStatus;
};

export type CurrentRegimeDiagnostic = {
  declaredRegime: TaxRegimeCode | "DESCONOCIDO" | "SIN_REGIMEN";
  currentRegime: TaxRegimeCode | "DESCONOCIDO" | "SIN_REGIMEN";
  regimeName: string;
  status: "COMPATIBLE" | "INCOMPATIBLE" | "INFORMACION_INSUFICIENTE";
  summary: string;
  breachedConditions: string[];
  missingConditions: string[];
  declaredRegimeOrigin: DataOrigin;
  evaluation: TaxRecommendation | null;
  isCompliantWithCurrent: boolean | null;
  compatibleAlternatives: TaxRecommendation[];
  incompatibleRegimes: TaxRecommendation[];
  insufficientInfoRegimes: TaxRecommendation[];
  summaryMessage: string;
  diagnosticDate: string;
  catalogVersion: string;
};

export type CatalogData = {
  categories: BusinessCategory[];
  activities: BusinessActivity[];
  requirements: Requirement[];
  rules: Rule[];
  sources: Source[];
  taxRules: TaxRuleDetail[];
};

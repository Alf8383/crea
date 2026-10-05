export type RequirementStatus = "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "NO_APLICA" | "REQUIERE_REVISION";
export type Classification = "OBLIGATORIO" | "CONDICIONAL" | "RECOMENDADO" | "INFORMATIVO";
export type VerificationStatus = "VIGENTE" | "POR_VERIFICAR" | "DEROGADA" | "REEMPLAZADA";
export type Operator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN" | "NOT_IN" | "CONTAINS" | "IS_TRUE" | "IS_FALSE";

export type BusinessContext = {
  questionnaire?: Record<string, string | string[]>;
  businessName: string; purpose: "crear" | "formalizar" | "revisar"; sectorId: string; activityId: string; otherActivity: string;
  department: string; province: string; district: string; legalPerson: "natural" | "juridica" | "aun-no-se";
  hasPartners: boolean; partnerCount: number; hasPhysicalLocation: boolean; servesPublic: boolean; hasEmployees?: boolean; employeeCount: number; employeeCountPerShift: number;
  sellsOnline: boolean; preparesFood: boolean; importsGoods: boolean; exportsGoods: boolean; providesRegulatedService: boolean;
  customerType: "personas" | "empresas" | "ambos" | "aun-no-se"; monthlyRevenue: number; monthlyPurchases: number; annualPurchases: number; fixedAssets: number;
  needsInvoices: boolean | null; hasMultipleLocations: boolean; foreignSourceIncome: boolean; collectsPersonalData: boolean;
};
export type BusinessCategory = { id: string; name: string; icon: string; description: string; reviewSourceId?: string };
export type BusinessActivity = { id: string; sectorId: string; name: string; ciiu: string; sectorQuestion?: string };
export type Condition = { field: keyof BusinessContext; operator: Operator; value?: unknown };
export type ConditionGroup = { connector: "AND" | "OR"; conditions: Array<Condition | ConditionGroup> };
export type RuleAction = { type: "ADD_REQUIREMENT"; requirementId: string; classification: Classification; reason: string };
export type Rule = { id: string; version: number; name: string; status: "BORRADOR" | "PUBLICADA"; sourceId: string; priority: number; conditions: ConditionGroup; actions: RuleAction[]; effectiveFrom: string; effectiveTo?: string; lastVerifiedAt: string; nextReviewAt: string; verifiedBy: string };
export type Source = { id: string; institution: string; title: string; url: string; reviewedAt: string; nextReviewAt: string; reviewFrequencyDays: number; status: VerificationStatus; verifiedBy: string; evidence: string };
export type Requirement = { id: string; title: string; category: string; description: string; documents: string[]; institution: string; sourceId: string; status?: RequirementStatus };
export type AppliedRequirement = { requirementId: string; classification: Classification; reason: string; ruleId: string; ruleVersion: number; sourceId: string; priority: number; verification: VerificationStatus; lastVerifiedAt: string; nextReviewAt: string };
export type TaxRecommendation = { code: "NRUS" | "RER" | "RMT" | "RG"; title: string; compatible: boolean; status: "COMPATIBLE" | "INCOMPATIBLE" | "INFORMACION_INSUFICIENTE"; reasons: string[]; sourceId: string; verification: VerificationStatus };

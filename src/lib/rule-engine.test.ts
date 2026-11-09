import { describe, expect, it } from "vitest";
import { askCreaIa, resetCreaIaRateLimitForTest } from "./crea-ia";
import { DEMO_PRESETS } from "./demo-presets";
import { questions } from "./questionnaire";
import {
  compareParticipantPrePost,
  createPendingInstrumentTemplate,
  exportResearchRecordsToCsv,
  getSanitizedInstrumentForParticipant,
  isValidParticipantCode,
  scoreEvaluationSubmission,
  validatePosttestEligibility,
  type ParticipantAcademicRecord,
} from "./research-engine";
import { RuleEngine } from "./rule-engine";
import { rules, seedCatalog, sources } from "./seed-catalog";
import { getRestaurantObligations, getSunatDueDate } from "./sunat-calendar";
import { simulateRestaurantTaxes } from "./tax-simulator";
import type { BusinessContext } from "./types";

const baseRestaurant: BusinessContext = {
  businessName: "Restaurante Tradicional El Cumbe",
  ruc: "10428519302",
  currentRegime: "NRUS",
  ciiu: "5610",
  restaurantSpecialty: "RESTAURANTE_MENU",
  purpose: "formalizar",
  sectorId: "restaurantes",
  activityId: "restaurante",
  otherActivity: "Restaurante de menú familiar en Cajamarca",
  department: "Cajamarca",
  province: "Cajamarca",
  district: "Cajamarca",
  legalPerson: "natural",
  personType: "PERSONA_NATURAL",
  hasPartners: false,
  partnerCount: 1,
  hasPhysicalLocation: true,
  servesPublic: true,
  hasEmployees: true,
  employeeCount: 2,
  employeeCountPerShift: 2,
  employees: 2,
  sellsOnline: false,
  preparesFood: true,
  importsGoods: false,
  exportsGoods: false,
  providesRegulatedService: false,
  customerType: "personas",
  monthlyRevenue: 4500,
  annualRevenue: 54000,
  monthlyPurchases: 2200,
  monthlyPurchasesWithInvoice: 1500,
  monthlyPurchasesWithoutInvoice: 700,
  monthlyOperatingExpenses: 900,
  annualPurchases: 26400,
  fixedAssets: 12000,
  fixedAssetsValue: 12000,
  establishmentCount: 1,
  needsInvoices: false,
  needsFacturas: false,
  emittedReceipts: ["BOLETA"],
  hasMultipleLocations: false,
  hasCorporateLinkageOverLimit: false,
  isForeignBranch: false,
  foreignSourceIncome: false,
  collectsPersonalData: false,
};

describe("1. Casos compatibles e incompatibles y diagnóstico del régimen actual", () => {
  it("declara COMPATIBLE los 4 regímenes para un restaurante pequeño de persona natural que cumple todos los requisitos", () => {
    const res = RuleEngine.evaluate(baseRestaurant, seedCatalog);
    expect(res.currentRegimeDiagnostic?.status).toBe("COMPATIBLE");
    expect(res.taxRecommendations.map((r) => r.status)).toEqual([
      "COMPATIBLE",
      "COMPATIBLE",
      "COMPATIBLE",
      "COMPATIBLE",
    ]);
  });

  it("detecta incompatibilidad en el régimen actual cuando un restaurante en NRUS supera ventas y necesita emitir facturas", () => {
    const preset4 = DEMO_PRESETS[3].context;
    const res = RuleEngine.evaluate(preset4, seedCatalog);
    expect(res.currentRegimeDiagnostic?.currentRegime).toBe("NRUS");
    expect(res.currentRegimeDiagnostic?.status).toBe("INCOMPATIBLE");
    expect(res.currentRegimeDiagnostic?.breachedConditions.length).toBeGreaterThan(0);
    expect(
      res.currentRegimeDiagnostic?.compatibleAlternatives.map((a) => a.code)
    ).toEqual(["RER", "RMT", "RG"]);
  });
});

describe("2. Límites de ingresos, compras, activos, locales y personal por turno", () => {
  it("declara INCOMPATIBLE el Nuevo RUS cuando las ventas o compras superan S/ 8,000 mensuales o tiene más de 1 local", () => {
    const recs = RuleEngine.recommendTax({
      ...baseRestaurant,
      monthlyRevenue: 9500,
      annualRevenue: 114000,
      establishmentCount: 2,
    });
    const nrus = recs.find((r) => r.code === "NRUS");
    expect(nrus?.status).toBe("INCOMPATIBLE");
    expect(nrus?.breachedConditions.length).toBeGreaterThanOrEqual(2);
  });

  it("declara INCOMPATIBLE el RER cuando el restaurante supera 10 trabajadores por turno o S/ 126,000 en activos fijos", () => {
    const recs = RuleEngine.recommendTax({
      ...baseRestaurant,
      employees: 12,
      employeeCountPerShift: 12,
      fixedAssets: 165000,
      fixedAssetsValue: 165000,
    });
    const rer = recs.find((r) => r.code === "RER");
    const rmt = recs.find((r) => r.code === "RMT");
    expect(rer?.status).toBe("INCOMPATIBLE");
    expect(rmt?.status).toBe("COMPATIBLE");
  });

  it("declara INCOMPATIBLE el RMT cuando los ingresos anuales superan las 1,700 UIT, dejando solo RG como compatible", () => {
    const recs = RuleEngine.recommendTax({
      ...baseRestaurant,
      monthlyRevenue: 850000,
      annualRevenue: 10200000,
    });
    expect(recs.find((r) => r.code === "RMT")?.status).toBe("INCOMPATIBLE");
    expect(recs.find((r) => r.code === "RG")?.status).toBe("COMPATIBLE");
  });
});

describe("3. Datos incompletos (INFORMACION_INSUFICIENTE)", () => {
  it("no declara compatible un régimen cuando falta verificar alguna condición obligatoria (compras, activos o trabajadores)", () => {
    const incomplete: BusinessContext = {
      ...baseRestaurant,
      monthlyPurchases: undefined,
      monthlyPurchasesWithInvoice: undefined,
      fixedAssets: undefined,
      fixedAssetsValue: undefined,
      employees: undefined,
      employeeCountPerShift: undefined,
    };
    const recs = RuleEngine.recommendTax(incomplete);
    expect(recs.find((r) => r.code === "NRUS")?.status).toBe(
      "INFORMACION_INSUFICIENTE"
    );
    expect(recs.find((r) => r.code === "RER")?.status).toBe(
      "INFORMACION_INSUFICIENTE"
    );
  });
});

describe("4 y 5. Restricciones por tipo de contribuyente y por necesidad de factura", () => {
  it("excluye del Nuevo RUS a una Persona Jurídica (RUC 20)", () => {
    const recs = RuleEngine.recommendTax({
      ...baseRestaurant,
      legalPerson: "juridica",
      personType: "PERSONA_JURIDICA",
    });
    expect(recs.find((r) => r.code === "NRUS")?.status).toBe("INCOMPATIBLE");
    expect(recs.find((r) => r.code === "RER")?.status).toBe("COMPATIBLE");
  });

  it("excluye del Nuevo RUS al restaurante que necesita emitir facturas", () => {
    const recs = RuleEngine.recommendTax({
      ...baseRestaurant,
      needsInvoices: true,
      needsFacturas: true,
      emittedReceipts: ["BOLETA", "FACTURA"],
    });
    expect(recs.find((r) => r.code === "NRUS")?.status).toBe("INCOMPATIBLE");
  });
});

describe("6. Restricciones por actividad económica y no solicitud de Clave SOL", () => {
  it("rechaza actividades que no correspondan al giro de restaurantes (CIIU 5610 / 5621)", () => {
    const recs = RuleEngine.recommendTax({
      ...baseRestaurant,
      sectorId: "comercio",
      activityId: "tienda",
    });
    expect(recs.every((r) => r.status === "INCOMPATIBLE")).toBe(true);
  });

  it("verifica que el cuestionario sea exclusivo para restaurantes y nunca solicite Clave SOL", () => {
    const allIds = questions.flat().map((q) => q.id);
    expect(allIds).not.toContain("P35");
    const allTitles = questions.flat().map((q) => q.title.toLowerCase());
    expect(allTitles.some((t) => t.includes("clave sol"))).toBe(false);
  });
});

describe("7. Validez de fuentes oficiales y bloqueo de fuentes pendientes de revisión", () => {
  it("no presenta como vigentes fuentes que estén en estado POR_VERIFICAR o con fecha de revisión vencida", () => {
    const pendingSource = sources.find((s) => s.id === "sector-review");
    const check = RuleEngine.checkSourceHealth(pendingSource, "2026-10-15");
    expect(check.canPresentAsCurrent).toBe(false);
    expect(check.status).toBe("POR_VERIFICAR");

    const applied = RuleEngine.evaluate(
      baseRestaurant,
      rules,
      sources,
      "2026-10-15"
    );
    expect(
      applied.find((item) => item.requirementId === "sector")?.verification
    ).toBe("POR_VERIFICAR");

    const recsPending = RuleEngine.recommendTax(
      baseRestaurant,
      "sunat-regimes",
      "POR_VERIFICAR"
    );
    expect(
      recsPending.every((item) => item.status === "INFORMACION_INSUFICIENTE")
    ).toBe(true);
  });
});

describe("8. Cálculos del simulador tributario y cronograma oficial de SUNAT", () => {
  it("distingue ingresos, compras con/sin factura, gastos, IGV y Renta, e incluye descargo orientativo", () => {
    const sim = simulateRestaurantTaxes(DEMO_PRESETS[1].context); // Pollería S/ 22,000 ventas, S/ 11,800 compras con factura
    expect(sim.regimes.RER.canEstimate).toBe(true);
    expect(sim.regimes.RER.igvCreditFromPurchases).toBeGreaterThan(0);
    expect(sim.regimes.RER.monthlyIgvPayable).toBeLessThan(
      sim.regimes.RER.igvSales
    );
    expect(sim.disclaimer).toContain("no es necesariamente el mejor");
  });

  it("consulta el cronograma oficial de SUNAT por último dígito del RUC sin inventar fechas para periodos no cargados", () => {
    const valid = getSunatDueDate("10428519302", "2026-03"); // Termina en 2
    expect(valid.rucLastDigit).toBe("2");
    expect(valid.dueDate).toBe("2026-04-17");
    expect(valid.verification).toBe("VIGENTE");

    const unknownPeriod = getSunatDueDate("10428519302", "2029-12");
    expect(unknownPeriod.dueDate).toBeNull();
    expect(unknownPeriod.verification).toBe("POR_VERIFICAR");

    const plan = getRestaurantObligations(baseRestaurant, "2026-03");
    expect(plan.completionDisclaimer).toContain("NO significa que SUNAT");
  });
});

describe("9. Asistente Crea IA y controles de seguridad", () => {
  it("explica el diagnóstico con citas verificables sin contradecir al motor de reglas y reconoce temas fuera de alcance", async () => {
    resetCreaIaRateLimitForTest();
    const res = await askCreaIa(
      "¿Cuál es la diferencia entre RER y RMT para mi restaurante?",
      DEMO_PRESETS[1].context
    );
    expect(res.metrics.contradictsRuleEngine).toBe(false);
    expect(res.citations.length).toBeGreaterThan(0);

    const outOfScope = await askCreaIa(
      "¿Cómo ingreso mi Clave SOL y contraseña?",
      baseRestaurant
    );
    expect(outOfScope.hasSufficientInformation).toBe(false);
    expect(outOfScope.answer).toContain("nunca solicita");
  });
});

describe("10. Validación del módulo de Investigación Académica (Pretest y Postest)", () => {
  it("valida códigos anónimos (36 restaurantes), oculta respuestas correctas durante pruebas, exige otro día para el postest y exporta CSV sin datos personales", () => {
    expect(isValidParticipantCode("REST-CAJ-01")).toBe(true);
    expect(isValidParticipantCode("REST-CAJ-36")).toBe(true);
    expect(isValidParticipantCode("REST-CAJ-37")).toBe(false);

    const inst = createPendingInstrumentTemplate();
    expect(inst.questions).toHaveLength(20);

    // Verificar que la vista para el participante jamás exponga correctOptionId
    const sanitized = getSanitizedInstrumentForParticipant(inst);
    expect("correctOptionId" in sanitized[0]).toBe(false);

    // Simular respuestas para Pretest
    const answersPre: Record<string, "A" | "B" | "C" | "D"> = {};
    inst.questions.forEach((q, idx) => {
      answersPre[q.id] = idx < 10 ? "A" : "B"; // 10 correctas
    });
    const scoresPre = scoreEvaluationSubmission(inst, answersPre);
    expect(scoresPre.total).toBe(10);

    const record: ParticipantAcademicRecord = {
      participantCode: "REST-CAJ-01",
      consentAccepted: true,
      roleInRestaurant: "PROPIETARIO",
      pretest: {
        participantCode: "REST-CAJ-01",
        stage: "PRETEST",
        instrumentVersion: inst.version,
        submittedDateIso: "2026-10-10T10:00:00.000Z",
        calendarDay: "2026-10-10",
        selectedAnswers: answersPre,
        scores: scoresPre,
      },
      intervention: {
        participantCode: "REST-CAJ-01",
        modulesVisited: ["Mi diagnóstico", "Simulador"],
        completedDiagnostic: true,
        usedSimulator: true,
        reviewedObligations: false,
        consultedCreaIa: false,
        firstSessionTimestamp: "2026-10-10T10:15:00.000Z",
        lastSessionTimestamp: "2026-10-10T10:30:00.000Z",
      },
    };

    // No debe permitir Postest el mismo día
    const sameDayCheck = validatePosttestEligibility(
      record,
      inst.version,
      "2026-10-10T18:00:00.000Z"
    );
    expect(sameDayCheck.eligible).toBe(false);

    // No debe permitir Postest con una versión distinta del instrumento
    const diffVersionCheck = validatePosttestEligibility(
      record,
      "OTRA-VERSION-2.0",
      "2026-10-12T10:00:00.000Z"
    );
    expect(diffVersionCheck.eligible).toBe(false);

    // Sí debe permitir Postest en un día posterior con la misma versión
    const nextDayCheck = validatePosttestEligibility(
      record,
      inst.version,
      "2026-10-12T10:00:00.000Z"
    );
    expect(nextDayCheck.eligible).toBe(true);

    // Registrar Postest y comparar por dimensión D1, D2, D3
    const answersPost: Record<string, "A" | "B" | "C" | "D"> = {};
    inst.questions.forEach((q) => {
      answersPost[q.id] = "A"; // 20 correctas
    });
    record.posttest = {
      participantCode: "REST-CAJ-01",
      stage: "POSTTEST",
      instrumentVersion: inst.version,
      submittedDateIso: "2026-10-12T10:00:00.000Z",
      calendarDay: "2026-10-12",
      selectedAnswers: answersPost,
      scores: scoreEvaluationSubmission(inst, answersPost),
    };

    const comp = compareParticipantPrePost(record);
    expect(comp?.totalDiff).toBe(10);

    const csv = exportResearchRecordsToCsv([record]);
    expect(csv).toContain("REST-CAJ-01");
    expect(csv).toContain("D1_Pretest");
  });
});

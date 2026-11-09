import { BusinessContext, TaxRegimeCode } from "./types";

export interface RegimeSimulationDetail {
  regime: TaxRegimeCode;
  regimeName: string;
  canEstimate: boolean;
  insufficientDataReason?: string;
  grossMonthlySales: number;
  netMonthlySales: number;
  igvSales: number;
  grossMonthlyPurchasesWithInvoice: number;
  netMonthlyPurchasesWithInvoice: number;
  igvCreditFromPurchases: number;
  monthlyPurchasesWithoutInvoice: number;
  monthlyOperatingExpenses: number;
  monthlyIgvPayable: number;
  monthlyIncomeTaxPayable: number;
  totalMonthlyTaxEstimated: number;
  estimatedAnnualNetIncome: number;
  estimatedAnnualIncomeTaxRegularization: number;
  totalAnnualTaxEstimated: number;
  calculationExplanation: string[];
  legalNote: string;
}

export interface TaxSimulationResult {
  uitReference: number;
  uitYear: number;
  igvRateApplied: number;
  inputsUsed: {
    grossMonthlySales: number;
    grossMonthlyPurchasesWithInvoice: number;
    monthlyPurchasesWithoutInvoice: number;
    monthlyOperatingExpenses: number;
  };
  assumptions: string[];
  disclaimer: string;
  regimes: Record<TaxRegimeCode, RegimeSimulationDetail>;
}

export interface CustomSimulationInputs {
  grossMonthlySales?: number;
  grossMonthlyPurchasesWithInvoice?: number;
  monthlyPurchasesWithoutInvoice?: number;
  monthlyOperatingExpenses?: number;
  useReducedRestaurantIgv?: boolean; // Informativo: Ley 31556 / 32219 (sujeto a verificación vigente por contador)
}

/**
 * UIT 2026 referencial (D.S. EF vigente) utilizada para límites en UIT (1,700 UIT, 300 UIT, 15 UIT).
 * Se expone explícitamente en los supuestos del simulador.
 */
export const UIT_2026 = 5350;

export function simulateRestaurantTaxes(
  context: BusinessContext,
  custom?: CustomSimulationInputs
): TaxSimulationResult {
  const grossSales =
    custom?.grossMonthlySales ??
    context.monthlyRevenue ??
    (context.annualRevenue !== undefined ? context.annualRevenue / 12 : 0);

  const grossPurchasesWithInvoice =
    custom?.grossMonthlyPurchasesWithInvoice ??
    context.monthlyPurchasesWithInvoice ??
    context.monthlyPurchases ??
    0;

  const purchasesWithoutInvoice =
    custom?.monthlyPurchasesWithoutInvoice ??
    context.monthlyPurchasesWithoutInvoice ??
    0;

  const operatingExpenses =
    custom?.monthlyOperatingExpenses ??
    context.monthlyOperatingExpenses ??
    0;

  // Tasa general IGV + IPM = 18% (0.18).
  // Si el usuario activa la vista comparativa informativa de tasa especial MYPE restaurantes, se indica explícitamente que requiere validar vigencia y requisitos de ingresos por restaurante.
  const igvRate = custom?.useReducedRestaurantIgv ? 0.10 : 0.18;

  const hasEnoughSalesData =
    custom?.grossMonthlySales !== undefined ||
    context.monthlyRevenue !== undefined ||
    context.annualRevenue !== undefined;

  const netSales = Number((grossSales / (1 + igvRate)).toFixed(2));
  const igvSales = Number((grossSales - netSales).toFixed(2));

  const netPurchasesWithInvoice = Number(
    (grossPurchasesWithInvoice / (1 + igvRate)).toFixed(2)
  );
  const igvCredit = Number(
    (grossPurchasesWithInvoice - netPurchasesWithInvoice).toFixed(2)
  );

  // IGV neto por pagar (en regímenes afectos a IGV: RER, RMT, RG)
  const monthlyIgvPayable = Number(Math.max(0, igvSales - igvCredit).toFixed(2));

  // Costos y gastos deducibles mensuales estimados (para RMT y RG anual):
  // Compras con factura (valor neto sin IGV) + gastos operativos sustentados (planilla, alquiler con recibo/factura, servicios).
  // Las compras con boleta sin derecho a crédito fiscal ni sustento de costo/gasto general se advierten por separado.
  const monthlyDeductibleCostsAndExpenses =
    netPurchasesWithInvoice + operatingExpenses;
  const estimatedMonthlyNetProfit = Math.max(
    0,
    netSales - monthlyDeductibleCostsAndExpenses
  );
  const estimatedAnnualNetIncome = Number(
    (estimatedMonthlyNetProfit * 12).toFixed(2)
  );
  const netAnnualSales = netSales * 12;

  // 1. Nuevo RUS (NRUS)
  const maxNrusBase = Math.max(
    grossSales,
    grossPurchasesWithInvoice + purchasesWithoutInvoice
  );
  let nrusMonthlyQuota = 0;
  let nrusCanEstimate = hasEnoughSalesData;
  let nrusReason: string | undefined;

  if (!hasEnoughSalesData) {
    nrusReason =
      "Falta registrar las ventas o compras mensuales para determinar la categoría del Nuevo RUS.";
  } else if (maxNrusBase <= 5000) {
    nrusMonthlyQuota = 20;
  } else if (maxNrusBase <= 8000) {
    nrusMonthlyQuota = 50;
  } else {
    nrusCanEstimate = false;
    nrusReason =
      "Supera el tope máximo mensual de S/ 8,000 en ventas o compras del Nuevo RUS.";
  }

  const nrusDetail: RegimeSimulationDetail = {
    regime: "NRUS",
    regimeName: "Nuevo RUS (Régimen Único Simplificado)",
    canEstimate: nrusCanEstimate,
    insufficientDataReason: nrusReason,
    grossMonthlySales: grossSales,
    netMonthlySales: grossSales,
    igvSales: 0,
    grossMonthlyPurchasesWithInvoice: grossPurchasesWithInvoice,
    netMonthlyPurchasesWithInvoice: grossPurchasesWithInvoice,
    igvCreditFromPurchases: 0,
    monthlyPurchasesWithoutInvoice: purchasesWithoutInvoice,
    monthlyOperatingExpenses: operatingExpenses,
    monthlyIgvPayable: 0,
    monthlyIncomeTaxPayable: nrusMonthlyQuota,
    totalMonthlyTaxEstimated: nrusMonthlyQuota,
    estimatedAnnualNetIncome: 0,
    estimatedAnnualIncomeTaxRegularization: 0,
    totalAnnualTaxEstimated: nrusMonthlyQuota * 12,
    calculationExplanation: nrusCanEstimate
      ? [
          `Ventas brutas mensuales: S/ ${grossSales.toFixed(2)} | Compras totales mensuales: S/ ${(grossPurchasesWithInvoice + purchasesWithoutInvoice).toFixed(2)}.`,
          maxNrusBase <= 5000
            ? "Se ubica en la Categoría 1 (hasta S/ 5,000 mensuales de ingresos o compras): cuota fija mensual de S/ 20.00."
            : "Se ubica en la Categoría 2 (más de S/ 5,000 hasta S/ 8,000 mensuales de ingresos o compras): cuota fija mensual de S/ 50.00.",
          "La cuota fija reemplaza al IGV y al Impuesto a la Renta. No presenta Declaración Jurada Anual.",
        ]
      : [nrusReason || "No aplicable por superar límites del régimen."],
    legalNote:
      "Solo válido para Persona Natural con 1 establecimiento, sin emitir facturas y dentro del límite de S/ 8,000/mes (S/ 96,000/año).",
  };

  // 2. Régimen Especial de Renta (RER)
  const rerCanEstimate =
    hasEnoughSalesData &&
    netAnnualSales <= 525000 &&
    (grossPurchasesWithInvoice + purchasesWithoutInvoice) * 12 <= 525000;
  const rerMonthlyIncomeTax = Number((netSales * 0.015).toFixed(2));
  const rerTotalMonthly = Number(
    (monthlyIgvPayable + rerMonthlyIncomeTax).toFixed(2)
  );

  const rerDetail: RegimeSimulationDetail = {
    regime: "RER",
    regimeName: "Régimen Especial de Renta (RER)",
    canEstimate: rerCanEstimate,
    insufficientDataReason: !hasEnoughSalesData
      ? "Falta registrar ventas mensuales."
      : !rerCanEstimate
        ? "Los ingresos o compras proyectadas superan el tope anual de S/ 525,000 del RER."
        : undefined,
    grossMonthlySales: grossSales,
    netMonthlySales: netSales,
    igvSales,
    grossMonthlyPurchasesWithInvoice: grossPurchasesWithInvoice,
    netMonthlyPurchasesWithInvoice: netPurchasesWithInvoice,
    igvCreditFromPurchases: igvCredit,
    monthlyPurchasesWithoutInvoice: purchasesWithoutInvoice,
    monthlyOperatingExpenses: operatingExpenses,
    monthlyIgvPayable,
    monthlyIncomeTaxPayable: rerMonthlyIncomeTax,
    totalMonthlyTaxEstimated: rerTotalMonthly,
    estimatedAnnualNetIncome,
    estimatedAnnualIncomeTaxRegularization: 0,
    totalAnnualTaxEstimated: Number((rerTotalMonthly * 12).toFixed(2)),
    calculationExplanation: [
      `Valor de venta mensual sin IGV: S/ ${netSales.toFixed(2)} (IGV débito fiscal: S/ ${igvSales.toFixed(2)}).`,
      `Compras mensuales con factura: S/ ${grossPurchasesWithInvoice.toFixed(2)} (Crédito fiscal IGV: S/ ${igvCredit.toFixed(2)}).`,
      `IGV mensual estimado por pagar (Débito - Crédito): S/ ${monthlyIgvPayable.toFixed(2)}.`,
      `Impuesto a la Renta mensual cancelatorio (1.5% sobre ingresos netos S/ ${netSales.toFixed(2)}): S/ ${rerMonthlyIncomeTax.toFixed(2)}.`,
      "No realiza pago de regularización anual de Renta (los pagos mensuales de 1.5% son cancelatorios).",
    ],
    legalNote:
      "Tope de S/ 525,000 anuales en ingresos o compras, máximo 10 trabajadores por turno y S/ 126,000 en activos fijos.",
  };

  // 3. Régimen MYPE Tributario (RMT)
  const rmtCanEstimate = hasEnoughSalesData && netAnnualSales <= 1700 * UIT_2026;
  const rmtMonthlyRate = netAnnualSales <= 300 * UIT_2026 ? 0.01 : 0.015;
  const rmtMonthlyIncomeTax = Number((netSales * rmtMonthlyRate).toFixed(2));
  const rmtTotalMonthly = Number(
    (monthlyIgvPayable + rmtMonthlyIncomeTax).toFixed(2)
  );

  // Renta anual RMT: hasta 15 UIT -> 10%, exceso -> 29.5%
  const fifteenUit = 15 * UIT_2026;
  const rmtAnnualTaxTranche1 =
    Math.min(estimatedAnnualNetIncome, fifteenUit) * 0.10;
  const rmtAnnualTaxTranche2 =
    Math.max(0, estimatedAnnualNetIncome - fifteenUit) * 0.295;
  const rmtTotalAnnualIncomeTax = Number(
    (rmtAnnualTaxTranche1 + rmtAnnualTaxTranche2).toFixed(2)
  );
  const rmtAnnualPaymentsOnAccount = Number(
    (rmtMonthlyIncomeTax * 12).toFixed(2)
  );
  const rmtAnnualRegularization = Number(
    Math.max(0, rmtTotalAnnualIncomeTax - rmtAnnualPaymentsOnAccount).toFixed(2)
  );

  const rmtDetail: RegimeSimulationDetail = {
    regime: "RMT",
    regimeName: "Régimen MYPE Tributario (RMT)",
    canEstimate: rmtCanEstimate,
    insufficientDataReason: !hasEnoughSalesData
      ? "Falta registrar ventas mensuales."
      : !rmtCanEstimate
        ? `Los ingresos netos anuales superan las 1,700 UIT (S/ ${(1700 * UIT_2026).toLocaleString("es-PE")}).`
        : undefined,
    grossMonthlySales: grossSales,
    netMonthlySales: netSales,
    igvSales,
    grossMonthlyPurchasesWithInvoice: grossPurchasesWithInvoice,
    netMonthlyPurchasesWithInvoice: netPurchasesWithInvoice,
    igvCreditFromPurchases: igvCredit,
    monthlyPurchasesWithoutInvoice: purchasesWithoutInvoice,
    monthlyOperatingExpenses: operatingExpenses,
    monthlyIgvPayable,
    monthlyIncomeTaxPayable: rmtMonthlyIncomeTax,
    totalMonthlyTaxEstimated: rmtTotalMonthly,
    estimatedAnnualNetIncome,
    estimatedAnnualIncomeTaxRegularization: rmtAnnualRegularization,
    totalAnnualTaxEstimated: Number(
      (rmtTotalMonthly * 12 + rmtAnnualRegularization).toFixed(2)
    ),
    calculationExplanation: [
      `IGV mensual estimado por pagar (Débito S/ ${igvSales.toFixed(2)} - Crédito S/ ${igvCredit.toFixed(2)}): S/ ${monthlyIgvPayable.toFixed(2)}.`,
      `Pago a cuenta mensual de Renta (${(rmtMonthlyRate * 100).toFixed(1)}% sobre ingresos netos S/ ${netSales.toFixed(2)}): S/ ${rmtMonthlyIncomeTax.toFixed(2)}.`,
      `Utilidad neta anual estimada (Ingresos netos menos compras con factura y gastos operativos sustentados): S/ ${estimatedAnnualNetIncome.toFixed(2)}.`,
      `Impuesto a la Renta Anual progresivo (10% hasta 15 UIT y 29.5% sobre el exceso): S/ ${rmtTotalAnnualIncomeTax.toFixed(2)} menos pagos a cuenta anuales (S/ ${rmtAnnualPaymentsOnAccount.toFixed(2)}) = Regularización estimada de S/ ${rmtAnnualRegularization.toFixed(2)}.`,
    ],
    legalNote:
      "Permite deducir gastos sustentados del restaurante (insumos con factura, planilla, alquiler, servicios) para calcular la Renta Anual.",
  };

  // 4. Régimen General (RG)
  const rgMonthlyIncomeTax = Number((netSales * 0.015).toFixed(2));
  const rgTotalMonthly = Number(
    (monthlyIgvPayable + rgMonthlyIncomeTax).toFixed(2)
  );
  const rgTotalAnnualIncomeTax = Number(
    (estimatedAnnualNetIncome * 0.295).toFixed(2)
  );
  const rgAnnualPaymentsOnAccount = Number(
    (rgMonthlyIncomeTax * 12).toFixed(2)
  );
  const rgAnnualRegularization = Number(
    Math.max(0, rgTotalAnnualIncomeTax - rgAnnualPaymentsOnAccount).toFixed(2)
  );

  const rgDetail: RegimeSimulationDetail = {
    regime: "RG",
    regimeName: "Régimen General (RG)",
    canEstimate: hasEnoughSalesData,
    insufficientDataReason: !hasEnoughSalesData
      ? "Falta registrar ventas mensuales."
      : undefined,
    grossMonthlySales: grossSales,
    netMonthlySales: netSales,
    igvSales,
    grossMonthlyPurchasesWithInvoice: grossPurchasesWithInvoice,
    netMonthlyPurchasesWithInvoice: netPurchasesWithInvoice,
    igvCreditFromPurchases: igvCredit,
    monthlyPurchasesWithoutInvoice: purchasesWithoutInvoice,
    monthlyOperatingExpenses: operatingExpenses,
    monthlyIgvPayable,
    monthlyIncomeTaxPayable: rgMonthlyIncomeTax,
    totalMonthlyTaxEstimated: rgTotalMonthly,
    estimatedAnnualNetIncome,
    estimatedAnnualIncomeTaxRegularization: rgAnnualRegularization,
    totalAnnualTaxEstimated: Number(
      (rgTotalMonthly * 12 + rgAnnualRegularization).toFixed(2)
    ),
    calculationExplanation: [
      `IGV mensual estimado por pagar: S/ ${monthlyIgvPayable.toFixed(2)}.`,
      `Pago a cuenta mensual referencial de Renta (1.5% sobre ingresos netos S/ ${netSales.toFixed(2)} o coeficiente): S/ ${rgMonthlyIncomeTax.toFixed(2)}.`,
      `Impuesto a la Renta Anual (29.5% sobre utilidad neta anual estimada S/ ${estimatedAnnualNetIncome.toFixed(2)}): S/ ${rgTotalAnnualIncomeTax.toFixed(2)} menos pagos a cuenta (S/ ${rgAnnualPaymentsOnAccount.toFixed(2)}) = Regularización estimada de S/ ${rgAnnualRegularization.toFixed(2)}.`,
    ],
    legalNote:
      "Sin límite de ingresos, compras, activos ni locales. Exige contabilidad según nivel de ingresos en UIT.",
  };

  return {
    uitReference: UIT_2026,
    uitYear: 2026,
    igvRateApplied: igvRate,
    inputsUsed: {
      grossMonthlySales: grossSales,
      grossMonthlyPurchasesWithInvoice: grossPurchasesWithInvoice,
      monthlyPurchasesWithoutInvoice: purchasesWithoutInvoice,
      monthlyOperatingExpenses: operatingExpenses,
    },
    assumptions: [
      `Las ventas brutas e insumos con factura registrados se desagregan considerando una tasa de IGV de ${(igvRate * 100).toFixed(0)}%.`,
      "Solo las compras con factura electrónica o física autorizada que cumplen requisitos sustanciales y formales otorgan crédito fiscal de IGV.",
      `Las compras sin factura (boletas de venta o mercados sin comprobante: S/ ${purchasesWithoutInvoice.toFixed(2)}/mes) NO generan crédito fiscal de IGV.`,
      `Valor referencial de la UIT considerado para tramos (15 UIT, 300 UIT y 1,700 UIT): S/ ${UIT_2026.toLocaleString("es-PE")}.`,
      "En RMT y RG, la regularización anual se estima restando a los ingresos netos las compras con factura (sin IGV) y los gastos operativos sustentados declarados por el restaurante.",
    ],
    disclaimer:
      "IMPORTANTE: Estos cálculos son estimaciones orientativas basadas en los datos declarados por el restaurante y no constituyen una liquidación tributaria definitiva ante SUNAT. El régimen con menor pago mensual estimado no es necesariamente el mejor ni el legalmente aplicable; la elección depende primero del cumplimiento estricto de los requisitos legales, el tipo de comprobantes requeridos por sus clientes y la estructura de costos del restaurante.",
    regimes: {
      NRUS: nrusDetail,
      RER: rerDetail,
      RMT: rmtDetail,
      RG: rgDetail,
    },
  };
}

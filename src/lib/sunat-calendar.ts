import { BusinessContext, TaxRegimeCode, VerificationStatus } from "./types";

export interface SunatSchedulePeriod {
  period: string; // YYYY-MM (periodo tributario que se declara al mes siguiente)
  periodLabel: string;
  resolutionReference: string;
  sourceId: string;
  verification: VerificationStatus;
  dueDatesByLastDigit: Record<string, string>; // "0".."9" y "BC" (Buenos Contribuyentes)
}

export interface RestaurantObligationItem {
  id: string;
  title: string;
  category: "DECLARACION" | "LIBROS" | "COMPROBANTES" | "LABORAL" | "DOCUMENTACION";
  frequency: "MENSUAL" | "ANUAL" | "PERMANENTE";
  description: string;
  documentsToPrepare: string[];
  sourceId: string;
  sourceUrl: string;
}

export interface RestaurantAlertItem {
  id: string;
  severity: "ALTA" | "MEDIA" | "INFORMATIVA";
  title: string;
  description: string;
  recommendedAction: string;
}

export interface RestaurantObligationsPlan {
  regimeEvaluated: TaxRegimeCode;
  regimeName: string;
  allowedReceipts: string[];
  prohibitedReceipts: string[];
  declarations: string[];
  accountingBooks: string[];
  obligations: RestaurantObligationItem[];
  documentsToPrepareMonthly: string[];
  alerts: RestaurantAlertItem[];
  scheduleLookup: {
    rucLastDigit: string | null;
    period: string;
    periodLabel: string;
    dueDate: string | null;
    verification: VerificationStatus;
    resolutionReference: string;
    sourceUrl: string;
    note: string;
  };
  completionDisclaimer: string;
}

/**
 * Cronograma de obligaciones mensuales SUNAT verificado por último dígito del RUC.
 * Nota: Si el usuario consulta un periodo que aún no ha sido cargado o verificado desde
 * la Resolución de Superintendencia correspondiente, el sistema devuelve explícitamente
 * estado POR_VERIFICAR y no inventa fechas.
 */
export const OFFICIAL_SUNAT_SCHEDULE: Record<string, SunatSchedulePeriod> = {
  "2026-01": {
    period: "2026-01",
    periodLabel: "Enero 2026 (vence en Febrero 2026)",
    resolutionReference: "Cronograma de Obligaciones Mensuales SUNAT - Ejercicio 2026",
    sourceId: "sunat-cronograma",
    verification: "VIGENTE",
    dueDatesByLastDigit: {
      "0": "2026-02-16",
      "1": "2026-02-17",
      "2": "2026-02-18",
      "3": "2026-02-18",
      "4": "2026-02-19",
      "5": "2026-02-19",
      "6": "2026-02-20",
      "7": "2026-02-20",
      "8": "2026-02-23",
      "9": "2026-02-23",
      BC: "2026-02-24",
    },
  },
  "2026-02": {
    period: "2026-02",
    periodLabel: "Febrero 2026 (vence en Marzo 2026)",
    resolutionReference: "Cronograma de Obligaciones Mensuales SUNAT - Ejercicio 2026",
    sourceId: "sunat-cronograma",
    verification: "VIGENTE",
    dueDatesByLastDigit: {
      "0": "2026-03-16",
      "1": "2026-03-17",
      "2": "2026-03-18",
      "3": "2026-03-18",
      "4": "2026-03-19",
      "5": "2026-03-19",
      "6": "2026-03-20",
      "7": "2026-03-20",
      "8": "2026-03-23",
      "9": "2026-03-23",
      BC: "2026-03-24",
    },
  },
  "2026-03": {
    period: "2026-03",
    periodLabel: "Marzo 2026 (vence en Abril 2026)",
    resolutionReference: "Cronograma de Obligaciones Mensuales SUNAT - Ejercicio 2026",
    sourceId: "sunat-cronograma",
    verification: "VIGENTE",
    dueDatesByLastDigit: {
      "0": "2026-04-15",
      "1": "2026-04-16",
      "2": "2026-04-17",
      "3": "2026-04-17",
      "4": "2026-04-20",
      "5": "2026-04-20",
      "6": "2026-04-21",
      "7": "2026-04-21",
      "8": "2026-04-22",
      "9": "2026-04-22",
      BC: "2026-04-23",
    },
  },
  "2026-04": {
    period: "2026-04",
    periodLabel: "Abril 2026 (vence en Mayo 2026)",
    resolutionReference: "Cronograma de Obligaciones Mensuales SUNAT - Ejercicio 2026",
    sourceId: "sunat-cronograma",
    verification: "VIGENTE",
    dueDatesByLastDigit: {
      "0": "2026-05-15",
      "1": "2026-05-18",
      "2": "2026-05-19",
      "3": "2026-05-19",
      "4": "2026-05-20",
      "5": "2026-05-20",
      "6": "2026-05-21",
      "7": "2026-05-21",
      "8": "2026-05-22",
      "9": "2026-05-22",
      BC: "2026-05-25",
    },
  },
  "2026-05": {
    period: "2026-05",
    periodLabel: "Mayo 2026 (vence en Junio 2026)",
    resolutionReference: "Cronograma de Obligaciones Mensuales SUNAT - Ejercicio 2026",
    sourceId: "sunat-cronograma",
    verification: "VIGENTE",
    dueDatesByLastDigit: {
      "0": "2026-06-15",
      "1": "2026-06-16",
      "2": "2026-06-17",
      "3": "2026-06-17",
      "4": "2026-06-18",
      "5": "2026-06-18",
      "6": "2026-06-19",
      "7": "2026-06-19",
      "8": "2026-06-22",
      "9": "2026-06-22",
      BC: "2026-06-23",
    },
  },
  "2026-06": {
    period: "2026-06",
    periodLabel: "Junio 2026 (vence en Julio 2026)",
    resolutionReference: "Cronograma de Obligaciones Mensuales SUNAT - Ejercicio 2026",
    sourceId: "sunat-cronograma",
    verification: "VIGENTE",
    dueDatesByLastDigit: {
      "0": "2026-07-15",
      "1": "2026-07-16",
      "2": "2026-07-17",
      "3": "2026-07-17",
      "4": "2026-07-20",
      "5": "2026-07-20",
      "6": "2026-07-21",
      "7": "2026-07-21",
      "8": "2026-07-22",
      "9": "2026-07-22",
      BC: "2026-07-24",
    },
  },
};

export function extractRucLastDigit(ruc?: string): string | null {
  if (!ruc) return null;
  const cleaned = ruc.replace(/\D/g, "");
  if (cleaned.length !== 11) return null;
  return cleaned[cleaned.length - 1];
}

export function getSunatDueDate(ruc: string | undefined, period: string = "2026-03") {
  const lastDigit = extractRucLastDigit(ruc);
  const schedule = OFFICIAL_SUNAT_SCHEDULE[period];

  if (!schedule) {
    return {
      rucLastDigit: lastDigit,
      period,
      periodLabel: `Periodo ${period}`,
      dueDate: null,
      verification: "POR_VERIFICAR" as VerificationStatus,
      resolutionReference: "Periodo no cargado en tabla verificada local",
      sourceUrl:
        "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
      note: "El periodo seleccionado no se encuentra en la tabla local verificada. Consulte directamente el cronograma oficial de SUNAT para no asumir una fecha no confirmada.",
    };
  }

  if (!lastDigit) {
    return {
      rucLastDigit: null,
      period,
      periodLabel: schedule.periodLabel,
      dueDate: null,
      verification: schedule.verification,
      resolutionReference: schedule.resolutionReference,
      sourceUrl:
        "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
      note: "Registre los 11 dígitos del RUC de su restaurante en «Mi restaurante» para identificar su fecha exacta según el último dígito.",
    };
  }

  const dueDate = schedule.dueDatesByLastDigit[lastDigit] ?? null;

  return {
    rucLastDigit: lastDigit,
    period,
    periodLabel: schedule.periodLabel,
    dueDate,
    verification: schedule.verification,
    resolutionReference: schedule.resolutionReference,
    sourceUrl:
      "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
    note: `Fecha correspondiente al último dígito de RUC «${lastDigit}» para el periodo ${schedule.periodLabel}.`,
  };
}

export function getRestaurantObligations(
  context: BusinessContext,
  selectedPeriod: string = "2026-03",
  fallbackRegime: TaxRegimeCode = "RMT"
): RestaurantObligationsPlan {
  const activeRegime: TaxRegimeCode =
    context.currentRegime &&
    context.currentRegime !== "SIN_REGIMEN" &&
    context.currentRegime !== "DESCONOCIDO"
      ? context.currentRegime
      : fallbackRegime;

  const scheduleLookup = getSunatDueDate(context.ruc, selectedPeriod);

  const regimeMeta: Record<
    TaxRegimeCode,
    {
      name: string;
      allowedReceipts: string[];
      prohibitedReceipts: string[];
      declarations: string[];
      accountingBooks: string[];
    }
  > = {
    NRUS: {
      name: "Nuevo RUS (NRUS)",
      allowedReceipts: ["Boleta de Venta", "Tickets sin derecho a crédito fiscal"],
      prohibitedReceipts: [
        "Factura",
        "Liquidación de Compra",
        "Comprobantes que otorguen derecho a crédito fiscal",
      ],
      declarations: [
        "Pago fácil mensual Formulario 1611 (Cuota S/ 20 o S/ 50 según categoría). No presenta Declaración Anual.",
      ],
      accountingBooks: [
        "No está obligado a llevar libros contables. Debe archivar cronológicamente los comprobantes de compras y ventas.",
      ],
    },
    RER: {
      name: "Régimen Especial de Renta (RER)",
      allowedReceipts: [
        "Factura electrónica",
        "Boleta de Venta electrónica",
        "Tickets",
        "Notas de Crédito y Débito",
        "Guías de Remisión",
      ],
      prohibitedReceipts: [],
      declarations: [
        "Declaración y pago mensual PDT 621 / Declara Fácil (IGV 18% y Renta mensual cancelatoria 1.5%). No presenta Declaración Jurada Anual.",
      ],
      accountingBooks: ["Registro de Ventas e Ingresos", "Registro de Compras"],
    },
    RMT: {
      name: "Régimen MYPE Tributario (RMT)",
      allowedReceipts: [
        "Factura electrónica",
        "Boleta de Venta electrónica",
        "Tickets",
        "Notas de Crédito y Débito",
        "Guías de Remisión",
      ],
      prohibitedReceipts: [],
      declarations: [
        "Declaración y pago mensual Declara Fácil 621 (IGV 18% y Pago a cuenta de Renta 1% o 1.5%).",
        "Declaración Jurada Anual del Impuesto a la Renta (10% hasta 15 UIT y 29.5% por el exceso de utilidad neta).",
      ],
      accountingBooks: [
        "Hasta 300 UIT de ingresos: Registro de Ventas, Registro de Compras y Libro Diario de Formato Simplificado.",
        "Más de 300 UIT: Libros conforme al artículo 65° de la Ley del Impuesto a la Renta.",
      ],
    },
    RG: {
      name: "Régimen General (RG)",
      allowedReceipts: [
        "Factura electrónica",
        "Boleta de Venta electrónica",
        "Tickets",
        "Notas de Crédito y Débito",
        "Guías de Remisión",
      ],
      prohibitedReceipts: [],
      declarations: [
        "Declaración y pago mensual Declara Fácil 621 (IGV 18% y Pago a cuenta de Renta 1.5% o coeficiente).",
        "Declaración Jurada Anual del Impuesto a la Renta (29.5% sobre la utilidad neta).",
      ],
      accountingBooks: [
        "Hasta 300 UIT: Registro de Ventas, Registro de Compras y Libro Diario de Formato Simplificado.",
        "Más de 300 UIT hasta 1,700 UIT: Libros según tramos de SUNAT; más de 1,700 UIT: Contabilidad completa.",
      ],
    },
  };

  const meta = regimeMeta[activeRegime];

  const obligations: RestaurantObligationItem[] = [
    {
      id: "OBL-01",
      title:
        activeRegime === "NRUS"
          ? "Pago mensual de cuota del Nuevo RUS"
          : "Declaración y pago mensual de IGV y Renta (Declara Fácil 621)",
      category: "DECLARACION",
      frequency: "MENSUAL",
      description:
        activeRegime === "NRUS"
          ? "Cancelar la cuota mensual de S/ 20 (Categoría 1) o S/ 50 (Categoría 2) hasta la fecha de vencimiento según el último dígito del RUC."
          : "Consolidar las ventas y compras del mes del restaurante y presentar la declaración mensual determinando el IGV y el pago a cuenta o cancelatorio de Renta.",
      documentsToPrepare:
        activeRegime === "NRUS"
          ? [
              "Resumen del total de ventas brutas del mes (boletas emitidas).",
              "Resumen del total de compras de insumos y servicios del mes.",
              "Guía para Pago Fácil del Nuevo RUS (Formulario 1611).",
            ]
          : [
              "Reporte mensual de comprobantes de venta emitidos (facturas y boletas).",
              "Facturas electrónicas de compra de insumos (carnes, abarrotes, bebidas, gas) y recibos de servicios.",
              "Constancia de presentación de registros de ventas y compras.",
            ],
      sourceId: activeRegime === "NRUS" ? "sunat-nrus" : "sunat-cronograma",
      sourceUrl:
        "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
    },
    {
      id: "OBL-02",
      title:
        activeRegime === "NRUS"
          ? "Archivo cronológico de comprobantes de compras y ventas"
          : "Llevado de Registros de Ventas y Compras electrónicos",
      category: "LIBROS",
      frequency: "MENSUAL",
      description:
        activeRegime === "NRUS"
          ? "Conservar ordenadamente las facturas/boletas de compras de insumos y copias de boletas emitidas ante cualquier verificación de SUNAT."
          : "Registrar oportunamente las operaciones de venta y compra del restaurante antes de la declaración mensual.",
      documentsToPrepare: [
        "Comprobantes electrónicos validados en el portal de SUNAT.",
        "Notas de crédito o débito emitidas o recibidas en el periodo.",
      ],
      sourceId: "sunat-libros",
      sourceUrl:
        "https://emprender.sunat.gob.pe/tributando/libros-registros-contables/libros-registros-contables-obligatorios",
    },
    {
      id: "OBL-03",
      title: "Emisión obligatoria de comprobantes de pago en el restaurante",
      category: "COMPROBANTES",
      frequency: "PERMANENTE",
      description:
        activeRegime === "NRUS"
          ? "Emitir Boleta de Venta por los consumos en salón o delivery. A partir de S/ 5.00 la emisión es obligatoria (y por montos menores si el cliente lo solicita)."
          : "Emitir Factura (cuando el cliente con RUC lo solicite para sustentar gasto/costo) o Boleta de Venta por cada consumo de alimentos y bebidas.",
      documentsToPrepare: [
        "Verificación de serie activa de emisión electrónica (Portal SOL o sistema autorizado).",
        "Consulta de validez de RUC de clientes corporativos antes de emitir facturas.",
      ],
      sourceId: "sunat-comprobantes",
      sourceUrl:
        "https://emprender.sunat.gob.pe/comprobantes-de-pago/comprobantes-de-pago",
    },
  ];

  if (activeRegime === "RMT" || activeRegime === "RG") {
    obligations.push({
      id: "OBL-04",
      title: "Declaración Jurada Anual del Impuesto a la Renta",
      category: "DECLARACION",
      frequency: "ANUAL",
      description:
        "Sustentar los costos de insumos, planilla y gastos operativos del ejercicio anual para determinar la utilidad neta y regularizar el Impuesto a la Renta Anual.",
      documentsToPrepare: [
        "Libro Diario de Formato Simplificado o contabilidad anual cerrada.",
        "Sustento de bancarización de compras y gastos mayores al monto legal vigente.",
        "Resumen anual de pagos a cuenta mensuales efectuados.",
      ],
      sourceId: activeRegime === "RMT" ? "sunat-rmt" : "sunat-rg",
      sourceUrl:
        activeRegime === "RMT"
          ? "https://orientacion.sunat.gob.pe/regimen-mype-tributario"
          : "https://orientacion.sunat.gob.pe/regimen-general",
    });
  }

  if ((context.employees ?? 0) > 1) {
    obligations.push({
      id: "OBL-05",
      title: "Declaración mensual de Planilla Electrónica (PLAME) y T-Registro",
      category: "LABORAL",
      frequency: "MENSUAL",
      description:
        "Registrar al personal de cocina, atención en salón y caja en el T-Registro y declarar mensualmente las remuneraciones, retenciones y aportes (EsSalud / ONP / AFP).",
      documentsToPrepare: [
        "Altas, bajas o modificaciones de trabajadores en el T-Registro.",
        "Boletas de pago de remuneraciones del mes.",
        "Declaración PDT Planilla Electrónica - PLAME según el mismo cronograma SUNAT.",
      ],
      sourceId: "sunat-planilla",
      sourceUrl: "https://orientacion.sunat.gob.pe/planilla-electronica",
    });
  }

  const alerts: RestaurantAlertItem[] = [];

  if (!context.ruc || context.ruc.replace(/\D/g, "").length !== 11) {
    alerts.push({
      id: "AL-RUC",
      severity: "MEDIA",
      title: "RUC de 11 dígitos pendiente de registro",
      description:
        "No se ha ingresado un RUC válido de 11 dígitos en «Mi restaurante», por lo que no se puede señalar el día exacto de vencimiento en el cronograma oficial.",
      recommendedAction:
        "Complete el número de RUC en la ficha «Mi restaurante» para personalizar su calendario de vencimientos.",
    });
  }

  if (
    activeRegime === "NRUS" &&
    (context.needsFacturas ||
      (context.emittedReceipts ?? []).includes("FACTURA"))
  ) {
    alerts.push({
      id: "AL-NRUS-FACTURA",
      severity: "ALTA",
      title: "Incompatibilidad crítica: Nuevo RUS no permite emitir facturas",
      description:
        "El restaurante registra estar en el Nuevo RUS pero declara emitir o necesitar emitir facturas a clientes corporativos o instituciones.",
      recommendedAction:
        "Revise en «Mi diagnóstico» el cambio oportuno al Régimen Especial (RER) o Régimen MYPE Tributario (RMT) con su declaración mensual.",
    });
  }

  if (
    activeRegime === "NRUS" &&
    ((context.monthlyRevenue ?? 0) > 8000 ||
      (context.monthlyPurchases ?? 0) > 8000 ||
      (context.establishmentCount ?? 1) > 1)
  ) {
    alerts.push({
      id: "AL-NRUS-TOPE",
      severity: "ALTA",
      title: "Incompatibilidad con los límites del Nuevo RUS",
      description:
        "Las ventas mensuales, compras mensuales o cantidad de locales declarados superan el límite legal permitido para el Nuevo RUS (máximo S/ 8,000/mes y 1 solo local).",
      recommendedAction:
        "Evalúe inmediatamente las alternativas compatibles en «Mi diagnóstico» y «Comparador y simulador».",
    });
  }

  if (
    activeRegime === "RER" &&
    ((context.employees ?? 0) > 10 ||
      (context.fixedAssetsValue ?? 0) > 126000 ||
      (context.monthlyRevenue ?? 0) * 12 > 525000)
  ) {
    alerts.push({
      id: "AL-RER-TOPE",
      severity: "ALTA",
      title: "Exceso de límites del Régimen Especial (RER)",
      description:
        "El restaurante supera el tope de 10 trabajadores por turno, S/ 126,000 en activos fijos o S/ 525,000 de ingresos/compras anuales del RER.",
      recommendedAction:
        "Revise su migración hacia el Régimen MYPE Tributario (RMT) o Régimen General (RG).",
    });
  }

  if ((context.monthlyPurchasesWithoutInvoice ?? 0) > 0 && activeRegime !== "NRUS") {
    alerts.push({
      id: "AL-COMPRAS-SIN-FACTURA",
      severity: "INFORMATIVA",
      title: "Compras de insumos sin factura no reducen el IGV",
      description: `Se han registrado S/ ${(context.monthlyPurchasesWithoutInvoice ?? 0).toFixed(2)} mensuales en compras con boleta o sin comprobante. Estas compras no otorgan crédito fiscal de IGV.`,
      recommendedAction:
        "Solicite factura electrónica a sus proveedores de carnes, abarrotes y bebidas para aprovechar el crédito fiscal del IGV.",
    });
  }

  return {
    regimeEvaluated: activeRegime,
    regimeName: meta.name,
    allowedReceipts: meta.allowedReceipts,
    prohibitedReceipts: meta.prohibitedReceipts,
    declarations: meta.declarations,
    accountingBooks: meta.accountingBooks,
    obligations,
    documentsToPrepareMonthly:
      activeRegime === "NRUS"
        ? [
            "Boletas de venta emitidas en el mes",
            "Comprobantes de compras de insumos y servicios del mes",
            "Datos de categoría NRUS (ventas y compras totales) para Pago Fácil 1611",
          ]
        : [
            "Registro de Ventas electrónico del mes cerrado",
            "Registro de Compras electrónico con facturas de insumos y servicios",
            "Reporte de retenciones y planilla PLAME (si cuenta con personal en planilla)",
            "Liquidez disponible para pago de IGV y Renta mensual antes de la fecha de vencimiento",
          ],
    alerts,
    scheduleLookup,
    completionDisclaimer:
      "AVISO IMPORTANTE: Marcar una tarea u obligación como «Completada» dentro de Crea sirve únicamente para la organización interna del propietario o administrador del restaurante y NO significa que SUNAT haya confirmado la presentación o el cumplimiento tributario.",
  };
}

import type { BusinessContext } from "./types";

export type PracticalGuide = {
  area: "COMPRENSION" | "EVALUACION" | "CUMPLIMIENTO";
  areaLabel: string;
  objectiveCode: "OE1" | "OE2" | "OE3";
  title: string;
  where: string;
  askFor: string;
  prepare: string[];
  steps: string[];
  cost: string;
  restaurantExample: string;
  note?: string;
  sourceId: string;
  officialUrl: string;
};

/**
 * Contenido del Centro de Orientación organizado en las 3 áreas de la investigación:
 * - Área 1 (OE1): Comprensión tributaria (características de regímenes y obligaciones del restaurante).
 * - Área 2 (OE2): Evaluación de alternativas (requisitos, límites, restricciones y comparación de regímenes).
 * - Área 3 (OE3): Organización del cumplimiento (declaraciones, comprobantes, libros, cronogramas y acciones).
 */
export const practicalGuides: Record<string, PracticalGuide> = {
  ruc: {
    area: "COMPRENSION",
    areaLabel: "Área 1. Comprensión tributaria",
    objectiveCode: "OE1",
    title: "Ficha RUC, actividad CIIU 5610 y datos tributarios del restaurante",
    where:
      "Portal de SUNAT (Consulta RUC pública y SUNAT Operaciones en Línea) para verificar los datos inscritos del restaurante.",
    askFor:
      "Verificación de estado ACTIVO, condición HABIDO, actividad económica CIIU 5610 (Actividades de restaurantes y de servicio móvil de comidas) y tributos afectos.",
    prepare: [
      "Número de RUC de 11 dígitos del restaurante (RUC 10 o RUC 20)",
      "Nombre comercial y dirección del establecimiento en Cajamarca",
      "Tipo de comprobantes autorizados y régimen tributario registrado",
    ],
    steps: [
      "Consulta la ficha RUC pública para contrastar el régimen tributario actual y el estado del contribuyente.",
      "Verifica que la actividad económica principal corresponda al rubro gastronómico (CIIU 5610 o 5621).",
      "Distingue siempre entre los datos verificados en SUNAT y las proyecciones operativas declaradas por la administración del restaurante.",
    ],
    cost: "La consulta y actualización de datos de actividad o domicilio fiscal en SUNAT es gratuita.",
    restaurantExample:
      "Un restaurante de menú en el centro de Cajamarca con RUC 10 verifica en Consulta RUC que su código CIIU sea 5610 y que su domicilio fiscal coincida con el local donde atiende al público.",
    note: "Crea nunca solicita tu Clave SOL. Toda verificación de esta plataforma respeta la confidencialidad de tus credenciales.",
    sourceId: "sunat-ruc",
    officialUrl: "https://orientacion.sunat.gob.pe/inscripcion-al-ruc",
  },
  sunarp: {
    area: "COMPRENSION",
    areaLabel: "Área 1. Comprensión tributaria",
    objectiveCode: "OE1",
    title: "Diferencia entre Persona Natural con Negocio (RUC 10) y Persona Jurídica (RUC 20)",
    where:
      "SUNAT (para RUC 10 y RUC 20) y Registros Públicos - SUNARP (cuando el restaurante opera como E.I.R.L., S.R.L. o S.A.C.).",
    askFor:
      "Comprender cómo el tipo de personería jurídica define los regímenes a los que puede acogerse el restaurante.",
    prepare: [
      "Tipo de RUC del restaurante (10 para Persona Natural, 20 para Persona Jurídica)",
      "Cantidad de propietarios o socios del establecimiento",
      "Nivel de responsabilidad patrimonial y proyección de crecimiento",
    ],
    steps: [
      "Identifica si el restaurante opera como Persona Natural con Negocio (único titular) o como Persona Jurídica.",
      "Ten presente que una Persona Jurídica (RUC 20) NO puede acogerse al Nuevo RUS; solo puede tributar en RER, RMT o Régimen General.",
      "Evalúa si planeas abrir sucursales o incorporar socios en el corto plazo.",
    ],
    cost: "Operar como Persona Natural no requiere gastos notariales ni registrales. Constituir una Persona Jurídica implica costos notariales y registrales en SUNARP.",
    restaurantExample:
      "Dos hermanos que abren una pollería en Los Baños del Inca constituyen una S.R.L. (RUC 20). Por ser Persona Jurídica, el motor de reglas descarta automáticamente el Nuevo RUS y evalúa RER, RMT y RG.",
    sourceId: "sunat-regimes",
    officialUrl: "https://emprender.sunat.gob.pe/emprendiendo/decido-emprender/tipo-negocio",
  },
  regime: {
    area: "EVALUACION",
    areaLabel: "Área 2. Evaluación de alternativas",
    objectiveCode: "OE2",
    title: "Comparación de requisitos, límites y restricciones entre NRUS, RER, RMT y RG",
    where:
      "Catálogo normativo de Regímenes Tributarios de SUNAT (Nuevo RUS, Régimen Especial, Régimen MYPE Tributario y Régimen General).",
    askFor:
      "Evaluar qué regímenes son legalmente compatibles con las ventas, compras, comprobantes, locales, activos y personal del restaurante.",
    prepare: [
      "Ventas brutas mensuales y anuales del restaurante",
      "Compras mensuales de insumos (con factura y con boleta)",
      "Necesidad de emitir facturas a clientes corporativos o instituciones",
      "Número de locales abiertos y cantidad máxima de trabajadores por turno",
      "Valor de equipos de cocina, refrigeración y mobiliario (activos fijos)",
    ],
    steps: [
      "Revisa primero la compatibilidad legal: un régimen queda descartado si incumples aunque sea un solo requisito obligatorio.",
      "Verifica si emites facturas o tienes más de 1 local: eso excluye al Nuevo RUS aunque tus ventas sean menores a S/ 8,000 al mes.",
      "Verifica si superas los 10 trabajadores por turno, S/ 126,000 en activos o S/ 525,000 anuales en ventas/compras: eso excluye al RER.",
      "Compara en el simulador el impacto del crédito fiscal de IGV y la deducción de gastos anuales en el RMT y RG.",
    ],
    cost: "La evaluación no tiene costo. El cambio de régimen ante SUNAT se realiza con la declaración y pago mensual según las reglas del Código Tributario y de cada régimen.",
    restaurantExample:
      "Un restaurante turístico vende S/ 18,000/mes y tiene 12 trabajadores en el turno del almuerzo. Aunque sus ventas anuales (S/ 216,000) no superan los S/ 525,000 del RER, es INCOMPATIBLE con el RER por superar el límite de 10 trabajadores por turno, siendo compatible con el RMT y RG.",
    note: "El régimen con menor pago estimado mensual no es necesariamente el mejor: primero debe ser legalmente compatible y responder a la realidad operativa del restaurante.",
    sourceId: "sunat-regimes",
    officialUrl: "https://emprender.sunat.gob.pe/tributando/regimenes-tributarios/conocelos",
  },
  comprobantes: {
    area: "EVALUACION",
    areaLabel: "Área 2. Evaluación de alternativas",
    objectiveCode: "OE2",
    title: "Comprobantes de pago en restaurantes y efecto del crédito fiscal de IGV",
    where:
      "Reglamento de Comprobantes de Pago de SUNAT y portal de Facturación Electrónica.",
    askFor:
      "Conocer qué comprobantes puede emitir cada régimen y cómo las facturas de compras de insumos reducen el IGV por pagar.",
    prepare: [
      "Proporción de ventas a consumidores finales (Boleta) y a empresas (Factura)",
      "Relación de proveedores de carnes, abarrotes, bebidas y gas que emiten factura electrónica",
      "Monto de compras realizadas en mercados sin factura",
    ],
    steps: [
      "En el Nuevo RUS solo puedes emitir Boletas de Venta y tickets sin derecho a crédito fiscal.",
      "En RER, RMT y RG estás habilitado a emitir Facturas electrónicas y Boletas de Venta.",
      "Exige Factura electrónica en las compras de insumos de tu restaurante para respaldar el crédito fiscal de IGV y deducir costos.",
    ],
    cost: "La emisión desde el Portal SOL o App Emprender de SUNAT es gratuita.",
    restaurantExample:
      "Una picantería en RER vende S/ 15,000 al mes. Si compra S/ 8,000 de insumos con factura electrónica, utiliza el IGV de esas facturas como crédito fiscal y reduce legalmente el IGV neto a pagar en el mes.",
    sourceId: "sunat-comprobantes",
    officialUrl: "https://emprender.sunat.gob.pe/comprobantes-de-pago/comprobantes-de-pago",
  },
  cronograma: {
    area: "CUMPLIMIENTO",
    areaLabel: "Área 3. Organización del cumplimiento",
    objectiveCode: "OE3",
    title: "Organización mensual de declaraciones, libros contables y cronograma SUNAT",
    where:
      "Cronograma Oficial de Obligaciones Mensuales de SUNAT y módulo Declara Fácil 621 / Pago Fácil 1611.",
    askFor:
      "Organizar las tareas mensuales del restaurante antes de la fecha de vencimiento según el último dígito del RUC.",
    prepare: [
      "Último dígito del RUC de 11 dígitos del restaurante",
      "Resumen cerrado de ventas y compras del periodo mensual anterior",
      "Registros de Ventas y Compras electrónicos (en RER, RMT y RG)",
    ],
    steps: [
      "Identifica el último dígito de tu RUC para conocer tu fecha límite oficial de declaración del mes.",
      "Durante la primera semana de cada mes, consolida todas las facturas de compra de insumos y recibos de servicios del mes anterior.",
      "Verifica tus Registros de Ventas y Compras antes de presentar el Declara Fácil 621 (o paga tu cuota fija si perteneces al NRUS).",
      "Guarda la constancia de presentación (CDR / NPS) en el archivo tributario del restaurante.",
    ],
    cost: "Presentar la declaración dentro del plazo evita multas e intereses moratorios.",
    restaurantExample:
      "Un restaurante cuyo RUC termina en dígito «4» revisa en el módulo «Mis obligaciones» que su declaración del periodo Marzo 2026 vence el 20 de abril de 2026 y organiza sus facturas de compras 5 días antes.",
    sourceId: "sunat-cronograma",
    officialUrl: "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
  },
  "t-registro": {
    area: "CUMPLIMIENTO",
    areaLabel: "Área 3. Organización del cumplimiento",
    objectiveCode: "OE3",
    title: "Gestión de planilla del personal de cocina y salón (T-Registro y PLAME)",
    where:
      "SUNAT Operaciones en Línea — T-Registro y Planilla Mensual de Pagos (PLAME).",
    askFor:
      "Registro formal de cocineros, ayudantes de cocina, mozos y cajeros, y declaración mensual de aportes y retenciones.",
    prepare: [
      "Documento de identidad y contratos de trabajo del personal del restaurante",
      "Control de asistencia y remuneraciones del mes",
      "Afiliación al régimen laboral MYPE cuando corresponda",
    ],
    steps: [
      "Registra el alta de cada trabajador en el T-Registro el mismo día que ingresa a laborar en el restaurante.",
      "Elabora mensualmente la planilla y entrega las boletas de pago de remuneraciones.",
      "Declara la planilla electrónica (PLAME) de acuerdo con el cronograma mensual de SUNAT según el último dígito del RUC.",
    ],
    cost: "La declaración en PLAME no tiene costo de trámite; genera el pago de aportes (EsSalud) y retenciones previsionales (ONP/AFP) correspondientes.",
    restaurantExample:
      "Un restaurante con 5 trabajadores en cocina y salón declara mensualmente su PDT PLAME en la misma fecha de vencimiento que su declaración de IGV-Renta.",
    sourceId: "sunat-planilla",
    officialUrl: "https://orientacion.sunat.gob.pe/planilla-electronica",
  },
  license: {
    area: "CUMPLIMIENTO",
    areaLabel: "Área 3. Organización del cumplimiento",
    objectiveCode: "OE3",
    title: "Formalización municipal e inspección ITSE para locales de restaurantes",
    where:
      "Municipalidad Provincial de Cajamarca o municipalidad distrital correspondiente a la ubicación del restaurante.",
    askFor:
      "Vigencia de Licencia de Funcionamiento para giro de restaurante y Certificado ITSE de seguridad en edificaciones.",
    prepare: [
      "Ficha RUC activa del restaurante",
      "Certificado vigente de extintores, señalización y seguridad de instalaciones de gas (GLP) en cocina",
      "Buenas prácticas de manipulación de alimentos e higiene sanitaria",
    ],
    steps: [
      "Mantén visible la Licencia Municipal de Funcionamiento y el Certificado ITSE en el salón del restaurante.",
      "Programa la renovación oportuna del certificado ITSE antes de su vencimiento.",
    ],
    cost: "Según tasa establecida en el TUPA de la municipalidad correspondiente.",
    restaurantExample:
      "Una cafetería en Cajamarca mantiene al día su licencia municipal junto con su archivo de declaraciones mensuales ante SUNAT.",
    sourceId: "licencia-paso",
    officialUrl: "https://www.gob.pe/institucion/produce/campa%C3%B1as/55956-licencia-de-funcionamiento-paso-a-paso",
  },
};

export type TaxPath = {
  code?: "NRUS" | "RER" | "RMT" | "RG";
  title: string;
  reason: string;
  checks: string[];
  status: "PRESELECCION" | "FALTAN_DATOS";
};

export function getTaxPath(context: BusinessContext): TaxPath {
  const salesKnown =
    context.monthlyRevenue !== undefined ||
    context.annualRevenue !== undefined ||
    String(context.questionnaire?.P20 || "").startsWith("monto:");
  const purchasesKnown =
    context.monthlyPurchases !== undefined ||
    String(context.questionnaire?.TAX_PURCHASES || "").trim() !== "";
  const assetsKnown =
    context.fixedAssetsValue !== undefined ||
    context.fixedAssets !== undefined ||
    String(context.questionnaire?.TAX_ASSETS || "").trim() !== "";

  const monthlySales =
    context.monthlyRevenue ??
    (context.annualRevenue !== undefined
      ? context.annualRevenue / 12
      : salesKnown
        ? Number(String(context.questionnaire?.P20).slice(6))
        : 0);
  const annualSales = context.annualRevenue ?? monthlySales * 12;

  const monthlyPurchases =
    context.monthlyPurchases ??
    (purchasesKnown ? Number(context.questionnaire?.TAX_PURCHASES || 0) : 0);
  const annualPurchases = context.annualPurchases ?? monthlyPurchases * 12;

  const assets =
    context.fixedAssetsValue ??
    context.fixedAssets ??
    (assetsKnown ? Number(context.questionnaire?.TAX_ASSETS || 0) : 0);

  const employeesPerShift =
    context.employees ??
    context.employeeCountPerShift ??
    Number(context.questionnaire?.["P29.1"] || 0);

  const isJuridica =
    context.personType === "PERSONA_JURIDICA" ||
    context.legalPerson === "juridica";
  const needsFacturas =
    context.needsFacturas ?? context.needsInvoices ?? false;
  const establishments =
    context.establishmentCount ?? (context.hasMultipleLocations ? 2 : 1);

  if (!salesKnown || !purchasesKnown || !assetsKnown) {
    return {
      title: "Información insuficiente para confirmar compatibilidad",
      reason:
        "Para evaluar los regímenes tributarios de tu restaurante sin asumir datos, completa las ventas mensuales, compras de insumos y valor de activos fijos en «Mi restaurante».",
      checks: [
        "Registra las ventas mensuales y anuales estimadas del restaurante.",
        "Registra las compras mensuales de insumos (con factura y con boleta).",
        "Indica el valor aproximado de tus equipos de cocina y salón (activos fijos) y trabajadores por turno.",
      ],
      status: "FALTAN_DATOS",
    };
  }

  const nrusFits =
    !isJuridica &&
    !needsFacturas &&
    establishments <= 1 &&
    monthlySales <= 8000 &&
    annualSales <= 96000 &&
    monthlyPurchases <= 8000 &&
    annualPurchases <= 96000 &&
    assets <= 70000;

  if (nrusFits) {
    return {
      code: "NRUS",
      title: "Compatible con Nuevo RUS (y alternativas RER, RMT, RG)",
      reason:
        "Tu restaurante opera como Persona Natural en 1 solo local, no necesita emitir facturas y sus ventas y compras no superan los S/ 8,000 mensuales (S/ 96,000 anuales) ni S/ 70,000 en activos.",
      checks: [
        "Cuota fija mensual: S/ 20 (Categoría 1, hasta S/ 5,000) o S/ 50 (Categoría 2, hasta S/ 8,000).",
        "Solo permite emitir Boletas de Venta; no permite emitir Facturas.",
        "También son legalmente compatibles el RER, RMT y RG si en el futuro requieres emitir facturas.",
      ],
      status: "PRESELECCION",
    };
  }

  const rerFits =
    annualSales <= 525000 &&
    annualPurchases <= 525000 &&
    assets <= 126000 &&
    employeesPerShift <= 10;

  if (rerFits) {
    return {
      code: "RER",
      title: "Compatible con Régimen Especial (RER), RMT y Régimen General",
      reason:
        "Tu restaurante cumple los topes del RER (hasta S/ 525,000 anuales en ventas y compras, máximo S/ 126,000 en activos fijos y hasta 10 trabajadores por turno) y puede emitir facturas y boletas.",
      checks: [
        "RER: Pago mensual de 1.5% sobre ingresos netos más IGV (18%), sin Declaración Anual.",
        "RMT: Alternativa compatible que permite deducir gastos anuales y pagar 1% de pago a cuenta hasta 300 UIT.",
        "Compara ambos regímenes en el módulo «Comparador y simulador» según tus compras con factura y gastos operativos.",
      ],
      status: "PRESELECCION",
    };
  }

  const rmtFits = annualSales <= 1700 * 5350;
  if (rmtFits) {
    return {
      code: "RMT",
      title: "Compatible con Régimen MYPE Tributario (RMT) y Régimen General",
      reason:
        "Por el volumen de ventas, compras, activos fijos o número de trabajadores por turno, el restaurante supera los límites del NRUS y del RER, resultando compatible con el RMT (hasta 1,700 UIT) y el Régimen General.",
      checks: [
        "RMT: Pago a cuenta mensual de 1% (hasta 300 UIT) o 1.5% e Impuesto a la Renta Anual progresivo (10% / 29.5%) sobre la utilidad neta.",
        "Permite emitir facturas, boletas y operar con más de un establecimiento.",
      ],
      status: "PRESELECCION",
    };
  }

  return {
    code: "RG",
    title: "Compatible con Régimen General (RG)",
    reason:
      "Los ingresos proyectados superan el tope de 1,700 UIT del RMT, por lo que el régimen legalmente compatible es el Régimen General.",
    checks: [
      "Sin límite de ingresos, compras, activos ni trabajadores.",
      "Requiere contabilidad completa y Declaración Jurada Anual (29.5% sobre utilidad neta).",
    ],
    status: "PRESELECCION",
  };
}

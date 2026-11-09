import type {
  BusinessActivity,
  BusinessCategory,
  CatalogData,
  Requirement,
  Rule,
  Source,
  TaxRuleDetail,
} from "./types";

export const CATALOG_VERSION = "2026.2-RESTAURANTES-CAJ";

const verifiedTaxSource = {
  reviewedAt: "2026-10-15",
  nextReviewAt: "2027-04-15",
  effectiveDate: "2026-01-01",
  reviewFrequencyDays: 180,
  status: "VIGENTE" as const,
  verification: "VIGENTE" as const,
  verifiedBy: "Revisión normativa SUNAT · Tesis Ing. Sistemas 2026",
  version: "2026.1",
};

export const sources: Source[] = [
  {
    id: "sunat-ruc",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Inscripción y actualización de datos en el RUC",
    url: "https://orientacion.sunat.gob.pe/actualizacion-o-modificacion-de-datos-del-ruc",
    legalBasis: "D. Leg. N.° 943 y R.S. N.° 210-2004/SUNAT",
    evidence:
      "Ficha RUC: actividad económica CIIU 5610, domicilio fiscal, estado Activo y condición Habido.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-regimes",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Regímenes tributarios aplicables a negocios y restaurantes",
    url: "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios",
    legalBasis:
      "D. Leg. N.° 937 (NRUS), TUO LIR Cap. XV (RER), D. Leg. N.° 1269 (RMT) y D.S. N.° 179-2004-EF (RG)",
    evidence:
      "Cuadro comparativo oficial de regímenes tributarios, topes en S/ y UIT.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-nrus",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Nuevo Régimen Único Simplificado (Nuevo RUS)",
    url: "https://orientacion.sunat.gob.pe/nuevo-regimen-unico-simplificado-nuevo-rus",
    legalBasis: "Decreto Legislativo N.° 937 y modificatorias (D. Leg. N.° 1270)",
    evidence:
      "Límite de ingresos/compras de S/ 8,000 mensual o S/ 96,000 anual, activos fijos hasta S/ 70,000, un solo local y solo persona natural.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-rer",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Régimen Especial del Impuesto a la Renta (RER)",
    url: "https://orientacion.sunat.gob.pe/regimen-especial-de-renta-rer",
    legalBasis: "TUO de la Ley del Impuesto a la Renta, Artículos 117° al 124°-A",
    evidence:
      "Límite anual de ingresos/compras de S/ 525,000, activos fijos hasta S/ 126,000 y máximo 10 trabajadores por turno.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-rmt",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Régimen MYPE Tributario (RMT)",
    url: "https://orientacion.sunat.gob.pe/regimen-mype-tributario",
    legalBasis: "Decreto Legislativo N.° 1269 y Reglamento D.S. N.° 403-2016-EF",
    evidence:
      "Ingresos netos anuales hasta 1,700 UIT; pagos a cuenta de 1% (hasta 300 UIT) o 1.5%/coeficiente; regularización anual de 10% (hasta 15 UIT) y 29.5%.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-rg",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Régimen General del Impuesto a la Renta",
    url: "https://orientacion.sunat.gob.pe/regimen-general",
    legalBasis: "TUO de la Ley del Impuesto a la Renta (D.S. N.° 179-2004-EF)",
    evidence:
      "Sin límite de ingresos ni compras; pago a cuenta mensual de 1.5% o coeficiente e Impuesto a la Renta anual de 29.5%.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-comprobantes",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Reglamento de Comprobantes de Pago y Emisión Electrónica",
    url: "https://orientacion.sunat.gob.pe/comprobantes-de-pago-empresas",
    legalBasis: "Resolución de Superintendencia N.° 007-99/SUNAT y normativa SEE",
    evidence:
      "Comprobantes autorizados según régimen tributario e identificación obligatoria del adquirente en boletas desde S/ 700.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-libros",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Libros y Registros Contables (SIRE - RVIE y RCE)",
    url: "https://orientacion.sunat.gob.pe/libros-y-registros-vinculados-asuntos-tributarios",
    legalBasis:
      "Resolución de Superintendencia N.° 234-2006/SUNAT y R.S. N.° 000112-2021/SUNAT (SIRE)",
    evidence:
      "Exigencia de Registro de Ventas e Ingresos y Registro de Compras según régimen y tramo de ingresos en UIT.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-cronograma",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Cronograma de Obligaciones Mensuales SUNAT",
    url: "https://orientacion.sunat.gob.pe/cronograma-de-obligaciones-mensuales",
    legalBasis:
      "Resolución de Superintendencia de cronogramas de vencimiento mensual según último dígito del RUC",
    evidence:
      "Fechas máximas de declaración y pago mensual de acuerdo con el último dígito del RUC y Buenos Contribuyentes.",
    ...verifiedTaxSource,
  },
  {
    id: "sunat-planilla",
    institution: "SUNAT",
    entity: "SUNAT",
    title: "Planilla Electrónica (T-Registro y PLAME)",
    url: "https://www.gob.pe/8071-planilla-electronica",
    legalBasis: "Decreto Supremo N.° 018-2007-TR",
    evidence:
      "Obligación de alta en T-Registro y declaración mensual PLAME para empleadores con trabajadores dependientes.",
    ...verifiedTaxSource,
  },
  {
    id: "licencia-paso",
    institution: "PRODUCE / Municipalidad",
    entity: "Municipalidad Provincial de Cajamarca",
    title: "Licencia de Funcionamiento e ITSE para Restaurantes",
    url: "https://www.gob.pe/institucion/produce/campa%C3%B1as/55956-licencia-de-funcionamiento-paso-a-paso",
    legalBasis: "TUO de la Ley N.° 28976 - Ley Marco de Licencia de Funcionamiento",
    evidence:
      "Licencia municipal de funcionamiento e inspección técnica de seguridad en edificaciones para establecimientos gastronómicos.",
    ...verifiedTaxSource,
  },
  {
    id: "sector-review",
    institution: "SUNAT / MEF",
    entity: "SUNAT / MEF",
    title: "Disposición tributaria especial en proceso de verificación",
    url: "https://www.gob.pe/sunat",
    legalBasis: "Normativa complementaria pendiente de revisión formal",
    reviewedAt: "2026-07-01",
    nextReviewAt: "2026-09-30",
    effectiveDate: "2026-01-01",
    reviewFrequencyDays: 60,
    status: "POR_VERIFICAR",
    verification: "POR_VERIFICAR",
    verifiedBy: "Pendiente de asignación",
    evidence:
      "No presentar como regla vigente ni confirmada hasta completar su revisión documental.",
    version: "2026.0-draft",
  },
];

export const categories: BusinessCategory[] = [
  {
    id: "restaurantes",
    name: "Restaurantes y servicios de comidas",
    icon: "🍽️",
    description:
      "Restaurantes, pollerías, cevicherías, picanterías, menús, cafeterías y servicios de alimentación formalizados en Cajamarca.",
  },
];

export const activities: BusinessActivity[] = [
  {
    id: "restaurante",
    sectorId: "restaurantes",
    name: "Restaurante / Pollería / Cevichería / Menú",
    ciiu: "5610",
  },
  {
    id: "picanteria",
    sectorId: "restaurantes",
    name: "Picantería / Comida típica cajamarquina",
    ciiu: "5610",
  },
  {
    id: "cafeteria",
    sectorId: "restaurantes",
    name: "Cafetería / Sanguchería / Juguería",
    ciiu: "5610",
  },
  {
    id: "catering",
    sectorId: "restaurantes",
    name: "Concesionario de alimentos / Atención por encargo",
    ciiu: "5621",
  },
];

const rawTaxRules = [
  {
    id: "TR-NRUS-01",
    regime: "NRUS" as const,
    name: "Exclusividad para Persona Natural (RUC 10)",
    conditionDescription:
      "Solo pueden acogerse personas naturales y sucesiones indivisas domiciliadas en el país; excluye personas jurídicas (E.I.R.L., S.A.C., S.R.L.).",
    legalBasis: "D. Leg. N.° 937, Art. 2° y Art. 3°",
    sourceId: "sunat-nrus",
  },
  {
    id: "TR-NRUS-02",
    regime: "NRUS" as const,
    name: "Límite de ingresos brutos (S/ 8,000 mensual / S/ 96,000 anual)",
    conditionDescription:
      "Los ingresos brutos del restaurante no deben superar S/ 8,000 mensuales ni S/ 96,000 en el ejercicio anual (Categoría 1: hasta S/ 5,000; Categoría 2: hasta S/ 8,000).",
    legalBasis: "D. Leg. N.° 937, Art. 3° y Art. 7° (modificado por D. Leg. N.° 1270)",
    sourceId: "sunat-nrus",
  },
  {
    id: "TR-NRUS-03",
    regime: "NRUS" as const,
    name: "Límite de adquisiciones y compras (S/ 8,000 mensual / S/ 96,000 anual)",
    conditionDescription:
      "Las compras mensuales de insumos, mercadería y servicios afectos a la actividad no deben superar S/ 8,000 al mes ni S/ 96,000 al año.",
    legalBasis: "D. Leg. N.° 937, Art. 3° y Art. 7°",
    sourceId: "sunat-nrus",
  },
  {
    id: "TR-NRUS-04",
    regime: "NRUS" as const,
    name: "Prohibición de emitir Facturas",
    conditionDescription:
      "Los sujetos del Nuevo RUS solo están autorizados a emitir boletas de venta y tickets sin derecho a crédito fiscal; no pueden emitir facturas comerciales.",
    legalBasis: "D. Leg. N.° 937, Art. 16°",
    sourceId: "sunat-comprobantes",
  },
  {
    id: "TR-NRUS-05",
    regime: "NRUS" as const,
    name: "Unidad de explotación única (1 solo establecimiento)",
    conditionDescription:
      "El restaurante debe realizar sus actividades en una sola unidad de explotación (un único local comercial).",
    legalBasis: "D. Leg. N.° 937, Art. 3° inc. b)",
    sourceId: "sunat-nrus",
  },
  {
    id: "TR-NRUS-06",
    regime: "NRUS" as const,
    name: "Límite de activos fijos (S/ 70,000)",
    conditionDescription:
      "El valor de los activos fijos afectados a la actividad (cocinas, hornos, congeladoras, mobiliario), sin contar predios ni vehículos, no debe superar S/ 70,000.",
    legalBasis: "D. Leg. N.° 937, Art. 3° inc. c)",
    sourceId: "sunat-nrus",
  },
  {
    id: "TR-RER-01",
    regime: "RER" as const,
    name: "Límite de ingresos netos anuales (S/ 525,000)",
    conditionDescription:
      "Los ingresos netos anuales del restaurante en el ejercicio no deben superar S/ 525,000.",
    legalBasis: "TUO de la Ley del Impuesto a la Renta, Art. 118° inc. a)",
    sourceId: "sunat-rer",
  },
  {
    id: "TR-RER-02",
    regime: "RER" as const,
    name: "Límite de adquisiciones anuales (S/ 525,000)",
    conditionDescription:
      "El monto acumulado de adquisiciones (compras de insumos y bienes) afectadas a la actividad no debe exceder S/ 525,000 en el ejercicio anual.",
    legalBasis: "TUO de la Ley del Impuesto a la Renta, Art. 118° inc. a)",
    sourceId: "sunat-rer",
  },
  {
    id: "TR-RER-03",
    regime: "RER" as const,
    name: "Límite de activos fijos (S/ 126,000)",
    conditionDescription:
      "El valor de los activos fijos afectados a la actividad del restaurante, con excepción de los predios y vehículos, no debe superar S/ 126,000.",
    legalBasis: "TUO de la Ley del Impuesto a la Renta, Art. 118° inc. a)",
    sourceId: "sunat-rer",
  },
  {
    id: "TR-RER-04",
    regime: "RER" as const,
    name: "Límite de personal por turno (máximo 10 personas)",
    conditionDescription:
      "El restaurante debe desarrollar sus actividades con personal afectado a la actividad que no supere las 10 personas por turno de trabajo.",
    legalBasis: "TUO de la Ley del Impuesto a la Renta, Art. 118° inc. a)",
    sourceId: "sunat-rer",
  },
  {
    id: "TR-RMT-01",
    regime: "RMT" as const,
    name: "Límite de ingresos netos anuales (1,700 UIT)",
    conditionDescription:
      "Los ingresos netos anuales del restaurante no deben superar las 1,700 UIT en el ejercicio gravable.",
    legalBasis: "D. Leg. N.° 1269, Art. 1° y Art. 3°",
    sourceId: "sunat-rmt",
  },
  {
    id: "TR-RMT-02",
    regime: "RMT" as const,
    name: "No vinculación económica superior a 1,700 UIT ni sucursal extranjera",
    conditionDescription:
      "No tener vinculación directa o indirecta en función del capital con personas cuyos ingresos conjuntos superen 1,700 UIT, ni ser sucursal de empresa extranjera.",
    legalBasis: "D. Leg. N.° 1269, Art. 3° inc. a) y b)",
    sourceId: "sunat-rmt",
  },
  {
    id: "TR-RG-01",
    regime: "RG" as const,
    name: "Sin tope de ingresos, compras, activos ni trabajadores",
    conditionDescription:
      "El Régimen General comprende a todo restaurante (Persona Natural o Jurídica) sin límite superior de ventas, compras, locales o personal.",
    legalBasis: "TUO de la Ley del Impuesto a la Renta (D.S. N.° 179-2004-EF)",
    sourceId: "sunat-rg",
  },
];

export const taxRules: TaxRuleDetail[] = rawTaxRules.map((item) => ({
  ...item,
  title: item.name,
  description: item.conditionDescription,
  version: "2026.1",
  effectiveFrom: "2026-01-01",
  effectiveDate: "2026-01-01",
  lastVerifiedAt: "2026-10-15",
  reviewedAt: "2026-10-15",
  nextReviewAt: "2027-04-15",
  verifiedBy: "Revisión normativa SUNAT",
}));

export const requirements: Requirement[] = [
  {
    id: "ficha-ruc",
    title: "Mantener actualizada la Ficha RUC del restaurante",
    category: "SUNAT · RUC",
    description:
      "Verificar que el RUC esté Activo, en condición Habido, con CIIU 5610 (Actividades de restaurantes) y con el número real de establecimientos anexos declarados.",
    documents: [
      "Constancia de Información Registrada (Ficha RUC)",
      "Comprobante de domicilio fiscal y locales anexos",
    ],
    institution: "SUNAT",
    sourceId: "sunat-ruc",
    applicableRegimes: ["NRUS", "RER", "RMT", "RG"],
  },
  {
    id: "comprobantes-pago",
    title: "Emitir comprobantes de pago autorizados según el régimen",
    category: "SUNAT · Comprobantes",
    description:
      "Emitir boletas de venta a consumidores finales (identificando con DNI cuando el importe sea igual o mayor a S/ 700) y facturas electrónicas solo si pertenece a RER, RMT o RG.",
    documents: [
      "Serie de Boletas de Venta Electrónicas",
      "Serie de Facturas Electrónicas (solo RER, RMT y RG)",
      "Notas de Crédito / Débito cuando corresponda",
    ],
    institution: "SUNAT",
    sourceId: "sunat-comprobantes",
    applicableRegimes: ["NRUS", "RER", "RMT", "RG"],
  },
  {
    id: "sustento-compras",
    title: "Exigir y archivar comprobantes de compras de insumos",
    category: "SUNAT · Compras y Gastos",
    description:
      "Solicitar factura electrónica (en RER, RMT y RG) o boleta/factura (en NRUS) por cada compra de carnes, abarrotes, bebidas, gas y servicios del restaurante.",
    documents: [
      "Facturas electrónicas de proveedores con RUC del restaurante",
      "Boletas de venta y recibos de servicios públicos",
      "Constancias de bancarización para operaciones desde S/ 2,000 o US$ 500",
    ],
    institution: "SUNAT",
    sourceId: "sunat-comprobantes",
    applicableRegimes: ["NRUS", "RER", "RMT", "RG"],
  },
  {
    id: "declaracion-mensual",
    title: "Declaración y pago mensual según cronograma SUNAT",
    category: "SUNAT · Declaraciones",
    description:
      "Cumplir mensualmente hasta la fecha de vencimiento según el último dígito del RUC: pago de cuota fija S/ 20 o S/ 50 (Formulario 1611 en NRUS) o presentación del Declara Fácil 621 IGV-Renta Mensual (en RER, RMT y RG).",
    documents: [
      "Resumen mensual de ventas gravadas",
      "Resumen mensual de compras con derecho a crédito fiscal",
      "Constancia de presentación y pago (Formulario 1611 o 621)",
    ],
    institution: "SUNAT",
    sourceId: "sunat-cronograma",
    applicableRegimes: ["NRUS", "RER", "RMT", "RG"],
  },
  {
    id: "libros-contables",
    title: "Llevar el Registro de Ventas y Registro de Compras electrónico (SIRE)",
    category: "SUNAT · Libros Contables",
    description:
      "En RER, RMT y RG es obligatorio llevar el Registro de Ventas e Ingresos Electrónico (RVIE) y el Registro de Compras Electrónico (RCE) mediante el sistema SIRE de SUNAT.",
    documents: [
      "Propuesta aceptada o reemplazada del RVIE en SIRE",
      "Propuesta aceptada o reemplazada del RCE en SIRE",
      "Libro Diario de Formato Simplificado (en RMT/RG hasta 300 UIT)",
    ],
    institution: "SUNAT",
    sourceId: "sunat-libros",
    applicableRegimes: ["RER", "RMT", "RG"],
  },
  {
    id: "declaracion-anual",
    title: "Presentar la Declaración Jurada Anual del Impuesto a la Renta",
    category: "SUNAT · Regularización Anual",
    description:
      "En el RMT y el Régimen General corresponde determinar la renta neta anual y regularizar el Impuesto a la Renta descontando los pagos a cuenta mensuales.",
    documents: [
      "Estado de Resultados anual del restaurante",
      "Sustento de costos, gastos operativos y depreciación de equipos",
      "Constancia de pagos a cuenta mensuales realizados en el año",
    ],
    institution: "SUNAT",
    sourceId: "sunat-rmt",
    applicableRegimes: ["RMT", "RG"],
  },
  {
    id: "t-registro",
    title: "Registrar personal en T-Registro y declarar planilla PLAME",
    category: "SUNAT · Laboral",
    description:
      "Dar de alta a cocineros, mozos, cajeros y personal dependiente en el T-Registro en el día de ingreso y presentar mensualmente la Planilla Electrónica PLAME.",
    documents: [
      "Contratos de trabajo y datos de identidad del personal",
      "Constancia de alta en T-Registro",
      "Declaración mensual PLAME y pago de EsSalud / ONP / AFP",
    ],
    institution: "SUNAT",
    sourceId: "sunat-planilla",
    applicableRegimes: ["NRUS", "RER", "RMT", "RG"],
  },
  {
    id: "sector",
    title: "Disposición tributaria complementaria en verificación",
    category: "Revisión Normativa",
    description:
      "Regla con fuente documental pendiente de revisión para comprobar que el sistema advierta cuando una disposición aún no está confirmada.",
    documents: [],
    institution: "SUNAT / MEF",
    sourceId: "sector-review",
    applicableRegimes: ["NRUS", "RER", "RMT", "RG"],
  },
];

const verifiedRuleMeta = {
  effectiveFrom: "2026-01-01",
  lastVerifiedAt: "2026-10-15",
  nextReviewAt: "2027-04-15",
  verifiedBy: "Revisión normativa SUNAT · Tesis 2026",
};

const alwaysRestaurant = {
  connector: "AND" as const,
  conditions: [
    {
      field: "purpose" as const,
      operator: "IN" as const,
      value: ["crear", "formalizar", "revisar"],
    },
  ],
};

export const rules: Rule[] = [
  {
    id: "R001",
    version: 2,
    name: "Verificación de Ficha RUC y giro de restaurante",
    status: "PUBLICADA",
    sourceId: "sunat-ruc",
    priority: 100,
    conditions: alwaysRestaurant,
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "ficha-ruc",
        classification: "OBLIGATORIO",
        reason:
          "Todo restaurante formalizado debe mantener actualizado su RUC con CIIU 5610, domicilio fiscal y locales anexos reales.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R002",
    version: 2,
    name: "Control de emisión de comprobantes de pago",
    status: "PUBLICADA",
    sourceId: "sunat-comprobantes",
    priority: 95,
    conditions: alwaysRestaurant,
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "comprobantes-pago",
        classification: "OBLIGATORIO",
        reason:
          "El restaurante debe emitir únicamente los comprobantes autorizados para su régimen tributario.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R003",
    version: 2,
    name: "Sustento y archivo de compras de insumos",
    status: "PUBLICADA",
    sourceId: "sunat-comprobantes",
    priority: 90,
    conditions: alwaysRestaurant,
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "sustento-compras",
        classification: "OBLIGATORIO",
        reason:
          "Las compras de alimentos, bebidas, gas y suministros requieren comprobantes válidos para controlar límites y sustentar crédito fiscal o gasto.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R004",
    version: 2,
    name: "Declaración y pago tributario mensual",
    status: "PUBLICADA",
    sourceId: "sunat-cronograma",
    priority: 92,
    conditions: alwaysRestaurant,
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "declaracion-mensual",
        classification: "OBLIGATORIO",
        reason:
          "Corresponde declarar y pagar mensualmente dentro del cronograma oficial de SUNAT según el último dígito del RUC.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R005",
    version: 2,
    name: "Registros contables electrónicos (RER, RMT y RG)",
    status: "PUBLICADA",
    sourceId: "sunat-libros",
    priority: 85,
    conditions: {
      connector: "OR",
      conditions: [
        { field: "currentRegime", operator: "IN", value: ["RER", "RMT", "RG"] },
        { field: "legalPerson", operator: "=", value: "juridica" },
        { field: "needsInvoices", operator: "IS_TRUE" },
        { field: "monthlyRevenue", operator: ">", value: 8000 },
      ],
    },
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "libros-contables",
        classification: "OBLIGATORIO",
        reason:
          "Los restaurantes en RER, RMT o Régimen General están obligados a llevar Registros de Ventas y Compras electrónicos.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R006",
    version: 2,
    name: "Declaración Jurada Anual de Renta (RMT y RG)",
    status: "PUBLICADA",
    sourceId: "sunat-rmt",
    priority: 80,
    conditions: {
      connector: "OR",
      conditions: [
        { field: "currentRegime", operator: "IN", value: ["RMT", "RG"] },
        { field: "monthlyRevenue", operator: ">", value: 43750 },
        { field: "employeeCountPerShift", operator: ">", value: 10 },
      ],
    },
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "declaracion-anual",
        classification: "CONDICIONAL",
        reason:
          "En el RMT y el Régimen General es obligatorio presentar la Declaración Jurada Anual del Impuesto a la Renta.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R007",
    version: 2,
    name: "Obligaciones laborales en planilla (T-Registro y PLAME)",
    status: "PUBLICADA",
    sourceId: "sunat-planilla",
    priority: 82,
    conditions: {
      connector: "OR",
      conditions: [
        { field: "employeeCount", operator: ">", value: 0 },
        { field: "hasEmployees", operator: "IS_TRUE" },
      ],
    },
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "t-registro",
        classification: "OBLIGATORIO",
        reason:
          "El restaurante cuenta con trabajadores y debe registrar su alta en T-Registro y declarar mensualmente la planilla PLAME.",
      },
    ],
    ...verifiedRuleMeta,
  },
  {
    id: "R008",
    version: 1,
    name: "Control de fuente pendiente de revisión",
    status: "PUBLICADA",
    sourceId: "sector-review",
    priority: 10,
    conditions: alwaysRestaurant,
    actions: [
      {
        type: "ADD_REQUIREMENT",
        requirementId: "sector",
        classification: "INFORMATIVO",
        reason:
          "Esta regla apunta a una fuente en estado POR_VERIFICAR; el motor la bloquea como requisito confirmado hasta su revisión.",
      },
    ],
    effectiveFrom: "2026-01-01",
    lastVerifiedAt: "2026-07-01",
    nextReviewAt: "2026-09-30",
    verifiedBy: "Pendiente",
  },
];

export const requirementById = (id: string) =>
  requirements.find((item) => item.id === id);
export const sourceById = (id: string) =>
  sources.find((item) => item.id === id);
export const taxRuleById = (id: string) =>
  taxRules.find((item) => item.id === id);

export const seedCatalog: CatalogData = {
  categories,
  activities,
  requirements,
  rules,
  sources,
  taxRules,
};

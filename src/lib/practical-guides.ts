import type { BusinessContext } from "./types";

export type PracticalGuide = {
  where: string;
  askFor: string;
  prepare: string[];
  steps: string[];
  cost: string;
  note?: string;
  sourceId: string;
};

export const practicalGuides: Record<string, PracticalGuide> = {
  ruc: {
    where: "SUNAT Virtual o App Personas si eres persona natural con DNI. Si elegiste persona jurídica, primero constituye e inscribe la empresa en SUNARP y luego activa el RUC en SUNAT Operaciones en Línea.",
    askFor: "Inscripción al RUC para iniciar un negocio y generación de Clave SOL.",
    prepare: ["DNI vigente", "Celular y correo que puedas confirmar", "Domicilio fiscal", "Fecha prevista de inicio", "Descripción sencilla de la actividad y régimen que vas a elegir"],
    steps: ["Verifica si ya tienes RUC.", "Identifícate en la App Personas o SUNAT Virtual; para persona natural puede solicitarse validación biométrica.", "Registra domicilio, actividad económica, fecha de inicio y régimen tributario.", "Genera o activa tu Clave SOL y guarda la constancia del RUC."],
    cost: "La guía de inscripción digital de SUNAT no señala un pago por inscribirte. No confundas este trámite con los gastos de constituir una persona jurídica.",
    note: "Elige con cuidado la actividad económica: SUNAT la usa para identificar las obligaciones que podrían corresponderte.",
    sourceId: "sunat-ruc",
  },
  sunarp: {
    where: "Sistema de Intermediación Digital (SID-SUNARP) y una notaría que tramite la constitución elegida.",
    askFor: "Constitución e inscripción de una persona jurídica. La reserva de nombre es recomendable, pero no obligatoria.",
    prepare: ["DNI o documento de identidad de cada socio", "Tres alternativas de nombre", "Domicilio y actividad/objeto de la empresa", "Aportes de cada socio y monto de capital", "Quién administrará y representará la empresa"],
    steps: ["Elige con los socios el tipo de persona jurídica y acuerden aportes, reglas y representante.", "Consulta nombres y, si lo deseas, solicita la reserva desde SID-SUNARP.", "En SID, selecciona la notaría y completa los datos de socios, capital, domicilio y objeto.", "Coordina con la notaría el acto constitutivo, firmas y presentación al Registro de Personas Jurídicas.", "Con la inscripción, sigue las indicaciones de SUNAT para activar el RUC y Clave SOL."],
    cost: "La reserva en SID muestra el importe antes del pago; la ficha de gob.pe consultada publica S/ 25.60. La constitución añade derechos registrales que dependen del trámite y capital, más honorarios notariales. Confirma el total en SID y con la notaría antes de pagar.",
    note: "Si operas como persona natural con negocio, esta constitución societaria no es un paso previo obligatorio. La persona jurídica separa a la empresa de sus socios en los términos de la forma elegida; compara responsabilidades antes de decidir.",
    sourceId: "sunarp",
  },
  regime: {
    where: "Elige el régimen al inscribirte o activar el RUC en SUNAT. Después, las declaraciones y pagos se gestionan con Clave SOL según el régimen y el cronograma aplicable.",
    askFor: "Afectación al régimen tributario que corresponda a la actividad y forma de operar.",
    prepare: ["Si venderás a personas, empresas o al Estado", "Estimación de ingresos y compras del año", "Activos usados en el negocio", "Trabajadores por turno", "Si necesitas emitir facturas", "Actividad exacta para revisar exclusiones"],
    steps: ["Revisa la preselección que muestra esta plataforma y sus condiciones.", "Confirma con SUNAT si tu actividad está permitida en el régimen y cómo debes acogerte.", "Selecciona el régimen al inscribirte o actualizar tu RUC dentro de las fechas que correspondan.", "Configura emisión de comprobantes y calendario de declaraciones; guarda tus comprobantes de ventas y compras."],
    cost: "No se paga una tasa por comparar opciones. Sí pueden existir impuestos periódicos: Nuevo RUS cobra cuota de S/ 20 o S/ 50 si cumples sus condiciones; RER calcula 1.5% de ingresos netos mensuales más IGV; RMT y Régimen General tienen anticipos mensuales y regularización anual. El monto final depende de ventas gravadas, compras con derecho a crédito, utilidad y tu situación.",
    note: "No elijas solo por la cuota. Si clientes empresariales te pedirán factura, el Nuevo RUS no te sirve; si tu actividad está excluida, la proyección de ventas no basta para entrar al RER o RMT.",
    sourceId: "sunat-regimes",
  },
  license: {
    where: "Área de Licencias de Funcionamiento o Comercialización de la municipalidad competente para la dirección del local. Pregunta también por compatibilidad del giro con la zonificación.",
    askFor: "Solicitud de licencia de funcionamiento para tu actividad exacta en esa dirección. Pide el TUPA vigente, el formato de nivel de riesgo y la lista de anexos.",
    prepare: ["Dirección exacta y área del establecimiento", "Giro o actividad que desarrollarás", "RUC y documento de identidad", "Si es empresa: datos del representante y vigencia de poder cuando corresponda", "Declaraciones y reporte de riesgo que entrega la municipalidad"],
    steps: ["Antes de alquilar o invertir, consulta si el giro puede funcionar en esa dirección.", "Solicita el formulario vigente y pregunta cómo la municipalidad clasificará el nivel de riesgo.", "Completa la solicitud/declaración jurada y presenta el reporte de riesgo con los anexos aplicables.", "Paga el derecho de trámite indicado en el TUPA y conserva el recibo y cargo.", "Sigue la indicación municipal para la ITSE: riesgo bajo/medio puede tramitarse después de la licencia, dentro del plazo oficial; alto/muy alto requiere ITSE previa."],
    cost: "La tasa y anexos dependen del TUPA de tu municipalidad, dirección y nivel de riesgo. No hay un precio único para todo el Perú. Pide el código del trámite y monto vigente antes de pagar; exige recibo oficial.",
    note: "No pagues a terceros por una lista genérica: primero confirma que la municipalidad y el procedimiento sean los que corresponden a tu distrito y local.",
    sourceId: "licencia-paso",
  },
  itse: {
    where: "Municipalidad competente o su área de Gestión del Riesgo de Desastres/ITSE, según indique el procedimiento local.",
    askFor: "Evaluación ITSE aplicable al nivel de riesgo de tu establecimiento y su costo según el TUPA vigente.",
    prepare: ["Dirección y distribución del local", "Actividad y aforo estimado", "Información de instalaciones eléctricas, gas y equipos, si existen", "Planos, certificados u otros anexos solo si la municipalidad los exige para tu nivel de riesgo"],
    steps: ["Pide a la municipalidad confirmar el nivel de riesgo y si la inspección es previa o posterior a la licencia.", "Solicita la lista de documentos y condiciones técnicas correspondiente a ese nivel.", "Presenta la solicitud, paga la tasa local aplicable y coordina la inspección si corresponde.", "Levanta observaciones y conserva el certificado o acta emitida."],
    cost: "El importe depende del TUPA local y del nivel de riesgo. Pregunta si el derecho ITSE está incluido en el trámite de licencia o se paga por separado.",
    sourceId: "licencia-paso",
  },
  "t-registro": {
    where: "SUNAT Operaciones en Línea (SOL), opción T-Registro y PLAME.",
    askFor: "Alta de cada trabajador en T-Registro y presentación de la Planilla Mensual de Pagos (PLAME), según la relación laboral.",
    prepare: ["DNI y datos de cada trabajador", "Fecha de ingreso", "Tipo de contrato y ocupación", "Remuneración, jornada y datos previsionales y de salud", "Clave SOL del empleador"],
    steps: ["Confirma el vínculo y condiciones laborales con cada persona.", "Registra los datos del empleador y trabajador en T-Registro dentro del plazo aplicable.", "Calcula remuneraciones, aportes y retenciones que correspondan.", "Presenta PLAME y paga los conceptos dentro del cronograma vigente; guarda constancias."],
    cost: "La presentación en SUNAT no tiene una tasa de trámite; los costos reales pueden incluir remuneración, EsSalud, pensiones y beneficios laborales. El monto depende del vínculo y régimen laboral.",
    sourceId: "sunat-planilla",
  },
  book: {
    where: "Indecopi para orientación; implementa el libro en el establecimiento o canal de atención que corresponda a tu negocio.",
    askFor: "Cómo poner a disposición el Libro de Reclamaciones y el aviso visible para consumidores.",
    prepare: ["Razón social o nombre del proveedor", "RUC y dirección del establecimiento", "Responsable de recibir y responder reclamos", "Canales de atención, incluida la web si vendes en línea"],
    steps: ["Confirma si atiendes consumidores finales y en qué canales.", "Implementa un Libro de Reclamaciones físico o virtual y coloca el aviso donde el consumidor pueda verlo.", "Define quién revisará el libro y cómo se responderá conforme al plazo legal vigente.", "Conserva los registros de reclamos y respuestas."],
    cost: "No se paga a Indecopi una tasa por registrar el libro. Puede haber costo de impresión o de una solución digital elegida por el negocio; no es una tarifa oficial de Indecopi.",
    sourceId: "indecopi",
  },
  sector: {
    where: "Primero identifica el código y alcance de tu actividad; después consulta el ministerio, dirección regional u organismo sectorial competente.",
    askFor: "Si tu actividad requiere autorización, registro, colegiatura, certificado u otra habilitación previa para operar.",
    prepare: ["Descripción concreta del servicio o producto", "Actividad económica/CIIU confirmada con SUNAT", "Lugar y forma en que operarás", "Respuestas del bloque sectorial de este cuestionario"],
    steps: ["No asumas que necesitas un permiso solo por el nombre amplio del rubro.", "Describe a la entidad qué harás, dónde y para quién.", "Pide el nombre exacto del trámite, norma aplicable, requisitos y tasa vigente.", "Guarda el enlace oficial y la respuesta de la entidad para actualizar tu ruta."],
    cost: "No se puede estimar todavía: el permiso específico y su tasa dependen de la actividad detallada y la autoridad competente.",
    note: "Esta tarjeta es una alerta de revisión; no confirma que tengas que tramitar un permiso sectorial.",
    sourceId: "sector-review",
  },
};

export type TaxPath = { code?: "NRUS" | "RER" | "RMT" | "RG"; title: string; reason: string; checks: string[]; status: "PRESELECCION" | "FALTAN_DATOS" };

export function getTaxPath(context: BusinessContext): TaxPath {
  const q = context.questionnaire;
  if (!q) return { title: "Completa el cuestionario para comparar", reason: "Necesitamos conocer tu actividad, ventas, clientes, comprobantes y forma de operar.", checks: ["Responde las preguntas tributarias"], status: "FALTAN_DATOS" };
  const salesKnown = String(q.P20 || "").startsWith("monto:");
  const purchasesKnown = String(q.TAX_PURCHASES || "").trim() !== "";
  const assetsKnown = String(q.TAX_ASSETS || "").trim() !== "";
  const annualSales = salesKnown ? Number(String(q.P20).slice(6)) * 12 : 0;
  const purchases = purchasesKnown ? Number(q.TAX_PURCHASES) * 12 : 0;
  const assets = assetsKnown ? Number(q.TAX_ASSETS) : 0;
  const employeesKnown = q.P28 === "No" || (q.P28 === "Sí" && Boolean(String(q.P29 || "").trim()) && Boolean(String(q["P29.1"] || "").trim()));
  const employeesPerShift = Number(q["P29.1"] || 0);
  const legalKnown = context.legalPerson !== "aun-no-se";
  const customersKnown = context.customerType !== "aun-no-se";
  const canCheckNrus = legalKnown && customersKnown && salesKnown && purchasesKnown && assetsKnown && employeesKnown && context.activityId && q.P23;
  const nrusFits = canCheckNrus && context.sectorId !== "turismo" && context.legalPerson === "natural" && context.customerType === "personas" && context.needsInvoices === false && annualSales <= 96000 && purchases <= 96000 && assets <= 70000 && !["carga","agencia","importador","exportador"].includes(context.activityId);
  if (nrusFits) return { code:"NRUS", title:"Primera opción a revisar: Nuevo RUS", reason:"Tus respuestas describen una persona natural que vende a consumidores finales, no requiere factura y está dentro de los límites generales que SUNAT publica. Este régimen puede ser el más sencillo si también cumples sus exclusiones.", checks:["Confirma que el giro no esté excluido y que no tengas más de una unidad de explotación.","SUNAT establece cuota mensual de S/ 20 (categoría 1) o S/ 50 (categoría 2), según ingresos y compras.","Solo permite boletas, tickets y guías; no facturas."], status:"PRESELECCION" };
  const rerKnown = salesKnown && purchasesKnown && assetsKnown && employeesKnown && legalKnown;
  // Do not exclude an entire sector without checking the exact activity against SUNAT's list.
  const rerFits = rerKnown && annualSales <= 525000 && purchases <= 525000 && assets <= 126000 && employeesPerShift <= 10;
  if (rerFits) return { code:"RER", title:"Primera opción a revisar: Régimen Especial (RER)", reason:"Las ventas y compras que declaraste están bajo los límites publicados y tu escenario no activa una exclusión conocida en esta preselección. El RER permite emitir facturas y boletas, pero hay que confirmar el CIIU exacto antes de elegirlo.", checks:["Límite general: S/ 525,000 anuales en ingresos y compras, hasta S/ 126,000 en activos computables y máximo 10 trabajadores por turno.","Pago mensual de renta: 1.5% de ingresos netos; además IGV de operaciones gravadas, con crédito fiscal si procede.","La actividad exacta puede excluirte. Confírmala con SUNAT antes de acogerte."], status:"PRESELECCION" };
  const annualLimitRmt = 1700 * 5500;
  if (salesKnown && legalKnown && customersKnown && q.P23 && annualSales <= annualLimitRmt && (annualSales > 525000 || (rerKnown && !rerFits))) return { code:"RMT", title:"RMT: alternativa para revisar con SUNAT", reason:"La estimación supera el límite general de ingresos del RER o los datos completos muestran que no se cumple alguna de sus condiciones revisadas. Por eso el RMT merece compararse; no queda elegido automáticamente y aún hay que revisar sus exclusiones.", checks:["El RMT permite emitir facturas y boletas y admite hasta 1,700 UIT de ingresos netos anuales, sujeto a exclusiones.", "Necesitar factura no obliga por sí solo a elegir RMT: el RER también permite emitirla si cumples sus condiciones.", "Lleva tu actividad CIIU, forma legal, clientes y estimación de ingresos y gastos a SUNAT o a un contador para confirmar la opción."], status:"PRESELECCION" };
  if (salesKnown && annualSales > annualLimitRmt) return { code:"RG", title:"Primera opción a revisar: Régimen General", reason:"La proyección supera el límite general de ingresos del RMT. El Régimen General no tiene tope de ingresos, pero requiere verificar la actividad y tus obligaciones completas.", checks:["El pago a cuenta mensual compara el coeficiente con 1.5% de ingresos netos.","La regularización anual depende de la renta neta imponible.","Confirma el cálculo y el régimen con SUNAT antes de inscribirte."], status:"PRESELECCION" };
  const missing = [
    !context.activityId && (context.otherActivity.trim() ? "Confirma el CIIU que corresponde a lo que describiste; la plataforma no debe inventar ese código." : "Describe qué producto venderás o qué servicio ofrecerás para sugerir un CIIU."),
    !legalKnown && "Define si operarás como persona natural o persona jurídica.",
    !salesKnown && (String(q.P20 || "")==="Todavía no puedo estimarlo" ? "Aún no tienes una estimación mensual. Usa la calculadora de cantidad de ventas/servicios por cobro promedio; si no puedes hacerlo ahora, deja este dato pendiente." : String(q.P20 || "").trim() ? "Elegiste un rango de ingresos. Para afinar la recomendación, convierte tu rango en un monto aproximado con la calculadora." : "Estima cuánto cobrarías en un mes con la calculadora; si aún no puedes, elige que todavía no puedes estimarlo."),
    !customersKnown && "Indica si atenderás personas, empresas o ambos.",
    (!q.P23 || String(q.P23).startsWith("No lo sé")) && "Aclara si tus clientes necesitarán factura.",
    !purchasesKnown && "Calcula cuánto gastarías en productos, ingredientes o materiales al mes.",
    !assetsKnown && "Estima el valor de equipos o maquinaria que usará el negocio (si no tienes, escribe 0).",
    !(q.P28 === "No" || (q.P28 === "Sí" && Boolean(String(q.P29 || "").trim()) && Boolean(String(q["P29.1"] || "").trim()))) && "Indica si tendrás trabajadores; si respondes que sí, cuántos serán y cuántos coincidirán por turno.",
  ].filter(Boolean) as string[];
  return { title:"Completa estos datos y comparamos tus opciones", reason:"No necesitas haber empezado a vender ni llevar documentos. Con una descripción y estimaciones honestas podemos revisar qué regímenes podrían encajar y explicarte qué confirmar con SUNAT.", checks:missing.length?missing:["Pregunta a SUNAT si tu CIIU tiene alguna exclusión.", "Compara tus cobros estimados con gastos, compras y comprobantes que emitirás.", "La recomendación será orientativa; confirma tu elección con SUNAT antes de inscribirte."], status:"FALTAN_DATOS" };
}

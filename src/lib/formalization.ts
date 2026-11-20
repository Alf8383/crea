import { practicalGuides } from "./practical-guides";
import type { BusinessContext } from "./types";

export type FormalizationTask = {
  id: string; title: string; phase: "Identidad y registro" | "Permisos y operación";
  description: string; steps: string[]; url: string; institution: string; after?: string;
  conditional?: boolean; declaredComplete?: boolean;
};

const identity = "Identidad y registro";
const operation = "Permisos y operación";
const localRule = "https://www.gob.pe/institucion/municajamarca/normas-legales/5518154-om_895-2024";
const generalLicense = "https://www.gob.pe/20844-obtener-licencia-de-funcionamiento-para-negocios-de-riesgo-bajo-o-medio";

export function buildFormalizationRoute(context: BusinessContext): FormalizationTask[] {
  const ciiu = [context.ciiu, ...(context.ciiuClassification?.secondary ?? [])];
  const location = context.district || context.province || "tu lugar de operación";
  const central = (context.district ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() === "cajamarca"
    && context.province === "Cajamarca";
  const municipalSource = central ? localRule : generalLicense;
  const municipality = central ? "Municipalidad Provincial de Cajamarca" : "Municipalidad competente en " + location;
  const knownRegime = context.currentRegime && !["SIN_REGIMEN", "DESCONOCIDO"].includes(context.currentRegime);
  const juridica = context.legalPerson === "juridica";
  const planned = context.stage === "idea" || context.stage === "preparacion";
  const fixedPlace = context.hasLocal ?? (context.hasPhysicalLocation ? true : undefined);
  const unknownActivity = !context.ciiu;
  const tasks: FormalizationTask[] = [
    { id: "form", title: "Definir la forma de operar", phase: identity, institution: "SUNARP",
      description: "Decide si operarás a tu nombre o mediante una empresa.",
      steps: practicalGuides.sunarp.steps, url: practicalGuides.sunarp.officialUrl,
      declaredComplete: Boolean(!planned && context.hasRuc && context.legalPerson !== "aun-no-se") },
  ];
  if (juridica) tasks.push({
    id: "sunarp", title: !planned && context.hasRuc ? "Revisar los datos de constitución" : "Inscribir la empresa", phase: identity, institution: "SUNARP",
    after: "Definir la forma de operar", description: "Define el tipo de empresa y registra la constitución en SUNARP.",
    steps: ["Define el tipo de empresa, los socios y los aportes.", "Organiza el acto constitutivo y revisa las modalidades de inscripción en SUNARP."],
    url: practicalGuides.sunarp.officialUrl,
  });
  tasks.push(
    { id: "ruc", title: context.hasRuc ? "Revisar o actualizar la ficha RUC" : "Consultar o inscribir el RUC", phase: identity, institution: "SUNAT",
      after: juridica ? "Inscribir la empresa si corresponde" : "Definir la forma de operar",
      description: context.hasRuc ? "Verifica el estado, domicilio fiscal y actividades registradas." : "Confirma si ya existe una inscripción y tramítala si corresponde.",
      steps: ["Identifica tu actividad principal y las actividades secundarias.", "Revisa el domicilio fiscal y la fecha de inicio.", "Si constituiste una empresa, verifica la activación de su RUC."],
      url: "https://emprender.sunat.gob.pe/ruc/mi-ruc/inscripcion-ruc" },
    { id: "regime", title: knownRegime ? "Verificar el régimen tributario" : "Evaluar el régimen tributario", phase: identity, institution: "SUNAT",
      after: "Preparar o revisar la ficha RUC", description: "Compara compatibilidad, comprobantes y obligaciones con los datos de tu escenario.",
      steps: ["Revisa los requisitos y responde los datos pendientes del diagnóstico.", "Consulta cuándo corresponde inscribirte o cambiar de régimen."],
      url: practicalGuides.regime.officialUrl },
    { id: "receipts", title: "Preparar los comprobantes de pago", phase: identity, institution: "SUNAT",
      after: "Confirmar el régimen tributario", description: "Revisa qué comprobantes puedes emitir y cómo guardar las compras y ventas.",
      steps: practicalGuides.comprobantes.steps, url: practicalGuides.comprobantes.officialUrl },
  );
  if (fixedPlace === true) {
    const high = context.municipalRisk === "alto";
    const low = context.municipalRisk === "bajo-medio";
    const license: FormalizationTask = {
      id: "license", title: "Revisar la licencia de funcionamiento", phase: operation, institution: municipality,
      after: high ? "Obtener el certificado ITSE" : "Consultar el nivel de riesgo municipal",
      description: "Confirma el giro, la zonificación y el trámite del establecimiento en " + location + ".",
      steps: ["Consulta la compatibilidad de uso antes de acondicionar el local.", "Pide a la municipalidad los requisitos y costos vigentes para tu giro."],
      url: municipalSource, declaredComplete: context.licenseStatus === "yes",
    };
    const itse: FormalizationTask = {
      id: "itse", title: "Gestionar la inspección de seguridad (ITSE)", phase: operation, institution: municipality,
      after: low ? "Solicitar la licencia de funcionamiento" : "Confirmar la clasificación de riesgo",
      description: high ? "Para riesgo alto o muy alto, el certificado precede a la licencia."
        : low ? "Para riesgo bajo o medio, la ITSE puede tramitarse después de la licencia."
          : "El orden depende del riesgo que determine la municipalidad.",
      steps: ["Consulta qué documentos y medidas de seguridad corresponden a la edificación."],
      url: high ? "https://www.gob.pe/20866-obtener-licencia-de-funcionamiento-para-negocios-de-riesgo-alto-o-muy-alto" : municipalSource,
      conditional: !high && !low, declaredComplete: context.itseStatus === "yes",
    };
    tasks.push(...(high ? [itse, license] : [license, itse]));
  } else {
    tasks.push({ id: "municipality", title: "Consultar dónde está permitido operar", phase: operation, institution: municipality,
      description: context.operationMode === "movil" ? "Consulta si necesitas autorización para un puesto móvil o para usar el espacio público."
        : "Confirma las autorizaciones aplicables al lugar de preparación, almacenamiento o servicio.",
      steps: ["Describe dónde preparas, almacenas y entregas alimentos.", "Consulta la autorización aplicable a esa modalidad."],
      conditional: true, url: municipalSource });
  }
  if (unknownActivity || ciiu.some((code) => code === "5610" || code === "5621" || code === "5630")) tasks.push({
    id: "hygiene", title: "Preparar las condiciones sanitarias", phase: operation, institution: "MINSA · DIGESA",
    description: "Organiza la limpieza, la manipulación segura y la conservación de alimentos y bebidas.",
    steps: ["Verifica el acceso a agua segura y los procedimientos de higiene.", "Revisa con la autoridad qué condiciones corresponden a tu servicio."],
    url: "https://www.digesa.minsa.gob.pe/normaslegales/normas/rm_822-2018-minsa.pdf", conditional: unknownActivity || ciiu.includes("5621"),
  });
  if (ciiu.includes("5629")) tasks.push({
    id: "collective", title: "Verificar requisitos de alimentación colectiva", phase: operation, institution: "MINSA · DIGESA",
    description: "Si atiendes a grupos bajo contrato, verifica los principios de higiene y la certificación aplicable.",
    steps: ["Revisa el tipo de grupo, el establecimiento y la autoridad sanitaria competente."],
    url: "https://www.gob.pe/institucion/minsa/normas-legales/1635426-157-2021-minsa", conditional: true,
  });
  if (ciiu.some((code) => code?.startsWith("10"))) tasks.push({
    id: "packaged", title: "Verificar el registro sanitario del producto", phase: operation, institution: "DIGESA",
    description: "Consulta si tu línea de alimentos industrializados requiere registro sanitario y qué información debe ir en el rotulado.",
    steps: ["Prepara la descripción del proceso y la forma de conservación.", "Confirma el trámite para cada producto antes de comercializarlo."],
    url: "https://www.digesa.minsa.gob.pe/Orientacion/REGISTRO_SANITARIO.pdf", conditional: true,
  });
  if (context.hasEmployees !== false) tasks.push({
    id: "labor", title: "Preparar planilla y registro laboral", phase: operation, institution: "SUNAT",
    after: "Contar con un RUC activo", description: "Revisa el alta de trabajadores dependientes, las declaraciones de planilla y los aportes.",
    steps: ["Consulta el alta en T-Registro al incorporar personal.", "Organiza los datos de la planilla mensual (PLAME)."],
    url: "https://www.gob.pe/institucion/sunat/pages/8071-planilla-electronica", conditional: context.hasEmployees !== true,
  });
  return tasks;
}

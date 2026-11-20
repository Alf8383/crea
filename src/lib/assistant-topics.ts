export const assistantTopics = {
  legal: { label: "¿Qué es una persona jurídica?", text: "Es una organización con identidad propia. Si planeas constituir una empresa, revisa los tipos disponibles y sus trámites ante SUNARP. Una persona natural con negocio opera a su propio nombre.", source: "SUNARP", url: "https://www.gob.pe/269" },
  assets: { label: "¿Qué son activos fijos?", text: "Son bienes que usas de forma duradera para trabajar, como hornos, refrigeradoras y muebles. Para los topes del Nuevo RUS y el RER, excluye predios y vehículos.", source: "SUNAT", url: "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios" },
  sales: { label: "¿Cómo calculo mis ventas si aún no abro?", text: "Multiplica el precio promedio por los pedidos diarios y los días de atención del mes. Haz un cálculo por producto o servicio y ajusta los meses de alta y baja demanda. Registra el resultado como una proyección.", source: "Simulador de CREA", url: "/negocios?seccion=simulador" },
  invoice: { label: "¿Qué significa emitir factura?", text: "Una factura documenta una venta y, si se cumplen los requisitos, permite al comprador sustentar costo, gasto o crédito fiscal. En el Nuevo RUS se emiten boletas o tickets autorizados sin derecho a crédito fiscal.", source: "SUNAT", url: "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios" },
  ciiu: { label: "¿Qué es el código CIIU?", text: "Es el código que identifica tu actividad económica. Describe cómo vendes, qué consumen los clientes y si preparas pedidos para eventos, atiendes regularmente por contrato o fabricas productos.", source: "INEI", url: "https://www.gob.pe/20793-conocer-clasificacion-industrial-internacional-uniforme-ciiu-revision-4-de-tu-actividad-economica" },
  mixed: { label: "¿Qué pasa si vendo comida y bebidas?", text: "Si las bebidas acompañan tu servicio de comidas, confirma si forman parte de la misma actividad. Si también tienes una actividad de bebidas independiente, indícala como secundaria cuando corresponda. Identifica primero la actividad que más aporta al negocio.", source: "INEI", url: "https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/Lib0883/Libro.pdf" },
  tax: { label: "¿Cómo comparo los regímenes?", text: "Revisa primero si cumples los requisitos de cada régimen. Luego compara los comprobantes, obligaciones y costos del escenario. Abre el diagnóstico para ver qué reglas pasaron y qué datos faltan.", source: "SUNAT", url: "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios" },
} as const;

export type AssistantTopic = keyof typeof assistantTopics;

export function localAssistantTopic(question: string): AssistantTopic | undefined {
  const plain = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/comida.*bebida|bebida.*comida/.test(plain)) return "mixed";
  if (/ciiu|clasific|actividad economica/.test(plain)) return "ciiu";
  if (/juridic|persona natural|constituc|socios/.test(plain)) return "legal";
  if (/activo|equipos|mueble/.test(plain)) return "assets";
  if (/proyecc|estim.*(venta|ingreso)|calcul.*(venta|ingreso)|no (abro|inicio)/.test(plain)) return "sales";
  if (/factur|boleta|comprobante/.test(plain)) return "invoice";
  if (/regimen|diagnostico|nr(us)|rer|rmt|tribut/.test(plain)) return "tax";
}

export function isAssistantTopic(value: unknown): value is AssistantTopic {
  return typeof value === "string" && Object.hasOwn(assistantTopics, value);
}

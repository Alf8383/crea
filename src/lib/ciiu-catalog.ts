export const CIIU_VERSION = "PE-INEI-REV4-2026.11";
export const CIIU_SOURCE = "https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/Lib0883/Libro.pdf";
export const CIIU_TABLE = "https://cdn.www.gob.pe/uploads/document/file/1348266/Tabla_Oficial_CIIU_Rev4.pdf";

export const ciiuCatalog = {
  "5610": { name: "Actividades de restaurantes y de servicio móvil de comidas", evidence: "Sirvo comidas listas para consumir", reason: "Incluye la atención en local, la comida para llevar y la entrega a domicilio de comidas preparadas.", page: 136 },
  "5621": { name: "Suministro de comidas por encargo", evidence: "Sirvo comidas en el lugar acordado para un evento específico", reason: "El servicio se contrata para un evento determinado en el lugar indicado por el cliente.", page: 136 },
  "5629": { name: "Otras actividades de servicio de comidas", evidence: "Opero un comedor por concesión o sirvo comidas bajo un contrato continuo", reason: "El suministro se contrata para un periodo convenido o se presta mediante una concesión.", page: 136 },
  "5630": { name: "Actividades de servicio de bebidas", evidence: "El servicio se centra en preparar y servir bebidas para consumo inmediato", reason: "Incluye el servicio de bebidas, como las juguerías y otros establecimientos donde las bebidas son la actividad principal.", page: 136 },
  "1071": { name: "Elaboración de productos de panadería", evidence: "Fabrico pan o productos de pastelería como línea de producción", reason: "La producción de panadería es una actividad separada del servicio de comidas para consumo inmediato.", page: 56 },
  "1075": { name: "Elaboración de comidas y platos preparados", evidence: "Fabrico platos completos conservados, congelados o enlatados para vender como productos", reason: "Corresponde a platos preparados conservados para comercialización. Un envase de delivery, por sí solo, no cambia la actividad de restaurante.", page: 57 },
  "1079": { name: "Elaboración de otros productos alimenticios n.c.p.", evidence: "Elaboro comidas perecederas para su reventa, como sándwiches frescos", reason: "El INEI incluye la elaboración de comidas perecederas para reventa. Otros productos requieren revisar su clase específica.", page: 57 },
} as const;

export type CiiuCode = keyof typeof ciiuCatalog;
export const ciiuCodes = Object.keys(ciiuCatalog) as CiiuCode[];
export const isCiiuCode = (value: unknown): value is CiiuCode => typeof value === "string" && Object.hasOwn(ciiuCatalog, value);

export const clues = {
  meals: ["5610"], events: ["5621", "5629"], drinks: ["5630", "5610"],
  production: ["1071", "1075", "1079", "5610"],
} as const satisfies Record<string, readonly CiiuCode[]>;
export type CiiuClue = keyof typeof clues;

export function detectBusinessClues(description: string): CiiuClue[] {
  const plain = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matches: [CiiuClue, RegExp][] = [
    ["meals", /restaurante|polleria|chifa|cevicheria|picanteria|menu|delivery|almuerzo|comidas/],
    ["events", /catering|evento|concesion|comedor|contrato/],
    ["drinks", /cafe|jugo|bebida|bar\b/],
    ["production", /panader|envasad|congelad|enlatad|reventa|fabric/],
  ];
  return matches.filter(([, pattern]) => pattern.test(plain)).map(([clue]) => clue);
}

export function suggestedCodes(description: string, assisted: readonly CiiuClue[] = []) {
  return [...new Set([...detectBusinessClues(description), ...assisted].flatMap((clue): readonly CiiuCode[] => clues[clue]))];
}

export function confirmedClassification(primary: string, evidence: string, secondary: string) {
  if (!isCiiuCode(primary) || primary !== evidence) return;
  return {
    version: CIIU_VERSION, primary,
    secondary: [...new Set(secondary.split(",").filter((code) => isCiiuCode(code) && code !== primary))],
  };
}

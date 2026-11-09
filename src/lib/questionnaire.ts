export type Answers = Record<string, string | string[]>;
export type Question = {
  id: string;
  title: string;
  help?: string;
  kind?: "text" | "number" | "multiple" | "department" | "province" | "district" | "range";
  options?: { value: string; label: string; icon?: string }[];
  when?: (answers: Answers) => boolean;
  optional?: boolean;
};

const choice = (items: string[]) => items.map((label) => ({ value: label, label }));
const yes = choice(["Sí", "No", "Aún no lo sé"]);
const more = (id: string) => (answers: Answers) => answers[id] === "Sí";
const business = (values: string[]) => choice(values);

export const sectionNames = [
  "Identificación del restaurante",
  "Locales y modalidad de atención",
  "Ventas, compras y recursos",
  "Situación tributaria actual",
  "Resultado",
];

/**
 * Cuestionario dinámico orientado exclusivamente a restaurantes formalizados de Cajamarca.
 * Nota de seguridad: Nunca solicita Clave SOL ni credenciales de SUNAT.
 */
export const questions: Question[][] = [
  [
    {
      id: "P01",
      title: "¿Cuál es la especialidad principal de tu restaurante?",
      help: "El sistema está especializado en establecimientos gastronómicos y actividades de servicio de comidas y bebidas (CIIU 5610 / 5621).",
      options: business([
        "Restaurante / alimentos",
        "Pollería, parrillería o chifa",
        "Picantería, cevichería o comida típica cajamarquina",
        "Cafetería, fuente de soda o juguería",
        "Catering y preparación de comidas por encargo",
      ]),
    },
    {
      id: "P02",
      title: "Nombre comercial y descripción breve del servicio de tu restaurante",
      kind: "text",
      help: "Ejemplo: Restaurante El Cumbe — venta de menú diario, platos a la carta y atención de almuerzos corporativos.",
    },
    {
      id: "P03",
      title: "¿Cuál es el estado actual del establecimiento?",
      help: "Esta plataforma evalúa restaurantes formalizados con RUC en Cajamarca.",
      options: business([
        "Ya tengo un restaurante formalizado con RUC activo",
        "Tengo RUC y estoy actualizando mi régimen tributario",
      ]),
    },
    {
      id: "P04",
      title: "Departamento donde opera el restaurante",
      help: "Investigación focalizada en restaurantes formalizados de Cajamarca.",
      kind: "department",
    },
    {
      id: "P05",
      title: "Provincia",
      kind: "province",
    },
    {
      id: "P06",
      title: "Distrito de Cajamarca",
      kind: "district",
      help: "Selecciona el distrito donde se ubica el establecimiento principal (ej. Cajamarca, Los Baños del Inca).",
    },
    {
      id: "P09",
      title: "¿Bajo qué tipo de contribuyente está inscrito el RUC del restaurante?",
      help: "El RUC 10 corresponde a Persona Natural con Negocio; el RUC 20 corresponde a Persona Jurídica (E.I.R.L., S.R.L., S.A.C.).",
      options: business([
        "Persona natural",
        "Persona jurídica / empresa",
        "Todavía no lo sé",
      ]),
    },
  ],
  [
    {
      id: "P10",
      title: "¿El restaurante atiende al público en un establecimiento físico?",
      options: business(["Sí", "No", "Todavía no lo sé"]),
    },
    {
      id: "P11",
      title: "¿En qué condición utilizas el local del restaurante?",
      options: business(["Propio", "Alquilado", "Cedido", "Compartido"]),
      when: more("P10"),
    },
    {
      id: "P12",
      title: "¿Cuántos locales o establecimientos abiertos tiene el restaurante (incluyendo sucursales o almacenes)?",
      help: "El Nuevo RUS solo permite operar en una (1) sola unidad de explotación.",
      options: business([
        "1 solo establecimiento",
        "2 o más establecimientos",
      ]),
      when: more("P10"),
    },
    {
      id: "P17",
      title: "Describe los platos, menús o servicios gastronómicos principales",
      kind: "text",
      help: "Ejemplo: menú ejecutivo, platos típicos, parrillas, cafetería o catering para empresas.",
    },
  ],
  [
    {
      id: "P20",
      title: "¿Cuál es el promedio de ventas mensuales brutas del restaurante (S/)?",
      kind: "range",
      help: "Ingresa el monto mensual aproximado de ventas totales (salón, para llevar y delivery). El sistema calculará también la proyección anual.",
    },
    {
      id: "P22",
      title: "¿A qué tipo de clientes atiende tu restaurante?",
      options: business([
        "Personas (consumidores finales)",
        "Personas y empresas / instituciones",
        "Principalmente empresas o instituciones",
      ]),
    },
    {
      id: "P23",
      title: "¿Tu restaurante necesita emitir Facturas a empresas o instituciones?",
      help: "Si atiendes almuerzos corporativos, eventos o clientes con RUC 20 que solicitan factura para sustentar gasto o crédito fiscal, el Nuevo RUS resulta incompatible.",
      options: business([
        "Sí, frecuentemente",
        "Sí, algunas veces",
        "No, vendo solo a consumidores finales con boleta",
        "No lo sé todavía",
      ]),
    },
    {
      id: "P24",
      title: "¿Qué medios de pago utiliza el restaurante?",
      kind: "multiple",
      options: business([
        "Efectivo",
        "Billetera digital (Yape / Plin)",
        "Tarjeta de débito / crédito (POS)",
        "Transferencia bancaria",
      ]),
    },
    {
      id: "P28",
      title: "¿El restaurante cuenta con trabajadores (cocina, salón, caja, limpieza)?",
      options: business(["Sí", "No", "Todavía no lo sé"]),
    },
    {
      id: "P29",
      title: "¿Cuántos trabajadores en total laboran en el restaurante?",
      kind: "number",
      when: more("P28"),
    },
    {
      id: "P29.1",
      title: "¿Cuántos trabajadores laboran como máximo por turno en el restaurante?",
      kind: "number",
      help: "El Régimen Especial de Renta (RER) establece un tope máximo de 10 trabajadores por turno.",
      when: more("P28"),
    },
    {
      id: "TAX_PURCHASES",
      title: "¿Cuánto compra al mes el restaurante en insumos (carnes, verduras, abarrotes, bebidas, gas)?",
      kind: "number",
      help: "Monto total mensual de compras de insumos y materiales para la operación gastronómica.",
      optional: false,
    },
    {
      id: "TAX_ASSETS",
      title: "¿Cuál es el valor estimado de los activos fijos del restaurante (hornos, congeladoras, cocina industrial, mobiliario)?",
      kind: "number",
      help: "No incluyas el valor del inmueble ni vehículos. El Nuevo RUS tiene límite de S/ 70,000 y el RER de S/ 126,000.",
      optional: false,
    },
  ],
  [
    {
      id: "P32",
      title: "¿Confirmas que el restaurante cuenta con número de RUC activo?",
      options: yes,
    },
    {
      id: "P34",
      title: "¿Conoces el régimen tributario actual en el que está inscrito tu restaurante?",
      options: yes,
      when: more("P32"),
    },
    {
      id: "P34.1",
      title: "¿Cuál es el régimen tributario actual del restaurante?",
      options: business([
        "Nuevo RUS",
        "RER",
        "RMT",
        "Régimen General",
      ]),
      when: more("P34"),
    },
    {
      id: "P36",
      title: "¿Actualmente el restaurante emite comprobantes de pago?",
      options: yes,
      when: more("P32"),
    },
    {
      id: "P36.1",
      title: "¿Qué comprobantes de pago emite actualmente?",
      kind: "multiple",
      options: business([
        "Boleta",
        "Factura",
        "Nota de crédito",
        "Ticket",
      ]),
      when: more("P36"),
    },
    {
      id: "P38",
      title: "¿El restaurante cuenta con Licencia Municipal de Funcionamiento vigente?",
      options: business(["Sí", "No", "En trámite"]),
      when: (a) => a.P10 === "Sí",
    },
    {
      id: "P39",
      title: "¿Cuenta con Certificado ITSE (Defensa Civil) vigente para cocina y salón?",
      options: business(["Sí", "No", "En trámite"]),
      when: (a) => a.P10 === "Sí",
    },
  ],
];

const restaurantQuestions: Question[] = [
  ["R01", "¿Se preparan y cocinan alimentos dentro del establecimiento?"],
  ["R02", "¿Se atienden comensales en salón / mesas?"],
  ["R04", "¿Se vende comida para llevar o por reparto a domicilio (delivery)?"],
  ["R09", "¿Se utiliza GLP (balón o tanque de gas), hornos o freidoras industriales?"],
  ["R12", "¿Se expenden bebidas acompañando las comidas?"],
].map(([id, title]) => ({ id, title, options: yes }));

export function visibleQuestions(section: number, answers: Answers): Question[] {
  const base = questions[section] || [];
  const extra = section === 3 ? restaurantQuestions : [];
  const groupedBase =
    section === 0 ? base.filter((q) => q.id !== "P05" && q.id !== "P06") : base;
  return [...groupedBase, ...extra].filter((q) => !q.when || q.when(answers));
}

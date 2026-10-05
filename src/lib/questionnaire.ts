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

export const sectionNames = ["Tu negocio", "Cómo funcionará", "Ventas y tributación", "Situación actual", "Resultado"];

export const questions: Question[][] = [
  [
    { id:"P01", title:"¿Qué tipo de negocio quieres abrir o ya tienes?", help:"Busca y selecciona el rubro más cercano a tu idea. Si no aparece, elige “Otro” y escríbelo.", options:business(["Restaurante / alimentos","Tienda / comercio","Tecnología","Servicios","Construcción","Transporte","Manufactura","Turismo","Hospedaje","Educación","Salud","Belleza","Agropecuario","Importación","Exportación","Entretenimiento","Otro"]) },
    { id:"P02", title:"¿Qué planeas ofrecer cuando empieces?", kind:"text", help:"Cuéntanos con tus palabras qué producto venderás o qué servicio darás. No necesitas haber vendido ni conocer un código CIIU." },
    { id:"P03", title:"¿En qué etapa se encuentra tu negocio?", help:"Elige la respuesta que mejor describe tu situación actual.", options:business(["Solo tengo la idea","Estoy preparando el negocio","Ya realizo algunas ventas","Ya opero regularmente","Estoy formalizado parcialmente","Ya tengo una empresa formalizada"]) },
    { id:"P04", title:"¿Dónde funcionará principalmente tu negocio?", help:"Selecciona la ubicación principal donde operará tu negocio. Usaremos esta información para orientarte sobre requisitos y trámites de tu zona.", kind:"department" },
    { id:"P05", title:"¿En qué provincia?", kind:"province" },
    { id:"P06", title:"¿En qué distrito?", kind:"district", help:"El catálogo de distritos está en ampliación. Si no encuentras el tuyo, podrás escribirlo." },
    { id:"P07", title:"¿Cuántas personas serán propietarias?", options:business(["Solo yo","2 personas","3 personas","4 o más","Aún no está definido"]) },
    { id:"P08", title:"¿Qué aportarán los propietarios?", options:business(["Dinero","Bienes o equipos","Ambos","Todavía no lo definimos","No lo sé"]), when:a=>["2 personas","3 personas","4 o más"].includes(String(a.P07)) },
    { id:"P09", title:"¿Cómo quieres operar legalmente?", help:"Usa la lupita para conocer las dos opciones. Si todavía no te decides, podrás elegirlo y recibir una comparación más detallada en tus recomendaciones.", options:business(["Persona natural","Persona jurídica / empresa","Todavía no lo sé"]) },
  ],
  [
    { id:"P10", title:"¿Tendrás un local físico?", options:business(["Sí","No","Todavía no lo sé"]) },
    { id:"P11", title:"¿Cómo usarás ese local?", options:business(["Propio","Alquilado","Cedido","Compartido","Todavía no lo definí"]), when:more("P10") },
    { id:"P12", title:"¿Atenderás clientes allí?", options:business(["Sí","No","Algunas veces","Aún no lo sé"]), when:more("P10") },
    { id:"P13", title:"¿Tendrás almacén o espacio para guardar productos?", options:yes, when:more("P10") },
    { id:"P14", title:"¿Harás obras o modificaciones importantes en el local?", options:yes, when:more("P10") },
    { id:"P15", title:"¿Cómo funcionará principalmente el negocio?", options:business(["Solo por Internet","Desde mi vivienda","En el domicilio de clientes","De manera ambulante o itinerante","Otro","Aún no lo sé"]), when:a=>a.P10==="No" },
    { id:"P16", title:"¿Qué ofrecerás principalmente?", options:business(["Productos","Servicios","Productos y servicios","Aún no lo sé"]) },
    { id:"P17", title:"Describe tus productos o servicios", kind:"text", help:"Ejemplo: menú diario, platos a la carta y bebidas." },
    { id:"P18", title:"¿Fabricarás tus propios productos?", options:business(["Sí","No","Algunos","No aplica","Aún no lo sé"]) },
    { id:"P19", title:"¿Comprarás productos para revenderlos?", options:business(["Sí","No","Algunos","Aún no lo sé"]) },
  ],
  [
    { id:"P20", title:"Cuando empieces, ¿cuánto esperas cobrar en un mes?", kind:"range", help:"No preguntamos cuánto has vendido hasta ahora. Es una estimación del total que cobrarías antes de restar gastos. Si ofreces cosas con precios distintos, agrega cada producto o servicio por separado en la calculadora. Si aún no tienes idea, puedes elegir “Todavía no puedo estimarlo”." },
    { id:"P21", title:"¿De dónde sale esa cifra?", options:business(["Es una estimación porque aún no inicio","Es aproximadamente lo que vendo hoy","Es un promedio de ventas anteriores","No pude estimarlo"]) },
    { id:"P22", title:"¿A quiénes venderás principalmente?", options:business(["Personas","Empresas","Estado","Personas y empresas","Personas, empresas y Estado","Todavía no lo sé"]) },
    { id:"P23", title:"¿Tus clientes podrían solicitar factura?", help:"Una factura permite al cliente sustentar un gasto o crédito fiscal. Esta respuesta importa para comparar el Nuevo RUS.", options:business(["Sí, frecuentemente","Sí, algunas veces","Probablemente muy pocas veces","No, venderé solo a consumidores finales","No lo sé todavía"]) },
    { id:"P24", title:"¿Cómo esperas recibir pagos?", kind:"multiple", options:business(["Efectivo","Transferencia bancaria","Billetera digital","Tarjeta","Pasarela de pago online","Crédito","Otro","Aún no lo sé"]) },
    { id:"P25", title:"¿Ofrecerás tus productos o servicios por Internet?", help:"Incluye vender productos, recibir pedidos o reservas, o brindar servicios en línea.", options:business(["Sí","No","Tal vez"]) },
    { id:"P25.1", title:"¿Por dónde ofrecerás tus productos o servicios?", help:"Puedes elegir más de una opción.", kind:"multiple", options:business(["Página web propia","Redes sociales","Mercado en línea","Aplicación o plataforma de servicios","WhatsApp","Videollamadas","Correo electrónico","Otro","Aún no lo sé"]), when:more("P25") },
    { id:"P26", title:"¿Venderás fuera de tu ciudad o región?", options:business(["Sí","No","Aún no lo sé"]) },
    { id:"P27", title:"¿Planeas vender al extranjero?", options:business(["Sí","No","Tal vez en el futuro"]) },
    { id:"P28", title:"¿Tendrás trabajadores además de los propietarios?", options:business(["Sí","No","Todavía no lo sé"]) },
    { id:"P29", title:"¿Cuántos trabajadores estimas tener?", kind:"number", when:more("P28") },
    { id:"P29.1", title:"¿Cuántos trabajarían al mismo tiempo en un turno?", kind:"number", help:"Este dato se usa en la evaluación del RER.", when:more("P28") },
    { id:"P30", title:"¿Cómo trabajarían principalmente?", options:business(["Tiempo completo","Tiempo parcial","Temporales","Por temporadas","Combinación","Todavía no lo sé"]), when:more("P28") },
    { id:"P31", title:"¿Alguno realizaría actividades con riesgos especiales?", help:"Por ejemplo maquinaria, químicos, trabajos en altura o altas temperaturas.", options:yes, when:more("P28") },
    { id:"TAX_PURCHASES", title:"¿Cuánto gastarías al mes en productos o materiales para tu negocio?", kind:"number", help:"Cuenta la mercadería que revendes y los ingredientes, materiales o insumos que usas para ofrecer tus servicios. No incluyas alquiler, sueldos ni otros gastos. Si aún no lo sabes, puedes continuar.", optional:true },
    { id:"TAX_ASSETS", title:"¿Cuánto valen los activos fijos del negocio?", kind:"number", help:"Equipos y maquinaria; no incluyas predios ni vehículos. Si no lo sabes, puedes continuar.", optional:true },
  ],
  [
    { id:"P32", title:"¿Actualmente tienes RUC?", options:yes },
    { id:"P33", title:"¿A quién corresponde el RUC?", options:business(["Persona natural","Empresa","No lo sé"]), when:more("P32") },
    { id:"P34", title:"¿Conoces tu régimen tributario actual?", options:yes, when:more("P32") },
    { id:"P34.1", title:"¿En qué régimen estás actualmente?", options:business(["Nuevo RUS","RER","RMT","Régimen General","Otro","No aparece en la lista"]), when:more("P34") },
    { id:"P35", title:"¿Tienes Clave SOL?", help:"Es la clave para realizar trámites en SUNAT por Internet.", options:business(["Sí","No","No sé qué es"]), when:more("P32") },
    { id:"P36", title:"¿Actualmente emites comprobantes de pago?", options:yes, when:more("P32") },
    { id:"P36.1", title:"¿Cuáles emites?", kind:"multiple", options:business(["Boleta","Factura","Nota de crédito","Recibo por honorarios","Otro","No lo sé"]), when:more("P36") },
    { id:"P37", title:"¿Tu negocio ya está constituido legalmente?", options:business(["Sí","No","En proceso","No lo sé"]) },
    { id:"P38", title:"¿Tienes licencia de funcionamiento?", options:business(["Sí","No","En trámite","No aplica / no tengo local","No lo sé"]), when:a=>a.P10==="Sí" },
    { id:"P39", title:"¿Tienes inspección de seguridad del local?", options:business(["Sí","No","En trámite","No aplica","No lo sé"]), when:a=>a.P10==="Sí" },
    { id:"P40", title:"¿Cuentas con permisos propios de tu actividad?", options:business(["Sí","No","No sé si los necesito"]) },
    { id:"P40.1", title:"¿Qué permisos tienes?", kind:"text", when:more("P40") },
  ],
];

const sector: Record<string, Question[]> = {
  "Restaurante / alimentos":[
    ["R01","¿Prepararás alimentos en el establecimiento?"],["R02","¿Manipularás alimentos directamente?"],["R03","¿Se consumirán alimentos en el local?"],["R04","¿Venderás comida para llevar?"],["R05","¿Harás entregas a domicilio?"],["R06","¿Fabricarás alimentos envasados?"],["R07","¿Distribuirás a otras tiendas?"],["R08","¿Tendrás cocina en el local?"],["R09","¿Usarás gas para cocinar?"],["R10","¿Usarás hornos, parrillas o freidoras?"],["R11","¿Necesitarás extracción de humo o ventilación especial?"],["R12","¿Venderás bebidas alcohólicas?"],
  ].map(([id,title])=>({id,title,options:yes})),
  "Tienda / comercio":[
    {id:"C01",title:"¿Qué productos venderás?",options:business(["Alimentos","Ropa","Tecnología","Cosméticos","Ferretería","Hogar","Medicamentos","Otro"])},
    ...[["C02","¿Almacenarás productos?"],["C03","¿Venderás productos importados?"],["C04","¿Venderás productos con posible autorización sanitaria?"],["C05","¿Guardarás sustancias peligrosas?"],["C06","¿Harás reparto de productos?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Servicios:[
    {id:"S01",title:"¿Qué servicio ofrecerás?",options:business(["Tecnología","Consultoría","Contabilidad","Marketing","Reparación","Belleza","Limpieza","Servicio profesional","Otro"])},
    ...[["S02","¿Se requiere título o colegiatura?"],["S03","¿Atenderás en un establecimiento?"],["S04","¿Trabajarás en el domicilio del cliente?"],["S05","¿Usarás equipos especiales?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Hospedaje:[
    {id:"H01",title:"¿Qué alojamiento ofrecerás?",options:business(["Hotel","Hostal","Hospedaje","Casa de huéspedes","Otro"])},
    {id:"H02",title:"¿Cuántas habitaciones tendrá?",kind:"number"},
    ...[["H03","¿Ofrecerás alimentos?"],["H04","¿Tendrás estacionamiento?"],["H05","¿Tendrás piscina, sauna u otros servicios?"],["H06","¿Recibirás turistas extranjeros?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Manufactura:[
    {id:"M01",title:"¿Qué fabricarás?",kind:"text"},
    ...[["M02","¿Usarás maquinaria industrial?"],["M03","¿Usarás sustancias químicas?"],["M04","¿Generarás residuos del proceso?"],["M05","¿Tendrás almacén de materia prima?"],["M06","¿Fabricarás productos para consumo humano?"],["M07","¿Fabricarás alimentos?"],["M08","¿Fabricarás cosméticos?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Agropecuario:[
    {id:"A01",title:"¿Cuál será tu actividad agropecuaria?",options:business(["Agricultura","Ganadería","Crianza","Producción de alimentos","Comercialización","Otro"])},
    ...[["A02","¿Criarás animales?"],["A03","¿Usarás productos químicos agrícolas?"],["A04","¿Procesarás productos antes de venderlos?"],["A05","¿Venderás directamente al consumidor?"],["A06","¿Planeas exportar?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Salud:[
    {id:"SA01",title:"¿Qué servicio de salud ofrecerás?",options:business(["Consultorio","Clínica","Odontología","Psicología","Laboratorio","Farmacia","Otro"])},
    ...[["SA02","¿Atenderán profesionales titulados?"],["SA03","¿Se requiere colegiatura?"],["SA04","¿Almacenarás medicamentos?"],["SA05","¿Harás procedimientos médicos?"],["SA06","¿Generarás residuos biológicos?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Educación:[
    {id:"E01",title:"¿Qué tipo de educación brindarás?",options:business(["Academia","Instituto","Cursos","Clases particulares","Educación inicial","Colegio","Otro"])},
    {id:"E02",title:"¿Cómo serán las clases?",options:business(["Presenciales","Virtuales","Híbridas"])},
    ...[["E03","¿Trabajarás con menores de edad?"],["E04","¿Emitirás certificados?"],["E05","¿Tendrás local para clases?"]].map(([id,title])=>({id,title,options:yes})),
  ],
  Transporte:[
    {id:"T01",title:"¿Qué transportarás?",options:business(["Personas","Mercancías","Entrega","Turismo","Carga","Otro"])},
    {id:"T02",title:"¿Usarás vehículos propios?",options:yes},
    {id:"T03",title:"¿Cuántos vehículos usarás?",kind:"number"},
    {id:"T04",title:"¿Transportarás materiales peligrosos?",options:yes},
    {id:"T05",title:"¿Dónde prestarás el servicio?",options:business(["Local","Regional","Nacional","Más de uno"])},
  ],
  Construcción:[
    {id:"CO01",title:"¿Qué trabajo harás?",options:business(["Construcción","Remodelación","Instalaciones","Electricidad","Gasfitería","Obras civiles","Otro"])},
    ...[["CO02","¿Tendrás trabajadores en obra?"],["CO03","¿Harás trabajos en altura?"],["CO04","¿Usarás maquinaria pesada?"]].map(([id,title])=>({id,title,options:yes})),
    {id:"CO05",title:"¿Quiénes serán tus clientes?",options:business(["Personas","Empresas","Estado","Mixto"])},
  ],
};

export function visibleQuestions(section: number, answers: Answers): Question[] {
  const base = questions[section] || [];
  const extra = section === 3 ? sector[String(answers.P01)] || [] : [];
  const food = section === 3 && answers.P01 === "Hospedaje" && answers.H03 === "Sí" ? sector["Restaurante / alimentos"] : [];
  const groupedBase = section === 0 ? base.filter(q=>q.id !== "P05" && q.id !== "P06") : base;
  return [...groupedBase,...extra,...food].filter(q=>!q.when || q.when(answers));
}

# Crea — Sistema Web de Recomendación de Régimen Tributario

## 📌 Descripción del Proyecto

**Crea** es un sistema web diseñado para guiar y recomendar a potenciales emprendedores de Cajamarca el régimen tributario más adecuado (Nuevo RUS, Régimen Especial - RER, Régimen MYPE Tributario - RMT o Régimen General) para su actividad económica.

A través de un cuestionario interactivo de cinco etapas y un motor de reglas de decisión determinístico desacoplado de la interfaz, el sistema evalúa las características del negocio (estimación de ingresos, compras, cantidad de trabajadores, personería natural o jurídica, y actividad económica) y ofrece una ruta de formalización con enlaces oficiales y trazables a entidades públicas (SUNAT, SUNARP, Indecopi y Municipalidades).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| --- | --- |
| **Framework Web** | Next.js (App Router) con React y TypeScript |
| **Estilos y UI** | Tailwind CSS |
| **Motor de Reglas** | Motor de decisión en TypeScript puro desacoplado de la UI (`src/lib/rule-engine.ts`) |
| **Base de Datos** | Supabase (PostgreSQL) con políticas de acceso por fila (RLS) |
| **Testing** | Vitest para pruebas unitarias automatizadas |

---

## 📂 Estructura del Código

```text
├── public/                 # Recursos estáticos e imágenes
├── src/
│   ├── app/                # Rutas y páginas de la aplicación (Next.js App Router)
│   │   ├── api/            # Endpoints de diagnóstico y guardado de contexto
│   │   ├── negocios/       # Cuestionario interactivo y visualización de rutas
│   │   ├── requisitos/     # Fichas técnicas de obligaciones y trámites
│   │   └── admin/          # Consola de administración y catálogo de fuentes
│   ├── components/         # Componentes modulares de interfaz (asistente, dashboard, guías)
│   └── lib/                # Motor de reglas de decisión, catálogo tributario y utilidades
├── supabase/               # Esquema de base de datos relacional y scripts de inicialización
│   ├── migrations/         # Migraciones SQL estructuradas (tablas, RLS, triggers)
│   └── seed.sql            # Datos iniciales (instituciones, CIIU, fuentes normativas)
└── tests/                  # Pruebas unitarias automatizadas del motor de reglas
```

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias

```bash
pnpm install
# o con npm:
npm install
```

### 2. Configuración de variables de entorno

Copia el archivo de ejemplo a un archivo local:

```bash
cp .env.example .env.local
```

Configura las variables de tu instancia de Supabase en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica-anon
```

> **Nota:** La aplicación cuenta con un modo de demostración local tolerante que permite explorar el cuestionario, evaluar las reglas de decisión y generar la ruta de formalización incluso sin conexión a Supabase.

### 3. Ejecutar el servidor de desarrollo

```bash
pnpm dev
# o con npm:
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con la aplicación.

---

## 🧪 Pruebas Automatizadas y Verificación de Calidad

El proyecto incluye pruebas unitarias para certificar la precisión del motor de reglas tributarias y las condiciones de elegibilidad:

```bash
# Ejecutar suite de pruebas unitarias
npx vitest run

# Análisis estático de código (linter)
npm run lint

# Compilación para producción
npm run build
```

---

## 🗄️ Base de Datos (Supabase)

Para desplegar la base de datos completa:
1. En el editor SQL de Supabase, ejecuta [`supabase/migrations/20261001000000_initial_schema.sql`](supabase/migrations/20261001000000_initial_schema.sql) para crear las tablas, relaciones y políticas RLS.
2. Ejecuta [`supabase/seed.sql`](supabase/seed.sql) para cargar las fuentes oficiales, entidades públicas y actividades económicas.

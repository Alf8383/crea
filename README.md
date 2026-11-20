# CREA

CREA orienta a propietarios y administradores de restaurantes de Cajamarca. Evalúa la compatibilidad con NRUS, RER, RMT y Régimen General, explica los requisitos con fuentes oficiales de SUNAT y permite simular pagos, organizar tareas y guardar un diagnóstico en PDF. El módulo académico corresponde a una tesis de Ingeniería de Sistemas Computacionales de la Universidad Privada del Norte.

[Decisiones de diseño, auditoría y pruebas](docs/rediseno-crea.md) · [Configuración del estudio](docs/estudio.md)

## Desarrollo local

El entorno verificado usa Node.js 24 y pnpm 11. Se puede usar Corepack o una instalación de pnpm existente.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Abre [CREA en localhost](http://localhost:3000). El archivo de ejemplo activa el modo demostración de forma explícita. Puedes completar un formulario vacío o abrir un ejemplo identificado desde «Mi espacio». En este modo, las evaluaciones se guardan en la pestaña y el acceso a cuentas, administración e investigación queda deshabilitado. Consulta el [recorrido gastronómico por etapas](docs/gastronomia-por-etapas.md) para revisar la clasificación CIIU, la ruta de formalización y el asistente opcional.

Con un proyecto Firebase de desarrollo, completa las variables web en `.env.local` y cambia `NEXT_PUBLIC_CREA_DEMO` a `false`. Habilita los proveedores correo/contraseña y Google en Firebase Authentication. Las evaluaciones guardadas con una cuenta se conservan en Firestore. Los roles se asignan mediante custom claims de Firebase Admin SDK.

## Verificaciones

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Para usar Chrome instalado, configura `CREA_BROWSER_CHANNEL=chrome`. La suite inicia un servidor de demostración en el puerto 3100. Si ya se ejecuta un servidor de CREA en demostración, indica su URL local con `CREA_E2E_URL`.

Pruebas de permisos en el emulador local, con Java disponible:

```sh
pnpm dlx firebase-tools emulators:exec --only firestore --project demo-crea "pnpm test:rules"
```

Para probar Auth y Firestore mediante navegador, inicia ambos emuladores con `--only auth,firestore --project demo-crea`, usa el ID `demo-crea`, un API key ficticio, `NEXT_PUBLIC_CREA_EMULATORS=true` y `NEXT_PUBLIC_CREA_DEMO=false`. Ejecuta `pnpm test:e2e:firebase` con ambos emuladores activos para recorrer registro, persistencia, administración y estudio. La aplicación solo admite conexión a emuladores mediante loopback y un ID que empiece por `demo-`.

## Firebase Hosting

`pnpm build` exporta el sitio a `out/`. `firebase.json` conserva el sitio de Firebase Hosting `creaperu`, las URLs limpias, la compatibilidad con enlaces anteriores y la ruta a `firestore.rules`. El cliente usa las variables `NEXT_PUBLIC_*` disponibles al compilar. Al preparar un entorno real, desactiva ambos modos locales, configura los dominios y proveedores de Auth, y publica primero las reglas revisadas en el entorno autorizado. La aplicación exportada se puede previsualizar en el emulador de Hosting.

El código conserva la exportación estática para el Hosting que sirve el sitio publicado. La antigua configuración de App Hosting quedó en el historial de Git. Los SQL históricos de Supabase no forman parte del entorno en ejecución.

## Estructura

| Ubicación | Responsabilidad |
| --- | --- |
| `src/app` | Rutas, metadatos, estilos globales y shell compartido. |
| `src/components/ui` | Primitivas shadcn/ui con Base UI y estilos CREA. |
| `src/components/layout` | Cabecera, marca, navegación y pie. |
| `src/features/evaluation` | Validación y captura, comparador, visualización de resultados. |
| `src/features/workspace` | Evaluaciones guardadas, simulación, calendario, tareas, guías, asistente y reporte. |
| `src/features/auth`, `admin`, `research` | Sesión, catálogo normativo y protocolo académico. |
| `src/lib` | Motor y catálogo, calendario, estimaciones, armado del informe e instrumento. |
| `src/lib/firebase`, `firestore.rules` | SDK, adaptadores de persistencia y reglas de acceso. |
| `tests` | Recorridos de navegador y pruebas de permisos en emulador. |

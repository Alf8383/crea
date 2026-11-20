# CREA para negocios gastronómicos en Cajamarca

## Auditoría y recuperación

La rama parte del rediseño de `main` publicado en `aa5ab49`. El árbol coincide con `680db48`, la rama de rediseño que estaba abierta en el equipo. Se revisó el historial del commit `3ce96c5`, fechado el 23 de octubre de 2026. El cuestionario anterior tenía una pregunta de etapa en `P03`, preguntas condicionales sobre operación y formalización, ventas estimadas y una calculadora por producto en la portada. El panel anterior combinaba trámite, clasificación y simulación.

Se recuperaron esos recorridos en el cuestionario y espacio de trabajo actuales, con los componentes compartidos de Next.js, Base UI y Tailwind. El motor, la autenticación y el guardado explícito en Firebase siguen siendo los puntos de entrada del diagnóstico y la persistencia. Las fichas anteriores se pueden abrir y editar. Cambiar la etapa habilita los datos nuevos sin asignar un CIIU por similitud textual.

## Recorrido

1. Elige si tienes una idea, estás preparando el negocio, ya operas o estás formalizado. Si aún no inicias, el formulario ofrece proyecciones y datos desconocidos. Cuando ya operas, pregunta por la inscripción y muestra el régimen si procede.
2. Describe qué ofreces, distingue la actividad principal y confirma el CIIU. El catálogo incluido abarca siete clases gastronómicas de la revisión 4 del INEI. Palabras clave o un modelo pueden sugerir candidatos. Las respuestas sobre operación y la confirmación del usuario controlan qué código se registra. Para actividades que requieren una clase fuera del catálogo, el resultado queda pendiente.
3. Indica de dónde vienen las ventas y las compras. Usa la calculadora para sumar productos, pedidos diarios, días de atención y temporadas. Puedes transferir la venta bruta anual y el mes de mayor venta al formulario, o elegir el mes que quieres llevar al simulador. Si indicas qué IGV está incluido en los precios, el formulario también puede calcular las ventas netas.
4. Revisa el resumen y cada condición del Nuevo RUS, RER, RMT y Régimen General. El Nuevo RUS usa ventas y adquisiciones brutas. El RER y el RMT usan ingresos netos, y las compras del RER excluyen activos fijos. Las reglas de domicilio, actividades excluidas y el límite del ejercicio anterior del RMT tienen referencias propias.
5. Abre la ruta de formalización. La ubicación, el tipo de persona, el CIIU, el local, su clasificación de riesgo y los trabajadores determinan los pasos. El checklist conserva su avance por evaluación y cuenta en la pestaña. Para explorar sin datos reales, abre `Ejemplos`.

El diagnóstico se limita al ejercicio 2026. Los cálculos de impuestos son estimaciones de un escenario mensual, con supuestos visibles para compras acreditables, tasa especial y anticipos. La compatibilidad se evalúa aparte con los datos del ejercicio y el catálogo versionado.

## Archivos principales

| Función | Archivos |
| --- | --- |
| Nube y ayuda contextual | `src/app/layout.tsx`, `src/features/assistant/cloud.tsx`, `src/lib/assistant-topics.ts` |
| Cuestionario y CIIU | `src/features/evaluation/assessment.ts`, `business-wizard.tsx`, `classification.tsx`, `src/lib/ciiu-catalog.ts` |
| Motor y reporte | `src/lib/rule-engine.ts`, `seed-catalog.ts`, `report-generator.ts` |
| Proyección y simulación | `src/lib/sales-projection.ts`, `tax-simulator.ts`, `src/features/workspace/projection-calculator.tsx` |
| Ruta de formalización | `src/lib/formalization.ts`, `src/features/workspace/formalization-route.tsx` |
| Ejemplos | `src/lib/demo-presets.ts`, `src/features/workspace/examples.tsx` |
| Integración opcional de modelo | `server/assistant.mjs` |

## Fuentes contrastadas

- CIIU Rev. 4, notas de la división 56 y clases de elaboración incorporadas. [Manual del INEI](https://www.inei.gob.pe/media/MenuRecursivo/publicaciones_digitales/Est/Lib0883/Libro.pdf) · [Tabla oficial](https://cdn.www.gob.pe/uploads/document/file/1348266/Tabla_Oficial_CIIU_Rev4.pdf).
- Condiciones, topes y actividades excluidas. [Nuevo RUS](https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/nuevo-regimen-unico-simplificado-nuevo-rus) · [RER](https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimen-especial-renta-rer) · [D. Leg. 1269](https://www.sunat.gob.pe/legislacion/mypeIR/dl1269.pdf) · [Comparación SUNAT](https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios).
- UIT y tasas del ejercicio. [MEF, UIT 2026](https://www.gob.pe/institucion/mef/noticias/1314665-mef-establece-en-s-5500-el-valor-de-la-uit-para-el-ano-2026) · [SUNAT, reducción del IGV](https://orientacion.sunat.gob.pe/reduccion-del-igv-para-restaurantes-hoteles-y-alojamiento-turisticos-1).
- Trámites y condiciones sanitarias. [Ordenanza de licencias de Cajamarca](https://www.gob.pe/institucion/municajamarca/normas-legales/5518154-om_895-2024) · [ITSE previa para riesgo alto o muy alto](https://www.gob.pe/20866-obtener-licencia-de-funcionamiento-para-negocios-de-riesgo-alto-o-muy-alto) · [MINSA, restaurantes y afines](https://www.digesa.minsa.gob.pe/normaslegales/normas/rm_822-2018-minsa.pdf) · [MINSA, alimentación colectiva](https://www.gob.pe/institucion/minsa/normas-legales/1635426-157-2021-minsa) · [DIGESA, registro sanitario](https://www.digesa.minsa.gob.pe/Orientacion/REGISTRO_SANITARIO.pdf).

## Verificación local

Instala dependencias con `pnpm install --frozen-lockfile` y ejecuta `pnpm dev`. Para probar sin Firebase, configura `NEXT_PUBLIC_CREA_DEMO=true` en `.env.local`. Abre [CREA en localhost](http://localhost:3000), inicia una evaluación y recorre el diagnóstico, el simulador, la formalización, los reportes y las guías.

La nube funciona con contenido local verificado. La ayuda del espacio de trabajo usa recuperación de fragmentos de SUNAT y datos del diagnóstico procesados en el navegador. La conversación de la nube permanece en memoria durante la navegación y permite borrarla. El módulo de investigación muestra la nube con la asistencia deshabilitada. No se adjuntó el protocolo aprobado para un contraste metodológico. Se conservaron la configuración de 36 participantes y 18 preguntas, el instrumento y las reglas de Firestore.

Para probar el modelo opcional en Node.js 24, define `CREA_ASSISTANT_ORIGIN=http://localhost:3000`, `CREA_ASSISTANT_MODEL` y `OPENAI_API_KEY` para el servidor. Configura `NEXT_PUBLIC_CREA_ASSISTANT_URL=http://127.0.0.1:3200/api/crea-assistant` y ejecuta `pnpm assistant` en otra terminal. En un entorno alojado, publica el proceso por HTTPS mediante un proxy y configura presupuestos y límites del proveedor. El servidor solo acepta una pregunta o la descripción elegida por el usuario, filtra identificadores evidentes, limita tamaño y frecuencia, y descarta salidas fuera del catálogo de temas. El modelo propone identificadores, y la aplicación muestra el contenido y las fuentes que ya tiene asociados a ellos. La compilación estática y la ayuda local funcionan con el backend apagado.

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:assistant
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e --timeout=90000
pnpm dlx firebase-tools emulators:exec --only auth,firestore --project demo-crea "pnpm test:rules && pnpm test:e2e:firebase --timeout=360000"
```

Los recorridos del emulador crean y califican participantes ficticios en el proyecto local `demo-crea`. Usa un emulador aislado. Si el puerto predeterminado de Firestore está ocupado, cambia el puerto en una copia local de `firebase.json` y pásala a `emulators:exec` con `--config`. El comando comunica el puerto a las pruebas a través de `FIRESTORE_EMULATOR_HOST`. Si el servidor web de pruebas ya está iniciado con la configuración del emulador, `CREA_FIREBASE_E2E_URL` permite reutilizarlo con una URL local.

## Resultados de la verificación

| Comando | Resultado |
| --- | --- |
| `pnpm typecheck` y `pnpm lint` | Completados correctamente. |
| `pnpm test` | 37 pruebas aprobadas. |
| `pnpm test:assistant` | 3 casos aprobados con respuestas simuladas del proveedor. Incluyen el modo sin proveedor, el rechazo de datos no admitidos y los límites de frecuencia. |
| `pnpm build` | 21 páginas generadas para el sitio estático. |
| `pnpm test:e2e` | 33 casos aprobados sobre la exportación estática, en escritorio, tableta y móvil. Incluye auditorías Axe y navegación por teclado. Se repitió el caso de la primera etapa en los tres tamaños tras el ajuste de espacio de la nube. |
| `pnpm test:rules` | 3 casos aprobados en Firestore Emulator. |
| `pnpm test:e2e:firebase` | 1 recorrido aprobado con Auth y Firestore en el proyecto local `demo-crea`. Cubre registro, acceso administrativo, persistencia de una evaluación, pretest, postest, restricción del asistente y exportación CSV con datos ficticios. |

Se comprobó también que el panel abierto conserva su conversación al cambiar de ruta, que el movimiento reducido desactiva su animación y que la nube deja espacio para los botones del cuestionario en los tamaños verificados.

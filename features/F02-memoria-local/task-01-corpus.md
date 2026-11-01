# task-01 — Corpus y expectativas congelados antes de búsqueda
repo: Flucastr.Memory-AI   depende_de: —   estado: borrador

## Descripción
Corpus y expectativas congelados antes de búsqueda para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): fixtures/f02/corpus.json, fixtures/f02/queries.json, fixtures/f02/baseline.txt. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Crear los tres archivos nuevos indicados, sin implementar producto. Corpus: array JSON de 30 objetos con id, type (decision/learning/resolved-blocker/rule), scope (general o project:<nombre>), text, origin y date ISO. Usar dos proyectos ficticios como mínimo y presencia de los cuatro tipos y ámbito general; ningún secreto ni dato real.
2. Fijar diez consultas {scope, query, expectedIds}, con expectedIds no vacío e IDs del ámbito permitido; incluir consultas generales y de ambos proyectos y términos naturales inequívocos. No ajustar esperados para hacer pasar un ranking posterior.
3. Baseline: concatenar text de los 30 objetos en orden del array con un salto LF tras cada texto. Registrar conteos y revisión manual de plausibilidad en Evidencia; cualquier cambio posterior de expectativas requiere revisión humana.

## Criterios de aceptación
- Comprobar conteos 30/10, referencias válidas, composición de ámbitos/tipos y baseline exacto mediante inspección y registrar resultados. El gate automático se incorpora en task-07.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
(lo llena el constructor; incluir comandos, resultados y límites observados, no resultados supuestos)

## Notas
(lo llena el constructor; dejar firmas y rutas finales para tareas dependientes)

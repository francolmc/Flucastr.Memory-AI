# task-03 — Sustitución, archivo y contradicciones explícitas
repo: Flucastr.Memory-AI   depende_de: F02-task-02   estado: aprobada

## Descripción
Sustitución, archivo y contradicciones explícitas para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): src/memory.ts, test/memory.test.ts. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Extender save con replacesId opcional: nuevo ID, referencia existente del mismo ámbito, no autorreferencias; conservar anterior sin archivarlo automáticamente. Idempotencia incluye la referencia.
2. Añadir markConflict(ids), resolveConflict(ids,{confirmedByFranco:true}) y archive(id,{confirmedByFranco:true}). Señal explícita persistente de conflicto en cada implicado; marcar no decide cuál es verdadero. Rechazar IDs inexistentes y operaciones de conflicto entre proyectos distintos. Confirmaciones ausentes fallan; archivar conserva datos.
3. Probar transacciones, reapertura y referencias inválidas; no detección semántica automática, vencimiento ni borrado. Exponer estado archived y conflict en recuerdos para búsqueda posterior.

## Criterios de aceptación
- Probar conflictos persistentes hasta resolución explícita, archivo sin borrado y sustitución sin sobrescribir ni resolver automáticamente.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
(lo llena el constructor; incluir comandos, resultados y límites observados, no resultados supuestos)

## Notas
(lo llena el constructor; dejar firmas y rutas finales para tareas dependientes)

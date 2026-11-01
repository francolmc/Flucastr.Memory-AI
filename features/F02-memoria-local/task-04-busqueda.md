# task-04 — Búsqueda FTS5 aislada y determinista
repo: Flucastr.Memory-AI   depende_de: F02-task-01, F02-task-03   estado: borrador

## Descripción
Búsqueda FTS5 aislada y determinista para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): src/memory.ts, test/search.test.ts. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Añadir search({scope,query}) con FTS5 y sincronización transaccional del índice. Preparar el conjunto buscable por scope y archived=false ANTES del MATCH/ranking; nunca obtener candidatos globales para filtrarlos después. Proyecto permite ese proyecto+general; general solo general.
2. Tratar consulta como términos literales, no SQL ni sintaxis FTS arbitraria: extraer palabras Unicode, escapar términos y unir con AND; consulta sin términos produce vacío. Orden bm25 ascendente y desempate por id ascendente. Sin coincidencias devuelve [].
3. Recuperar candidatos ordenados para posterior empaquetado; incluir estado de conflicto y referencias. Probar corpus fijado sin modificar sus esperados, aislamiento (incluyendo coincidencias ajenas mejor puntuadas), archivados, Unicode y entradas hostiles.

## Criterios de aceptación
- Cada una de las diez consultas tiene al menos un expectedId entre los primeros cinco; pruebas negativas demuestran que general no ve proyectos y un proyecto no ve otro.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
(lo llena el constructor; incluir comandos, resultados y límites observados, no resultados supuestos)

## Notas
(lo llena el constructor; dejar firmas y rutas finales para tareas dependientes)

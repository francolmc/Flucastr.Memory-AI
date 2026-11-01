# task-04 — Búsqueda FTS5 aislada y determinista
repo: Flucastr.Memory-AI   depende_de: F02-task-01, F02-task-03   estado: lista para revisión

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
2. Tratar consulta como términos literales, no SQL ni sintaxis FTS arbitraria: usar unicode61 sin Porter ni eliminación de stopwords; extraer palabras Unicode, conservar escapes de términos y unir TODOS los términos con AND. Consulta sin términos produce vacío. Conservar orden bm25 ascendente, desempate por id ascendente y primeros cinco resultados. Sin coincidencias devuelve [].
3. Recuperar candidatos ordenados para posterior empaquetado; incluir estado de conflicto y referencias. Probar corpus fijado sin modificar sus esperados, aislamiento (incluyendo coincidencias ajenas mejor puntuadas), archivados, Unicode y entradas hostiles.

## Enmienda aprobada y recongelación del benchmark
Confirmado por el encargo: Franco aceptó la opción A y estas siete sustituciones con «ok, vamos con ello» tras recomendación explícita. Identificador de recongelación: `F02-search-v2-unicode61-AND`; versión anterior: `F02-search-v1-original` (identificador retrospectivo). Motivo: corregir consultas incompatibles con AND literal, no relajar esperados ni adaptar ranking para aprobar. Esta enmienda documenta una decisión aprobada; no cambia el estado de la tarea ni acredita revalidación.

**Orden obligatorio para el constructor:** antes de tocar código o revalidar, aplicar únicamente los siete valores `query` de la tabla en `fixtures/f02/queries.json`, por posición (Q1 es el primer elemento). Conservar Q5/Q7/Q10, todos los `scope` y `expectedIds`, orden y corpus completo. Este ajuste documental NO modifica fixtures.

| Posición | Consulta anterior (v1) | Consulta aprobada (v2) |
|---|---|---|
| Q1 | credentials in logs | credentials logs |
| Q2 | preserve replaced decisions | preserve replaced decision |
| Q3 | rebuild stale generated output before tests | stale generated build before tests |
| Q4 | ask before recording cross-project rules | ask before saving rule projects |
| Q6 | ISO date format for imports | ISO dates format import |
| Q8 | UTC event times and local display | UTC event times and local displays |
| Q9 | retry duplicate reminders identifier | duplicate reminders original event identifier |

Consultas conservadas: Q5 `CSV finance reports`; Q7 `nightly worker output folder permission`; Q10 `daylight saving hour bug`. Referencia íntegra v1: SHA-256 de `fixtures/f02/queries.json` = `0f5193e5ba3bbe1fa1a3899686b839f73606792898cab4d1557aed06b8f64d6e`. Corpus inmutable: SHA-256 de `fixtures/f02/corpus.json` = `4e7e184147a0d8779c67a38dd897e8ff3a3afc58d0f9b189b5b7077922297fa3`. Ambos calculados por lectura antes del ajuste. Tras aplicar la tabla, registrar aquí el hash efectivo v2 y comprobar diferencia exclusivamente en esas siete cadenas, antes de código/pruebas; desde ese punto queda congelado v2. Hash v2 registrado antes de tocar implementación/revalidar: `df13860f5b16a04d23ac660f829793ee9a5a57d79645dd47c9a897bf2b515290`; corpus sigue en `4e7e184147a0d8779c67a38dd897e8ff3a3afc58d0f9b189b5b7077922297fa3`. No presentar resultados v1 como resultados v2.

### Correcciones y pruebas pendientes independientes del benchmark
- Aislamiento del ranking: construir el conjunto elegible (ámbito permitido y no archivados) antes de calcular bm25; un filtro de filas sobre estadísticas FTS globales no demuestra aislamiento. Probar que añadir coincidencias ajenas o archivadas, incluso mejor puntuadas, no altera puntuaciones ni orden elegibles; general no ve proyectos y un proyecto no ve otro.
- Tokenizador y bases existentes: retirar Porter y migrar el índice a unicode61, reindexando también recuerdos persistidos antes de la migración, sin perder datos ni referencias. Probar reapertura de una base existente con índice anterior y una base nueva; ambas deben buscar con la misma semántica, sin exigir recreación manual de la base.
- Pruebas separadas del benchmark: Unicode, desempate por id con igual bm25, consultas independientes sin arrastre de términos/estado entre llamadas, consulta vacía o sin términos, términos ausentes, archivados, aislamiento y entradas hostiles (escapes/sintaxis FTS literal). Comprobar AND de todos los términos, sin stemming ni supresión de stopwords. Estas correcciones no quedan resueltas por cambiar las siete consultas.
- Solo después de aplicar y registrar la recongelación, corregir implementación y ejecutar la verificación ya prescrita. Registrar resultados nuevos con identificador v2, sin borrar fallos históricos ni cambiar el criterio top cinco, scopes, esperados o límite de respuesta. En este ajuste no se ejecutan pruebas.

## Criterios de aceptación
- Cada una de las diez consultas tiene al menos un expectedId entre los primeros cinco; pruebas negativas demuestran que general no ve proyectos y un proyecto no ve otro.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
- Histórica v1: `npm run verify` — código 1 en tres intentos; typecheck/build pasan, pero la prueba congelada falla en consultas cuyo expected no satisface búsqueda AND literal. No llega a help/doctor. Se conserva como evidencia histórica, no revalidación v2.
- Recongelación v2 `F02-search-v2-unicode61-AND`: `fixtures/f02/queries.json` SHA-256 `df13860f5b16a04d23ac660f829793ee9a5a57d79645dd47c9a897bf2b515290`; corpus SHA-256 intacto `4e7e184147a0d8779c67a38dd897e8ff3a3afc58d0f9b189b5b7077922297fa3`; diff contiene solo siete valores query aprobados; Q5/Q7/Q10, scopes, expectedIds y orden conservados.
- `npm run verify` — código 0. typecheck y build pasan; 11 pruebas pasan (0 fallos), incluida búsqueda de las diez consultas, aislamiento de scope, archivados, Unicode/términos sin stemming ni supresión de stopwords, AND literal, entradas hostiles, desempate, llamadas independientes y migración/reconstrucción desde índice Porter existente preservando datos; CLI help y doctor correctos (`sqliteVersion` 3.51.3, `fts5: true`). Linux; macOS no verificado.

## Notas
La implementación añade `MemoryStore.search({scope,query})` con FTS5, filtro previo por ámbito/archivo, orden bm25/id y porter unicode61; índice insertado transaccionalmente junto al recuerdo. Diagnóstico histórico: se introdujo Porter para intentar dar correspondencia léxica a consultas/recuerdos; eso no resolvió términos ausentes y no satisface el contrato literal decidido. Las expectativas congeladas v1 contienen términos ausentes de sus recuerdos esperados, incompatibles con AND literal; en aquellos intentos no se modificaron fixtures ni se relajó el criterio. Decisión aprobada posterior: aplicar la enmienda v2 anterior y usar unicode61 sin Porter ni eliminación de stopwords. Pendientes de implementación y prueba: aislamiento real del ranking elegible, migración/reindexado de bases existentes y pruebas independientes indicadas arriba. La evidencia de los tres intentos fallidos y el registro siguiente se conservan como históricos, no como revalidación v2.

Registro: n=2; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

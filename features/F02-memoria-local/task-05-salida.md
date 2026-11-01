# task-05 — Respuesta JSON acotada sin truncar recuerdos
repo: Flucastr.Memory-AI   depende_de: F02-task-04   estado: hecha

## Descripción
Respuesta JSON acotada sin truncar recuerdos para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): src/response.ts, src/index.ts, test/response.test.ts. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Crear serializeSearch(candidates): string, exportar desde index. Formato único JSON {memories:[objetos completos]} más LF final, sin indentación. Incluir metadatos, referencias y señales de conflicto; nunca texto cortado.
2. Recorrer candidatos en orden; agregar solo si respuesta completa con LF queda <=4000 bytes mediante Buffer.byteLength(...,"utf8"); omitir entero el que no cabe y continuar con siguientes hasta cinco. La salida vacía es {"memories":[]} más LF.
3. Probar límites exactos, multibyte, escapes JSON, objeto individual demasiado grande, cinco máximos y preservación íntegra de cada objeto. Este serializador es compartido por CLI y gate.

## Criterios de aceptación
- Todas las respuestas <=4000 bytes incluyendo LF; casos exactos 4000 y exceso por un byte; sin truncamiento y máximo cinco.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
- `npm run verify` — código 0. Typecheck y build pasan; 13 pruebas pasan (0 fallos), incluidas dos nuevas del serializador. CLI help y doctor correctos; doctor reporta SQLite 3.51.3, FTS5 true. Linux; macOS no verificado.
- Pruebas del serializador observan salida vacía `{"memories":[]}\n` (16 bytes), respuesta exacta de 4000 bytes con contenido multibyte, exclusión íntegra al exceder un byte, conservación de escape/Unicode, omisión de objeto sobredimensionado y máximo cinco completos.

## Notas
API final: `serializeSearch(candidates: readonly StoredMemory[]): string`, exportada desde `src/index.ts`; implementación en `src/response.ts`. Formato `{"memories":[...]}\n`, incluye campos completos (incluye conflicto y referencias); al omitir un candidato sigue evaluando los siguientes hasta cinco inclusiones.

Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

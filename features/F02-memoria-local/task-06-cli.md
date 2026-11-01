# task-06 — CLI local de memoria sobre el núcleo
repo: Flucastr.Memory-AI   depende_de: F02-task-05   estado: hecha

## Descripción
CLI local de memoria sobre el núcleo para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): src/cli.ts, test/cli.test.ts, README.md. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Mantener --help y doctor. Añadir save --db PATH --input PATH [--confirm-general-rule], search --db PATH --scope SCOPE --query TEXT, archive --db PATH --id ID --confirm-franco, conflict --db PATH --ids ID1,ID2 y resolve-conflict --db PATH --ids ID1,ID2 --confirm-franco. Rutas explícitas; sin base predeterminada ni credenciales.
2. save lee un objeto JSON del contrato; sustitución usa replacesId. CLI delega validación y mutaciones al núcleo. search escribe exactamente el serializador, sin banners en stdout. Mutaciones devuelven JSON mínimo con id/estado y LF; errores sanitizados en stderr, código 1; uso incorrecto código 2. Cerrar DB en finally.
3. Probar con procesos separados y DB temporal: guardar/reintentar/buscar, rechazo sin confirmación, colisión, sustitución, conflicto/resolución y archivo. Actualizar test de ayuda antiguo y documentar comandos y límites sin afirmar soporte macOS.

## Criterios de aceptación
- Tests spawn comprueban persistencia entre procesos, stdout JSON y errores no cero; doctor y ayuda siguen pasando.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
- Histórica: `npm run verify` — intentos 1 y 2, ambos código 1: typecheck/build pasan; prueba CLI spawn falla en ciclo persistencia/conflicto/archivo (13/14 pasan en segundo intento). Help/doctor finales no completados; Linux, macOS no verificado.
- Diagnóstico aislado previo: `node --test --test-name-pattern='CLI persists, searches, confirms, conflicts, resolves, replaces and archives via separate processes' dist/test/cli.test.js` falló en `dist/test/cli.test.js:63:16` (`test/cli.test.ts:39`), esperaba 0 y obtuvo 1 tras archivar `cli-1`.
- Contrato ARCHITECTURE §Decisiones y BACKLOG F02: sustitución conserva nuevo ID y referencia anterior, archivo no borra y excluye archivado de búsqueda normal; no establece cascada de archivo. Prueba corregida: búsqueda `replacement` devuelve `cli-2` exclusivamente; búsqueda `persistent` no devuelve `cli-1` archivado.
- `npm run verify` (reanudación, intento completo 1): código 0; typecheck/build pasan; TAP 14/14, prueba CLI incluida; help y doctor pasan (`sqliteVersion: 3.51.3`, `fts5: true`). Advertencias de SQLite experimental; Linux solamente.

## Notas
Diagnóstico: la aserción anterior de cero resultados con consulta `persistent` no acreditaba visibilidad del reemplazo, cuyo texto es `replacement`. Aserciones ahora verifican que `cli-1` archivado no aparezca y que al buscar el texto nuevo aparezca exclusivamente `cli-2`; archivo es explícito, no cascada. Se cambió `test/cli.test.ts`; no scripts.

Registro: n=2; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

## Estado
lista para revisión

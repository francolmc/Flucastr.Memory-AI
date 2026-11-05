# task-02 — Persistencia e identidad del emisor
repo: Flucastr.Memory-AI   depende_de: F02-task-01   estado: hecha

## Descripción
Persistencia e identidad del emisor para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): src/memory.ts, src/index.ts, test/memory.test.ts. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Crear src/memory.ts con openMemory(path), save(input,{confirmGeneralRule}), close(); exportar desde src/index.ts sin alterar probeSqlite. Usar DatabaseSync node:sqlite y sentencias parametrizadas, transacción y esquema versionado inicial. No depender de CLI.
2. Validar la entrada conforme al contrato normativo aprobado en definitions/ARCHITECTURE.md §Decisiones, subsección «Contrato mínimo de entrada F02», incluidos campos, tipos, ámbitos, fecha civil y confirmación explícita para regla general; denegar antes de escribir. Persistir todos los campos y orden canónico para comparar igualdad de entradas, no igualdad de texto.
3. ID único: entrada idéntica devuelve mismo recuerdo sin nueva fila; cualquier campo distinto con mismo ID falla sin mutación. Dos IDs distintos con texto igual se conservan. Pruebas con archivo temporal, cerrar/reabrir y limpieza garantizada.

## Criterios de aceptación
- Pruebas de persistencia tras reapertura, reintento, colisión, texto repetido y regla general rechazada/confirmada; errores sin escrituras parciales.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. La comprobación específica del objetivo se incorpora a node:test, salvo fixtures de task-01 cuya inspección queda registrada y será automatizada en task-07.

## Evidencia
Ejecución detenida antes de modificar código: la tarea exige validar «campos del contrato de task-01», pero el único dato permitido de F02-task-01 en sus Notas son rutas/tamaños de fixtures y que la automatización queda pendiente; no especifica campos ni tipos. El refinado y contrato reproducido en esta tarea definen identidad, ámbitos, confirmación y comportamiento, pero no el esquema de entrada ni formato/semántica de fecha. No se ejecutó `npm run verify`.

Reanudación tras aprobación explícita y resolución documental: implementado el contrato referenciado en ARCHITECTURE.md, sin añadir reglas de fecha. `npm run verify` — código 0; typecheck y build pasaron; TAP `# tests 7`, `# pass 7`, `# fail 0`; ayuda CLI correcta; doctor produjo `{"sqliteVersion":"3.51.3","fts5":true}`. Node emitió advertencia de SQLite experimental. Evidencia solo observada en Linux; no se atribuye validación macOS.

## Notas
Escalación de alcance: definir inventando campos/tipos incumpliría la validación explícita contra el contrato de task-01 y podría fijar un esquema incompatible. No se modificó código; no se ejecutó verificación.
Registro: n=1; herramienta=pi; modo=normal; intentos=0; verificacion=falla; huecos=0; resultado=escalada; causa=alcance
Actualización documental: el contrato mínimo de entrada F02 aprobado explícitamente por Franco, incorporado en definitions/ARCHITECTURE.md §Decisiones, subsección «Contrato mínimo de entrada F02», resuelve el bloqueo previo por ausencia de esquema. El punto 2 de Pasos referencia ahora ese contrato normativo. Se conservan la evidencia y el registro anteriores; el estado de la tarea no cambia y corresponde al coordinador actualizarlo con aprobación.
Reanudación: esquema SQLite versionado en user_version=1 y operación save transaccional; validación estricta de seis propiedades, tipos, scope, fecha civil y confirmación explícita de regla general. Sin huecos menores.
Registro: n=2; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

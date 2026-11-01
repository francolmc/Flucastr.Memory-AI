# task-07 — Gate único reproducible e informe de prueba
repo: Flucastr.Memory-AI   depende_de: F02-task-06   estado: aprobada

## Descripción
Gate único reproducible e informe de prueba para F02, con un objetivo verificable y sin anticipar HTTP ni embeddings.
Entrega independiente dentro del mismo repositorio; no autoriza implementar antes de aprobar esta tarea.

## Contexto
Confirmado: src/index.ts líneas 1–17 contiene probeSqlite(): { sqliteVersion: string; fts5: true }; src/cli.ts expone runCli(args: string[]): number y ejecuta process.exitCode al final. package.json scripts verify/typecheck/build/test/cli y tsconfig.json include src/**/*.ts, test/**/*.ts fueron leídos. test/cli.test.ts usa spawnSync y node:test; test/sqlite.test.ts usa node:sqlite.
Leer definitions/PROJECT.md §Qué significa «funcionando», §Alcance, §Decisiones y §Restricciones (Retención y contradicciones); definitions/ARCHITECTURE.md §Decisiones y §Supuestos y pendientes; definitions/REPOS.md §Inventario. De dependencias leer solo Notas; contratos necesarios están reproducidos aquí y en refinado.md.
Rutas a tocar (nuevas si aún no existen; propuestas de construcción, no archivos ya inspeccionados): test/f02-gate.test.ts, package.json, README.md. Directorios src/ y test/ y sus convenciones fueron inspeccionados; fixtures/f02/ es una ruta nueva propuesta. npm run verify ejecutado: cinco pruebas, ayuda y doctor correctos en Linux; macOS no observado. Comandos futuros gate:f02: no ejecutados, inferidos hasta task-07.

## Decisiones ya tomadas
Ver features/F02-memoria-local/refinado.md (cinco respuestas aprobadas). Contrato común: ID del emisor; no deduplicar texto; proyecto+general o solo general; regla general exige confirmación; reemplazo nuevo ID; archivo no borra; conflictos humanos; sin purga. Salida <=5 recuerdos y <=4000 bytes JSON UTF-8 con LF, sin truncar. Corpus sintético separado y esperado congelado antes de búsqueda.
Decisiones técnicas locales propuestas en esta tarea no cambian alcance: node:sqlite existente, node:test, ESM con imports .js, sin nuevas dependencias. Los nombres de archivos/API nuevos son instrucciones de creación, no evidencia de implementación existente.

## Alcance / Fuera de alcance
Dentro: únicamente el objetivo y archivos indicados. Fuera: datos reales, otros repos, HTTP/auth, embeddings, integraciones de agentes, despliegue, deduplicación semántica, detección automática de contradicciones, purga y afirmaciones de ahorro real.

## Pasos
1. Crear suite Node test que valida fixtures externos sin incorporarlos a lógica: 30/10, tipos, ámbitos y baseline exactamente concatenado. Cargar corpus por núcleo en DB temporal; reglas generales confirmadas explícitamente en harness. Verificar persistencia por reapertura, identidad, ámbitos previos, vacío, referencias/conflictos/archivo y cada esperado en top5 de la respuesta serializada final.
2. Medir bytes reales UTF-8 del baseline y de cada respuesta incluyendo LF, <=4000 y <=5, sin truncar; informar diferencia absoluta y porcentual solo descriptiva, sin umbral de reducción ni promesa de ahorro real. Usar fixture de gran tamaño independiente para límites sin modificar consultas congeladas. Añadir controles negativos para asegurar aserciones que fallen si se rompe cada contrato.
3. Incorporar script gate:f02 que compila y ejecuta solo dist/test/f02-gate.test.js y encadenarlo con && al verify existente. Todo incumplimiento sale no cero. README documenta gate, formato de fixtures reemplazables, alcance sintético y matriz Linux/macOS sin inventar ejecuciones. Registrar informe y resultados efectivos en Evidencia.

## Criterios de aceptación
- Gate único reúne TODOS los contratos y falla no cero; verify conserva pruebas previas. Registrar salida y bytes por consulta, sin presentar reducción de prueba como uso/ahorro real.
- El repositorio sigue funcionando: npm run verify termina con código 0; no se atribuye evidencia a un entorno no ejecutado.

## Verificación
`npm run verify` desde la raíz; esperado código 0, pruebas existentes y nuevas correctas, ayuda y doctor correctos. Después de crear el script: `npm run gate:f02` (no ejecutado, inferido); esperado código 0 e informe descriptivo por consulta, no cero al incumplir un contrato.

## Evidencia
(lo llena el constructor; incluir comandos, resultados y límites observados, no resultados supuestos)

## Notas
(lo llena el constructor; dejar firmas y rutas finales para tareas dependientes)

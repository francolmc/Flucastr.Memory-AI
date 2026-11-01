# task-05 — Confirmación durable ante caída del proceso
repo: Flucastr.Memory-AI   depende_de: F03-task-04   estado: borrador

## Descripción
Confirmación durable ante caída del proceso. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `src/memory.ts:openMemory` y `transaction` líneas 37–56; `test/cli.test.ts` subprocesos; tocar `src/memory.ts`; crear `test/f03-durability.test.ts`, `test/f03-crash-worker.ts`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Configurar SQLite synchronous=FULL y comprobar valor efectivo; mantener journal consistente (DELETE explícito) y confirmación HTTP solo tras COMMIT. No prometer resistencia a disco perdido. Worker abre HTTPS sintético usando helper TLS task-04; padre confirma respuesta y mata con SIGKILL sin close; reabre misma DB y consulta. Para operación interrumpida antes de confirmación aceptar ausencia o presencia íntegra, nunca estado parcial; no añadir API de fallo productiva.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Fijar PRAGMAs de durabilidad al abrir DB sin alterar contratos/migraciones.
2. Crear worker hijo y prueba con handshake: guardar y marcar conflictos confirmados, matar y reabrir; verificar datos, relaciones, FTS e integridad SQLite.
3. Repetir con operación no confirmada y verificar atomicidad, no exigir resultado que F02 no promete.

## Criterios de aceptación
1. Escrituras HTTP confirmadas sobreviven SIGKILL/reapertura en prueba local. Comprobar en las pruebas y revisión de diff de esta tarea.
2. Integridad y ranking/indexado siguen consistentes; no hay transacción parcial. Comprobar en las pruebas y revisión de diff de esta tarea.
3. No se describe este ensayo como RPO cero ante pérdida de disco. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
(lo llena el constructor; comandos, resultados, entorno y límites; nunca secretos)

## Notas
(lo llena el constructor; firmas públicas entregadas, archivos de prueba y límites para dependientes)

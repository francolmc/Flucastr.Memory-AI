# task-08 — Gate F03 local sintético y reporte de límites
repo: Flucastr.Memory-AI   depende_de: F03-task-07   estado: borrador

## Descripción
Gate F03 local sintético y reporte de límites. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `package.json:scripts.verify` y `gate:f02`; `README.md` gate F02; `test/f02-gate.test.ts` patrón node:test; tocar `package.json`, `README.md`; crear `test/f03-gate.test.ts`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Añadir gate:f03 que compila y ejecuta suites f03-http, f03-durability, f03-backup y f03-recovery, más autenticación y autorización (no omitirlas). Un único comando no cero ante cualquier fallo; integrar en verify sin quitar F02. La prueba gate audita disponibilidad de suites/contrato y el reporte etiqueta cada resultado como sintético local. No repetir benchmark ni prometer macOS no ejecutado. No habilitar uso real por pasar gate.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Añadir script gate:f03 con rutas dist/test de suites creadas; usar node --test sin shells especiales ni procesos persistentes.
2. Incorporar gate a verify y prueba de wiring que detecte suite ausente; reportar TLS/autorización/rotación/caída/copias/restauración y entorno.
3. Actualizar README con comando único, prerrequisitos y pendientes para cualquier uso real; ejecutar regresión completa.

## Criterios de aceptación
1. Gate ejecuta matriz completa, devuelve cero solo con todas las suites verdes y no cero ante assertion fallida. Comprobar en las pruebas y revisión de diff de esta tarea.
2. verify conserva CLI, typecheck y gate F02 además de F03. Comprobar en las pruebas y revisión de diff de esta tarea.
3. Reporte no afirma exposición privada remota, aislamiento shell, independencia física ni RTO real garantizado. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. `npm run gate:f03` y `npm run verify`: no ejecutados, inferidos para los scripts que esta tarea crea; ambos deben terminar cero y mostrar suites completas.

## Evidencia
(lo llena el constructor; comandos, resultados, entorno y límites; nunca secretos)

## Notas
(lo llena el constructor; firmas públicas entregadas, archivos de prueba y límites para dependientes)

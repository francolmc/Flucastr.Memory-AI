# task-01 — Fachada de autorización previa en el núcleo
repo: Flucastr.Memory-AI   depende_de: —   estado: borrador

## Descripción
Fachada de autorización previa en el núcleo. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `src/memory.ts:3–16` interfaces y `openMemory(path: string): MemoryStore`, líneas 57–104 fetch/save/conflictos/list/search; `test/memory.test.ts` pruebas de ámbitos. Crear `src/authorized-memory.ts`, `test/authorized-memory.test.ts`; tocar `src/memory.ts`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Mantener la API CLI confiable. Añadir factory `openAuthorizedMemory(path)` con capacidades cerradas search/save/markConflict/replace/close. Internamente añadir acceso puntual y comprobación transaccional de IDs a MemoryStore sin materializar list() para filtrar. Allowlist literal general/project:Atlas/project:Birch, sensible a mayúsculas. Ninguna opción administrativa aceptada por fachada.
La autorización se evalúa antes de ranking, antes de recuperar contenido y dentro de la transacción de mutación. IDs inexistentes o no autorizados producen el mismo error opaco. Guardar comprueba también colisión de ID existente y reemplazo previo; relaciones en salida no revelan IDs fuera de permiso: rechazar la operación opacamente si no se acredita autorización de la relación. No mutar registros ajenos para sanearlos.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Implementar la fachada y primitivas internas parametrizadas por ámbitos; conservar sintaxis abierta F02 y list() confiable.
2. Permitir search general o proyecto autorizado; save ordinario en general salvo rule y cuatro tipos en proyectos. replace(input, previousId) exige mismo proyecto Atlas/Birch en ambos extremos, nuevo ID y preserva idempotencia F02.
3. markConflict(ids) conserva al menos dos IDs distintos y restricción de mismo ámbito F02; autorizar todos antes de mutar. No agregar resolución.
4. Probar rechazo de otros ámbitos, colisiones/referencias ajenas, general rule incluso con booleanos, sustitución general/cruzada y ausencia de cambios ante fallo; probar flujos válidos y composición general.

## Criterios de aceptación
1. Consultas solo construyen conjunto elegible antes de FTS/ranking, demostrado con datos excluidos que alterarían ranking. Comprobar en las pruebas y revisión de diff de esta tarea.
2. IDs inexistentes y ajenos no revelan contenido ni diferencias de error; denegaciones no mutan. Comprobar en las pruebas y revisión de diff de esta tarea.
3. Guardar/reintentar/sustituir y conflictos autorizados conservan F02 y pasan pruebas. Comprobar en las pruebas y revisión de diff de esta tarea.
4. CLI y 15 pruebas existentes siguen pasando. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
(lo llena el constructor; comandos, resultados, entorno y límites; nunca secretos)

## Notas
(lo llena el constructor; firmas públicas entregadas, archivos de prueba y límites para dependientes)

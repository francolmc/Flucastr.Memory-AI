# task-06 — Retirar la allowlist sintética del adaptador de memoria
repo: .   depende_de: task-05   estado: borrador

## Descripción
Retirar la autorización por nombres Atlas/Birch del adaptador usado por HTTP.
Aceptar cualquier scope válido y rule general conforme al contrato de un usuario.
Conservar pruebas útiles de aislamiento, idempotencia y operaciones atómicas.
Este incremento no cierra S1: deja la limpieza nominal de otros cinco archivos para otra partición.

## Contexto
- Leer: `src/memory.ts@1-74`, `src/memory.ts@107-33`, `src/memory.ts@156-11`, `test/authorized-memory.test.ts`
- Tocar: `src/memory.ts`, `test/authorized-memory.test.ts`
- Lectura acotada: memory.ts líneas 1–74, 107–139 y 156–166; test completo. Scripts ya verificados: build = tsc -p tsconfig.json; test = npm run build && node --test dist/test/*.test.js. Aproximadamente 12 KB como máximo; no leer completo memory.ts. De task-05, solo Notas si se necesita su evidencia; no releer tareas hechas.
- Confirmado: openAuthorizedMemory fija tres scopes; authorizedSave/Conflict/Search duplican controles sobre una allowlist. MemoryStore ya ofrece save/markConflict/search y validación estructural. Sus consumidores usan AuthorizedMemoryStore, que se conserva.
- Confirmado: rama chore/F01-base-verde, Node v24.22.1, npm 11.19.1; scripts build y test en package.json. git diff --check ejecutado sin errores al planificar. npm install/build/test no ejecutados en esta preparación; resultado posterior pendiente, no evidencia heredada.
- Fuente: definitions/ARCHITECTURE.md «Contrato HTTP objetivo (decisión de este borrador)»
- Requiere: runtime:node@24.22.1, red

## Decisiones ya tomadas
- Confirmado por contrato: no existe lista de proyectos ni veto especial a rule general; scopes válidos son general o project:<nombre no vacío sin espacios externos>.
- Conservar openAuthorizedMemory y AuthorizedMemoryStore como adaptador de compatibilidad, sin cambiar HTTP ni exports. Bearer sigue siendo la autenticación; no sustituirlo por controles de nombres.
- Reutilizar store.save con confirmGeneralRule: true dentro del adaptador; conservar el opt-in de la API local openMemory para no ampliar este incremento. Centralizar la comprobación sintáctica del scope en helper compartido por validate y search del adaptador; no validar búsqueda construyendo memorias ficticias.
- Delegar replace a store.save con replacesId y confirmGeneralRule: true, manteniendo rechazos existentes a general, rule y auto-reemplazo. Delegar markConflict a store.markConflict; conservar mínimo dos IDs distintos, existencia, mismo proyecto y atomicidad. Envolver errores del adaptador en Memory is unavailable, también save/search.
- Eliminar los tres métodos authorizedSave/authorizedConflict/authorizedSearch de MemoryStore y su implementación: no dejar allowlists muertas. Mantener SQLite, FTS5, ID canónico, tipos y filtrado exacto scope+general; no cambiar ranking ni SQL de búsqueda en este incremento.
- Presupuesto: aproximadamente 160–200 líneas sumando altas y bajas. Si el diff necesario supera 200, detener y reportar la partición restante sin recortar controles ni esconder rutas.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Incluye retirada funcional de allowlist y sustitución de sus expectativas sintéticas en el test del adaptador.
Fuera de alcance: S2, endpoints/errores nuevos, recent/forget, OR, migración FTS persistente, metadatos, CLI, README, TLS, backups y cambios en otras pruebas. No borrar pruebas útiles por llamarse sintéticas.
Resto S1 explícito: referencias Atlas/Birch en test/f03-crash-worker.ts, test/f03-durability.test.ts, test/http-server.test.ts, test/memory.test.ts y test/remote-cli.test.ts; además revisar si quedan restricciones sintéticas en código/pruebas antes de declarar cierre. Son cinco rutas nominales restantes de las siete encontradas en esta pasada (no ocho); no ocultarlas ni editarlas aquí. Esta tarea no cierra S1 ni implementa sus sucesoras.

## Pasos
1. src/memory.ts: extraer validación sintáctica de scope, usarla en validate/search, retirar allowlist y métodos duplicados, delegar a primitivas existentes conservando controles indicados; ningún Atlas/Birch en el archivo y build correcto.
2. test/authorized-memory.test.ts: usar proyectos neutros, incluir un tercer nombre válido aceptado, rule general aceptada e inválidos rechazados. Sustituir únicamente expectativas ligadas a prohibiciones retiradas; mantener colisión de ID entre scopes, reintento idéntico, aislamiento general/proyecto, reemplazo cruzado rechazado y conflicto sin mutaciones parciales. Renombrar la prueba de IDs prohibidos a IDs ausentes sin inventar autorización por proyecto.
3. Ambas rutas: medir altas+bajas y ejecutar verificación completa; registrar evidencia real y resto sin tocar otras rutas.

## Criterios de aceptación
1. Cualquier proyecto sintácticamente válido y rule general se guardan por adaptador; prueba explícita con tercer proyecto, ID nuevo y round-trip, sin allowlist en src/memory.ts.
2. Scope inválido se rechaza en save/search; búsquedas no incluyen otros proyectos; tests del adaptador pasan conservando los controles indicados.
3. Mismo ID idéntico es idempotente y contenido distinto falla sin mutar; reemplazo cruzado y conflictos incompletos siguen fallando atómicamente, comprobados por tests.
4. Solo dos archivos de producto/pruebas cambian, ≤200 líneas altas+bajas; sin eliminar Bearer, aislamiento, SQLite/FTS5 ni pruebas ajenas.
5. npm install sin EBADENGINE, build y suite completa terminan correctamente bajo Node24.22.1 y diffcheck limpio; adjuntar salidas y número real de pruebas, no asumir 34.

## Verificación
```sh
git branch --show-current
node --version
npm install
npm run build
npm test
git diff --check
git diff --numstat -- src/memory.ts test/authorized-memory.test.ts
git diff --name-only
```
Esperado: chore/F01-base-verde, v24.22.1, instalación sin EBADENGINE, build/test exit 0 y diffcheck sin salida. Sumar numstat (altas+bajas ≤200). Comparar lista con estado inicial, respetando cambios preexistentes de task-05 y definitions/STATUS.md; no tocarlos. Si install altera lock/package, no incorporar esos cambios en esta tarea: detener y reportar causa sin restaurar trabajo ajeno.

## Evidencia
Lo llena el constructor con comandos, resultados, tamaño y resto pendiente.

## Notas
Lo llena el constructor. No commits, subagentes ni STATUS.

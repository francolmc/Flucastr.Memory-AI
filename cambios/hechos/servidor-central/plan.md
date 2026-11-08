---
estado: listo
rama: feature/servidor-central
base: main
repos: [.]
ejecutor: constructor
---
# S2 — Completar servidor central

## Objetivo
Completar save/search/recent/forget sobre el servidor HTTP y SQLite existente, preservando aislamiento, autenticación y durabilidad.

## Supuestos
- Se conserva S2 como un cambio completo; si excede la ejecución prevista, se pausa para decidir una partición.

## Alcance
`src/`, `test/`, `scripts/verify-flujo.mjs`, `verify` y documentación directamente afectada. Fuera: bin global S3, operación S4, integraciones S5, despliegue e `old/v1/`.

## Decisiones ya tomadas
- Contrato: seguir Configuración y Contrato HTTP de `old/v1/definitions/ARCHITECTURE.md`; preservar validaciones y códigos allí descritos.
- Guardado de Claude: explícito a petición de Franco; Pi recupera recientes automáticamente al iniciar (decisión para S5).
- Save conserva idempotencia; mismo ID con contenido distinto responde 409 `id_conflict`.
- Search devuelve seis campos, alcance exacto más `general`, términos OR con BM25, máximo cinco memorias y 4000 bytes UTF-8 incluyendo LF; descarta memorias completas que no quepan.
- Recent acepta límite entero positivo predeterminado 15, ordena `date DESC, id ASC` y no usa el tope de search.
- Forget borra memoria y FTS en una transacción; ID inexistente responde `{ "ok": true }` y permite reutilizar el ID.
- Retirar `/v1/replacements` y `/v1/conflicts`; responder 404. No conservar los metadatos internos en respuestas HTTP.
- Alinear `src/http-client.ts` con las respuestas de seis campos y recent sin límite de 4000 bytes, manteniendo cliente sin DB local; no añadir HTTPS ni bin (S3).
- Actualizar el flujo local de `./verify` para cubrir los cuatro endpoints, errores y limpieza explícita de su registro de prueba mediante forget.
- Ejecutor: constructor, porque los requisitos, contexto, verificaciones y manejo de errores son accesibles y no implican credenciales ni producción.

## Escenarios
- CUANDO se guarda contenido idéntico con el mismo ID ENTONCES responde 200 sin duplicar; contenido distinto responde 409 `id_conflict` (A1).
- CUANDO se busca ENTONCES devuelve las seis propiedades, ámbito exacto más general, OR/BM25 y respeta 5/4000 bytes con LF (A2).
- CUANDO se piden recientes ENTONCES devuelve hasta el límite, ordenados por fecha descendente e ID ascendente, sin truncar por el límite de search (A3).
- CUANDO se olvida un ID existente o inexistente ENTONCES responde `{ "ok": true }`, borra tabla/FTS de forma atómica y permite reutilizarlo (A4).
- CUANDO la petición es inválida, no autorizada, falla internamente o usa una ruta retirada ENTONCES responde 400/401/500/404 según contrato, sin exponer trazas (A5).
- CUANDO corre `./verify` ENTONCES prueba el recorrido de servidor real y SQLite aislado, incluido forget del registro de prueba, y limpia recursos Docker (A6).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Save idempotente y conflicto sin sobrescritura | Peticiones HTTP al servidor real | Reintento 200; contenido distinto 409 `id_conflict`; queda el contenido original |
| A2 | Search cumple forma, scope, ranking y topes | Recorrido HTTP con registros de ambos scopes, más de cinco resultados y texto Unicode cercano al límite | Solo seis campos; general incluido; máximo 5 y <=4000 bytes con LF; ningún registro parcial |
| A3 | Recent respeta contrato y no hereda tope de search | Recorrido HTTP con más de 5 memorias y límites omitido, válido e inválido | Orden `date DESC, id ASC`; default 15; válido exacto; inválido 400; salida puede superar 4000 bytes |
| A4 | Forget elimina también el índice y es repetible | Guardar, buscar, olvidar dos veces, buscar y reutilizar ID por HTTP | Ambas bajas 200 `{ "ok": true }`; búsqueda vacía; reutilización exitosa |
| A5 | Errores y rutas tienen respuestas contractuales | Peticiones HTTP inválidas, sin token, a rutas retiradas y un fallo interno simulado | 400 `invalid_request`, 401 `unauthorized`, 404 `not_found`, 500 genérico; sin secretos ni trazas |
| A6 | Verificación desde cero incluye S2 y conserva cliente remoto existente | `./verify` y suite con servidor/SQLite reales | Exit 0, suite aprobada, save/search/recent/forget y errores comprobados, limpieza OK; cliente acepta seis campos y recent grande |

## Verificación
`./verify` — desde cero; ejecuta suite y recorrido HTTP con servidor real, SQLite aislado y limpieza de datos y recursos propios.

## Pasos
- [x] Contrastar contrato y consumidor actual; convertir diferencias confirmadas en casos HTTP de aceptación (A1–A5).
  - evidencia: `src/http-server.ts`, `src/memory.ts`, `src/http-client.ts`; casos A1–A5 en `test/http-server.test.ts` y `test/memory.test.ts`.
- [x] Completar persistencia, índice FTS y operaciones recent/forget en la composición productiva (A3–A4).
  - evidencia: `src/memory.ts`; recent/forget probados con SQLite persistente en `test/memory.test.ts`.
- [x] Alinear save/search, errores y rutas retiradas con el contrato, conservando autenticación y aislamiento (A1–A2, A5).
  - evidencia: `src/http-server.ts`, `src/response.ts`; loopback HTTP y SQLite en `test/http-server.test.ts`.
- [x] Ajustar el cliente HTTP existente para seis campos y respuestas recent mayores a 4000 bytes; mantener cobertura actual (A6).
  - evidencia: `src/http-client.ts`; prueba de recent grande en `test/http-client-route.test.ts` y límite search en `test/remote-client-security.test.ts`.
- [x] Extender `./verify` para los contratos, errores y limpieza explícita del registro (A1–A6).
  - evidencia: `scripts/verify-flujo.mjs`, `verify`; `test/verify.test.ts` comprueba escritura idempotente y base limpia al terminar.
- [x] Ejecutar `./verify` sin caché y registrar salida, conteo de pruebas y limpieza (A1–A6; ≈8 min).
  - evidencia: `./verify` sin caché, exit 0; build limpio, typecheck, suite 44/44, CLI help/doctor, recorrido HTTP y limpieza Compose pasaron.

## Evidencia
$ `npm test`
Suite completa aprobada: `ℹ tests 44`, `ℹ pass 44`, `ℹ fail 0`, `ℹ duration_ms 17897.534437`; exit 0.

$ `./verify`
`VERIFY FAIL: preflight Docker (código 137)`; exit 137.

$ `VERIFY_RAPIDO=1 ./verify`
`VERIFY FAIL: preflight Docker (código 124)`; exit 124. Repetido una vez: mismo resultado.

## Notas
La revisión de cobertura está en `docs/revision-mvp.md`. Se conservaron replacements/conflicts en almacenamiento local, pero se retiraron del HTTP con 404. Las respuestas HTTP exponen solo los seis campos. La comprobación independiente del principal sobre `startServe` cubrió persistencia tras reinicio, aislamiento, conflicto 409, forget, búsqueda Unicode y reutilización de ID.

El preflight Docker no respondió: `docker info --format '{{.ServerVersion}}'` siguió ejecutándose sin salida durante más de 60 segundos; el principal confirmó `systemctl is-active docker docker.socket` = `inactive/inactive`. `docker ps -a`, `docker network ls` y `docker volume ls` con filtro `verify_memory_` no encontraron recursos. No se inició ni configuró Docker, fuera del alcance. Reanudar solo cuando Docker Engine/Compose responda y volver a ejecutar `./verify` sin caché.

El principal pudo después acceder a Docker. Corrida final: `./verify` con permisos ampliados y sin caché, exit 0; Docker informó `29.9.2`, build completo, suite 44/44, `cli --help`, doctor (`sqliteVersion 3.53.4`, FTS5 true), flujo HTTP `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, y `LIMPIEZA OK`. Compose retiró únicamente `verify_memory_3599686-memory-1`, red `verify_memory_3599686_default` y volumen `verify_memory_3599686_memory-data`. Diff final revisado y `git diff --check` pasó. Todas las filas A1–A6 están cubiertas por la suite, verify y recorrido adicional propio descrito arriba.

### Revisión del principal — 2026-11-08
- Estado reconstruido tras PAUSA: rama `feature/servidor-central`, 15 archivos modificados (plan, cuatro archivos src, ocho archivos de pruebas y dos auxiliares de verify); sin archivos nuevos pendientes. Los archivos esperados existen. `git diff --check` pasó. Revisado el diff completo, incluida adaptación de durabilidad tras retirar las rutas HTTP antiguas.
- A1: revisados reintento y conflicto por HTTP; comprobación propia confirmó 409 sin sobrescritura y persistencia del contenido tras reiniciar.
- A2: revisados SQL OR/BM25 y desempate ID conservados, inclusión de general y aislamiento, proyección de seis campos y cómputo UTF-8 con LF. Las pruebas HTTP usan SQLite real, más de cinco candidatos y Unicode cercano al tope, sin truncar campos.
- A3: revisados default 15 sobre 17 registros de proyecto más general, límite explícito 3, entradas inválidas y salida mayor de 4000 bytes. SQL conserva orden `date DESC,id ASC`; prueba de persistencia cubre fechas distintas y desempates.
- A4: ambas eliminaciones (FTS y tabla) están en la misma transacción existente; revisados borrado repetido e ID reutilizable. Comprobación propia confirmó ausencia en search/recent después de otro reinicio y reutilización exitosa.
- A5: revisadas validación previa al store, autenticación antes del cuerpo, rutas retiradas 404 y error interno genérico; prueba simula error SQL sin filtrarlo. La comprobación propia verificó aislamiento de otro proyecto.
- A6: suite del constructor 44/44 y consumidor remoto revisados. Mi `./verify` sin caché con permisos ampliados falló en preflight Docker, código 124, antes del build; aceptación desde cero pendiente. No equivale a verificación completa ni autoriza cierre.
- Recorrido adicional propio: `node /tmp/revision-s2.mjs` pasó con `startServe`, HTTP y SQLite temporal reales: guardar, reiniciar, recent/search Unicode, aislamiento, conflicto, olvidar, reiniciar, ausencia y reutilización. Se limpiaron servidor y directorio temporal.
- Sensibilidad: en copia temporal del serializador compilado se retiró el tope de bytes; la misma aserción `bytes <= 4000` pasó con original y falló con la mutación. Copia eliminada; fuentes intactas.
- Recorrido vecino: reglas de confirmación del CLI local, operaciones locales replacements/conflicts y búsqueda persistente se conservan; suite existente aprobada según evidencia del constructor.

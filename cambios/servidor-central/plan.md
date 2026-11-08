---
estado: aprobado
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
- [ ] Contrastar contrato y consumidor actual; convertir diferencias confirmadas en casos HTTP de aceptación (A1–A5).
- [ ] Completar persistencia, índice FTS y operaciones recent/forget en la composición productiva (A3–A4).
- [ ] Alinear save/search, errores y rutas retiradas con el contrato, conservando autenticación y aislamiento (A1–A2, A5).
- [ ] Ajustar el cliente HTTP existente para seis campos y respuestas recent mayores a 4000 bytes; mantener cobertura actual (A6).
- [ ] Extender `./verify` para los contratos, errores y limpieza explícita del registro (A1–A6).
- [ ] Ejecutar `./verify` sin caché y registrar salida, conteo de pruebas y limpieza (A1–A6; ≈8 min).

## Evidencia
(la escribe el constructor)

## Notas
La revisión de cobertura está en `docs/revision-mvp.md`. La implementación actual tiene `/v1/memories`, `/v1/search`, replacements/conflicts; faltan recent/forget y el cliente exige metadatos internos, limita toda respuesta a 4000 bytes. El `./verify` existente prueba save/search y no limpia registros mediante forget todavía.

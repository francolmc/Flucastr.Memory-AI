---
estado: borrador
rama: feature/servidor-central
repos: [.]
ejecutor: constructor
---
# S2 — Completar servidor central

## Objetivo
Terminar la fila S2 en curso de `old/v1/definitions/BACKLOG.md`, conservando el avance actual y completando el contrato HTTP central.

## Supuestos
- Se migra la fila S2 completa sin dividirla silenciosamente. Si excede el tamaño ejecutable, Franco decide su partición antes de construir.

## Alcance
`src/`, `test/`, manifiestos/lock si son necesarios, `verify` y sus auxiliares una vez creados, documentación del contrato. Fuera: cliente global S3, operación S4, integraciones S5 y old/v1.

## Decisiones ya tomadas
- Ejecutor: constructor; no se ha pedido ejecución por el principal. Antes de aprobar, revisar el verify ya creado y concretar comprobaciones por paso para pasar la prueba de ejecutabilidad.
- Requiere completar `cambios/verify/plan.md` primero.
- Referencia contractual: `old/v1/definitions/ARCHITECTURE.md`, apartados Configuración y Contrato HTTP; conservar íntegramente sus campos, validaciones, códigos, orden y topes. No tratar sus afirmaciones de estado como evidencia actual.
- `src/serve.ts` ya configura loopback, token y DB; `src/http-server.ts` aún expone replacements/conflicts, no recent/forget, y convierte errores del store a 403.
- Mantener avances de búsqueda y durabilidad; no rehacerlos por asumir que todo S2 falta.

## Escenarios
- CUANDO se guarda ID idéntico ENTONCES es idempotente; con contenido distinto devuelve 409 id_conflict.
- CUANDO se busca ENTONCES devuelve solo seis campos, OR+BM25, ámbito exacto más general y topes 5/4000 bytes con LF.
- CUANDO se piden recientes ENTONCES aplica límite positivo (15 por defecto), date DESC/id ASC sin tope de search.
- CUANDO se olvida ENTONCES borra tabla y FTS atómicamente; repetir no falla y permite reutilizar ID.
- CUANDO hay entrada inválida, falta autenticación o fallo interno ENTONCES responde 400/401/500 según contrato, sin secretos ni trazas; rutas retiradas dan 404.

## Verificación
`./verify` — extender el recorrido real con save/search/recent/forget y errores; no existe todavía, dependencia bloqueante.

## Pasos
- [ ] Comparar implementación y pruebas actuales con el contrato histórico; identificar qué ya funciona sin sobrescribirlo.
- [ ] Completar store/FTS y serialización para recent/forget, salida exacta e idempotencia; mantener durabilidad real.
- [ ] Alinear rutas, validación y errores; retirar endpoints heredados y actualizar sus pruebas sin perder aislamiento/auth.
- [ ] Extender verify y ejecutar desde cero; registrar conteos y diferencias frente a la base (≈5 min).

## Evidencia
En la migración solo se compiló: `npm run build` salió 0; no se probó funcionamiento completo.

## Notas
Fuente adicional: `old/v1/definitions/STATUS.md` declara S2 incompleta. Las tareas F02 figuran hechas; no se migran como tareas abiertas. Aprobaciones históricas no autorizan este plan.

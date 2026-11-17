## Pasos

### Tramo 10 — Historia: Aislar comprobación SQLite
Como mantenedor quiero aislar comprobación sqlite para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 9: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/index.ts, src/storage/probe.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/index.ts, src/storage/probe.ts.
Archivos: src/index.ts, src/storage/probe.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras aislar comprobación sqlite (A10).
Aceptación:
- A10: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Mover la comprobación SQLite directa de `src/index.ts` a `src/storage/probe.ts` y conservar la misma exportación y comportamiento desde el entrypoint. (A10). Comprobación: diff revisado; `src/index.ts` reexporta la función con la misma firma, y la implementación SQL/finally de cierre se trasladó intacta.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A10). Comprobación: Evidencia registra archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A10.
Handoff: seguir el tramo 11 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


## Pasos

### Tramo 11 — Historia: Clarificar herramientas MCP
Como mantenedor quiero clarificar herramientas mcp para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 10: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/mcp/index.ts, src/mcp/tools.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/mcp/index.ts, src/mcp/tools.ts.
Archivos: src/mcp/index.ts, src/mcp/tools.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras clarificar herramientas mcp (A11).
Aceptación:
- A11: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Extraer registro y manejadores de herramientas MCP a `src/mcp/tools.ts`; preservar el entrypoint stdio, nombres, esquemas, scope, errores y transporte HTTP. (A11). Comprobación: diff revisado; rutas conservadas.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A11). Comprobación: Evidencia registra archivos, resumen, duración aproximada y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A11.
Handoff: seguir el tramo 12 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


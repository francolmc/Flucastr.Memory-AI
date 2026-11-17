## Pasos

### Tramo 3 — Historia: Mover respuestas HTTP
Como mantenedor quiero mover respuestas http para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 2: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/response.ts, src/http/response.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/response.ts, src/http/response.ts.
Archivos: src/response.ts, src/http/response.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras mover respuestas http (A3).
Aceptación:
- A3: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Mover intacta la implementación a `src/http/response.ts` y mantener `src/response.ts` como fachada; ajustar únicamente rutas de imports. (A3). Comprobación: revisar diff y rutas; esperar alcance y contratos conservados.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A3). Comprobación: leer Evidencia; esperar archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A3.
Handoff: seguir el tramo 4 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


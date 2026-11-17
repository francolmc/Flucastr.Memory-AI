## Pasos

### Tramo 5 — Historia: Mover servidor HTTP
Como mantenedor quiero mover servidor http para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 4: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/http-server.ts, src/http/server.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/http-server.ts, src/http/server.ts.
Archivos: src/http-server.ts, src/http/server.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras mover servidor http (A5).
Aceptación:
- A5: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Mover intacta la implementación a `src/http/server.ts` y mantener `src/http-server.ts` como fachada; ajustar únicamente rutas de imports. (A5). Comprobación: revisar diff y rutas; esperar alcance y contratos conservados.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A5). Comprobación: leer Evidencia; esperar archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A5.
Handoff: seguir el tramo 6 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


## Pasos

### Tramo 9 — Historia: Separar rutas HTTP
Como mantenedor quiero separar rutas http para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 8: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/http/server.ts, src/http/routes.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/http/server.ts, src/http/routes.ts.
Archivos: src/http/server.ts, src/http/routes.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras separar rutas http (A9).
Aceptación:
- A9: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Extraer el despacho de rutas a `src/http/routes.ts`, pasando explícitamente dependencias; conservar orden de autenticación, respuestas, validación y manejo de errores. (A9). Comprobación: diff revisado; autenticación permanece antes de delegar, y despacho conserva orden de ruta, método, content-type, lectura, parseo y validación; solo se modifican los archivos del tramo.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A9). Comprobación: Evidencia registra archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A9.
Handoff: seguir el tramo 10 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


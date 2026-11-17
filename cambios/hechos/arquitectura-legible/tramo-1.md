## Pasos

### Tramo 1 — Historia: Mover autenticación HTTP
Como mantenedor quiero mover autenticación http para localizar responsabilidades sin cambiar el servicio.
Dependencias: No aplica Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/http-auth.ts, src/http/auth.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/http-auth.ts, src/http/auth.ts.
Archivos: src/http-auth.ts, src/http/auth.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras mover autenticación http (A1).
Aceptación:
- A1: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Mover intacta la implementación a `src/http/auth.ts` y dejar `src/http-auth.ts` como fachada que reexporta todos los símbolos existentes. (A1). Comprobación: revisar diff y rutas; esperar alcance y contratos conservados.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A1). Comprobación: leer Evidencia; esperar archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A1.
Handoff: seguir el tramo 2 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


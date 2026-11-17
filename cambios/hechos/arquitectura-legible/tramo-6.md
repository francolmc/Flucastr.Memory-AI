## Pasos

### Tramo 6 — Historia: Separar reglas de memoria
Como mantenedor quiero separar reglas de memoria para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 5: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/storage/memory.ts, src/domain/memory.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/storage/memory.ts, src/domain/memory.ts.
Archivos: src/storage/memory.ts, src/domain/memory.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras separar reglas de memoria (A6).
Aceptación:
- A6: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Extraer tipos, constantes y validación puras a `src/domain/memory.ts`; importar y reexportar desde almacenamiento para conservar las fachadas. No cambiar validación ni comportamiento. (A6). Comprobación: revisar diff y rutas; esperar alcance y contratos conservados.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A6). Comprobación: leer Evidencia; esperar archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A6.
Handoff: seguir el tramo 7 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


## Pasos

### Tramo 4 — Historia: Mover almacenamiento
Como mantenedor quiero mover almacenamiento para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 3: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/memory.ts, src/storage/memory.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/memory.ts, src/storage/memory.ts.
Archivos: src/memory.ts, src/storage/memory.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras mover almacenamiento (A4).
Aceptación:
- A4: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Mover intacta la implementación a `src/storage/memory.ts` y mantener `src/memory.ts` como fachada que reexporta todos los símbolos y tipos, sin cambiar SQL ni lógica. (A4). Comprobación: revisar diff y rutas; esperar alcance y contratos conservados.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A4). Comprobación: leer Evidencia; esperar archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A4.
Handoff: seguir el tramo 5 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


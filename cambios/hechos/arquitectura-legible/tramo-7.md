## Pasos

### Tramo 7 — Historia: Separar preparación de SQLite
Como mantenedor quiero separar preparación de sqlite para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 6: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: src/storage/memory.ts, src/storage/schema.ts; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: src/storage/memory.ts, src/storage/schema.ts.
Archivos: src/storage/memory.ts, src/storage/schema.ts
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras separar preparación de sqlite (A7).
Aceptación:
- A7: recorrido completo y compatibilidad existentes pasan; comprobar con `VERIFY_RAPIDO=1 ./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Extraer a `src/storage/schema.ts` la preparación de esquema, FTS y migraciones existentes; invocarla desde almacenamiento conservando orden y SQL exactos. (A7). Comprobación: revisar diff y rutas; esperar alcance y contratos conservados.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `VERIFY_RAPIDO=1 ./verify` (≈3 min) (A7). Comprobación: leer Evidencia; esperar archivos, resumen, duración y salida 0.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A7.
Handoff: seguir el tramo 8 con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


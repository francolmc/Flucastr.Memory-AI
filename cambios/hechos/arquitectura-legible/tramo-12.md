## Pasos

### Tramo 12 — Historia: Documentar arquitectura
Como mantenedor quiero documentar arquitectura para localizar responsabilidades sin cambiar el servicio.
Dependencias: Tramo 11: conservar la arquitectura y compatibilidad verificadas anteriormente. Docker operativo para la verificación real.
Contratos a conservar: importaciones y entradas existentes, API HTTP/MCP, errores, formato y datos SQLite.
Rutas susceptibles de cambio: docs/arquitectura.md; las pruebas existentes no se mueven ni modifican.
Ejemplo concreto del resultado esperado: un cliente MCP guarda y recupera una memoria por HTTP y SQLite igual que antes, y una base anterior abre sin pérdida.
Alcance: docs/arquitectura.md.
Archivos: docs/arquitectura.md
CUANDO se ejecuta el recorrido existente ENTONCES sigue funcionando tras documentar arquitectura (A12).
Aceptación:
- A12: recorrido completo y compatibilidad existentes pasan; comprobar con `./verify` y revisión del diff; esperar salida 0 y ningún cambio de contrato.
TODO:
- [x] Crear `docs/arquitectura.md` con el mapa real de carpetas y fachadas, flujo HTTP y MCP hasta SQLite, y ubicación de cambios de almacenamiento, rutas y herramientas MCP; explicar que serve es composición. (A12). Comprobación: diff y rutas revisados; documentación dentro del alcance, sin cambios de contrato.
- [x] Registrar en `cambios/arquitectura-legible/plan.md` el punto de control y resultado de `./verify` (≈3 min) (A12). Comprobación: Evidencia registra archivo, resumen, duración aproximada y salida 0.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A12.
Handoff: seguir el tramo final de revisión con los entrypoints y fachadas existentes; no cambiar pruebas ni comportamiento.


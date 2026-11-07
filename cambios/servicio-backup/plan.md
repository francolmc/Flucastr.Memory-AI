---
estado: borrador
rama: feature/servicio-backup
repos: [.]
ejecutor: constructor
---
# S4 — Servicio WSL y backup real

## Objetivo
Preservar S4 pendiente de `old/v1/definitions/BACKLOG.md`: entregar scripts de servicio y copia nocturna para que Franco los instale manualmente.

## Supuestos
- Los scripts operativos serán archivos nuevos; no se encontraron ni se presupone que existan rutas de instalación. Si el host real difiere del objetivo WSL/systemd, Franco debe corregir el alcance.

## Alcance
Nuevos scripts/unidades/documentación operativa, pruebas y extensión de verify cuando exista. Fuera: instalación, configuración de Windows/Tailscale real, despliegue, secretos personales, restauración/saneamiento y old/v1.

## Decisiones ya tomadas
- Ejecutor: constructor; no se ha pedido ejecución por el principal. Antes de aprobar, concretar rutas versionadas, parametrización y comprobaciones para pasar la prueba de ejecutabilidad; instalación queda fuera.
- Depende de S2/S3 y verify completos. Contrato: `old/v1/definitions/ARCHITECTURE.md`, Integración y operación objetivo.
- Servicio WSL/systemd con HTTP loopback 7420; Tailscale Serve proporciona HTTPS solo tailnet. No TLS/CA propios.
- Backup real nocturno con sqlite3 .backup; verificar éxito antes de retener las siete últimas copias exitosas. Nunca copiar directamente una DB abierta.
- Solo Franco instala/configura servicio, cron y continuidad Windows/WSL 24/7; entregar instrucciones, no ejecutarlas.

## Escenarios
- CUANDO se crea una copia con escrituras activas ENTONCES puede abrirse y pasa integrity_check.
- CUANDO falla la copia ENTONCES sale no cero y no elimina copias exitosas previas.
- CUANDO hay más de siete copias exitosas ENTONCES conserva las siete últimas sin afectar archivos ajenos.

## Verificación
`./verify` — incluir pruebas operativas en directorios temporales; no demuestra continuidad del host ni conectividad tailnet real.

## Pasos
- [ ] Diseñar archivos nuevos de unidad, cron y backup parametrizados sin valores personales; documentar dependencias.
- [ ] Implementar backup y retención con pruebas de SQLite real, fallo y más de siete copias.
- [ ] Documentar comandos systemd/Tailscale y comprobaciones que corre Franco, sin ejecutarlos.
- [ ] Extender verify local, registrar límites y dejar explícita evidencia manual pendiente del host (≈5 min).

## Evidencia
No se ejecutó ni instaló operación durante la migración.

## Notas
La fila completa se conserva sin partición. Si el tamaño requiere dividirla, la partición queda pendiente de decisión de Franco antes de construir. Rutas del host, usuario y horario concreto deben confirmarse para instalación; no se inventan.

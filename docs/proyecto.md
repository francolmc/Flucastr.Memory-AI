# Flucastr.Memory-AI

## Propósito y estructura
Condensado de `old/v1/definitions/PROJECT.md`, `ARCHITECTURE.md` y `REPOS.md`.
Un solo repositorio TypeScript ESM con SQLite/FTS5. El objetivo aprobado históricamente es que un servidor Windows+WSL 24/7 conserve la memoria y Mac/WSL accedan como clientes HTTP delgados. El MVP exige guardar una decisión desde Claude Code Mac y recuperarla al abrir Pi WSL en el mismo proyecto, sin copiar ni pegar.

## Arquitectura objetivo y decisiones
Mac/WSL → HTTPS privado de Tailscale Serve → HTTP Bearer en 127.0.0.1:7420 → SQLite central. Solo el servidor abre la base; no hay fallback local del cliente. Esto evita sincronización y divergencias. Tailscale evita mantener TLS/CA propios; SQLite/FTS5 evita añadir un servicio de base o embeddings.

Memorias con seis campos: id, type, scope, text, origin, date. Tipos decision/learning/resolved-blocker/rule; ámbitos general o project:<nombre>. POST save/search/recent/forget; ID idempotente, conflicto distinto 409. Search incluye ámbito exacto más general, términos OR literales, BM25 e ID para desempate, máximo cinco memorias y 4000 bytes JSON UTF-8 con LF. Recent tiene límite predeterminado 15, sin el tope de search. Forget explícito y transaccional. El contrato detallado histórico sigue en `old/v1/definitions/ARCHITECTURE.md`; no prueba implementación actual.

## Estado observado durante la migración
`package.json` exige Node >=24.22.1 <25, distinto de los requisitos antiguos del README y PROJECT. `src/serve.ts` ya prepara base/token y servidor loopback. `src/http-server.ts` conserva replacements/conflicts y error 403 genérico; faltan recent/forget. `src/remote-cli.ts` solo ofrece save/search con opciones explícitas, sin bin mem. README contiene descripción antigua; su actualización pertenece a S5.
`npm run build` se volvió a ejecutar y pasó bajo Node v24.22.1 y npm 11.19.1 al retomar la migración. No se ejecutó la suite ni el comando verify. Existe `npm run verify`, pero no `./verify` desde cero; se propone en `cambios/verify/plan.md`.

## Pendientes migrados
S1 figura hecha; todas las tareas F01/F02 y la tarea conservada F07 declaran estado hecha. Al repetir `instalar.sh --migrar <proyecto> --simular`, el instalador se detuvo sin cambios porque `old/v1/` ya existe; no produjo un inventario nuevo. BACKLOG conserva S2 en curso y S3/S4/S5 pendientes; las cuatro filas ya estaban preservadas como planes borrador y se contrastaron con el archivo histórico, sin crear ítems adicionales. Las aprobaciones/modo yolo históricos no autorizan ejecutarlos en v2.

Orden propuesto: `cambios/verify/plan.md`, `cambios/servidor-central/plan.md`, `cambios/cliente-mem/plan.md`, `cambios/servicio-backup/plan.md`, `cambios/inicio-agentes/plan.md`. Todos siguen en borrador. Antes de aprobar cada plan se cierran sus decisiones pendientes y se concreta su traspaso; no son permiso de implementación. La rama observada es `docs/terminar-migracion`, la principal del remoto es `origin/main` y hay cambios previos de migración: no se inicia construcción ni se cambia de rama.

## Despliegue
- Destino objetivo: servidor Windows+WSL 24/7; instalación efectiva pendiente de confirmar por Franco.
- Variables conocidas del contrato: MEM_DB, MEM_TOKEN, MEM_URL; no existe `.env.example` raíz, inventario definitivo pendiente.
- Migraciones: pendiente documentar el mecanismo real antes de operación.
- Vuelta atrás: pendiente; no se afirma que haya backups operativos.
- Comprobación posterior: `VERIFY_TARGET=<url> ./verify`, pendiente de implementación y ejecución por Franco.

## Descartado
### Reglas de v1 que descarté
Confirmadas por Franco al cerrar la revisión documental de la migración. Esta confirmación no aprueba los planes en borrador.

- Gates, presupuestos D75 y límites de rondas: no se trasladan al flujo v2.
- Modo yolo y su renovación tras un corte: no autorizan ejecución v2.
- Aprobación conjunta única y ausencia de aprobaciones intermedias: se descartan; los planes v2 se aprueban uno por uno.
- Slices limitados a unas 200 líneas y división obligatoria por tamaño: no se trasladan; una partición de alcance requiere decisión de Franco.
- Formato de tareas, dependencias y nombres de rama Fxx como flujo vigente: quedan solo como historia.
- STATUS/BACKLOG como coordinadores de ejecución y orden de retomar tareas F02: se sustituyen por los planes de `cambios/`.
- Prohibición histórica de crear fichas, gates, runbooks o investigaciones abiertas como regla general: no se traslada; se conserva únicamente el alcance funcional pertinente.

### Otros descartes
- Afirmaciones antiguas de runtime Node 22, HTTPS propio y búsqueda AND: obsoletas o discrepantes; no se presentan como estado actual.
- Detalles operativos no demostrados y evidencia histórica de pruebas: conservados en old/v1, no equivalen a verificación nueva.
- MCP, embeddings, móviles, multiusuario, restauración/saneamiento y backups sintéticos: fuera del alcance histórico; el backup real nocturno de S4 sí permanece.

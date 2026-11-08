# Flucastr.Memory-AI

## Propósito y estructura
Condensado de `old/v1/definitions/PROJECT.md`, `ARCHITECTURE.md` y `REPOS.md`.
Un solo repositorio TypeScript ESM con SQLite/FTS5. El objetivo aprobado históricamente es que un servidor Windows+WSL 24/7 conserve la memoria y Mac/WSL accedan como clientes HTTP delgados. El MVP exige guardar una decisión desde Claude Code Mac y recuperarla al abrir Pi WSL en el mismo proyecto, sin copiar ni pegar.

## Arquitectura objetivo y decisiones
Mac/WSL → HTTPS privado de Tailscale Serve → HTTP Bearer en 127.0.0.1:7420 → SQLite central. Solo el servidor abre la base; no hay fallback local del cliente. Esto evita sincronización y divergencias. Tailscale evita mantener TLS/CA propios; SQLite/FTS5 evita añadir un servicio de base o embeddings.

Memorias con seis campos: id, type, scope, text, origin, date. Tipos decision/learning/resolved-blocker/rule; ámbitos general o project:<nombre>. POST save/search/recent/forget; ID idempotente, conflicto distinto 409. Search incluye ámbito exacto más general, términos OR literales, BM25 e ID para desempate, máximo cinco memorias y 4000 bytes JSON UTF-8 con LF. Recent tiene límite predeterminado 15, sin el tope de search. Forget explícito y transaccional. S2 implementa el contrato HTTP sobre SQLite y FTS5; `./verify` pasó suite 44/44 y el recorrido loopback aislado. Evidencia: `cambios/hechos/servidor-central/plan.md`. El contrato detallado histórico sigue en `old/v1/definitions/ARCHITECTURE.md`; no prueba implementación actual.

## Estado observado durante la migración
`package.json` exige Node >=24.22.1 <25, distinto de los requisitos antiguos del README y PROJECT. `src/serve.ts` prepara base/token y servidor loopback; `src/http-server.ts` implementa save/search/recent/forget, con errores genéricos y rutas replacements/conflicts retiradas. `src/remote-cli.ts` conserva save/search con opciones explícitas. S3 añade el bin `mem` en `src/mem.ts`: save/search/recent/forget remotos y serve, MEM_URL/MEM_TOKEN, scope Git automático y origen configurable; transporte HTTP/HTTPS sin fallback SQLite cliente. Instalación y uso: `docs/cliente-mem.md`. README contiene descripción antigua; su actualización pertenece a S5.
`npm run build` pasó bajo Node v24.22.1. `./verify` ejecuta instalación desde lock, typecheck/build, suite, CLI/doctor y recorrido loopback aislado con limpieza Compose; requiere Docker Engine y Compose. `npm run verify` sigue siendo la comprobación parcial. Para targets remotos, `VERIFY_TARGET=<url> MEM_TOKEN=<token> ./verify` solo lee por defecto; con escritura explícita, elimina el registro de prueba mediante forget. Aceptación independiente de verify: 43/43 pruebas; evidencia en `cambios/hechos/verify/plan.md`. S2: 44/44 pruebas y `./verify` completo pasaron; evidencia en `cambios/hechos/servidor-central/plan.md`.

## Pendientes migrados
S1, S2 y S3 están implementados; S4 entrega un backup local real con retención de siete copias y plantillas probadas para systemd/cron. La instalación en WSL, Tailscale Serve y comprobaciones tras reinicios siguen pendientes de Franco. S5 sigue pendiente. Al repetir `instalar.sh --migrar <proyecto> --simular`, el instalador se detuvo sin cambios porque `old/v1/` ya existe; no produjo un inventario nuevo.

Verify está implementado y su evidencia aprobada por Franco; plan archivado en `cambios/hechos/verify/plan.md`, conservando `estado: listo`. La migración documental y los cambios verify y S2 están integrados en `main` mediante PR.

S3 aprobado e integrado en main mediante PR #12: `./verify` sin caché pasó 46/46 pruebas, recorrido servidor y paquete instalado en prefijo temporal; plan archivado en `cambios/hechos/cliente-mem/plan.md`, conservando `estado: listo`. La prueba distribuida Mac/WSL sigue pendiente.

S4: evidencia aprobada por Franco; `./verify` independiente sin caché pasó 51/51 pruebas, recorrido HTTP, paquete instalado y limpieza Compose. Plan archivado en `cambios/hechos/servicio-backup/plan.md`, conservando `estado: listo`. Pendientes el commit y PR de Franco; no se afirma integración de S4 en main. El alta del servicio/cron y el resultado real del host se anotarán cuando Franco los instale.

Siguiente cambio, después del commit y PR de S4: `cambios/inicio-agentes/plan.md`, todavía en borrador.

## Despliegue
- Destino objetivo: servidor Windows+WSL 24/7; instalación efectiva pendiente de confirmar por Franco.
- Variables del contrato: MEM_DB, MEM_TOKEN, MEM_URL; `.env.example` contiene valores sintéticos para verificación, no credenciales ni configuración de producción.
- Migraciones: pendiente documentar el mecanismo real antes de operación.
- Backup local: el script y las plantillas están implementados y cubiertos por `./verify`; no se afirma que haya copias nocturnas operativas antes de la instalación manual.
- Comprobación posterior remota (solo lectura por defecto): `VERIFY_TARGET=<url> MEM_TOKEN=<token> ./verify`; la escritura requiere `VERIFY_PERMITIR_ESCRITURA=1` y deja registros de prueba.

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

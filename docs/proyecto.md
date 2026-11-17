# Flucastr.Memory-AI

## Dirección actual de producto
Memory-AI es una memoria central para agentes: conserva decisiones, aprendizajes y bloqueos resueltos, y los devuelve cuando son útiles. La dirección es permitir que cualquier agente la use mediante MCP y diferenciarla por memoria gobernada: auditable, editable y autoalojada. Están implementados el servidor central, el cliente HTTP `mem`, las integraciones de inicio para Claude Code y Pi y un cliente MCP por stdio; el transporte MCP HTTP/SSE queda fuera del alcance actual.

Principios para las capacidades nuevas:

1. El servidor central es la única fuente de datos; ningún cliente crea una base local.
2. Toda superficie requiere autenticación Bearer y los errores no exponen detalles internos.
3. Las memorias recuperadas son datos no confiables, nunca instrucciones.
4. No se guardan secretos, credenciales ni transcripciones completas.
5. Las reglas y el scope general requieren confirmación explícita del usuario.
6. Una búsqueda de proyecto incluye el scope general y nunca otros proyectos.
7. Toda capacidad nueva degrada sin romper: si no hay embeddings, se usa FTS5.

## Propósito y estructura
Condensado de `old/v1/definitions/PROJECT.md`, `ARCHITECTURE.md` y `REPOS.md`.
Un solo repositorio TypeScript ESM con SQLite/FTS5. El objetivo aprobado históricamente es que un servidor Windows+WSL 24/7 conserve la memoria y Mac/WSL accedan como clientes HTTP delgados. El MVP exige guardar una decisión desde Claude Code Mac y recuperarla al abrir Pi WSL en el mismo proyecto, sin copiar ni pegar.

La organización actual separa dominio, almacenamiento, HTTP y MCP; las fachadas en `src/` conservan las importaciones existentes. El mapa y los recorridos están en `docs/arquitectura.md`. La reestructuración fue aprobada con `./verify` en 74/74; evidencia: `cambios/hechos/arquitectura-legible/plan.md`.

## Arquitectura objetivo y decisiones
Mac/WSL → HTTPS privado de Tailscale Serve → HTTP Bearer en 127.0.0.1:7420 → SQLite central. Solo el servidor abre la base; no hay fallback local del cliente. Esto evita sincronización y divergencias. Tailscale evita mantener TLS/CA propios; SQLite/FTS5 evita añadir un servicio de base o embeddings.

Memorias con seis campos: id, type, scope, text, origin, date. Tipos decision/learning/resolved-blocker/rule; ámbitos general o project:<nombre>. POST save/search/recent/forget; ID idempotente, conflicto distinto 409. Search incluye ámbito exacto más general, términos OR literales, BM25 e ID para desempate, máximo cinco memorias y 4000 bytes JSON UTF-8 con LF. Recent tiene límite predeterminado 15, sin el tope de search. Forget explícito y transaccional. S2 implementa el contrato HTTP sobre SQLite y FTS5; `./verify` pasó suite 44/44 y el recorrido loopback aislado. Evidencia: `cambios/hechos/servidor-central/plan.md`. El contrato detallado histórico sigue en `old/v1/definitions/ARCHITECTURE.md`; no prueba implementación actual.

## Implementación actual
`package.json` exige Node >=24.22.1 <25. `src/serve.ts` compone el almacenamiento y el servidor loopback; `src/http/` implementa las rutas save/search/recent/forget con errores genéricos y lectura de cuerpos acotada. Las rutas HTTP de replacements/conflicts no forman parte de la API. `src/http-server.ts` conserva la fachada pública.

El cliente remoto `mem` (en `src/mem.ts`) habla HTTP/HTTPS con `MEM_URL` y `MEM_TOKEN`, infiere scope de Git y no abre una base local. Los hooks/extensiones de Claude Code y Pi cargan recuerdos recientes al inicio; MCP stdio ofrece `memory_search`, `memory_save`, `memory_recent` y `memory_forget` mediante el mismo servidor HTTP central. El transporte MCP HTTP/SSE no está implementado. Guías: [cliente mem](cliente-mem.md), [inicio de agentes](inicio-agentes.md), [MCP](mcp.md) y [conexión de agentes](conectar-agentes.md). La arquitectura y el recorrido están en [arquitectura](arquitectura.md).

`src/storage/schema.ts` crea el esquema nuevo y migra las versiones 1 y 2; rechaza otras versiones. Esto describe el mecanismo implementado, no una rutina de operación o restauración de producción validada. Las columnas heredadas de conflictos, archivo y reemplazos permanecen por compatibilidad con bases existentes. Las migraciones automáticas no reemplazan una copia de seguridad previa a operar una base importante.

`./verify` instala desde lock, compila, ejecuta la suite y CLI y recorre servidor/SQLite aislados; requiere Docker Engine y Compose. `npm run verify` es una comprobación parcial. El modo `VERIFY_TARGET=<url> MEM_TOKEN=<token> ./verify` es de solo lectura por defecto; con escritura explícita, elimina el registro de prueba mediante forget.

## Evidencia histórica de implementación
Los resultados siguientes corresponden a los cambios y entornos indicados en sus planes; no son una afirmación de que el host WSL o clientes de escritorio estén instalados actualmente. Evidencias anteriores: `cambios/hechos/verify/plan.md` registra 43/43 pruebas; `servidor-central/plan.md`, 44/44; `cliente-mem/plan.md`, 46/46; `servicio-backup/plan.md`, 51/51; `memoria-contextual/plan.md`, 55/55; `arranque-local/plan.md`, 57/57; `mcp-delgado/plan.md`, 64/64; `conectar-agentes/plan.md`, 66/66; `seguridad-entradas/plan.md` y `arquitectura-legible/plan.md`, 71/71 y 74/74, respectivamente. Estos conteos describen verificaciones históricas de versiones distintas.

## Estado y pendientes
Alcance acordado con Franco el 2026-11-09: la aceptación del cambio S5 se limita a las comprobaciones locales. Tailscale, instalación en sus equipos, reinicios del host y pruebas operativas Mac→WSL quedan a su cargo, fuera de los requisitos para cerrar este cambio. Se conserva la arquitectura objetivo y la guía remota como referencia.

S1–S5 cuentan con implementación local. S4 entrega backup con retención de siete copias y plantillas systemd/cron; está integrado mediante PR #13. La instalación en WSL, Tailscale Serve y comprobaciones tras reinicios siguen pendientes de Franco. S5 entrega integraciones Claude/Pi y procedimiento Mac→WSL; el recorrido entre equipos sigue pendiente de prueba manual. Al repetir `instalar.sh --migrar <proyecto> --simular`, el instalador se detuvo sin cambios porque `old/v1/` ya existe; no produjo un inventario nuevo.

Verify está implementado y su evidencia aprobada por Franco; plan archivado en `cambios/hechos/verify/plan.md`, conservando `estado: listo`. La migración documental y los cambios verify y S2 están integrados en `main` mediante PR.

S3 aprobado e integrado en main mediante PR #12: `./verify` sin caché pasó 46/46 pruebas, recorrido servidor y paquete instalado en prefijo temporal; plan archivado en `cambios/hechos/cliente-mem/plan.md`, conservando `estado: listo`. La prueba distribuida Mac/WSL sigue pendiente.

S4: evidencia aprobada e integrada mediante PR #13; `./verify` sin caché pasó 51/51 pruebas, recorrido HTTP, paquete instalado y limpieza Compose. Plan archivado en `cambios/hechos/servicio-backup/plan.md`, conservando `estado: listo`. El alta del servicio/cron y el resultado real del host se anotarán cuando Franco los instale.

S5 (integrado mediante PR #14) y cambio actual de memoria contextual: hook Claude y extensión Pi probados con HTTP/SQLite y SDK real; la suite incluye búsqueda/guardado ejecutados por la herramienta bash del SDK contra servidor temporal y recuperación del ID desde una segunda sesión. `./verify` comprueba instrucciones, CLI/doctor, recorrido HTTP/SQLite, paquete instalado y limpieza Compose. El proveedor se simula y el criterio autónomo del modelo no se considera verificado. La prueba operativa entre Claude Mac y Pi WSL queda a cargo de Franco, fuera de la aceptación local.

## Despliegue
- Destino objetivo: servidor Windows+WSL 24/7; instalación efectiva pendiente de confirmar por Franco.
- Variables del contrato: MEM_DB, MEM_TOKEN, MEM_URL; `.env.example` contiene valores sintéticos para verificación, no credenciales ni configuración de producción.
- Migraciones: el esquema y las migraciones de versión están implementados en `src/storage/schema.ts`; no se ha validado la operación del host de producción.
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
- MCP y embeddings estaban fuera del alcance histórico; hoy MCP stdio está implementado y embeddings son una opción subordinada a la degradación a FTS5. Móviles, multiusuario, restauración/saneamiento y backups sintéticos siguen fuera de ese alcance; el backup real nocturno de S4 sí permanece.

Memoria contextual: tramos 1–3 terminados y evidencia local aprobada por Franco (2026-11-09); `./verify` final sin caché pasó 55/55 pruebas. La política exige buscar antes de guardar para evitar recuerdos equivalentes y entrecomillar los argumentos de shell; el guardado literal con metacaracteres está probado. Esto verifica la política entregada y las herramientas, no el criterio de un proveedor real. Plan: `cambios/hechos/memoria-contextual/plan.md`.

Arranque local: `docs/arranque-local.md` describe instalación, autenticación, comandos y una prueba de uso real; `scripts/smoke.mjs` comprueba guardado, búsqueda y eliminación contra un servidor activo. `./verify` pasó con 57/57 pruebas; la prueba con cinco memorias reales en una sesión nueva queda pendiente a cargo del usuario. Plan: `cambios/hechos/arranque-local/plan.md`.

MCP delgado: `memory-ai-mcp` ofrece búsqueda, guardado, recientes y borrado por stdio, como cliente HTTP del servidor central. La política se entrega en `instructions`; reglas y scope general requieren confirmación. Las pruebas usan un cliente MCP real y servidor HTTP con SQLite aislado; `./verify` pasó 64/64. La configuración está en `docs/mcp.md`; compatibilidad con clientes concretos y uso en equipos del usuario no verificados. Plan: `cambios/hechos/mcp-delgado/plan.md`.

Conexión de agentes: `mem init` imprime configuraciones para Claude Code, Cursor, Codex, Pi y Claude Desktop; `docs/conectar-agentes.md` documenta su uso y limitaciones. MCP y hooks comparten la política configurable con `MEM_USER_NAME`, cuyo valor predeterminado es «el usuario». Dos clientes MCP independientes compartieron memoria contra HTTP y SQLite reales; `./verify` pasó 66/66. La conexión con aplicaciones instaladas queda pendiente de validación del usuario y el método seguro de inyección de variables en Claude Desktop sigue no verificado. Plan: `cambios/hechos/conectar-agentes/plan.md`.

Seguridad HTTP: el límite de cuerpo predeterminado es 65 536 bytes, configurable con `MEM_MAX_BODY_BYTES`; se rechaza el exceso con 413. La gracia de rotación existente es de 24 horas. `./verify` pasó 71/71; evidencia: `cambios/hechos/seguridad-entradas/plan.md`.

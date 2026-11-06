# Memoria central para agentes
Estado: BORRADOR; aprobación conjunta de Franco pendiente al terminar la preparación.
## Objetivo y fuentes
Confirmado por Franco (encargo y reintento): un único servidor Windows+WSL 24/7 guarda la memoria; Mac y WSL son clientes delgados HTTP.
Confirmado por lectura de `package.json`: TypeScript ESM, Node >=22.23.2 <23, scripts build/test; aún no hay entrada bin declarada.
Confirmado por `src/http-server.ts`, `src/memory.ts`, `src/response.ts`: existen save/search por POST, SQLite/FTS5, ID idempotente y límite serializado 5/4000 bytes.
Discrepancias verificadas: HTTPS propio, scopes Atlas/Birch, búsqueda AND con FTS temporal; recent/forget no tienen ruta. Son cambios pendientes, no funcionamiento demostrado.
## Funcionando verificable (criterios pendientes de evidencia real)
- MVP: guardar desde Claude Code Mac una decisión de Don Financio; al abrir Pi WSL dentro del mismo repo aparece sin copiar ni pegar.
- Dos clientes apuntan al mismo servidor: alta idempotente por ID, búsqueda OR+BM25, recientes y olvido por contrato de ARCHITECTURE.md.
- Tipos: decision, learning, resolved-blocker, rule; scopes general o project:<nombre>; búsqueda incluye general y el proyecto solicitado.
- Search: máximo cinco memorias y 4000 bytes UTF-8 de respuesta JSON completa; recent acepta --limit (predeterminado 15), sin ese tope de search (corrección de Franco).
- Solo el servidor abre SQLite; servidor caído produce error cliente de una línea; SessionStart Claude no emite nada sin datos o servidor.
- HTTPS solo dentro del tailnet mediante Tailscale Serve; HTTP interno en 127.0.0.1:7420 con Bearer.
- Scripts de servicio y backup real nocturno con sqlite3 .backup y retención de siete copias; instalación manual exclusiva de Franco.
## Preparación y ejecución posterior
Todo S1–S5 está pendiente; no se ejecutaron instalación, build, tests ni despliegue en esta pasada.
Una sola aprobación conjunta al finalizar preparación; no se solicitan aprobaciones intermedias.
Cada slice apunta a unas 200 líneas; si las excede se divide antes de ejecutarlo.
1. S1: limpieza y base verde con npm install, npm run build y npm test reales; retirar gates F02/F03 y material sintético con sus tests/docs.
2. S2: servidor central, persistencia, autenticación y cuatro endpoints con pruebas reales del contrato.
3. S3: cliente mem, bin/npm link y E2E loopback contra servidor real, sin base local.
4. S4: scripts systemd/Tailscale y backup real nocturno; Franco instala y aporta evidencia en su servidor.
5. S5: SessionStart Claude e integración de inicio Pi; prueba MVP entre Mac/WSL y README de menos de 100 líneas.
## Fuera de alcance
Retirar TLS/CA propios, fixtures Atlas/Birch, backups sintéticos, restauración, saneamiento y runbooks, junto con sus tests/docs asociados.
El backup real S4 NO es el backup sintético retirado y permanece dentro del alcance.
Sin MCP, embeddings, móviles, multiusuario ni cifrado de backups; ideas enumeradas en IDEAS.md.
Sin nuevos repos, gates, fichas, runbooks ni investigaciones abiertas; no modificar código/README/tareas durante esta preparación.
## Decisiones para Franco
Sin pregunta indispensable abierta: aprobar o rechazar conjuntamente estos borradores al concluir la preparación; ejecución todavía no autorizada.

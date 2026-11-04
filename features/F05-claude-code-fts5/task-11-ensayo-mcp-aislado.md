# task-11 — Ensayo técnico MCP aislado, sin adaptar
repo: Flucastr.Memory-AI   depende_de: —   estado: borrador

## Descripción
Ensayar MCP Memory Service con decisiones sintéticas desde Claude Code y Pi reales.
Una sesión de 90 min incluyendo descargas/login, sin correcciones ni reintentos.
Entregar funciona/falla/bloqueado y continuar/descartar; preparar no autoriza operar.

## Contexto
Leer `features/F05-claude-code-fts5/preflight-mcp.md` §§Matriz de evidencia y brechas, Guion sintético posterior — no ejecutado, Veredicto y gates para pedir autorización agrupada; no task-10.
- Fuente: definitions/COMPARACION-MEMORIA-MVP.md «Recomendación única»
- Tocar: `features/F05-claude-code-fts5/resultado-ensayo-mcp.md`
- Requiere: red, puerto:8765, runtime:python3@3.14.4, largo:900
Confirmado: Python 3.14.4, venv no probado, sin pip/uv; Claude 2.1.308 y Pi 1.5.0: flags verificados por --help. Sin leer auth/config.
Fuentes: https://github.com/doobidoo/mcp-memory-service/tree/v12.3.1 = `8d0125dc992604ba12875170ed7c6ac76331dc1e`. En src/mcp_memory_service: config/*.py, variables; utils/startup_orchestrator.py:424–584, auth sin TLS; web/oauth/middleware.py:get_current_user, Bearer. No HTTP FastMCP sin auth. pyproject.toml: extra sqlite/Python >=3.10, no wheels 3.14. embeddings/onnx_embeddings.py: modelo custom; https://huggingface.co/onnx-community/paraphrase-multilingual-MiniLM-L12-v2-ONNX: apache-2.0. Operativos **no ejecutados, inferidos**.

## Decisiones ya tomadas
Franco autoriza PREPARAR, no operar. Candidato único, datos general/Atlas/Birch; si necesita adaptador identificar y detener tramo, NO construirlo.
Piloto HTTP nativo loopback con Bearer efímero, NO remoto/TLS habilitado. Sin desactivar TLS/auth ni bypass. Si aprobación exige HTTPS loopback, parar antes de instalar: entrypoint sin TLS; no improvisar proxy.
Franco debe aprobar agrupadamente: Linux/90 min; venv/DB/cachés temporales; descargas HTTPS GitHub/PyPI/extra sqlite y pesos ONNX Hugging Face citados; 127.0.0.1:8765; clientes por suscripción existente sin gasto/API pagada y login temporal del operador. Sin permiso/acceso bloquear, nunca configurar global.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Una SQLite compartida temporal. Fuera de alcance: producto/candidato, adaptadores, instalaciones globales, servidor definitivo, túneles, datos reales, repos externos, hooks, purga, sincronización, API pagada, commit.

## Pasos
1. **0–10 min.** Registrar permiso/reloj. `df -h /tmp; free -m`: exigir 4 GiB disco/2 GiB RAM. A; sin pip/venv parar, no otro runtime.
2. **10–30 min.** B una vez. Registrar versiones. Revisar código <=5 min: auth /mcp, esquemas guardar/buscar, filtro pre-ranking, automatismos. Sin filtro bloquear tramo e identificar adaptador, sin construir/postfiltrar.
3. **30–40 min.** C, readiness <=180 s. `ss -ltn`: solo 127.0.0.1:8765; otro bind detiene. D exige 401/403, no error JSON-RPC. Anónimo detiene todo. Negativo por superficie activa; HTTP adicional/mDNS deshabilitados. Key compartida no autoriza por proyecto.
4. **40–70 min.** E con HOME/config aislados. Franco login por interfaz oficial <=180 s por cliente, sin mostrar/pegar/copiar secretos existentes. Sin acceso/login aislado bloquear cliente, no API sustituta. Solo herramientas memoria, sin shell/archivos/bypass. Claude guarda Atlas del bloque E; confirmar general «Los reintentos de cobro requieren clave idempotente» y Birch «Las entregas fallidas se descartan sin reintento». Registrar llamadas/parámetros/IDs/ámbitos. Claude nuevo y Pi nuevo preguntan lo indicado en E sin texto esperado. Exigir ID Atlas top 5 y modelo/vector efectivo, nunca hash/FTS5. Falta transporte/esquema/aislamiento: parar tramo, no extensión/adaptador.
5. **70–80 min.** Por clientes: Atlas incluye Atlas+general sin Birch; general solo general. Otras paráfrasis: «¿Qué hacemos con las notificaciones perdidas al reconectar?» y «¿Se vuelven a enviar los avisos que fallaron?». Vacío: «¿Qué color elegimos para el satélite?», no inventar decisión. Evidencia filtro pre-ranking separada de resultados. Parar proceso C propio y relanzar con mismo HOME/DB; cliente nuevo recupera mismo ID. Llamadas <=180 s; omitir con motivo si no cabe.
6. **80–90 min.** En Tocar: matriz versión/tiempo/input/llamada sanitizada/IDs/orden/modelo/esperado/observado; funciona/falla/bloqueado/no ejecutado. Continuar solo si ambos clientes, semántica y controles pasan; si no descartar ensayo con brecha, no incapacidad universal. OAuth persistente/idempotencia/4000 bytes no evaluados. Parar PID propio, unset tokens, eliminar credenciales temporales por rutas exactas. Sin rm -rf/killall/limpieza global. Franco retira temporal identificado; evidencia sin secretos.

## Criterios de aceptación
1. Aprobación/aislamiento/tiempos registrados o bloqueo sin ampliar permisos.
2. Claude guarda/recupera en proceso nuevo con ID/top 5/modelo vectorial, o fallo observable.
3. Ámbitos y rechazo anónimo con status/parámetros; filtro previo separado de tags/autorización.
4. Pi real recupera mismo ID tras reinicio o bloqueo, sin API sustituta/adaptador.
5. Informe continuar/descartar sanitizado, <=90 min, pendientes/reversibilidad; sin certificar remoto.

## Verificación
Solo tras aprobación. Pruebas <=180 s; B indivisible <=900 s; C <=2400 s incluyendo pruebas. Todo consume 90 min, sin reintentos ni logs de tokens/headers.

A:
```bash
umask 077
P=$(mktemp -d /tmp/mcp-pilot.XXXXXXXX)
mkdir -p "$P"/{server,claude,pi,work}
timeout 180 python3 -m venv "$P/venv"
"$P/venv/bin/python" -m pip --version
```
B:
```bash
timeout 900 env PIP_CACHE_DIR="$P/pip-cache" "$P/venv/bin/python" -m pip install 'mcp-memory-service[sqlite] @ https://github.com/doobidoo/mcp-memory-service/archive/8d0125dc992604ba12875170ed7c6ac76331dc1e.tar.gz'
```
C, PID propio, token privado:
```bash
set +x
TOKEN=$(openssl rand -hex 32)
(cd "$P/work" && env -i PATH="$P/venv/bin:/usr/bin:/bin" HOME="$P/server" \
 MCP_MEMORY_BASE_DIR="$P/server/data" MCP_MEMORY_SQLITE_PATH="$P/server/memory.db" \
 MCP_MEMORY_STORAGE_BACKEND=sqlite_vec MCP_MEMORY_USE_ONNX=true \
 MCP_EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2 \
 MCP_ONNX_MODEL_REPO=onnx-community/paraphrase-multilingual-MiniLM-L12-v2-ONNX \
 MCP_CONSOLIDATION_ENABLED=false MCP_MDNS_ENABLED=false MCP_HTTP_ENABLED=false \
 MCP_ALLOW_ANONYMOUS_ACCESS=false MCP_API_KEY="$TOKEN" \
 MCP_STREAMABLE_HTTP_MODE=1 MCP_SSE_HOST=127.0.0.1 MCP_SSE_PORT=8765 \
 timeout 2400 "$P/venv/bin/python" -m mcp_memory_service.server) &
SERVER_PID=$!
```
D, esperar 401/403:
```bash
timeout 180 curl --max-time 30 -sS -o "$P/anonymous.json" -w '%{http_code}\n' -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' --data '{"jsonrpc":"2.0","method":"tools/list","id":1}' http://127.0.0.1:8765/mcp
```
E: operador escribe archivo privado `$P/claude/mcp.json`: `{"mcpServers":{"memoria":{"type":"http","url":"http://127.0.0.1:8765/mcp","headers":{"Authorization":"Bearer ${PILOT_TOKEN}"}}}}`. Confirmar expansión env oficial; sin soporte bloquear. Tras login aislado ejecutar desde `$P/work`:
```bash
export PILOT_TOKEN="$TOKEN"
HOME="$P/pi" PI_CODING_AGENT_DIR="$P/pi/agent" timeout 180 pi mcp add memoria --local --url http://127.0.0.1:8765/mcp --bearer-token-env-var PILOT_TOKEN --exposure direct
HOME="$P/claude" timeout 180 claude --bare --setting-sources '' --strict-mcp-config --mcp-config "$P/claude/mcp.json" --tools '' --no-session-persistence -p 'Guarda en Atlas: La cola de avisos conserva entregas fallidas para reintentar después'
HOME="$P/pi" PI_CODING_AGENT_DIR="$P/pi/agent" timeout 180 pi --no-extensions --no-skills --no-context-files --no-prompt-templates --no-builtin-tools --no-session --approve --mode json -p 'Consulta memoria Atlas: ¿Cómo tratamos los mensajes que no llegaron cuando vuelve la conectividad? Cita ID recuperado'
```
Variar prompt, proceso nuevo. Sin llamadas en print, interfaz real con igual límite; texto final no prueba integración.

## Evidencia
Pendiente; nada probado.

## Notas
Franco revisa; no autoriza operar.

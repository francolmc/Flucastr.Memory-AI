#!/usr/bin/env bash
# Human-only controlled renewal. Preparing this file does not execute it.
set +x
set -Eeuo pipefail
umask 077

P=/tmp/mcp-client-login.wqii6ZLR
ROOT=/tmp/mcp-pilot.H9zsm57l
PID_EXPECTED=324698
DB="$ROOT/server/memory.db"
MODEL="$ROOT/server/.cache/mcp_memory/onnx_models/paraphrase-multilingual-MiniLM-L12-v2"
HF_CACHE="$ROOT/server/.cache/huggingface/hub/models--onnx-community--paraphrase-multilingual-MiniLM-L12-v2-ONNX"
PY="$ROOT/venv/bin/python"
AGENT="$P/pi-agent"
WORK="$P/work"
CONFIG="$AGENT/mcp.json"
LOG="$P/pilot-renewal.log"
SERVER_PID=

abort() { printf 'ABORT: %s\n' "$1" >&2; exit 1; }
cleanup() {
  local rc=$?
  trap - EXIT HUP INT TERM
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -TERM "$SERVER_PID" 2>/dev/null || true
    for _ in {1..30}; do
      kill -0 "$SERVER_PID" 2>/dev/null || break
      sleep 1
    done
    if kill -0 "$SERVER_PID" 2>/dev/null; then
      printf 'ERROR: owned server PID %s did not exit after TERM; no force-kill attempted.\n' "$SERVER_PID" >&2
      rc=1
    fi
  fi
  unset PILOT_TOKEN MCP_API_KEY
  exit "$rc"
}

# Static preflight: paths, installed tools and exact existing model artifacts.
[[ -x "$PY" && -d "$WORK" && -d "$ROOT/server" ]] || abort 'pilot Python/work/server setup missing'
[[ -f "$DB" ]] || abort 'confirmed pilot SQLite DB missing'
[[ -d "$MODEL" && -s "$MODEL/onnx/model.onnx" && -s "$MODEL/tokenizer.json" && -s "$MODEL/config.json" && -s "$MODEL/tokenizer_config.json" ]] || abort 'local ONNX model artifacts incomplete; offline run forbidden'
[[ -d "$HF_CACHE" ]] || abort 'HF cache root missing'
[[ -x "$P/pi-agent/bin/pi" || -x /home/franco/.pi/agent/bin/pi ]] || abort 'Pi executable missing'
command -v openssl >/dev/null || abort 'openssl unavailable'
command -v ss >/dev/null || abort 'ss unavailable'
command -v curl >/dev/null || abort 'curl unavailable'
[[ -f "$CONFIG" ]] || abort 'isolated Pi MCP config missing'
# Validate only expected public shape and env-variable reference; never print/read token value.
python3 - "$CONFIG" <<'PY' || abort 'Pi MCP config shape/reference mismatch'
import json,sys
x=json.load(open(sys.argv[1]))
s=x.get('mcpServers',{}).get('memoria',{})
# Pi accepts Streamable HTTP via URL; `type` is optional in MCP server config.
assert s.get('type') in (None, 'http')
assert s.get('url') == 'http://127.0.0.1:8765/mcp'
assert s.get('headers',{}).get('Authorization') == 'Bearer ${PILOT_TOKEN}'
PY

# Fail closed unless the exact pre-existing pilot is still bound solely to loopback.
ss -H -ltnp 'sport = :8765' > "$P/listeners.before"
[[ $(wc -l < "$P/listeners.before") -eq 1 ]] || abort 'port 8765 is not occupied by exactly one listener'
grep -Fq '127.0.0.1:8765' "$P/listeners.before" || abort 'port 8765 listener is not loopback IPv4'
grep -Fq "pid=$PID_EXPECTED," "$P/listeners.before" || abort 'listener PID differs from confirmed pilot PID'
[[ "$(readlink "/proc/$PID_EXPECTED/exe" 2>/dev/null)" == /usr/bin/python3.14 ]] || abort 'confirmed pilot executable identity mismatch'
[[ "$(readlink "/proc/$PID_EXPECTED/cwd" 2>/dev/null)" == "$WORK" ]] || abort 'confirmed pilot cwd identity mismatch'
[[ "$(ps -p "$PID_EXPECTED" -o pid= | tr -d ' ')" == "$PID_EXPECTED" ]] || abort 'confirmed pilot process disappeared'
fd_db=0
for fd in /proc/"$PID_EXPECTED"/fd/*; do
  target=$(readlink "$fd" 2>/dev/null || true)
  case "$target" in "$DB"|"$DB-wal"|"$DB-shm") fd_db=1;; esac
done
(( fd_db == 1 )) || abort 'confirmed pilot process no longer holds the specified DB or its WAL/SHM'
# Database roots can contain the existing data used by the service; never create/migrate/delete them here.
[[ -d "$ROOT/server/data" ]] || abort 'confirmed data root missing'

# Only now stop the verified prior process; never signal a guessed/foreign PID.
kill -TERM "$PID_EXPECTED" || abort 'TERM of verified pilot PID failed'
for _ in {1..30}; do
  kill -0 "$PID_EXPECTED" 2>/dev/null || break
  sleep 1
done
kill -0 "$PID_EXPECTED" 2>/dev/null && abort 'verified prior server did not exit after TERM; refusing further action'
ss -H -ltnp 'sport = :8765' > "$P/listeners.after-term"
[[ ! -s "$P/listeners.after-term" ]] || abort 'port 8765 remains occupied after verified server exited'

# Ephemeral shared auth key exists only in this shell/process environment.
export PILOT_TOKEN="$(openssl rand -hex 32)"
export MCP_API_KEY="$PILOT_TOKEN"
[[ ${#PILOT_TOKEN} -eq 64 ]] || abort 'openssl did not produce expected token length'
: > "$LOG"
chmod 600 "$LOG"
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

cd "$WORK"
# Offline flags are supported by installed release; model cache is local and checked above.
HOME="$ROOT/server" MCP_MEMORY_BASE_DIR="$ROOT/server/data" MCP_MEMORY_SQLITE_PATH="$DB" \
MCP_MEMORY_STORAGE_BACKEND=sqlite_vec MCP_MEMORY_USE_ONNX=true \
MCP_EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2 \
MCP_ONNX_MODEL_REPO=onnx-community/paraphrase-multilingual-MiniLM-L12-v2-ONNX \
MCP_MEMORY_OFFLINE=1 HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 \
MCP_CONSOLIDATION_ENABLED=false MCP_MDNS_ENABLED=false MCP_HTTP_ENABLED=false \
MCP_ALLOW_ANONYMOUS_ACCESS=false MCP_API_KEY="$MCP_API_KEY" \
MCP_STREAMABLE_HTTP_MODE=1 MCP_SSE_HOST=127.0.0.1 MCP_SSE_PORT=8765 \
"$PY" -m mcp_memory_service.server >>"$LOG" 2>&1 &
SERVER_PID=$!
printf 'Started owned server PID %s; private log: %s\n' "$SERVER_PID" "$LOG"

ready=0
for _ in {1..180}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    printf 'Server exited before readiness; inspect private log: %s\n' "$LOG" >&2
    exit 1
  fi
  ss -H -ltnp 'sport = :8765' > "$P/listeners.new" || true
  if [[ $(wc -l < "$P/listeners.new") -eq 1 ]] && grep -Fq '127.0.0.1:8765' "$P/listeners.new" && grep -Fq "pid=$SERVER_PID," "$P/listeners.new" && curl --max-time 2 -fsS http://127.0.0.1:8765/health >/dev/null 2>&1; then
    ready=1; break
  fi
  # Any foreign or non-loopback listener is a hard stop; cleanup targets only our PID.
  if [[ -s "$P/listeners.new" ]] && ! grep -Fq "pid=$SERVER_PID," "$P/listeners.new"; then
    abort 'port 8765 occupied by another process during readiness'
  fi
  if [[ -s "$P/listeners.new" ]] && ! grep -Fq '127.0.0.1:8765' "$P/listeners.new"; then
    abort 'server bound outside required loopback during readiness'
  fi
  sleep 1
done
(( ready == 1 )) || abort 'server failed readiness within 180 seconds; private log retained'

export HOME="$P/pi-home"
export PI_CODING_AGENT_DIR="$AGENT"
command -v pi >/dev/null || abort 'Pi executable not on PATH'
# Official Pi MCP check; do not print captured JSON (which is unnecessary for this procedure).
if ! pi mcp list --json > "$P/pi-mcp-list.json" 2> "$P/pi-mcp-list.stderr"; then
  printf 'Pi MCP listing failed; inspect private diagnostics: %s/pi-mcp-list.{json,stderr}\n' "$P" >&2
  exit 1
fi
python3 - "$P/pi-mcp-list.json" <<'PY' || abort 'Pi did not report connected MCP server and tools'
import json,sys
with open(sys.argv[1], encoding='utf-8') as f:
    x=json.load(f)
# Pi JSON output has documented connected/errors/tools fields; tolerate the
# documented list or servers-container envelope without accepting unknown shapes.
if isinstance(x, list):
    servers=x
elif isinstance(x, dict) and isinstance(x.get('servers'), list):
    servers=x['servers']
else:
    raise SystemExit('unrecognized pi mcp list JSON envelope')
s=next((v for v in servers if isinstance(v,dict) and v.get('name')=='memoria'),None)
if not s or s.get('state')!='connected' or s.get('errors') not in (None, []) or not isinstance(s.get('tools'),list) or not s['tools']:
    raise SystemExit('memoria is not connected with tools')
PY
printf 'MCP list connected. Launching interactive Pi; no model prompt/session is supplied. Use /quit to finish.\n'
pi
# EXIT trap sends TERM only to the newly-created server process and unsets the key.

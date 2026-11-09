#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/mem-bin-verify.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/packages" "$tmp/install"
npm pack "$ROOT" --ignore-scripts --cache "$tmp/cache" --pack-destination "$tmp/packages" >/dev/null 2>&1
npm install --prefix "$tmp/install" --cache "$tmp/cache" --ignore-scripts --omit=dev --no-audit --no-fund "$tmp/packages/flucastr-memory-ai-0.1.0.tgz" >/dev/null
bin="$tmp/install/node_modules/.bin/mem"
help="$("$bin" --help)"
grep -q 'mem — remote' <<<"$help"
grep -q 'mem save' <<<"$help"
grep -q 'mem search' <<<"$help"
grep -q 'mem recent' <<<"$help"
grep -q 'mem forget' <<<"$help"
"$bin" serve --help | grep -q 'Usage: mem serve'
scope="project:mem-bin-verify-$$"
query="mem-bin-verify-$$"
saved="$(MEM_URL=http://127.0.0.1:7420 "$bin" save --type decision --text "$query installed client" --scope "$scope")"
id="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).id)' "$saved")"
claude_hook="$tmp/install/node_modules/flucastr-memory-ai/integrations/claude-session-start.mjs"
claude_context="$(PATH="$tmp/install/node_modules/.bin:$PATH" MEM_URL=http://127.0.0.1:7420 node "$claude_hook" --scope "$scope" <<< '{"cwd":"/app"}')"
node -e 'const x=JSON.parse(process.argv[1]); if(x.hookSpecificOutput.hookEventName!=="SessionStart" || !x.hookSpecificOutput.additionalContext.includes(process.argv[2])) process.exit(1)' "$claude_context" "$id"
node --input-type=module -e 'const x=await import(process.argv[1]); if(typeof x.default!=="function" || typeof x.createPiMemoryExtension!=="function") process.exit(1)' "file://$tmp/install/node_modules/flucastr-memory-ai/integrations/pi-memory.mjs"
saved_second="$(MEM_URL=http://127.0.0.1:7420 "$bin" save --type learning --text "$query second client" --scope "$scope")"
id_second="$(node -e 'process.stdout.write(JSON.parse(process.argv[1]).id)' "$saved_second")"
found="$(MEM_URL=http://127.0.0.1:7420 "$bin" search --query "$query" --scope "$scope")"
node -e 'const x=JSON.parse(process.argv[1]); if(x.memories.length!==2) process.exit(1)' "$found"
recent="$(MEM_URL=http://127.0.0.1:7420 "$bin" recent --limit 1 --scope "$scope")"
node -e 'const x=JSON.parse(process.argv[1]); if(x.memories.length!==1 || ![process.argv[2],process.argv[3]].includes(x.memories[0].id)) process.exit(1)' "$recent" "$id" "$id_second"
MEM_URL=http://127.0.0.1:7420 "$bin" forget --id "$id" >/dev/null
after="$(MEM_URL=http://127.0.0.1:7420 "$bin" search --query "$query" --scope "$scope")"
node -e 'const x=JSON.parse(process.argv[1]); if(x.memories.length!==1 || x.memories[0].id!==process.argv[2]) process.exit(1)' "$after" "$id_second"
offline_home="$tmp/offline-home"; mkdir -p "$offline_home"
if output="$(HOME="$offline_home" MEM_URL=http://127.0.0.1:1 "$bin" search --query x --scope general 2>&1)"; then exit 1; fi
[[ "$output" == 'mem: servidor no disponible' ]]
[[ -z "$(find "$offline_home" -mindepth 1 -print -quit)" ]]
echo 'MEM BIN PACKAGE OK'

#!/usr/bin/env bash
# VERIFY_ESCRIBE: sí
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec node "$ROOT/scripts/verify-flujo.mjs" "$@"

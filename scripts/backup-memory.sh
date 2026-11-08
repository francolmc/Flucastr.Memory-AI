#!/usr/bin/env bash
set -euo pipefail
umask 077
export LC_ALL=C

fail() { printf 'backup-memory: %s\n' "$1" >&2; exit 1; }
[[ $# == 2 ]] || fail 'uso: backup-memory.sh <db-absoluta> <directorio-absoluto>'
db=$1
destination=$2
[[ $db == /* && $destination == /* ]] || fail 'las rutas deben ser absolutas'
[[ -f $db && ! -L $db ]] || fail 'la base debe existir y ser un archivo regular'

mkdir -p -- "$destination" || fail 'no se pudo preparar el directorio de copias'
[[ -d $destination && ! -L $destination ]] || fail 'el destino debe ser un directorio regular'
db_real=$(realpath -e -- "$db") || fail 'no se pudo resolver la base'
dest_real=$(realpath -e -- "$destination") || fail 'no se pudo resolver el destino'
[[ $db_real != "$dest_real" ]] || fail 'la base no puede ser el directorio de copias'

exec {lock_fd}>"$dest_real/.backup-memory.lock" || fail 'no se pudo abrir el bloqueo'
flock -n "$lock_fd" || fail 'ya hay una copia en curso'

temp=''
cleanup() {
  local rc=$?
  trap - EXIT
  if [[ -n $temp ]]; then rm -f -- "$temp"; fi
  exit "$rc"
}
interrupted() { exit 143; }
trap cleanup EXIT
trap interrupted HUP INT TERM

temp=$(mktemp -- "$dest_real/.mem-backup.XXXXXXXXXX.tmp") || fail 'no se pudo crear el temporal'
stamp=$(date -u +%Y%m%dT%H%M%S%NZ) || fail 'no se pudo obtener la hora UTC'
final="$dest_real/mem-${stamp}-$$.sqlite"

# The SQLite shell accepts a double-quoted dot-command argument; apostrophes
# remain literal and whitespace stays inside the single filename argument.
dot_target=${temp//\"/\"\"}
if ! printf '.timeout 5000\n.backup "%s"\n' "$dot_target" | timeout --signal=TERM --kill-after=5s 60s sqlite3 -readonly -bail "$db_real"; then
  fail 'falló la copia SQLite'
fi
check=$(timeout --signal=TERM --kill-after=5s 60s sqlite3 -readonly -batch -noheader "$temp" 'PRAGMA integrity_check;') || fail 'no se pudo validar la copia'
[[ $check == ok ]] || fail 'integrity_check no devolvió ok'

mv -- "$temp" "$final" || fail 'no se pudo publicar la copia validada'
temp=''

declare -a backups=()
for file in "$dest_real"/mem-????????T???????????????Z-*.sqlite; do
  [[ -f $file && ! -L $file ]] || continue
  name=${file##*/}
  [[ $name =~ ^mem-[0-9]{8}T[0-9]{15}Z-[0-9]+\.sqlite$ ]] || continue
  [[ $(realpath -e -- "$file") != "$db_real" ]] || continue
  backups+=("$file")
done
if (( ${#backups[@]} > 7 )); then
  remove_count=$((${#backups[@]} - 7))
  for ((i=0; i<remove_count; i++)); do
    rm -- "${backups[i]}" || fail 'no se pudo eliminar una copia antigua'
  done
fi
printf '%s\n' "$final"

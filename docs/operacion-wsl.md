# Operar el servidor de memoria en WSL

Esta guía instala manualmente `mem serve`, el backup nocturno y Tailscale Serve en la distribución WSL elegida por Franco. Los archivos del repositorio son plantillas: rellena los marcadores en copias locales, revísalas y luego instálalas con `sudo`.

## Requisitos previos

- WSL 2 actualizado con systemd habilitado en esa distribución; comprueba `ps -p 1 -o comm=` y que devuelva `systemd`. Microsoft documenta cómo habilitarlo en [WSL](https://learn.microsoft.com/en-us/windows/wsl/systemd): `/etc/wsl.conf` con `[boot]` y `systemd=true`, después `wsl.exe --shutdown` en PowerShell y reiniciar la distribución.
- Node.js `>=24.22.1 <25`, npm, Git, Bash, `sqlite3` con FTS5, `flock`, cron y Tailscale.
- Un checkout estable del repositorio en el sistema de archivos Linux de WSL, compilado con `npm ci && npm run build`.
- Un token recibido por el canal privado elegido por Franco. No lo pongas en la unidad, cron, argumentos, historial de shell ni logs.

systemd permite administrar servicios dentro de WSL, pero por sí solo no mantiene viva la distribución cuando Windows termina o apaga WSL. Esta instalación no configura el inicio de Windows, energía, Tailscale ni la continuidad 24/7.

## Preparar rutas y token

Desde tu checkout, define las rutas que usarás en las plantillas. Mantén la base y el destino de backups en el disco Linux local de WSL:

```sh
MEM_USER="$(id -un)"
MEM_HOME="$HOME"
MEM_REPO="$(git rev-parse --show-toplevel)"
MEM_NODE="$(command -v node)"
MEM_DB="$MEM_HOME/.mem/mem.sqlite"
MEM_BACKUP_DIR="$MEM_HOME/.mem/backups"
install -d -m 700 "$MEM_HOME/.mem" "$MEM_BACKUP_DIR"
```

Guarda el token en `$MEM_HOME/.mem/token` usando el canal privado y protege el archivo:

```sh
${EDITOR:-nano} "$MEM_HOME/.mem/token"
chmod 600 "$MEM_HOME/.mem/token"
```

No copies el token aquí ni lo incluyas en las unidades. `mem serve` lo lee de ese archivo por medio de `HOME`.

## Revisar e instalar las plantillas

Crea copias editables y reemplaza cada marcador por los valores anteriores. Comprueba que no queda ningún `@MEM_...@` antes de instalar.

```sh
cp "$MEM_REPO/ops/flucastr-memory.service.in" /tmp/flucastr-memory.service
cp "$MEM_REPO/ops/flucastr-memory.cron.in" /tmp/flucastr-memory.cron
${EDITOR:-nano} /tmp/flucastr-memory.service /tmp/flucastr-memory.cron
grep -n '@MEM_' /tmp/flucastr-memory.service /tmp/flucastr-memory.cron
```

La última orden no debe mostrar resultados. Revisa que `MEM_USER` sea tu usuario sin privilegios, las rutas sean absolutas, el servicio use `/usr/local/bin/node` (o el resultado de `command -v node`), y cron use el mismo checkout, DB y destino. La plantilla programa el backup a las 03:00, hora local de la distribución.

Las rutas de `MEM_HOME`, `MEM_DB`, `MEM_BACKUP_DIR` y `MEM_NODE` admiten espacios. Para esta entrega y su validación, mantén `MEM_REPO` como ruta absoluta sin espacios. Para todas las rutas, limita los componentes a letras, números, punto, guion bajo, guion y espacios; no uses apóstrofos, comillas, barras invertidas ni saltos de línea. El usuario debe ser un nombre simple sin espacios. La prueba automatizada valida la unidad y ejecuta el servicio con `HOME` y `MEM_DB` con espacios, además de correr cron hacia un destino con espacios.

Valida la unidad y luego instálala:

```sh
systemd-analyze verify /tmp/flucastr-memory.service
sudo install -o root -g root -m 644 /tmp/flucastr-memory.service /etc/systemd/system/flucastr-memory.service
sudo install -o root -g root -m 644 /tmp/flucastr-memory.cron /etc/cron.d/flucastr-memory
sudo systemctl daemon-reload
sudo systemctl enable --now flucastr-memory.service
sudo systemctl status flucastr-memory.service --no-pager
```

El estado esperado es `active (running)` y el listener se mantiene en `127.0.0.1:7420`. Para investigar un fallo, consulta `sudo journalctl -u flucastr-memory.service -n 50 --no-pager`. No habilites Tailscale Serve hasta revisar su configuración actual.

## Comprobar backup y retención

Haz una copia manual mientras el servidor está activo. El comando imprime el archivo publicado:

```sh
BACKUP="$(bash "$MEM_REPO/scripts/backup-memory.sh" "$MEM_DB" "$MEM_BACKUP_DIR")"
sqlite3 -readonly "$BACKUP" 'PRAGMA integrity_check;'
```

La salida de integridad de la copia elegida debe ser `ok`. El cron conserva las siete copias verificadas más recientes. Si el host no ejecutó una copia, comprueba que WSL estaba iniciado a las 03:00 y revisa `sudo journalctl -u cron.service -n 50 --no-pager`.

## Habilitar acceso privado con Tailscale

En el mismo WSL, revisa primero la configuración existente:

```sh
tailscale status
tailscale serve status
```

Si ya hay un servicio en la raíz HTTPS, conserva su configuración. Consulta cómo añadir un proxy para este puerto a la configuración existente antes de cambiar nada; no reemplaces la raíz ni ejecutes `tailscale serve reset`.

Tras confirmar que el destino `127.0.0.1:7420` es el esperado, configura Serve en segundo plano:

```sh
tailscale serve --bg http://127.0.0.1:7420
tailscale serve status
```

Serve presenta HTTPS dentro del tailnet y reanuda la configuración tras reinicios de Tailscale. Usa la URL HTTPS que imprime para `MEM_URL`; no habilites Funnel.

## Comprobaciones del host

- Tras reiniciar la distribución, ejecuta `systemctl is-active flucastr-memory.service` y `tailscale serve status`.
- Desde PowerShell puedes listar y arrancar la distribución con `wsl.exe --list --verbose` y `wsl.exe -d <Distribución>`.
- Después de suspensión, reinicio o apagado de Windows, verifica manualmente que WSL vuelva a arrancar y que el servicio y Tailscale Serve estén disponibles. systemd no mantiene WSL encendido por sí solo.
- Desde una sesión Bash en un cliente autorizado, el modo remoto de `./verify` comprueba lectura sin escribir por defecto:

```sh
read -r -s -p 'MEM_TOKEN: ' MEM_TOKEN
printf '\n'
export MEM_TOKEN
VERIFY_TARGET="https://mem-server.tailnet.ts.net" ./verify
unset MEM_TOKEN
```

Reemplaza la URL de ejemplo por la dirección HTTPS real de Tailscale Serve. Se espera `VERIFY OK (solo lectura)`. La opción de escritura está apagada por defecto y no forma parte de esta comprobación manual.

Registra aquí la comprobación manual del host cuando la instalación exista:

| Momento | Comando | Resultado esperado | Evidencia de Franco |
| --- | --- | --- | --- |
| Inicio de la distribución | `ps -p 1 -o comm=` y `systemctl is-active flucastr-memory.service` | `systemd` y `active` | Pendiente |
| Listener del servidor | `ss -ltnp` | `127.0.0.1:7420` escucha; no `0.0.0.0:7420` | Pendiente |
| Cron activo | `systemctl is-active cron.service` | `active` | Pendiente |
| Backup manual/nocturno | `sqlite3 -readonly <copia> 'PRAGMA integrity_check;'` y revisar `MEM_BACKUP_DIR` | `ok`; quedan siete copias válidas como máximo | Pendiente |
| Arranque o reinicio de Tailscale | `tailscale serve status` | HTTPS apunta a `http://127.0.0.1:7420` y solo al tailnet; se conservó cualquier configuración anterior | Pendiente |
| Lectura remota | `VERIFY_TARGET=<URL-HTTPS> ./verify` desde cliente autorizado con `MEM_TOKEN` leído de forma privada | `VERIFY OK (solo lectura)` | Pendiente |
| Reinicio/suspensión de Windows | Repetir comprobaciones de servicio, cron, Serve y lectura remota | Anotar cuándo WSL quedó disponible y el tiempo sin servicio | Pendiente |

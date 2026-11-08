---
estado: borrador
rama: feature/servicio-backup
base: main
repos: [.]
ejecutor: constructor
tramo: 1
---
# S4 — Servicio WSL y backup real

## Objetivo
Entregar servicio systemd y backup nocturno con siete copias verificadas, listos para que Franco los instale. La entrega prueba el recorrido local; la operación real WSL/Tailscale requiere comprobación manual posterior.

## Supuestos
- El destino sigue siendo WSL2 con systemd y cron; si Franco cambia el destino, se revisan las plantillas antes de aprobar.
- Las copias van a un directorio local dedicado, elegido al instalar; un destino externo o remoto cambia el alcance.
- Horario, usuario y rutas reales se completan al instalar; el ejemplo usa 03:00, hora local de WSL, sin imponerlo al host.

## Contexto y prerrequisitos
- `src/mem.ts` ofrece `serve`; `src/serve.ts` escucha solo en 127.0.0.1, puerto 7420 por defecto, y usa `MEM_DB` o `$HOME/.mem/mem.sqlite`.
- Sin `MEM_TOKEN` en entorno, lee `$HOME/.mem/token`. Reutilizarlo sin generar ni leer credenciales personales durante el cambio.
- `src/memory.ts` usa SQLite/FTS5, journal DELETE y synchronous FULL; mantener contrato, esquema y durabilidad.
- Requiere Node >=24.22.1 <25, Bash, sqlite3 CLI con FTS5, GNU coreutils/timeout y util-linux/flock. El host añade systemd, cron y Tailscale; Franco los instala.
- `./verify` instala desde lock en Docker y prueba suite, HTTP y paquete mem. El Dockerfile actual instala Git, pero no sqlite3 ni herramientas de comprobación systemd; ampliarlo.
- Partir de main limpia y actualizada salvo esta carpeta del plan; crear la rama indicada antes de implementar.

## Alcance
Crear `scripts/backup-memory.sh`, `ops/flucastr-memory.service.in`, `ops/flucastr-memory.cron.in`, `docs/operacion-wsl.md`, `test/backup.test.ts` y `test/operation.test.ts`. Ajustar `Dockerfile`, `verify`, `test/verify.test.ts` y, si hace falta para verificar el recorrido, `scripts/verify-operacion.mjs` y `package.json`. Actualizar contexto S4 en `AGENTS.md` y `docs/proyecto.md` sin afirmar instalación.

Fuera: instalar/activar servicios, configuración personal o producción, secretos, modificar Windows/Tailscale, restaurar base activa, migraciones nuevas, sincronización remota e históricos. No modificar servidor ni contrato S2/S3; si un defecto lo exige, informar en Notas.

## Decisiones ya tomadas
- Ejecutor: constructor, porque requisitos, contexto, comprobaciones y errores están descritos y la ejecución no requiere credenciales, despliegue ni producción.
- Unidad de sistema con `User=` sin privilegios. Ejecutar Node por ruta absoluta sobre `<repo>/dist/src/mem.js serve --port 7420`, desde checkout compilado estable; no depender del PATH de una sesión ni de activar nvm.
- Marcadores: `@MEM_USER@`, `@MEM_HOME@`, `@MEM_REPO@`, `@MEM_NODE@` y `@MEM_DB@`; rutas absolutas. Declarar HOME/MEM_DB, `UMask=0077`, `Restart=on-failure`, `RestartSec=5`, `TimeoutStopSec=30` y `WantedBy=multi-user.target`. SIGTERM usa cierre existente. No poner token en argumentos, unidad ni cron.
- Cron de sistema `/etc/cron.d/flucastr-memory`, usuario explícito, PATH del sistema y rutas entrecomilladas: usa los marcadores anteriores y `@MEM_BACKUP_DIR@` para invocar el script con DB y destino. Ejemplo `0 3 * * *`; no instalarlo. Cron omite ejecuciones mientras WSL está apagado.
- Interfaz: `bash scripts/backup-memory.sh <db-absoluta> <directorio-absoluto>`. Rechazar argumentos incorrectos y fuente inexistente antes de SQLite, evitando crear una DB vacía accidentalmente.
- Usar `sqlite3 -readonly -bail` y `.backup` hacia un temporal del destino. Escapar rutas con espacios/apóstrofos para shell y dot-command; no usar eval ni copiar DB abierta con cp.
- Exigir `PRAGMA integrity_check` exactamente `ok` antes de publicar por rename en el mismo directorio. Umask 077; al fallar o recibir TERM/INT, limpiar solo temporal propio.
- Serializar copia y retención con flock en destino. Una ejecución solapada falla sin modificar copias; limitar copia/validación con timeout a 60 s y salida no cero al excederlo.
- Publicar como `mem-<date -u +%Y%m%dT%H%M%S%N>Z-<pid>.sqlite`; ordenar por esa marca, desempatar por nombre. Conservar siete archivos regulares del patrón exacto; ignorar temporales, enlaces y archivos ajenos, excluyendo siempre la fuente. Un fallo previo a publicación no inicia retención. Si falla eliminar una copia vieja, salir no cero conservando la nueva validada; no prometer rollback de eliminaciones realizadas.
- El backup representa un instante consistente; no exigir que incluya escrituras posteriores al snapshot.
- Documentar Tailscale Serve en el mismo WSL: `tailscale serve --bg http://127.0.0.1:7420`, HTTPS solo tailnet. Revisar estado existente antes de configurar, sin Funnel ni reset de configuraciones ajenas.
- systemd no mantiene WSL vivo por sí solo. Documentar arranque de distribución, suspensión/reinicio Windows y disponibilidad como comprobaciones de Franco; no afirmar continuidad 24/7.

## Escenarios
- CUANDO corre backup con tráfico de escritura ENTONCES produce copia íntegra con memorias y búsqueda FTS (A1).
- CUANDO faltan argumentos/fuente o falla copia/validación ENTONCES falla sin publicar ni borrar copias previas (A2).
- CUANDO hay más de siete copias ENTONCES conserva las últimas siete respetando archivos ajenos (A3).
- CUANDO se solapan ejecuciones o se interrumpe copia ENTONCES no publica parcial ni ejecuta retención (A4).
- CUANDO se completan plantillas ENTONCES servicio y cron invocan entrypoints probados, mismas rutas y sin secretos (A5).
- CUANDO Franco prepara el host ENTONCES dispone de instrucciones y comprobaciones con resultados esperados (A6).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Copia útil con servidor activo | Lanzar dist/src/mem.js serve con DB/token sintéticos y escritor HTTP; ejecutar script real; abrir copia con sqlite3 solo lectura y consultar FTS | Escritura confirmada durante invocación; integrity_check=ok, memorias previas y coincidencia FTS presentes; servidor acepta escritura posterior |
| A2 | Fallos preservan datos | Script sin argumentos, fuente ausente, DB corrupta, destino inválido y fallo de integridad inducido por shim sqlite3 exclusivo del test; comparar nombres/hashes previos | No cero; sin fuente creada, final nuevo ni eliminación previa |
| A3 | Retención exacta | Crear nueve copias por script, registrar publicación; añadir archivo ajeno, enlace y temporal | Exactamente últimas siete copias íntegras; elementos ajenos intactos |
| A4 | Exclusión y cancelación | Retener flock externamente; bloquear SQLite en otro proceso, lanzar copia, enviar TERM y probar timeout con límite externo del test | No cero; copias previas intactas, sin final parcial ni temporal propio, lock reutilizable |
| A5 | Plantillas conectadas | Renderizar en temporal, exigir cero marcadores restantes y systemd-analyze verify; lanzar ExecStart con Node/DB/home sintéticos y comando cron renderizado | Unidad válida, loopback autenticado, SIGTERM permite reabrir DB; cron produce copia A1; no activar systemd/cron reales |
| A6 | Instalación manual revisable | Cruzar docs con plantillas, build y verificador | Prerrequisitos, permisos, token privado, horario, systemctl/journalctl, copia manual, Serve/status y verificación remota; tabla del host queda pendiente |

Sensibilidad: en copia temporal del script cambiar retención a ocho y exigir fallo A3 por cantidad/identidad. Registrar fallo esperado sin mutar archivo de trabajo. Tests operativos fallan explícitamente si faltan sqlite3/systemd-analyze; no omitirlos silenciosamente.

## Verificación
`./verify` sin caché (≈5–10 min), incluido backup real y plantillas en temporales. El modo remoto conserva comportamiento: solo lectura salvo permiso de escritura, sin ejecutar backup en host remoto.

## Pasos
### Tramo 1 — Backup comprobado
Resultado: backup probado con SQLite/HTTP y retención. Archivos: script, test/backup.test.ts y Dockerfile.
- [ ] Añadir sqlite3, util-linux y systemd a imagen de aceptación; comprobar herramientas (entorno).
- [ ] Implementar interfaz, copia temporal, integridad, bloqueo y publicación (A1, A2, A4).
- [ ] Implementar retención y prueba de nueve copias con archivos ajenos (A3).
- [ ] Probar HTTP real, fallos, cancelación, timeout y sensibilidad (A1–A4).

Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` (≈3–6 min), instalación aislada; cubre A1–A4 y regresión S2/S3.

### Tramo 2 — Servicio, cron e instrucciones
Resultado: entrega lista para instalación manual. Archivos: ops/, docs/operacion-wsl.md, test/operation.test.ts, verify/auxiliares y documentos duraderos.
- [ ] Crear plantillas systemd y cron con contrato y rutas acordados (A5).
- [ ] Comprobar unidad renderizada, ExecStart y cron contra servidor/script reales (A5).
- [ ] Integrar comprobaciones en verify preservando modo remoto y limpieza; ajustar test de orquestación si corresponde (A1–A5).
- [ ] Escribir instrucciones y tabla pendiente del host; actualizar contexto duradero (A6).
- [ ] Correr verificación final y registrar A1–A6, sensibilidad y límites manuales (≈5–10 min; A1–A6).

Verificación del tramo: `./verify` sin caché; cubre A1–A6. Revisión manual A6 antes de entregar evidencia.

## Evidencia
Implementación pendiente. Base comprobada por el principal el 2026-11-08, en main: Node v24.22.1, npm 11.19.1; `npm run build` exit 0. `./verify` sin caché exit 0: 46/46 pruebas, CLI/doctor, lectura/escritura/forget HTTP, paquete instalado y limpieza Compose OK. Docker 29.9.2 y Compose v5.6.1; se requirió acceso fuera del sandbox al socket Docker. sqlite3 CLI no está instalado en el entorno local; la aceptación lo incorporará a Docker.

Revisión de ejecutabilidad: cuatro respuestas sí con el contrato propuesto; escenarios A1–A6 enlazados a aceptación y pasos. Tramo 1 cubre A1–A4; tramo 2 añade A5/A6 y repite el recorrido completo. El estado sigue en borrador hasta aprobación de Franco; estas pruebas corresponden a la base, no demuestran S4.

## Notas
Revisión 2026-11-08: el borrador conservaba alcance pero carecía de aceptación, contratos de archivos/errores, dependencias y distinción entre prueba local y continuidad WSL. Se concreta en dos tramos sin recortar S4. Sin implementación ni instalación durante esta revisión.

Fuentes oficiales consultadas el 2026-11-08:
- [SQLite shell](https://sqlite.org/cli.html) y [online backup](https://sqlite.org/backup.html).
- [systemd.service](https://www.freedesktop.org/software/systemd/man/257/systemd.service.html) y [systemd.exec](https://freedesktop.org/software/systemd/man/latest/systemd.exec.html).
- [WSL/systemd y vida de la instancia](https://learn.microsoft.com/en-us/windows/wsl/systemd).
- [Tailscale Serve y persistencia --bg](https://tailscale.com/docs/reference/tailscale-cli/serve).

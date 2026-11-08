---
estado: listo
rama: feature/servicio-backup
base: main
repos: [.]
ejecutor: constructor
tramo: 2
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
- Resuelto para tramo 2: A5 crea un HOME temporal con `.mem/token` sintético y arranca el ExecStart renderizado sin MEM_TOKEN en entorno. Así verifica el mecanismo real de credenciales de la unidad sin acceder a secretos personales. Renderizar y validar en temporales; nunca instalar unidades ni cron durante verify.
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
- [x] Añadir sqlite3, util-linux y systemd a imagen de aceptación; comprobar herramientas (entorno).
  - evidencia: `Dockerfile` instala sqlite3, util-linux y systemd; confirma sqlite3+FTS5, flock y systemd-analyze en `VERIFY_RAPIDO=1 ./verify`, exit 0.
- [x] Implementar interfaz, copia temporal, integridad, bloqueo y publicación (A1, A2, A4).
  - evidencia: `scripts/backup-memory.sh`; `bash -n scripts/backup-memory.sh`, exit 0; A1/A2/A4 en la suite final 50/50.
- [x] Implementar retención y prueba de nueve copias con archivos ajenos (A3).
  - evidencia: A3 en `test/backup.test.ts`; nueve copias válidas, temporales/enlace/archivo ajeno presentes antes de correr; prueba pasa y mutación de retención a ocho provoca el fallo esperado de la aserción A3.
- [x] Probar HTTP real, fallos, cancelación, timeout y sensibilidad (A1–A4).
  - evidencia: `test/backup.test.ts` arranca `dist/src/mem.js serve` y escribe con el bin real; valida integridad/FTS, SHA256 previo, permisos 0600, entrada ausente/corrupta, destino erróneo, shim de integridad, flock, bloqueo SQLite BEGIN EXCLUSIVE, TERM y timeout acotado.

Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` (≈3–6 min), instalación aislada; cubre A1–A4 y regresión S2/S3.

### Tramo 2 — Servicio, cron e instrucciones
Resultado: entrega lista para instalación manual. Archivos: ops/, docs/operacion-wsl.md, test/operation.test.ts, verify/auxiliares y documentos duraderos.
- [x] Crear plantillas systemd y cron con contrato y rutas acordados (A5).
  - evidencia: `ops/flucastr-memory.service.in` y `ops/flucastr-memory.cron.in`; rutas/unidad entrecomilladas donde aplica, usuario explícito en cron, sin token ni marcadores restantes tras render.
- [x] Comprobar unidad renderizada, ExecStart y cron contra servidor/script reales (A5).
  - evidencia: `test/operation.test.ts` renderiza y valida con `systemd-analyze verify`, arranca el servidor real sin `MEM_TOKEN` de entorno, guarda HTTP, cierra/reabre SQLite y ejecuta la línea cron que crea un backup íntegro; HOME/DB/destino con espacios.
- [x] Integrar comprobaciones en verify preservando modo remoto y limpieza; ajustar test de orquestación si corresponde (A1–A5).
  - evidencia: `npm test` incorpora el test nuevo; `./verify` pasó los casos de modo remoto solo lectura/escritura explícita, el recorrido local y limpieza Compose; no hizo falta cambiar el orquestador.
- [x] Escribir instrucciones y tabla pendiente del host; actualizar contexto duradero (A6).
  - evidencia: `docs/operacion-wsl.md` incluye prerrequisitos, permisos/token privado, instalación manual, horarios, systemctl/journalctl, copia manual, cron, Serve y preservación de configuración existente, prueba remota y tabla con listener/cron/backup/reinicio; filas quedan Pendiente. `AGENTS.md` y `docs/proyecto.md` describen entrega software y dejan instalación host pendiente.
- [x] Correr verificación final y registrar A1–A6, sensibilidad y límites manuales (≈5–10 min; A1–A6).
  - evidencia: `./verify` sin caché, 2026-11-08, exit 0; build/typecheck, suite 51/51, CLI help/doctor (SQLite 3.53.4, FTS5 true), loopback LECTURA/ESCRITURA/LIMPIEZA DE REGISTRO OK, limpieza Compose OK, VERIFY OK y MEM BIN PACKAGE OK. A1–A4 y mutación de sensibilidad A3 constan arriba; A5 pasó con servicio/cron reales. A6: revisión documental completada; host sin instalar, sus comprobaciones siguen pendientes de Franco.

Verificación del tramo: `./verify` sin caché; cubre A1–A6. Revisión manual A6 antes de entregar evidencia.

## Evidencia
Entrega de software S4 completada en dos tramos y evidencia aprobada por Franco. Instalación/comprobación del host pendientes. Base previa comprobada por el principal el 2026-11-08 en main: Node v24.22.1, npm 11.19.1; `npm run build` exit 0; `./verify` exit 0, 46/46 pruebas. Docker 29.9.2 y Compose v5.6.1; se requirió acceso fuera del sandbox al socket Docker. sqlite3 CLI no está instalado localmente; Docker lo instala para aceptación.

$ VERIFY_RAPIDO=1 ./verify
#11 tests 50; pass 50; fail 0; duration_ms 36157.433204
#11 npm run cli -- --help — exit 0
#11 npm run cli -- doctor — {"sqliteVersion":"3.53.4","fts5":true}
LIMPIEZA OK
LECTURA OK
ESCRITURA OK
LIMPIEZA DE REGISTRO OK
VERIFY OK
MEM BIN PACKAGE OK
exit 0

Tramo 2, 2026-11-08: `./verify` (sin `VERIFY_RAPIDO`) exit 0. Docker construyó desde cero; typecheck/build OK; suite 51/51; `systemd-analyze verify` y test de ExecStart/cron OK; CLI help y doctor OK (sqliteVersion 3.53.4, FTS5 true); recorrido aislado LECTURA OK, ESCRITURA OK, LIMPIEZA DE REGISTRO OK; limpieza de contenedor/volumen/red OK; `VERIFY OK`, `MEM BIN PACKAGE OK`. A1–A5 aceptados; A6 tiene instrucciones y matriz para instalación manual, aún pendiente en el host. Sensibilidad A3: la mutación temporal a retención ocho falla la aserción como se esperaba; el archivo de trabajo no se mutó.

`npm run build`: exit 0. `bash -n scripts/backup-memory.sh`: exit 0. `git diff --check`: exit 0.

Aceptación del tramo: A1 pasa (bin real mem server/save durante la invocación, snapshot íntegro y FTS, escritura posterior); A2 pasa (hashes de copias preservados ante fallos y fuente inexistente no creada); A3 pasa (nueve copias, siete últimas, temporales/enlace/archivo ajeno preexistentes intactos; mutación a retención ocho detectada); A4 pasa (lock flock y lock SQLite real fallan sin tocar previas, TERM/timeouts limpian temporal, luego el lock es reutilizable).

Verificación final independiente del principal, 2026-11-08: `./verify` sin caché exit 0; 51/51 pruebas, fail 0, CLI/doctor, flujo HTTP/SQLite, paquete instalado y limpieza Compose OK. Log: `/tmp/s4-final-principal-verify.log`. La evidencia demuestra la entrega local de S4; no demuestra instalación ni continuidad del host real.

Revisión de ejecutabilidad: cuatro respuestas sí con el contrato propuesto; escenarios A1–A6 enlazados a aceptación y pasos. Tramo 1 cubre A1–A4; tramo 2 añade A5/A6 y repite el recorrido completo. Franco aprobó el plan el 2026-11-08 y luego la evidencia con «si, hagamos el cierre».

## Notas
Puerta 2 y ceremonia de cierre: Franco aprobó la evidencia y pidió el cierre. Contexto duradero actualizado y carpeta archivada en cambios/hechos/servicio-backup/, conservando estado: listo. Pendientes commit y PR hacia main, ambos a cargo de Franco; no iniciar S5 mientras estén pendientes. Instalación del servicio/cron, Tailscale y comprobaciones reales del host permanecen fuera de esta entrega.

Revisión principal del tramo 2, 2026-11-08: diff completo y lectura íntegra de unidad, cron, test operativo, guía y documentos duraderos. (1) Existe lo pedido: plantillas y guía con matriz manual, sin token en unidad/cron (A5/A6). (2) Está conectado: test renderiza los archivos entregados, valida la unidad con systemd-analyze y ejecuta su ExecStart y comando cron reales; los nuevos tests entran automáticamente en npm test/verify, sin cambiar el modo remoto. (3) Funciona con datos reales: archivo de token sintético en HOME con espacios, HTTP contra mem serve, SIGTERM/reapertura SQLite y copia real íntegra del cron. No se activó un supervisor systemd ni daemon cron; esos resultados están expresamente pendientes en el host. (4) Lo vecino sigue: verify propio sin caché 51/51, CLI/doctor, remoto solo lectura/escritura explícita, flujo HTTP/forget, paquete y limpieza correctos. A1–A5 aceptadas para la entrega local. Revisión manual A6: rutas y comandos cruzados con plantillas/entrypoints; usuario sin privilegios, permisos/token, cron, listener, Serve existente y matriz de reinicio/lectura remota documentados; todas las filas del host quedan Pendiente. A6 aceptada como documentación de instalación, sin afirmar operación real.

Comprobación adicional propia del tramo 2: contenedor temporal sin red externa, plantilla final renderizada y su ExecStart ejecutado con HOME temporal sin token, sin MEM_TOKEN en entorno. Exit 1, stdout vacío, error genérico esperado y ninguna DB creada (UNIT REVIEW OK). Se anotaron además en AGENTS.md las nuevas dependencias Linux de npm test; ./verify las proporciona en Docker. Precisiones documentales: S3 integrado por PR #12 según git log y lectura privada del token desde Bash. Solo quedan cambios de documentación/evidencia tras la verificación; no requieren repetir la suite.

Diagnósticos A5 resueltos: `WorkingDirectory` se deja sin comillas tras comprobar que systemd rechaza `WorkingDirectory="/tmp"`; el test interpreta el ExecStart quoted sin `split(' ')`. HOME/DB con espacios y `systemd-analyze verify` pasan. A6 amplió la tabla con cron activo, listener loopback y lectura remota además de las comprobaciones restantes.

Observaciones A5/A6 resueltas: la tabla de host ahora incluye systemd, listener loopback, cron activo, copia válida/retención, Serve, lectura remota y continuidad tras reinicio/suspensión, todas Pendiente hasta la instalación manual. La guía conserva cualquier Serve existente y prohíbe resetearlo. `WorkingDirectory` queda sin comillas como requiere systemd; la prueba extrae el ExecStart entrecomillado sin `split(' ')`, y comprueba HOME/DB con espacios. Las instrucciones limitan MEM_REPO a ruta absoluta sin espacios y restringen caracteres especiales; las demás rutas entrecomilladas admiten espacios y cron se prueba con destino con espacios.

Revisión principal del tramo 1, 2026-11-08: diff completo de Dockerfile/plan y lectura íntegra de script/test nuevos. (1) Existe lo pedido: copia readonly .backup, integridad previa a publicación, retención exacta y limpieza verificadas (A1–A4). (2) Está conectado: pruebas invocan scripts/backup-memory.sh y el bin productivo dist/src/mem.js serve/save. (3) Funciona con SQLite/FTS y HTTP reales, incluida escritura concurrente y bloqueo BEGIN EXCLUSIVE; shims solo inducen demora/fallos específicos. (4) Lo vecino sigue: verificación propia VERIFY_RAPIDO=1 ./verify exit 0, 50/50, CLI/doctor, HTTP/forget, paquete instalado y limpieza Compose OK; evidencia en /tmp/s4-tramo1-principal-verify.log. Reproducción propia aislada del test completo también exit 0, 4/4 en 21.7 s. Comprobación adicional propia de forget/FTS y SHA256/0600 descrita debajo pasó. A1–A4 aceptadas, observaciones anteriores resueltas. Se avanza tramo a 2 y estado a aprobado bajo la aprobación de S4 ya dada por Franco.

Resuelto en 2026-11-08: la primera prueba concurrente encontró `database is locked`. `.backup` no reintenta ese lock por sí solo; se añadió `.timeout 5000` para que SQLite espere la escritura corta. La corrida final mantiene un escritor real del bin mem activo y valida la copia íntegra.

Resueltas observaciones del principal: el evento close se registra al crear el proceso; los tests ponen límites de cinco segundos; `finalFiles` usa lstat y excluye enlaces simbólicos. A1–A4 se ampliaron con bin real, SHA256, fuente ausente, archivos ajenos antes de retención, mutación A3 y lock SQLite `BEGIN EXCLUSIVE`. El fixture confirma espacios y apóstrofes en rutas; comillas dobles se retiraron tras SQLite CLI rechazar ese argumento de `.backup`.

Comprobación propia del principal (adicional al plan), 2026-11-08: contenedor temporal sin red externa usando imagen verify_memory_3744656-memory y script actual montado solo lectura. Guardar dos memorias por bin mem real, olvidar una, copiar con servidor activo y abrir copia con otro mem serve: recent conserva solo la vigente y search no devuelve la olvidada; SHA256 de fuente antes/después idéntico, archivo 0600 y ruta con espacios/apóstrofos. Exit 0, REVIEW OK. Sin servicio instalado. Complementa la cobertura A1–A4 revisada y aceptada del tramo 1.

Retoma tras corte solicitado por Franco, 2026-11-08: el constructor continuó el tramo 2 sobre la rama autorizada. La corrida final actual queda registrada arriba; no se afirma instalación del host.

Puerta 1, 2026-11-08: aprobación explícita de Franco. Base comprobada tras git fetch origin: main, cero commits pendientes respecto de origin/main, sin cambios fuera de cambios/servicio-backup/. Se delega únicamente el tramo 1.

Revisión 2026-11-08: el borrador conservaba alcance pero carecía de aceptación, contratos de archivos/errores, dependencias y distinción entre prueba local y continuidad WSL. Se concreta en dos tramos sin recortar S4. Sin implementación ni instalación durante esta revisión.

Fuentes oficiales consultadas el 2026-11-08:
- [SQLite shell](https://sqlite.org/cli.html) y [online backup](https://sqlite.org/backup.html).
- [systemd.service](https://www.freedesktop.org/software/systemd/man/257/systemd.service.html) y [systemd.exec](https://freedesktop.org/software/systemd/man/latest/systemd.exec.html).
- [WSL/systemd y vida de la instancia](https://learn.microsoft.com/en-us/windows/wsl/systemd).
- [Tailscale Serve y persistencia --bg](https://tailscale.com/docs/reference/tailscale-cli/serve).

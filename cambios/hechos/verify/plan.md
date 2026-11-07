---
estado: listo
rama: chore/verify
base: main
repos: [.]
ejecutor: constructor
---
# Verificación desde cero

## Objetivo
Crear `./verify`: instalación desde lock, build limpio, suite y recorrido HTTP contra el proceso servidor real y SQLite aislado. Certifica el sistema actual, no S2–S5 ni el MVP Mac/WSL.

## Supuestos
- Se verifica save/search ya existentes; recent/forget y bin mem se incorporan con sus propios planes. Si Franco pide adelantarlos, cambia el alcance.
- Docker Engine y Compose disponibles son prerrequisitos locales; no se instalan ni se reparan servicios del host. Si no están disponibles, se informa el bloqueo.

## Alcance
Nuevos `verify`, `verify-flujo.sh`, `scripts/verify-flujo.mjs`, `Dockerfile`, `.dockerignore`, `docker-compose.verify.yml`, `.env.example` y pruebas de orquestación en `test/verify.test.ts`. Ajustes necesarios en `package.json`, lock, `AGENTS.md` y `docs/proyecto.md`.
Fuera: modificar comportamiento de `src/`, completar servidor/cliente, instalar servicios, configuraciones personales, producción, histórico y README de S5. Las rutas nuevas anteriores son entregables propuestos, no archivos existentes.

## Decisiones ya tomadas
- Ejecutor: constructor, porque cada paso tiene comprobación, contratos y errores están definidos, y no requiere credenciales personales ni producción. Prueba de ejecutabilidad: cuatro sí.
- Base: `main`, obtenida de `origin/HEAD`. Antes de construir debe estar limpia y al día; la rama actual de migración no es la base.
- Un servicio Compose `memory`, sin puertos publicados: el servidor solo escucha en loopback. Ejecutar el recorrido mediante `docker compose exec -T memory` comparte ese loopback; no cambiar bind ni usar red host.
- Dockerfile común con Node `24.22.1` (satisface engines), contexto raíz completo. Excluir `.git`, `.claude`, `.env`/variantes salvo `.env.example`, `node_modules`, `dist`, SQLite/tokens locales; no usar lista positiva de COPY.
- Construcción común: `npm ci`, typecheck y build sin `dist` previo. Etapa de aceptación ejecuta `npm test`, ayuda CLI y doctor. La imagen operativa comparte build y ejecuta `node dist/src/cli.js serve --port 7420`; no crear servidor alternativo.
- Compose construye la etapa de aceptación y usa `.env.example` con MEM_DB=/data/mem.sqlite, MEM_TOKEN de prueba explícitamente no secreto y MEM_URL=http://127.0.0.1:7420. Datos en volumen exclusivo del proyecto efímero; nunca montar HOME ni la base del host.
- `./verify` usa Bash, `set -euo pipefail`, ruta raíz independiente del cwd y prefijo Compose `verify_memory_<pid>`. Build sin caché por defecto; `VERIFY_RAPIDO=1` permite caché, nunca omite instalación declarada, suite ni flujo.
- Limpieza registrada antes de crear recursos: EXIT/INT/TERM ejecutan `down -v --remove-orphans` solo sobre ese proyecto. Fallo de limpieza también impide anunciar éxito. Sin prune global ni borrado de archivos del host.
- Plazos: preflight Docker 15 s, build 8 min, arranque 60 s, cada petición 5 s y recorrido 60 s. Cancelar y recoger los procesos propios al vencer; mostrar etapa/código, sin token ni cuerpo de memorias remotas.
- No existe /health: readiness hace POST autenticado /v1/search, scope general, query vacía; exige 200 y memories vacío. Espera solo local, con plazo; remoto falla directamente si no responde.
- Conservar `npm run verify` como comprobación parcial y documentar diferencia; no sustituirlo por una llamada recursiva a `./verify`.

## Contrato del recorrido
`verify-flujo.sh` declara `# VERIFY_ESCRIBE: sí` inmediatamente después del shebang y llama al auxiliar Node con APIs estándar, sin paquetes adicionales ni compilación necesaria en modo remoto.

Lectura siempre: POST /v1/search con {scope:"general",query:""}; exigir 200, JSON con array memories vacío, LF final y máximo 4000 bytes. Probar petición sin Bearer y exigir 401 unauthorized. No imprimir respuestas ni cabecera Authorization.

Escritura local siempre; remota solo con permiso: generar identificador `verify-<pid>-<uuid>` y usarlo en scope project, id y término de texto. Guardar decisión con seis campos, origen `verify-loopback`, fecha civil actual UTC; exigir 200 y seis campos guardados iguales. Repetir idéntica alta y buscar el término en el mismo scope: 200, exactamente una coincidencia con ese id y contenido esperado (se permiten metadatos actuales de search), LF final y <=4000 bytes. Buscar desde otro scope de prueba: no debe aparecer ese id. No exigir 409 ni salida de search sin metadatos: pertenecen a S2.

Remoto: detectar VERIFY_TARGET antes de Docker/npm. Validar URL http(s), host presente y sin usuario/contraseña/query/fragmento; no mostrar entradas inválidas que puedan contener secretos. API_URL/WEB_URL no vacías prevalecen; si faltan, heredan VERIFY_TARGET, aunque WEB_URL no se consume porque no hay web. Mostrar `MODO REMOTO: <url>` únicamente tras validar la URL. MEM_TOKEN obligatorio por entorno, nunca leer archivos personales. No llamar a Docker, instalar ni compilar. Sin VERIFY_PERMITIR_ESCRITURA=1: `OMITIDO: escritura`, lectura obligatoria y `VERIFY OK (solo lectura)`. Con permiso: ambas secciones y `VERIFY OK`. No hay forget implementado: advertir que la escritura remota deja registros de prueba; no prometer limpieza remota. Franco ejecuta este modo contra entornos desplegados; el constructor solo contra loopback temporal.

## Escenarios
- CUANDO falta Docker o no responde ENTONCES falla en preflight dentro del plazo, sin instalación del host.
- CUANDO instalación, build, suite, arranque, aserción o limpieza falla ENTONCES termina no cero y no imprime VERIFY OK.
- CUANDO el servidor funciona ENTONCES prueba alta idempotente, búsqueda y aislamiento con SQLite real y limpia su volumen.
- CUANDO hay otros proyectos Docker ENTONCES no modifica sus contenedores, redes ni volúmenes.
- CUANDO se solicita remoto ENTONCES no usa Docker y solo escribe con permiso explícito.

## Verificación
`./verify` sin VERIFY_RAPIDO ni VERIFY_TARGET, desde copia temporal sin node_modules/dist ni archivos personales. Copiar el árbol de trabajo incluyendo archivos nuevos, excluyendo .git y secretos; no depender de git archive, que omite entregables sin commit. Registrar código 0, etapas, conteo de pruebas y limpieza. La suite incluye pruebas de la orquestación; el recorrido final usa servidor y SQLite reales.

Prueba negativa en esa copia: introducir error de sintaxis TypeScript en `src/serve.ts`, ejecutar `./verify` y exigir no cero, ausencia de VERIFY OK y cero recursos del prefijo usado. No alterar el src original. Una vez restaurada la copia, correr la aceptación final sin caché.

## Pasos
- [x] Comprobar base limpia y Docker con plazo; ante bloqueo, devolver PAUSA con comando, error y requisito faltante.
  - evidencia: `timeout -k 2s 15s docker info --format '{{.ServerVersion}}'` => 29.9.2, exit 0; rama chore/verify y estado del árbol según nota de reconstrucción.
- [x] Crear Dockerfile y exclusiones; comprobar que contexto omite artefactos/secretos y ambas etapas comparten build y entrypoint.
  - evidencia: `set -eu; ... grep ... Dockerfile ... .dockerignore` => Dockerfile/exclusions checks passed, exit 0.
- [x] Crear configuración Compose y ejemplo sintético; comprobar loopback compartido, volumen efímero y ausencia de puertos publicados.
  - evidencia: `docker compose -f docker-compose.verify.yml config --format json` + assertions Node sobre loopback, volumen y ports => Compose config checks passed, exit 0.
- [x] Implementar recorrido Node y wrapper; comprobar lectura, idempotencia, búsqueda y aislamiento con aserciones del contrato.
  - evidencia: `npm test` => assertions de loopback cubren lectura, bearer, seis campos, retry, búsqueda e aislamiento; suite 43/43, exit 0.
- [x] Implementar orquestación local; comprobar plazos, códigos y traps en pruebas de orquestación.
  - evidencia: `npm test` => pruebas mock cubren fallo de build, arranque, flujo, limpieza y TERM cancelado en <5 s; suite 43/43, exit 0.
- [x] Implementar remoto antes del preflight; comprobar precedencia, lectura obligatoria, permiso de escritura y ausencia de llamadas Docker.
  - evidencia: `npm test` => loopback confirma lectura obligatoria, precedencia de API_URL, escritura solo con permiso y ausencia de Docker; suite 43/43, exit 0.
- [x] Añadir pruebas de orquestación con ejecutables simulados; comprobar errores de build, arranque, flujo, limpieza y señal TERM.
  - evidencia: `npm test` => suite 43/43; fallos de build/up/exec/down y TERM comprobados, exit 0.
- [x] Probar remoto contra servidor loopback temporal; exigir cero altas sin permiso y alta verificable con permiso (≈1 min).
  - evidencia: `npm test` => servidor real `startServe`/SQLite: cero registros sin permiso, un registro tras doble alta con permiso; suite 43/43, exit 0.
- [x] Ejecutar `VERIFY_RAPIDO=1 ./verify`; exigir flujo real y limpieza sin recursos remanentes (≈3 min).
  - evidencia: `VERIFY_RAPIDO=1 ./verify` => npm ci/typecheck/build, suite 43/43, CLI help/doctor, flujo LECTURA/ESCRITURA/VERIFY OK y LIMPIEZA OK; exit 0.
- [x] Ejecutar prueba negativa en copia aislada; exigir no cero y ausencia de éxito y recursos propios (≈3 min).
  - evidencia: copia temporal sin `.git`/artefactos/secretos con error TS introducido: `./verify` devolvió 1 con `VERIFY FAIL: build acceptance`, sin VERIFY OK, LIMPIEZA OK y sin contenedor/red/volumen `verify_memory_3086048`; exit 0 para las aserciones.
- [x] Restaurar copia y ejecutar `./verify` sin caché; exigir VERIFY OK y limpieza completa (≈5 min).
  - evidencia: copia restaurada en `/tmp` sin `.git`/artefactos/secretos; `./verify` => suite 43/43, LECTURA OK, ESCRITURA OK, VERIFY OK, LIMPIEZA OK, recursos `verify_memory_3091906` ausentes; exit 0.
- [x] Actualizar AGENTS/contexto y evidencia; declarar límites, prerrequisitos, comandos, códigos y pruebas sin secretos.
  - evidencia: `AGENTS.md`, `docs/proyecto.md` y esta sección actualizados; `grep -nE 'Verificar desde cero|VERIFY_TARGET|Docker Engine|Evidencia final' AGENTS.md docs/proyecto.md cambios/verify/plan.md` => referencias presentes, exit 0.

## Evidencia
Planificación: se leyeron package.json, CLI/serve/HTTP/store y pruebas de servidor/durabilidad. CLI usa loopback, sin health; suite usa SQLite real y procesos hijos. Inicialmente no existían Dockerfile, Compose, .env.example ni ./verify raíz.
Node v24.22.1 y npm 11.19.1 observados durante migración. Las demoras previas de Docker/build se resolvieron; el preflight final respondió versión 29.9.2.

Evidencia final de aceptación (salidas reales; sin secretos):
$ npm test
ℹ tests 43
ℹ pass 43
ℹ fail 0
exit 0

$ VERIFY_RAPIDO=1 ./verify
suite 43/43; LECTURA OK; ESCRITURA OK; VERIFY OK; LIMPIEZA OK; proyecto `verify_memory_3090030` sin recursos remanentes.
exit 0

$ ./verify
Copia temporal restaurada sin `.git`, artefactos ni secretos: suite 43/43; LECTURA OK; ESCRITURA OK; VERIFY OK; LIMPIEZA OK; proyecto `verify_memory_3091906` sin recursos remanentes.
exit 0

$ ./verify (copia temporal con error de sintaxis TS)
VERIFY FAIL: build acceptance (código 1); sin VERIFY OK; LIMPIEZA OK; sin recursos `verify_memory_3086048`.
exit 1

Aceptación independiente del principal: `./verify` sin caché terminó con código 0; suite 43/43, `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK` y `VERIFY OK`. Log local: `/tmp/memory-ai-verify-principal.log`. Consultas de contenedores, redes y volúmenes filtradas por `verify_memory_3092519` devolvieron vacío; `git diff --check` pasó. Franco aprobó el resultado y la evidencia. Se archiva en `cambios/hechos/verify/` conservando `estado: listo`, antes de su commit. Pendientes commit y PR de Franco hacia `main`.

## Notas
Estado reconstruido por el principal tras PAUSA: Franco confirmó el PR/merge de migración. `git status --short` antes de delegar estaba vacío; rama `main`, `git fetch origin` exitoso y `git rev-list --count HEAD..origin/main` = 0. Tras la PAUSA, `git status --short` y `git diff --stat` muestran únicamente cambios en `cambios/verify/plan.md` (3 líneas), permitidos por la regla de base limpia. No hay cambios ajenos, `chore/verify` no existe y el plan sí existe. La nota antigua sobre la rama docs/terminar-migracion quedó obsoleta; no constituye bloqueo actual. Franco aprobó explícitamente este plan. Se autoriza crear `chore/verify` desde main conforme a la skill; no cambiar a una rama preexistente.
Si falla código existente fuera del alcance, registrar causa y devolver PAUSA, sin omitir pruebas ni ampliar S2. Si falta infraestructura o conectividad al registro/npm, registrar el fallo y requisito; no instalar ni tocar servicios del host.
Reanudación: confirmado `main`, la rama `chore/verify` no existía y se creó desde la base limpia/al día. Preflight `timeout 15s docker info` no respondió dentro del plazo; el comando terminó por timeout del ejecutor tras 20 s. No se instalaron ni modificaron servicios. Se detiene antes de implementar, pues Docker Engine disponible y operativo es prerrequisito.
Reconstrucción del principal tras esta PAUSA: rama `chore/verify`; `git status --short` muestra solo `M cambios/verify/plan.md`; `git diff --stat` muestra 5 líneas afectadas en ese único archivo. El plan existe; no hay implementación nueva ni cambios ajenos. `/usr/bin/docker` y `/usr/bin/timeout` existen, pero esto no demuestra que el Engine responda. Bloqueo resuelto tras la confirmación de Franco: el principal ejecutó `timeout -k 2s 15s docker info --format '{{.ServerVersion}}'` y obtuvo `29.9.2`, código 0. Estado reconstruido: rama `chore/verify`, únicamente el plan modificado (6 líneas afectadas), sin implementación nueva. `docker ps -a`, `docker network ls` y `docker volume ls`, filtrados por `name=verify_memory_`, no muestran recursos pendientes; no hubo que limpiar nada. Se devuelve a aprobado y se continúa en la rama de trabajo existente, creada por este mismo intento; no se vuelve a crear ni se exige regresar a main. No se modificó configuración del host.

---
estado: aprobado
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
- [ ] Comprobar base limpia y Docker con plazo; ante bloqueo, devolver PAUSA con comando, error y requisito faltante.
- [ ] Crear Dockerfile y exclusiones; comprobar que contexto omite artefactos/secretos y ambas etapas comparten build y entrypoint.
- [ ] Crear configuración Compose y ejemplo sintético; comprobar loopback compartido, volumen efímero y ausencia de puertos publicados.
- [ ] Implementar recorrido Node y wrapper; comprobar lectura, idempotencia, búsqueda y aislamiento con aserciones del contrato.
- [ ] Implementar orquestación local; comprobar plazos, códigos y traps en pruebas de orquestación.
- [ ] Implementar remoto antes del preflight; comprobar precedencia, lectura obligatoria, permiso de escritura y ausencia de llamadas Docker.
- [ ] Añadir pruebas de orquestación con ejecutables simulados; comprobar errores de build, arranque, flujo, limpieza y señal TERM.
- [ ] Probar remoto contra servidor loopback temporal; exigir cero altas sin permiso y alta verificable con permiso (≈1 min).
- [ ] Ejecutar `VERIFY_RAPIDO=1 ./verify`; exigir flujo real y limpieza sin recursos remanentes (≈3 min).
- [ ] Ejecutar prueba negativa en copia aislada; exigir no cero y ausencia de éxito y recursos propios (≈3 min).
- [ ] Restaurar copia y ejecutar `./verify` sin caché; exigir VERIFY OK y limpieza completa (≈5 min).
- [ ] Actualizar AGENTS/contexto y evidencia; declarar límites, prerrequisitos, comandos, códigos y pruebas sin secretos.

## Evidencia
Planificación: se leyeron package.json, CLI/serve/HTTP/store y pruebas de servidor/durabilidad. CLI usa loopback, sin health; suite usa SQLite real y procesos hijos. No existen Dockerfile, Compose, .env.example ni ./verify raíz.
Node v24.22.1 y npm 11.19.1 observados durante migración; build anterior pasó. Al concretar este plan, Compose informó v5.6.1; `docker info` no terminó en 120 s y un nuevo `npm run build` no terminó en 60 s: no se presentan como éxitos ni se diagnostica su causa sin más evidencia. No se ejecutó verify ni suite.

## Notas
Árbol actual: rama docs/terminar-migracion, cambios de migración staged y documentos sin seguimiento; construir aquí violaría base limpia. Franco debe terminar commit/PR/merge de la migración y situar la carpeta en main actualizada antes de delegar. No cambiar de rama ni transportar cambios automáticamente. Franco aprobó explícitamente el contenido concretado del plan. La ejecución sigue bloqueada hasta cumplir la condición de base limpia.
Si falla código existente fuera del alcance, registrar causa y devolver PAUSA, sin omitir pruebas ni ampliar S2. Si falta infraestructura o conectividad al registro/npm, registrar el fallo y requisito; no instalar ni tocar servicios del host.

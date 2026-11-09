---
estado: listo
rama: feature/inicio-agentes
base: main
repos: [.]
ejecutor: constructor
tramo: 3
---
# S5 — Memoria al iniciar Claude Code y Pi

## Objetivo
Recuperar memorias centrales en el contexto de Claude Code y Pi al iniciar sesión. Entregar integraciones instalables y demostrar su funcionamiento local con HTTP/SQLite, hook Claude y SDK real de Pi. La validación entre equipos queda a cargo de Franco y fuera de la aceptación de este cambio.

## Supuestos
- Plazo aprobado: 2 segundos para consultar memoria, más arranque y limpieza del proceso.
- Se entregan archivos e instrucciones para instalar manualmente; instalar en agentes personales requiere ampliar el alcance y acceso aparte.

## Contexto y prerrequisitos
- S4 integrado mediante PR #13 (`ebdff96`); main estaba limpio. Node v24.22.1, build correcto y Docker 29.9.2 comprobados. No se ha repetido verify para S5.
- `src/mem.ts`: recent devuelve 15 por defecto y detecta `project:<basename de raíz Git>` desde cwd. `src/http-client.ts` valida respuestas y espera hasta 15 s; el adaptador debe acotar el proceso completo sin cambiar la CLI normal.
- `test/mem.test.ts` muestra servidor HTTP/SQLite reales, token sintético y Git temporal. `verify` construye Dockerfile, ejecuta npm test y `scripts/verify-mem-bin.sh` con el paquete instalado.
- Versiones locales: Claude 2.1.319 y `@earendil-works/pi-coding-agent` 1.5.0. Para pruebas, fijar Pi 1.5.0 como dependencia de desarrollo, sin depender de su instalación personal.
- Fuentes oficiales consultadas 2026-11-08: [Claude hooks](https://code.claude.com/docs/en/hooks#sessionstart) y [Pi extensions](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md). Claude admite SessionStart, entrada JSON con cwd y salida hookSpecificOutput.additionalContext. Pi admite session_start y devolver un mensaje desde before_agent_start, además de extensiones JS con -e.
- SDK Pi 1.5.0: documentación y declaraciones confirman createAgentSession, DefaultResourceLoader, SessionManager.inMemory, SettingsManager.inMemory, ModelRuntime.create, session.bindExtensions y session.agent.streamFunction. Consultar ejemplos `examples/sdk/06-extensions.ts` y `12-full-control.ts` del paquete de desarrollo para las firmas exactas.

## Alcance
Crear `integrations/` (helper, entrada Claude, extensión Pi y snippets), `test/agent-start.test.ts`, `test/pi-context.test.ts` y `docs/inicio-agentes.md`. Ajustar package.json/lock, scripts/verify-mem-bin.sh, verify/Dockerfile si es necesario, README, AGENTS y docs/proyecto. Src solo para fallos relacionados, conservando contratos S2–S4.
Fuera: configuraciones personales, credenciales, instalación de servicios, despliegue, MCP, captura automática y old/v1.

## Decisiones ya tomadas
- Resuelto: 2026-11-09 Franco limita la aceptación a lo comprobable aquí; Tailscale, instalación en equipos personales y pruebas operativas/remotas quedan fuera del cierre local y las validará él. Se conserva la guía como referencia.
- Resuelto: 2026-11-08 Franco aprobó este plan y el plazo de 2 segundos.
- Ejecutor: constructor, porque requisitos y contexto son accesibles, hay comprobaciones concretas y no requiere credenciales ni producción. Ejecutabilidad: sí/sí/sí/sí.
- Guardado exclusivamente por pedido de Franco mediante mem save; iniciar sesiones no escribe memoria.
- Helper ESM JS `integrations/recent-context.mjs`: ejecutar mem recent --limit 15 con spawn, cwd explícito, entorno heredado y sin shell. Resolver mem desde PATH. Resuelto en tramo 1: spawn permite recoger recent completo sin el límite implícito de salida de execFile.
- Timeout del hijo y terminación efectiva con SIGKILL; limpiar temporizadores y esperar cierre. Sin GNU timeout, para funcionar en Mac/WSL.
- Conservar scope/origen S3. Sin Git y sin scope explícito, devolver vacío. Permitir scope explícito en helper, argumento --scope de entrada Claude y fábrica nombrada de extensión Pi; documentar clones de distinto nombre.
- Contexto: encabezado que identifica memorias previas como datos más JSON completo de recent. Conservar seis campos, orden y límite 15; sin truncar ni imponer 5/4000 de search.
- Sin datos/bin/env/autorización/servidor válido, ante timeout o respuesta inválida: vacío, sin stdout/stderr ni excepciones hacia el agente; sin DB ni caché cliente.
- Claude: `integrations/claude-session-start.mjs` recibe stdin JSON, usa cwd del evento y emite solo JSON con hookSpecificOutput.hookEventName=SessionStart y additionalContext. Vacío/fallo: exit 0 sin salida. Snippet settings.json: command, matcher startup|resume|clear|compact, timeout externo 5 s como protección adicional (8 s si se elige plazo interno 5).
- Pi: `integrations/pi-memory.mjs`, default compatible con pi -e y fábrica nombrada para scope explícito. session_start reinicia estado y carga desde ctx.cwd; before_agent_start consume contexto una vez devolviendo message con customType flucastr-memory, content y display false. Sin turnos nuevos ni notificaciones. Una nueva sesión recarga; un nuevo prompt no consulta otra vez.
- Empaquetar integrations junto a dist. Adaptadores ejecutables desde el paquete instalado; Pi es dependencia solo de desarrollo.
- Aceptación local: contrato de hook Claude y pipeline real SDK Pi. Claude real y Mac→WSL quedan fuera de esta aceptación; Franco los validará por su cuenta.

## Escenarios
- CUANDO inicia un agente con datos ENTONCES recibe proyecto y general antes de responder (A1, A3).
- CUANDO hay otro proyecto ENTONCES no aparece; clones homónimos comparten scope (A1).
- CUANDO faltan datos/dependencias o falla el servidor ENTONCES continúa silenciosamente dentro del plazo (A2).
- CUANDO Franco pide guardar ENTONCES usa mem save; iniciar no escribe (A4).
- CUANDO se instala el paquete ENTONCES sus adaptadores funcionan con el mem instalado (A5).
- CUANDO Franco prepare la validación entre equipos ENTONCES dispone de una guía con versiones, scope e ID; su ejecución queda fuera del cambio (A6 documental).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Scope y contenido en Claude | Entry point con stdin, mem compilado en PATH, HTTP/SQLite reales; proyecto/general/otro; dos raíces Git homónimas, cwd anidado y scope explícito | IDs/textos correctos, otro excluido; 15 registros si hay más y respuesta mayor de 4000 bytes conservada |
| A2 | Fallos silenciosos y acotados | Ambas entradas: vacío, sin bin/env/Git, token rechazado, JSON inválido, conexión rechazada y servidor lento; tolerancia CI de 1 s sobre plazo | Claude exit 0 sin stdout/stderr; Pi sin mensaje/error; hijo terminado, sin DB cliente |
| A3 | Pi envía contexto al modelo | SDK 1.5.0 real con extensión entregada, sesión en memoria y streamFn/proveedor simulado que captura mensajes; bindExtensions y prompt | Primera petición incluye decisión; segundo prompt no duplica ni consulta; nueva sesión recarga y fallo no incorpora datos anteriores |
| A4 | Guardado explícito | Revisar instrucciones, observar rutas HTTP de inicio; guardar previamente con mem save | Inicio solo recent; save devuelve ID recuperable; bloques CLAUDE.md/AGENTS.md de cinco líneas |
| A5 | Artefacto completo | npm pack/install temporal; entrada Claude del paquete y extensión Pi del artefacto con SDK | Imports resuelven; mem instalado y adaptadores recuperan dato real |
| A6 | Procedimiento distribuido | Revisar guía con pasos Claude Mac/Pi WSL, versiones, scope, ID y espacio para evidencia | Guía disponible para Franco; ejecución remota fuera de aceptación |

Sensibilidad: A1/A3 exigen datos esperados no vacíos y una memoria de otro proyecto. En copia temporal, desactivar devolución de contexto de Pi debe hacer fallar A3 por ausencia del ID esperado; registrar fallo/restauración. Una tabla simulada de handlers no sustituye A3.

## Verificación
`./verify` sin caché al final, incluyendo pruebas nuevas sin agentes personales, claves ni llamadas a proveedores. A6 se acepta mediante revisión documental; no requiere ejecutar pruebas entre equipos.

## Pasos
### Tramo 1 — Helper y Claude
Resultado: Claude recupera datos reales y continúa silenciosamente ante fallo. Archivos: integrations común/Claude/snippet, test/agent-start.test.ts.
- [x] Crear helper y entrada Claude, scope explícito y timeout con los contratos acordados (A1, A2, A4).
  - evidencia: `integrations/recent-context.mjs`, `integrations/claude-session-start.mjs`, `integrations/claude-settings.example.json`
- [x] Añadir pruebas por entrypoint con Git/HTTP/SQLite reales y casos negativos, límite 15 y ausencia de truncado (A1, A2).
  - evidencia: `test/agent-start.test.ts`, `node dist/test/agent-start.test.js`, exit 0 (2/2)
- [x] Verificar el tramo y registrar resultados (≈5 min; A1, A2, A4).
  - evidencia: `VERIFY_RAPIDO=1 ./verify`, exit 0 (53/53; verify, CLI/doctor, paquete mem y limpieza Compose OK)
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify`, instalación aislada desde lock en Docker. Cubre A1/A2 y parte de A4.

### Tramo 2 — Pi y paquete instalado
Resultado: el pipeline real Pi incorpora memoria desde el artefacto instalable. Archivos: integrations/Pi, package.json/lock, test/pi-context.test.ts, scripts/verify-mem-bin.sh y auxiliares de verify necesarios.
- [x] Crear extensión Pi, empaquetar integrations y fijar dependencia de desarrollo Pi 1.5.0 (A3, A5).
  - evidencia: `integrations/pi-memory.mjs`; package.json/lock fijan Pi y pi-ai 1.5.0 en devDependencies; `files` incluye integrations
- [x] Probar SDK real aislado y paquete instalado, incluyendo fallos, nueva sesión y segunda consulta (A2, A3, A5).
  - evidencia: `npm run build && node dist/test/pi-context.test.js`, exit 0; artefacto npm instalado offline y SDK real
- [x] Ejecutar sensibilidad y verificación del tramo, registrar resultados y limpiar temporales (≈6 min; A2, A3, A5).
  - evidencia: copia temporal de la extensión sin retorno `message` omitió el ID y la aserción A3 falló; restaurada la extensión del paquete, `node dist/test/pi-context.test.js` pasó 1/1. `VERIFY_RAPIDO=1 ./verify`, exit 0; typecheck/build, suite 54/54, CLI/doctor, `VERIFY OK`, `MEM BIN PACKAGE OK` y limpieza Compose (`LIMPIEZA OK`).
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify`. Cubre A2/A3/A5 y suite anterior. SDK con directorios temporales, ModelRuntime sintético sin refresco de red, settings/session en memoria, sin herramientas ni descubrimiento personal; capturar mensajes con streamFn/proveedor simulado.

### Tramo 3 — Uso y aceptación completa
Resultado: instalación documentada y prueba entre equipos preparada. Archivos: snippets, docs/inicio-agentes.md, README.md, AGENTS.md, docs/proyecto.md y este plan.
- [x] Documentar rutas del paquete, instalación manual Claude/Pi, PATH/env y bloques de cinco líneas para guardado explícito (A4, A5).
- [x] Reescribir README a menos de 100 líneas, corregir integración S4 por PR #13 y preparar evidencia Mac→WSL (A4, A6).
- [x] Ejecutar verify completo sin caché y registrar revisión manual y exclusiones operativas (≈8 min; A1–A6).
Verificación del tramo: `./verify`. A1–A5 automáticas y A6 documental; la ejecución operativa entre equipos está fuera de aceptación por decisión de Franco.

## Evidencia
Tramo 1: `$ VERIFY_RAPIDO=1 ./verify` — `53/53` pruebas, CLI y doctor correctos; paquete instalado `MEM BIN PACKAGE OK`; limpieza Compose `LIMPIEZA OK`; `VERIFY OK`; `exit 0`.
Focused Claude: `$ npm run build && node dist/test/agent-start.test.js` — build correcto, 2/2, exit 0.
Focused Pi: `$ npm run build && node dist/test/pi-context.test.js` — build correcto, 1/1, exit 0; SDK y artefacto npm instalados offline.
Verify tramo 2 intento 1: 53/54; A1 no encontró `repo-16` en la respuesta limitada. El test no guardó IDs recibidos ni duración y no quedó log del intento, por lo que la causa de esa diferencia no se pudo determinar. Intento 2: `VERIFY_RAPIDO=1 ./verify`, exit 0; 54/54, CLI/doctor, runtime aislado, paquete `mem` y limpieza Compose correctos. Ese snapshot aún esperaba `repo-0` y no incluía la comparación diagnóstica final de A1.
Focused final: `npm run build` exit 0; `node dist/test/agent-start.test.js` 2/2 exit 0, incluidas listas completas de IDs auto/homónimo/explícito; `node dist/test/pi-context.test.js` 1/1 exit 0, incluye llamada de mutación con configuración válida y slow HTTP con una petición recibida y terminación antes de 3 s. Verify tramo 2 intento 3: `VERIFY_RAPIDO=1 ./verify`, exit 0; suite 54/54, CLI/doctor, `VERIFY OK`, `MEM BIN PACKAGE OK` y limpieza Compose.
Preflight Node v24.22.1. El log conservado `/tmp/s5-final-tramo3.log` registra build de aceptación completo, suite 54/54 y recorrido HTTP/paquete/limpieza correctos. La comprobación independiente final del principal se registra debajo.

## Notas
- Revisión principal tramo 2: (1) existen extensión Pi y artefacto empaquetado; (2) SDK real ejecuta session_start/before_agent_start y entrega mensajes al proveedor simulado, y el hook instalado usa mem instalado; (3) SQLite/HTTP reales proporcionan las memorias, incluidos errores con petición lenta real; (4) verificación propia completa pasó 54/54 y mantuvo CLI, backup y recorrido servidor. Revisados archivos nuevos y diff de código/manifiesto/script; lock completo validado automáticamente: 121 paquetes nuevos solo de desarrollo, versiones anteriores intactas y resoluciones del registro npm.
- Verificación propia tramo 2: `VERIFY_RAPIDO=1 ./verify`, exit 0; log `/tmp/s5-principal-tramo2.log`, 54/54, `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`. Comprobación adicional no dictada: `node /tmp/s5-principal-pi-review.mjs`, exit 0; default export cargado por ruta con loader real, dos sesiones concurrentes aisladas por proyecto y extensión vecina preservada. Se autoriza tramo 3.
- El fallo inicial A1 no tiene diagnóstico concluyente conservado; las listas completas con diagnóstico reforzado pasaron en la corrida final del constructor y en la independiente del principal. No se atribuye ese fallo al orden SQL ni se afirma una corrección funcional no demostrada.
- Revisión principal tramo 1: (1) existen helper/entrada/snippet y A1/A2 de Claude; (2) la entrada productiva consume stdin y ejecuta el mem real; (3) HTTP/SQLite/Git reales confirman datos, scopes y timeout; (4) la suite vecina sigue pasando. Diff completo revisado, incluidos archivos nuevos. A4 parcial: el inicio solo consulta; los bloques quedan para tramo 3.
- Verificación propia tramo 1: `VERIFY_RAPIDO=1 ./verify`, exit 0, 53/53, recorrido HTTP, instalación mem y limpieza Compose OK; log `/tmp/s5-principal-tramo1.log`. Comprobación adicional no dictada: `node /tmp/s5-principal-review.mjs`, exit 0; evento con cwd distinto del proceso, Git con espacios/comillas, texto multilínea literal, sin DB cliente ni escritura extra. Se autoriza avanzar al tramo 2.
- No lanzar constructor hasta aprobar este plan concretado y comprobar base limpia/al día. La corrección duradera de S4 se incluye en tramo 3 para mantener limpia la base durante planificación.
- La prueba usa cwd temporal con Git y dos raíces homónimas; el servidor SQLite confirmó aislamiento de otro proyecto, memorias general/proyecto, máximo 15 y texto de 5 KB, sin escrituras tras las consultas. La entrada consume stdin real, emite el contrato JSON Claude, y el snippet se valida con ruta shell entre comillas.
- A2 ejercita cliente real para falta de MEM_URL/TOKEN, Git ausente sin scope, scope explícito, conexión rechazada, token incorrecto y servidor HTTP retrasado; comprueba silencio, terminación antes de 3 s y HOME vacío. Los errores sintéticos cubren mem ausente, salida inválida y proceso que no termina.
- Los subprocesos de prueba reciben PATH/HOME y variables sintéticas explícitas; no heredan MEM_URL ni MEM_TOKEN del entorno del runner.
- La revisión independiente del principal comprobó el evento con cwd distinto, ruta Git con espacios/comillas, texto multilínea/metacaracteres, no crear DB cliente y ninguna escritura extra; pasó en `node /tmp/s5-principal-review.mjs`, exit 0.
- Pi usa SDK 1.5.0 y la propiedad pública real `session.agent.streamFunction`. `AgentSession.prompt` exige auth antes del stream; pruebas registran una clave sintética solo en `agentDir` temporal y reemplazan el stream antes de cualquier llamada externa.
- El test Pi importa la extensión desde el tarball instalado, cubre éxito, segunda consulta, nueva sesión y A2 (config/env, Git, token, respuesta inválida, bin ausente, sin datos, offline y HTTP lento). La copia mutada sin retorno `message` pasa por SDK, omite el ID y hace fallar la comprobación A3; el artefacto fuente queda intacto.
- `scripts/verify-mem-bin.sh` también ejecuta Claude SessionStart y carga la exportación Pi desde el paquete temporal; PATH del hook instalado apunta al prefijo que contiene mem.
- En verify intento 1, el hook empaquetado no tenía PATH del prefijo; se añadió. La assertion original de A1 solo reportó que no estaba `repo-16`; al no guardar IDs ni duración, no permite concluir si el resultado fue vacío, timeout o una lista distinta. En el intento 2 pasó la expectativa temporal `repo-0`, pero no se toma eso como explicación.
- A1 ahora compara las listas completas de IDs de recent automático, raíz homónima y scope explícito, y al fallar informa duración e IDs observados/esperados. Esto mantiene la comprobación semántica de scope y permite localizar la diferencia si se reproduce.
- Pi: los casos mutados y sin Git omiten scope (`undefined`), con configuración sintética válida en la mutación. El contador de invocaciones verifica que la mutación realmente llega a mem.
- Pi: el slow HTTP usa scope explícito y PATH con el bin instalado más `dirname(process.execPath)`; confirma una petición y el límite. Un wrapper de conteo con `spawnSync` dejó vivo a su proceso nieto al ser terminado, así que ese caso usa directamente el bin instalado para medir el timeout real.
- Durante el diagnóstico, el primer contrato stdin incorrecto del test se corrigió con lectura asíncrona de `process.stdin`; el snapshot de escritura usa `recent`, que ofrece la store autorizada.
- El `pi --help` ejecutado durante la investigación intentó crear un lock en configuración personal y el filesystem de solo lectura lo rechazó; no repetir contra esa instalación. Toda prueba SDK usa temporales aislados.
- Si un fallo de dependencia impide SDK 1.5.0, diagnosticar dentro del alcance; no sustituir A3 por un mock del API sin demostrar composición real.

### Revisión local del principal — 2026-11-09
- Alcance confirmado por Franco: Tailscale, instalación personal y pruebas operativas/remotas fuera de aceptación; las validará él. Se actualizaron AGENTS, README, docs/proyecto y docs/inicio-agentes.
- Revisión tramo 3: (1) guía, snippets y README existen; README tiene 64 líneas y ambos snippets cinco; (2) rutas y command corresponden a los entrypoints empaquetados; (3) comprobación propia `node /tmp/s5-principal-doc-review.mjs` pasó con mem/HTTP/SQLite reales, ejecutando el comando exacto del snippet con espacios, cwd del evento diferente y texto multilínea; (4) se conserva la evidencia previa de 54/54, CLI/doctor, paquete y limpieza Compose.
- A4: inicio solo consulta recent, guardado requiere petición explícita y `mem save`; snippets revisados. A5: rutas de paquete y exports coinciden con los archivos; instrucciones de PATH/env, scope y carga Pi explícita revisadas. A6 documental: guía disponible con versiones, scope e ID; ejecución excluida por decisión de Franco. A1–A3 conservan las revisiones independientes de tramos 1 y 2.
- Intento independiente final `./verify > /tmp/s5-principal-final-local.log 2>&1`: preflight Docker agotó 15 s (exit 124), tanto dentro como fuera del sandbox. No llegó a construir ni creó recursos Compose; no se modifica el servicio del host. La corrida previa `/tmp/s5-final-tramo3.log` tiene 54/54, VERIFY OK, MEM BIN PACKAGE OK y LIMPIEZA OK; no se presenta como una ejecución nueva.
- En la primera revisión el tercer paso del tramo 3 quedó abierto por la repetición independiente de verify. El reintento posterior indicado debajo resolvió ese pendiente local. Sin archivado ni commit; pendiente revisión de evidencia por Franco.
- Verificación focal nueva: `npm run build && node dist/test/agent-start.test.js && node dist/test/pi-context.test.js`, exit 0; build correcto, Claude 2/2 y Pi SDK real desde paquete instalado 1/1. `git diff --check` pasó.

### Reintento final del principal — 2026-11-09
- Tras el «dale» de Franco, el intento dentro del sandbox agotó nuevamente el preflight. El reintento autorizado fuera del sandbox terminó con exit 0; el socket Docker respondió `OK` a `/_ping` fuera del sandbox. No se atribuye el timeout anterior a un fallo del proyecto.
- `./verify > /tmp/s5-principal-final-local.log 2>&1`, sin `VERIFY_RAPIDO`: instalación desde lock, build de aceptación sin caché, suite 54/54 (0 fallos), CLI/doctor y recorrido HTTP/SQLite correctos; `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`, `LIMPIEZA OK`. La capa base WORKDIR aparece cacheada; las etapas de instalación/build/pruebas se ejecutaron.
- Revisión final A1–A3: suite nueva y revisiones independientes anteriores confirman scopes, contenido completo, fallos silenciosos y pipeline SDK real. A4–A6 documental: revisión manual registrada arriba, sin cambios posteriores en integraciones. La prueba adicional del comando exacto documentado también pasó.
- Los tres tramos quedan verificados dentro del alcance local acordado. Tailscale, instalación personal y pruebas entre equipos quedan a cargo de Franco, fuera del cierre. Pendiente su aprobación de esta evidencia para archivar el plan antes de su commit y PR a main.

### Aprobación y archivado — 2026-11-09
- Franco aprobó la evidencia local con «aprobado». Plan archivado en `cambios/hechos/inicio-agentes/`, conservando `estado: listo`.
- Pendiente el commit de Franco en `feature/inicio-agentes` y después su PR hacia `main`. No se afirma integrado.

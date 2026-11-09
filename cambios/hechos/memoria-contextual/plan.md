---
estado: listo
rama: feature/memoria-contextual
base: main
repos: [.]
ejecutor: constructor
tramo: 3
---
# Memoria durante el trabajo de los agentes

## Objetivo
Claude Code y Pi reciben instrucciones para consultar recuerdos cuando ayuden a la conversación o acción actual y guardar automáticamente decisiones, aprendizajes y bloqueos resueltos del proyecto. Las reglas generales requieren confirmación de Franco.

## Contexto y prerrequisitos
S1–S5 están integrados en main (PR #14). `mem search`, `save` y `recent` ya recorren HTTP/SQLite reales; no se necesita otra API. `integrations/recent-context.mjs` ejecuta recent con límite de 2 segundos; Claude usa SessionStart y Pi session_start/before_agent_start. Hoy ambos snippets prohíben guardar sin petición expresa: hay que reemplazar esa política.

Entorno observado: main limpio y alineado según git status; `npm run build` pasó el 2026-11-09. Antes de ejecutar: comprobar base limpia, fetch y cero commits pendientes desde origin/main. Node y dependencias según package-lock; Docker/Compose para verify. No leer credenciales ni instalar servicios.

Referencias: `docs/inicio-agentes.md`, `test/agent-start.test.ts`, `test/pi-context.test.ts`, `scripts/verify-mem-bin.sh`; SDK instalado Pi 1.5.0, `docs/extensions.md` de ese paquete (before_agent_start, systemPrompt y bash). Hook Claude: https://code.claude.com/docs/en/hooks (SessionStart/additionalContext).

## Supuestos
- La relevancia y el contenido útil los decide el modelo mediante instrucciones y su herramienta de terminal existente. Si se pide captura determinista de transcripciones, cambia este plan.
- Se conserva la búsqueda léxica existente y el alcance Git/configurado. Si se piden embeddings o una nueva identidad de proyecto, cambia el alcance.

## Alcance
`integrations/` (nuevo módulo compartido de política, adaptadores y snippets), `test/agent-start.test.ts`, `test/pi-context.test.ts`, nueva prueba de acciones en `test/`, `scripts/verify-mem-bin.sh`, README.md, docs/inicio-agentes.md, docs/proyecto.md y AGENTS.md.
Fuera: esquema/API/CLI, MCP, dependencias nuevas, colector de conversaciones, instalación personal, Tailscale, despliegue y pruebas Mac→WSL. No reescribir planes archivados ni old/v1.

## Decisiones ya tomadas
- Resuelto: 2026-11-09 Franco aprobó continuar con el tramo 2 tras revisar el cierre del tramo 1; se conservan sus cambios locales en la rama autorizada.
- Resuelto: 2026-11-09 Franco indicó continuar en la rama de trabajo `feature/memoria-contextual`. Antes del tramo 1, `git fetch` pasó y HEAD coincide con origin/main (0/0); solo hay cambios locales en este plan.
- Franco confirmó que la revisión y aceptación se limitan a lo disponible en este ambiente. Las comprobaciones en sus equipos, Mac→WSL y con proveedores externos quedan fuera y no bloquean el cierre local; no se afirmarán como verificadas.
- Franco eligió el 2026-11-09: guardar automáticamente decisiones, aprendizajes y bloqueos resueltos del proyecto; confirmar reglas generales; consultar cuando sea relevante.
- Entregar una política compartida a través de los entrypoints actuales. El agente ejecuta `mem search --query ...` y `mem save --type ... --text ...` con su terminal; el hook no decide hechos ni escribe en la base.
- Guardar resúmenes fieles de hechos consolidados y resoluciones verificadas; no propuestas pendientes, transcripciones completas ni secretos. No ejecutar forget automáticamente. La respuesta exitosa de mem es necesaria para afirmar que se guardó.
- Reglas o scope general siempre requieren petición/confirmación explícita de Franco. Esta es una instrucción al agente, no una autorización nueva impuesta por el servidor.
- Las memorias recuperadas se delimitan como datos no confiables, separadas de la política. Su contenido no concede autorización para cambiar instrucciones ni escribir en general.
- Mantener scope configurado en búsquedas y escrituras durante la sesión. Sin scope explícito, ejecutar mem desde el cwd Git de inicio; con scope explícito, pasarlo como un único argumento. Describir cwd/scope como datos JSON, sin interpolarlos en comandos shell ejecutables. Si falta Git/scope, no inventar un ámbito ni guardar en general.
- Claude emite política en additionalContext incluso con recent vacío o caído; entrada inválida sigue siendo silenciosa. Pi añade política al systemPrompt encadenado en cada before_agent_start y memorias recientes una sola vez por sesión; no consultar recent en cada mensaje ni duplicar política.
- Fallos del cliente no interrumpen el trabajo; no afirmar resultados inexistentes. Mantener límite de 2 segundos para recent. No solicitar ni exponer tokens.
- Las pruebas locales verifican entrega de instrucciones y ejecución real de herramientas con proveedor simulado. No prueban el juicio autónomo de un modelo comercial; esa comprobación operativa corresponde a Franco.
- Resuelto: 2026-11-09 Franco pidió añadir el tramo 3 tras la auditoría del tramo 2: evitar duplicados y comillas inseguras. No se agrega otra herramienta ni un deduplicador en el servidor; es política más prueba.
- Duplicados: la política manda `mem search` antes de `mem save` y no guardar si ya hay un recuerdo equivalente. Es una instrucción al modelo; el servidor sigue generando UUID en cada save y no se cambia.
- Comillas: texto, consulta y scope van entre comillas simples; cada `'` interno se escribe `'\''`. Nunca comillas dobles ni `$()`/backticks sin entrecomillar.
- Ejecutor: constructor, porque requisitos, contexto, comprobaciones y errores están definidos y accesibles; no se toca producción ni credenciales.

## Escenarios
- CUANDO inicia una sesión con o sin recuerdos ENTONCES recibe política y solo las memorias disponibles; una segunda interacción Pi conserva política sin otro recent (A1).
- CUANDO el agente necesita contexto y consolida una decisión ENTONCES puede buscar y guardar mediante mem real; otra sesión recupera el ID (A2).
- CUANDO hay scope explícito, datos no confiables o servidor caído ENTONCES se conserva el ámbito, la separación de instrucciones y la honestidad sobre errores; reglas generales requieren confirmación (A3).
- CUANDO se instala el tarball ENTONCES incluye la política y ambos adaptadores; documentación y snippets describen el comportamiento acordado (A4).
- CUANDO el agente va a guardar un hecho ENTONCES busca antes y no repite uno equivalente (A5); CUANDO el texto trae comillas o metacaracteres ENTONCES se guarda literal sin ejecutar nada (A6); CUANDO se leen guías y snippets ENTONCES dicen lo mismo (A7).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Política llega al modelo por entrypoints productivos | Hook hijo y SDK Pi real, también vacío/offline y segundo turno | Instrucciones presentes, memorias solo si existen; un recent por sesión; prompt previo preservado |
| A2 | Herramientas conectadas a memoria persistente | Proveedor simulado emite toolCall bash en sesión SDK real: search, save; nueva sesión consulta recent | Resultado de búsqueda no vacío, respuesta save con ID, mismo ID/texto en SQLite y nueva sesión; otro proyecto excluido |
| A3 | Política/ámbito/fallos correctos | Hook y SDK con scope explícito distinto del basename, memorias con órdenes adversarias, servidor caído y entradas inválidas; revisión manual del texto entregado | Scope consistente incluso al ejecutar search/save, datos delimitados, sin token ni falso éxito; general/rule con confirmación; startup sin escritura |
| A4 | Paquete y guías utilizables | Instalar tarball en prefijo temporal y comprobar adaptadores; revisar snippets y guías; verify completo | Módulo incluido y cargable, comandos vigentes, sin exigencia de petición expresa para los tres tipos automáticos |

| A5 | La política evita duplicados | Revisar el texto de `renderMemoryPolicy` y la prueba de acciones | Texto exige `mem search` previo y no guardar si existe equivalente; la prueba A2 ejecuta search antes de save y falla si el orden se invierte |
| A6 | Texto con comillas y metacaracteres se guarda literal | Sesión SDK Pi real: el modelo simulado emite `mem save` con el entrecomillado prescrito y un texto con `'`, `"`, `$(touch MARCA)` y backticks | Texto persistido idéntico en SQLite; el archivo MARCA no existe; sin entrecomillado correcto la prueba falla |
| A7 | Guías y snippets dicen lo mismo | Comparar el bloque `md` de `docs/inicio-agentes.md` con ambos snippets | Contenido idéntico línea a línea; ambos snippets incluyen buscar antes de guardar y entrecomillado |

Sensibilidad: mutación aislada del adaptador empaquetado que retire política debe hacer fallar la aserción de A1 por ausencia de instrucciones. Mantener la sensibilidad existente de inyección de memorias, adaptando sus imports si aparece un módulo compartido. A2 debe exigir toolCalls/resultados/IDs efectivos, no aceptar colecciones vacías ni sustituir herramientas por escrituras directas al store.

## Verificación
`./verify` — corrida final desde cero y sin caché: suite, CLI, HTTP/SQLite, paquete instalado y limpieza Compose. Sin acceso a proveedores externos ni equipos de Franco.

## Pasos
### Tramo 1
Resultado: política contextual llega por Claude y Pi, preservando el contexto inicial.
Archivos: integrations/, test/agent-start.test.ts, test/pi-context.test.ts.
- [x] Crear política compartida con comandos, tipos, límites, cwd/scope y separación explícita entre instrucciones y memorias (A1, A3).
  - evidencia: `integrations/memory-policy.mjs` exporta la política común con formatos de argumentos seguros, límites de guardado, confirmación general y memorias no confiables.
- [x] Integrarla en SessionStart Claude y before_agent_start Pi, preservando prompt encadenado, recent una vez y errores de inicio (A1, A3).
  - evidencia: `integrations/claude-session-start.mjs` entrega política aunque recent no devuelva memorias; `integrations/pi-memory.mjs` encadena systemPrompt cada turno y consume recent una vez por sesión.
- [x] Adaptar pruebas de hook/SDK y sensibilidad para política sin recuerdos, segundo turno, scope y datos adversarios (A1, A3).
  - evidencia: `./verify` ejecutó los recorridos de Claude y Pi en SDK/hook reales; política con y sin recuerdos, dos turnos, scope explícito, fallo offline, memorias adversarias y mutación de inyección; suite aprobada.
- [x] Ejecutar verificación parcial y registrar resultados (≈3–5 min; A1, A3).
  - evidencia: `VERIFY_RAPIDO=1 ./verify`; salida final incluye `tests 54`, `pass 54`, `fail 0`, `MEM BIN PACKAGE OK`, `LIMPIEZA OK`, `VERIFY OK`; exit 0.

Verificación del tramo: `VERIFY_RAPIDO=1 ./verify`; cubre A1 y A3 en entrega de política. La ejecución con scope explícito se completa en tramo 2.

### Tramo 2
Resultado: recorrido de herramientas, paquete y documentación listos para prueba personal del MVP.
Archivos: nueva prueba test/memory-actions.test.ts, test/pi-context.test.ts si requiere reutilización, scripts/verify-mem-bin.sh, snippets, README.md, docs/inicio-agentes.md, docs/proyecto.md, AGENTS.md.
- [x] Añadir recorrido SDK Pi con herramienta bash real y modelo simulado que emita search/save contra HTTP/SQLite temporales (A2, A3).
  Usar herramientas SDK públicas y entorno sintético aislado; ningún archivo personal ni petición a proveedor. La respuesta del modelo usa stopReason toolUse; el SDK ejecuta los toolCalls. Incluir scope explícito y proyecto vecino; comprobar resultados reales antes de abrir otra sesión.
- [x] Verificar política desde paquete instalado y reemplazar instrucciones contradictorias en snippets y guías (A4).
- [x] Documentar ejemplos contextual/automático, confirmación general, fallos y límite de las pruebas locales; reflejar PR #14 ya integrado (A3, A4).
- [x] Ejecutar `./verify` final y completar evidencia de A1–A4 y sensibilidad (≈3–5 min; A1, A2, A3, A4).

Verificación del tramo: `./verify`; cubre A1–A4.

### Tramo 3
Resultado: la política evita duplicados y el guardado resiste texto con comillas y metacaracteres.
Archivos: integrations/memory-policy.mjs, integrations/*.snippet, docs/inicio-agentes.md, test/memory-actions.test.ts, scripts/verify-mem-bin.sh.
- [x] Añadir a `renderMemoryPolicy` la regla de buscar con `mem search` antes de guardar y no guardar si existe un recuerdo equivalente (A5).
  - evidencia: `integrations/memory-policy.mjs` contiene «Antes de `mem save`, ejecuta `mem search` con el mismo scope; si ya existe un recuerdo equivalente…»; antes del cambio el conteo de «equivalente» era 0.
- [x] Añadir a la política la regla de entrecomillado con comillas simples y `'\''` para las internas (A6).
  - evidencia: `integrations/memory-policy.mjs` contiene la regla de comillas simples y `'\''`; `test/memory-actions.test.ts` usa esa forma para el save adverso, y `./verify` exit 0.
- [x] Copiar ambas reglas a los dos snippets y dejar en `docs/inicio-agentes.md` un bloque idéntico a ellos (A7).
  - evidencia: `integrations/AGENTS.md.snippet`, `integrations/CLAUDE.md.snippet` y el bloque `md` de `docs/inicio-agentes.md` son iguales; la comparación con `awk` y `cat` imprimió `SNIPPETS_EQUAL_OK`.
- [x] Ampliar `test/memory-actions.test.ts`: tercer toolCall `mem save` con texto adverso (`'`, `"`, `$(touch MARCA)`, backticks); comprobar texto persistido exacto, ausencia de MARCA y que el search precede al save (A5, A6).
  - evidencia: `test/memory-actions.test.ts`; `npm run build` exit 0 y `node --test dist/test/memory-actions.test.js` exit 0 (`pass 1`, `fail 0`).
- [x] Añadir en `scripts/verify-mem-bin.sh` la comprobación de las dos reglas en la política empaquetada y la igualdad docs/snippets (A5, A7).
  - evidencia: `scripts/verify-mem-bin.sh`; `./verify` imprimió `MEM BIN PACKAGE OK` con exit 0 en la corrida final.
- [x] Ejecutar `./verify` final y completar evidencia (≈3–5 min; A1–A7).
  - evidencia: `./verify`, exit 0; salida: `tests 55`, `pass 55`, `fail 0`, `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`. Log en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/verify-t3.log`.

Verificación del tramo: `./verify`; cubre A1–A7. Resultado: pasó (ver Evidencia, tramo 3). Límite declarado: lo deterministico es que el texto entregado diga esto y que el entrecomillado prescrito funcione; que el modelo real lo cumpla no se prueba.

## Evidencia
Tramo 1 (política en entrypoints, A1 y entrega de política de A3): `VERIFY_RAPIDO=1 ./verify` — compilación y typecheck pasan; suite completa: 54 tests, 54 pass, 0 fail; CLI doctor confirma SQLite/FTS5; recorrido remoto y paquete `mem` pasan; `LIMPIEZA OK`; `VERIFY OK`; exit 0. La suite ejercita el hook Claude y SDK Pi, incluyendo memoria vacía/offline, un recent por sesión, preservación del prompt, scope explícito, datos adversarios y sensibilidad de inyección. No verifica juicio autónomo de proveedor comercial.

Tramo 3 (A5–A7 y A6 en acciones): `./verify`, exit 0 en la segunda corrida (la primera falló en el preflight de Docker con código 124 y `docker info` respondió bien después). Salida real: suite 55 tests, 55 pass, 0 fail; `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`. La prueba de acciones ejecuta un tercer `mem save` con `'`, `"`, `$(touch MARCA)` y backticks: el texto se persiste idéntico, no aparece `MARCA` y el search precede a los saves. Límite declarado: que un modelo real siga estas reglas no se prueba; lo verificado es que el texto entregado las contiene y que el entrecomillado prescrito se ejecuta sin interpretar metacaracteres.

Tramo 2 (A1–A4): `./verify` — suite completa: 55 tests, 55 pass, 0 fail; CLI y SQLite/FTS5 pasan; recorrido remoto pasa; `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; exit 0. El nuevo recorrido de SDK Pi real ejecuta bash para buscar y guardar en servidor/SQLite temporales con scope explícito, excluye proyecto vecino y recupera el mismo ID desde una sesión nueva. El paquete instalado verifica la política empaquetada y las guías reflejan el comportamiento acordado. Proveedores externos y equipos Mac→WSL quedan fuera de esta comprobación local.

## Notas
La prueba inicial falló por acceso al socket Docker denegado por sandbox; repetida con acceso, el preflight pasó. Una corrida detectó timeout de test de Claude bajo carga (el cliente conserva su límite real de 2 s); el margen de la aserción se amplió a 5 s. También se conservó la compatibilidad del hook con el payload de verificación que omite `hook_event_name`, rechazando explícitamente otros eventos. La verificación final pasó y limpió Compose.

Revisión del principal (2026-11-09): diff completo revisado, incluido el módulo nuevo. A1 pasa por hook Claude y SDK Pi reales; A3 pasa en entrega de política (confirmación general, ámbito JSON, datos no confiables y errores). A2 y A4 quedan para tramo 2. Añadida sensibilidad que retira solo la política del adaptador empaquetado: conserva prompt/memorias y hace fallar la aserción A1.

Revisión por tramo: (1) existe la política compartida solicitada; (2) está conectada a SessionStart/before_agent_start productivos; (3) los recorridos usan CLI/HTTP/SQLite y SDK reales con datos sintéticos aislados, sin proveedor externo; (4) suite y recorridos vecinos pasan. Comprobación independiente: hook real sin cliente, con cwd/scope que contienen caracteres de shell; conserva ambos como JSON, entrega política y no inventa memorias. El primer intento quedó bloqueado por sandbox; repetido con acceso pasó.

Verificación propia del principal: `VERIFY_RAPIDO=1 ./verify` pasó con exit 0, suite de 54 pruebas y `VERIFY OK`, `MEM BIN PACKAGE OK`, `LIMPIEZA OK`. Log local: `/tmp/memoria-contextual-t1-principal.log`. El sandbox bloqueó inicialmente Docker; la corrida con acceso pasó.

Resumen de cierre del tramo 1:
- Política compartida entregada en Claude y Pi incluso sin memorias.
- Prompt previo preservado y recent una sola vez por sesión.
- Ámbito, confirmación general y separación de datos revisados.
- Sensibilidad de política/memorias y verificación propia aprobadas.
- Sigue tramo 2: acciones search/save reales, paquete y documentación; antes, `/compact` o sesión nueva con la ruta del plan.

Resumen de cierre del tramo 2:
- SDK Pi real ejecuta `mem search` y `mem save` contra HTTP/SQLite temporal con scope explícito y proyecto vecino excluido.
- La sesión posterior recupera la misma memoria guardada; el proveedor de modelo es simulado.
- Verificación del paquete instalado y documentación contextual/automática completadas.
- `./verify` final pasa: 55 tests, 0 fallos, paquete `mem` y limpieza Compose aprobados.
- Listo para revisión final del principal; validación Mac→WSL y proveedores externos siguen a cargo de Franco.


Revisión final del principal, tramo 2 (2026-11-09):
- A1: revisados los entrypoints Claude/Pi y la sensibilidad de política/memorias del paquete; preservan el prompt y recent una vez por sesión.
- A2: revisado el recorrido SDK real con bash, cliente instalado, HTTP y SQLite. Search exige un toolResult exitoso con el ID esperado, no solo contexto inicial; save devuelve el ID persistido y otra sesión lo recupera. Directorio Git distinto del scope explícito y proyecto vecino excluido.
- A3: texto de política revisado: confirmación para reglas/general, scope conservado, memorias como datos no confiables y fallos sin éxito inventado. Comprobación independiente adicional: hook productivo offline con scope general entrega confirmación y startup solo lectura sin inventar memorias; pasó fuera del sandbox, que bloqueó el primer intento.
- A4: snippets y guías revisados; corregida la atribución de PR #14 (integra S5, no este cambio aún pendiente). Paquete instalado incluye y carga la política; verificación aprobada.
- Revisión por tramo: existe lo pedido; está conectado a los entrypoints productivos; usa herramientas/HTTP/SQLite reales con datos sintéticos aislados y proveedor simulado; suite y recorridos vecinos pasan.

Verificación propia final: `./verify` sin caché pasó, exit 0, 55 pruebas aprobadas, `VERIFY OK`, `MEM BIN PACKAGE OK` y limpieza Compose correcta. Log: `/tmp/memoria-contextual-t2-principal.log`. El preflight inicial fue bloqueado por sandbox; la corrida con acceso Docker pasó. Tras reforzar la aserción de search durante la corrida, `npm run build` y `node dist/test/memory-actions.test.js` sobre el código final pasaron (1/1); log: `/tmp/memoria-contextual-t2-actions.log`. `git diff --check` limpio.

Tramo 2 revisado y listo para que Franco apruebe la evidencia local. Pendiente ceremonia de cierre y archivado antes de su commit; no se hicieron commit, PR ni despliegue. Mac→WSL y criterio de proveedor externo quedan fuera de la aceptación acordada.

Revisión del principal, tramo 3 (2026-11-09):
- A5: la política y ambos snippets exigen `mem search` con el mismo scope antes de `mem save`; es una instrucción al modelo, no una garantía del servidor. El test ejecuta search antes de los saves.
- A6: el test guarda por el SDK Pi real un texto con `'`, `"`, `$(touch MARCA)` y backticks; el texto persistido es idéntico y no existe `MARCA`.
- A7: `verify-mem-bin.sh` compara el bloque `md` de la guía con ambos snippets (idénticos). Compruebo además `cmp` entre snippets: iguales.
- Revisión por tramo: existe lo pedido; conectado a los entrypoints productivos y al paquete instalado; datos sintéticos aislados; lo vecino (55 pruebas) pasa.
- Verificación propia: `./verify` sin caché, exit 0, 55/55, `VERIFY OK`, `MEM BIN PACKAGE OK`, limpieza Compose. Log: `/tmp/memoria-contextual-t3-principal.log`. `git diff --check` limpio.

Cierre (2026-11-09): Franco aprobó la evidencia local. Tramos 1–3 terminados y revisados; plan archivado conservando `estado: listo`. Pendientes commit de Franco y PR hacia `main`; no se realizó despliegue.

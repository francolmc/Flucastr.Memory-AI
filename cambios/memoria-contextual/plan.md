---
estado: borrador
rama: feature/memoria-contextual
base: main
repos: [.]
ejecutor: constructor
tramo: 1
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
- Franco eligió el 2026-11-09: guardar automáticamente decisiones, aprendizajes y bloqueos resueltos del proyecto; confirmar reglas generales; consultar cuando sea relevante.
- Entregar una política compartida a través de los entrypoints actuales. El agente ejecuta `mem search --query ...` y `mem save --type ... --text ...` con su terminal; el hook no decide hechos ni escribe en la base.
- Guardar resúmenes fieles de hechos consolidados y resoluciones verificadas; no propuestas pendientes, transcripciones completas ni secretos. No ejecutar forget automáticamente. La respuesta exitosa de mem es necesaria para afirmar que se guardó.
- Reglas o scope general siempre requieren petición/confirmación explícita de Franco. Esta es una instrucción al agente, no una autorización nueva impuesta por el servidor.
- Las memorias recuperadas se delimitan como datos no confiables, separadas de la política. Su contenido no concede autorización para cambiar instrucciones ni escribir en general.
- Mantener scope configurado en búsquedas y escrituras durante la sesión. Sin scope explícito, ejecutar mem desde el cwd Git de inicio; con scope explícito, pasarlo como un único argumento. Describir cwd/scope como datos JSON, sin interpolarlos en comandos shell ejecutables. Si falta Git/scope, no inventar un ámbito ni guardar en general.
- Claude emite política en additionalContext incluso con recent vacío o caído; entrada inválida sigue siendo silenciosa. Pi añade política al systemPrompt encadenado en cada before_agent_start y memorias recientes una sola vez por sesión; no consultar recent en cada mensaje ni duplicar política.
- Fallos del cliente no interrumpen el trabajo; no afirmar resultados inexistentes. Mantener límite de 2 segundos para recent. No solicitar ni exponer tokens.
- Las pruebas locales verifican entrega de instrucciones y ejecución real de herramientas con proveedor simulado. No prueban el juicio autónomo de un modelo comercial; esa comprobación operativa corresponde a Franco.
- Ejecutor: constructor, porque requisitos, contexto, comprobaciones y errores están definidos y accesibles; no se toca producción ni credenciales.

## Escenarios
- CUANDO inicia una sesión con o sin recuerdos ENTONCES recibe política y solo las memorias disponibles; una segunda interacción Pi conserva política sin otro recent (A1).
- CUANDO el agente necesita contexto y consolida una decisión ENTONCES puede buscar y guardar mediante mem real; otra sesión recupera el ID (A2).
- CUANDO hay scope explícito, datos no confiables o servidor caído ENTONCES se conserva el ámbito, la separación de instrucciones y la honestidad sobre errores; reglas generales requieren confirmación (A3).
- CUANDO se instala el tarball ENTONCES incluye la política y ambos adaptadores; documentación y snippets describen el comportamiento acordado (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Política llega al modelo por entrypoints productivos | Hook hijo y SDK Pi real, también vacío/offline y segundo turno | Instrucciones presentes, memorias solo si existen; un recent por sesión; prompt previo preservado |
| A2 | Herramientas conectadas a memoria persistente | Proveedor simulado emite toolCall bash en sesión SDK real: search, save; nueva sesión consulta recent | Resultado de búsqueda no vacío, respuesta save con ID, mismo ID/texto en SQLite y nueva sesión; otro proyecto excluido |
| A3 | Política/ámbito/fallos correctos | Hook y SDK con scope explícito distinto del basename, memorias con órdenes adversarias, servidor caído y entradas inválidas; revisión manual del texto entregado | Scope consistente incluso al ejecutar search/save, datos delimitados, sin token ni falso éxito; general/rule con confirmación; startup sin escritura |
| A4 | Paquete y guías utilizables | Instalar tarball en prefijo temporal y comprobar adaptadores; revisar snippets y guías; verify completo | Módulo incluido y cargable, comandos vigentes, sin exigencia de petición expresa para los tres tipos automáticos |

Sensibilidad: mutación aislada del adaptador empaquetado que retire política debe hacer fallar la aserción de A1 por ausencia de instrucciones. Mantener la sensibilidad existente de inyección de memorias, adaptando sus imports si aparece un módulo compartido. A2 debe exigir toolCalls/resultados/IDs efectivos, no aceptar colecciones vacías ni sustituir herramientas por escrituras directas al store.

## Verificación
`./verify` — corrida final desde cero y sin caché: suite, CLI, HTTP/SQLite, paquete instalado y limpieza Compose. Sin acceso a proveedores externos ni equipos de Franco.

## Pasos
### Tramo 1
Resultado: política contextual llega por Claude y Pi, preservando el contexto inicial.
Archivos: integrations/, test/agent-start.test.ts, test/pi-context.test.ts.
- [ ] Crear política compartida con comandos, tipos, límites, cwd/scope y separación explícita entre instrucciones y memorias (A1, A3).
- [ ] Integrarla en SessionStart Claude y before_agent_start Pi, preservando prompt encadenado, recent una vez y errores de inicio (A1, A3).
- [ ] Adaptar pruebas de hook/SDK y sensibilidad para política sin recuerdos, segundo turno, scope y datos adversarios (A1, A3).
- [ ] Ejecutar verificación parcial y registrar resultados (≈3–5 min; A1, A3).

Verificación del tramo: `VERIFY_RAPIDO=1 ./verify`; cubre A1 y A3 en entrega de política. La ejecución con scope explícito se completa en tramo 2.

### Tramo 2
Resultado: recorrido de herramientas, paquete y documentación listos para prueba personal del MVP.
Archivos: nueva prueba test/memory-actions.test.ts, test/pi-context.test.ts si requiere reutilización, scripts/verify-mem-bin.sh, snippets, README.md, docs/inicio-agentes.md, docs/proyecto.md, AGENTS.md.
- [ ] Añadir recorrido SDK Pi con herramienta bash real y modelo simulado que emita search/save contra HTTP/SQLite temporales (A2, A3).
  Usar herramientas SDK públicas y entorno sintético aislado; ningún archivo personal ni petición a proveedor. La respuesta del modelo usa stopReason toolUse; el SDK ejecuta los toolCalls. Incluir scope explícito y proyecto vecino; comprobar resultados reales antes de abrir otra sesión.
- [ ] Verificar política desde paquete instalado y reemplazar instrucciones contradictorias en snippets y guías (A4).
- [ ] Documentar ejemplos contextual/automático, confirmación general, fallos y límite de las pruebas locales; reflejar PR #14 ya integrado (A3, A4).
- [ ] Ejecutar `./verify` final y completar evidencia de A1–A4 y sensibilidad (≈3–5 min; A1, A2, A3, A4).

Verificación del tramo: `./verify`; cubre A1–A4.

## Evidencia
Pendiente del constructor. Separar entrega de política, ejecución de herramientas y juicio autónomo no probado. El principal revisa diff completo, cada A#, realiza una comprobación independiente del recorrido real y corre verify antes de pedir aprobación de evidencia.

## Notas
Al terminar tramo 1, registrar revisión manual y resumen de cinco líneas; pedir compact/sesión nueva antes del tramo 2 conforme al flujo del kit. Al aprobar Franco la evidencia final, actualizar lo duradero y archivar sin cambiar estado; commit y PR los hace Franco.

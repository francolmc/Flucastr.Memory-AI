---
estado: aprobado
rama: feature/uso-natural
base: main
repos: [.]
ejecutor: constructor
tramo: 1
tipo: codigo
---
# Uso natural de memoria

## Objetivo
Incorporar consulta contextual y propuestas confirmables a los agentes, manteniendo el servidor central como única fuente de memorias y ofreciendo métricas locales de uso.

## Exploración
- El usuario confirmó: repositorio único; propuestas `proposed` persistentes localmente hasta confirmar o descartar; estadísticas locales por equipo, identificando el agente por configuración o `desconocido`; confirmación del guardado autónomo, preservando el guardado directo; `mem init` conserva JSON/TOML y ofrece instrucciones por opción separada.
- `src/mcp/tools.ts`: cuatro herramientas; `memory_save` solo pide confirmación para reglas o general. `src/domain/memory.ts`: no existe estado `proposed`. `src/mem.ts` permite guardado directo y `init` imprime configuración parseable. `src/http/routes.ts` ofrece `recent` por scope y límite, sin filtro por tipo ni API de métricas o propuestas.
- `integrations/recent-context.mjs` ya consulta memorias y `integrations/pi-memory.mjs` las inyecta al inicio. `integrations/memory-policy.mjs` y `docs/inicio-agentes.md` promueven guardado automático: deben cambiar. El proyecto ya tiene hook Claude y extensión Pi: se reutilizan.
- Documentación oficial: [Claude SessionStart](https://code.claude.com/docs/en/hooks#sessionstart) define `hookSpecificOutput.additionalContext`; documentación local de Pi 1.5.2 `docs/extensions.md` describe `session_start` y `before_agent_start`. [ChatGPT MCP](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt) distingue conexión e instrucciones; lectura directa devolvió 403, por tanto compatibilidad **no verificada**. `docs/conectar-agentes.md` enlaza las fuentes oficiales de Claude Code, Cursor, Codex, Pi y Desktop: volver a comprobarlas y registrar fecha/resultado sin afirmar compatibilidad de una app no probada.
- La recuperación por `recent` solo garantiza seleccionar entre los recuerdos recientes devueltos: no garantiza todas las reglas históricas ni relevancia semántica. Las instrucciones no garantizan conducta de un modelo; la aceptación automatizada demuestra entrega y política, no autonomía real. ChatGPT no usa este servidor stdio directamente sin transporte compatible.
- `git status --short`: cambios preexistentes `.claude/settings.json` y `.codex/`, ajenos al plan. No modificarlos. Node v24.22.1 y ejecutable Docker presentes; funcionamiento Docker no comprobado.

## Evaluación
Propuestas y contadores locales evitan cambiar esquema/API del servidor, pero no se comparten entre equipos; confirmados siguen en el servidor central. Opción de instrucciones separada conserva consumidores JSON/TOML. Esta alternativa fue elegida por la persona usuaria.

## Supuestos
- `recent` proporciona un conjunto acotado reciente; filtrar reglas, decisiones y bloqueos resueltos de ese conjunto no promete cobertura histórica completa. Si se necesita, requiere API/índice adicional y nuevo alcance.
- Métricas cuentan invocaciones, no razonamientos ni lectura de conversaciones; no se infiere uso de agentes que omiten la instrumentación. Si se requiere cobertura global hace falta otro diseño.
- Confirmación del agente se basa en instrucciones y acción explícita del usuario, no constituye una frontera criptográfica; los comandos directos existentes siguen disponibles.

## Decisiones ya tomadas
- Ejecutor: constructor, porque el cambio no es pequeño; requisitos, contexto local y comprobaciones se detallan aquí, sin credenciales ni despliegue.
- `proposed` persiste en archivos locales privados, no en la base central; jamás aparece en búsqueda/contexto hasta confirmarse.
- Mantener `mem init <agente>` parseable; `mem init <agente> --instructions` entrega solo 3–5 líneas. Aceptar también `chatgpt` únicamente para `--instructions`; no inventar configuración MCP stdio para ChatGPT.
- Métricas locales por agente y herramienta, con `MEM_AGENT` establecido por configuración/integración; sin identificación usar `desconocido`. Contar invocaciones aceptadas incluso si la operación remota falla; no guardar argumentos ni contenido.
- No commit, push ni despliegue. Verificación final `./verify`.

## Decisiones
Ninguna adicional.

## Validación
La persona usuaria eligió las opciones recomendadas, confirmó repositorio único, retención manual e identificación con fallback y aprobó el plan completo.

## Alcance
Producto: `src/mcp/tools.ts`, `src/mcp/index.ts`, `src/mem.ts`, `src/agent-config.ts`, nuevos módulos `src/local-state.ts`, `src/context.ts`; `integrations/recent-context.mjs`, `integrations/claude-session-start.mjs`, `integrations/pi-memory.mjs`, `integrations/memory-policy.mjs`, snippets `integrations/AGENTS.md.snippet` y `integrations/CLAUDE.md.snippet`. Pruebas y documentación relacionadas, sin límite numérico. Mantener `package.json` y servidor sin cambios salvo necesidad documentada que obligue a detenerse y replanificar. No tocar `.claude/settings.json`, `.codex/`, credenciales, despliegue ni conversaciones. No se crean pantallas.

## Contrato común
- Usar `$XDG_STATE_HOME/flucastr-memory-ai/` o `~/.local/state/flucastr-memory-ai/`; directorio privado 0700 y archivos 0600. Sin base SQLite local. Escribir de forma segura ante procesos concurrentes; ninguna ruta contiene tokens ni transcripciones. Fallos locales no se reportan como éxito.
- Propuesta: UUID, tipo permitido, scope, texto conciso y estado `proposed`; máximo tres por llamada, con validación de scope. MCP `memory_propose` y CLI `mem propose` comparten almacén; `mem proposals` lista y `mem discard --id ID` elimina. `mem confirm --id ID` es acción explícita: guarda con UUID estable vía HTTP existente y elimina propuesta solo después del éxito; error conserva propuesta para reintento idempotente. Agentes proponen y esperan respuesta antes de ejecutar confirmación; no usar `memory_save` automáticamente. No prometer detección infalible de secretos.
- Contexto: `memory_context` y `mem context` usan el mismo algoritmo: scope Git actual o scope explícito permitido, `/v1/recent` con límite 100; filtrar `rule`, `decision`, `resolved-blocker`, preservar orden reciente, priorizar reglas y luego el resto reciente; devolver JSON válido y encabezado de no confianza, máximo 4000 bytes UTF-8 incluyendo encabezado, sin cortar caracteres ni objetos JSON; omitir registros enteros que no caben. Sin Git/scope o servidor: error explícito para herramienta/CLI; integraciones degradan sin bloquear.
- Instrumentar herramientas MCP incluida `memory_propose` y CLI de integración (`context`, `search`, `propose`), sin doble contar llamadas internas; `mem stats` presenta totales por agente/herramienta desde el inicio, sin afirmar filtro semanal. `MEM_AGENT` es etiqueta configurable no autenticada y no debe contener datos sensibles. Estadísticas locales best-effort: si fallan, avisar sin impedir búsquedas ni guardar; propuestas fallan cerradas.
- Conservar aislamiento de proyecto, general, límites, y advertencia de datos no confiables; no dar a datos recuperados autoridad sobre instrucciones.

## Verificación
`./verify` — aceptación final sin caché, desde raíz. Los tramos intermedios usan `VERIFY_RAPIDO=1 ./verify` (nivel 2) pues no hay `Comprobación rápida` declarada. Docker no se ha comprobado; si falla, documentar evidencia y detenerse.

## Condiciones de parada
Parar si falta decisión, se necesita salir del alcance, `verify` falla dos veces por la misma causa o las condiciones del entorno impiden avanzar. No tocar pruebas de aceptación existentes para debilitarlas. Registrar resultado, archivos y causa en Notas.

## Pasos

### Tramo 1 — Historia: contexto compartido y acotado
Como usuario quiero contexto de memoria reutilizable para recibir antecedentes sin múltiples consultas.
Dependencias: servidor HTTP existente. Contratos a conservar: `/v1/recent`, scope y autenticación. Rutas susceptibles: las de Alcance, no mover pruebas existentes. Ejemplo: 100 memorias con multibyte producen texto válido ≤4000 bytes.
Alcance: `src/context.ts`, `src/mcp/tools.ts`, `src/mem.ts`.
Archivos: `src/context.ts`, `src/mcp/tools.ts`, `src/mem.ts`.
CUANDO solicito contexto ENTONCES recibo reglas y decisiones/bloqueos recientes disponibles como datos no confiables (A1).
Aceptación:
- A1: CLI y MCP reales obtienen el mismo contexto, solo scope permitido, con JSON válido y máximo de bytes; probar servidor HTTP/SQLite real, datos multibyte, error y proyecto ajeno; esperar éxito y exclusión.
TODO:
- [ ] Crear `src/context.ts` con contrato común (A1). Comprobación: prueba UTF-8 y exclusión; esperar ≤4000 bytes.
- [ ] Conectar `memory_context` en `src/mcp/tools.ts` (A1). Comprobación: cliente MCP real; esperar resultado acotado.
- [ ] Conectar `mem context` en `src/mem.ts` (A1). Comprobación: CLI con servidor real; esperar mismo contenido.
- [ ] Añadir en `test/mcp.test.ts` pruebas con otro proyecto y límite multibyte (A1). Comprobación: ejecutar pruebas; esperar exclusión y fallo con límite alterado.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A1.
Handoff: mantener el algoritmo y ámbito común para inicio automático; registrar evidencia.

### Tramo 2 — Historia: propuestas locales confirmables
Como usuario quiero revisar propuestas antes de añadirlas al servidor para controlar qué se guarda.
Dependencias: tramo 1; HTTP existente. Contratos: guardado directo y API central sin cambios. Rutas: las de Alcance, pruebas existentes no se mueven. Ejemplo: propuesta persistente se confirma una vez; si servidor falla permanece pendiente.
Alcance: `src/local-state.ts`, `src/mcp/tools.ts`, `src/mem.ts`.
Archivos: `src/local-state.ts`, `src/mcp/tools.ts`, `src/mem.ts`.
CUANDO propongo hasta tres recuerdos ENTONCES quedan locales hasta confirmar o descartar (A2).
Aceptación:
- A2: recorrido MCP/CLI real demuestra persistencia, máximo tres, permisos, descartado, confirmación explícita, reintento, concurrencia y que búsqueda remota no ve pendientes; comprobar tests con HTTP/SQLite real y fallo remoto; esperar éxito sin pérdida ni duplicado.
TODO:
- [ ] Implementar propuestas en `src/local-state.ts` según Contrato común (A2). Comprobación: procesos concurrentes y permisos; esperar conservación y privacidad.
- [ ] Registrar `memory_propose` en `src/mcp/tools.ts` (A2). Comprobación: cliente MCP; esperar propuestas locales y rechazo de cuatro.
- [ ] Añadir `propose`, `proposals`, `discard`, `confirm` en `src/mem.ts` (A2). Comprobación: recorrido CLI con caída y reintento; esperar persistencia y un guardado.
- [ ] Añadir en `test/mcp.test.ts` pruebas de sensibilidad al guardado antes de confirmar (A2). Comprobación: fixture pendiente; esperar ausencia en búsqueda remota.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A2.
Handoff: las propuestas no son memorias centrales; confirmación es acción explícita, no automática.

### Tramo 3 — Historia: inicio automático y política segura
Como usuario quiero contexto en nuevas sesiones y propuestas sin guardado autónomo para conservar el control.
Dependencias: tramos 1–2. Contratos: hook SessionStart existente, extensión Pi existente, degradación silenciosa de contexto. Rutas: integraciones existentes no se mueven. Ejemplo: sesión con memoria recibe contexto no confiable y política de proponer.
Alcance: `integrations/recent-context.mjs`, `integrations/memory-policy.mjs`, `src/mcp/tools.ts`; pruebas y snippets.
Archivos: `integrations/recent-context.mjs`, `integrations/memory-policy.mjs`, `src/mcp/tools.ts`.
CUANDO abro sesión ENTONCES se entrega contexto automáticamente y se indica pedir confirmación al proponer (A3).
Aceptación:
- A3: hook Claude y SDK Pi con HTTP/SQLite real entregan contexto acotado; caída no bloquea; las cuatro descripciones MCP son disparadores, ninguna política promueve guardado automático; pruebas negativas detectan política vieja.
TODO:
- [ ] Adaptar `integrations/recent-context.mjs` a `mem context` (A3). Comprobación: pruebas de ambos arranques; esperar contexto y degradación.
- [ ] Actualizar `integrations/memory-policy.mjs` y snippets de instrucciones (A3). Comprobación: pruebas de política; esperar propuesta y espera de confirmación.
- [ ] Reescribir las cuatro descripciones en `src/mcp/tools.ts` (A3). Comprobación: lista MCP real; esperar disparadores y restricciones.
- [ ] Añadir en `test/agent-start.test.ts` pruebas sensibles a política anterior y fallo servidor (A3). Comprobación: suite de arranque; esperar detección y continuidad.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A3.
Handoff: el modelo simulado no demuestra uso autónomo en aplicaciones reales.

### Tramo 4 — Historia: instrucciones portables e identificación
Como usuario quiero instrucciones breves y configurar la identidad de cada agente para conservar compatibilidad.
Dependencias: tramos 1–3. Contratos: JSON/TOML de init parseable; no secretos en salida. Rutas: configuración y docs existentes no se mueven. Ejemplo: `mem init pi --instructions` imprime 3–5 líneas y `mem init pi` sigue parseable.
Alcance: `src/agent-config.ts`, `src/mem.ts`, `src/mcp/index.ts`.
Archivos: `src/agent-config.ts`, `src/mem.ts`, `src/mcp/index.ts`.
CUANDO genero instrucciones o configuración ENTONCES ambas son utilizables por separado (A4).
Aceptación:
- A4: cada formato se coteja con documentación vigente o se marca no verificado; pruebas parsean configuraciones y comprueban instrucciones, `chatgpt` y política compartida; compatibilidad real no se infiere del parseo.
TODO:
- [ ] Añadir instrucciones e identidad en `src/agent-config.ts` preservando formatos (A4). Comprobación: pruebas JSON/TOML y 3–5 líneas; esperar éxito.
- [ ] Añadir opción en `src/mem.ts` (A4). Comprobación: comandos para cada agente y `chatgpt`; esperar salida separada.
- [ ] Sincronizar instrucciones MCP en `src/mcp/index.ts` (A4). Comprobación: prueba de inicialización; esperar ausencia de guardado autónomo.
- [ ] Revisar y actualizar `docs/conectar-agentes.md`, `docs/inicio-agentes.md` y `docs/mcp.md` con fuentes oficiales, fecha y no verificados (A4). Comprobación: revisar enlaces y formatos; esperar límites explícitos.
- [ ] Añadir en `test/mem.test.ts` prueba negativa de salida mezclada (A4). Comprobación: parsear salida por defecto; esperar JSON/TOML válido.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0; cubre A4.
Handoff: no hay transporte MCP HTTP para ChatGPT dentro del alcance.

### Tramo 5 — Historia: estadísticas locales por agente
Como usuario quiero saber cuántas veces cada agente consultó y propuso memoria en este equipo para medir su uso.
Dependencias: tramos 1–4. Contratos: CLI/MCP existentes, operaciones funcionan si métricas fallan. Rutas: las de Alcance, pruebas no se mueven. Ejemplo: dos búsquedas Pi y una propuesta Claude aparecen en filas distintas.
Alcance: `src/local-state.ts`, `src/mcp/tools.ts`, `src/mem.ts`.
Archivos: `src/local-state.ts`, `src/mcp/tools.ts`, `src/mem.ts`.
CUANDO ejecuto `mem stats` ENTONCES veo conteos locales por agente y herramienta (A5).
Aceptación:
- A5: procesos concurrentes y reinicios conservan conteos exactos por agente/herramienta, incluyendo `desconocido`; fallo de métricas no bloquea búsqueda; pruebas garantizan ausencia de contenido y credenciales.
TODO:
- [ ] Añadir contadores seguros en `src/local-state.ts` (A5). Comprobación: procesos concurrentes; esperar suma exacta sin contenido.
- [ ] Instrumentar MCP en `src/mcp/tools.ts` (A5). Comprobación: llamadas reales de dos agentes; esperar filas separadas.
- [ ] Instrumentar CLI y añadir `stats` en `src/mem.ts` (A5). Comprobación: recorridos CLI y sin etiqueta; esperar totales y `desconocido`.
- [ ] Añadir en `test/mem.test.ts` pruebas negativas para doble conteo y fallo de almacén (A5). Comprobación: suite; esperar una cuenta por invocación y operación útil.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A1–A5 y regresiones.
Handoff: entregar evidencia por criterio; indicar que métricas son por equipo y desde inicio.

## Evidencia
Pendiente.

## Notas
- Revisor de planes: único aviso residual «supera 8192 bytes»; se conserva un documento para mantener juntos los contratos transversales y los cinco recorridos. La skill trata ese tamaño como referencia, no como límite obligatorio.
- `./verify` aún no ejecutado: corresponde a la construcción y aceptación, después de la aprobación.

---
estado: listo
rama: docs/direccion-producto
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Dirección de producto

## Objetivo
Actualizar el contexto vigente para orientar futuros cambios hacia una memoria central gobernada y accesible por MCP, diferenciando objetivos de capacidades implementadas.

## Exploración
El usuario proporcionó la nueva dirección, siete principios y la terminología «usuario». `docs/proyecto.md` conserva MCP y embeddings como fuera del alcance histórico; `README.md` describe correctamente su ausencia actual. `docs/inicio-agentes.md` usa un nombre propio en instrucciones de política. Las políticas ejecutables en `integrations/memory-policy.mjs` y snippets también lo usan: modificarlas requiere otro plan, no se afirma corregido aquí. El repositorio tiene un traslado preexistente en `cambios/hechos/readme-mvp/plan.md` que debe conservarse.

## Evaluación
Actualizar contexto y documentación de uso conserva evidencia histórica y hace explícita la dirección sin anticipar implementación. Alternativa: implementar MCP o modificar políticas ahora; excede el pedido documental y requiere planes separados. Se recomienda la actualización documental.

## Supuestos
El pedido comprende documentación vigente, no implementación de MCP, embeddings o gobernanza; si se amplía, requiere otro plan.

## Decisiones ya tomadas
- Una fuente central, Bearer en toda superficie, errores sin detalles internos, memorias como datos no confiables, prohibición de secretos y transcripciones completas, confirmación de reglas y scope general, búsqueda de proyecto con general sin otros proyectos y degradación a FTS5 son principios de dirección proporcionados por el usuario; no se presentan como capacidades ya verificadas.
- Ejecutor: constructor, porque el alcance, contexto, comprobaciones y límites son accesibles y no requiere credenciales ni producción.

## Decisiones
Ninguna.

## Validación
El usuario aprobó la dirección, el plan y la evidencia del cambio documental.

## Alcance
`docs/proyecto.md`, `README.md`, `docs/inicio-agentes.md`. Fuera de alcance: código, políticas ejecutables y snippets, planes históricos, cambios ajenos y operación de producción.

## Verificación
`git diff --check` y revisión de las tres rutas y de las afirmaciones contra el contexto y la evidencia existente. Cambio documental: no requiere Docker; registrar si no se ejecuta `./verify`.

## Condiciones de parada
Detenerse si se necesita modificar código, políticas ejecutables o documentación fuera del alcance, o si aparece una decisión de producto no resuelta.

## Pasos
### Tramo 1 — Historia: dirección de producto documentada
Como usuario quiero conocer la dirección y los principios de Memory-AI para orientar cambios sin confundirlos con funciones existentes.
Dependencias: ninguna.
Contratos a conservar: estado real del MVP, limitaciones existentes, instrucciones operativas y evidencia histórica.
Rutas susceptibles de cambio: las tres del alcance; no mover ni archivar rutas.
Ejemplo concreto del resultado esperado: MCP figura como dirección futura y el README sigue diciendo que actualmente no se incluye.
Alcance: documentación vigente; ningún archivo de producto ejecutable.
Archivos: `docs/proyecto.md`, `README.md`, `docs/inicio-agentes.md`.
CUANDO se consulte la documentación ENTONCES la dirección y los principios se distinguen de lo implementado (A1) y la política de uso emplea «usuario» (A2).
Aceptación:
- A1: los siete principios y objetivos MCP y gobernanza aparecen en `docs/proyecto.md`; README resume la dirección y conserva las limitaciones reales. Comprobar mediante lectura y `rg`; esperar distinción explícita entre objetivo y estado actual.
- A2: las instrucciones de política en `docs/inicio-agentes.md` usan «usuario» para quien confirma; comprobar con lectura y `rg`; esperar ausencia de nombres propios en esas instrucciones, sin alterar registros históricos o validaciones personales.
TODO:
- [x] Actualizar `docs/proyecto.md` con dirección, siete principios y alcance histórico de MCP/embeddings (A1). Comprobación: revisión del texto; esperar objetivos sin afirmar implementación.
- [x] Actualizar `./README.md` con dirección futura y gobernanza (A1). Comprobación: revisión del texto; esperar ausencia de promesas de funciones ya disponibles.
- [x] Actualizar `docs/inicio-agentes.md` en las instrucciones de política (A2). Comprobación: revisión de los pasajes de confirmación; esperar «usuario» sin cambiar su significado.
Verificación del tramo: `git diff --check` — nivel 1 documental; exit 0, complementado por revisión de A1 y A2.
Handoff: conservar el traslado preexistente y no editar las políticas ejecutables; señalar que su terminología sigue pendiente de un cambio separado.

## Evidencia
$ rg -n '^## Dirección actual de producto|^Principios para las capacidades nuevas:|^1\.|^7\.|^## Propósito y estructura|MCP y embeddings estaban fuera' docs/proyecto.md
3: ## Dirección actual de producto
6: Principios para las capacidades nuevas:
8: 1. El servidor central es la única fuente de datos; ningún cliente crea una base local.
14: 7. Toda capacidad nueva degrada sin romper: si no hay embeddings, se usa FTS5.
16: ## Propósito y estructura
64: - MCP y embeddings estaban fuera del alcance histórico; hoy MCP forma parte de la dirección futura y embeddings son una opción subordinada a la degradación a FTS5. Móviles, multiusuario, restauración/saneamiento y backups sintéticos siguen fuera de ese alcance; el backup real nocturno de S4 sí permanece.
exit 0
$ rg -n -C 2 'reglas y el scope general|Franco|usuario' docs/inicio-agentes.md
85: - Las reglas y el scope general requieren petición o confirmación explícita del usuario; nunca guardes reglas generales por iniciativa propia.
La búsqueda también encontró «Franco» en referencias operativas y de validación manual, que no forman parte de las instrucciones de política.
exit 0
$ git diff --check
Sin salida
exit 0
Revisión del diff: A1 distingue MCP como dirección futura del soporte actual; README conserva búsqueda léxica y ausencia actual de embeddings. A2 usa «usuario» en la instrucción de política. `git diff --check` pasó.
exit 0
$ rg -n 'Las reglas y el scope general requieren petición o confirmación explícita del usuario' docs/inicio-agentes.md
3:Las integraciones consultan `mem recent --limit 15` al iniciar la sesión y pasan las memorias al agente. Durante el trabajo, las instrucciones permiten consultar con `mem search` cuando un recuerdo ayude y guardar automáticamente decisiones, aprendizajes y bloqueos resueltos que sean hechos consolidados y útiles del proyecto. No guardan nada al iniciar. Las reglas y el scope general requieren petición o confirmación explícita del usuario. Las consultas de inicio fallan en silencio si falta configuración, Git, el cliente o el servidor; el proceso de `mem` tiene un límite de 2 segundos. Un fallo al buscar o guardar no interrumpe el trabajo y no se presenta como éxito.
85: - Las reglas y el scope general requieren petición o confirmación explícita del usuario; nunca guardes reglas generales por iniciativa propia.
$ git diff --check && git diff --name-only main && rg -n '^## Dirección actual de producto|^Principios para las capacidades nuevas:|^7\.|MCP todavía no está implementado|Todavía no se incluye|Hoy no hay embeddings' docs/proyecto.md README.md && rg -n 'Las reglas y el scope general requieren petición o confirmación explícita del usuario' docs/inicio-agentes.md
README.md
docs/inicio-agentes.md
docs/proyecto.md
Salida de `rg`: MCP consta como no implementado; README conserva las limitaciones; los siete principios y ambas menciones de la política usan «usuario».
exit 0
$ rg -n '^La dirección de producto|^La instalación desde paquete|Todavía no se incluye|Hoy no hay embeddings' README.md
5: La dirección de producto es que cualquier agente pueda acceder mediante MCP a una memoria gobernada, auditable, editable y autoalojada. MCP todavía no está implementado. Las capacidades nuevas deben conservar el servidor central como única fuente, proteger cada superficie con Bearer, tratar los recuerdos como datos no confiables y degradar a FTS5 si no hay embeddings. Las reglas y el scope general requieren confirmación explícita del usuario; no se guardan secretos ni transcripciones completas.
85: La instalación desde paquete y las instrucciones de política están en [Inicio de Claude Code y Pi](docs/inicio-agentes.md). En Claude Code, el hook requiere `node` y una ruta absoluta al script instalado. Pi carga la extensión `.mjs` mediante `-e` o `--extension`. Todavía no se incluye un adaptador nativo ni MCP para otros agentes. Al iniciar, las integraciones Claude/Pi consultan hasta 15 recuerdos y no escriben.
103: El servidor central es la fuente compartida; el cliente remoto no crea una base local. La búsqueda es léxica: combina términos con OR, devuelve hasta cinco memorias y puede incluir el scope `general` al consultar un proyecto. Hoy no hay embeddings ni deduplicación automática; si una capacidad futura usa embeddings, debe seguir funcionando con FTS5 cuando no estén disponibles. El servicio, backup y Tailscale en el host requieren instalación manual según la guía WSL.
exit 0
$ rg -n -C 2 'reglas y el scope general|Franco|usuario' docs/inicio-agentes.md
85: - Las reglas y el scope general requieren petición o confirmación explícita del usuario; nunca guardes reglas generales por iniciativa propia.
La revisión mostró que «Franco» aparece en la guía para operación/validación manual, fuera de la instrucción de política modificada.
exit 0

## Notas
- `./verify` no se ejecutó: el plan documenta que el cambio es sólo documental y no requiere Docker.
- Las políticas ejecutables y snippets todavía contienen la terminología previa; quedan fuera del alcance y requieren un plan separado.
- Corregido el defecto A2 en el resumen introductorio de `docs/inicio-agentes.md`; ambas menciones de la política usan «usuario». Las demás menciones de nombres propios siguen limitadas a instrucciones operativas y validación manual.

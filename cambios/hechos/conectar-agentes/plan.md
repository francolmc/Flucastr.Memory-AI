---
estado: listo
rama: feature/conectar-agentes
base: main
repos: [.]
ejecutor: constructor
tramo: 2
tipo: codigo
---
# Conectar agentes

## Objetivo
Configurar cinco agentes para acceder al servidor central por MCP, generar su configuración sin secretos y compartir una política neutral entre MCP y hooks.

## Exploración
- `package.json` ya publica `mem` y `memory-ai-mcp`; el SDK MCP está instalado. `src/mem.ts` implementa el cliente y `src/mcp/index.ts` mantiene instrucciones propias.
- `integrations/memory-policy.mjs` alimenta los hooks Claude y Pi, usa «usuario» y contiene instrucciones específicas de CLI. MCP necesita instrucciones adaptadas a sus herramientas, con las mismas normas.
- El usuario confirmó limitar la ausencia de nombres propios a políticas y textos de producto afectados, conservando la API y el historial existentes.
- Fuentes oficiales consultadas: [Claude Code](https://code.claude.com/docs/en/mcp), [Cursor](https://cursor.com/docs/mcp), [Codex](https://developers.openai.com/codex/mcp/), [Pi](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md) y [Claude Desktop](https://py.sdk.modelcontextprotocol.io/get-started/real-host/). Claude Code admite `${VAR}` en configuración de proyecto, Cursor `${env:VAR}` y Codex `env_vars`. Pi requiere versión compatible con MCP. En Desktop la herencia del entorno de una aplicación gráfica depende de plataforma y arranque; la interpolación de variables en JSON no está verificada.

## Evaluación
Una fuente compartida con adaptadores de presentación conserva las normas y evita pedir comandos CLI a un cliente MCP. Duplicar la política facilita divergencias. No se incorporan dependencias nuevas.

## Supuestos
- Los clientes que heredan entorno reciben `MEM_URL` y `MEM_TOKEN` del proceso padre; si el usuario necesita otro mecanismo cambia la documentación y su validación.
- Un mismo scope explícito permite comparar dos clientes MCP sin depender del directorio de trabajo; si se requiere scope automático, se necesitará cobertura adicional.

## Decisiones ya tomadas
- El usuario eligió la recomendación sobre nombres propios el 16-11-2026.
- Ejecutor: constructor, porque es funcionalidad nueva y la prueba de ejecutabilidad cubre requisitos, contexto, verificaciones y no requiere leer credenciales ni tocar producción.

## Decisiones
Las dudas menores se registran aquí; las decisiones de producto o alcance requieren volver a Exploración.

## Validación
El usuario confirmó el alcance de nombres propios; el plan completo aún espera su aprobación.

## Alcance
Dos tramos ordenados, una rama. Se permiten cambios en los archivos concretos de cada tramo, pruebas en `test/`, documentación en `docs/` y este plan. Mantener el comportamiento del servidor central, interfaces existentes, hooks y las cuatro herramientas MCP. No tocar historia, API del servidor, archivos de configuración del usuario, servicios, producción, `.env` ni credenciales; `.env.example` es legible. No instalar dependencias nuevas. La documentación debe distinguir las comprobaciones documentales de pruebas reales con aplicaciones instaladas.

## Verificación
`./verify` — aceptación final desde cero, con Docker; tiempo no medido, registrar duración real. Cada tramo incluye su comprobación. No ejecutar despliegues ni servicios de producción.

## Condiciones de parada
Detenerse si falla la misma comprobación dos veces, falta una decisión de alcance, se requiere tocar archivos fuera del alcance o no es posible cumplir una configuración sin secretos; registrar evidencia y alternativas sin inventar compatibilidad. Los procesos de prueba deben usar datos y credenciales sintéticos y limpiar sus registros.

## Pasos

### Tramo 1 — Historia: política común para los agentes
Como usuario quiero la misma política neutral en MCP y hooks para que las reglas sean coherentes.
Dependencias: servidor MCP y hooks existentes; Node y entorno de pruebas del proyecto.
Contratos a conservar: hooks best-effort, cuatro herramientas MCP y sus instrucciones de seguridad; confirmación explícita para reglas y scope general; memorias como datos no confiables; no guardar secretos ni transcripciones.
Rutas susceptibles de cambio: las tres rutas siguientes; no mover ni archivar. Las pruebas `test/mcp.test.ts` y las existentes de integraciones deben seguir ejecutándose.
Ejemplo concreto: con `MEM_USER_NAME=Persona de prueba`, MCP y ambos hooks nombran a Persona de prueba; sin variable usan «el usuario».
Alcance: hasta tres archivos de producto.
Archivos: `integrations/memory-policy.mjs`, `integrations/pi-memory.mjs`, `src/mcp/index.ts`.
CUANDO se inicia MCP o un hook ENTONCES se entrega la misma política neutral con el nombre configurado (A1).
Aceptación:
- A1: MCP, hook Claude y extensión Pi utilizan normas compartidas, nombre configurable y valor predeterminado; comprobar mediante pruebas de los recorridos reales con y sin variable.
- A2: herramientas MCP y hooks mantienen sus comportamientos previos, sin interpolar el nombre como instrucciones; comprobar pruebas de regresión y caso de nombre con caracteres de control o instrucciones.
TODO:
- [x] Refactorizar `integrations/memory-policy.mjs` para producir normas compartidas y presentación específica de CLI/MCP; tratar nombre como dato y usar «el usuario» si falta o está vacío (A1, A2). Comprobación: pruebas de política; esperar normas equivalentes y nombre inocuo.
- [x] Conectar `src/mcp/index.ts` a la fuente común en `instructions`, conservando sus herramientas (A1, A2). Comprobación: cliente MCP real lee instrucciones y lista herramientas; esperar política y cuatro herramientas existentes.
- [x] Pasar el entorno inyectado en `integrations/pi-memory.mjs` a la política; conservar el hook Claude existente (A1, A2). Comprobación: pruebas de ambos hooks con y sin variable; esperar nombre correcto y carga existente.
- [x] Actualizar pruebas en `test/mcp.test.ts` y las pruebas existentes de integraciones con valores sintéticos y comprobar sensibilidad mediante una mutación aislada que haga fallar un caso (A1, A2). Comprobación: suite de pruebas; esperar casos no vacíos y fallo de la mutación por el motivo previsto.
Verificación del tramo: `npm test` — nivel 1; exit 0; cubre A1 y A2 con recorridos reales existentes. Si faltan herramientas Linux, registrar el fallo y usar `VERIFY_RAPIDO=1 ./verify` nivel 2.
Handoff: registrar archivos, diff y pruebas; no iniciar el tramo 2 sin revisión del principal.

### Tramo 2 — Historia: configuración portable y memoria compartida
Como usuario quiero copiar o imprimir configuración para mi agente y recuperar las mismas memorias desde otro.
Dependencias: tramo 1 para política compartida; documentación oficial de los cinco clientes y servidor de prueba HTTP real con token sintético.
Contratos a conservar: `mem` sigue funcionando, ninguna salida contiene valores reales de variables, ningún archivo de configuración del usuario se escribe, y MCP accede solo al servidor central.
Rutas susceptibles de cambio: las rutas siguientes; no mover ni archivar. `test/mem.test.ts` y `test/mcp.test.ts` conservan sus recorridos existentes.
Ejemplo concreto: `mem init claude-code` imprime configuración pegable con referencias a variables, incluso si el token no está definido; un agente guarda una memoria y otro la busca en el mismo scope.
Alcance: hasta tres archivos de producto.
Archivos: `src/mem.ts`, `src/agent-config.ts` (nuevo, si se necesita), `docs/conectar-agentes.md`.
CUANDO el usuario solicita configuración ENTONCES recibe un bloque específico sin secretos ni escritura en disco (A3).
CUANDO dos clientes MCP usan el mismo servidor ENTONCES ambos acceden a la misma memoria en el mismo scope (A4).
Aceptación:
- A3: `mem init` admite `claude-code`, `cursor`, `codex`, `pi`, `claude-desktop`; imprime bloques válidos y referencias a entorno, nunca el valor de `MEM_TOKEN`; agente desconocido devuelve error y código distinto de cero. Verificar sintaxis contra documentación oficial, con valores sintéticos y salida parseable cuando aplique.
- A4: dos clientes MCP reales independientes usan servidor HTTP real, guardan, recuperan y eliminan un registro; no se usan mocks de API. Si no se dispone de aplicaciones reales, no afirmar que fueron probadas.
- A5: guía explica instalación, rutas y versiones comprobadas, variables y herencia del entorno, uso de `mem init`, diferencia hook/MCP; identifica explícitamente cualquier bloque o plataforma no verificado. Para Desktop no inventar interpolación: documentar método sin token en archivo solo si se comprueba; si no, marcarlo «no verificado» y detallar la limitación.
TODO:
- [x] Implementar `mem init` en `src/mem.ts` y ayuda, sin requerir conexión ni escribir archivos (A3). Comprobación: ejecutar para los cinco nombres y uno inválido; esperar salida y códigos especificados.
- [x] Añadir `src/agent-config.ts` si hace falta para generar bloques de sintaxis oficial y referencias a entorno sin interpolar valores secretos (A3). Comprobación: parsear bloques y probar token sintético distintivo; esperar ausencia del valor.
- [x] Crear `docs/conectar-agentes.md` con bloques correspondientes a la salida, instrucciones, fuentes y limitaciones verificadas (A3, A5). Comprobación: cotejar cada bloque con fuente oficial y comando generado; marcar no verificado cuando no se compruebe.
- [x] Ampliar pruebas `test/mem.test.ts` y `test/mcp.test.ts` con clientes y servidor HTTP reales independientes (A3, A4). Comprobación: búsqueda cruzada y limpieza con token sintético; esperar éxito y fallo con mutación aislada del scope.
- [x] Ejecutar `./verify` (duración no medida) y registrar resultado completo y duración en Evidencia (A3, A4, A5). Comprobación: exit 0.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A3, A4 y A5 junto con revisión de guía y fuentes.
Handoff: registrar archivos, resumen del diff, resultados y pasos de comprobación manual del usuario; no hacer commit.

## Evidencia
- Refactorización de política compartida y adaptadores CLI/MCP: pruebas de política con nombre sintético, valor predeterminado y caracteres de control; casos aprobados dentro de la suite indicada abajo.
- MCP: cliente MCP real recibió instrucciones compartidas y enumeró exactamente las cuatro herramientas; prueba de `test/mcp.test.ts` aprobada.
- Hooks: pruebas de recorrido Claude y Pi con nombre configurado, vacío/predeterminado y texto con salto de línea; aprobadas.
- Sensibilidad: mutación aislada de la política de Pi hizo fallar la aserción de política por el motivo esperado; restaurada antes de la suite final.
- `$ npm test` — la compilación y 60/65 pruebas pasaron; cinco pruebas de backup/operación no pudieron ejecutarse porque el host no tiene el binario `sqlite3` (`spawn sqlite3 ENOENT`). Exit 1. Se usó el fallback indicado por el plan.
- `$ VERIFY_RAPIDO=1 ./verify` — `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; suite Docker 65/65, CLI y doctor aprobados. Exit 0; duración aproximada 92 s.
- `$ git diff --check` — sin salida; exit 0.
- Revisión DEVUELTO, regresión corregida: la política compartida vuelve a indicar que se guarden automáticamente hechos consolidados útiles del proyecto y que, ante un fallo, se continúe trabajando e informe que no se guardó. Se conserva la consulta de solo lectura al iniciar sesión y la confirmación explícita para reglas y scope general.
- Pruebas de regresión añadidas en MCP, hook Claude y extensión Pi: comprueban ambas instrucciones en los recorridos reales.
- `$ npm test` — compilación aprobada; los recorridos de política y MCP pasaron. La suite completa termina con seis fallos de backup/operación porque falta `sqlite3` en el host. Exit 1.
- `$ node --test dist/test/agent-start.test.js dist/test/mcp.test.js dist/test/pi-context.test.js` — 11/11 pruebas pasaron, incluidas las aserciones de política compartida y los recorridos MCP/Claude/Pi con clientes y servidor reales. Exit 0.
- `$ git diff --check` — sin salida; exit 0.
- Reanudación de revisión DEVUELTO: tras confirmar el principal que no había contenedores activos, se ejecutó `$ VERIFY_RAPIDO=1 ./verify` — suite 65/65, `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; CLI y doctor aprobados. Exit 0; duración aproximada 117 s.
- `$ npm run build && node --input-type=module -e 'import {spawnSync} from "node:child_process"; const agents=["claude-code","cursor","codex","pi","claude-desktop"]; for (const a of agents) { const r=spawnSync(process.execPath,["dist/src/mem.js","init",a],{encoding:"utf8",env:{...process.env,MEM_TOKEN:"synthetic-distinctive-token"}}); if (r.status!==0 || r.stdout.includes("synthetic-distinctive-token")) process.exitCode=1; console.log(`${a}: exit ${r.status}`); } const bad=spawnSync(process.execPath,["dist/src/mem.js","init","unknown-agent"],{encoding:"utf8"}); console.log(`unknown: exit ${bad.status}, ${bad.stderr.trim()}`); if (bad.status===0 || !bad.stderr.includes("agente no reconocido")) process.exitCode=1;'` — build aprobado; los cinco agentes imprimieron configuración sin token y terminaron en 0; agente desconocido dio error claro y exit 2. Exit 0.
- `$ npm run build && node --test dist/test/mem.test.js` — configuración JSON parseable para Claude Code, Cursor, Pi y Desktop; Codex tiene bloque TOML y reenvío por `env_vars`; el token sintético no aparece. Prueba del cliente mem y servidor real: 1/1 aprobada. Exit 0.
- `$ npm run build && node --input-type=module -e '...cotejo de docs/conectar-agentes.md con agentConfig...'` — los cinco bloques coinciden exactamente con `mem init`; JSON de Claude Code, Cursor, Pi y Desktop parseable; Codex TOML cotejado; Desktop marcado «no verificado». Exit 0.
- `$ npm run build && node --test dist/test/mem.test.js dist/test/mcp.test.js` — 10/10 pruebas aprobadas; dos procesos MCP stdio independientes guardaron, encontraron y eliminaron la misma memoria mediante el HTTP real y SQLite real; token sintético. Exit 0.
- Mutación aislada en `test/mcp.test.ts`: cambiar el scope de búsqueda de otro proyecto por el scope actual hizo fallar la aserción `otherProject.isError === true` (actual `undefined`); cambio restaurado. Suite restaurada: 10/10 pruebas aprobadas, exit 0.
- `$ ./verify` — Docker construyó desde cero, suite completa 66/66, CLI `--help` y `doctor` aprobados; `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`. Exit 0; duración medida: 150,4 s.

## Notas
- Punto de control del tramo 1: archivos `integrations/memory-policy.mjs`, `integrations/pi-memory.mjs`, `src/mcp/index.ts` y sus tres archivos de pruebas; diff de seis archivos: 91 inserciones y 23 eliminaciones. `VERIFY_RAPIDO=1 ./verify` pasó antes de la revisión; no se inició el tramo 2.
- `npm test` no queda verificado en el host por ausencia de `sqlite3`; el fallback Docker del plan sí pasó la suite completa.
- Revisión DEVUELTO atendida y verificada tras la reanudación autorizada; el tramo 1 queda listo para revisión del principal. No se inició el tramo 2.

- Revisión DEVUELTO atendida: se restauraron ambas instrucciones y se añadieron regresiones para MCP, Claude y Pi. El fallback Docker pasó tras reanudarse el trabajo con los recursos disponibles.

- Reanudación: `git status` muestra seis archivos modificados y plan nuevo; `git diff --stat`: 91 inserciones, 23 eliminaciones. No aparecen contenedores del proyecto de verify en `docker ps`; repetir la verificación pendiente.

- Revisión principal tramo 1: A1 y A2 cumplidos; política compartida conectada a MCP y hooks, regresiones revisadas. `VERIFY_RAPIDO=1 ./verify`: 65/65 y recorrido integrado, exit 0. APROBADO.
- Tramo 2: documentación y generador cotejados contra las fuentes oficiales enlazadas. Claude Desktop sigue «no verificado»; no se probaron aplicaciones instaladas.
- Archivos del tramo 2: `src/mem.ts`, `src/agent-config.ts`, `docs/conectar-agentes.md`, `test/mem.test.ts` y `test/mcp.test.ts`; se agregó `mem init` para cinco clientes, guía de configuración/límites y recorrido MCP entre dos clientes contra el backend HTTP+SQLite real.
- Validación manual de Franco pendiente: disponer `MEM_URL` y `MEM_TOKEN` al proceso de cada agente, pegar los bloques de Claude Code/Cursor/Codex/Pi y comprobar conexión real, herencia de entorno y memoria compartida; para Claude Desktop verificar primero el método admitido de inyección segura de variables antes de configurar.

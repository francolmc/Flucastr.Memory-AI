---
estado: listo
rama: feature/mcp-delgado
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# MCP delgado por stdio

## Objetivo
Permitir que clientes MCP usen la memoria central mediante cuatro herramientas y reciban la política de uso, sin acceso local a SQLite.

## Exploración
- `src/http-server.ts` ofrece POST autenticado `/v1/search`, `/v1/memories`, `/v1/recent` y `/v1/forget`; `src/memory.ts` incluye general en búsquedas y recientes de proyecto. La API acepta guardados sensibles sin transportar confirmación: MCP debe comprobarla antes de llamar.
- `src/mem.ts` deriva el scope de la raíz Git del cwd. `src/http-client.ts` tiene timeout de 15 s y no distingue autenticación ni colisión.
- `integrations/memory-policy.mjs` define la política vigente; adaptarla a herramientas MCP. `package.json` publica solo el binario `mem`.
- SDK oficial `@modelcontextprotocol/sdk` 1.32.2, MIT, ofrece servidor y cliente; tiene dependencias transitivas. 1.x está en mantenimiento; v2 usa paquetes separados. Fuente: https://www.npmjs.com/package/%40modelcontextprotocol/sdk.
- Alternativa sin dependencia: implementar JSON-RPC, MCP y validación con Node; aumenta código y riesgo de incompatibilidad.
- Se omite evaluación adicional: alcance definido por el usuario.

## Evaluación
El SDK reduce mantenimiento; cuesta dependencias transitivas y usa versión en mantenimiento.

## Supuestos
- Scope opcional se resuelve como `mem`: raíz Git del cwd del proceso; sin Git ni scope válido, la herramienta pide scope explícito. Si se requiere contexto diferente por cliente, cambia la configuración.
- `memory_recent` acepta scope opcional y límite opcional de 1 a 15; devuelve proyecto más general como la API existente. Si se quiere otro límite cambia el esquema.
- `memory_save` requiere scope explícito; genera UUID, fecha UTC `YYYY-MM-DD` y origin `memory-ai-mcp`. Un id repetido con datos diferentes informa 409; mismo contenido sigue la semántica actual de la API.

## Decisiones ya tomadas
- Transporte stdio; solo el servidor central guarda datos. Confirmación `confirmed: true` obligatoria para cualquier `rule` o scope `general`.
- Ejecutor: constructor, porque requisitos, contexto, pruebas y prerrequisitos son accesibles y no se requieren credenciales reales ni despliegue.

## Decisiones
Ninguna.

## Validación
Aprobados por el usuario el plan y `@modelcontextprotocol/sdk@1.32.2` con sus dependencias transitivas.

## Alcance
`src/mcp/`, `src/http-client.ts`, `package.json`, `package-lock.json`, pruebas en `test/mcp.test.ts` y guía de configuración en `docs/`. Cambiar `verify` solo si es imprescindible para ejecutar la prueba real en el flujo existente. Sin cambios en servidor central, esquema SQLite, hooks, MCP HTTP/SSE, embeddings, servicios ni producción. Pruebas con token sintético; sin leer credenciales.

## Verificación
`./verify` — instalación desde lock, compilación, pruebas de cliente MCP real, servidor HTTP y SQLite temporal; exit 0. La prueba nueva se integra en `test/*.test.ts` y debe ejecutarse en esta corrida.

## Condiciones de parada
Detenerse si una causa falla dos veces, exige salir del alcance o una decisión del usuario; registrar evidencia. No imprimir tokens ni rutas internas. Si se requiere otra dependencia directa, proponer versión, licencia y alternativa y esperar aprobación.

## Pasos
### Tramo 1 — Historia: memoria disponible por MCP
Como usuario quiero conectar un cliente MCP y usar memoria central para recordar entre sesiones.
Dependencias: Node >=24.22.1 <25, Git, Docker operativo, aprobación del SDK y acceso al registro npm; HTTP y SQLite temporal aislados para pruebas.
Contratos a conservar: HTTP existente, Bearer, aislamiento de scope, no guardar secretos ni transcripciones, confirmación explícita y recuperación tratada como datos no confiables.
Rutas susceptibles de cambio: `src/mcp/`, `src/http-client.ts`, `package.json`, `package-lock.json`, `test/`, `docs/` y, solo si es imprescindible, `verify`. No mover ni debilitar pruebas existentes.
Ejemplo concreto del resultado esperado: cliente stdio lista cuatro herramientas, guarda un aprendizaje, lo encuentra y elimina; una regla sin `confirmed: true` no llega al servidor.
Alcance: adaptador `src/mcp/`, transporte `src/http-client.ts`, manifiestos y lock; documentación y pruebas del recorrido.
Archivos: `src/mcp/index.ts`, `src/http-client.ts`, `package.json` (y lock asociado).
CUANDO se conecta ENTONCES recibe política y cuatro esquemas cerrados (A1).
CUANDO usa herramientas ENTONCES respeta autenticación, scope, confirmación y datos no confiables (A2).
CUANDO falla una operación ENTONCES recibe error útil y seguro sin bloqueo (A3).
CUANDO instala el paquete ENTONCES puede configurar el binario y usarlo (A4).
Aceptación:
- A1: cliente SDK real por stdio comprueba inicialización con `instructions`, cuatro nombres exactos y esquemas `additionalProperties: false`; entradas inválidas y campos extra se rechazan.
- A2: servidor HTTP real con SQLite temporal y token sintético; guardar, buscar, recientes y olvidar; búsqueda con resultados no vacíos proyecto A y general excluye proyecto B y contiene como máximo cinco con id, tipo, scope, fecha y texto marcado como datos no confiables; regla o general sin confirmación no guarda, ambos con confirmación guardan; sin scope usar Git o error explícito.
- A3: proceso MCP arranca sin token; cada herramienta devuelve error claro para token ausente y para 401 real; timeout acotado ante endpoint que acepta conexión pero no responde; colisión 409 clara; ninguna salida revela token o rutas internas.
- A4: `npm pack` e instalación temporal exponen `memory-ai-mcp`; guía incluye configuración stdio reproducible para clientes, `MEM_URL`, `MEM_TOKEN`, resolución de scope y límites de confirmación; sin afirmar compatibilidad de clientes no probados.
TODO:
- [x] Añadir `@modelcontextprotocol/sdk@1.32.2` a `package.json` y actualizar `package-lock.json` tras aprobación. Comprobación: instalación desde lock y versión fijada.
- [x] Adaptar `src/http-client.ts` para distinguir 401, 409 y timeout con errores seguros, manteniendo compatibilidad de `mem`. Comprobación: pruebas HTTP existentes y nuevas.
- [x] Crear binario stdio en `src/mcp/index.ts` con SDK, cuatro esquemas cerrados y `instructions` que adapten la política vigente. Comprobación: inicialización y listado con cliente SDK real.
- [x] Implementar en `src/mcp/index.ts` resolución de scope, creación de metadatos y acceso HTTP. Comprobación: cuatro operaciones contra servidor real y aislamiento de proyectos.
- [x] Exigir en `src/mcp/index.ts` confirmación explícita antes de guardar reglas o scope general. Comprobación: ausencia de escritura y éxito con `confirmed: true`.
- [x] Marcar resultados recuperados como datos no confiables en `src/mcp/index.ts`. Comprobación: campos, máximo cinco y política recibida por cliente.
- [x] Añadir en `./package.json` el binario memory-ai-mcp. Comprobación: instalación temporal desde paquete y ejecución stdio.
- [x] Añadir en `test/mcp.test.ts` cliente MCP real y servidor HTTP/SQLite aislado para A1–A4, incluyendo token ausente/inválido, timeout, 409 y entradas inválidas. Comprobación: ejecutar pruebas y verificar casos no vacíos.
- [x] Comprobar sensibilidad de la prueba en `test/mcp.test.ts` con una mutación temporal aislada del aislamiento de scope o confirmación. Comprobación: esperar fallo por el criterio, restaurar y registrar evidencia.
- [x] Documentar en `docs/mcp.md` configuración reproducible y uso de las cuatro herramientas. Comprobación: que comandos y rutas corresponden al paquete.
- [x] Ejecutar `./verify` y registrar resultado y duración. Comprobación: exit 0.
Verificación del tramo: `./verify` — nivel 3, exit 0; cubre A1–A4.
Handoff: entregar evidencia de cliente real, empaquetado, sensibilidad y verificación; usuario revisa configuración y prueba en sus agentes.

## Evidencia
$ `npm install --save-exact @modelcontextprotocol/sdk@1.32.2`
added 87 packages, and audited 212 packages in 6s
found 0 vulnerabilities
exit 0

$ `node -e 'console.log(JSON.parse(require("node:fs").readFileSync("package.json", "utf8")).bin["memory-ai-mcp"])'`
dist/src/mcp/index.js
exit 0

$ `npm run build && node --test dist/test/mcp.test.js` (mutación temporal: confirmar si `confirmed === true`)
✖ sensitive saves require confirmed true and same-id collisions explain 409
ℹ fail 2
exit 1

$ `npm run build && node --test dist/test/mcp.test.js` (mutación restaurada)
ℹ pass 6
ℹ fail 0
exit 0

$ `npm run build && node --test dist/test/mcp.test.js`
ℹ pass 6
ℹ fail 0
ℹ duration_ms 16376.867234
exit 0

$ `npm run build && npm pack --pack-destination /tmp/mcp-pack-check >/dev/null && npm install --prefix /tmp/mcp-pack-check/install /tmp/mcp-pack-check/flucastr-memory-ai-0.1.0.tgz --silent && node --input-type=module -e 'import { Client } from "@modelcontextprotocol/sdk/client/index.js"; import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"; const client=new Client({name:"packed-check",version:"1"}); const t=new StdioClientTransport({command:"/tmp/mcp-pack-check/install/node_modules/.bin/memory-ai-mcp",args:[],env:{PATH:process.env.PATH??""}}); await client.connect(t); const tools=await client.listTools(); console.log("tools="+tools.tools.map(tool=>tool.name).join(",")); await client.close();'`
tools=memory_search,memory_save,memory_recent,memory_forget
exit 0

$ `npm run build && node --test dist/test/mcp.test.js`
✔ search/save/recent/forget isolate project scope and mark memories untrusted
ℹ pass 6
ℹ fail 0
exit 0

$ `npm run build && node --test dist/test/mcp.test.js`
✔ sensitive saves require confirmed true and same-id collisions explain 409
ℹ pass 6
ℹ fail 0
exit 0

$ `npm run build && node --test dist/test/mcp.test.js`
✔ search/save/recent/forget isolate project scope and mark memories untrusted
ℹ pass 6
ℹ fail 0
exit 0

$ `npm run build && node --test dist/test/mcp.test.js`
✔ real client receives exact closed tools and instructions; rejects extra/invalid inputs
ℹ pass 6
ℹ fail 0
exit 0

$ `npm run build && node --test dist/test/http-client-route.test.js dist/test/remote-client-security.test.js`
ℹ tests 10
ℹ pass 10
ℹ fail 0
ℹ duration_ms 15716.482484
exit 0

$ `npm run build && node --test dist/test/pi-context.test.js dist/test/memory-actions.test.js`
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ duration_ms 26558.17492
exit 0. La prueba MCP crea un repositorio Git temporal independiente del checkout y las instalaciones temporales del paquete pueden resolver dependencias externas.

$ `npm run build && node --test dist/test/mcp.test.js dist/test/pi-context.test.js dist/test/memory-actions.test.js`
ℹ tests 8
ℹ pass 8
ℹ fail 0
ℹ duration_ms 22976.74172
exit 0. La prueba MCP crea un repositorio Git temporal independiente de `.git` del checkout, y las instalaciones temporales del paquete resuelven la dependencia publicada durante `./verify`.

$ `npm ls @modelcontextprotocol/sdk --depth=0`
└── @modelcontextprotocol/sdk@1.32.2
exit 0

$ `./verify`
ℹ tests 63
ℹ pass 63
ℹ fail 0
CLI help y doctor correctos; LECTURA OK; ESCRITURA OK; LIMPIEZA DE REGISTRO OK; MEM BIN PACKAGE OK; VERIFY OK.
exit 0; duración 171.7 s.

## Notas
- Revisión DEVUELTO: restaurar el comportamiento offline de las pruebas existentes `test/memory-actions.test.ts` y `test/pi-context.test.ts`; quitar `--offline` debilita la aceptación existente y contradice el alcance. Resolver la disponibilidad de dependencias sin depender de red en esas instalaciones y demostrarlo con las pruebas y `./verify`.
- Revisión DEVUELTO: `src/mcp/index.ts` (`readScope`) exige Git incluso con scope de proyecto explícito; cumplir el plan para directorios sin Git y cubrir búsqueda y recientes con cliente MCP real, manteniendo el aislamiento de proyectos.
- Revisión DEVUELTO: `src/mcp/index.ts` (`validArgs`) convierte `type` con `String`, aceptando valores no string como arrays; validar el tipo estricto y cubrir el rechazo con cliente MCP real.
- Primer `./verify`: exit 1 en instalación offline del paquete Pi porque el `HOME` temporal también creaba una caché npm vacía para la dependencia MCP. Se probó pasar la caché npm preexistente a las instalaciones temporales; no bastó dentro del flujo de Docker. La solución final permite que esas instalaciones resuelvan la dependencia publicada; comprobación focalizada: 2/2 y luego 8/8.
- Segundo `./verify`: exit 1: dentro de Docker el checkout no contiene `.git`, por lo que las pruebas MCP no encontraban scope de proyecto; además, la caché npm de `npm ci` no conserva metadatos suficientes para la instalación offline del SDK. La prueba MCP ahora crea un repo temporal; las instalaciones temporales permiten resolver la dependencia publicada. Comprobación focalizada: 8/8.
- Punto de control del tramo 1: archivos de implementación, pruebas y documentación en el alcance completados; `./verify` pasó (63/63, 171.7 s), incluyendo A1–A4 y empaquetado del binario.
- DEVUELTO corregido: se restauró `--offline` en `test/memory-actions.test.ts` y `test/pi-context.test.ts`; antes de instalar el tarball temporal, ambas pruebas copian `package.json` y `package-lock.json` al prefijo para que npm resuelva la dependencia sin acceso a red. `npm run build && node --test dist/test/mcp.test.js dist/test/memory-actions.test.js dist/test/pi-context.test.js`: 9/9, exit 0.
- DEVUELTO corregido: `readScope` admite un scope de proyecto explícito válido cuando no hay Git y sigue restringiéndolo al scope Git actual cuando existe; la prueba con cliente MCP real verifica búsqueda y recientes desde un directorio no Git. En esa misma ejecución, cliente MCP real verifica que `memory_save` rechaza `type` no string (incluido array) sin coerción.
- Verificación final tras las correcciones: `./verify`, suite completa 64/64, exit 0; CLI help y doctor correctos; LECTURA OK, ESCRITURA OK, LIMPIEZA DE REGISTRO OK, VERIFY OK y MEM BIN PACKAGE OK.

# task-04 — Implementar entrada CLI HTTPS sin SQLite cliente
repo: Flucastr.Memory-AI   depende_de: task-03   estado: cancelada

## Descripción
Construir una entrada CLI remota separada de la CLI local para guardar y buscar por F03. Verificar exclusivamente con fixtures sintéticos locales tras aprobación propia; esto no entrega Mac ni central remota.

## Contexto
Leer src/cli.ts runCli/options, src/http-server.ts startLocalServer y rutas /v1/memories y /v1/search, src/http-auth.ts validate; test/http-server.test.ts y test/f03-tls.ts createEphemeralTls; test/response.test.ts. Tocar solo archivos nuevos src/remote-cli.ts, src/http-client.ts y test/remote-cli.test.ts. tsconfig.json incluye src/test sin editarlo. Build/tests: no ejecutado, inferido de package.json; dependencias ausentes.
- Tocar: `src/remote-cli.ts`, `src/http-client.ts`, `test/remote-cli.test.ts`
- Fuente: definitions/PROJECT.md «Dirección central actualizada — confirmación y presupuesto aprobados para planificar»
- Referencia: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»
Leer solo Notas de task-03; si no contienen evidencia habilitante suficiente, detener la ejecución dependiente.

## Decisiones ya tomadas
Leer `features/F05-claude-code-fts5/refinado.md` §§Continuación autorizada para planificar — decisiones 1=A y 2=A e Inspección de continuación — evidencia y límite. Decisiones confirmadas, no supuestos: F03 en 127.0.0.1, reenvío restringido condicionado y CA privada humana; HTTPS validado/auth F03, central única y sin DB cliente. Si inviable, parar y consultar. Sin certificados públicos, CT inferido, Funnel, TLS inseguro ni alternativa automática. Atlas/Birch e identidad compartida permanecen; acciones protegidas cerradas por HTTP.
Cada A/B conserva una ronda, un lote acotado y una reverificación globales; subdividir tareas no amplía topes. R requiere presupuesto y permisos propios. Documentación no es evidencia funcional. Esta tarea es borrador: el encargo actual solo autoriza planificar.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Ejecutor constructor, permiso futuro explícito de implementación y tests HTTPS loopback sintéticos. Fuera de alcance: editar CLI local/server/auth, abrir DB en cliente, provisioning, Mac, administración, sustitución/conflicto por CLI remota y red externa.

## Pasos
1. En http-client.ts usar node:https, POST JSON a rutas F03 exactas; URL HTTPS de origen sin usuario/password/query/fragment/path adicional, sin redirecciones, timeout 15000 ms y sin reintentos de escritura. CA PEM explícita y verificación SAN/cadena nativa obligatoria.
2. En remote-cli.ts crear entrada asíncrona independiente: --help; save --url ORIGIN --ca PATH --token-file PATH --input PATH; search --url ORIGIN --ca PATH --token-file PATH --scope SCOPE --query TEXT. Rechazar opciones extra/duplicadas, --db y flags administrativos antes de conectar. Token en archivo humano externo: nunca argumento con valor secreto ni stdout/log.
3. Enviar save como {memory: objeto cerrado de seis strings}; search como {scope,query}. Éxito stdout cuerpo JSON completo con salto final; search máximo cinco recuerdos y 4000 bytes UTF-8 completos, rechazar respuestas inválidas/sobredimensionadas sin truncar. Código 0 éxito, 2 uso inválido, 1 TLS/red/HTTP/error; stderr genérico sin payload, rutas sensibles ni token.
4. En remote-cli.test.ts probar procesos separados y fixture HTTPS sintético con CA efímera existente, trust/SAN incorrectos, 401/403, conexión fallida, timeout, redirect rechazado, idempotencia/colisión y scopes con servidor F03; comprobar cero importaciones de index/memory/node:sqlite en entrada y cliente, y ningún archivo DB cliente.

## Criterios de aceptación
1. Help y validación no cargan SQLite ni contactan servidor (test por proceso).
2. Guardar/buscar usan únicamente contratos F03 y no imprimen secreto en ningún error (tests con marcador sintético).
3. TLS no confiable/SAN incorrecto y redirects fallan cerrados (tests).
4. Pruebas sintéticas verifican límites completos, errores, identidad y scopes sin ampliar permisos.
5. Regresiones locales siguen pasando, sin atribuir evidencia Mac/remota.

## Verificación
No ejecutado, inferido: `npm run typecheck`, `npm run build`, `node --test dist/test/remote-cli.test.js`, `npm run verify`; requieren herramientas task-03 y permiso de tests locales. Esperado 0. Build genera dist: no ejecutar en esta planificación. `node dist/src/remote-cli.js --help` futuro, no ejecutado, inferido: muestra comandos anteriores sin DB ni red.

## Evidencia

Intento 1: `npm run typecheck` y `npm run build` exit 0. `node --test dist/test/remote-cli.test.js` falló: uso inválido devolvió 1 en vez de 2; `npm run verify` no llegó a ejecutarse por `&&`.

Intento 2: typecheck y build exit 0. Test remoto local falló por timeout, dado que `spawnSync` bloqueaba el event loop del fixture HTTPS; `npm run verify` tampoco llegó a ejecutarse. El test se corrigió luego a procesos asíncronos, pero no se corrió una tercera pasada.

Todo fue local y sintético. Sin acceso remoto, datos reales ni cambios de infraestructura.

Autorización explícita de Franco: una única pasada adicional de `npm run typecheck`, `npm run build` y `node --test dist/test/remote-cli.test.js`, sin correcciones ni ampliación de alcance. Cambio spawnSync→async constatado en el test.

```text
$ npm run typecheck
> flucastr-memory-ai@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit
COMMAND_EXIT=0
exit 0
```

```text
$ npm run build
> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json
COMMAND_EXIT=0
exit 0
```

```text
$ node --test dist/test/remote-cli.test.js
TAP version 13
# Subtest: remote CLI uses authenticated HTTPS loopback F03 without loading local CLI/SQLite
not ok 1 - remote CLI uses authenticated HTTPS loopback F03 without loading local CLI/SQLite
  error: Remote operation failed.\n\n1 !== 0
  code: ERR_ASSERTION
  expected: 0
  actual: 1
  location: dist/test/remote-cli.test.js:34:16
# tests 1
# pass 0
# fail 1
COMMAND_EXIT=1
exit 1
```

La pasada autorizada terminó sin timeout; la prueba falló en la aserción del test por comando remoto con error genérico y código 1 donde esperaba 0 (línea dist/test/remote-cli.test.js:34). Sin correcciones ni relanzamiento.

## Notas

Cancelada: motivo=otra — Cierre por decisión explícita de Franco; entrega incompleta y evidencia conservada.

Implementación parcial en los tres archivos autorizados. Test de proceso corregido a ejecución asíncrona. Autorización explícita anotada y consumida. Historial previo conservado. La única pasada adicional tuvo typecheck/build exit 0 y prueba remota fallida (assertion en línea 34, esperaba código 0 y obtuvo 1); detener sin corregir ni repetir. Sin cambios de implementación/test en esta ejecución.
Registro: n=2; herramienta=pi; modo=normal; intentos=3; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2

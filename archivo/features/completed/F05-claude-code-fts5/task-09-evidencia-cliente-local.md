# task-09 — Completar evidencia local del cliente
repo: Flucastr.Memory-AI   depende_de: ninguna   estado: cancelada

## Autorización
Franco aprobó en conversación el lote de pruebas locales: una pasada ampliada y, solo si pasa, una pasada global. Parar ante fallo, sin corregir implementación ni repetir.

## Contexto
src/http-client.ts, src/remote-cli.ts, test/remote-cli.test.ts, test/http-client-route.test.ts, test/f03-tls.ts, src/http-server.ts y package.json.

## Alcance
Solo tests sintéticos HTTPS loopback y documentación. Sin cambios a src, Mac, red externa, infraestructura, commit ni cierre de F05.

## Pasos
1. Añadir pruebas de CA/SAN, redirect real, errores HTTP/red/timeout, límites/respuestas, opciones/secretos, imports/DB e idempotencia/colisión/scopes.
2. Una pasada ampliada; ante fallo detenerse sin correcciones.
3. Solo si pasa, una pasada global.
4. Documentar evidencia y pendientes sin declarar entrega remota.

## Criterios de aceptación
Todas las pruebas ampliadas y verify pasan. Si falla algo, conservar evidencia y bloquear sin modificar implementación.

## Verificación
```sh
npm run typecheck && npm run build && node --test dist/test/http-client-route.test.js dist/test/remote-cli.test.js dist/test/remote-client-security.test.js
npm run verify
```
Segundo comando condicionado al éxito del primero.

## Evidencia
```text
$ npm run typecheck && npm run build && node --test dist/test/http-client-route.test.js dist/test/remote-cli.test.js dist/test/remote-client-security.test.js
> flucastr-memory-ai@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit

test/remote-client-security.test.ts(21,45): error TS2345: Argument of type 'Duplex' is not assignable to parameter of type 'Socket'.
  Type 'Duplex' is missing the following properties from type 'Socket': destroySoon, connect, resetAndDestroy, setTimeout, and 15 more.
test/remote-client-security.test.ts(21,81): error TS2345: Argument of type 'Duplex' is not assignable to parameter of type 'Socket'.
  Type 'Duplex' is missing the following properties from type 'Socket': destroySoon, connect, resetAndDestroy, setTimeout, and 15 more.
exit 2
```
Build y tests no ejecutados por &&. `npm run verify` no ejecutado: condición de éxito no cumplida.

### Ronda adicional autorizada por Franco
Corrección exclusiva de tipado Socket→Duplex en el fixture, sin cambios a src.
```text
$ npm run typecheck && npm run build && node --test dist/test/http-client-route.test.js dist/test/remote-cli.test.js dist/test/remote-client-security.test.js
> tsc -p tsconfig.json --noEmit
> tsc -p tsconfig.json
ok 1 - postF03 sends both exact routes over verified HTTPS
ok 2 - remote CLI uses authenticated HTTPS loopback F03 without loading local CLI/SQLite
ok - untrusted CA rejected
not ok - incorrect SAN rejected
  error: Missing expected rejection.
  code: ERR_ASSERTION
ok - actual redirects not followed; no write retries
ok - 401 and 403 fail without leaking token or response
ok - invalid and oversized responses fail closed
ok - invalid options do not connect or leak secrets
ok - help does not load SQLite or local entry and creates no DB
ok - idle request times out without retries
ok - connection failure is generic
not ok 3 - remote client security matrix (synthetic loopback only)
# tests 12
# pass 10
# fail 2
exit 1
```
Los dos fallos contabilizan el subtest SAN y su grupo padre, no dos causas distintas. Typecheck/build pasaron. Verify no ejecutado por condición incumplida. El test SAN esperaba rechazo al usar localhost con certificado SAN IP:127.0.0.1, pero la operación resolvió; causa no investigada ni atribuida aún al cliente o fixture. Sin correcciones/repetición.

## Notas

Cancelada: motivo=otra — Cierre por decisión explícita de Franco; entrega incompleta y evidencia conservada.
Una única pasada por comando autorizada. Sin cambios de rama.
Entorno exit 0; aviso: la tarea no declara Requiere.
Añadida matriz sintética y ampliado test remoto con idempotencia/colisión/scopes. Sin cambios a src. Primera pasada detenida en typecheck por defecto del test nuevo: colección de sockets tipada Socket en vez de Duplex. Ninguna prueba nueva ejecutada; cobertura aún no demostrada. Sin corrección ni repetición por límite explícito. Incluso corregido el tipado, podrían aparecer otros fallos: no se presume éxito.
Bloqueo: tipo=otra; falta=corregir tipado del fixture y autorizar nueva verificación
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=falla; huecos=0; resultado=bloqueada; causa=otra
Nueva autorización explícita: corregir únicamente tipado del fixture y una pasada ampliada; global condicionado al éxito. Consumida. Bloqueo actual reemplaza el de tipado: falta investigar por qué no rechazó SAN incorrecto. Sin concluir vulnerabilidad ni error de fixture.
Bloqueo: tipo=verificacion_x2; falta=diagnóstico acotado del caso SAN; sin nuevos intentos autorizados
Registro: n=2; herramienta=pi; modo=normal; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2

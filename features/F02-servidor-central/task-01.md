# task-01 — Arranque central HTTP y configuración privada
repo: Flucastr.Memory-AI   depende_de: —   estado: hecha

## Descripción
Primer incremento ejecutable de S2: arrancar el servidor existente desde `npm run cli -- serve`.
Resolver DB/token, escuchar solo en loopback y cerrar SQLite al terminar, sin imprimir secretos.
No se declara terminada S2: esta tarea conserva temporalmente el contrato HTTP heredado.
S1 está completada por confirmación del encargo; no requiere leer sus tareas.

## Contexto
- Leer: `src/cli.ts`, `src/http-server.ts`
- Tocar: `src/cli.ts`, `src/serve.ts`, `test/serve.test.ts`
- Fuente: definitions/ARCHITECTURE.md «Componentes y configuración objetivo»
- Requiere: red, runtime:node@24.22.1
- Kit de lectura: cli.ts completo (1–80), http-server.ts completo (1–53); menos de 12 KB. Firmas ya verificadas para evitar lecturas extra: src/memory.ts exporta `openAuthorizedMemory(path: string): AuthorizedMemoryStore`, con `close(): void`; src/http-auth.ts exporta `HttpAuthenticator` con `validate(headers: Headers): boolean`, `rotate(): string`, `revoke(): void`, `install(key: string): void`. No leer tareas hechas, archivo/, registro/, features/completed/, .env ni credenciales del usuario.
- Confirmado: `startLocalServer({store, auth, port})` liga 127.0.0.1 y devuelve address/close; `openAuthorizedMemory(path)` abre SQLite/FTS y ofrece close. El CLI es síncrono y termina con `process.exitCode = runCli(...)`: conservar esa API para comandos existentes.
- Confirmado: package.json tiene cli/build/test; Node local v24.22.1. `npm run build` y `npm test` ejecutados, 34/34 verdes. `npm install` no ejecutado, inferido de package.json; requiere red. AGENTS.md no existe en raíz.
- Confirmado: rama observada ahora `main`, distinta de la última base informada `chore/F01-base-verde`. No cambiar rama: al abrir la feature el coordinador comunica la rama; el constructor registra la observada y verifica esa autorización antes de editar.

## Decisiones ya tomadas
- Añadir `startServe` asíncrona exportada en src/serve.ts; recibe argumentos y opcionalmente entorno/home inyectables para pruebas. Devuelve handle con address y close. El CLI despacha `serve` antes del flujo síncrono existente, con captura de rechazo; no usar process.exit abrupto.
- Aceptar únicamente `serve` o `serve --port N`, N decimal entero 1–65535, predeterminado 7420. Pruebas del helper pueden inyectar puerto 0 sin exponerlo en CLI. Rechazar repetidos, desconocidos y valores inválidos antes de abrir DB.
- MEM_DB prevalece; sin variable usar join(homedir(), '.mem', 'mem.sqlite'). Crear directorio padre recursivo. MEM_TOKEN prevalece; sin variable leer join(home, '.mem', 'token'), quitando solo salto final CRLF/LF. Variable presente vacía o token vacío/inválido falla, sin fallback. No crear ni mostrar tokens. Validar token como credencial Bearer sin espacios/caracteres de control.
- Autenticación estática sin caducidad/rotación implícita: adaptador local de HttpAuthenticator, validate compara hashes SHA-256 con timingSafeEqual y exige Bearer exacto. Sus métodos heredados rotate/install/revoke quedan no disponibles (error genérico); no modificar el autenticador heredado ni imponer su mínimo de 32 bytes o expiración de 30 días al servicio central.
- Resolver/validar token antes de abrir SQLite. Abrir un solo store y pasarlo al HTTP existente; cerrar store si falla listen. close idempotente cierra HTTP antes de SQLite. CLI maneja SIGINT/SIGTERM y sale limpiamente. Sin salida de arranque que revele configuración; fallo una línea genérica, sin token, ruta privada, SQL ni traza.
- No añadir bin/npm link todavía: este slice corre con el script cli existente. Objetivo de diff total <=200 líneas añadidas + eliminadas, incluidos tests; estimación 90 servicio, 15 CLI, 90 tests. No sacrificar pruebas ni compactar artificialmente para ocultar exceso.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Incluye solo arranque/configuración/cierre y prueba HTTP real del servidor actual.
Fuera de alcance: modificar persistencia, semántica save/search, errores HTTP heredados, recent/forget, retirar replacements/conflicts, cliente global S3, TLS/Tailscale S4, documentación de gobierno y benchmarks.
Resto S2 (sin crear fichas): OR+BM25 persistente sin FTS temporal; recent/forget transaccional; contrato exacto y errores 400/409/500, retirada de rutas heredadas; bin `mem serve` y comprobación integral de aislamiento, idempotencia, tipos/scopes, top5/4000 bytes solo search. La restricción final de apertura SQLite solo servidor requiere retirar/adaptar comandos locales heredados, no se anuncia lograda aquí.

## Pasos
1. src/serve.ts: implementar resolución y arranque componiendo openAuthorizedMemory/startLocalServer; errores públicos genéricos y limpieza incluso con puerto ocupado. Resultado: handle HTTP/SQLite cerrable.
2. src/cli.ts: documentar serve en help y despacharlo sin alterar comandos existentes; conectar cierre por señales. Resultado: proceso HTTP vivo hasta cierre, sin imprimir token.
3. test/serve.test.ts: usar node:test, home/DB temporales, credenciales generadas solo en memoria y puertos efímeros. Cubrir precedencias y defaults mediante home inyectado; falta/token inválido y argumentos inválidos sin crear DB; loopback address; POST sin Bearer 401 y POST autorizado /v1/search con scope general/query vacío 200; cierre/reapertura de la misma DB y fallo de bind sin recursos retenidos. Incluir proceso CLI serve con puerto libre y SIGTERM, capturar stdout/stderr y afirmar ausencia de token sin volcarlo en mensajes de aserción. Limpiar procesos y temporales en finally.

## Criterios de aceptación
1. Configuración respeta precedencias/defaults y fallo sin token antes de crear DB: tests dedicados con home temporal.
2. HTTP real escucha address 127.0.0.1, rechaza petición no autenticada y acepta Bearer: test loopback sin mocks de red/SQLite.
3. Cierre normal, SIGTERM y error de listen liberan recursos: tests terminan y permiten reabrir DB/puerto; ningún secreto aparece en salida capturada.
4. CLI previo conserva su suite; install/build/test terminan en 0 y el incremento suma <=200 líneas según diff, contando bajas.
5. No se presenta S2 completa ni se modifica cliente/TLS/contrato heredado: revisión de tres rutas y alcance del diff.

## Verificación
```sh
git branch --show-current
npm install
npm run build
npm test
node --test dist/test/serve.test.js
npm run cli -- --help
git diff --numstat -- src/cli.ts
git diff --no-index --numstat -- /dev/null src/serve.ts
git diff --no-index --numstat -- /dev/null test/serve.test.ts
```
Primero: registrar rama; esperada la rama autorizada al abrir F02-servidor-central, no asumir ni crear una desde main. Sin autorización detener ejecución y pedirla al coordinador.
Install/build/test: salida 0, sin EBADENGINE; test nuevo pasa HTTP loopback y cierre. Help incluye serve y no imprime secretos. Cada comando <180 s. Los dos diff --no-index sobre archivos nuevos devuelven 1 al detectar diferencias (esperado); sumar columnas de altas/bajas de las tres rutas, sin omitir archivos no rastreados. Si los archivos ya están rastreados, usar `git diff --numstat -- src/cli.ts src/serve.ts test/serve.test.ts` y registrar ese hecho. No ejecutar con credenciales reales ni imprimir entorno.

## Evidencia
```text
$ git branch --show-current
feature/F02-servidor-central
exit 0
$ npm install
up to date
exit 0
$ npm run build
pass
exit 0
$ npm test
36/36
exit 0
$ node --test dist/test/serve.test.js
2/2
exit 0
$ npm run cli -- --help
serve
exit 0
$ git diff --numstat -- src/cli.ts
10 1 src/cli.ts
exit 0
$ git diff --no-index --numstat -- /dev/null src/serve.ts
40 0 src/serve.ts
exit 1
$ git diff --no-index --numstat -- /dev/null test/serve.test.ts
37 0 test/serve.test.ts
exit 1
$ git diff --numstat -- src/cli.ts src/serve.ts test/serve.test.ts
10 1 src/cli.ts
exit 0
$ git diff --check
(vacío)
exit 0
$ prueba CLI: HTTP POST loopback, SIGTERM
401; ready=yes; exit=0; stdout/stderr vacío
exit 0
```

## Notas
87 altas/1 baja. Resto S2 pendiente.
Registro: n=1; herramienta=pi; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

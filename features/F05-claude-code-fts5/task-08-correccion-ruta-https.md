# task-08 — Corrección acotada de ruta HTTPS
repo: Flucastr.Memory-AI   depende_de: ninguna   estado: lista para revisión

## Autorización
Franco autorizó explícitamente formalizar y ejecutar esta ronda en conversación. Una reproducción previa y una única pasada posterior; sin correcciones adicionales si aparece otro fallo. No reabre task-04 ni entrega F05.

## Contexto
Leer src/http-client.ts, test/remote-cli.test.ts, test/f03-tls.ts y package.json. Código parcial existente conservado.

## Alcance
Solo corregir el destino de postF03 y añadir test sintético HTTPS local para /v1/memories y /v1/search. Sin servidor productivo, red externa, Mac, infraestructura, commit ni cambios a TLS/auth.

## Pasos
1. Añadir test HTTPS loopback con CA efímera que compruebe ambas rutas.
2. Ejecutar build y el test específico contra el cliente actual: registrar fallo esperado.
3. Incorporar route a la URL de petición sin alterar validación del origen.
4. Ejecutar una sola pasada de verificación. Ante fallo inesperado detenerse sin corregir ni repetir.

## Criterios de aceptación
El test de rutas falla antes y pasa después. Typecheck, build y test remoto existente pasan. No se atribuye cobertura completa de task-04 ni de F05.

## Verificación
```sh
npm run typecheck
npm run build
node --test dist/test/http-client-route.test.js
node --test dist/test/remote-cli.test.js
```

## Evidencia
Reproducción previa:
```text
$ npm run build && node --test dist/test/http-client-route.test.js
build: exit 0
not ok 1 - postF03 sends both exact routes over verified HTTPS
actual: ['/', '/']; expected: ['/v1/memories', '/v1/search']
# tests 1; pass 0; fail 1
exit 1
```

Única pasada posterior (encadenada con &&; todos los comandos ejecutados):
```text
$ npm run typecheck
> tsc -p tsconfig.json --noEmit
exit 0
$ npm run build
> tsc -p tsconfig.json
exit 0
$ node --test dist/test/http-client-route.test.js
ok 1 - postF03 sends both exact routes over verified HTTPS
# tests 1; pass 1; fail 0
exit 0
$ node --test dist/test/remote-cli.test.js
ExperimentalWarning: SQLite is an experimental feature and might change at any time
ok 1 - remote CLI uses authenticated HTTPS loopback F03 without loading local CLI/SQLite
# tests 1; pass 1; fail 0
exit 0
```

## Notas
Presupuesto nuevo explícitamente autorizado solo para esta corrección; no amplía otros intentos.
Entorno: `node ~/.flucastr-ai/entorno.mjs features/F05-claude-code-fts5/task-08-correccion-ruta-https.md` exit 0; aviso: la tarea no declara Requiere.
Cambio mínimo: request(new URL(route, url), ...); validación de origen y TLS/auth intactos. Prueba fallo→éxito demostrada para ambas rutas. Todos los criterios acotados satisfechos; no se ejecutó la suite global ni se entrega task-04/F05. Validador documental requiere estado terminado; primera invocación rechazó «en curso», sin ejecutar pruebas adicionales.
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

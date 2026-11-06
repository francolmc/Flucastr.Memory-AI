# task-01 — S1a: retirar scripts de gates y documentación sintética
repo: .   depende_de: —   estado: lista para revisión

## Descripción
Primera partición ejecutable de S1, limitada a tres archivos.
Retirar los scripts de gates y su prueba de cableado, y limpiar el README.
No ejecutar durante la preparación ni presentar esta partición como S1 completa.
S1b queda pendiente: retirada física y adaptación del transporte y sus pruebas.

## Contexto
- Leer: `package.json`, `test/f03-gate.test.ts`, `README.md@86-46`
- Tocar: `package.json`, `test/f03-gate.test.ts`, `README.md`
- Fuente: definitions/PROJECT.md «Preparación y ejecución posterior»
- Requiere: red, runtime:node@24.22.1, runtime:npm@11
- Confirmado por lectura: package.json scripts.verify llama gate:f02/gate:f03; test/f03-gate.test.ts exige esos scripts. README contiene gates, TLS propio y procedimientos sintéticos. build usa tsc; test compila y ejecuta dist/test/*.test.js.
- Decisión explícita de Franco: Node v24.22.1, ya instalado, es el estándar provisional; se descarta el requisito Node 22. npm observado: 11.19.1. El constructor comprobará compatibilidad con comandos reales; esta actualización no modifica engines ni dependencias.
- npm install/build/test no ejecutados; comandos inferidos de scripts leídos. La limpieza de dist evita ejecutar el JS de la prueba eliminada.

## Decisiones ya tomadas
- Rama main; sin commit, cambio de rama, despliegue ni STATUS.md. No tocar cambios previos ajenos.
- Retirar gate:f02/gate:f03 de scripts y verify; conservar typecheck/build/test y CLI de diagnóstico en verify. Eliminar solo la prueba que exige el cableado de esos scripts.
- README: quitar benchmark/corpus congelado, gates, instrucciones CA/TLS propio y procedimientos de backup sintético/restauración/saneamiento. Conservar descripción del núcleo y distinguir código existente de funcionamiento observado; no afirmar servidor central operativo. No escribir documentación sustituta.
- Conservar SQLite/FTS5, ID idempotente, tipos decision/learning/resolved-blocker/rule, scopes general/project:<nombre>, BM25 y límite de búsqueda top5/4000 bytes; POST JSON Bearer. No modificar implementación en S1a.
- Partición honesta: esta tarea solo autoriza S1a. S1b sigue dentro de S1 y requiere descomposición acotada posterior, sin crear fichas ahora ni pedir aprobación intermedia. Su alcance pendiente es retirar src/recovery.ts y tests sintéticos de backup/restauración, test/f02-gate.test.ts y fixtures/f02; sustituir dependencias del corpus en test/memory.test.ts por datos inline; eliminar TLS propio de servidor/cliente/CLI y adaptar sus tests y worker antes de retirar test/f03-tls.ts. Evaluar revisiones viejas .sh/.py por listado, sin leer documentos archivados ni modificar archivo.
- El volumen total de S1 no cabe en ~200 líneas: recovery y pruebas de gate/backup/recovery ya superan 300 líneas de bajas, además del transporte. S1a apunta a ~200; S1b necesita particiones ejecutables antes de construirse. No ocultar bajas en el cómputo ni compensarlas con documentos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: tres archivos declarados; evidencia real de install/build/test de S1a cuando se autorice ejecutar.
Fuera de alcance: ejecutar ahora, S1b, S2–S5, código de producto, cambios en lockfile, archivo, registro, features/completed, STATUS.md, .env o credenciales. Si install altera package-lock.json, informar y no incorporar ese cambio a esta partición.

## Pasos
1. package.json: eliminar scripts gate:f02/gate:f03 y sus llamadas en verify. Resultado: verify conserva comprobaciones útiles sin gates.
2. test/f03-gate.test.ts: eliminar la prueba de cableado obsoleta. Conservar las demás suites sin saltarlas. Resultado: ninguna aserción exige los scripts retirados.
3. README.md: retirar el material indicado sin reescribir el uso futuro ni afirmar la retirada física todavía pendiente. Resultado: sin instrucciones de gates, CA propia ni procedimientos excluidos.
4. Con Node 24.22.1, ejecutar la verificación en orden; limpiar únicamente dist generado. Registrar salidas y diff; no declarar S1 completa aunque S1a pase.

## Criterios de aceptación
1. package.json carece de scripts gate:f02/gate:f03 y verify no los invoca; comprobar diff.
2. La prueba de cableado está retirada y no se omiten suites restantes; comprobar diff y ejecución de npm test.
3. README no prescribe gates, CA propia, backup sintético, restauración ni saneamiento; comprobar diff manualmente.
4. npm install, npm run build y npm test terminan en 0 con salidas reales bajo Node 24.22.1; no aceptar solo lectura de código.
5. Solo cambian las tres rutas declaradas en el diff versionado de esta partición; S1b figura pendiente en evidencia, no como retirada realizada.

## Verificación
Desde la raíz; no ejecutar durante preparación:
```sh
git branch --show-current
node --version
npm --version
npm install
node --input-type=module -e "import {rmSync} from 'node:fs'; rmSync('dist',{recursive:true,force:true})"
npm run build
npm test
git diff --stat
git diff --check
```
Esperado: main, Node v24.22.1, instalación/build/tests código 0 y diff sin errores de whitespace. El constructor comprobará compatibilidad real con ese runtime y registrará cualquier fallo, sin exigir Node 22. dist es salida generada, no un cuarto archivo versionado autorizado; no borrar DB ni otras rutas.

## Evidencia
```text
$ git branch --show-current
chore/F01-base-verde
exit 0
$ node --version
v24.22.1
exit 0
$ npm --version
11.19.1
exit 0
$ npm install
npm warn EBADENGINE (engines mantiene >=22.23.2 <23; Node 24.22.1 es la decisión provisional explícita de Franco)
up to date, audited 4 packages in 560ms
found 0 vulnerabilities
exit 0
$ node --input-type=module -e "import {rmSync} from 'node:fs'; rmSync('dist',{recursive:true,force:true})"
exit 0
$ npm run build
tsc -p tsconfig.json
exit 0
$ npm test
ℹ tests 39
ℹ pass 39
ℹ fail 0
ℹ cancelled 0
exit 0
$ git diff --stat
65 files changed, 165 insertions(+), 13282 deletions(-) (el checkout incluye cambios ajenos previos, no modificados en esta tarea)
exit 0
$ git diff --check
exit 0
```
Diff exclusivo de las rutas editadas por este trabajo: 12 archivos, 68 inserciones(+), 183 eliminaciones(-), 251 líneas totales afectadas; sin cambio de `package-lock.json`. `npm install`, build y tests ejecutados bajo Node v24.22.1. La advertencia EBADENGINE permanece porque no se cambió `engines` ni dependencias.

## Notas
Decisión explícita de Franco: adelantar retirada de TLS propio/tests SAN de S1b; no reparar temporalmente la aserción SAN. Se implementó en dos incrementos ejecutables para mantener cada partición bajo ~200 líneas afectadas: S1a, 2 altas/80 bajas (82); incremento HTTP/TLS autorizado, 66 altas/103 bajas (169). Se retiraron CA/certificados y servidor/cliente HTTPS propios, migrando servidor, cliente CLI, worker y tests HTTP a `127.0.0.1` con Bearer; el núcleo SQLite/FTS5 y las suites no TLS continúan. Rutas modificadas/eliminadas por este trabajo: `README.md`, `package.json`, `test/f03-gate.test.ts`, `src/http-server.ts`, `src/http-client.ts`, `src/remote-cli.ts`, `test/f03-crash-worker.ts`, `test/f03-tls.ts`, `test/http-client-route.test.ts`, `test/http-server.test.ts`, `test/remote-cli.test.ts`, `test/remote-client-security.test.ts`. No se tocaron las modificaciones ajenas existentes reflejadas por `git diff` global. S1b aún requiere retirar/adaptar recuperación y backup sintéticos, gate F02 y corpus/fixtures asociados; no se declara S1 completa.

Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

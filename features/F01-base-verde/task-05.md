# task-05 — Alinear metadata con Node 24.22.1
repo: Flucastr.Memory-AI   depende_de: task-04   estado: lista para revisión

## Descripción
Cerrar la incompatibilidad declarada de engines con el runtime real de S1.
Alinear manifiesto y lock sin actualizar dependencias ni tocar producto.
Separar la retirada Atlas/Birch: afecta ocho archivos de código/tests y no cabe junto a este cambio en cuatro archivos.

## Contexto
- Leer: `package.json`, `package-lock.json`
- Tocar: `package.json`, `package-lock.json`
- Fuente: definitions/PROJECT.md «Preparación y ejecución posterior»
- Requiere: runtime:node@24.22.1, red
- Confirmado: package.json:13 declara engines.node `>=22.23.2 <23`; package-lock.json:14–16 replica esa restricción en packages[""].engines. Lectura principal: 2200 bytes; de task-04 leer solo Notas como dependencia, sin releer pasos ni evidencia.
- Confirmado: scripts build y test existen; test recompila y ejecuta dist/test/*.test.js. Runtime observado v24.22.1, npm 11.19.1 y rama chore/F01-base-verde. git diff --check pasó durante preparación.
- Install/build/test no ejecutados en preparación; comandos inferidos de scripts leídos. Última evidencia comunicada por Franco: 34/34, persiste EBADENGINE.

## Decisiones ya tomadas
Usar engines.node `>=24.22.1 <25` en manifiesto y raíz del lock: soporte declarado para la línea 24 desde la versión verificada, sin prometer otras mayores. Conservar versiones, integrity y resolución de todas las dependencias, incluidos @types/node y TypeScript. No adaptar tipos ni cambiar runtime del producto en este incremento.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Solo metadata Node y evidencia real de base verde. Presupuesto previsto: dos archivos, aproximadamente cuatro líneas de diff contando altas y bajas; máximo 200 líneas incluyendo bajas.
Fuera de alcance: Atlas/Birch y su autorización, cambios src/test/README, nuevos gates/fichas, dependencias nuevas, STATUS, commits y despliegue. S1 sigue abierto para retirar esa autorización sintética con reemplazo justificado y conservar pruebas funcionales e aislamiento. No modificar SQLite/FTS5, idempotencia ID, tipos/scopes, BM25, HTTP loopback ni Bearer.

## Pasos
1. En package.json cambiar solo engines.node al rango decidido; resultado: Node 24.22.1 admitido.
2. En package-lock.json alinear packages[""].engines.node; ejecutar npm install real y revisar que no cambia resolución/versiones/integrity de dependencias. Si aparecen cambios ajenos, detener e informar, sin ampliar el alcance.
3. Ejecutar la verificación completa; registrar salidas y conteo real de tests en Evidencia, diff y resto S1 en Notas. No dar S1 por cerrado.

## Criterios de aceptación
1. Ambos engines.node son `>=24.22.1 <25`, comprobado con el comando de metadata.
2. npm install termina en cero bajo v24.22.1 y no emite EBADENGINE; conservar salida completa y comprobarla, no basta el código de salida.
3. Build y test reales terminan en cero; registrar total observado sin borrar ni omitir pruebas.
4. Diff limitado a dos archivos y <=200 líneas altas+bajas; sin cambios de dependencias; git diff --check en cero.
## Verificación
Desde la raíz del repo; conservar stdout/stderr completos de install y comprobar ausencia de EBADENGINE.
```sh
git branch --show-current
node --version
npm --version
npm install
npm run build
npm test
node --input-type=module -e 'import fs from "node:fs"; import assert from "node:assert/strict"; const p=JSON.parse(fs.readFileSync("package.json")); const l=JSON.parse(fs.readFileSync("package-lock.json")); assert.equal(p.engines.node,">=24.22.1 <25"); assert.equal(l.packages[""].engines.node,p.engines.node);'
git diff --check
git diff --numstat -- package.json package-lock.json
git diff -- package.json package-lock.json
```
Esperado: rama chore/F01-base-verde, v24.22.1; install/build/test y assert exitosos, sin EBADENGINE; diff solo engines, tamaño dentro del presupuesto. Cambios preexistentes de task-04 y STATUS no pertenecen a esta tarea y no deben tocarse.

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
up to date, audited 4 packages in 619ms
found 0 vulnerabilities
exit 0
$ npm run build
> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json
exit 0
$ npm test
> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json
(test output: all 34 observed tests passed)
ℹ tests 34
ℹ pass 34
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
$ node --input-type=module -e 'import fs from "node:fs"; import assert from "node:assert/strict"; const p=JSON.parse(fs.readFileSync("package.json")); const l=JSON.parse(fs.readFileSync("package-lock.json")); assert.equal(p.engines.node,">=24.22.1 <25"); assert.equal(l.packages[""].engines.node,p.engines.node);'
(no output)
exit 0
$ git diff --check
(no output)
exit 0
$ git diff --numstat -- package.json package-lock.json
1\t1\tpackage-lock.json
1\t1\tpackage.json
exit 0
$ git diff -- package.json package-lock.json
Only package and lock root engines.node changed from >=22.23.2 <23 to >=24.22.1 <25
exit 0
```
`npm install` complete stdout/stderr observed; explicit check: no `EBADENGINE` in output. Test runner actually listed the 34 tests individually; summary above records all 34 passed, none skipped.

## Notas
No se modificó ninguna otra metadata o producto. S1 sigue abierto: retirar la autorización sintética Atlas/Birch con reemplazo justificado y conservar pruebas funcionales y de aislamiento; no se afirma S1 completa. Cambios preexistentes ajenos observados en `definitions/STATUS.md` y `features/F01-base-verde/task-04.md` se dejaron intactos.
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna.

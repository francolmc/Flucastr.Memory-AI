# task-07 — Retirar nombres Atlas/Birch de pruebas de memoria y cliente
repo: Flucastr.Memory-AI   depende_de: task-06   estado: lista para revisión

## Descripción
Retirar referencias nominales Atlas/Birch de tres pruebas útiles, sin eliminar casos ni cambiar comportamiento.
Usar proyectos neutrales y conservar inclusión de general, aislamiento, ranking, persistencia y Bearer.
Es un incremento parcial S1, no implementación S2 ni cierre de S1.

## Contexto
- Leer: `test/memory.test.ts@1-35`, `test/authorized-memory.test.ts`, `test/remote-cli.test.ts`, `package.json`
- Tocar: `test/memory.test.ts`, `test/authorized-memory.test.ts`, `test/remote-cli.test.ts`
- Fuente: definitions/PROJECT.md «Fuera de alcance»
- Requiere: runtime:node@24.22.1, red
- Lectura acotada: en memory.test.ts leer solo líneas 1–35 (imports y todos los casos con nombres pendientes); el resto no requiere edición. El diff debe conservar intacto ese resto.
- Confirmado: memory.test.ts:8–33 contiene sample, aislamiento y ranking con Atlas/Birch; authorized-memory.test.ts:12–30 cubre búsquedas, colisiones y reemplazos; remote-cli.test.ts:23–32 contiene el recorrido CLI entre dos proyectos. Son datos locales mínimos de pruebas, no corpus ni benchmark.
- Confirmado: package.json scripts build y test compilan con tsc y ejecutan dist/test/*.test.js; engines exige >=24.22.1 <25. Node local observado: v24.22.1; npm: 11.19.1. git diff --check pasó durante planificación.
- Install/build/test no ejecutados por el planificador; comandos inferidos de scripts existentes. El constructor debe ejecutarlos realmente, no reutilizar evidencia task-06.
- Dependencia: leer solo Notas de task-06 si hace falta; no releer su implementación ni tareas anteriores. Hay cambios preexistentes en STATUS y task-06: no tocarlos ni revertirlos.

## Decisiones ya tomadas
Sustitución coherente y sensible a mayúsculas: Atlas → ProjectOne, Birch → ProjectTwo; atlas → projectOne, birch → projectTwo (incluidos IDs y variables). Mantener project:Other como tercer proyecto y mantener general. No renombrar archivos ni cambiar APIs, textos de búsqueda, fechas, tipos o expectativas salvo los nombres/IDs afectados. No retirar pruebas por contener datos de ejemplo. Preservar todas las aserciones y todos los tests.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Solo limpieza nominal en las tres rutas Tocar; máximo aproximado de 200 líneas sumando altas y bajas.
Fuera de alcance: src, transporte, autenticación, scopes válidos, semántica AND/OR, endpoints, datasets benchmark, nuevas fixtures, gates, documentos auxiliares, STATUS, backlog, tareas hechas, archivos archivados, commits y S2.
Restan referencias confirmadas en test/http-server.test.ts, test/f03-durability.test.ts y test/f03-crash-worker.ts: se reservan para otro incremento; no borrarlas ni modificar esos archivos aquí.

## Pasos
1. En test/memory.test.ts aplicar los nombres neutrales al sample, IDs y scopes; conservar comprobaciones de general, exclusión de otro proyecto y ranking.
2. En test/authorized-memory.test.ts sustituir nombres en entradas y expectativas; mantener tercer scope válido, rule general y rechazos de mezcla entre proyectos.
3. En test/remote-cli.test.ts sustituir scopes, ID secundario y variables alusivas; conservar roundtrip HTTP con Bearer, idempotencia, colisión y aislamiento del segundo proyecto.
4. Ejecutar verificación completa y registrar resultados, conteo de tests y tamaño de diff. Si excede ~200 líneas, detenerse e informar antes de ampliar rutas.

## Criterios de aceptación
1. Cero menciones Atlas/Birch (sin distinguir mayúsculas) en Tocar, comprobado con grep; no se exige cero global todavía.
2. Diff exclusivamente nominal en esas tres rutas: ninguna aserción/test borrado y ningún cambio de producto; revisión git diff.
3. npm install, npm run build y npm test reales terminan 0 bajo Node v24.22.1, sin EBADENGINE; conservar como mínimo los 34 tests actuales, todos verdes.
4. git diff --check termina 0 y altas+bajas de las tres rutas no superan ~200; no alterar cambios ajenos.
5. Evidencia identifica las tres rutas restantes y declara S1 todavía incompleta.

## Verificación
Desde la raíz del repo, cada comando por separado:
```sh
git branch --show-current
node --version
npm install
npm run build
npm test
if grep -nEi 'atlas|birch' test/memory.test.ts test/authorized-memory.test.ts test/remote-cli.test.ts; then exit 1; fi
git diff --check
git diff --numstat -- test/memory.test.ts test/authorized-memory.test.ts test/remote-cli.test.ts
git diff -- test/memory.test.ts test/authorized-memory.test.ts test/remote-cli.test.ts
```
Esperado: rama chore/F01-base-verde; v24.22.1; install/build/test exit 0, sin EBADENGINE; grep sin coincidencias; diffcheck limpio. Revisar que install no dejó cambios de manifiestos/lock: no incorporarlos a esta tarea; informar cualquier cambio inesperado sin revertir trabajo ajeno.

## Evidencia
```text
$ git branch --show-current
chore/F01-base-verde
exit 0
$ node --version
v24.22.1
exit 0
$ npm install
up to date, audited 4 packages; 0 vulnerabilities; no EBADENGINE
exit 0
$ npm run build
> tsc -p tsconfig.json
exit 0
$ npm test
ℹ tests 34; ℹ pass 34; ℹ fail 0
exit 0
$ if grep -nEi 'atlas|birch' test/memory.test.ts test/authorized-memory.test.ts test/remote-cli.test.ts; then exit 1; fi
(no output)
exit 0
$ git diff --check
(no output)
exit 0
$ git diff --numstat -- test/memory.test.ts test/authorized-memory.test.ts test/remote-cli.test.ts
8 8 test/authorized-memory.test.ts
13 13 test/memory.test.ts
5 5 test/remote-cli.test.ts
exit 0
$ git diff -- test/memory.test.ts test/authorized-memory.test.ts test/remote-cli.test.ts
Solo sustituciones nominales; 26 altas + 26 bajas = 52 líneas. Se conservaron tests/aserciones y su cobertura de inclusión general, aislamiento, ranking, persistencia, reemplazos y Bearer/CLI.
exit 0
```
Riesgos/residuo: continúan referencias reservadas en test/http-server.test.ts, test/f03-durability.test.ts y test/f03-crash-worker.ts; S1 sigue incompleta. npm install no produjo cambios observados en manifiestos/lock.

## Notas
Sin huecos. No marcar S1 completa: quedan las tres rutas citadas en Alcance.
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

# task-03 — Retirar gate F02 y desacoplar búsqueda del corpus
repo: Flucastr.Memory-AI   depende_de: task-02   estado: lista para revisión

## Descripción
Retirar el gate sintético F02 y su baseline, manteniendo pruebas pequeñas de búsqueda independientes del corpus congelado.
Es una partición de S1: tres archivos y unas 130–170 líneas cambiadas, incluidas bajas; no completa la limpieza Atlas/Birch.
No ejecutar otras retiradas para alcanzar artificialmente el cierre de S1.

## Contexto
- Leer: `test/f02-gate.test.ts`, `test/memory.test.ts`
- Tocar: `test/f02-gate.test.ts`, `test/memory.test.ts`, `fixtures/f02/baseline.txt`
- Fuente: definitions/PROJECT.md «Preparación y ejecución posterior»
- Requiere: runtime:node@24.22.1, red
- Confirmado: gate de 65 líneas; baseline de 30; primer test de memory, líneas 9–24, carga corpus/queries con readFileSync. Los demás tests cubren Unicode, empates, persistencia, reintentos y colisiones. response.test.ts cubre top5/4000 bytes y omisión íntegra de objetos grandes.
- Confirmado por búsqueda de referencias: solo el gate consume baseline; solo el gate y memory.test.ts consumen corpus/queries dentro de src/test. package.json define build con tsc y test con build seguido de node --test dist/test/*.test.js.
- Confirmado: rama chore/F01-base-verde y Node v24.22.1. npm install, npm run build y npm test no ejecutados por el planificador; ejecución pendiente del constructor, no evidencia heredada. Puede persistir EBADENGINE por metadata Node antigua.
- Dependencia: de task-02 leer solo Notas; no releer su cuerpo ni task-01. Conservar modificaciones preexistentes de otros responsables.

## Decisiones ya tomadas
- Borrar gate y baseline, sin trasladar reportes, porcentajes, corpus ni conteos congelados a otra prueba.
- Sustituir únicamente el primer test de memory.test.ts por un caso local autocontenido con tres recuerdos learning: general, project:Atlas y project:Birch; IDs nuevos y texto mínimo, origen test y fecha válida. Usar los scopes hoy aceptados sin ampliar la API.
- Verificar inclusión de general en Atlas, aislamiento entre proyectos y consulta sin resultados usando un único término compartido por los tres recuerdos; comparar conjuntos de IDs para no imponer ranking accidental. Verificar también que general no ve los proyectos.
- Mantener los demás tests sin cambios: no cambiar AND a OR todavía. Conservar SQLite/FTS5, idempotencia por ID, tipos/scopes, BM25 y HTTP/Bearer.
- Node 24.22.1 es estándar provisional, pero metadata queda para otro incremento. Corpus/queries quedan temporalmente sin consumidores; no se consideran retirados.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Dentro: retirar gate/baseline y el acoplamiento del primer test al corpus, preservando cobertura pequeña de scopes.
Fuera de alcance: borrar corpus.json/queries.json, limpiar otros Atlas/Birch o README, modificar metadata Node/package-lock, API o transporte, semántica de búsqueda, recuperación y backup real S4, STATUS, commits y documentos adicionales.

## Pasos
1. test/memory.test.ts: reemplazar el primer test según las decisiones anteriores; eliminar importación dinámica y lecturas de fixtures; mantener cierre de DB y limpieza temporal en finally. Resultado: prueba independiente del corpus.
2. test/f02-gate.test.ts y fixtures/f02/baseline.txt: eliminar ambos archivos completos. Resultado: no existe gate ni baseline F02.
3. Ejecutar la verificación real y registrar evidencia. Si el diff de producto excede unas 200 líneas añadidas más eliminadas, detenerse e informar; no sumar limpiezas ni declarar S1 hecha.

## Criterios de aceptación
1. Gate y baseline ausentes: comprobar con test ! -e; no se recrean en otras rutas.
2. memory.test.ts no carga fixtures/f02 y prueba general/proyecto/aislamiento/no coincidencias con datos locales; comprobar diff y suite real.
3. Resto de pruebas de memory y response conservadas; revisión del diff confirma que no cambian contratos ni implementación.
4. npm install, npm run build y npm test terminan con código 0 en Node 24.22.1; registrar resultados y cualquier EBADENGINE, sin afirmar hecha por documentación.
5. git diff --check sin errores y diff de este incremento limitado a tres rutas, aproximadamente 130–170 líneas y nunca más de unas 200; sin cambios colaterales en archivos preexistentes.

## Verificación
Desde la raíz del repo; cada comando debe terminar en menos de 180 s.
```sh
git branch --show-current
node --version
npm install
npm run build
npm test
test ! -e test/f02-gate.test.ts && test ! -e fixtures/f02/baseline.txt
! grep -n 'fixtures/f02\|readFileSync' test/memory.test.ts
git diff --check
git diff --numstat -- test/f02-gate.test.ts test/memory.test.ts fixtures/f02/baseline.txt
git status --short
```
Esperado: chore/F01-base-verde, v24.22.1, instalación/build/tests exitosos, comprobaciones de ausencia exitosas y diff limpio. npm test compila antes de probar; un dist/test/f02-gate.test.js residual puede seguir ejecutándose porque tsc no limpia salidas eliminadas: si existe, borrar exclusivamente ese artefacto generado y repetir build/test. No borrar dist completo ni fuentes. Si npm install cambia metadata versionada fuera de Tocar, revisar e informar sin incorporarla al alcance ni revertir trabajo ajeno. No reutilizar 35/35 como resultado esperado: el conteo cambia al retirar el gate.

## Evidencia
```text
$ git branch --show-current
chore/F01-base-verde
exit 0
$ node --version
v24.22.1
exit 0
$ npm install
npm warn EBADENGINE: required >=22.23.2 <23; current v24.22.1, npm 11.19.1
up to date, audited 4 packages; found 0 vulnerabilities
exit 0
$ npm run build
> tsc -p tsconfig.json
exit 0
$ npm test
34 tests; 34 pass; 0 fail, 0 cancelled, 0 skipped, 0 todo
exit 0
$ test ! -e test/f02-gate.test.ts && test ! -e fixtures/f02/baseline.txt
(sin salida)
exit 0
$ ! grep -n 'fixtures/f02\|readFileSync' test/memory.test.ts
(sin salida: ninguna coincidencia)
exit 0
$ git diff --check
(sin salida)
exit 0
$ git diff --numstat -- test/f02-gate.test.ts test/memory.test.ts fixtures/f02/baseline.txt
0 30 fixtures/f02/baseline.txt
0 65 test/f02-gate.test.ts
8 13 test/memory.test.ts
total: 86 bajas, 8 altas, 108 líneas afectadas
exit 0
$ git status --short
 M definitions/STATUS.md
 M features/F01-base-verde/task-02.md
 D fixtures/f02/baseline.txt
 D test/f02-gate.test.ts
 M test/memory.test.ts
?? features/F01-base-verde/task-03.md
exit 0
```

## Notas
La primera pasada de `npm test` encontró el JS residual `dist/test/f02-gate.test.js` emitido antes de borrar la fuente; se eliminó exclusivamente ese artefacto generado y la segunda pasada quedó verde. `npm install` persiste con advertencia EBADENGINE porque metadata Node excluye v24.22.1; fuera de alcance. El diff es de 108 líneas afectadas en tres rutas. Cambios preexistentes `definitions/STATUS.md` y `features/F01-base-verde/task-02.md` preservados. Pendiente S1: corpus/queries sin consumidores quedan temporalmente intactos, limpieza Atlas/Birch y metadata Node separada; S1 no está completa.
Registro: n=1; herramienta=pi; modo=normal; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

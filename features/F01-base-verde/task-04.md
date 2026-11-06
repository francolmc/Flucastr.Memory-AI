# task-04 — Retirar corpus F02 y nombres sintéticos del ejemplo local
repo: .   depende_de: task-03   estado: lista para revisión

## Descripción
Eliminar los dos datasets F02 ya desacoplados de la suite y retirar Atlas del ejemplo documental.
Es una partición física acotada de S1, no su cierre: la autorización ligada a Atlas/Birch sigue pendiente.
No ejecutar esta tarea durante su preparación.

## Contexto
- Leer: `fixtures/f02/corpus.json`, `fixtures/f02/queries.json`, `README.md`
- Tocar: `fixtures/f02/corpus.json`, `fixtures/f02/queries.json`, `README.md`
- Lectura total confirmada: 11182 bytes; corpus líneas 1–32, queries 1–12 y README 1–83. De task-03, dependencia autorizada por Franco, leer solo Notas si se necesita su evidencia; no releer su implementación.
- Confirmado: corpus y queries suman 44 líneas/6488 bytes; búsqueda textual en src, test, README, package.json y tsconfig.json no encontró consumidores de fixtures/f02, corpus.json ni queries.json. README:70,74–75 contiene project:Atlas en el ejemplo local.
- Confirmado: package.json declara install mediante npm y scripts build (`tsc -p tsconfig.json`) y test (`npm run build && node --test dist/test/*.test.js`); tsconfig incluye src y test, no fixtures. Runtime observado Node v24.22.1, npm 11.19.1. No hay AGENTS.md en el repo ni ancestros inspeccionados.
- Fuente: definitions/PROJECT.md «Fuera de alcance»
- Requiere: runtime:node@24.22.1, runtime:npm@11.19.1, red
- Install/build/test no ejecutados en esta preparación; resultados esperados inferidos de scripts y evidencia previa comunicada (34/34). git diff --check ejecutado sin errores. No existe scripts/validar-tarea.mjs: fuente validada por coincidencia literal del encabezado.

## Decisiones ya tomadas
Eliminar ambos JSON completos, sin trasladarlos ni sustituirlos por otro corpus. En README cambiar únicamente las tres apariciones de project:Atlas por project:Demo; conservar el ejemplo funcional y sus consultas. No reformular el contrato ni anunciar servicio desplegado.
Preservar SQLite/FTS5, idempotencia, tipos, scopes, BM25, HTTP y Bearer. No alterar tests ni código para disimular referencias restantes. No leer archivo/, registro/, features/completed/, tareas hechas completas ni secretos.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos bajas y tres sustituciones documentales, estimación 50 líneas de diff contando altas y bajas; límite 200 líneas y tres rutas.
Fuera de alcance: consumidores/referencias Atlas/Birch en src/memory.ts y seis archivos de test (incluido worker F03), política de autorización, cambios de contratos o pruebas, correcciones generales de README, metadata Node en package.json/package-lock.json/README. Ese conjunto exige otro incremento coherente: no cabe en las tres rutas de este kit. Backup real S4 permanece intacto. Sin fichas, gates, governance, STATUS, commits ni subagentes.

## Pasos
1. Eliminar fixtures/f02/corpus.json y fixtures/f02/queries.json: no queda dataset F02 versionado en esas rutas.
2. README.md: sustituir solo las tres apariciones project:Atlas del ejemplo por project:Demo; save y ambas búsquedas conservan el mismo scope.
3. Ejecutar verificación y registrar resultados en Evidencia, sin atribuir a este cambio la limpieza completa de S1. No corregir metadata de runtime en este incremento.

## Criterios de aceptación
1. Ambos JSON ausentes: comprobaciones test de Verificación exitosas.
2. README sin Atlas/Birch y ejemplo con tres project:Demo: grep de Verificación.
3. Ninguna referencia a los datasets retirados en fuentes activas y configuración inspeccionada: grep de Verificación sin coincidencias.
4. npm install, npm run build y npm test reales bajo Node24.22.1 terminan con código 0; anotar cantidad real de tests y advertencias. EBADENGINE conocido no equivale a metadata corregida.
5. git diff --check sin errores; diff limitado a las tres rutas de Tocar, más cambios preexistentes documentados y Evidencia de esta tarea; máximo 200 líneas de producto contando bajas. No modificar ni revertir cambios previos.

## Verificación
Desde la raíz, ejecutar por separado (cada comando previsto en menos de 180 s):
```sh
git branch --show-current
node --version
npm --version
npm install
npm run build
npm test
test ! -e fixtures/f02/corpus.json && test ! -e fixtures/f02/queries.json
! grep -nE 'Atlas|Birch' README.md
test "$(grep -c 'project:Demo' README.md)" -eq 3
! grep -R -nE 'fixtures/f02|corpus\.json|queries\.json' src test README.md package.json tsconfig.json
git diff --check
git diff --numstat -- fixtures/f02/corpus.json fixtures/f02/queries.json README.md
git status --short
```
Esperado: rama chore/F01-base-verde; v24.22.1 y npm 11.19.1 antes de instalar; install/build/test con código 0; comprobaciones de ausencia y conteo con código 0; diffcheck sin salida. El grep de referencias no debe emitir coincidencias. Registrar advertencia EBADENGINE por engines antiguo, si aparece; no cambiar engines aquí. Si npm install modifica package-lock.json, inspeccionar y retirar solo su delta generado por esta instalación, conservando cualquier cambio previo; el lock no pertenece a Tocar. Estado previo conocido: definitions/STATUS.md y task-03.md modificados, no tocarlos.

## Evidencia
- Rama observada: `chore/F01-base-verde`; Node `v24.22.1`; npm `11.19.1`.
- `npm install`: código 0, up to date, auditó 4 paquetes, 0 vulnerabilidades. Emitió EBADENGINE: paquete requiere `>=22.23.2 <23`, runtime observado `v24.22.1`; no se modificó metadata.
- `npm run build`: código 0 (`tsc -p tsconfig.json`).
- `npm test`: código 0; 34/34 tests pasaron, 0 fallidos/omitidos.
- Ausencia de ambos JSON: código 0. README sin Atlas/Birch: grep sin coincidencias (código 0); `project:Demo` aparece exactamente 3 veces (código 0). Búsqueda de `fixtures/f02`, `corpus.json`, `queries.json` en src/test/README/package.json/tsconfig.json sin coincidencias (código 0).
- `git diff --check`: código 0, sin salida. Numstat de producto: README 3 altas/3 bajas, corpus 32 bajas, queries 12 bajas; 50 líneas modificadas contando altas y bajas.
- No se modificó package-lock.json ni scripts/. El estado incluye cambios preexistentes ajenos y preservados: `definitions/STATUS.md` y `features/F01-base-verde/task-03.md`; task-04 aparece sin seguimiento al completar.
- Evidencia manual: revisión de diff limitada a los tres archivos de alcance, verificando que se conservan save y ambas búsquedas con el scope cambiado a `project:Demo`.

## Notas
Resto explícito: autorización/consumidores y referencias Atlas/Birch en src/test; metadata coherente Node24.22.1 y documentación restante. S1 continúa en curso. Sin decisiones nuevas.

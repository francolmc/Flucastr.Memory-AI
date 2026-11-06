# task-08 — Retirar nombres reservados de HTTP y durabilidad
repo: Flucastr.Memory-AI   depende_de: task-07   estado: aprobada

## Descripción
Completar el remanente nominal S1 sustituyendo nombres de proyectos reservados en tres pruebas activas.
Conservar toda la cobertura HTTP y de durabilidad; no retirar pruebas por su prefijo f03.
Comprobar base verde real y ausencia acotada de esos nombres antes de proponer cierre S1.

## Contexto
- Leer: `test/http-server.test.ts`, `test/f03-durability.test.ts`, `test/f03-crash-worker.ts`, `package.json`
- Tocar: `test/http-server.test.ts`, `test/f03-durability.test.ts`, `test/f03-crash-worker.ts`
- Fuente: definitions/PROJECT.md «Preparación y ejecución posterior»
- Requiere: runtime:node@24.22.1, red
- Confirmado: HTTP líneas 22–36 contiene diez líneas con nombres reservados; durabilidad línea 28 y worker líneas 8/30 comparten scope. Son 12 líneas afectadas (aproximadamente 24 altas+bajas). Tres archivos suman 130 líneas.
- Confirmado: rama chore/F01-base-verde; package.json exige Node >=24.22.1 <25. Build, test y diffcheck ejecutados con Node v24.22.1: 34 tests pasan. npm install no ejecutado durante planificación (inferido del script estándar npm; exige red).
- Dependencia: task-07 hecha, autorizada por Franco según encargo; no releer tareas hechas, ni siquiera para recuperar contexto. No se necesita leer sus Notas.
- Confirmado: queda legado de API (postF03, replacements/conflicts, archive y metadatos internos) en producto; no pertenece a esta limpieza nominal ni prueba incumplimiento de S1. La adaptación al contrato objetivo pertenece a S2.

## Decisiones ya tomadas
Sustituir literalmente Atlas por SampleOne y Birch por SampleTwo en los tres archivos, preservando scopes distintos, SQL y correspondencia worker/prueba. No renombrar archivos, prefijos f03, IDs, tokens de prueba ni helpers. Datos locales mínimos de prueba no son corpus sintéticos a conservar: siguen siendo necesarios para verificar aislamiento y persistencia. No migrar al contrato S2 ni cambiar expectativas actuales 403/replacements/conflicts.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: sustitución nominal, hasta unas 200 líneas sumando altas y bajas, y evidencia de cierre acotado S1.
Fuera de alcance: implementación S2, cambios de API, TLS, backups, nuevas dependencias, gates, fichas, documentos auxiliares, STATUS, backlog, otras tareas, commits y subagentes. No entrar en archivo/, registro/, features/completed/, ni leer tareas hechas, .env o secretos. No ampliar el parche si aparece otro legado: informarlo con ruta y alcance pendiente.

## Pasos
1. En los tres archivos de Tocar, aplicar únicamente las sustituciones decididas. Resultado: mismo escenario HTTP, mismos IDs y scopes concordantes en proceso padre/worker, sin nombres reservados.
2. En esos mismos archivos comprobar que permanecen Bearer, aislamiento/general, idempotencia, colisión, límites UTF-8, SIGKILL tras confirmación HTTP, atomicidad interrumpida, integridad y FTS persistente. No borrar aserciones ni pruebas.
3. Ejecutar Verificación desde la raíz; registrar resultados en Evidencia, incluyendo altas+bajas y cobertura conservada. Proponer cierre S1 solo con install/build/test/diffcheck verdes y búsqueda acotada vacía; no marcar estado ni implementar S2. Si falla algo, describir el remanente sin extender el parche.

## Criterios de aceptación
1. Solo cambian las tres rutas Tocar, sin eliminar pruebas/aserciones; revisar git diff y total de altas+bajas <=200.
2. npm install, npm run build y npm test reales con Node v24.22.1 salen 0; se conservan los 34 tests verdes y sin EBADENGINE.
3. Búsqueda en producto/tests/README activos vacía (salida 0 del envoltorio), sin recorrer archivos excluidos. Es la documentación activa de producto versionada actual; definitions y tareas son planificación y contienen menciones históricas intencionales.
4. git diff --check sale 0; Evidencia declara si cerraría S1 o enumera resto comprobado, sin afirmar conformidad con S2.

## Verificación
Cada comando debe finalizar en <=180 s. Ejecutar en orden desde la raíz:
```sh
git branch --show-current
node --version
npm install
npm run build
npm test
git diff --check
git diff --numstat -- test/http-server.test.ts test/f03-durability.test.ts test/f03-crash-worker.ts
git diff -- test/http-server.test.ts test/f03-durability.test.ts test/f03-crash-worker.ts
node --input-type=module -e 'import {spawnSync} from "node:child_process"; const r=spawnSync("git",["grep","-n","-i","-E","atlas|birch","--","src","test","README.md"],{encoding:"utf8"}); if(r.status===1){console.log("OK: sin nombres reservados en producto/tests/docs activos");}else{process.stdout.write(r.stdout??"");process.stderr.write(r.stderr??"");process.exit(r.status===0?1:2);}'
```
Esperado: chore/F01-base-verde; v24.22.1; install sin EBADENGINE; build/test salida 0 y 34 tests pasan; diffcheck limpio; numstat nominal ~24 líneas totales; diff solo sustituciones; búsqueda OK. npm install no debe dejar cambios de metadata: si los deja, informar y detenerse sin incorporarlos a esta tarea. No tomar cambios preexistentes de STATUS/task-07 como propios.

## Evidencia
- Rama observada: `chore/F01-base-verde` (sin cambio); Node `v24.22.1`.
- `npm install`: exit 0, up to date; sin salida/aviso `EBADENGINE`.
- `npm run build`: exit 0.
- `npm test`: exit 0; 34 tests, 34 pasan, 0 fallan/omitidos.
- `git diff --check`: exit 0, limpio.
- Búsqueda acotada `git grep -n -i -E 'atlas|birch' -- src test README.md`: exit 0 del envoltorio; `OK: sin nombres reservados en producto/tests/docs activos`.
- Cambios en los tres archivos: HTTP 9 altas/9 bajas, durabilidad 1/1, worker 2/2; total 12 altas + 12 bajas = 24 líneas. Solo sustituciones decididas; no se retiraron pruebas/aserciones. Cobertura HTTP Bearer, aislamiento/general, idempotencia/colisión/límites UTF-8 y durabilidad SIGKILL/atomicidad/integridad/FTS preservada.
- `npm install` no produjo cambios metadata. La inspección del alcance comprobado no encontró más legado nominal S1; no se amplió revisión ni se declara conformidad S2.

## Notas
- Estado: lista para revisión. Sin remanente S1 detectado en la búsqueda acotada; quedan fuera de alcance los legados de API postF03 ya identificados en la planificación, que no se consideran cierre S2.
- Confirmación de rama: observada en la rama requerida, sin cambio.
- Comandos registrados: `git branch --show-current` => `chore/F01-base-verde`; `node --version` => `v24.22.1`; `npm install` => 0; `npm run build` => 0; `npm test` => 0 (34/34); `git diff --check` => 0; búsqueda => 0 del envoltorio.

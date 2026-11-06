# task-02 — S1b: retirar recuperación y backup sintéticos
repo: .   depende_de: task-01   estado: lista para revisión

## Descripción
Retirar el módulo sintético de backup/restauración y sus pruebas exclusivas.
Es una partición de S1b: 195 líneas de bajas en tres archivos, sin reemplazo.
No cerrar S1 ni presentar la ejecución anterior como evidencia de esta tarea.

## Contexto
- Leer: `src/recovery.ts`, `test/f03-backup.test.ts`
- Tocar: `src/recovery.ts`, `test/f03-backup.test.ts`, `test/f03-recovery.test.ts`
- Lectura acotada: los dos archivos de Leer completos (8292 bytes). Del tercer archivo basta el hecho confirmado aquí: test/f03-recovery.test.ts importa recovery.js en línea 8 y sus 65 líneas son tres casos exclusivos de restauración/saneamiento sintéticos; eliminarlo completo sin lectura adicional.
- Confirmado: las únicas importaciones de src/recovery.js en src/ y test/ están en esos dos tests; no hay consumidores de producto. El módulo exporta createSyntheticBackup, restoreSyntheticBackup, retainSyntheticBackups y syntheticBackupStatus.
- Fuente: definitions/PROJECT.md «Fuera de alcance»
- Requiere: red, runtime:node@24.22.1
- Confirmado por encargo: constructor reportó install/build/test OK y 39/39 tras S1a y HTTP; task-01 sigue lista para revisión, no hecha. De la dependencia consultar solo Notas si resulta imprescindible, nunca el cuerpo completo. AGENTS.md no existe en la raíz.
- Confirmado localmente: node --version = v24.22.1, npm --version = 11.19.1 y rama chore/F01-base-verde. Scripts build/test existen en package.json. Verificación de instalación/build/tests de esta tarea: no ejecutada, inferida; la debe observar el constructor.

## Decisiones ya tomadas
Node24.22.1 es estándar provisional. No ajustar metadata aquí: package.json declara >=22.23.2 <23; su corrección y la del lock quedan pendientes, separadas de estas tres bajas. Registrar cualquier EBADENGINE, sin ocultarlo ni convertirlo en éxito limpio.
Eliminar los tres archivos completos, sin stubs, sin agregar otro backup ni pruebas sustitutivas de funcionalidad excluida. El backup real S4 mediante sqlite3 .backup se conserva en el plan.
Preservar SQLite/FTS5, idempotencia, tipos/scopes y HTTP loopback/Bearer; no modificar sus módulos ni tests. No cambiar task-01 ni archivos ajenos preexistentes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: desaparición física del módulo y los dos tests sintéticos, incluyendo el caso de saneamiento del archivo de recuperación.
Fuera de alcance: S2, adaptación del contrato, gate F02, corpus/fixtures Atlas/Birch, otros tests/docs, durabilidad real SQLite, metadata Node y operación S4. No tocar definitions/, STATUS, archivo/, registro/, features/completed/, .env ni secretos; sin commits ni nuevas tareas.

## Pasos
1. Eliminar src/recovery.ts y ambos tests indicados: 195 líneas retiradas, ningún consumidor restante en src/ o test/.
2. Limpiar solo dist/ generado antes de verificar: tsc no elimina JS de tests borrados. Ejecutar los comandos siguientes y recoger resultados nuevos; no usar los 39 tests anteriores como aceptación.
3. Revisar el diff limitado a las tres rutas y registrar el resto pendiente en Notas, sin implementarlo: gate F02/corpus, adaptación de sus consumidores/tests/docs y metadata Node24.22.1.

## Criterios de aceptación
1. Los tres archivos no existen; comprobar con test ! -e para cada ruta.
2. No quedan referencias a recovery.js ni a sus cuatro funciones en src/ y test/; comprobar búsqueda indicada.
3. npm install, npm run build y npm test tienen evidencia observada con versión de Node y códigos de salida; tests restantes verdes tras limpiar dist/. No afirmar instalación sin advertencias si aparece EBADENGINE.
4. Diff de producto exclusivamente de tres bajas, aproximadamente 195 líneas; git diff --check sin errores en esas rutas y núcleo/HTTP sin cambios adicionales atribuibles a esta tarea.

## Verificación
Desde la raíz; cada comando esperado en menos de 180 segundos. Los comandos con efectos no se ejecutaron al planificar.
```sh
git branch --show-current
node --version
npm install
node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
npm run build
npm test
test ! -e src/recovery.ts && test ! -e test/f03-backup.test.ts && test ! -e test/f03-recovery.test.ts
if grep -R -nE 'recovery\.js|createSyntheticBackup|restoreSyntheticBackup|retainSyntheticBackups|syntheticBackupStatus' src test; then exit 1; else test "$?" -eq 1; fi
git diff --check -- src/recovery.ts test/f03-backup.test.ts test/f03-recovery.test.ts
git diff --numstat -- src/recovery.ts test/f03-backup.test.ts test/f03-recovery.test.ts
```
Esperado: chore/F01-base-verde; v24.22.1; instalación/build/tests con salida 0 (anotar advertencias de engines); archivos ausentes, búsqueda vacía, diff check limpio y bajas 86/44/65. Si install modifica el lock, no incorporarlo a esta tarea: identificar el cambio propio y reportarlo sin revertir cambios ajenos.

## Evidencia
Comandos/resultado real, con códigos de salida:
```text
$ git branch --show-current
chore/F01-base-verde
exit 0
$ node --version
v24.22.1
exit 0
$ npm install
npm warn EBADENGINE: required >=22.23.2 <23; current v24.22.1, npm 11.19.1
up to date, audited 4 packages in 587ms; found 0 vulnerabilities
exit 0
$ node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
(sin salida)
exit 0
$ npm run build
> tsc -p tsconfig.json
exit 0
$ npm test
35 tests; 35 pass; 0 fail, 0 cancelled, 0 skipped, 0 todo; duration 16153.870226ms
exit 0
$ test ! -e src/recovery.ts && test ! -e test/f03-backup.test.ts && test ! -e test/f03-recovery.test.ts
(sin salida)
exit 0
$ if grep -R -nE 'recovery\.js|createSyntheticBackup|restoreSyntheticBackup|retainSyntheticBackups|syntheticBackupStatus' src test; then exit 1; else test "$?" -eq 1; fi
(sin salida: ninguna referencia)
exit 0
$ git diff --check -- src/recovery.ts test/f03-backup.test.ts test/f03-recovery.test.ts
(sin salida)
exit 0
$ git diff --numstat -- src/recovery.ts test/f03-backup.test.ts test/f03-recovery.test.ts
0 86 src/recovery.ts
0 44 test/f03-backup.test.ts
0 65 test/f03-recovery.test.ts
total: 195 líneas de bajas en tres archivos
exit 0
```
`node --version`: v24.22.1; `npm --version`: 11.19.1 (observado, exit 0). `npm install` emitió EBADENGINE, por tanto no se presenta como instalación limpia; no cambió package-lock.

## Notas
Permanecen pendientes en S1: gate F02/corpus, adaptación de consumidores/tests/docs y ajuste separado de metadata Node24.22.1. No se afirma S1 completa. Se observaron cambios preexistentes en `definitions/STATUS.md` y `features/F01-base-verde/task-01.md`; no fueron tocados por esta ejecución. No se modificó `scripts/`.
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

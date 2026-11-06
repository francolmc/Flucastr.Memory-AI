# task-03 — Alinear expectativa de durabilidad con búsqueda OR
repo: .   depende_de: —   estado: hecha

## Descripción
Corregir exclusivamente la expectativa de búsqueda del test de durabilidad que bloquea task-02.
Los dos registros confirmados contienen «durable»; la consulta «durable needle» debe encontrar ambos con OR.
Mantener la prueba real de SIGKILL y todas sus garantías transaccionales, sin cambiar producto ni ampliar S2.

## Contexto
- Leer: `test/f03-durability.test.ts`, `test/f03-crash-worker.ts`, `package.json`
- Tocar: `test/f03-durability.test.ts`
- Fuente: definitions/ARCHITECTURE.md «Contrato HTTP objetivo (decisión de este borrador)»
- Requiere: runtime:node@24.22.1, runtime:npm@11.19.1, red
- Lectura acotada: test/f03-durability.test.ts líneas 10–42; test/f03-crash-worker.ts líneas 8–32; package.json completo. search de src/memory.ts líneas 121–130 ya comprobado en planificación: tokenización literal y unión OR; no requiere releer producto. Presupuesto de lectura menor de 12 KB; no leer otras tareas, definitions, archivo/, registro/ ni features/completed/.
- Confirmado: worker guarda por HTTP crash-confirmed con «durable needle» y crash-confirmed-2 con «second durable», comprueba ambos 200 y confirma conflictos antes de emitir CONFIRMED. Test línea 27 ya exige ambas filas; línea 28 exige solo una coincidencia, incompatible con OR literal de search. Focal ejecutado bajo Node v24.22.1: falla exactamente allí, con ambos IDs devueltos. El fallo impide llegar al tramo interrupted; por sí solo no demuestra pérdida de atomicidad ni regresión de almacenamiento.
- Confirmado: AGENTS.md ausente en raíz; scripts build/test de package.json verificados. No hay dependencia de task-02 bloqueada: se trabaja sobre sus cambios presentes en la rama, sin crear ciclo ni editar esa tarea.
- Install/build/suite completa no ejecutados en esta planificación; comandos inferidos de package.json, obligatorios para el constructor. Focal y rama ejecutados; git diff --check y numstat son comprobaciones de solo lectura.

## Decisiones ya tomadas
- Conservar consulta «durable needle» y datos del worker. Comparar ambos IDs ordenados mediante sort() en la aserción: este test verifica pertenencia y persistencia, no ranking BM25.
- Añadir una aserción de búsqueda «needle» que devuelva solo crash-confirmed tras reapertura, para conservar comprobación selectiva del índice persistido.
- Conservar sin debilitar: dos filas confirmadas, flags conflict, confirmación HTTP, SIGKILL real, marcador UNCOMMITTED, integrity_check, ausencia de interrupted, dos entradas FTS durable, dos conflictos y cero replaces_id.
- Solo cambiar el test indicado; incremento correctivo <=200 líneas sumando altas y bajas. No atribuir corrección transaccional a un cambio de expectativa OR.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Dentro: expectativa OR y comprobación selectiva en el test real de durabilidad; ejecución de sus dos fases y suite completa.
Fuera de alcance: producto, worker, fixtures, búsquedas AND, ranking, HTTP objetivo restante/S2, esquema/transacciones, dependencias, lockfiles, definitions, STATUS, commits y subagentes. No borrar, saltar ni sustituir la prueba. Si las garantías transaccionales fallan después del ajuste, registrar el fallo y detenerse: no extender esta corrección.

## Pasos
1. test/f03-durability.test.ts: cambiar solo la aserción de IDs para «durable needle» a ambos IDs ordenados; añadir comentario breve de que ambos contienen durable y OR no exige needle. Resultado: expectativa coherente con contrato sin depender de ranking.
2. test/f03-durability.test.ts: añadir búsqueda selectiva «needle» con resultado único crash-confirmed en el mismo bloque tras reapertura. Resultado: se conserva una comprobación de contenido específico persistido.
3. test/f03-durability.test.ts: ejecutar verificación completa y revisar diff; registrar por separado evidencia de pertenencia OR y de atomicidad/confirmaciones. Resultado: prueba completa llega al tramo interrupted y pasa realmente, o bloqueo documentado sin otros cambios.

## Criterios de aceptación
1. «durable needle» encuentra exactamente ambos confirmados y «needle» solo crash-confirmed; comprobar focal real, sin mocks ni alteración de datos.
2. El focal ejecuta y aprueba SIGKILL tras confirmación HTTP y tras transacción interrumpida, manteniendo todas las aserciones existentes salvo la expectativa OR identificada; comprobar salida y diff.
3. Bajo Node 24.22.1, install, build, suite completa y focal salen 0, sin omisiones ni pruebas saltadas nuevas; registrar conteos reales y versiones.
4. Diff correctivo limitado al test declarado, <=200 altas+bajas, sin cambios a producto ni a trabajo previo de task-02; git diff --check sale 0. Distinguir cambios preexistentes en evidencia.

## Verificación
Desde la raíz; cada comando debe terminar en menos de 180 segundos:
```sh
git branch --show-current
node --version
npm --version
npm install
npm run build
npm test
node --test dist/test/f03-durability.test.js
git diff --check
git diff --numstat -- test/f03-durability.test.ts
git diff -- test/f03-durability.test.ts
```
Esperado: feature/F02-servidor-central; Node v24.22.1 y npm 11.19.1; install/build/test/focal/diffcheck con salida 0; focal 1/1 y suite completa sin fallos. Conservar el diff previo: no revertir archivos ajenos ni incorporar cambios de instalación. Registrar tamaño correctivo y resultados reales, no solo build; no imprimir secretos ni entorno.

## Evidencia
```text
$ git branch --show-current
feature/F02-servidor-central
exit 0
$ node --version
v24.22.1
exit 0
$ npm --version
11.19.1
exit 0
$ npm install
up to date, audited 4 packages in 807ms; found 0 vulnerabilities
exit 0
$ npm run build
> tsc -p tsconfig.json
exit 0
$ npm test
37 tests; pass 37, fail 0, skipped 0, todo 0 (duración 16835.787 ms; incluye rebuild)
exit 0
$ node --test dist/test/f03-durability.test.js
✔ HTTP-confirmed writes survive worker SIGKILL; interrupted transaction remains atomic
1 test; pass 1, fail 0, skipped 0 (195.872 ms)
exit 0
$ git diff --check
(sin salida)
exit 0
$ git diff --numstat -- test/f03-durability.test.ts
3 1 test/f03-durability.test.ts
exit 0
$ git diff -- test/f03-durability.test.ts
Solo expectativa durable needle ordenada (2 IDs), comentario OR y consulta needle selectiva (1 ID); permanecen filas/conflictos, SIGKILL, UNCOMMITTED, integrity_check, ausencia interrupted, FTS durable=2 y replaces_id=0.
exit 0
```
El cambio correctivo en el único archivo previsto mide 4 líneas sumando altas y bajas (3 altas, 1 baja). La verificación real conserva el recorrido de confirmación HTTP/SIGKILL y transacción interrumpida/atomicidad; no se atribuye la garantía transaccional al ajuste de expectativa OR. La diferencia registrada es el diff del test frente a su estado preejecución.

## Notas
Borrador correctivo autorizado por Franco tras bloqueo task-02; modo yolo activo. Franco revisa esta tarea antes de ejecución; no cambia estado ni alcance de task-02.
Registro: n=1; herramienta=pi; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

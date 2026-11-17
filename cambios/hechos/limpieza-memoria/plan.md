---
estado: listo
rama: chore/limpieza-memoria
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
tramo: 1
---
# Grupo B: limpieza de memoria

## Objetivo
Unificar la validación sin cambiar los contratos ni los datos existentes.

## Exploración
- `src/cli.ts` llama a `store.archive`, `store.markConflict` y `store.resolveConflict` y admite `replacesId`; `src/memory.ts` expone las operaciones en interfaces públicas reexportadas desde `src/index.ts`. `test/cli.test.ts`, `test/memory.test.ts` y `test/authorized-memory.test.ts` las ejercitan; este último usa `auth.replace`.
- `archived` filtra búsquedas y recientes; `conflict` guarda conflictos persistentes y `replaces_id` interviene en metadatos e idempotencia. Las operaciones y columnas están en uso; eliminarlas alteraría contratos o datos. Se conservan, según la condición pedida por Franco. No se necesita migración nueva.
- `validateMemoryInput` devuelve booleano y `validate` produce errores específicos; las dos repiten reglas de estructura, tipos, scope y fecha. `validate` también requiere confirmación para reglas generales. HTTP usa la primera y el almacenamiento usa la segunda.

## Evaluación
Un único núcleo de validación con resultado que permita conservar los mensajes, más adaptadores mínimos para las interfaces actuales, evita divergencias sin cambiar el comportamiento. No eliminar operaciones activas evita romper la CLI, la biblioteca y las bases.

## Validación
Alcance definido por la condición original: conservar lo que se usa. Franco aprobó este plan por separado. Se omiten fases adicionales porque no hay decisión de producto pendiente.

## Supuestos
Se conservan orden y texto de los errores, la regla de confirmación y la aceptación exacta de cada entrada. La comprobación de compatibilidad usa una base creada por la versión anterior, no una base vacía; no se solicita acceso a datos reales del usuario.

## Alcance
`src/memory.ts` y pruebas adicionales. No cambiar esquema, migraciones, operaciones públicas, datos ni respuestas HTTP.

## Prerrequisitos
Grupo A incorporado a la base aprobada y repositorio limpio; entorno de `./verify` operativo. Si la base no cumple las reglas del proyecto, detenerse y consultar a Franco.

### Tramo 1 — Historia: validación compartida sin pérdida de datos
Como usuario, quiero reglas de validación coherentes y que las memorias existentes sigan funcionando.

**Dependencias:** grupo A cerrado e incorporado a la base.

**Contratos a conservar:** ambas interfaces actuales, errores detallados de almacenamiento, respuesta genérica HTTP, confirmación de reglas generales, operaciones y esquema. No modificar pruebas existentes; agregar pruebas independientes.

**Rutas susceptibles de cambio:** `src/memory.ts`, nuevos archivos de prueba en `test/`.

**Ejemplo:** una fecha civil inválida sigue devolviendo el error específico al guardar y el rechazo genérico mediante HTTP; una regla general válida sigue requiriendo confirmación en la biblioteca local.

**Escenarios y aceptación:**
- A1: CUANDO se valida una memoria, ENTONCES HTTP y almacenamiento comparten un único núcleo de reglas y preservan resultados y errores anteriores, incluidos campos ausentes o extra, tipos, espacios, scope y fechas bisiestas.
- A2: CUANDO se guarda una regla general sin confirmación, ENTONCES se conserva el rechazo; con confirmación se acepta si es válida.
- A3: CUANDO se abre una base creada por la versión anterior con memorias, estados archivados, conflictos y reemplazos, ENTONCES todos los datos y operaciones siguen funcionando sin pérdida; no se introduce migración nueva.
- A4: CUANDO se usan CLI y API públicas de archivo, conflicto y reemplazo, ENTONCES se conservan sus contratos. `./verify` pasa y las pruebas existentes permanecen intactas.

**Alcance del tramo:** conservar comportamiento y reducir reglas duplicadas a una sola implementación; adaptadores finos pueden conservar las firmas existentes. Registrar cómo se obtuvo la base anterior y demostrar datos antes y después sin depender de datos privados.

## Pasos
- [x] Crear pruebas independientes en `test/validation-shared.test.ts` para A1 y A2, incluyendo prioridad y texto de errores; comprobar con `npm test` o la selección compilada.
- [x] Capturar una base temporal con la versión anterior a B y datos representativos, antes de editar `src/memory.ts`; agregar prueba de reapertura y operaciones en `test/previous-database.test.ts`. Comprobar datos antes y después con `npm test` y registrar el procedimiento reproducible.
- [x] Unificar reglas en `src/memory.ts` conservando los adaptadores y contratos; ejecutar las pruebas nuevas y existentes con `npm test` en entorno que incluya requisitos operativos.
- [x] Ejecutar `./verify` y registrar evidencia de A1–A4, ausencia de cambios en pruebas existentes y conservación de esquema y datos.

**Verificación del tramo:** `./verify` completo; registrar duración y resultados. No usar bases ni credenciales personales.

**Handoff:** registrar evidencia y diferencias; detenerse si la compatibilidad requiere cambiar contratos o datos. No hacer commit.

## Verificación
`./verify` desde la raíz.

## Evidencia
- `test/validation-shared.test.ts`: `$ npm run build && node --test dist/test/validation-shared.test.js` → 2/2 pruebas aprobadas, exit 0. Cubre reglas compartidas, errores detallados y rechazo booleano HTTP.
- `test/previous-database.test.ts`: copia ejecutable exacta de `src/memory.ts` del commit aprobado `7f4567b5ee801d71747dcbbeb694eaabbad38351` en `test/fixtures/previous-memory.ts`; crea una base SQLite temporal y la puebla mediante `openMemory`, `save`, `archive` y `markConflict` de esa implementación. La prueba comprueba filas/esquema antes de abrirla con la versión actual y vuelve a comprobar datos y operaciones después.
  `$ npm run build && node --test dist/test/previous-database.test.js`
  ```text
  ✔ reopens and operates on a database created and populated by the previous implementation
  ℹ tests 1
  ℹ pass 1
  ℹ fail 0
  exit 0
  ```
- `src/memory.ts`: `memoryInputError` concentra estructura, campos, tipos, scope y fecha; `validateMemoryInput` y el guardado adaptan el mismo resultado a booleano y errores previos. `$ npm run build && node --test dist/test/validation-shared.test.js dist/test/previous-database.test.js dist/test/memory.test.js dist/test/http-server.test.js dist/test/authorized-memory.test.js dist/test/cli.test.js` → compilación exit 0, 22/22 pruebas aprobadas.
- `$ ./verify`
  ```text
  ℹ tests 74
  ℹ pass 74
  ℹ fail 0
  LECTURA OK
  ESCRITURA OK
  LIMPIEZA DE REGISTRO OK
  VERIFY OK
  MEM BIN PACKAGE OK
  exit 0
  ```
  Duración: 152.3 s. Incluye la nueva prueba de compatibilidad basada en la implementación pre-B ejecutable.
- A1–A4 comprobados: validación compartida mantiene errores y confirmación; test de compatibilidad compara filas y esquema al crear con la versión anterior y reabrir con la actual, y ejercita búsqueda, archivo, conflicto y reemplazo; APIs públicas cubiertas en la suite. No se modificaron pruebas existentes.

## Notas
Los grupos C y D se revisarán por separado después de B. La fixture de la versión anterior es código ejecutable copiado del archivo en la base aprobada identificada arriba; al ejecutar `node --test dist/test/previous-database.test.js`, el propio test crea la base temporal y la puebla sin SQL de esquema reconstruido.

Revisión: DEVUELTO. `test/previous-database.test.ts` creaba el esquema anterior manualmente. Se sustituyó por una copia ejecutable del `src/memory.ts` de la base aprobada antes de B; la prueba usa su API `openMemory`, `save`, `archive` y `markConflict` para crear y poblar la base temporal. La prueba enfocada pasó y `./verify` volvió a pasar (74/74, 152.3 s).

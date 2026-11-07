# task-02 — Búsqueda OR sobre FTS5 persistente
repo: .   depende_de: task-01   estado: hecha

## Descripción
Sustituir la búsqueda AND con FTS temporal por OR literal y BM25 sobre el índice persistente existente.
Es una base ejecutable de S2, no la terminación del contrato HTTP ni de S2.
Mantener guardado idempotente, durabilidad y aislamiento; presupuesto de implementación: aproximadamente 200 líneas sumando altas y bajas, sin reescrituras laterales.

## Contexto
- Leer: `test/memory.test.ts`, `package.json`
- Tocar: `src/memory.ts`, `test/memory.test.ts`
- Fuente: definitions/ARCHITECTURE.md «Contrato HTTP objetivo (decisión de este borrador)»
- Requiere: runtime:node@24.22.1, runtime:npm@11.19.1, red
- Lectura acotada: test/memory.test.ts líneas 1–43 (3892 bytes) y package.json completo; al editar src/memory.ts consultar solo líneas 75–134 (6249 bytes: apertura/migración, save y search). Total menor de 12 KB. No leer el resto del módulo ni otras pruebas: las invariantes restantes se verifican ejecutándolas. De task-01 leer solo Notas, por dependencia; no releer su implementación documental.
- Confirmado: search líneas 120–130 crea temp.search_fts, une AND y limita cinco candidatos; save líneas 103–114 inserta tabla e índice en una transacción. Apertura reconstruye FTS incluso para user_version=2. La prueba «unicode61 literal AND…» codifica el comportamiento que se sustituye.
- Confirmado: rama feature/F02-servidor-central; prueba focal existente ejecutada: 6/6. AGENTS.md no existe en la raíz. Scripts build/test e engines leídos en package.json. npm install/build/test completos: no ejecutados en planificación; comandos inferidos de esos scripts y exigidos al constructor.

## Decisiones ya tomadas
- Conservar node:sqlite, esquema v2 y unicode61; no nueva dependencia ni nueva tabla. Crear base nueva como hoy; migrar v1 reconstruyendo índice como hoy; al reabrir v2 no borrar/recrear memories_fts.
- Tokenizar con /[\p{L}\p{N}]+/gu, entrecomillar términos literales y unir OR. Vacío/sin términos produce []; operadores del usuario no se interpretan como sintaxis FTS.
- Consultar memories_fts persistente, JOIN memories y filtro SQL parametrizado por scope exacto más general (general solo general), conservando archived=0. Orden bm25(memories_fts) ASC, m.id ASC. Estadísticas BM25 del índice global, no de una tabla temporal filtrada.
- Retornar candidatos ordenados sin LIMIT 5 en SQL: el límite de salida top5/4000 bytes pertenece al serializador, que necesita poder saltar candidatos grandes. No modificar serialización aquí ni exponer nuevos campos.
- No cambiar firmas, validación, idempotencia, tipos, scopes libres ni tratamiento de rule general de las APIs actuales. No tocar HTTP/Bearer, configuración ni cierre ya establecidos.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Dentro: búsqueda persistente, reapertura v2 y pruebas de regresión reales en SQLite.
Fuera de alcance: save HTTP exacto y errores 400/409/500, proyección de seis campos y ajuste final top5/4000 bytes, recent, forget, retirada de endpoints heredados, bin mem. Son resto de S2 y requieren tareas posteriores; cliente global/S3, S4 y S5 también fuera. No STATUS, definitions, commits, docs auxiliares ni subagentes.

## Pasos
1. src/memory.ts: separar inicialización nueva, migración v1 y reapertura v2; esta última conserva el índice existente. Save sigue insertando ambos registros transaccionalmente.
2. src/memory.ts: reemplazar AND/FTS temporal por consulta OR persistente con filtro SQL y orden definidos; eliminar límite de candidatos. Resultado observable: un término coincidente basta y nunca devuelve otro proyecto.
3. test/memory.test.ts: adaptar el caso AND al contrato OR y añadir pruebas compactas de persistencia y ranking. Conservar pruebas de idempotencia, colisiones y migración; no suprimir aserciones de aislamiento para hacer pasar la suite.

## Criterios de aceptación
1. Prueba con documentos que coinciden solo con términos distintos de «café absent» devuelve ambos; repetición, Unicode y puntuación no causan sintaxis FTS; consulta sin términos da []. Comprobar con prueba focal.
2. Scope exacto+general, general aislado, exclusión de archivados y desempate id ASC conservados; comparar orden con SELECT parametrizado sobre memories_fts usando bm25 ASC,id ASC en DB de prueba. Incluir otro proyecto sin exigir ranking de corpus filtrado.
3. En una DB temporal, guardar, cerrar y reabrir conserva búsqueda e idempotencia; v1 migra y v2 no reconstruye índice. Demostrar v2 insertando directamente en memories_fts un centinela sintético sin fila en memories, cerrar esa conexión y reabrir con openMemory: el centinela debe seguir en FTS y nunca aparecer en search por el JOIN. Borrar el centinela al terminar; solo en DB de prueba. Revisar además que search no contiene CREATE/DROP ni referencia temp.search_fts.
4. Más de cinco candidatos quedan disponibles en orden para el serializador; prueba focal con seis coincidencias. Mantener los tests existentes de serialización y HTTP verdes, sin cambiar sus criterios.
5. npm install, npm run build y npm test terminan con código 0; prueba focal y diff documentan el incremento cercano a 200 líneas incluyendo bajas. Ningún secreto aparece en salida/evidencia; usar solo DB temporal y datos sintéticos.

## Verificación
Desde la raíz, cada comando debe terminar en menos de 180 segundos:
```sh
git branch --show-current
npm install
npm run build
npm test
node --test dist/test/memory.test.js
git diff --numstat -- src/memory.ts test/memory.test.ts
```
Esperado: rama feature/F02-servidor-central; install/build/test y focal con salida 0, sin fallos; altas+bajas aproximadamente <=200. Inspeccionar el diff para confirmar consulta persistente sin DDL en search. No imprimir variables de entorno ni token. Registrar casos/resultado real de las pruebas nuevas; no basta una prueba mock ni solo build. No añadir lockfiles ni cambios ajenos de instalación al incremento.

## Evidencia
Node v24.22.1; npm 11.19.1. La corrección separada de durabilidad F03 ya está presente; esta validación no la modifica. Ejecuciones de esta revisión, todas exit 0:
```sh
$ git branch --show-current
feature/F02-servidor-central
exit 0
$ npm install
up to date, audited 4 packages in 566ms; found 0 vulnerabilities
exit 0
$ npm run build
> tsc -p tsconfig.json
exit 0
$ npm test
ℹ tests 37
ℹ pass 37
ℹ fail 0
ℹ duration_ms 25414.686638
exit 0
$ node --test dist/test/memory.test.js
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0
$ git diff --numstat -- src/memory.ts test/memory.test.ts
4 5 src/memory.ts
13 2 test/memory.test.ts
exit 0
```
`git diff --check` — sin salida, exit 0. Inspección de diff confirma búsqueda en `memories_fts`, sin DDL/temp FTS en search. Casos focales: OR admite documentos coincidentes con un término; Unicode/puntuación literal y consulta sin términos; scopes general/proyecto, archivado y desempate; seis candidatos; reinicio v2 preserva sentinel huérfano pero JOIN no lo devuelve; migración v1 e idempotencia. Cambios de task-02 contra base: src/memory.ts 4 altas/5 bajas, test/memory.test.ts 13 altas/2 bajas; 17 altas/7 bajas, neto +10. Este recuento excluye los cambios preexistentes de task-03 y task-01.

## Notas
Ejecución previa: la suite global falló dos veces en el caso de durabilidad antes de la corrección independiente; task-02 quedó bloqueada entonces.
Registro: n=1; herramienta=pi; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
Revalidación task-02 aprobada; no se tocaron ni cambiaron los archivos de la corrección de durabilidad. Resto S2 permanece fuera del alcance de esta tarea. Evidencia sin secretos.
Registro: n=2; herramienta=pi; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

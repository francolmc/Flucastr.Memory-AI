# task-02 — Librería importable con sonda SQLite/FTS5
repo: Flucastr.Memory-AI   depende_de: task-01   estado: hecha

## Descripción
Exponer una comprobación técnica desde el núcleo sin depender de CLI ni proceso global.
Verificar apertura, creación de tabla virtual vacía FTS5 y cierre incluso ante error.
No diseñar todavía la API funcional de memoria.

## Contexto
Repo único: `/home/franco/Codes/flucastr/Flucastr.Memory-AI`.
Leídos: `README.md` (vacío); `definitions/BACKLOG.md`, fila F01 y § Evidencia y dependencias de planificación; `definitions/PROJECT.md` § Alcance y § Restricciones; `definitions/ARCHITECTURE.md` § Componentes y § Supuestos y pendientes; `definitions/REPOS.md` § Inventario.
Confirmado: no existen manifiesto, fuentes, pruebas ni convenciones. Las rutas nuevas indicadas abajo son entregables propuestos, no archivos existentes verificados. Node v22.23.2 y npm 10.9.8 disponibles en este entorno. Se ejecutó una prueba en memoria con `node:sqlite`, `DatabaseSync` y `CREATE VIRTUAL TABLE probe USING fts5(body)`: pasó, con advertencia experimental. Esto no acredita macOS.
Los comandos npm de verificación de estas tareas son contratos nuevos a crear, **no ejecutados, inferidos**; no se presentan como scripts existentes. No leer tareas hechas ajenas a dependencias; de las dependencias leer únicamente Notas.

## Decisiones ya tomadas
Definición y backlog aprobados por conversación; sus rótulos antiguos no reabren alcance. Núcleo independiente TS/Node, adaptador CLI encima y un solo repo. F01 es andamiaje y diagnóstico técnico, no guardar/buscar recuerdos. Usar npm, compilación TypeScript a JavaScript y pruebas con el runner incorporado de Node; sin framework de pruebas ni servidor. Runtime de referencia local: Node 22.23.2. Usar `node:sqlite` para la sonda F01: disponibilidad local comprobada; no compromete todavía binding definitivo de F02. No ocultar su condición experimental.
No fijar versiones inventadas: resolver y verificar documentalmente TypeScript y tipos Node compatibles durante task-01, fijar versiones exactas y lockfile y registrar evidencia en Notas. Si no son compatibles, registrar bloqueo técnico, no sustituir silenciosamente runtime o stack.

## Alcance / Fuera de alcance
Solo preparación técnica de F01. Fuera: esquema o migraciones de recuerdos, persistencia de producto, ámbitos, idempotencia, guardar/buscar, corpus y baseline real de F02, gate funcional F02, HTTP/auth, embeddings, integraciones, alojamiento, benchmarks de producto y APIs pagadas. No crear corpus inventado: las sondas usan tablas temporales vacías. No tocar definiciones ni estados del backlog, ni cambios ajenos preexistentes.

Dependencia: task-01; leer solo sus Notas para versiones, estructura efectiva y evidencia.

## Pasos
1. Crear `src/index.ts` con exportación `probeSqlite(): { sqliteVersion: string; fts5: true }`, usando SQLite en memoria y consulta de versión. Cerrar conexión con `finally`; propagar errores sin imprimir ni terminar proceso.
2. Crear `test/sqlite.test.ts`: importar directamente la librería, comprobar versión no vacía y `fts5 === true`, y repetir la sonda sin estado compartido. No insertar recuerdos ni diseñar tablas de producto.
3. Actualizar `package.json` con exportación de librería hacia `dist/src/index.js` y tipos emitidos; conservar scripts previos. Comprobar importación sin ejecución de CLI ni logs.

## Criterios de aceptación
- `npm test` ejecuta sonda real SQLite y FTS5, no mock.
- Importar librería no imprime, no crea archivos ni ejecuta CLI: prueba automatizada.
- API devuelve versión SQLite y FTS5 confirmado; conexión se cierra con `finally`, comprobable por revisión y repetición.
- Compilación y tipos pasan sin dependencias CLI en el núcleo.

## Verificación
Comandos propuestos para ejecutar desde la raíz después de construir esta tarea; salida esperada: cero y etapas/pruebas indicadas arriba. No ejecutados ahora por ausencia de andamiaje.

```sh
npm run typecheck
npm run build
npm test
```

## Evidencia
Linux; Node/npm disponibles según task-01 (Node v22.23.2, npm 10.9.8). Ejecución real:

```text
$ npm run typecheck
> tsc -p tsconfig.json --noEmit
(exit 0)

$ npm run build
> tsc -p tsconfig.json
(exit 0)

$ npm test
> npm run build && node --test dist/test/*.test.js
TAP version 13
# Subtest: Node test runner executes scaffold assertions
ok 1 - Node test runner executes scaffold assertions
# Subtest: probe opens SQLite, confirms FTS5, and closes cleanly
ok 2 - probe opens SQLite, confirms FTS5, and closes cleanly
1..2
# tests 2
# pass 2
# fail 0
(exit 0)
```

La prueba usa SQLite real y FTS5; Node emite la advertencia `ExperimentalWarning: SQLite is an experimental feature`. Importación estática sin ejecución de CLI/logs explícitos; repetición exitosa de sonda. No se validó macOS.

## Notas
Se implementó `probeSqlite()` con base `:memory:`, lectura de versión, creación de tabla virtual vacía FTS5 y cierre en `finally`; errores se propagan. Paquete expone `dist/src/index.js` y declaración `dist/src/index.d.ts` (emisión habilitada). Prueba de repetición sin estado compartido agregada. Versiones fijadas heredadas: TypeScript 5.9.3 y @types/node 22.19.15; sin paquetes nuevos. No se tocaron scripts/.
Registro: n=1; herramienta=pi; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

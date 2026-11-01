# task-03 — CLI mínima de ayuda y diagnóstico
repo: Flucastr.Memory-AI   depende_de: task-02   estado: hecha

## Descripción
Añadir un adaptador ejecutable sobre la sonda del núcleo.
Establecer invocación y códigos de salida para verificar la base sin inventar comandos de memoria.
No ofrecer guardar ni buscar en F01.

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

Dependencia: task-02; leer solo sus Notas para versiones, estructura efectiva y evidencia.

## Pasos
1. Crear `src/cli.ts`: sin argumentos o `--help` imprime ayuda y sale 0; `doctor` invoca `probeSqlite`, imprime JSON con versión SQLite y `fts5: true`, sale 0. Comando desconocido sale 2 con ayuda en stderr; fallo técnico sale 1 con diagnóstico sin secretos ni stack por defecto.
2. Crear `test/cli.test.ts` que lance procesos Node sobre el CLI compilado; comprobar ayuda, doctor y comando desconocido, separando stdout/stderr y validando JSON. La prueba de fallo técnico no requiere introducir flags ocultos ni alterar SQLite del sistema.
3. Actualizar `package.json` con script `cli` para `node dist/src/cli.js`; mantener exportación de librería y ejecutar todos los chequeos. No añadir instalación global ni publicación.

## Criterios de aceptación
- `npm run cli -- --help` termina 0 y documenta únicamente ayuda/doctor.
- `npm run cli -- doctor` termina 0; proceso Node subyacente emite JSON válido con FTS5 confirmado.
- Prueba de comando desconocido verifica salida 2 y mensaje por stderr.
- `npm test` prueba CLI como proceso y librería separadamente; adaptador importa núcleo, nunca al revés.

## Verificación
Comandos propuestos para ejecutar desde la raíz después de construir esta tarea; salida esperada: cero y etapas/pruebas indicadas arriba. No ejecutados ahora por ausencia de andamiaje.

```sh
npm run typecheck
npm run build
npm test
npm run cli -- --help
npm run cli -- doctor
```

## Evidencia

Entorno: Linux; Node v22.23.2; npm 10.9.8. Captura íntegra de la verificación (canales separados):

### npm run typecheck
stdout (literal):
```text

> flucastr-memory-ai@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit

```
stderr (literal):
```text
```
Canal vacío: ninguno y stderr; exit code: 0.

### npm run build
stdout (literal):
```text

> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json

```
stderr (literal):
```text
```
Canal vacío: ninguno y stderr; exit code: 0.

### npm test
stdout (literal):
```text

> flucastr-memory-ai@0.1.0 test
> npm run build && node --test dist/test/*.test.js


> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json

TAP version 13
# Subtest: CLI help documents only help and doctor
ok 1 - CLI help documents only help and doctor
  ---
  duration_ms: 30.466846
  type: 'test'
  ...
# Subtest: CLI doctor reports SQLite and FTS5 as JSON
ok 2 - CLI doctor reports SQLite and FTS5 as JSON
  ---
  duration_ms: 26.515567
  type: 'test'
  ...
# Subtest: unknown CLI command exits 2 and writes help to stderr
ok 3 - unknown CLI command exits 2 and writes help to stderr
  ---
  duration_ms: 24.076636
  type: 'test'
  ...
# Subtest: Node test runner executes scaffold assertions
ok 4 - Node test runner executes scaffold assertions
  ---
  duration_ms: 0.522655
  type: 'test'
  ...
# (node:2401321) ExperimentalWarning: SQLite is an experimental feature and might change at any time
# (Use `node --trace-warnings ...` to show where the warning was created)
# Subtest: probe opens SQLite, confirms FTS5, and closes cleanly
ok 5 - probe opens SQLite, confirms FTS5, and closes cleanly
  ---
  duration_ms: 1.960319
  type: 'test'
  ...
1..5
# tests 5
# suites 0
# pass 5
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 129.611423
```
stderr (literal):
```text
```
Canal vacío: ninguno y stderr; exit code: 0.

### npm run cli -- --help
stdout (literal):
```text

> flucastr-memory-ai@0.1.0 cli
> node dist/src/cli.js --help

Flucastr Memory AI diagnostic CLI

Usage:
  flucastr-memory-ai [--help]
  flucastr-memory-ai doctor

Commands:
  --help  Show this help
  doctor  Check SQLite and FTS5 availability
```
stderr (literal):
```text
(node:2401374) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```
Canal vacío: ninguno; exit code: 0.

### npm run cli -- doctor
stdout (literal):
```text

> flucastr-memory-ai@0.1.0 cli
> node dist/src/cli.js doctor

{"sqliteVersion":"3.51.3","fts5":true}
```
stderr (literal):
```text
(node:2401394) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```
Canal vacío: ninguno; exit code: 0.

## Notas
Archivos de esta tarea: `src/cli.ts`, `test/cli.test.ts`, `package.json`, esta tarea. Sin scripts/ tocados ni dependencias nuevas. El test acepta la advertencia de Node en stderr, y sigue validando que no haya Error; la dirección es CLI → núcleo (`src/cli.ts` importa `probeSqlite` desde `src/index.ts`), nunca núcleo → CLI. Persisten límites de entorno: SQLite experimental y macOS no verificado; sin prueba de fallo técnico inducido.
Verificación repetida para corregir captura: se registraron stdout, stderr y códigos de salida íntegros; Linux no acredita macOS.
Registro: n=3; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

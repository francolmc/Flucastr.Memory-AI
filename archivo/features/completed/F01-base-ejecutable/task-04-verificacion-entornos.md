# task-04 — Guía y gate técnico local reproducible
repo: Flucastr.Memory-AI   depende_de: task-03   estado: hecha

## Descripción
Unificar la comprobación de F01 y documentar ejecución en macOS y WSL sin despliegue.
Distinguir evidencia obtenida de compatibilidad pendiente en equipo no accesible.
La base técnica no debe confundirse con el gate real de F02.

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

Dependencia: task-03; leer solo sus Notas para versiones, estructura efectiva y evidencia.

## Pasos
1. Actualizar `package.json` con `verify` que encadene typecheck, build, test y diagnóstico CLI mediante `&&`; cualquier fallo debe propagarse como salida no cero. No exigir corpus ni hardware de embeddings.
2. Completar `README.md` con requisitos y versiones efectivamente verificadas, instalación desde lockfile, importación del núcleo, ayuda/doctor y `npm run verify`. Explicar advertencia experimental de SQLite, ausencia de comandos de memoria y límites del diagnóstico.
3. En `README.md` incluir matriz macOS/WSL con runtime/OS observados y resultado; marcar no ejecutado cualquier entorno sin acceso. Dar receta idéntica de instalación/verificación para Franco, sin afirmar soporte no medido. Ejecutar gate local y registrar evidencia en Notas; no acceder a otros equipos ni instalar infraestructura.

## Criterios de aceptación
- `npm ci` seguido de `npm run verify` termina 0 en el entorno disponible y ejecuta todas las etapas.
- Script usa propagación de fallos y no ignora errores, comprobable en `package.json`.
- README permite reproducir instalación, compilación, pruebas y diagnóstico sin conocimiento previo.
- Matriz diferencia evidencia local de macOS pendiente, sin atribuir compatibilidad al chip ambiguo.
- README declara explícitamente que F02 y su corpus/baseline/gate no están implementados ni validados.

## Verificación
Comandos propuestos para ejecutar desde la raíz después de construir esta tarea; salida esperada: cero y etapas/pruebas indicadas arriba. No ejecutados ahora por ausencia de andamiaje.

```sh
npm ci
npm run verify
```

## Evidencia
Entorno observado: Linux bajo WSL2 x86_64; Node v22.23.2; npm 10.9.8. macOS no accesible y no probado. `npm ci` terminó con exit code 0; stdout literal:
```text

added 3 packages, and audited 4 packages in 560ms

found 0 vulnerabilities
```
stderr literal: vacío; exit code: 0.

### npm run verify (pasada final capturada; incluye typecheck, build, test, CLI help y doctor)
stdout (literal):
```text

> flucastr-memory-ai@0.1.0 verify
> npm run typecheck && npm run build && npm test && npm run cli -- --help && npm run cli -- doctor


> flucastr-memory-ai@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit


> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json


> flucastr-memory-ai@0.1.0 test
> npm run build && node --test dist/test/*.test.js


> flucastr-memory-ai@0.1.0 build
> tsc -p tsconfig.json

TAP version 13
# Subtest: CLI help documents only help and doctor
ok 1 - CLI help documents only help and doctor
  ---
  duration_ms: 29.777779
  type: 'test'
  ...
# Subtest: CLI doctor reports SQLite and FTS5 as JSON
ok 2 - CLI doctor reports SQLite and FTS5 as JSON
  ---
  duration_ms: 24.487646
  type: 'test'
  ...
# Subtest: unknown CLI command exits 2 and writes help to stderr
ok 3 - unknown CLI command exits 2 and writes help to stderr
  ---
  duration_ms: 23.531647
  type: 'test'
  ...
# Subtest: Node test runner executes scaffold assertions
ok 4 - Node test runner executes scaffold assertions
  ---
  duration_ms: 0.576671
  type: 'test'
  ...
# (node:2405296) ExperimentalWarning: SQLite is an experimental feature and might change at any time
# (Use `node --trace-warnings ...` to show where the warning was created)
# Subtest: probe opens SQLite, confirms FTS5, and closes cleanly
ok 5 - probe opens SQLite, confirms FTS5, and closes cleanly
  ---
  duration_ms: 1.789987
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
# duration_ms 129.511148

> flucastr-memory-ai@0.1.0 cli
> node dist/src/cli.js --help

Flucastr Memory AI diagnostic CLI

Usage:
  flucastr-memory-ai [--help]
  flucastr-memory-ai doctor

Commands:
  --help  Show this help
  doctor  Check SQLite and FTS5 availability

> flucastr-memory-ai@0.1.0 cli
> node dist/src/cli.js doctor

{"sqliteVersion":"3.51.3","fts5":true}
```
stderr (literal):
```text
(node:2405343) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:2405362) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```
Exit code: 0. Todas las cinco pruebas pasan; advertencia SQLite experimental observada.

## Notas
Se añadió `verify` con encadenamiento `&&`; README documenta instalación, importación del núcleo, CLI, verificación y matriz honesta de entornos. Sin corpus ni scripts/ modificados. macOS sigue pendiente por falta de acceso; Linux/WSL no acredita compatibilidad macOS. No se afirma validación de F02. Archivos: `package.json`, `README.md`, esta tarea.
Registro: n=1; herramienta=pi; modo=normal; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

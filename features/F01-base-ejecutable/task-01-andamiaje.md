# task-01 — Andamiaje reproducible TypeScript y pruebas
repo: Flucastr.Memory-AI   depende_de: —   estado: hecha

## Descripción
Crear una base que compile y ejecute pruebas sin implementar memoria.
Dejar una instalación reproducible y contratos de verificación consumibles por las tareas siguientes.
La selección de dependencias queda sustentada por documentación y ejecución, no por versiones supuestas.

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

## Pasos
1. Crear `package.json`: paquete privado, ESM, Node de referencia documentado; scripts `build` (compilar), `typecheck` (sin emitir), `test` (compilar y ejecutar pruebas compiladas con Node). Verificar documentación oficial de TypeScript y tipos Node y resolver versiones compatibles exactas; registrar URLs, versiones y resultado en Notas.
2. Crear `package-lock.json` mediante npm y `tsconfig.json` estricto, con fuentes/pruebas TypeScript y salida `dist/`; sin importar adaptadores desde el núcleo.
3. Crear `test/scaffold.test.ts`: prueba del runner sin datos de negocio, con aserción real y ejecución sin SQLite todavía.
4. Crear `.gitignore` para dependencias y compilados. Ejecutar instalación limpia, chequeo de tipos, compilación y pruebas; anotar comandos efectivos y versiones en Notas. Esta tarea admite cinco archivos de soporte más una prueba por ser el bootstrap indivisible.

## Criterios de aceptación
- Instalación reproducible desde lockfile: `npm ci` termina en cero.
- `npm run typecheck` y `npm run build` terminan en cero.
- `npm test` ejecuta al menos una prueba y termina en cero; no acepta cero pruebas como éxito.
- Dependencias exactas y evidencia oficial de compatibilidad quedan en Notas; sin dependencias HTTP/embeddings.

## Verificación
Comandos propuestos para ejecutar desde la raíz después de construir esta tarea; salida esperada: cero y etapas/pruebas indicadas arriba. No ejecutados ahora por ausencia de andamiaje.

```sh
npm ci
npm run typecheck
npm run build
npm test
```

## Evidencia
Entorno Linux: Node v22.23.2, npm 10.9.8. Verificación real (ejecutada en secuencia; todos los comandos terminaron en cero):

```text
$ npm ci
added 3 packages, and audited 4 packages in 2s
found 0 vulnerabilities

$ npm run typecheck
> tsc -p tsconfig.json --noEmit
(exit 0)

$ npm run build
> tsc -p tsconfig.json
(exit 0)

$ npm test
TAP version 13
# Subtest: Node test runner executes scaffold assertions
ok 1 - Node test runner executes scaffold assertions
1..1
# tests 1
# pass 1
# fail 0
(exit 0)
```

Documentación oficial consultada/verificada por HTTP 200: TypeScript docs https://www.typescriptlang.org/docs/ y fuente de tipos Node en DefinitelyTyped https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node. Versiones exactas resueltas y guardadas: TypeScript 5.9.3; @types/node 22.19.15. No hay dependencias de HTTP ni embeddings.

## Notas
TypeScript 5.9.3 y @types/node 22.19.15 instalados reproduciblemente desde lockfile; las páginas oficiales indicadas responden HTTP 200. Incluye package.json, package-lock.json, tsconfig.json, .gitignore, src/index.ts mínimo y test/scaffold.test.ts. El test solo valida aserción del runner, sin SQLite ni datos de negocio. Verificación en Linux/WSL solamente; no acredita macOS. Se creó `src/index.ts` como entrada vacía exportada para probar el pipeline, sin funcionalidades de memoria. No se tocaron scripts/. No se modificó el estado de los cambios preexistentes ajenos.
Registro: n=1; herramienta=pi; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

# task-01 — Documentar el funcionamiento y uso real del MVP
repo: Flucastr.Memory-AI   depende_de: —   estado: hecha

## Descripción
Explicar en README.md en español propósito y uso del núcleo local.
Mostrar componentes y flujos Mermaid fieles al código; distinguir implementado, sintético y pendiente.

## Contexto
- Tocar: `README.md`
- Leer README.md como única entrega y conservar sus advertencias de seguridad y recuperación, reubicándolas si mejora la lectura.
- Leer `package.json` (engines/scripts/exports), `tsconfig.json` (outDir), `src/index.ts` (`probeSqlite`, exportaciones), `src/cli.ts` (`help`, `runCli`), `src/memory.ts` (`MemoryInput`, `validate`, `openMemory`, `openAuthorizedMemory`, `search`) y `src/response.ts` (`serializeSearch`).
- Contrastar `src/remote-cli.ts` (`runRemoteCli`), `src/http-client.ts` (`postF03`), `src/http-server.ts` (`startLocalServer`); `test/remote-cli.test.ts` prueba CLI HTTPS en loopback, no Mac ni Pi. `test/f02-gate.test.ts` fija 30 recuerdos/10 consultas sintéticas y compara bytes, no ahorro real de tokens.
- Fuente: definitions/BACKLOG.md «Organización vigente y dependencias»
- PROJECT.md: solo si imprescindible, secciones «Problema», «Para quién», «Qué significa «funcionando»», «Alcance», «Restricciones» (líneas 3–49); contrastar observaciones antiguas con código. F04 no acredita semántica.
- No modificar STATUS ni leer históricos, tareas hechas, registro, credenciales o .env.
- Histórico: typecheck/ayuda/doctor exitosos (FTS5), Node v24.22.1/npm 11.19.1 fuera de engines; ayuda usó dist previo. No acredita compatibilidad ni resultados actuales.
- build/test/gates/verify existen en package.json: no ejecutados, resultado inferido. No ejecutarlos ni afirmar éxito.
- Requiere: ninguno

## Decisiones ya tomadas
- Franco autorizó continuar mediante cotejo documental sin instalar Node. Node/npm, dist y ejecución del producto no son precondiciones. No instalar/sustituir runtimes, compilar ni iniciar servicios. Estado preservado para el coordinador; único producto: README.md.
- Explicación para lector nuevo: problema → estado real → componentes → flujos → uso sintético local → verificación → límites y recuperación.
- Tres bloques Mermaid `flowchart TD`: componentes, escritura y búsqueda. Ruta local operativa CLI → librería → SQLite/FTS5; rama HTTPS claramente rotulada adaptador programático/ensayo loopback. Cliente remoto delgado existente no equivale a central remota ni integración de agente comprobada. No dibujar Mac/Pi conectados como operativos.
- Búsqueda léxica: palabras unidas por AND, candidatos no archivados del proyecto solicitado más general (general no incluye proyectos), FTS5 temporal y BM25 con desempate por ID, hasta 5 candidatos. Serialización JSON UTF-8 con salto final de hasta 4000 bytes, omitiendo registros enteros; vacío sin coincidencias. No embeddings, sqlite-vec ni RRF.
- Escritura: seis campos obligatorios, tipos y ámbitos válidos, fecha civil; ID repetido con contenido idéntico es idempotente, contenido distinto falla; transacción actualiza SQLite y FTS. Sustitución no archiva automáticamente al anterior; conflictos no se resuelven por fecha. Confirmaciones CLI locales no prueban identidad humana ni aislamiento administrativo.
- Quickstart únicamente sintético local con carpeta `mktemp -d`, JSON de seis campos (decision, project:Atlas, texto `synthetic memory`, fecha válida), save dos veces y search `synthetic`, consulta sin coincidencias, limpieza de la carpeta creada. Usar `npm run cli --`, después de instalar dependencias y compilar; no inventar bin instalado. Explicar que cada CLI cierra DB y la siguiente invocación la reabre.
- No proporcionar receta de despliegue, certificados o tokens remotos. Describir interfaz remota sin valores de credenciales. Preservar runbook sintético y límites RPO/RTO/custodia; quitar referencia rota a tarea histórica del README, sin leerla ni moverla.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Dentro: introducción, matriz implementado/validación sintética/pendiente, tres diagramas, ejemplo local seguro y comandos existentes con requisitos.
Fuera de alcance: código, dependencias, fixtures, definiciones, provisión, servicios, gates con listener, integración real Mac/Pi, datos reales, semántica, commits y despliegue. No reabrir F04/F05.

## Pasos
1. README.md: explicar propósito, destinatario y matriz de estado respaldada por código.
2. README.md: añadir tres diagramas; explicar ámbitos, persistencia, idempotencia, conflictos y salida; separar CLI local y ensayo HTTPS.
3. README.md: documentar engines/dependencias/build como requisitos del producto, no de esta entrega; ayuda/doctor y quickstart sintético con salidas esperadas por lectura. Instalación/build/ejemplo: no ejecutados.
4. README.md: conservar seguridad/recuperación; explicar scripts, OpenSSL y límites sintéticos. Quitar enlace histórico roto sin abrir archivos archivados.
5. Revisar diff, ejemplos, enlaces y diagramas contra código; registrar comprobaciones documentales y limitaciones sin ejecutar el producto.

## Criterios de aceptación
1. README explica qué es, destinatario, utilidad y estado actual; revisión manual confirma distinción implementado/sintético/pendiente sin afirmar central remota, Mac/Pi ni semántica operativos.
2. Tres diagramas Mermaid muestran componentes, escritura y búsqueda fieles a las firmas citadas; revisión textual confirma filtros antes de ranking y límites después de búsqueda.
3. Quickstart local sintético incluye JSON válido, comandos reales, idempotencia, búsqueda y limpieza limitada al temporal; cotejo manual con runCli/validate, sin datos reales ni secretos.
4. Seguridad y recuperación mantienen límites existentes; revisión manual no encuentra garantías de RTO, aislamiento o ahorro de tokens derivadas de pruebas locales, ni enlaces a tareas históricas inaccesibles.
5. Diff de producto limitado a README.md; git diff --check termina con código cero y el cotejo documental satisface los criterios 1–4; evidencia distingue comprobaciones realizadas de ejemplos y pruebas de runtime no ejecutados.

## Verificación
Desde la raíz, sin instalaciones ni ejecución del producto:
```sh
git diff --check
git diff -- README.md
grep -nE '^```mermaid|^```$|features/|npm run|mktemp|rm -rf|RTO|aislamiento|ahorro' README.md
```
Cotejar comandos/flags/JSON con package.json, runCli y validate; salidas con save/search/serializeSearch. Rotularlas esperadas por lectura, no ejecutadas. Enlaces: cotejar rutas locales activas/anclas con archivos/encabezados; quitar referencia histórica rota sin abrir el archivo. Externos: revisar destino, disponibilidad en red no comprobada. Diagramas: cotejo textual de tres flowchart TD, cierres, nodos/aristas y código (filtros antes de ranking, límites después). Sin exigir ni afirmar renderizado/parser no realizados. `npm run typecheck`, `npm run cli -- --help`, `npm run cli -- doctor`, instalación, build, quickstart, tests y gates: no ejecutados en esta entrega; registrar esa limitación sin exigir Node, dist, otro runtime o provisión. No afirmar éxito actual ni FTS5 comprobado en esta revisión.
Repetir ambos comandos git tras editar README.md; comprobados durante el ajuste. Runtime previo: histórico, no bloqueo documental.

## Evidencia
Resolución autorizada por Franco: se realizó cotejo documental estático sin instalar Node, compilar ni ejecutar el producto.

```
$ git diff --check
(sin salida)
exit 0
```

```
$ git diff -- README.md
Inspección del diff: único cambio de producto en README.md; añadió explicación del MVP, tabla de estado, tres diagramas Mermaid, quickstart sintético, requisitos y límites. Preservó secciones de seguridad/recuperación; eliminó el enlace histórico a una tarea inaccesible.
exit 0
```

```
$ grep -nE '^```mermaid|^```$|features/|npm run|mktemp|rm -rf|RTO|aislamiento|ahorro' README.md
Hallazgos: tres bloques Mermaid flowchart TD con fences balanceados; sin referencias a features/; quickstart usa npm run cli, carpeta mktemp y limpieza de esa ruta; advertencias de RTO, aislamiento y ahorro de tokens presentes.
exit 0
```
Comandos de runtime deliberadamente no ejecutados: `npm run typecheck`, `npm run cli -- --help`, `npm run cli -- doctor`, instalación, compilación, quickstart, pruebas y gates.

Cotejo estático de package.json, tsconfig.json, src/index.ts, src/cli.ts, src/memory.ts, src/response.ts, src/remote-cli.ts, src/http-client.ts y src/http-server.ts: comandos/requisitos coinciden con scripts y engines; salida esperada, JSON de seis campos, validación, persistencia transaccional, idempotencia, filtros/orden/límites de búsqueda y serialización contrastados con código. Búsqueda general solo incluye general; búsqueda de proyecto incluye proyecto más general; filtros y elegibilidad preceden al ranking, el límite de 5 sigue al ranking y serializeSearch omite registros completos sobre 4000 bytes.

Limitaciones: instalación, build, typecheck, help, doctor, quickstart, tests, gates, ejecución y renderizado Mermaid no realizados; ejemplos y salidas solo se documentan como esperados por lectura. Disponibilidad de enlaces externos no comprobada. No se afirma FTS5 comprobado en esta revisión. Inspección manual de cinco criterios satisfecha por contenido/diff; el código 0 de diff --check solo valida whitespace.

## Notas
Bloqueo histórico de entorno: resuelto para la entrega documental por autorización de Franco; no se instaló ni sustituyó runtime. Los cambios ajenos preexistentes en definitions/BACKLOG.md, definitions/STATUS.md y el directorio features/F07-readme-mvp no fueron editados; fuera de alcance. Rama creada: chore/F07-readme-mvp.
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

# task-04 — Fixture TLS efímera y matriz HTTP de extremo a extremo
repo: Flucastr.Memory-AI   depende_de: F03-task-03   estado: lista para revisión

## Descripción
Fixture TLS efímera y matriz HTTP de extremo a extremo. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `test/cli.test.ts` patrón de subprocesos; `test/memory.test.ts` temporales; `src/response.ts` límites; crear `test/f03-tls.ts`, `test/f03-http.test.ts`; tocar `README.md`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Generar CA y certificado servidor SAN IP:127.0.0.1 efímeros con OpenSSL en directorio temporal; claves nunca versionadas/impresas. OpenSSL 3.5.5 observado con `openssl version`. Cliente node:https confía solo en CA de fixture; nunca rejectUnauthorized:false ni NODE_TLS_REJECT_UNAUTHORIZED=0. Validar cliente sin CA y hostname incorrecto fallan. Solo Atlas/Birch en pruebas funcionales; sentinelas de ámbito no autorizado se construyen como entradas adversarias internas, no exploración de otros proyectos. No modificar corpus congelado fixtures/f02.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Crear helper TLS con generación silenciosa y limpieza incluso al fallar; comandos de generación se implementan en helper, no ejecutados durante planificación.
2. Ejecutar servidor real con SQLite temporal: save/retry/collision/search/conflict/replace, general compuesto, sin coincidencias, reinicio y salida multibyte con omisión íntegra.
3. Agregar matriz negativa de operaciones protegidas, permisos por referencias, proyectos no permitidos, auth inválida y errores; validar sin mutación, sin exposición de sentinelas.
4. Documentar prerrequisito OpenSSL y resultados solo sintéticos.

## Criterios de aceptación
1. TLS valida CA/identidad y rechaza confianza/hostname incorrectos sin desactivar verificación. Comprobar en las pruebas y revisión de diff de esta tarea.
2. Matriz recorre las cuatro rutas reales y todas las prohibiciones administrativas. Comprobar en las pruebas y revisión de diff de esta tarea.
3. HTTP search completo <=4000 bytes UTF-8 con LF y <=5 recuerdos íntegros. Comprobar en las pruebas y revisión de diff de esta tarea.
4. Fixture no deja secretos ni procesos/temporales al terminar. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
- Entorno: Node v22.23.2; OpenSSL 3.5.5. No se usaron datos ni clientes reales; pruebas HTTPS limitadas a 127.0.0.1 y SQLite temporal.
- `npm run typecheck && npm test && npm run cli -- --help` — pasa; 24/24 pruebas, incluyendo matriz HTTPS, validación CA/SAN, ausencia de CA y hostname incorrecto, salida UTF-8 y ayuda CLI.
- `git diff --check` — sin errores.
- En la ejecución inicial la suite quedó abierta tras una aserción de identidad TLS, sin proceso residual al recuperar control. Se añadió cierre en `finally`, se corrigió comprobación hostname vía resolución local y se repitió la verificación completa con éxito; ejecución aislada de `test/http-server.test.js`: 2/2.

## Notas
Implementados `test/f03-tls.ts` y la matriz `test/http-server.test.ts`: CA/certificado SAN efímeros firmados, se confía solo en la CA de test; no hay desactivación TLS. Cobertura de save/retry/collision/search/replacement/conflict, allowlist/referencias, rutas protegidas cerradas, autenticación inválida y errores. Respuesta search serializada mantiene <=4000 bytes y LF, omitiendo recuerdos Unicode completos. README documenta OpenSSL en PATH. Claves temporales bajo carpeta de sistema temporal eliminada en finally; cierre de servidor y store probado; no se imprimen claves/certificados. Se preservaron cambios ajenos preexistentes en `definitions/STATUS.md` y `features/F03-http-local/task-03-transporte.md`; no se tocaron. Registro: n=1; herramienta=pi; modo=normal; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

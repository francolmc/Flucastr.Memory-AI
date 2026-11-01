# Estado del flujo

## Escalación

## Paso actual
- Puerta 4: F03 task-08 lista para revisión; constructor reporta 30/30 pruebas, gate F03 12/12 y verify correctos.
- Tarea: features/F03-http-local/task-08-gate.md
Rama: feature/F03-http-local

## Espera a Franco
- Feature F02 completa en feature/F02-memoria-local: cierra la rama, haz el PR y despliega.
- Políticas locales, rotación y recuperación aprobadas en conversación; destino real y custodia pendientes antes de uso real.
- Política aprobada: sin tickets, administración separada y pausa de escrituras; no se acredita aislamiento del entorno actual.
- Revisar Evidencia en features/F03-http-local/task-08-gate.md y diff de package.json, README.md y test/f03-gate.test.ts.
- Hacer commit en feature/F03-http-local y confirmar task-08 hecha; scripts/ sin cambios. F03 aún sin cierre aprobado.
- Gate F03 integrado en verify conservando F02; evidencia exclusivamente sintética en loopback, no habilita uso remoto real.
- Ensayo sintético sin acreditar aislamiento del shell, borrado físico ni RTO real; destino independiente, cifrado y custodia pendientes.
- Copias probadas en destino sintético temporal; no acreditan independencia física ni RTO real de cuatro horas.
- features/F03-http-local/task-01-autorizacion.md
- features/F03-http-local/task-02-credenciales.md
- features/F03-http-local/task-03-transporte.md
- features/F03-http-local/task-04-tls-e2e.md
- features/F03-http-local/task-05-durabilidad.md
- features/F03-http-local/task-06-copias.md
- features/F03-http-local/task-07-restauracion.md
- features/F03-http-local/task-08-gate.md
- Chequeo de contexto: `node scripts/archivar.mjs`
- Pruebas: destino temporal sintético, sin garantía ante pérdida de disco. Destino real y custodia no especificados; diferir uso real.
- Identidad compartida aprobada; sin atribución fiable por cliente ni aislamiento acreditado frente al shell.
- Registro de eventos: `node scripts/registrar.mjs` antes de archivar; lo corre Franco o, si lo pide, el coordinador; no bloquea.
- Feature F02 archivable: `node scripts/archivar.mjs --aplicar F02` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- Commit de task-01 no confirmado; los commits los realiza Franco.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F01 archivable: `node scripts/archivar.mjs --aplicar F01` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- macOS sigue pendiente; validación realizada en Linux.

## Bloqueos abiertos


## Última actualización
- 2026-11-01

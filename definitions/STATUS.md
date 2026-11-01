# Estado del flujo

## Escalación

## Paso actual
- F03 hecha en BACKLOG por aprobación explícita de Franco; alcance local sintético. Pausa hasta PR, sin avanzar F04.
- Tarea: features/F03-http-local/task-08-gate.md
Rama: feature/F03-http-local

## Espera a Franco
- Feature F02 completa en feature/F02-memoria-local: cierra la rama, haz el PR y despliega.
- Políticas locales, rotación y recuperación aprobadas en conversación; destino real y custodia pendientes antes de uso real.
- Política aprobada: sin tickets, administración separada y pausa de escrituras; no se acredita aislamiento del entorno actual.
- Feature F03 completa en feature/F03-http-local: cierra la rama, haz el PR y despliega.
- Despliegue real fuera del alcance aprobado: no habilitar acceso remoto ni datos reales; pendientes operativos siguen vigentes.
- Franco hará el PR de feature/F03-http-local y avisará; no planificar F04 ni mover la marca siguiente hasta entonces.
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

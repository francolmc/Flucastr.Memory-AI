# Estado del flujo

## Escalación

## Paso actual
- Pausa solicitada por Franco: hará primero el PR de F02. F03 conserva ocho tareas en borrador, sin construcción.
Rama: feature/F02-memoria-local

## Espera a Franco
- Feature F02 completa en feature/F02-memoria-local: cierra la rama, haz el PR y despliega.
- Aprobar key compartida y rotación 30 días/gracia máxima 24 h; confirmar aprobación humana separada para acciones protegidas.
- Aprobar cobertura HTTP de gestión existente y pruebas locales en loopback; remoto privado y clientes reales siguen pendientes.
- Decidir RPO 24 h o menor, RTO objetivo 4 h, retención 7 diarias + 4 semanales; indicar destino independiente y custodia de cifrado.
- Política aprobada: sin tickets, administración separada y pausa de escrituras; no se acredita aislamiento del entorno actual.
- Franco hará primero el PR de feature/F02-memoria-local; esperar su aviso antes de retomar aprobación de tareas F03.
- Después revisar features/F03-http-local/refinado.md y aprobar tareas individualmente, empezando por task-01.
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
- Confirmar identidad compartida aceptando revocación conjunta y sin atribución fiable; políticas concretas siguen por aprobar.
- Registro de eventos: `node scripts/registrar.mjs` antes de archivar; lo corre Franco o, si lo pide, el coordinador; no bloquea.
- Feature F02 archivable: `node scripts/archivar.mjs --aplicar F02` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- Commit de task-01 no confirmado; los commits los realiza Franco.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F01 archivable: `node scripts/archivar.mjs --aplicar F01` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- macOS sigue pendiente; validación realizada en Linux.

## Bloqueos abiertos


## Última actualización
- 2026-11-01

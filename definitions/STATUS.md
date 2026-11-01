# Estado del flujo

## Escalación


## Paso actual
Modo yolo: detenido (pendiente reactivación tras subsanar evidencia) — alcance F01; rama feature/F01-base-ejecutable
- task-01: hecha | features/F01-base-ejecutable/task-01-andamiaje.md
- task-02: hecha | features/F01-base-ejecutable/task-02-sonda-sqlite.md
- task-03: hecha por confirmación explícita de Franco | features/F01-base-ejecutable/task-03-cli-diagnostico.md
- task-04: hecha | features/F01-base-ejecutable/task-04-verificacion-entornos.md
- Puerta 3: F02 descompuesta en siete tareas en borrador; ninguna ejecutada. Esperar PR de F01 antes de construir.
Rama: feature/F01-base-ejecutable

## Espera a Franco
- Feature F01 completa en feature/F01-base-ejecutable: cierra la rama, haz el PR y despliega.
- Cambio de requisito aprobado explícitamente: gate sintético de MVP, no medición real; sin rutas autorizadas a otros proyectos.
- Avisar a Franco antes de ejecutar tareas F02 para que haga el PR de F01; esperar su confirmación antes de construir.
- Aprobar individualmente: features/F02-memoria-local/task-01-corpus.md.
- Aprobar individualmente: features/F02-memoria-local/task-02-persistencia.md.
- Aprobar individualmente: features/F02-memoria-local/task-03-ciclo-vida.md.
- Aprobar individualmente: features/F02-memoria-local/task-04-busqueda.md.
- Aprobar individualmente: features/F02-memoria-local/task-05-salida.md.
- Aprobar individualmente: features/F02-memoria-local/task-06-cli.md.
- Aprobar individualmente: features/F02-memoria-local/task-07-gate.md.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F01 archivable: `node scripts/archivar.mjs --aplicar F01` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- macOS sigue pendiente; validación realizada en Linux.

## Bloqueos abiertos


## Última actualización
- 2026-11-01

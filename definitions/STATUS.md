# Estado del flujo

## Escalación


## Paso actual
Modo yolo: detenido (pendiente reactivación tras subsanar evidencia) — alcance F01; rama feature/F01-base-ejecutable
- task-01: hecha | features/F01-base-ejecutable/task-01-andamiaje.md
- task-02: hecha | features/F01-base-ejecutable/task-02-sonda-sqlite.md
- task-03: hecha por confirmación explícita de Franco | features/F01-base-ejecutable/task-03-cli-diagnostico.md
- task-04: hecha | features/F01-base-ejecutable/task-04-verificacion-entornos.md
- Arquitecto: incorporar cambio de gate F02 aprobado por Franco: corpus sintético versionado y baseline del mismo corpus.
Rama: feature/F01-base-ejecutable

## Espera a Franco
- Feature F01 completa en feature/F01-base-ejecutable: cierra la rama, haz el PR y despliega.
- Cambio de requisito aprobado explícitamente: gate sintético de MVP, no medición real; sin rutas autorizadas a otros proyectos.
- Tras alinear definición, planificador descompone F02 con las cinco respuestas de Franco; tareas requerirán aprobación individual.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F01 archivable: `node scripts/archivar.mjs --aplicar F01` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- macOS sigue pendiente; validación realizada en Linux.

## Bloqueos abiertos


## Última actualización
- 2026-11-01

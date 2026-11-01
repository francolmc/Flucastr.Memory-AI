# Estado del flujo

## Escalación


## Paso actual
- Planificador: descomponer-feature F03; F02 hecha en backlog por confirmación explícita de Franco. Mover marca siguiente a F03.
Rama: feature/F02-memoria-local

## Espera a Franco
- Feature F02 completa en feature/F02-memoria-local: cierra la rama, haz el PR y despliega.
- Revisar tareas F03 o responder refinado cuando vuelva el planificador; no hay autorización de construcción.
- Chequeo de contexto: `node scripts/archivar.mjs`
- Registro de eventos: `node scripts/registrar.mjs` antes de archivar; lo corre Franco o, si lo pide, el coordinador; no bloquea.
- Feature F02 archivable: `node scripts/archivar.mjs --aplicar F02` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- Commit de task-01 no confirmado; los commits los realiza Franco.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F01 archivable: `node scripts/archivar.mjs --aplicar F01` tras PR, por Franco o a su pedido, en commit propio `chore/`.
- macOS sigue pendiente; validación realizada en Linux.

## Bloqueos abiertos



## Última actualización
- 2026-11-01

# task-03 — Acreditar herramientas locales sin adquisición implícita
repo: Flucastr.Memory-AI   depende_de: —   estado: borrador

## Descripción
Preparar un único gate local para construir el cliente sin tocar infraestructura. Cerrar con herramientas verificables o bloqueo, nunca instalar por inferencia.

## Contexto
Leer package.json scripts/engines, tsconfig.json y refinado.md §Inspección de continuación. Tocar solo features/F05-claude-code-fts5/herramientas.md (archivo nuevo). Confirmado: Node v22.23.2; typecheck falla por tsc ausente.
- Tocar: `features/F05-claude-code-fts5/herramientas.md`
- Fuente: definitions/PROJECT.md «Dirección central actualizada — confirmación y presupuesto aprobados para planificar»
- Referencia: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»

## Decisiones ya tomadas
Leer `features/F05-claude-code-fts5/refinado.md` §§Continuación autorizada para planificar — decisiones 1=A y 2=A e Inspección de continuación — evidencia y límite. Decisiones confirmadas, no supuestos: F03 en 127.0.0.1, reenvío restringido condicionado y CA privada humana; HTTPS validado/auth F03, central única y sin DB cliente. Si inviable, parar y consultar. Sin certificados públicos, CT inferido, Funnel, TLS inseguro ni alternativa automática. Atlas/Birch e identidad compartida permanecen; acciones protegidas cerradas por HTTP.
Cada A/B conserva una ronda, un lote acotado y una reverificación globales; subdividir tareas no amplía topes. R requiere presupuesto y permisos propios. Documentación no es evidencia funcional. Esta tarea es borrador: el encargo actual solo autoriza planificar.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Ejecutor: constructor tras aprobación de esta tarea; solo inspección local. Fuera de alcance: instalación, descarga, red, build, servicio y cambios de lockfile.

## Pasos
1. En herramientas.md registrar versiones y resultado de typecheck sin alterar dependencias.
2. Si sigue faltando tsc, documentar permiso de adquisición pendiente y detener; no crear receta de instalación no inspeccionada.
3. Si las herramientas ya fueron provistas mediante encargo separado, registrar procedencia sanitizada y gate local satisfecho.

## Criterios de aceptación
1. Ficha distingue herramientas presentes de ausentes por salida observada.
2. Ninguna adquisición o modificación de producto; gate bloqueado cuando typecheck no termina con 0.

## Verificación
`node --version` ejecutado en planificación: v22.23.2. `npm run typecheck` ejecutado: falla tsc: not found. Repetir solo tras aprobación; esperado Node dentro de engines y typecheck 0. Revisión manual de herramientas.md; no existe scripts/validar-tarea.mjs en este repo.

## Evidencia
(lo llena el constructor; evidencia sanitizada, permisos y comandos no ejecutados separados)

## Notas
(lo llena el constructor; resultado, brecha mínima y siguiente gate, sin secretos)

---
estado: borrador
rama: feature/inicio-agentes
repos: [.]
ejecutor: constructor
---
# S5 — Inicio de agentes y MVP

## Objetivo
Conservar S5 pendiente de `old/v1/definitions/BACKLOG.md`: recuperar memoria al iniciar Claude Code/Pi y documentar el MVP entre Mac y WSL.

## Supuestos
- Se entregan integraciones y ejemplos versionados, no se modifican configuraciones personales. Si se pide instalarlas, requiere autorización y acceso aparte.

## Alcance
Nuevos archivos de integración/snippets y pruebas, `README.md`, `AGENTS.md`, `docs/proyecto.md` y verify/auxiliares futuros. Fuera: leer o editar credenciales/configuración personal, despliegue y old/v1.

## Decisiones ya tomadas
- Ejecutor: constructor; no se ha pedido ejecución por el principal. Antes de aprobar, investigar mecanismos soportados y cerrar decisiones de integración para pasar la prueba de ejecutabilidad.
- Depende de verify y S2–S4. Fuente: `old/v1/definitions/ARCHITECTURE.md`, Integración y operación objetivo.
- Claude SessionStart consulta recent para scope Git; sin datos o servidor termina silenciosamente sin bloquear sesión.
- El guardado desde Claude es explícito: el agente guarda una decisión cuando Franco se lo pide.
- La captura automática de decisiones queda como feature posterior, fuera de S5 y del MVP; requiere plan y aprobación propios.
- Pi requiere inicio equivalente explícito, sin MCP. No inventar hooks: consultar documentación vigente de ambos agentes antes de elegir implementación.
- Entregar snippet para settings.json de Claude, bloques de cinco líneas CLAUDE.md/AGENTS.md y README de menos de 100 líneas; no sobrescribir archivos personales.
- El MVP remoto lo valida Franco; pruebas locales no se presentan como evidencia Mac/WSL.

## Escenarios
- CUANDO inicia sesión en un proyecto ENTONCES inyecta recientes del ámbito más general sin incluir otros proyectos.
- CUANDO no hay memorias o el servicio está caído ENTONCES Claude no imprime nada y no bloquea inicio.
- CUANDO Franco guarda una decisión desde Claude Mac y abre Pi WSL en el mismo repo ENTONCES aparece sin copiar/pegar.

## Verificación
`./verify` — probar integraciones locales con servidor real y ausencia de datos/servidor; MVP entre máquinas requiere evidencia manual adicional de Franco.

## Pasos
- [ ] Consultar documentación oficial vigente de SessionStart y extensiones/inicio Pi; registrar mecanismos soportados y cualquier decisión necesaria antes de implementar.
- [ ] Crear integraciones y snippets usando cliente S3; comprobar filtrado, silencio y no bloqueo sin acceder a configuraciones personales.
- [ ] Actualizar README obsoleto a menos de 100 líneas y contexto duradero, separando capacidad probada de instalación pendiente.
- [ ] Extender verify y entregar pasos del MVP para Franco con espacios para evidencia real Mac/WSL (≈5 min local).

## Evidencia
README leído al migrar: describe estado previo y runtime Node 22, frente al Node 24 actual. No se ejecutó integración ni prueba remota.

## Notas
Se conserva la fila entera sin dividirla. Si hace falta partición o una elección de mecanismo cambia el comportamiento, queda pendiente de decisión de Franco antes de ejecutar.

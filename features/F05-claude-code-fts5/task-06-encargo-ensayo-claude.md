# task-06 — Preparar ensayo B sintético con gates, sin ejecutarlo
repo: Flucastr.Memory-AI   depende_de: task-04   estado: borrador

## Descripción
Separar evidencia local del adaptador de la prueba humana Claude Code Mac. Preparar una ficha de autorización y captura futura sin inventar opciones de Claude ni atribuir integración a documentos.

## Contexto
Leer recorrido.md y aceptacion.md completos; refinado.md; interfaz remota especificada en esta tarea y evidencia de task-04 solo Notas. Leer provision-humana.md cuando exista para gates, no resultados inferidos. Tocar solo features/F05-claude-code-fts5/ensayo-sintetico.md (nuevo).
- Tocar: `features/F05-claude-code-fts5/ensayo-sintetico.md`
- Fuente: definitions/PROJECT.md «Dirección central actualizada — confirmación y presupuesto aprobados para planificar»
- Referencia: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»
Leer solo Notas de task-04; si no contienen evidencia habilitante suficiente, detener la ejecución dependiente.

## Decisiones ya tomadas
Leer `features/F05-claude-code-fts5/refinado.md` §§Continuación autorizada para planificar — decisiones 1=A y 2=A e Inspección de continuación — evidencia y límite. Decisiones confirmadas, no supuestos: F03 en 127.0.0.1, reenvío restringido condicionado y CA privada humana; HTTPS validado/auth F03, central única y sin DB cliente. Si inviable, parar y consultar. Sin certificados públicos, CT inferido, Funnel, TLS inseguro ni alternativa automática. Atlas/Birch e identidad compartida permanecen; acciones protegidas cerradas por HTTP.
Cada A/B conserva una ronda, un lote acotado y una reverificación globales; subdividir tareas no amplía topes. R requiere presupuesto y permisos propios. Documentación no es evidencia funcional. Esta tarea es borrador: el encargo actual solo autoriza planificar.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Constructor redacta, Franco opera Mac tras autorización propia. Fuera de alcance: ejecutar Claude, central, redes, copias de DB, datos reales, explorar Flucastr.AI y cambiar allowlist.

## Pasos
1. En ensayo-sintetico.md exigir cierre operativo A acreditado, cliente local verificado, permiso Mac y versión/ayuda reales de Claude aportadas por Franco; sin cualquiera, ensayo bloqueado. Esta dependencia operativa adicional no la satisface task-05 documental.
2. Trasladar corpus literal y matriz de recorrido.md/aceptacion.md: guardar tres objetos, reintento/collision, scopes/vacío, reinicio central, sesión nueva y recuperar Atlas sin respuesta en prompt, uso Lumen-7 con cita b-atlas-001. Registrar identidad de central sin datos de infraestructura sensibles; nunca DB Mac.
3. Documentar invocación remota a partir de help de task-04; valores humanos de origen y rutas públicas/secretas se proporcionan fuera de ficha. Sin comandos literales Claude/versiones acreditadas no pasar gate operativo; emitir brecha, no ensayar.
4. Separar resultados cliente de regresiones de archivados/conflictos/serialización. Exigir captura sintética completa con bytes UTF-8 incluido salto, códigos y sanitización; un contador B de ronda/lote/reverificación, sin reiniciarlo por corregir ficha.

## Criterios de aceptación
1. Ficha cubre seis criterios B y ciclo guardar/reiniciar/sesión nueva/recuperar/usar.
2. Permisos y A operativo son gates explícitos; documentación A no basta.
3. Versiones/opciones desconocidas bloquean operación, no se inventan.
4. Matriz distingue cliente/regresión/no acreditado y no contiene secretos ni datos reales.

## Verificación
Revisión manual contra recorrido.md y las seis filas de aceptacion.md. Pruebas Claude/Mac/remotas: no ejecutado, inferido como protocolo futuro condicionado; no hay comando Claude validado. Help remoto futuro `node dist/src/remote-cli.js --help`, no ejecutado, inferido hasta task-04; no ejecutar ahora.

## Evidencia
(lo llena el constructor; evidencia sanitizada, permisos y comandos no ejecutados separados)

## Notas
(lo llena el constructor; resultado, brecha mínima y siguiente gate, sin secretos)

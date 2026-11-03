# task-02 — ficha documental B y transición agrupada R
repo: Flucastr.Memory-AI   depende_de: task-01   estado: lista para revisión

## Descripción
Dejar listo el protocolo del primer cliente y la ficha agrupada posterior de habilitación real.
Esta tarea documental no exige Mac, central operativa ni credenciales; no entrega integración por escribir un protocolo.
Separa preparación documental de provisión humana y de futuras pruebas autorizadas, sin ciclos abiertos.

## Contexto
De task-01 leer solo Notas; usar su salida propuesta `features/F05-claude-code-fts5/acceso.md` como ficha, no como certificado de central habilitada. Leer `features/F05-claude-code-fts5/refinado.md`.
Código leído: `src/cli.ts`, `runCli(args: string[]): number` usa --db y no dispone de cliente HTTP; `src/http-server.ts`, `startLocalServer(options: LocalServerOptions)`, POST /v1/memories con {memory}, /v1/search con {scope,query}, /v1/replacements con {memory,previousId}, /v1/conflicts con {ids}; `src/http-auth.ts`, `createHttpAuthenticator(options: AuthOptions)` usa Bearer. `package.json` verify incluye gates F02/F03. Ninguna capacidad HTTPS cliente se da por existente.
Crear solo `features/F05-claude-code-fts5/recorrido.md` y `features/F05-claude-code-fts5/aceptacion.md` (matriz B y ficha R). Rutas nuevas propuestas; no modificar producto ni definitions.
- Fuente: definitions/PROJECT.md «Primera versión Tailscale — aprobación vigente; borrador de fidelidad»
- Fuente: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»
Comandos futuros no ejecutados, inferidos de package.json.

## Decisiones ya tomadas
Rige refinado.md. B documental depende de ficha A; operación requiere central privada acreditada y permiso explícito. CLI → HTTPS validado/auth F03 → misma central, sin SQLite cliente. Franco opera Mac; constructor guía y solo ejecuta controles delegados. No inventar opciones HTTP ni comandos Claude: fijarlos tras acreditar herramientas en tarea operativa aprobada antes de ensayar.

## Alcance / Fuera de alcance
Dentro: protocolo sintético prefijado, matriz y ficha agrupada R lista para completar con evidencia posterior.
Fuera: implementar adaptador, probar Mac, instalar, explorar Flucastr.AI, datos reales, cambiar allowlist, copiar DB, semántica/F04, otros clientes, hooks/MCP/extracción. No crear tareas operativas ni simular evidencia ahora.

## Pasos
1. En recorrido.md registrar estado inicial y gates B: evidencia A de central privada LAN/exterior, TLS/auth y persistencia/denegaciones; permiso explícito de integración/ensayo Mac con operador Franco; versión/ayuda del cliente disponibles y acceso autorizado; CLI HTTPS implementada/verificada en encargo propio, sin --db cliente. Falta de gate impide operación, no cierre documental.
2. Prefijar tres objetos sintéticos de exactamente id/type/scope/text/origin/date, tipo decision, scopes general/project:Atlas/project:Birch, IDs distintos y fecha civil fija válida. Término único común; decisión Atlas prescribe nombre ficticio de artefacto. No tocar corpus/benchmark congelados. Escribir las cargas JSON concretas en la guía, sin secretos.
3. Describir protocolo futuro: guardar los tres; reintentar Atlas idéntico; colisionar mismo ID/texto diferente y comprobar rechazo sin mutación; cerrar proceso y abrir sesión Claude nueva sin historial. Recuperar Atlas vía CLI HTTPS y pedir respuesta que cite ID y aplique nombre recuperado, sin incluir respuesta en prompt. Misma central antes/después; nunca base cliente.
4. En aceptacion.md crear seis filas B: persistencia/ID/contenido; idempotencia/colisión; ámbitos/referencias; vacío/archivados/conflictos humanos; cinco recuerdos/4000 bytes completos UTF-8 y salto final; invocación y uso desde Claude. Para cada una fijar entrada/resultado esperado, evidencia futura, operador y distinción cliente/regresión/no acreditado. Atlas incluye general no Birch, Birch incluye general no Atlas, general solo general; sin coincidencias = memories vacío. Archivados/conflictos humanos y omisión de recuerdos grandes pueden acreditarse mediante regresiones separadas, no atribuirlos al cliente.
5. Fijar evidencia futura sanitizada: versiones, comandos exactos no secretos, códigos y stdout completo sintético; salida <=5 recuerdos, <=4000 bytes UTF-8 incluyendo salto final, íntegra sin truncar. Conteo con Buffer.byteLength(texto, 'utf8'); no registrar tokens, claves, conversaciones o configuraciones privadas. Una ronda B, un lote acotado y una reverificación, separado de A; detener por brecha/ampliación, sin cambiar gates.
6. En aceptacion.md incluir una única ficha R con columnas control/evidencia disponible/brecha/acción/responsable/permiso/criterio de cierre. Filas obligatorias: aislamiento efectivo de cuenta/instalación/datos administrativos frente al agente y shell (interoperabilidad Windows incluida), pausa de escrituras; copia independiente cifrada/custodio/recuperación de claves; rotación 30 días/gracia <=24 h y revocación inmediata; restauración RPO <=24 h/RTO objetivo 4 h y copias diarias/7 diarias+4 semanales; saneamiento y copias afectadas; propuesta mínima de contenidos/ámbitos Flucastr.AI con allowlist/datos explícitamente autorizados. Franco decide/administra, constructor solo controles delegados. Marcar lo ausente pendiente, nunca habilitado.
7. Cerrar ficha R con propuesta de una intervención posterior limitada a un contexto y un ciclo real, una pasada de controles, un lote acotado y una reverificación, pendiente de aprobación de alcance/tope económico/permisos. No hereda rondas A/B. Al cierre operativo A/B, actualizar una sola ficha R con brechas exactas y acciones agrupadas; aislamiento/recuperación imposibles = bloqueo con requisito mínimo/contexto alternativo sujeto a decisión. Primer guardar/recuperar/usar real solo con R satisfecho y permiso expreso de datos/ámbitos; no explorar Flucastr.AI por inferencia.

## Criterios de aceptación
1. recorrido.md contiene gates verificables y separa CLI local existente de cliente HTTPS pendiente; revisión manual, sin exigir Mac para cerrar documentación.
2. Protocolo contiene objetos concretos, reinicio/sesión nueva y uso observable de recuerdo sin respuesta en prompt; revisión del texto, no afirmación de ensayo.
3. Seis filas B tienen esperados/evidencia/operador y distinguen regresión de cliente; revisión manual de contratos y límites.
4. Ficha R contiene todos los controles del paso 6, brechas y propuesta de alcance/tope no aprobada, sin allowlist real inferida ni datos explorados; revisión manual.
5. Documentos dicen documentación lista, integración/uso real pendientes; topes y parada son explícitos y ningún criterio obliga a credenciales o permisos inexistentes.

## Verificación
Revisión manual de los cinco criterios contra acceso.md/refinado.md; registrar resultado documental real en Evidencia. No ejecutar comandos operativos para cerrar esta tarea.

### Pruebas futuras condicionadas — no aceptación ni pasos ejecutables ahora
Tras gates y tarea operativa propia aprobada, Franco ejecutará protocolo Mac con comandos literales del cliente y adaptador acreditados y autorizados; no usar save/search --db en Mac como sustituto. La tarea futura debe incorporar esos comandos reproducibles antes de iniciar, no improvisarlos durante la ronda.
`npm run verify` es regresión existente futura, esperada código 0 (no ejecutado, inferido); no demuestra uso cliente ni aislamiento. Matriz B se verifica con transcripción sintética y códigos; toda evidencia ausente sigue no acreditada. Agotado lote/reverificación o falta de permisos/seguridad, cerrar bloqueo y presentar ficha R agrupada, no investigar indefinidamente. Diseño, loopback, Mac sintético y uso real son cuatro niveles distintos.

## Evidencia
Revisión documental manual contra `acceso.md` y `refinado.md`, sin comandos operativos (Verificación prescribe únicamente revisión manual): (1) `recorrido.md` enumera gates B de central privada LAN/exterior, TLS/auth, persistencia/denegaciones, permiso Mac, cliente/versiones y CLI HTTPS; distingue CLI `--db` local existente de adaptador HTTPS pendiente; gates ausentes bloquean operación, no cierre documental. (2) Incluye tres JSON de exactamente seis campos, IDs distintos, tipo decision, scopes general/project:Atlas/project:Birch, fecha fija válida y término común `quartz`; protocolo incluye reintento idéntico, colisión sin mutación, cierre y nueva sesión sin historial, recuperación HTTPS, uso/cita observable de ID sin respuesta en prompt y central única, sin DB cliente. (3) `aceptacion.md` contiene las seis filas B con entrada/esperado/evidencia/operador y distingue cliente de regresión/no acreditado; especifica ámbitos, vacío y límites de recuerdos/bytes. (4) Ficha R única contiene los seis controles obligatorios, ausencias como pendientes, responsabilidades/permisos/cierre; propuesta mínima y allowlist no se infieren ni se exploran datos. (5) Ambos documentos declaran trabajo documental listo y operación pendiente; expresan límites, parada, topes y no autorización de actividad futura. PROJECT §Primera versión Tailscale, ARCHITECTURE §Primera versión Tailscale y camino finito a uso útil, `acceso.md` y `refinado.md` consultados. No se ejecutaron comandos operativos ni hay transcripción, provisión o evidencia de uso real.

## Notas
Sin huecos menores. `recorrido.md` y `aceptacion.md` son documentación; no acreditan central remota, cliente, Mac ni uso real. Pendientes: gates A, adaptador/cliente HTTPS, permiso y tarea operativa propia; ficha R y alcance/tope posterior requieren decisión y permisos propios. Decisión conservadora: comandos/opciones Claude quedan sin fijar hasta acreditar versión/ayuda y adaptador autorizado, según tarea. Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

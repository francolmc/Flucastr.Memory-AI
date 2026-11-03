# task-01 — ficha documental A del habilitante central
repo: Flucastr.Memory-AI   depende_de: —   estado: aprobada

## Descripción
Entregar una ficha lista para decidir provisión y futura validación central.
El objetivo de esta tarea es exclusivamente documental y cabe sin acceso al anfitrión o Mac.
Una fila bloqueada documentada satisface completitud de la ficha, no habilitación central.

## Contexto
Leer `features/F05-claude-code-fts5/refinado.md` y las secciones Fuente.
Código leído: `src/http-server.ts`, `startLocalServer(options: LocalServerOptions)` escucha 127.0.0.1 y exige TLS; `src/http-auth.ts`, `createHttpAuthenticator(options: AuthOptions)`; `src/cli.ts`, `runCli(args: string[]): number`, solo --db local. `package.json` declara verify/gate:f02/gate:f03, Node >=22.23.2 <23. No existe scripts/ ni AGENTS.md raíz. No hay lanzador remoto acreditado.
Única salida nueva propuesta: `features/F05-claude-code-fts5/acceso.md`. No tocar producto ni definitions.
- Fuente: definitions/PROJECT.md «Primera versión Tailscale — aprobación vigente; borrador de fidelidad»
- Fuente: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»
No se ejecutaron comandos operativos por prohibición del encargo. Comandos futuros inferidos desde package.json, no resultados.

## Decisiones ya tomadas
Rige refinado.md. Candidato Windows/WSL, Tailscale gestionado en Windows recomendado, HTTPS F03 conservado y única DB central. Franco administra/custodia/prueba Mac. No elegir vía Windows→WSL ni certificados por suposición: la ficha debe mostrar alternativas técnicas mínimas pendientes y requisito de evidencia, no exigir implementación para cerrarse.

## Alcance / Fuera de alcance
Dentro: ficha y matriz prefijadas, inventario de brechas y propuesta agrupada de acciones humanas.
Fuera: inspeccionar equipos, instalar, descargar, crear cuenta, preparar, abrir red, emitir certificados, pedir secretos, construir lanzador/adaptador o ejecutar pruebas. Uso real y R no se habilitan aquí.

## Pasos
1. En acceso.md registrar declaraciones confirmadas (Windows 11/Ubuntu WSL, 16 GiB, 24/7, >10 GB reservables, Franco responsable), sin convertirlas en mediciones. Separar confirmado, inferido y pendiente.
2. Crear matriz con columnas control, estado de evidencia, evidencia sanitizada disponible, brecha, acción humana, responsable, permiso requerido y prueba futura. Filas: WSL/Ubuntu/arquitectura/runtime; RAM/disco efectivo y reserva con crecimiento/temporales/copias; continuidad/arranque; plan/elegibilidad/coste; cuenta/recuperación/enrolamiento; Windows→WSL/firewall LAN y exterior; TLS/nombre/emisión/confianza/renovación; auth F03/allowlist/referencias; custodia/frontera administrativa; persistencia/denegaciones/recuperación. Ausencia se rotula pendiente, no fallo observado.
3. Identificar bloqueo técnico inicial: F03 liga loopback y CLI abre DB local. Enumerar futuro trabajo acotado de lanzamiento/exposición privada restringida y cliente HTTPS, sin presentarlo disponible ni autorizar cambios. Si excede lote/topes, pedir decisión agrupada antes de operación.
4. Redactar lista humana para autorización agrupada: Franco confirma condiciones/plan y techo de gasto antes de alta; autoriza y asigna cuenta, instalación/enrolamiento, red/WSL/firewall, TLS/confianza, credenciales y preparación/ensayo. Secretos bajo custodia humana; evidencia solo versiones, códigos y resultados sin tokens/configuraciones privadas. Certificados públicos exigen consentimiento informado específico.
5. Fijar gates y matriz operativa futura descritos abajo; cerrar con documentación lista y habilitación pendiente, brechas y siguiente paso. Contador A no iniciado; documentación no acredita ronda técnica ni consume una por inferencia.

## Criterios de aceptación
1. acceso.md distingue todas las declaraciones de las mediciones ausentes; revisión manual fila por fila.
2. Matriz contiene las once familias del paso 2 y cada brecha tiene responsable/permiso/prueba, sin secretos; revisión manual.
3. Limitaciones loopback/CLI local están trazadas al código y ningún resultado privado se atribuye a F03 hecha; revisión de firmas citadas.
4. Lista humana y gates impiden operar con autorización documental solamente, incluyendo consentimiento TLS público; revisión manual.
5. Ficha cierra con siguiente acción agrupada y presupuesto A finito; no requiere acceso Mac ni provisión para satisfacer estos criterios.

## Verificación
Revisión documental manual de los cinco criterios y coincidencia con refinado.md; registrar resultado real en Evidencia. No hay comando operativo requerido para cerrar esta tarea.

### Gates y verificación futura — NO pasos ni aceptación de esta tarea
Solo tras aprobación de tarea operativa propia: permiso escrito con acciones/ejecutores/host/vía/tope económico; evidencia de runtime/espacio efectivos, provisión humana terminada, trayecto privado restringido y TLS validado, acceso de pruebas autorizado y material sintético listo sin revelar claves. Falta de cualquier gate = no iniciar ensayo.
Matriz A futura: acceso desde Mac LAN y exterior; rechazo TLS inválido/auth ausente o inválida; ámbito/referencias fuera de permiso denegados sin mutar; operaciones protegidas cerradas; escritura confirmada sobrevive reinicio central; recuperación sintética y regresiones separadas. Franco ejecuta Mac y privilegios; constructor solo acciones delegadas. Un loopback no satisface acceso privado.
`npm run verify`, `npm run gate:f02`, `npm run gate:f03` son comandos existentes de regresión futura (no ejecutados, inferidos), esperados código 0; verify ya incluye ambos gates, no repetirlos como rondas adicionales. No usar help/doctor local como evidencia de red. La futura tarea operativa debe fijar comandos exactos del lanzador y trayecto después de la provisión, sin inventarlos ahora. Una ronda A, un lote acotado, una reverificación; bloqueo ante permisos/seguridad/topes o ampliación. Ningún ensayo iniciado aquí.

## Evidencia
Lo llena el constructor: revisión documental y referencia a ficha; sin resultados operativos inventados.

## Notas
Lo llena el constructor: documentación lista o defecto documental; habilitación operativa permanece pendiente hasta gates y tarea propia aprobada.

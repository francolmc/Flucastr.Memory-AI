# Revisión crítica independiente del camino MVP

**BORRADOR — disenar-arquitectura, modo actual.** No sustituye arquitectura, backlog, tareas, permisos ni estados. Observaciones y presupuestos siguientes son propuestas, no autorizaciones. Prioridad de Franco: probar pronto e integrar casi transparentemente, sin rebajar seguridad.

## Dictamen

**FTS5→un cliente→central única acerca al MVP; nuevas fichas y andamiaje general pueden alejarlo.** Hay cliente parcial, no integración acreditada. Recomiendo Claude Mac guarda/recupera/usa un recuerdo sintético en sesión nueva desde la misma central, conservando configuración; después R antes de contenido real autorizado. Sintético no es memoria funcionando para Flucastr.AI.

Andamiaje: conservar atribución/selección/observación SAN; posponer plataforma general y duplicación, nunca seguridad.

## Evidencia y límites

Confirmado por lectura, no reproducido: BACKLOG registra F01–F03 hechas pero F03 solo local sintética; F05 A→B→R, F06 posterior y F04 detenida. Inventario sin completed: F01–F05; F06 sin carpeta listada. REPOS enumera un solo repo. PROJECT/ARCHITECTURE fijan central única, Tailscale Windows→WSL candidata, TLS/auth y aislamiento/recuperación antes de datos confiables; equipo y disponibilidad son declarativos.

Tareas F05 no hechas 04–09 leídas completas: 04 conserva cliente parcial y fallos; 08 demuestra corrección de rutas local, no suite global. 09 tiene typecheck/build correctos tras corregir tipado, SAN sin rechazo y verify no ejecutado. Diez pases y dos fallos incluyen SAN y padre, no dos causas. 05–07 preparan documentos, no provisionan ni prueban Mac; lanzador operativo no acreditado. ANDAMIAJE reporta el mismo síntoma en Node22/24, filtros inválidos y observador sin datos; causa desconocida, no solución por cambio de versión.

Confirmado en package.json y src/remote-cli.ts/http-client.ts: Node >=22.23.2 <23; cliente save/search HTTPS con origen, CA y archivo token obligatorios por llamada; save requiere archivo JSON. Sin perfil persistente, hooks ni recuperación automática observables. npm run cli es local. Inferido: falta unir arranque central, acceso privado y Claude real. Hipótesis por probar: shell autorizado de Claude puede reutilizar el cliente sin nuevo adaptador. No se supone compatibilidad, coste, acceso ni permiso.

## Observaciones: matriz de recorte

| Feature/capacidad | Valor MVP | Decisión y motivo |
|---|---|---|
| F01 build/gates | Verificación | Mantener; atribuir runtime/entrada, no reconstruir plataforma |
| F02 FTS5/persistencia/ámbitos/identidad/límites | Producto mínimo | Mantener contratos/corpus, sin motor nuevo |
| F03 TLS/auth/denegaciones/durabilidad | Central segura | Mantener; hecha local no demuestra remoto ni resuelve SAN |
| F05 04/08/09 cliente parcial | Acceso sin SQLite Mac | Mantener y cerrar evidencia, no reimplementar |
| F05 A lanzador/configuración/red/continuidad | Imprescindible Mac→central | Mantener entrega operativa, no sustituir por ficha |
| F05 B guardar/reiniciar/recuperar/usar | Valor y fricción visibles | Mantener hito desde Claude real |
| F05 05–07 y fichas previas | Permisos/matriz/R | Recortar duplicación a una ficha con referencias |
| R aislamiento/copias/recuperación/datos | Primer uso confiable | Mantener gate; comprobar viabilidad humana temprano |
| Andamiaje mínimo: atribución/selección/observación SAN | Diagnóstico interpretable | Mantener, sin prometer reparar TLS |
| Manifiestos/digests universales/runner general | Beneficio no probado ahora | Posponer salvo discrepancia que impida atribución |
| F06 Pi y demás clientes | Cobertura adicional | Posponer hasta primer ciclo útil |
| F04 modelos/sqlite-vec/RRF | No indispensable para probar memoria | Posponer, mantener parada sin entrega |
| Framework/contenedor nuevo, DB Mac, automatismo inventado | Complejidad/ruptura de frontera | Descartar de este camino; nunca TLS inseguro/Funnel |

## Camino mínimo único y recorrido humano

**Recomendación:** SAN primero; luego una central privada y Claude Mac con cliente existente, sin semántica ni automatismo nuevo.

**Setup único propuesto, no acreditado:** Franco aporta plataforma/acceso Mac y versión/capacidad shell de Claude; autoriza acciones, condiciones Tailscale y responsables. Constructor verifica saldo y entrega lanzador central autorizado con DB/estado persistentes; una función startLocalServer no es despliegue. Franco administra red restringida Windows→loopback WSL, CA y token. Validar ruta sin ampliar escucha por omisión, distribuir CA pública por canal verificado y custodiar claves fuera del agente.

**Se configura una vez:** origen/nombre TLS, confianza CA, archivo token, cliente estable y arranque central. Hoy la CLI exige repetir opciones por llamada. Propuesta mínima: un punto de invocación revisado que aporte opciones sin poner secreto en argumentos; no existe hoy y cualquier código adicional necesita alcance autorizado. Mientras tanto, registrar repetición como fricción, no ocultarla.

**Uso habitual:** Franco pide explícitamente a Claude guardar una decisión breve; se prepara objeto con ID, tipo, ámbito, texto, origen y fecha en archivo; Claude invoca save mediante shell autorizado. En sesión nueva Franco pide recuperar contexto para un ámbito/consulta; Claude invoca search, recibe JSON y usa el recuerdo citando su ID. En el ensayo la respuesta esperada no va en el prompt nuevo. La central y sus recuerdos sobreviven a procesos/sesiones; los archivos de configuración/CA/token permanecen hasta rotación. No se reutiliza mágicamente el contexto de Claude.

**Fricción inevitable:** elegir contenido/ámbito/ID/fecha y pedir guardar/buscar; permisos Claude, red disponible, mantenimiento CA/token y conflictos humanos. Hoy además JSON y flags manuales. Sin hooks/MCP no hay captura ni carga automática. «Casi transparente» exige no rehacer setup ni copiar recuerdos/DB; pegar salida manual es evidencia parcial, no aceptación de integración.

## Aceptación observable

- HTTPS válido funciona; SAN realmente discrepante y CA no confiable rechazan. Auth ausente/inválida, redirects y operaciones protegidas fallan cerrados, sin mutación ni filtración. Causa SAN demostrada o bloqueo; no presumir vulnerabilidad ni error de fixture.
- Verify y gates F02/F03 pasan sin cambiar corpus/expectativas. Runtime, entrada y casos efectivos atribuibles; build verde, silencio o selección vacía no son aceptación.
- A: Mac LAN/exterior privado llega a la misma central; fuera del origen autorizado no accede. TLS/auth intactos, persistencia tras reinicio y recuperación sintética comprobadas. Cero DB cliente, puertos públicos o secretos en evidencia.
- B: guardar/reintento idéntico no duplica; mismo ID distinto rechaza; proyecto+general sin cruce, general solo general, vacío, archivados/conflictos según contrato. Máximo cinco recuerdos/4000 bytes UTF-8 completos incluido LF, sin truncar. Capacidades no expuestas por save/search se prueban en regresiones identificadas, no administración remota simulada.
- Integración: dos sesiones nuevas reales Claude Mac; segunda recupera y usa decisión citando ID, sin respuesta esperada en prompt, copiar salida manualmente ni repetir setup. Medir tiempo activo, peticiones, permisos y comandos/opciones sin secretos. Umbral propuesto: una petición explícita por guardar y otra por recuperar/usar, más aprobaciones del cliente registradas; cero reconstrucción de configuración entre sesiones. Si no cumple, declarar parcial, no «casi transparente».
- Utilidad real: solo con R satisfecho y permiso expreso de contenidos/ámbitos, un ciclo Flucastr.AI autorizado. No promete ahorro ni calidad semántica; documentar insuficiencias léxicas antes de ampliar.

## Secuencia finita, responsables y presupuesto propuesto

Los topes siguientes son máximos para decidir, no saldo nuevo ni autorización. Antes de operar, responsable de planificación concilia intentos consumidos de 04/08/09 con A/B. No hay rondas recargadas por renombrar tareas. Sin saldo acreditado: cierre bloqueado y una decisión agrupada, no ejecución.

| Paso / responsable | Dependencia y techo propuesto |
|---|---|
| 0. Constructor + Franco | <=1 h activa: consolidar matriz, permisos, saldo, acceso y disponibilidad declarativa R en una ficha; no redefinir producto |
| 1. Constructor: diagnóstico SAN | Entorno local autorizado sin adquisición. <=2 h activas, hasta tres intentos <=5 min cada uno, incluidos inválidos. Atribuir runtime/artefacto, caso, nombre esperado/certificado presentado y etapa TLS; positivo/negativo aislados. Observación indispensable ausente: parar |
| 2. Constructor: corrección/reverificación | Causa demostrada y permiso específico fixture/producto. Un lote <=2 h activas; una pasada de afectados y, solo si pasan, una global; <=30 min de ejecución total. Sin causa o cambio amplio: bloqueo, sin suavizar aserciones |
| 3. A: Franco administra/custodia; constructor alcance autorizado | Plataforma/red/CA/accesos/costes disponibles. <=4 h activas compartidas; una ronda, un lote y una reverificación dentro del saldo A. Lanzador/ruta privada comprobados o bloqueo; no otro host automático |
| 4. B: Franco opera Mac; constructor guía | A y cliente local suficientes. <=2 h activas; una ronda, un lote y una reverificación dentro del saldo B. Transcripción sintética y fricción medidas o bloqueo |
| 5. R: Franco autoriza/administra; constructor controles permitidos | Paquete separado <=4 h activas propuesto: una evaluación, un lote y una reverificación; sin gasto nuevo aprobado. Sin aislamiento/copia disponibles no operar ni prometer terminar |

R conserva administración fuera del alcance efectivo del agente/shell y pausa de escrituras; copia independiente cifrada y recuperación de claves; rotación/revocación; restauración RPO 24 h/RTO objetivo 4 h, diarias/7 diarias+4 semanales; saneamiento y copias afectadas; allowlist/datos reales autorizados. Controles proporcionados a memoria confiable aunque sea pequeña. Para sintético: TLS/auth, confinamiento, custodia y datos descartables, no una flota empresarial. Horas son topes, no garantía; espera humana se registra aparte sin ampliar investigación.

**Parar** por saldo/tope agotado, TLS no validado, artefacto/selección inciertos, permiso/acceso/custodia faltantes, datos no autorizados o cambio amplio de host/transporte/dependencia/gasto. Entregar evidencia sanitizada y brecha mínima, sin otra ronda automática. SAN bloqueado deja cliente parcial y diagnóstico; A fallida deja loopback comprobado, no remoto; B fallida deja central privada, no integración; R fallida deja Mac sintético reutilizable, nunca uso real habilitado.

## Contradicciones y riesgos

BACKLOG dice «falta adaptador», pero src contiene cliente parcial; task-04 sigue borrador con ejecución: existencia no es aceptación. PROJECT conserva pendientes iniciales de corpus/equipo/presupuesto superados por enmiendas; REPOS sigue conceptual. No acumular antecedentes como permisos ni reabrir decisiones resueltas. Sin cambiar estados aquí.

Andamiaje puede mejorar atribución sin resolver SAN. A/B no financian R ni proveen acceso/lanzador/separación. Riesgos residuales: SAN abierto, fixture efectivo incierto, red/continuidad WSL, compatibilidad Claude Mac, fricción manual y calidad FTS5 real desconocidas. Más sintético no crea aislamiento humano.

## Decisiones para Franco

1. Intervención: A) diagnóstico mínimo SAN y entrega vertical, recortando plataforma/duplicación (**recomendada**); B) andamiaje completo primero; C) pausa. A requiere ficha de acciones y saldo, no concede ejecución por sí sola.
2. Acceso: A) reservar acceso guiado y autorización específica agrupada candidato/Mac, Franco administrador/custodio, sin gasto nuevo (**recomendada si disponible**); B) cerrar local sintético y declarar remoto bloqueado. No elegir detalles técnicos delegables.
3. Uso real: A) reservar R finito propuesto y autorizar después contenido mínimo con controles satisfechos (**recomendada**); B) cerrar Mac sintético. Ninguna permite leer ahora Flucastr.AI ni omitir aislamiento/copias.

# Flucastr.Memory-AI

## Problema
**Confirmado — encargo de Franco:** memoria reutilizable para su trabajo con agentes, sin cargar conversaciones completas ni secretos. Flucastr.AI representa el reinicio de su forma de construir con agentes del 28 de octubre; principal razona y define proyecto/arquitectura, agentes alto/medio/bajo usan Pi con modelos OpenAI y Claude Code; skills reducen contexto. No se afirma haber leído ese proyecto.

## Para quién
**Confirmado — Franco:** uso de Franco desde Mac, iPhone, iPad, PC y WSL mediante clientes delgados. Primer cliente Claude Code en Mac mediante CLI; después Pi. Frecuencia y otros usuarios no confirmados.

## Qué significa «funcionando»
**Confirmado — slice 1 aprobada conceptualmente con ajustes de gate:** librería independiente y CLI TypeScript/Node con SQLite+FTS5, guardar/buscar sin embeddings. Persistencia después de reiniciar; escritura idempotente; aislamiento de ámbitos antes de buscar; resultado vacío ante no coincidencias; esperado entre top 5; salida de máximo cinco recuerdos y 4000 bytes. Un gate único falla con código de salida no cero si cualquier criterio falla.

**Confirmado — enmienda explícitamente aprobada por Franco antes de F02:** el gate inicial usa un corpus **sintético verosímil MVP de 30 recuerdos** de decisiones, aprendizajes, bloqueos resueltos y reglas, repartidos entre ámbito general y al menos dos proyectos ficticios; **10 consultas con esperados top 5 prefijados**. El corpus será versionado, separado de la lógica y reemplazable por datos reales. Esta decisión reemplaza la exigencia inicial de datos reales; no autoriza explorar otros proyectos. Aquí solo se documenta el contrato, sin generar corpus ni código.

El baseline es un archivo de concatenación del **mismo corpus completo**. El límite de **4000 bytes** incluye la respuesta serializada UTF-8 completa y su salto final; se omiten recuerdos enteros que no caben, sin truncarlos. Se compara con el baseline sin umbral porcentual adicional. El informe de reducción de contexto describe **solo el resultado de la prueba**, no uso real ni ahorro real de tokens o dinero. Corpus, consultas y baseline aún no generados: no se afirma que el gate sea ejecutable ni que haya pasado.

## Alcance
### Dentro
- **Confirmado — Franco:** central única con ámbitos general/proyecto, filtrados antes de buscar. Contenido: decisiones, aprendizajes, bloqueos resueltos, reglas breves; metadatos tipo, ámbito, origen y fecha. Reglas generales requieren confirmación explícita de Franco.
- **Confirmado:** núcleo librería independiente con CLI y HTTP encima. Slice 1 local Mac SQLite+FTS5. API HTTP privada con autenticación antes de embeddings por necesidad multidispositivo.
- **Confirmado — origen: Franco respondió «apruebo» a la dirección y límites de la opción A de la propuesta arquitectónica (referencia en §Integración MVP aprobada):** integrar primero Claude Code mediante CLI sobre FTS5 y posponer semántica. Esto sustituye la precedencia anterior de embeddings respecto de la primera integración, no aprueba un roadmap completo. Compatibilidad de paquetes, versiones, runtime y clientes todavía no comprobada.
- **Propuesto:** un repositorio con componentes internos; arquitectura adjunta es propuesta, no implementación ni plan de tareas.

### Fuera
- **Confirmado:** conversaciones completas, secretos, API pagada de embeddings, offline y sincronización entre bases inicialmente.
- API expuesta públicamente; embeddings en slice 1; MCP remoto sin verificación específica de cada cliente; compromisos de alojamiento o de compatibilidad sin revisión.
- Backlog, tareas, código, commits y despliegue durante puerta 1.

## Restricciones
- **Confirmado:** TypeScript/Node; desarrollo macOS y Pi WSL con GPU. El hardware fue declarado literalmente «Mac con Apple A18 Pro y 8 GB RAM»; modelo/chip por confirmar por posible inconsistencia, sin corregir ni bloquear FTS5.
- **Confirmado — origen: aclaración explícita de Franco en este encargo:** el servidor es prioritario para memoria y embeddings; el Mac es cliente actual y posible anfitrión futuro. No se exige compatibilidad Mac ni coexistencia con trabajo habitual en sus 8 GB para F04, ni sincronización entre memorias. Se descarta imponer ese límite del cliente al servidor porque contradice la prioridad aprobada; solo una nueva decisión explícita cambiaría este alcance. Servidor aún no elegido: viabilidad y recursos deben verificarse antes de pruebas, sin modelo, runtime ni presupuesto de memoria elegidos ni rendimiento prometido. Esta prioridad no autoriza despliegue: F03 sigue limitado a local sintético; remoto, seguridad y custodia real permanecen pendientes.
- No se han verificado bindings SQLite, build FTS5, sqlite-vec, versiones de Node ni soporte de clientes. Elegir dependencias exige verificación documental y prueba posterior.
- Ruta informada de Flucastr.AI: `/Users/franco/Codes/flucastr/Flucastr.AI`; no leída en este entorno Linux. Pedir extractos sanitizados concretos solo si hacen falta.
- **Confirmado por lectura local:** README.md vacío; no existían AGENTS.md ni estos borradores al comenzar. No se leyó contenido de otros proyectos.

### Comparación de alojamiento para revisión, sin elección
**Fuentes oficiales consultadas 2026-11-01:** https://www.hetzner.com/cloud/ y https://tailscale.com/pricing . Se verificó contenido público, no una cotización ni configuración final. La página de Hetzner anuncia cloud desde **5,99 €/mes sin IVA**; no se verificó un SKU suficiente para embeddings. Tailscale anuncia Personal **0 USD, hasta seis usuarios**, con uso no comercial, y Standard **8 USD/usuario/mes**. Confirmar elegibilidad comercial, impuestos, región, recursos y condiciones al contratar. Ningún proveedor queda elegido.

| Alternativa | Ventajas | Costos y riesgos | Cuándo conviene |
|---|---|---|---|
| Equipo propio siempre encendido + VPN privada | Control físico y evita alquiler de cómputo si ya existe; inferencia local | Electricidad, desgaste, VPN si corresponde, backup, administración; cortes de luz/internet, suspensión, robo y competencia por RAM. Costo mensual de energía = W medios / 1000 × 24 × días × tarifa local; hardware y tarifa desconocidos | Si Franco confirma equipo disponible, estabilidad y tolerancia a cortes |
| VPS + acceso privado VPN, sin puerto público de aplicación | Independencia del Mac y continuidad potencialmente mejor; acceso común multidispositivo | Referencia pública desde 5,99 €/mes sin IVA, más recursos suficientes, backups, VPN si aplica y administración; proveedor puede acceder a infraestructura, región/jurisdicción, robo de credenciales, latencia. Ese precio no garantiza RAM para embeddings | Si importa disponibilidad independiente del hogar y se acepta proveedor externo |

**Recomendación provisional, no decisión:** mantener slice 1 local sin elegir alojamiento. Para central posterior, priorizar equipo propio si ya está disponible y sus cortes son aceptables; en caso contrario comparar VPS dimensionado. En ambos, VPN no sustituye autenticación de aplicación, backups ni recuperación. No instalar ni contratar ahora.

### Retención y contradicciones
**Confirmado — enmienda explícitamente aprobada por Franco:** señalar contradicciones hasta resolución humana por Franco; sin caducidad ni purga automática. Los archivados se excluyen de la búsqueda normal. Una sustitución usa un nuevo ID y referencia al anterior. Esto evita resolver conflictos por mera fecha o perder antecedentes automáticamente; la caducidad por tipo queda descartada para este contrato por riesgo de pérdida. Solo una nueva decisión explícita cambiaría esta política.

**Propuesta no aprobada, fuera de esta enmienda:** procedimiento de borrado de secretos detectados sin copiar su valor a logs o corpus, y revisión de copias afectadas, incluidos backups; procedimiento aún pendiente.

## Decisiones
| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Confirmada: central única y filtro de ámbito previo | Privacidad entre proyectos y evitar bases divergentes | Bases sincronizadas/offline: complejidad fuera del inicio | Nueva necesidad aprobada de offline |
| Confirmada: SQLite+FTS5 en slice 1 | Validar persistencia y búsqueda antes de inferencia | Embeddings iniciales: memoria y complejidad prematuras | Gate FTS5 y evaluación posterior |
| Confirmada: núcleo independiente, CLI primero | Reutilizar lógica sin depender del cliente | Lógica dentro de un agente: acoplamiento | Restricción técnica demostrada |
| Confirmada: API privada autenticada antes de embeddings | Uso multidispositivo sin exposición pública | API pública y embeddings antes de API: contradicen restricciones | Cambio explícito de requisitos |
| Confirmada: embeddings locales y fallback FTS5 | Cero API pagada y degradación operativa | API de embeddings pagada: fuera de alcance | Revisión explícita de privacidad/costo |
| Propuesta: un repo | Menor coordinación para un núcleo y adaptadores | Varios repos: no hay independencia demostrada | Equipos o ciclos de despliegue distintos |
| Confirmada — enmienda de Franco: corpus sintético versionado y baseline del mismo corpus | Gate MVP reproducible sin depender de datos reales | Exigir datos reales inicialmente: reemplazado explícitamente; baseline distinto: comparación no equivalente | Evaluación posterior con datos reales autorizados |
| Confirmada — enmienda de Franco: proyecto busca ese proyecto + general; general solo general; nunca otros proyectos | Reutilizar memoria general manteniendo aislamiento | Cruce de proyectos: rompe aislamiento; proyecto sin general: no cumple contrato | Cambio explícito de ámbitos |
| Confirmada — enmienda de Franco: CLI slice 1 con identidad local confiable y confirmación explícita para guardar reglas generales | Resolver el acceso local sin anticipar auth HTTP | Auth API en slice 1: fuera de esta slice; guardar reglas generales sin confirmación: no autorizado | Slice HTTP define su autenticación |
| Confirmada — enmienda de Franco: ID estable del emisor; reintento idéntico no duplica; mismo ID con contenido distinto se rechaza | Distinguir reintentos de cambios | Deduplicación automática por texto: no identifica reintentos; sobrescritura con mismo ID: pierde identidad del contenido | Cambio explícito del contrato |
| Confirmada — enmienda de Franco: sustitución con nuevo ID y referencia anterior, contradicciones humanas y archivados fuera de búsqueda normal | Conservar antecedentes sin resolver verdad automáticamente | Caducidad/purga automática y resolución por fecha: riesgo de pérdida o decisión incorrecta | Nueva política aprobada por Franco |
| Confirmada — enmienda de Franco: 4000 bytes de respuesta completa UTF-8 con salto final, recuerdos enteros y comparación sin umbral porcentual adicional | Límite verificable y comparación del mismo corpus | Contar solo texto o truncar recuerdos: incumple límite o integridad; ahorro real: no demostrado | Cambio explícito del contrato de salida |

## Integración MVP aprobada — borrador de fidelidad

> **Antecedente local aprobado, no alcance suficiente del objetivo central actualizado.** La sección siguiente conserva su aprobación y límites históricos. Para la dirección vigente y el presupuesto todavía no aprobado, véase «Dirección central actualizada».

**Confirmado — origen:** encargo actual que comunica el «apruebo» de Franco a dirección y límites de la propuesta exacta `/home/franco/.pi/agent/sessions/--home-franco-Codes-flucastr-Flucastr.Memory-AI--/subagent-artifacts/55cd4899-0329-4334-ac6f-39972e29de02_arquitecto_output.md`, opción A, §§3–4 y decisiones agrupadas. La dirección y sus límites ya están aprobados; esta incorporación es un **borrador de fidelidad**, no una solicitud de reaprobarlos ni autorización para ejecutar en esta intervención.

- **Objetivo aprobado:** demostrar explícitamente **guardar → reiniciar → recuperar → usar** una decisión como contexto desde Claude Code mediante la CLI existente sobre SQLite/FTS5. Solo local sintético, con general y dos proyectos ficticios; no es una central remota desplegada ni acredita compatibilidad del cliente o de macOS.
- **Límites aprobados:** una ronda de compatibilidad y una única corrección acotada. Detenerse con evidencia del impedimento si exige remoto, otro almacenamiento, transporte no aprobado o cambios amplios al cliente. No copiar la base al Mac ni abrir acceso remoto para sortear el bloqueo.
- **Fuera:** extracción automática de conversaciones, hooks, MCP, Pi, otros dispositivos, datos reales, despliegue, embeddings, sqlite-vec/RRF, fragmentación y reindexación vectorial. No se prometen ahorro real ni calidad semántica.
- **Contratos conservados:** entrada F02, ámbitos previos, identidad e idempotencia, retención y conflictos humanos, seguridad y gates existentes; salida de cinco recuerdos como máximo y 4000 bytes UTF-8 completos con salto final, sin truncar recuerdos. La integración no convierte la CLI en administración humana segura ni concede permisos HTTP adicionales.

**Decisión y alternativas:** adelantar integración léxica reutiliza lo entregado para observar utilidad desde el primer agente sin añadir inferencia. Se pospone la alternativa B de evaluación semántica; no se aprueban sus seis consultas ni su criterio nuevo de abandono. La dirección futura de embeddings locales y fallback permanece, con sus gates y permisos intactos. Solo evidencia de una necesidad imprescindible no cubierta por FTS5 y una decisión posterior podrían cambiar esta prioridad.

**Confirmado — origen: encargo actual y STATUS.md §Escalación:** F04 y sus tareas están detenidas **sin entrega**; no están hechas ni se registra una cancelación ficticia. F07 previa no está aprobada. **Propuesta para planificación:** reaprovechar F05 como identidad de esta integración si su alcance resulta compatible, evitando una feature duplicada; identificador, orden y representación definitivos corresponden al backlog. Aquí no se modifican backlog, tareas, estados ni workflow.

**Pendientes reales, sin reabrir dirección:** acreditar versión/acceso del cliente y recorrido local autorizado, concretar procedimiento reproducible y evidencia sintética de uso entre sesiones; actualizar después el backlog mediante su rol responsable. Remoto/uso real siguen requiriendo sus definiciones de seguridad, custodia e infraestructura, fuera de este MVP. Los detalles menores de invocación no requieren otra decisión de producto si caben en el presupuesto y contratos aprobados.

## Dirección central actualizada — confirmación y presupuesto aprobados para planificar

**Confirmado — origen: encargo actual, respuesta de Franco «si, apruebo» a actualizar definición y preparar presupuesto sobre la propuesta exacta `/home/franco/.pi/agent/sessions/--home-franco-Codes-flucastr-Flucastr.Memory-AI--/subagent-artifacts/ab125df6-a181-4539-b068-741bef9c0ae5_arquitecto_output.md`.** Objetivo: **Claude Code Mac → adaptador CLI → HTTP privado F03 → núcleo → central única SQLite/FTS5**. Después Pi, Codex CLI y Claude Desktop/aplicaciones, secuencialmente; móvil pospuesto. Aplicaciones no significa interfaz web ni compatibilidad Desktop Linux acreditada. No reabrir esta dirección. La aprobación permite esta actualización y preparar el presupuesto, **no aprueba el presupuesto aún inexistente, construir, adquirir, instalar, preparar entorno, desplegar o contratar**. La frase histórica de STATUS sobre «presupuesto aprobado» no acredita aprobación del nuevo presupuesto central.

**Diseño objetivo, no estado operativo:** solo el proceso central accede a SQLite; el cliente delgado no copia la base, no mantiene memoria propia ni sincroniza. Reutilizar HTTP F03 y extender/reutilizar CLI como cliente HTTP es la vía propuesta, no capacidad ni servicio remoto acreditados. Alternativas: conservar solo local sirve de ensayo pero no satisface central multiequipo; SQLite compartida/copias se descartan por romper frontera o introducir divergencia. Revisar la vía solo ante incompatibilidad demostrada; no seleccionar otra dependencia o transporte por omisión.

**Evidencias separadas:** (1) diseño objetivo documentado; (2) ensayo técnico sintético controlado; (3) central privada con Claude Code Mac real y datos sintéticos; (4) uso real expresamente habilitado tras controles y ámbitos autorizados. Ningún nivel acredita el siguiente. Solo loopback no entrega central; un cliente real con datos sintéticos no autoriza datos confiables ni demuestra ahorro real.

**Presupuesto confirmado para planificación (confirmación posterior registrada abajo):** presupuesto finito separado en `ARCHITECTURE.md` §Presupuesto de intervención central y primer cliente: un paquete habilitante central y otro del primer cliente, cada uno con una ronda y una única corrección/reverificación. No hay duración/precio garantizado ni presupuesto operativo para Pi, Codex, Desktop, móvil o uso real. El límite local anterior no se extiende automáticamente a red/operación.

**Pendientes agrupados sin bloquear documentación:** ficha mínima del equipo declarado; alojamiento homeserver/VPS aún pendiente; responsable operativo y custodio; mecanismo privado/TLS y controles acreditables; destino independiente cifrado, recuperación de claves y separación administrativa; autorización de ámbitos reales y saneamiento antes de datos reales. No se eligen proveedor, VPN, host o dependencias. Conservados todos los contratos F02/F03, gates, seguridad y parada F04 sin entrega. La transferencia al planificador está en arquitectura; backlog/estados/tareas no se actualizan aquí.


**Confirmación posterior vigente — origen: respuesta de Franco «si, dispongo de un equipo, puede ser un homeserver o una vps» a fidelidad y aprobación del presupuesto finito para planificar; corroboración: `STATUS.md` §Paso actual y §Espera a Franco.** Confirmadas definición central FTS5, Claude Code Mac primero, salidas y parada de ambos paquetes y límites por paquete: una ronda, una corrección acotada y una reverificación. Este registro documental de fidelidad sustituye únicamente las reservas históricas anteriores sobre aprobación pendiente del presupuesto; no requiere otra aprobación de dirección o límites. No acredita ejecución ni despliegue.

**Confirmado y pendiente:** equipo disponible declarado; homeserver frente a VPS sin seleccionar. Especificaciones, responsable/custodio y presupuesto VPS no acreditados. **Recomendación condicionada (inferencia por simplicidad y costo):** evaluar primero equipo existente si resulta apropiado; comparar VPS si no sirve o Franco lo prefiere, sin contratar. Datos mínimos para esa evaluación: OS/arquitectura, RAM/disco libre, disponibilidad, acceso administrativo y posibilidad de acceso privado, sin asumir solución. Son datos declarativos, no permiso de comandos/inspección ni solicitud de credenciales. Elegir ahora infraestructura no es requisito para ajustar el backlog; validar anfitrión/acceso y responsables sí es gate previo a intervención operativa y evidencia de central privada. No se heredan requisitos semánticos F04.

**Traspaso vigente:** planificador puede ajustar documentalmente backlog con habilitante central separado y F05 primer cliente, dependencias F02/F03, salidas/topes/parada confirmados y alojamiento como gate pendiente; sin nueva aprobación de dirección o límites ya confirmados. Distinguir planificación de ejecución condicionada. Sin cambios aquí de backlog, tareas, estados o seguridad; sin permisos de ejecución, instalaciones, descargas, preparación de entorno, contratación, despliegue, commit/push/PR/merge. F04 sigue detenida sin entrega; semántica no entra en esta dirección.

## Primera versión Tailscale — aprobación vigente; borrador de fidelidad

**Confirmado — origen: respuesta de Franco comunicada en el encargo actual:** «si, usemos mientras tailscale para esta primera version. por ahora necesito que la memoria funcione y luego vamos creciendo, estoy desarrollado mucho con Flucastr.AI y necesito la memoria». La propuesta exacta aprobada es `/home/franco/.pi/agent/sessions/--home-franco-Codes-flucastr-Flucastr.Memory-AI--/subagent-artifacts/9bfa3852-d8c1-48ec-81db-c6d933363c0f_arquitecto_output.md`. Aprueba Tailscale gestionado como dirección inicial, objetivo de ensayo privado LAN/exterior exclusivamente sintético y transferencia documental para corregir planificación. **No autoriza cuenta, instalación, configuración, preparación ni pruebas todavía.** No se vuelve a solicitar esta dirección; este texto es borrador de fidelidad de una aprobación recibida.

**Confirmado por el encargo y STATUS §Espera a Franco:** uso personal declarado; candidato Windows 11/Ubuntu WSL, 16 GiB, disponibilidad declarada 24/7 y más de 10 GB reservables; Franco administrador, custodio y operador de pruebas guiadas en Mac. Son declaraciones, no capacidad, runtime, conectividad ni separación administrativa acreditados. Sustituyen únicamente los pendientes históricos afectados. Verificar elegibilidad/condiciones de Tailscale antes de alta: uso personal no acredita automáticamente elegibilidad ni autoriza gasto.

**Dirección vigente:** Claude Code Mac → CLI delgada → HTTPS y autenticación F03 sobre Tailscale → central WSL candidata → SQLite/FTS5 única; solo central abre la base. Preferir Tailscale en Windows, sin doble instalación WSL salvo decisión sustentada por impedimento concreto. No publicar aplicación ni usar Funnel; no desactivar validación TLS ni seleccionar certificados públicos Tailscale sin consentimiento específico por transparencia de nombres. Pi, Codex y Desktop después; móvil después; sin semántica en primera versión. La alternativa WireGuard queda descartada por ahora por mayor operación de conectividad; VPS no es sustitución automática del candidato.

**Prioridad y límite:** el resultado buscado es memoria útil para Flucastr.AI, no una sucesión de demostraciones sintéticas. Ensayo sintético no satisface uso real. El camino finito y responsables hasta su habilitación están en ARCHITECTURE §Primera versión Tailscale y camino finito a uso útil. Datos/allowlist reales, saneamiento, administración separada y copias reales requieren decisiones y permisos concretos posteriores; no se infieren de esta urgencia. No se ha leído Flucastr.AI ni autorizado extraerlo.

Las preguntas históricas sobre equipo, responsables y vía privada quedan resueltas solo en el nivel declarativo anterior. Permanecen verificación técnica, elegibilidad, TLS/custodia y gates reales; no se reabren definición central, orden ni límites por paquete. Planificador debe corregir backlog y borradores F05, no ejecutar; STATUS no se modifica aquí.

## Preguntas abiertas
1. El contrato del gate, ámbitos, identidad local, idempotencia y retención queda resuelto por la enmienda aprobada; no requiere nueva aprobación. La generación del corpus y la implementación quedan para pasos posteriores.
2. ¿Qué equipo propio estaría siempre encendido, con qué disponibilidad, tarifa eléctrica y uso comercial/personal de VPN, y qué presupuesto/región aceptarías para comparar VPS sin elegir aún?
3. ¿Cuál es el modelo exacto y chip del Mac declarado «Apple A18 Pro, 8 GB»? No bloquea definición FTS5.
4. Queda pendiente el procedimiento de borrado de secretos y tratamiento de copias/backups; no reabre la decisión aprobada de no caducidad/purga automática ni la resolución humana de contradicciones.
5. ¿Apruebas la propuesta de un repo y la arquitectura conceptual, dejando mecanismo de auth, límites por identidad, backup/restauración y compatibilidad de clientes para definición previa a la slice HTTP?

## Estado
> Estado: aprobado

**Confirmado — autorización explícita de Franco:** este documento fue aprobado junto con los tres borradores antes del backlog; posteriormente Franco aprobó el backlog y las cuatro tareas F01. Se refleja la aprobación ya dada y el cierre de la puerta de revisión documental, sin resolver preguntas abiertas ni convertir propuestas pendientes en decisiones aprobadas. Los pendientes del gate y las decisiones técnicas conservan su estado; no se compromete alojamiento. La revalidación de yolo corresponde al coordinador; esta actualización documental no activa ningún modo.

**Confirmado — enmienda posterior ya aprobada por Franco:** las decisiones expresas documentadas arriba reemplazan únicamente los pendientes afectados. Franco autorizó: «Puedes descomponer F02 con esto». No se exige reaprobar estas mismas decisiones; esta actualización no descompone F02 ni modifica backlog o tareas.

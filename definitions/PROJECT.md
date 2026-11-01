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
- **Restricción confirmada, no aprobación global de roadmap:** después considerar embeddings locales pequeños, sqlite-vec+RRF y luego integraciones verificadas. Compatibilidad de paquetes, versiones, runtime y clientes todavía no comprobada.
- **Propuesto:** un repositorio con componentes internos; arquitectura adjunta es propuesta, no implementación ni plan de tareas.

### Fuera
- **Confirmado:** conversaciones completas, secretos, API pagada de embeddings, offline y sincronización entre bases inicialmente.
- API expuesta públicamente; embeddings en slice 1; MCP remoto sin verificación específica de cada cliente; compromisos de alojamiento o de compatibilidad sin revisión.
- Backlog, tareas, código, commits y despliegue durante puerta 1.

## Restricciones
- **Confirmado:** TypeScript/Node; desarrollo macOS y Pi WSL con GPU. El hardware fue declarado literalmente «Mac con Apple A18 Pro y 8 GB RAM»; modelo/chip por confirmar por posible inconsistencia, sin corregir ni bloquear FTS5.
- Embeddings locales pequeños deben coexistir con trabajo habitual en 8 GB; modelo y presupuesto de memoria deben validarse después, no se promete rendimiento.
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

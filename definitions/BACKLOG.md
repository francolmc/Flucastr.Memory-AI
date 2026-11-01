# Backlog — puerta 2

Definición aprobada por Franco en conversación («apruebo») para `definitions/PROJECT.md`, `definitions/ARCHITECTURE.md` y `definitions/REPOS.md`. Se conserva el estado escrito de esos documentos. Este backlog es una propuesta para revisión, no una autorización de implementación.

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Base ejecutable y verificable TypeScript/Node para librería independiente y CLI | habilitante | alto | medio | No existe andamiaje ni forma de ejecutar y probar; verificar SQLite/FTS5 en los entornos objetivo habilita la primera entrega. | pendiente | → |
| F02 | Memoria local persistente con librería independiente y CLI SQLite/FTS5, validada contra el contexto actual | producto | alto | alto | Entrega guardar/buscar con ámbitos e idempotencia y exige superar el gate real antes de ampliar el sistema. | pendiente | |
| F03 | Central accesible mediante API HTTP privada autenticada | producto | alto | alto | Depende de F02 y habilita acceso multidispositivo sin réplicas; debe preceder a embeddings. | pendiente | |
| F04 | Búsqueda híbrida con embeddings locales, sqlite-vec/RRF y fallback FTS5 | producto | medio | alto | Depende de F03 y de verificar compatibilidad y memoria; amplía recuperación sin API pagada ni perder búsqueda léxica. | pendiente | |
| F05 | Integración verificada de Claude Code en Mac mediante CLI | producto | alto | medio | Sigue al núcleo y la búsqueda previstos; es el primer cliente integrado, sin prometer MCP ni transporte no verificado. | pendiente | |
| F06 | Integración verificada de Pi con la central privada | producto | medio | medio | Depende de F05 y reutiliza la API autenticada; incorpora el segundo cliente sin sincronización por dispositivo. | pendiente | |

Estado del documento: borrador

## Evidencia y dependencias de planificación

- **Confirmado por lectura del workspace:** un único repo, `README.md` vacío y sin andamiaje, manifiesto de dependencias, comandos de ejecución/pruebas ni despliegue local. F01 debe habilitar construcción y verificación local; F03 debe habilitar verificación HTTP local antes de cualquier alojamiento real. No se prescriben comandos ni versiones todavía.
- **Confirmado por el encargo:** núcleo independiente TS/Node y CLI SQLite/FTS5 primero; HTTP privado autenticado antes de embeddings; luego embeddings locales sqlite-vec/RRF con fallback; Claude Code CLI primero y Pi después. Todas las filas son pendientes de una propuesta en borrador, no tareas aprobadas.
- **Dependencia externa de F02, antes de implementar:** Franco debe entregar o autorizar rutas concretas al corpus real sanitizado de 30 recuerdos, 10 consultas con esperados fijados y archivo completo utilizado hoy como baseline. La aprobación genérica no proporciona esos materiales. No fabricarlos ni buscar en otros proyectos. Cerrar también composición general+proyecto, medición del límite de 4000 bytes y si existe umbral de reducción exigible.
- **Contrato confirmado de F02:** persistencia tras reinicio, escrituras idempotentes, ámbitos filtrados antes de buscar, vacío sin coincidencias, esperado en top 5 y salida de hasta cinco recuerdos y 4000 bytes; gate único con salida no cero ante cualquier incumplimiento. Comparar bytes contra el archivo completo real no demuestra ahorro de tokens o dinero. El gate aún no es ejecutable.
- **Dependencias de F03:** concretar identidad/autorización de ámbitos, autenticación y revocación, TLS, interfaz privada y backup/restauración antes de construir esta entrega. Elegir alojamiento requiere datos del equipo disponible, disponibilidad y costos o presupuesto/región para VPS; ninguna alternativa queda seleccionada y no se autoriza contratar ni desplegar.
- **Dependencias de F04:** confirmar modelo/chip real del Mac declarado «Apple A18 Pro, 8 GB», modelo de embeddings y licencia, compatibilidad de runtime/OS/sqlite-vec y memoria medida con trabajo habitual. El dato de hardware no bloquea FTS5 y no se sustituye por una conjetura.
- **Dependencias transversales:** cerrar antes de implementar las operaciones afectadas la identidad estable y política de actualización, autorización general/proyecto y reglas de retención, contradicciones y purga incluidas copias. La aprobación de la definición no aporta valores técnicos ni resuelve alternativas todavía abiertas.
- **Inferido para ordenar, sujeto a esta revisión:** agrupar preparación técnica en F01 y mantener las integraciones después de la búsqueda híbrida permite respetar la secuencia solicitada sin superar seis features. No implica que la librería dependa de los clientes.
- **Fuera de estas seis entregas:** móvil queda únicamente como compatibilidad por verificar, sin promesa de cliente, MCP remoto ni feature adicional. Se mantienen fuera offline, sincronización inicial por dispositivo, exposición pública y APIs pagadas. No se crean tareas, carpetas de features ni código en esta puerta.

## Revisión requerida

Franco debe revisar orden, agrupación y dependencias de este archivo para aprobar puerta 2. Solo después corresponde descomponer F01; las entradas pendientes de F02 y las decisiones posteriores se mantienen explícitas, sin inventarlas ni bloquear la preparación técnica independiente.

# Backlog — puerta 2

Definición aprobada por Franco en conversación («apruebo») para `definitions/PROJECT.md`, `definitions/ARCHITECTURE.md` y `definitions/REPOS.md`. Se conserva el estado escrito de esos documentos. Este backlog es una propuesta para revisión, no una autorización de implementación.

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Base ejecutable y verificable TypeScript/Node para librería independiente y CLI | habilitante | alto | medio | No existe andamiaje ni forma de ejecutar y probar; verificar SQLite/FTS5 en los entornos objetivo habilita la primera entrega. | hecha | |
| F02 | Memoria local persistente con librería independiente y CLI SQLite/FTS5, validada contra el contexto actual | producto | alto | alto | Entrega guardar/buscar con ámbitos e idempotencia y exige superar el gate real antes de ampliar el sistema. | hecha | |
| F03 | Central accesible mediante API HTTP privada autenticada | producto | alto | alto | Depende de F02 y habilita acceso multidispositivo sin réplicas; debe preceder a embeddings. | hecha | → |
| F04 | Búsqueda híbrida con embeddings locales, sqlite-vec/RRF y fallback FTS5 | producto | medio | alto | Depende de F03 y de verificar compatibilidad y memoria; amplía recuperación sin API pagada ni perder búsqueda léxica. | pendiente | |
| F05 | Integración verificada de Claude Code en Mac mediante CLI | producto | alto | medio | Sigue al núcleo y la búsqueda previstos; es el primer cliente integrado, sin prometer MCP ni transporte no verificado. | pendiente | |
| F06 | Integración verificada de Pi con la central privada | producto | medio | medio | Depende de F05 y reutiliza la API autenticada; incorpora el segundo cliente sin sincronización por dispositivo. | pendiente | |

Estado del documento: aprobado

## Evidencia y dependencias de planificación

- **Confirmado por lectura del workspace:** un único repo, `README.md` vacío y sin andamiaje, manifiesto de dependencias, comandos de ejecución/pruebas ni despliegue local. F01 debe habilitar construcción y verificación local; F03 debe habilitar verificación HTTP local antes de cualquier alojamiento real. No se prescriben comandos ni versiones todavía.
- **Confirmado por el encargo:** núcleo independiente TS/Node y CLI SQLite/FTS5 primero; HTTP privado autenticado antes de embeddings; luego embeddings locales sqlite-vec/RRF con fallback; Claude Code CLI primero y Pi después. Todas las filas son pendientes de una propuesta en borrador, no tareas aprobadas.
- **F02 — enmienda aprobada explícitamente por Franco:** no requiere datos reales ni rutas autorizadas. El constructor generará un corpus sintético verosímil versionado y separado de lógica: 30 recuerdos de los cuatro tipos, general y al menos dos proyectos ficticios; fijará 10 consultas y esperados top 5 antes de implementar búsqueda. Baseline: concatenación del mismo corpus. Informe solo de prueba, sin ahorro real ni umbral porcentual añadido.
- **Contrato confirmado de F02:** persistencia tras reinicio; ID del emisor, reintento idéntico idempotente y rechazo de mismo ID diferente; proyecto incluye general, general solo general, sin cruce de proyectos. CLI local confiable, confirmación explícita para reglas generales. Máximo cinco recuerdos y 4000 bytes UTF-8 de respuesta serializada completa con salto final, omitiendo recuerdos enteros. Contradicciones señaladas hasta resolución humana; sustitución con nuevo ID y referencia anterior; archivados fuera de búsqueda, sin caducidad/purga automática. Gate único no cero ante incumplimiento; aún no implementado.
- **Dependencias de F03:** concretar identidad/autorización de ámbitos, autenticación y revocación, TLS, interfaz privada y backup/restauración antes de construir esta entrega. Elegir alojamiento requiere datos del equipo disponible, disponibilidad y costos o presupuesto/región para VPS; ninguna alternativa queda seleccionada y no se autoriza contratar ni desplegar.
- **Dependencias de F04:** confirmar modelo/chip real del Mac declarado «Apple A18 Pro, 8 GB», modelo de embeddings y licencia, compatibilidad de runtime/OS/sqlite-vec y memoria medida con trabajo habitual. El dato de hardware no bloquea FTS5 y no se sustituye por una conjetura.
- **Dependencias transversales:** para F02 quedan resueltas identidad estable, composición de ámbitos, confirmación general y retención por la enmienda aprobada (PROJECT.md y ARCHITECTURE.md). Autorización HTTP y procedimiento de borrado de secretos/copias siguen pendientes fuera de F02.
- **Inferido para ordenar, sujeto a esta revisión:** agrupar preparación técnica en F01 y mantener las integraciones después de la búsqueda híbrida permite respetar la secuencia solicitada sin superar seis features. No implica que la librería dependa de los clientes.
- **Fuera de estas seis entregas:** móvil queda únicamente como compatibilidad por verificar, sin promesa de cliente, MCP remoto ni feature adicional. Se mantienen fuera offline, sincronización inicial por dispositivo, exposición pública y APIs pagadas. No se crean tareas, carpetas de features ni código en esta puerta.

## Revisión requerida

Franco debe revisar orden, agrupación y dependencias de este archivo para aprobar puerta 2. Solo después corresponde descomponer F01; las entradas pendientes de F02 y las decisiones posteriores se mantienen explícitas, sin inventarlas ni bloquear la preparación técnica independiente.

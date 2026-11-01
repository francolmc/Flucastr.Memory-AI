# Arquitectura propuesta — modo nueva

## Estructura y su razón
**Documento aprobado por Franco junto con los documentos de puerta 1; las propuestas no resueltas conservan su carácter de propuesta.** Enmienda explícitamente aprobada antes de F02 incorporada solo en los puntos afectados. Entradas: requisitos explícitos de Franco recogidos en PROJECT.md y su enmienda. Se propone un único repo Flucastr.Memory-AI con librería independiente y adaptadores CLI/HTTP: simplicidad y reutilización. Varios repos no aportan hoy independencia demostrada; reconsiderar si aparecen equipos o ciclos separados. No se presupone estructura de carpetas ni dependencias.

## Diagrama
Vista conceptual objetivo; HTTP y clientes posteriores **no forman parte de slice 1**. El contenedor representa el único repo propuesto, no un servidor público. Ubicación final de la central pendiente.

```mermaid
flowchart TD
  CC(["Claude Code Mac: primer cliente"])
  OT(["Pi y clientes posteriores: compatibilidad pendiente"])
  subgraph R["Flucastr.Memory-AI: repo propuesto"]
    CLI["CLI: slice 1"]
    HTTP["HTTP privado + auth: posterior a slice 1"]
    CORE["Librería: validación, ámbitos, idempotencia y búsqueda"]
    DB[("SQLite + FTS5: base única")]
    EMB["Embeddings locales: fase posterior, sin modelo elegido"]
  end
  CC -->|"Invocación CLI; transporte exacto pendiente"| CLI
  OT -->|"HTTPS por red privada; integración pendiente"| HTTP
  CLI -->|"Operaciones locales de memoria"| CORE
  HTTP -->|"Identidad autenticada y operación autorizada"| CORE
  CORE -->|"Filtro de ámbito previo, escritura y consulta FTS5"| DB
  CORE -->|"Texto permitido; cálculo local posterior"| EMB
  EMB -->|"Vectores locales; sqlite-vec por verificar"| DB
```

## Componentes
| Componente | Responsabilidad | Tecnología | Origen del dato |
|---|---|---|---|
| Librería | Validar contenido/metadatos, idempotencia, ámbitos previos y límites de salida | TypeScript/Node confirmado; interfaces pendientes | Encargo de Franco |
| CLI | Guardar/buscar para primer cliente Mac | TypeScript/Node confirmado; comandos aún no definidos | Encargo de Franco |
| Base única | Persistencia y búsqueda léxica | SQLite+FTS5 confirmado conceptualmente; binding/build no verificado | Encargo de Franco |
| HTTP privado | Acceso multidispositivo autenticado | Requisito confirmado; framework/auth/transporte por elegir | Encargo de Franco |
| Embeddings | Búsqueda semántica posterior con fallback FTS5 | Local, pequeño; sqlite-vec+RRF indicados como orientación posterior, compatibilidad pendiente | Encargo de Franco |
| Clientes | Consumir núcleo por adaptadores, sin réplicas iniciales | Claude Code CLI primero, Pi después, móviles posteriores; MCP no prometido | Encargo de Franco |

## Decisiones
| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Propuesta: único repo | Núcleo y adaptadores comparten contrato | Repos por dispositivo: complejidad sin evidencia | Ciclos/equipos independientes |
| Confirmada: filtro antes de búsqueda | Evitar filtración entre proyectos | Filtrar solo resultados: no satisface requisito | No cambia sin aprobación explícita |
| Propuesta: autorización de ámbito dentro del núcleo para ambos adaptadores | No confiar solo en filtro enviado por cliente | HTTP como único guardián: CLI podría divergir | Definición técnica de autorización HTTP |
| Confirmada — enmienda de Franco: proyecto incluye ese proyecto + general; general solo general; nunca cruzar proyectos | Memoria general reutilizable con aislamiento | Cruce de proyectos o exclusión de general en consulta de proyecto: incumplen contrato | Cambio explícito de ámbitos |
| Confirmada — enmienda de Franco: CLI slice 1 usa identidad local confiable y exige confirmación explícita al guardar reglas generales | Acceso local sin adelantar autenticación API | Auth HTTP en slice 1: fuera de alcance; general sin confirmación: no autorizado | Auth API en su slice correspondiente |
| Confirmada — enmienda de Franco: ID estable del emisor, reintento idéntico sin duplicación, mismo ID y contenido distinto rechazado | Idempotencia sin confundir cambios con reintentos | Deduplicación automática por texto o sobrescritura del mismo ID: no cumplen identidad del contenido | Cambio explícito del contrato |
| Confirmada — enmienda de Franco: sustitución con nuevo ID y referencia anterior; conflictos señalados hasta resolución humana de Franco | Preservar antecedentes y no decidir verdad automáticamente | Resolución automática por fecha: no prueba verdad | Nueva política aprobada |
| Confirmada — enmienda de Franco: sin caducidad/purga automática; archivados excluidos de búsqueda normal | Evitar pérdida automática y resultados obsoletos archivados | Caducidad por tipo: riesgo de pérdida no aceptado en este contrato | Nueva política aprobada |
| Confirmada: HTTP privado autenticado antes de embeddings | Multidispositivo tiene prioridad | Exposición pública o inferencia primero: fuera de restricciones | Cambio explícito de alcance |
| Propuesta: alojamiento diferido | Falta equipo, presupuesto y disponibilidad | Elegir VPS o equipo ahora: supuesto injustificado | Revisión de comparación en PROJECT.md |

### Contrato mínimo de entrada F02
**Confirmado — origen: aprobación explícita de Franco del contrato mínimo F02 comunicada en el encargo de esta incorporación.**

- El recuerdo es un objeto cerrado con exactamente seis campos obligatorios de tipo string, nunca null: `id`, `type`, `scope`, `text`, `origin`, `date`. Se rechazan campos extra y entradas inválidas antes de escribir; no se imponen límites arbitrarios de longitud.
- `id`, `text` y `origin` deben contener algún carácter no blanco. Sus valores se conservan literalmente, sin recorte ni normalización.
- `type` admite únicamente `decision`, `learning`, `resolved-blocker` o `rule`.
- `scope` es exactamente `general` o `project:<nombre>`; el nombre debe ser no vacío, sin blancos extremos y sensible a mayúsculas. No se enumera ni restringe el conjunto de proyectos.
- `date` es la fecha civil del hecho atribuida y aportada obligatoriamente por el emisor, no la fecha de guardado, y no tiene valor por defecto. Su formato exacto es `YYYY-MM-DD`, con años `0001`–`9999` y fecha válida del calendario gregoriano, sin horas, zonas ni conversiones. No se incorporan timestamps internos.
- El mismo `id` y los mismos seis valores literales identifican el mismo recuerdo: el reintento no inserta; el orden de propiedades es irrelevante. Cualquier diferencia con el mismo `id` se rechaza sin mutación. IDs distintos con igual texto se conservan.
- La confirmación de una `rule` de ámbito `general` es la opción de operación `confirmGeneralRule`, no un campo del recuerdo. Los contratos existentes de ciclo de vida se mantienen sin ampliación.

**Decisión y justificación:** fijar este contrato mínimo permite validar la entrada e identidad sin inventar un esquema durante la construcción. Se descartan campos adicionales, normalización, fechas de guardado/defaults y deduplicación por texto porque alterarían el contrato aprobado. Cambiarlo requiere nueva aprobación explícita de Franco; no decide el esquema físico ni el algoritmo técnico.

## Supuestos y pendientes
- El esquema mínimo de entrada F02 queda aprobado en §Decisiones, «Contrato mínimo de entrada F02». Siguen pendientes dependencias, versiones, algoritmo técnico exacto de idempotencia y esquema físico de persistencia. El contrato funcional de ID estable del emisor, reintentos, rechazo y sustitución queda aprobado arriba; no hay deduplicación automática por texto.
- La composición de ámbitos y la identidad local confiable de CLI slice 1 quedan aprobadas arriba. La autorización y autenticación API se definen en su slice posterior; la VPN no autoriza por sí sola operaciones o proyectos.
- Mecanismo de auth, revocación, TLS, vinculación a interfaz privada, backup cifrado y restauración pendientes antes de HTTP. No registrar secretos ni cuerpos completos por defecto: propuesta para revisión.
- Embeddings requieren modelo/licencia, memoria medida con trabajo concurrente, soporte runtime/OS y disponibilidad de sqlite-vec verificados. No se asume GPU compartida entre Mac y WSL.
- **Contrato de gate confirmado — enmienda de Franco:** 30 recuerdos sintéticos verosímiles MVP de decisiones, aprendizajes, bloqueos resueltos y reglas; ámbito general y al menos dos proyectos ficticios; 10 consultas con esperados top 5 prefijados. Corpus versionado, separado de lógica y reemplazable por datos reales. Reemplaza la exigencia inicial de datos reales; baseline = archivo de concatenación del mismo corpus completo. No generar corpus ni código en esta enmienda; aún no existen estos artefactos y no se afirma que el gate pasó.
- **Contrato de salida confirmado — enmienda de Franco:** máximo cinco recuerdos y 4000 bytes de respuesta serializada UTF-8 completa, incluido salto final. Omitir recuerdos enteros que no caben, nunca truncarlos. Comparar con baseline sin umbral porcentual adicional. El informe de reducción de contexto es solo resultado de prueba, no uso real ni ahorro real. Se descartan baseline de datos distintos y conteo parcial porque no permiten validar este contrato; cambiarlo requiere decisión explícita.
- Orden completo posterior no aprobado; solo slice 1 conceptual y restricciones de precedencia confirmadas.

## Estado
**Aprobado — aprobación documental previa de Franco conservada.** Las propuestas y pendientes ajenos a esta enmienda no se convierten en decisiones aprobadas. No describe componentes existentes. **Confirmado — autorización explícita de Franco:** «Puedes descomponer F02 con esto»; la enmienda ya está aprobada y no exige reaprobar idénticas decisiones. La descomposición corresponde al planificador, no a esta actualización documental.

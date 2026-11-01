# Arquitectura propuesta — modo nueva

## Estructura y su razón
**BORRADOR de puerta 1, no arquitectura aprobada.** Entradas: requisitos explícitos de Franco recogidos en PROJECT.md. Se propone un único repo Flucastr.Memory-AI con librería independiente y adaptadores CLI/HTTP: simplicidad y reutilización. Varios repos no aportan hoy independencia demostrada; reconsiderar si aparecen equipos o ciclos separados. No se presupone estructura de carpetas ni dependencias.

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
| Propuesta: autorización de ámbito dentro del núcleo para ambos adaptadores | No confiar solo en filtro enviado por cliente | HTTP como único guardián: CLI podría divergir | Modelo de identidades aprobado |
| Confirmada: HTTP privado autenticado antes de embeddings | Multidispositivo tiene prioridad | Exposición pública o inferencia primero: fuera de restricciones | Cambio explícito de alcance |
| Propuesta: alojamiento diferido | Falta equipo, presupuesto y disponibilidad | Elegir VPS o equipo ahora: supuesto injustificado | Revisión de comparación en PROJECT.md |

## Supuestos y pendientes
- No hay dependencias, versiones, algoritmo exacto de idempotencia ni esquema aprobados. Proponer identidad estable y política de actualización antes de implementación; no confundir deduplicación por texto con idempotencia de reintentos.
- Confirmar si consulta de proyecto incluye general y cómo se autoriza cada ámbito. La VPN no autoriza por sí sola operaciones o proyectos.
- Mecanismo de auth, revocación, TLS, vinculación a interfaz privada, backup cifrado y restauración pendientes antes de HTTP. No registrar secretos ni cuerpos completos por defecto: propuesta para revisión.
- Embeddings requieren modelo/licencia, memoria medida con trabajo concurrente, soporte runtime/OS y disponibilidad de sqlite-vec verificados. No se asume GPU compartida entre Mac y WSL.
- El gate real carece de corpus/baseline; preparar datos solo desde material autorizado y sanitizado. No afirmar que pasó.
- Orden completo posterior no aprobado; solo slice 1 conceptual y restricciones de precedencia confirmadas.

## Estado
**BORRADOR — propuesta para revisión en puerta 1; detenerse aquí.** No describe componentes existentes ni autoriza implementación.

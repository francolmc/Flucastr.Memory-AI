# Flucastr.Memory-AI

## Problema
**Confirmado — encargo de Franco:** memoria reutilizable para su trabajo con agentes, sin cargar conversaciones completas ni secretos. Flucastr.AI representa el reinicio de su forma de construir con agentes del 28 de octubre; principal razona y define proyecto/arquitectura, agentes alto/medio/bajo usan Pi con modelos OpenAI y Claude Code; skills reducen contexto. No se afirma haber leído ese proyecto.

## Para quién
**Confirmado — Franco:** uso de Franco desde Mac, iPhone, iPad, PC y WSL mediante clientes delgados. Primer cliente Claude Code en Mac mediante CLI; después Pi. Frecuencia y otros usuarios no confirmados.

## Qué significa «funcionando»
**Confirmado — slice 1 aprobada conceptualmente con ajustes de gate:** librería independiente y CLI TypeScript/Node con SQLite+FTS5, guardar/buscar sin embeddings. Persistencia después de reiniciar; escritura idempotente; aislamiento de ámbitos antes de buscar; resultado vacío ante no coincidencias; esperado entre top 5; salida de máximo cinco recuerdos y 4000 bytes. Un gate único falla con código de salida no cero si cualquier criterio falla.

El gate necesita **30 recuerdos y 10 consultas reales de proyectos de Franco**, sanitizados, con esperados fijados antes de implementar. Comparará contexto seleccionado frente al **archivo completo utilizado hoy**, no frente a un fragmento conveniente. Registrar bytes: no equivale a ahorro demostrado de tokens ni dinero. Corpus y archivo baseline no entregados: gate todavía no ejecutable. No fabricar datos ni explorar otros proyectos para completarlo.

**Propuesta pendiente:** definir en ese contrato si el límite de bytes cubre serialización completa UTF-8 (recomendado), cómo se componen general+proyecto y qué umbral de reducción de bytes, si alguno, constituye aceptación.

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

### Retención y contradicciones: propuestas no aprobadas
1. **Recomendada para revisión:** sin caducidad destructiva automática inicialmente; archivar/sustituir con referencia y fecha, excluir archivados de búsqueda normal y pedir confirmación antes de purgar. Reduce pérdida accidental; crece almacenamiento y exige procedimiento de borrado real, incluidos backups.
2. **Alternativa:** caducidad por tipo con plazos elegidos por Franco y aviso previo; reduce obsolescencia, pero puede perder decisiones útiles. No se fijan días sin aprobación.
3. Contradicciones: conservar ambas fuentes, marcar conflicto y pedir resolución a Franco; una fecha más nueva no prueba verdad. No convertir automáticamente una regla de proyecto en general. Propuesta de borrado inmediato de secretos detectados, sin copiar su valor a logs o corpus, y revisión de copias afectadas; procedimiento aún pendiente.

## Decisiones
| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Confirmada: central única y filtro de ámbito previo | Privacidad entre proyectos y evitar bases divergentes | Bases sincronizadas/offline: complejidad fuera del inicio | Nueva necesidad aprobada de offline |
| Confirmada: SQLite+FTS5 en slice 1 | Validar persistencia y búsqueda antes de inferencia | Embeddings iniciales: memoria y complejidad prematuras | Gate FTS5 y evaluación posterior |
| Confirmada: núcleo independiente, CLI primero | Reutilizar lógica sin depender del cliente | Lógica dentro de un agente: acoplamiento | Restricción técnica demostrada |
| Confirmada: API privada autenticada antes de embeddings | Uso multidispositivo sin exposición pública | API pública y embeddings antes de API: contradicen restricciones | Cambio explícito de requisitos |
| Confirmada: embeddings locales y fallback FTS5 | Cero API pagada y degradación operativa | API de embeddings pagada: fuera de alcance | Revisión explícita de privacidad/costo |
| Propuesta: un repo | Menor coordinación para un núcleo y adaptadores | Varios repos: no hay independencia demostrada | Equipos o ciclos de despliegue distintos |

## Preguntas abiertas
1. ¿Puedes entregar o autorizar rutas concretas al corpus sanitizado de 30 recuerdos, las 10 consultas reales y el archivo completo baseline, fijando esperados antes de implementar? No incluir secretos; confirmar semántica general+proyecto y medición UTF-8 completa en ese contrato.
2. ¿Qué equipo propio estaría siempre encendido, con qué disponibilidad, tarifa eléctrica y uso comercial/personal de VPN, y qué presupuesto/región aceptarías para comparar VPS sin elegir aún?
3. ¿Cuál es el modelo exacto y chip del Mac declarado «Apple A18 Pro, 8 GB»? No bloquea definición FTS5.
4. ¿Apruebas retención sin borrado automático con archivado, o prefieres caducidad por tipo; y revisión humana de contradicciones y purgas, incluyendo backups?
5. ¿Apruebas la propuesta de un repo y la arquitectura conceptual, dejando mecanismo de auth, límites por identidad, backup/restauración y compatibilidad de clientes para definición previa a la slice HTTP?

## Estado
**BORRADOR — continuación de puerta 1.** Aprobaciones indicadas provienen del encargo explícito de Franco; propuestas y pendientes no están aprobados. Detenerse para revisión de Franco: no iniciar implementación, tareas ni comprometer alojamiento. Próximo paso: material real del gate y aprobación/corrección de propuestas; después cerrar contrato verificable y decisiones técnicas pendientes.

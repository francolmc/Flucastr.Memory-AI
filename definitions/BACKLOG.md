# Backlog — puerta 2

Propuesta corregida en borrador. Dirección y fidelidad Tailscale/camino finito confirmadas por Franco; organización anterior aprobada condicionada a abordabilidad, no ejecución. Revisar agrupación A/B dentro de F05 y aprobar individualmente tareas documentales en puerta 3. No se pide reaprobar dirección ni topes.

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Base ejecutable y verificable TypeScript/Node para librería independiente y CLI | habilitante | alto | medio | Habilitó construcción y verificación del núcleo; se conserva el historial. | hecha | |
| F02 | Memoria local persistente con librería independiente y CLI SQLite/FTS5, validada contra el contexto actual | producto | alto | alto | Provee persistencia, ámbitos e idempotencia reutilizables por los clientes; se conserva el historial. | hecha | |
| F03 | Central accesible mediante API HTTP privada autenticada | producto | alto | alto | Depende de F02; entrega local sintética, no central remota habilitada; se conserva el historial. | hecha | |
| F05 | Central FTS5 habilitada y reutilización explícita entre sesiones de Claude Code Mac mediante CLI → HTTP privado (dos paquetes separados) | producto | alto | medio | Depende de F02 y F03; primero habilitante central, después primer cliente, sin semántica ni memoria duplicada en Mac. | hecha | |
| F06 | Integración verificada de Pi con la central privada | producto | medio | medio | Propuesta posterior a F05, apoyada en F03; segundo cliente sin exigir semántica, sujeto a alcance y acceso autorizados propios. | hecha | |
| F04 | Búsqueda híbrida con embeddings locales, sqlite-vec/RRF y fallback FTS5 | producto | medio | alto | Detenida sin entrega; se conserva como horizonte semántico posterior a integraciones, no como orden de reanudación. | hecha | |
| F07 | Documentación del MVP | habilitante | alto | bajo | Nuevo alcance documental autorizado por Franco: explicar capacidades y uso real sin confundir ensayos sintéticos con operación. No depende de reabrir F04/F05; tarea sujeta a puerta 3. | hecha | → |

Estado del documento: aprobado

## Organización vigente y dependencias

F05 depende de F02/F03: A habilitante central → B primer Claude Code Mac → ficha agrupada R → primer ciclo real autorizado Flucastr.AI. F03 hecha acredita antecedente local sintético, no servicio remoto. Se conservan filas, estados y siguiente; no se compacta historial.

- **A y B separados dentro de F05:** cada paquete dispone de una ronda, un lote acotado de corrección y una reverificación; cerrar antes si no necesita corrección. Los dos borradores existentes entregan ahora fichas documentales completas, no resultados operativos. Provisión humana y ensayos posteriores tienen gates objetivos y requieren encargo operativo propio aprobado; no se crean tareas operativas en esta corrección.
- **Confirmado declarativo:** candidato Windows 11/Ubuntu WSL, 16 GiB, 24/7, más de 10 GB reservables; Franco administra/custodia y prueba Mac. Tailscale gestionado aprobado como dirección, Windows recomendado. No acredita instalación, espacio efectivo, trayecto Windows→WSL, elegibilidad/plan ni separación administrativa.
- **Arquitectura:** CLI delgada → HTTPS validado/auth F03 → central única SQLite/FTS5; solo central abre DB. La CLI actual es local y F03 escucha loopback: faltan adaptador y habilitación restringida, no son capacidades existentes. Sin DB cliente, certificados públicos inferidos, puertos públicos/Funnel ni TLS desactivado.
- **Operación condicionada:** Franco debe autorizar agrupadamente cuenta/plan/elegibilidad, instalación/enrolamiento, preparación, red/firewall/Windows→WSL, TLS/confianza/renovación, credenciales y pruebas, con ejecutor por acción. Solo evidencia sanitizada, nunca secretos. Ficha documental lista no equivale a central habilitada; gate fallido bloquea operación, no impide cerrar una ficha honesta.
- **R posterior visible, fuera del presupuesto A/B:** al cerrar A/B presentar una única ficha con evidencia disponible, brechas, acciones, responsables y alcance/tope propuesto. Exige aislamiento administrativo efectivo frente al agente/shell y pausa de escrituras; copia independiente cifrada y claves recuperables; rotación/revocación y restauración con RPO 24 h/RTO objetivo 4 h, copias diarias/7 diarias+4 semanales; saneamiento y copias afectadas; propuesta mínima de contenidos/ámbitos Flucastr.AI y autorización explícita de allowlist/datos reales. No explorar Flucastr.AI ni sustituir Atlas/Birch silenciosamente. R requiere aprobación propia antes de operar; si aislamiento/recuperación imposibles, cerrar bloqueado con requisito mínimo y decisión agrupada de contexto alternativo. Primer ciclo real solo con R satisfecho y permiso expreso.
- **Parada:** permisos/acceso faltantes, controles incumplidos, tope agotado, gasto excedido o nuevo host/transporte/dependencia/cambio amplio: evidencia y brecha mínima, sin alternativas automáticas ni investigación indefinida. Diseño ≠ loopback sintético ≠ Mac privado sintético ≠ uso real.
- **Después:** F06 solo Pi; Codex y Desktop por fases propias, móvil después. Sin modelos/semántica; F04 detenida sin entrega, no reanudable por su estado histórico.

## Fuentes y revisión pendiente

Confirmado por PROJECT §§Qué significa «funcionando», Restricciones, Dirección central actualizada, Primera versión Tailscale; ARCHITECTURE §§Política F03, Rotación/durabilidad/recuperación, Contrato mínimo F02, Seguridad, Presupuesto de intervención central y primer cliente, Primera versión Tailscale y camino finito a uso útil; STATUS como fotografía, no permisos. Andamiaje leído en package.json; no se ejecutó verificación ni operación.

Revisar esta agrupación y los dos borradores F05 corregidos, uno por uno. Su aprobación documental no autoriza provisión ni pruebas futuras. Estados originales preservados. No se modifica definición ni STATUS.

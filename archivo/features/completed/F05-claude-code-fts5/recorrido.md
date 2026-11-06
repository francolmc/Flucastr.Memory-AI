# F05-B — recorrido documental Claude Code entre sesiones

## Estado
Documentación lista para revisión. No se ha instalado ni probado Claude Code en Mac, no existe evidencia de cliente HTTPS ni de central privada habilitada. Este protocolo no es una integración ni un ensayo.

## Gates B — todos pendientes hasta evidencia

| Gate | Estado actual / evidencia necesaria |
|---|---|
| A: central privada LAN/exterior | Pendiente. `acceso.md` documenta que el servidor existente escucha en loopback; se requiere acreditar trayecto privado restringido desde Mac por LAN/exterior. |
| A: TLS y auth F03 | Pendiente. Validación TLS, autenticación válida y denegaciones de auth inválida/ausente deben estar acreditadas sin mutación. |
| A: persistencia y denegaciones | Pendiente. Escritura central persistente y solicitudes fuera de permiso denegadas sin mutación, en ensayo autorizado. |
| Permiso Mac | Pendiente. Franco autoriza explícitamente integración y ensayo sintético, con ejecutores y alcance definidos. |
| Cliente Claude | Pendiente. Registrar versión y ayuda disponibles y acceso autorizado; no inventar opciones ni comandos. |
| CLI HTTPS | Pendiente. Implementación y verificación propias, CLI cliente por HTTPS validado/auth F03 hacia la misma central; sin `--db` local como cliente. La CLI actual `runCli(args: string[])` usa `--db` local y abre SQLite, sin adaptador HTTP. |

Fallar o no acreditar cualquier gate impide operar; no impide cerrar esta documentación. A (habilitante central) y B (cliente) son niveles distintos.

## Corpus sintético prefijado (solo guía; no ejecutado)
Fecha civil fija: `2030-01-15`. Término único común: `quartz`. IDs distintos. Los tres objetos contienen exactamente `id`, `type`, `scope`, `text`, `origin`, `date`:

```json
{"id":"b-atlas-001","type":"decision","scope":"project:Atlas","text":"quartz: Para Atlas, el nombre ficticio del artefacto será Lumen-7.","origin":"synthetic-f05","date":"2030-01-15"}
{"id":"b-birch-001","type":"decision","scope":"project:Birch","text":"quartz: Birch conserva el nombre ficticio Cedar-2.","origin":"synthetic-f05","date":"2030-01-15"}
{"id":"b-general-001","type":"decision","scope":"general","text":"quartz: La regla general es citar el identificador del recuerdo recuperado.","origin":"synthetic-f05","date":"2030-01-15"}
```

No incorporar corpus, benchmark, secretos, conversaciones ni datos reales. No modificar allowlist.

## Protocolo futuro condicionado — no ejecutar ahora
1. Con permiso y gates aprobados, guardar los tres objetos sintéticos en la central por el cliente HTTPS acreditado.
2. Reintentar Atlas con el objeto idéntico (idempotencia); intentar mismo ID con texto distinto y comprobar rechazo sin mutación.
3. Cerrar el proceso y abrir sesión Claude nueva, sin historial anterior.
4. Recuperar Atlas vía CLI HTTPS. Pedir a Claude que responda usando el nombre del artefacto recuperado y cite `b-atlas-001`. No incluir nombre ni respuesta esperada en el prompt. Conservar evidencia sanitizada de solicitud/resultado.
5. Confirmar central idéntica antes/después. Nunca copiar ni abrir una base en cliente.

No fijar comandos/opciones Claude ni HTTP antes de acreditar versiones, ayuda, adaptador y autorización; la futura tarea operativa debe incluir comandos literales antes de empezar. No sustituir el cliente por `save/search --db`.

## Evidencia futura y topes
Evidencia sanitizada: versiones, comandos exactos no secretos, códigos y stdout completo sintético. Respuestas hasta cinco recuerdos y 4000 bytes UTF-8 completos, incluido salto final; contar con `Buffer.byteLength(texto, 'utf8')`, sin truncar. No registrar tokens, claves, conversaciones ni configuración privada.

Una ronda B, un lote acotado de corrección y una reverificación; separado de A. Detener ante brecha, permiso/control faltante, ampliación o tope agotado. No hay operación, transcripción ni resultado de ensayo en esta entrega. `npm run verify` es regresión futura inferida desde package.json, esperada código 0; no ejecutado y no acredita cliente ni aislamiento.

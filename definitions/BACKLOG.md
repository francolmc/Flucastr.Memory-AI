# Reinicio — plan S1–S5

| ID | Feature | Tipo | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| S1 | Base verde (F01-base-verde): S1a scripts/docs → S1b retirada física y transporte sin TLS propio | habilitante | alto | alto | Retira legado sintético y deja install/build/test verificables antes de ampliar el servicio; partición necesaria por volumen de retirada | hecha | |
| S2 | Servidor central `mem serve [--port 7420]`, HTTP 127.0.0.1; MEM_DB o ~/.mem/mem.sqlite, MEM_TOKEN o ~/.mem/token; save/search/recent/forget, OR+BM25 persistente | producto | alto | medio | Establece contrato y persistencia únicos antes de conectar clientes; token nunca impreso | pendiente | → |
| S3 | Cliente global bin/npm link sin DB; MEM_URL/MEM_TOKEN; save --type [--scope] texto con ID/fecha/origen automáticos, search, recent --limit 15, forget; scope raíz Git, error una línea y E2E loopback | producto | alto | medio | Conecta Mac/WSL al servidor ya verificable; recent permite --limit 15, sin aplicarle el límite de búsqueda top5/4000 bytes | pendiente | |
| S4 | Unidad systemd, comandos Tailscale Serve HTTPS solo tailnet y backup sqlite3 .backup nocturno con cron y retención de siete copias exitosas; instala Franco | habilitante | alto | medio | Prepara disponibilidad central y copia real antes del recorrido entre agentes | pendiente | |
| S5 | Claude SessionStart silencioso sin datos/servidor, snippet ~/.claude/settings.json, bloques de cinco líneas CLAUDE.md/AGENTS.md, inicio Pi y README <100 líneas | producto | alto | medio | Cierra el MVP: decisión Don Financio guardada desde Claude Mac aparece al abrir Pi WSL en el mismo repo sin pegar | pendiente | |

Estado del documento: aprobado

Confirmado: encargo de Franco y contrato de definitions/PROJECT.md y definitions/ARCHITECTURE.md. Orden S1 → S2 → S3 → S4 → S5; objetivo aproximado de 200 líneas por slice. S1 excede ese objetivo por eliminaciones obligatorias: S1a/S1b pertenecen a la misma fila, no son slices nuevas. Solo se descompone S1a en la tarea inicial (tres archivos); S1b conserva toda la retirada física y adaptación pendiente y requiere particiones acotadas antes de ejecutarse. No se crean esas tareas ni se ejecuta S1 durante esta preparación. Aprobación conjunta del plan completo por Franco, sin aprobaciones intermedias.

# Comparación: memoria central semántica

**BORRADOR — 2026-11-03.** Investigación pública documental, no ensayo. Sin cambios vigentes. «Comprobado» = publicado, no ejecutado; `main` es móvil.

## Objetivo y evidencia local

**Confirmado, encargo actual de Franco:** memoria global central en servidor, persistente entre proyectos/sesiones, búsqueda por cercanía semántica e integración sencilla con Claude Code y Pi. Host indiferente; SQLite posible. FTS5 solo NO satisface MVP; semántica no es fase opcional. Sin autorización para extensiones, instalaciones ni nueva infraestructura.

**Lectura local:** definiciones aplazan semántica; backlog prioriza F05 y detiene F04; F03 solo local sintética. REPOS: uno. package.json: TS/Node, CLI/gates, sin vector declarado. REVISION-MVP reporta cliente parcial/SAN; no objetivo ni prueba reproducida. Sin lectura de tareas/código.

## Comparación

Dos soluciones existentes; fuentes primarias **2026-11-03**. Sin pruebas instaladas.

| Candidato | Servidor, vectores, embeddings y ámbitos | Acceso, mantenimiento y coste/restricciones |
|---|---|---|
| **Adaptar MCP Memory Service (doobidoo)** [1–5] | SQLite-vec persistente; búsqueda semántica real y filtros AND/OR por tags/particiones. ONNX integrado: `all-MiniLM-L6-v2` inglés; alternativa multilingüe documentada. API externa OpenAI-compatible **solo con sqlite_vec**. Tags no equivalen a autorización. | MCP **Streamable HTTP POST /mcp**, REST, OAuth persistible en SQLite y TLS. Apache-2.0 verificada; README declara mantenimiento por una persona. Local evita tarifa de embeddings, no coste de cómputo/modelo. Requiere Python y dependencias nativas. Filtrado previo al top-k, proyecto+general, idempotencia contractual y desactivar toda mutación automática **no acreditados de extremo a extremo**. |
| **Adaptar Mem0 OSS self-hosted** [6–8] | FastAPI + PostgreSQL/pgvector persistente y dashboard; vectores reales. Overview declara OpenAI `text-embedding-3-small` configurable; extracción añade LLM. Entidades user/agent/run; equivalencia general/proyecto y aislamiento por clave no comprobados. | Auth activa, JWT dashboard y claves API; remoto requiere HTTPS privado adicional. Apache-2.0; docs actuales con migraciones, sin SLA verificado. Telemetría por defecto desactivable. **MCP remoto del servidor OSS actual no comprobado**: no atribuirle MCP comercial/OpenMemory histórico. REST exige shell/adaptación. Mayor stack y coste externo LLM+embeddings por defecto. |
| **Construir mínimo sobre este repo** (lectura local) | Reutiliza contratos F02/F03 y persistencia declarados; falta motor vectorial, embeddings y evidencia semántica. FTS5 solo baseline. | Habría que implementar semántica e integración de clientes además de remoto. Menos dependencia funcional externa, más mantenimiento propio. Que sea más trabajo es **inferencia por superficie faltante**, no estimación medida. |

## Recomendación única

**Adaptar MCP Memory Service, condicionada a preflight de contratos; no presentarlo como integración probada.** Ya documenta central vectorial y transporte remoto soportado por ambos clientes, sin PostgreSQL, dashboard separado ni LLM de extracción obligatorio. Una instancia, un SQLite-vec **solo en servidor**; sin Hybrid, Cloudflare, sincronización, grafos, consolidación, captura de transcripciones ni hooks para la demo.

Adaptación: configuración/política compartida; como máximo filtro estrecho de servicio. Preflight debe verificar proyecto+general antes del ranking, exclusión de otros proyectos, ausencia de purga/sustitución automática y auth en toda superficie. Si requiere fork amplio, parar; MCP no demuestra esos contratos.

**Embeddings:** proponer ONNX multilingüe integrado si cabe en host autorizado, para evitar cuenta/facturación/otro servicio; no imponer local por principio. RAM, latencia, artefactos/licencia del modelo exacto y compatibilidad pendientes; licencia del servicio no cubre automáticamente pesos. API externa documentada [4] reduce cómputo, pero envía texto/consultas, cobra y depende de red. Documenta fallback incluso hash: hash/FTS5 NO acreditan semántica. Registrar modelo efectivo, no mezclar dimensiones. Fail-closed externo/precio vigente no comprobados; PROJECT excluye API pagada y aquí no se revoca.

Mem0 añade piezas/LLM y MCP OSS incierto; construir repite capacidades antes de probar valor. Cambiaría la recomendación incompatibilidad concreta de seguridad/ámbitos/coste, no preferencia de stack.

## Conservar / pausar, sin borrar

Conservar repo, núcleo/CLI/HTTP, contratos F02/F03 y corpus como referencia/regresión, sin migrar datos. Gates propios no certifican servicio ajeno. Pausar como propuesta integración solo FTS5, adquisición F04, prioridad SAN y andamiaje general; no cambiar estados ni borrar nada. TLS sigue obligatorio. Reusar acceso privado aprobado si sirve; no elegir host definitivo ni rehacer Windows/WSL.

## Setup y uso

**Clientes publicados, no instalados:** Claude Code HTTP/OAuth: `claude mcp add --transport http --scope user memoria <HTTPS/mcp>` y `/mcp` [9]. Pi upstream: Streamable HTTP (no SSE), `pi mcp add memoria --url <HTTPS/mcp>`, configuración usuario `~/.pi/agent/mcp.json`, login OAuth y `/reload` [10]. Sin extensión según docs; comprobar versión instalada antes: si falta capacidad, bloqueo, no actualizar implícitamente.

Tras permiso, operador fija release/artefactos, base persistente, URL privada HTTPS válida y OAuth persistente; custodia secretos y configura ambos clientes/login a la misma URL. Solo superficie necesaria, sin anónimo, túnel público, bypass TLS ni SQLite cliente. Code/Pi pueden usar red privada; no copiar quickstart público de claude.ai. Interoperabilidad OAuth instalada sigue sin probar.

Política persistente por cliente, autorizada por Franco, indica ámbito y cuándo guardar/buscar. Conexión y renovación OAuth son automáticas; **consultar/escribir no queda garantizado por MCP**. Uso: «guarda esta decisión en Atlas»; sesión nueva «consulta memoria de Atlas para resolver …». Agente llama herramienta/usa ID, sin pegar salida. Medir tiempo y permisos: objetivo una petición por operación sin repetir setup. Intención/ámbito explícitos son fricción; auto-recall, hooks y captura automática fuera del piloto.

## Demo mínima, secuencia y parada

Corpus sintético: general «Los reintentos de cobro requieren clave idempotente»; Atlas «La cola de avisos conserva entregas fallidas para reintentar después»; Birch una decisión contradictoria solo Birch. **Claude Code A** guarda Atlas por herramienta: registrar ID/ámbito. Cerrar sesión/proceso, reiniciar servidor preservando base. **Pi B nuevo** pregunta «¿Cómo tratamos los mensajes que no llegaron cuando vuelve la conectividad?», ámbito Atlas, sin texto esperado. Recuperar/usar ID. Añadir general/Birch, tres paráfrasis prefijadas y caso sin respuesta.

Éxito: central persistente tras reinicio, sin DB cliente; vector/modelo efectivo sin fallback hash/FTS5; esperado top 5; Atlas+general sin Birch/general solo general y filtro previo al top-k; sin purga; TLS/auth y denegación sin credencial; ambos clientes llaman sin copiar salida. Contratos F02 restantes (idempotencia/4000 bytes) con evidencia o brecha explícita; demo no es paridad total ni permiso real.

**Presupuesto propuesto, no autorización ni garantía:**
1. <=1 h: versiones, release/licencias, ámbitos/auth/automatismos; viable o bloqueado antes de instalar.
2. <=3 h: central temporal, modelo y HTTPS/OAuth en host que Franco autorice; sin nueva plataforma de infraestructura.
3. <=2 h: dos clientes y matriz sintética completa.
4. <=2 h: un único lote pequeño de corrección y una reverificación; cerrar antes si pasa.

**Techo 8 h activas**, esperas humanas aparte; no recarga topes previos. Cero contratación/API pagada propuestas; recursos existentes tienen coste. Gasto nuevo requiere aprobación. Franco aporta host temporal, operador/custodio, permisos instalación/modelo/red y acceso clientes; nunca credenciales en documentos.

Parar por capacidad MCP ausente, ámbitos/auth no verificables, licencia/modelo semántico faltante, TLS inválido, permiso/host ausente, extensión/fork amplio, gasto no aprobado o techo agotado. Entregar evidencia y brecha; no volver a FTS5 como cumplimiento ni cambiar proveedor automáticamente.

Demo sintética: confinamiento, TLS/auth, custodia y persistencia; no HA ni backups sofisticados. Datos reales después: permiso de contenidos/ámbitos, separación administrativa, copias/restauración, revocación/saneamiento conforme contratos vigentes; no habilitados aquí.

**Decisión esencial para Franco:** A) autorizar después preflight y piloto sintético dentro del techo (**recomendada**); B) mantener pausa documental. A requiere una autorización agrupada de host temporal, operador y acciones; no servidor definitivo ni permiso heredado de ejecución.

## Fuentes primarias (consulta 2026-11-03)

1. [README](https://github.com/doobidoo/mcp-memory-service/blob/main/README.md).
2. [Remote MCP](https://github.com/doobidoo/mcp-memory-service/blob/main/docs/remote-mcp-setup.md).
3. [Configuración](https://github.com/doobidoo/mcp-memory-service/blob/main/docs/mastery/configuration-guide.md).
4. [Embeddings externos](https://github.com/doobidoo/mcp-memory-service/blob/main/docs/deployment/external-embeddings.md).
5. [Licencia servicio](https://github.com/doobidoo/mcp-memory-service/blob/main/LICENSE): Apache-2.0.
6. [Mem0 servidor OSS](https://github.com/mem0ai/mem0/blob/main/server/README.md).
7. [Mem0 overview](https://github.com/mem0ai/mem0/blob/main/docs/open-source/overview.mdx).
8. [Mem0 licencia](https://github.com/mem0ai/mem0/blob/main/LICENSE): Apache-2.0.
9. [Claude Code MCP](https://code.claude.com/docs/en/mcp).
10. [Pi upstream MCP](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/mcp.md).

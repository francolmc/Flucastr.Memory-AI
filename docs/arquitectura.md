# Arquitectura

Este repositorio ofrece memoria SQLite/FTS5 mediante un servidor HTTP central. El cliente `mem` y el servidor MCP stdio usan ese servidor; no abren una base local.

## Mapa de carpetas y módulos

```text
src/
├── domain/       Tipos, reglas y validación de memoria; no hace I/O.
├── storage/      SQLite, esquema, migraciones, FTS5 y comprobación de SQLite.
├── http/         Autenticación, cliente HTTP, lectura limitada, rutas, respuestas y servidor.
├── mcp/          Servidor MCP stdio, instrucciones y herramientas.
├── cli.ts        CLI local para doctor, serve y operaciones locales.
├── mem.ts        Cliente remoto `mem`.
├── remote-cli.ts Lógica de comandos del cliente remoto.
├── agent-config.ts Configuración que genera `mem init <agente>`.
├── serve.ts      Composición del almacenamiento y el servidor HTTP.
└── index.ts      Exportaciones públicas y compatibilidad con imports existentes.
```

Los módulos raíz `memory.ts`, `http-auth.ts`, `http-client.ts`, `http-server.ts` y `response.ts` son fachadas de compatibilidad. Reexportan las implementaciones que viven en `storage/` o `http/`; los consumidores existentes pueden seguir importándolos. Los entrypoints `cli.ts`, `mem.ts` y `mcp/index.ts` también se mantienen en sus rutas actuales.

## Flujo de una petición

### HTTP y MCP

```text
Cliente HTTP ───────────────────────────────> http/server.ts
                                               │ autentica y aplica límites
                                               ▼
                                           http/routes.ts
                                           ruta y validación
                                               │
MCP cliente ─stdio─> mcp/index.ts ─> mcp/tools.ts ─> http/client.ts
                                               │               │ HTTP
                                               │               └───────> http/server.ts
                                               ▼
                                      domain/memory.ts
                                      tipos y reglas
                                               │
                                               ▼
                                      storage/memory.ts
                                       │             │
                                       ▼             ▼
                              storage/schema.ts    SQLite
                              esquema y FTS5       datos
```

MCP registra sus herramientas en `mcp/tools.ts`. Cada herramienta llama al cliente compartido de `http/client.ts` para hablar con el servidor central. El servidor MCP conserva el protocolo stdio y las instrucciones en `mcp/index.ts`. En el recorrido HTTP, `http/server.ts` autentica primero y `http/routes.ts` despacha las rutas existentes; `http/body.ts` limita la lectura del cuerpo y `http/response.ts` serializa resultados de búsqueda.

### Composición del servidor

`serve.ts` conecta la apertura del almacenamiento con el servidor HTTP y su autenticador. Es la raíz de composición: configura adaptadores, pero no implementa consultas SQL ni atiende rutas. `storage/memory.ts` ejecuta las operaciones SQLite; `storage/schema.ts` prepara tablas, índice FTS5 y migraciones.

## Dónde hacer cambios

- **Reglas, tipos o validación de memoria:** `src/domain/`.
- **Persistencia, consultas, FTS5 o migraciones:** `src/storage/`.
- **Autenticación, límites, rutas o respuestas HTTP:** `src/http/`. Las rutas y validaciones del transporte están en `routes.ts`; la lectura acotada está en `body.ts`.
- **Herramientas, instrucciones o protocolo MCP:** `src/mcp/`; el registro y los manejadores de herramientas están en `tools.ts`.
- **Comandos locales:** `src/cli.ts`; cliente remoto `mem`: `src/mem.ts` y `src/remote-cli.ts`.
- **Arranque y conexión de adaptadores:** `src/serve.ts`.

Al mantener imports públicos o entrypoints, conserva las fachadas y rutas existentes. Los recorridos automáticos de HTTP y MCP están en `test/`; la verificación completa es `./verify`.

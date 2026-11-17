---
estado: borrador
rama: chore/arquitectura-legible
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Grupo C: arquitectura legible

## Objetivo
Ordenar responsabilidades sin cambiar comportamiento y documentar dónde hacer cambios.

## Exploración
Inventario inicial en líneas: `agent-config.ts` 50, `cli.ts` 89, `http-auth.ts` 70, `http-client.ts` 45, `http-server.ts` 58, `index.ts` 23, `mem.ts` 58, `memory.ts` 168, `remote-cli.ts` 26, `response.ts` 16, `serve.ts` 40, `mcp/index.ts` 118. Muchas líneas contienen múltiples instrucciones, por lo que el conteo subestima la complejidad.

Mapa actual: `mem.ts` y `mcp/index.ts` → `http-client.ts` → HTTP; `serve.ts` → `http-server.ts` y `memory.ts` → SQLite/FTS5; `cli.ts` → `index.ts` → `memory.ts` y SQLite. `http-server.ts` mezcla transporte, validación, rutas y errores; `memory.ts` mezcla dominio, autorización, migraciones y SQLite. `mcp/index.ts` mezcla configuración, protocolo y transporte cliente. El servidor HTTP no importa SQLite directamente.

`package.json`, `Dockerfile`, README y numerosas pruebas referencian rutas `dist/src` o imports de `src`; conservar entrypoints y compatibilidad o actualizar explícitamente rutas de imports de pruebas sin cambiar sus aserciones. El mapa deberá actualizarse tras A y B.

## Evaluación
Propuesta: `domain/` para tipos y reglas puras; `storage/` para SQLite, FTS y migraciones; `http/` para servidor, rutas y autenticación; `mcp/` para protocolo; `cli/` para clientes, conservando adaptadores de entrada compatibles. Mover primero sin cambios lógicos y luego dividir por responsabilidad; cada paso usa `./verify` en verde según lo pedido.

## Supuestos
Los nombres de carpetas son organización interna, sin cambios observables de HTTP/MCP ni de formato; si cambian, revisar diseño.

## Validación
Pendiente de Franco; historias y partición detallada se preparan tras validar la estructura y completar A y B.

## Alcance
Código `src/`, imports de pruebas solo cuando cambie su ruta, referencias de empaquetado necesarias y `docs/arquitectura.md`. Sin alterar aserciones de aceptación ni datos.

## Verificación
`./verify` después de cada paso y al final; conservar y probar una base anterior.

## Evidencia
Pendiente.

## Notas
Depende de A y B; el plan de ejecución se ajustará a su resultado integrado.

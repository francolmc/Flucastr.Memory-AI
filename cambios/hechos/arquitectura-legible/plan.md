---
estado: en curso
rama: chore/arquitectura-legible
base: main
repos: [.]
ejecutor: constructor
tramo: 12
continuidad: continua
tipo: codigo
---
# Grupo C: arquitectura legible

## Objetivo
Organizar el servidor por responsabilidad, mantener los contratos existentes y documentar dónde realizar cambios.

## Exploración
Base: main con A y B integrados. Tamaños actuales en líneas: agent-config.ts 50, cli.ts 89, http-auth.ts 70, http-client.ts 45, http-server.ts 75, index.ts 23, mem.ts 58, memory.ts 160, remote-cli.ts 26, response.ts 16, serve.ts 49, mcp/index.ts 118. Muchas líneas contienen varias instrucciones y subestiman la complejidad.

Mapa: `mem.ts` y `mcp/index.ts` → `http-client.ts` → servidor HTTP; `serve.ts` → `http-server.ts` y `memory.ts` → SQLite/FTS5; `cli.ts` → `index.ts` → `memory.ts` y SQLite. `http-server.ts` reúne lectura, rutas, autenticación y errores; `memory.ts` reúne reglas, autorización, migraciones y almacenamiento; `mcp/index.ts` reúne configuración, protocolo y herramientas. `index.ts` hace una prueba directa de SQLite además de exportar HTTP. `serve.ts` compone almacenamiento y servidor sin ejecutar consultas ni manejar peticiones.

Los ejecutables y exportaciones de `package.json` y Docker apuntan a `src/mem.ts`, `src/mcp/index.ts`, `src/cli.ts` e `src/index.ts` compilados; las pruebas importan rutas existentes. Se conservan con fachadas cuando corresponda, sin cambiar pruebas ni aserciones. `test/previous-database.test.ts` y su fixture usan una base anterior y comprueban compatibilidad. El límite HTTP, el orden de autenticación, respuestas y errores existentes son contratos.

## Evaluación
Mantener los archivos actuales evita movimientos pero conserva responsabilidades mezcladas. La alternativa elegida extrae módulos por responsabilidad, con fachadas compatibles; cuesta más pasos, pero permite verificar cada movimiento y mantener las rutas públicas. Primero se mueven módulos completos sin cambiar lógica; después se separan responsabilidades.

## Supuestos
- `serve.ts` es raíz de composición: puede conectar adaptadores, sin ejecutar SQL ni atender peticiones; si se interpreta de otro modo, ajustar estructura antes de ejecutar.
- Conservar entrypoints y fachadas evita cambiar imports de pruebas; si alguna ruta no puede preservarse, detenerse y proponerlo antes de editar pruebas.
- Se omite una validación intermedia de diseño: Franco ya pidió esta estructura orientativa, sin cambios de comportamiento, y aprobará el plan completo.

## Decisiones ya tomadas
- Dominios puros en `src/domain/`, SQLite en `src/storage/`, transporte y rutas en `src/http/`, protocolo en `src/mcp/`; las CLI conservan sus entradas existentes y los clientes compartidos van en HTTP.
- No cambiar formato, esquema, contratos, mensajes, códigos, orden de validación, efectos ni interfaz pública; no se alteran pruebas existentes.
- Ejecutor: constructor, porque los requisitos, contexto, verificaciones y bloqueos están definidos y no se necesitan credenciales, producción ni despliegue.

## Decisiones
Ninguna adicional.

## Validación
Franco aprobó este plan del grupo C; A y B están integrados y D tendrá plan separado.

## Alcance
Solo archivos de producto enumerados en cada tramo, `docs/arquitectura.md` y este plan. Sin cambios de pruebas existentes, package.json, Dockerfile, migraciones ni formato de datos. No borrar funciones sin antes registrar sus usos. Si una extracción requiere más archivos de producto que los previstos, detenerse y devolver el plan para ajustar el alcance. Se conserva `index.ts` y todos los entrypoints productivos.

## Verificación
`./verify` desde cero al final: suite existente, CLI, MCP, HTTP y SQLite real, incluida la base anterior. Cada paso intermedio ejecuta `VERIFY_RAPIDO=1 ./verify` con caché; cada tramo registra duración, salida y punto de control (archivos, diff resumido y resultado). No editar pruebas para hacerlas pasar.

## Condiciones de parada
Avanzar solo con comprobación verde y dentro del alcance, sin decisiones pendientes. Detenerse si la misma causa falla dos veces, si falta decisión o se necesita salir del alcance, o si la verificación tarda más del doble de su duración medida; dejar evidencia y motivo. No hacer commit. Revisión: fin de historia.

## Pasos
Los tramos son secuenciales y forman una única historia continua de reorganización. Todos dependen del Docker operativo usado por `./verify`; se conserva el recorrido productivo y las importaciones antiguas. Medición inicial en este entorno Docker: `VERIFY_RAPIDO=1 ./verify` ≈2 min, 74/74 y salida 0; la última medición de `./verify` fue ≈170 s.


- [Tramo 1: Mover autenticación HTTP](tramo-1.md).
- [Tramo 2: Mover cliente HTTP](tramo-2.md).
- [Tramo 3: Mover respuestas HTTP](tramo-3.md).
- [Tramo 4: Mover almacenamiento](tramo-4.md).
- [Tramo 5: Mover servidor HTTP](tramo-5.md).
- [Tramo 6: Separar reglas de memoria](tramo-6.md).
- [Tramo 7: Separar preparación de SQLite](tramo-7.md).
- [Tramo 8: Separar lectura del cuerpo](tramo-8.md).
- [Tramo 9: Separar rutas HTTP](tramo-9.md).
- [Tramo 10: Aislar comprobación SQLite](tramo-10.md).
- [Tramo 11: Clarificar herramientas MCP](tramo-11.md).
- [Tramo 12: Documentar arquitectura](tramo-12.md).

## Evidencia
- Tramo 1, A1 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 135 s): 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 2, A2 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 140 s): 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 3, A3 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 130 s): 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 4, A4 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 121 s): 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 5, A5 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 127 s): 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 6, A6 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 121 s): typecheck/build pasaron; 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 7, A7 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 123 s): typecheck/build pasaron; 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 8, A8 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 121 s): typecheck/build pasaron; 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 9, A9 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 98 s): typecheck/build pasaron; 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 10, A10 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 104 s): typecheck/build pasaron; 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 11, A11 — `$ VERIFY_RAPIDO=1 ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 111 s): typecheck/build pasaron; 74 pruebas aprobadas, 0 fallidas; CLI help y doctor pasaron; smoke HTTP/SQLite: `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; `exit 0`.
- Tramo 12, A12 — `$ ./verify` (ejecutado con límite `timeout 240s`; duración aproximada 170 s): compilación, 74 pruebas aprobadas, CLI help y doctor, smoke HTTP/SQLite y paquete del bin `mem` pasaron; `VERIFY OK`, `exit 0`.

## Notas
Revisor: el aviso de varias capas en cada tramo se debe al recorrido de aceptación HTTP/MCP hasta SQLite; el alcance de cada tramo sigue limitado a sus archivos declarados.
Pendiente. En cada extracción usar nombres coherentes y constantes descriptivas cuando aclaren valores existentes; conservar los errores públicos y dejar comentarios solo si explican el motivo. No introducir refactorizaciones cosméticas fuera de los archivos de cada tramo.
- Punto de control tramo 1: archivos `src/http-auth.ts` y `src/http/auth.ts`; traslado intacto de autenticación con fachada compatible; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈135 s). Diff revisado: la fachada reexporta tipos y funciones existentes; imports previos permanecen válidos.
- Punto de control tramo 2: archivos `src/http-client.ts` y `src/http/client.ts`; traslado intacto del cliente HTTP con fachada compatible; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈140 s). Diff revisado: la fachada reexporta clase, función y tipo; imports previos permanecen válidos.
- Punto de control tramo 3: archivos `src/response.ts` y `src/http/response.ts`; traslado de serialización de respuestas con fachada compatible y ruta del tipo ajustada por la nueva ubicación; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈130 s). Diff revisado: export público y salida permanecen iguales.
- Punto de control tramo 4: archivos `src/memory.ts` y `src/storage/memory.ts`; implementación de almacenamiento trasladada y fachada reexporta la API y los tipos; SQL y lógica intactos; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈121 s). Diff revisado: consumidores y pruebas conservan sus imports.
- Punto de control tramo 5: archivos `src/http-server.ts` y `src/http/server.ts`; implementación HTTP trasladada con imports internos actualizados y fachada compatible; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈127 s). Las rutas, orden de validaciones y respuestas no cambiaron.
- Punto de control tramo 6: archivos `src/domain/memory.ts` y `src/storage/memory.ts`; tipos, constantes y validación se extrajeron a dominio puro y almacenamiento los importa/reexporta; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈121 s). Diff revisado: mensajes y reglas de validación y API importada se conservan.
- Punto de control tramo 7: archivos `src/storage/memory.ts` y `src/storage/schema.ts`; preparación de esquema, FTS y migraciones extraída con SQL, orden y manejo de errores intactos; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈123 s). Diff revisado: persistencia y apertura de bases anteriores pasan.
- Punto de control tramo 8: archivos `src/http/server.ts` y `src/http/body.ts`; lectura acotada del cuerpo extraída con respuesta 413, cierre de conexión, corte de lectura y errores conservados; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈121 s). El límite por defecto y configurable mantiene sus pruebas.
- Punto de control tramo 9: archivos `src/http/server.ts` y `src/http/routes.ts`; despacho HTTP extraído con almacenamiento y límite de cuerpo explícitos; autenticación sigue precediendo ruta/método/content-type, y las respuestas/validaciones se conservan; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈98 s). Diff revisado: los entrypoints públicos y pruebas permanecen sin cambios.
- Punto de control tramo 10: archivos `src/index.ts` y `src/storage/probe.ts`; la función `probeSqlite` pasó intacta al módulo de almacenamiento y el entrypoint mantiene su exportación; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈104 s). CLI doctor continúa reportando SQLite y FTS5.
- Punto de control tramo 11: archivos `src/mcp/index.ts` y `src/mcp/tools.ts`; registro y manejadores MCP separados del entrypoint stdio, que conserva instrucciones y creación del servidor; `VERIFY_RAPIDO=1 ./verify` pasó (74/74, exit 0, ≈111 s). Diff revisado: herramientas, esquemas, scope, errores, transporte y entrypoint conservados.
- Punto de control tramo 12: archivo `docs/arquitectura.md`; documenta el mapa real de módulos y fachadas, los recorridos HTTP y MCP hasta SQLite, la composición de `serve.ts` y dónde extender almacenamiento, rutas y herramientas; revisión del diff y rutas: solo documentación, sin cambios de contrato. `./verify` pasó (74/74, exit 0, ≈170 s).

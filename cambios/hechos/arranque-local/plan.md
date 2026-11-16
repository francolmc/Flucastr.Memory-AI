---
estado: aprobado
rama: feature/arranque-local
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Arranque local y prueba de memoria

## Objetivo
Permitir que un usuario inicie el servidor en su equipo, compruebe el ciclo de memoria y evalúe su utilidad con un agente en una sesión nueva.

## Exploración
- `src/serve.ts` inicia en 127.0.0.1:7420, usa `MEM_TOKEN` y por defecto guarda SQLite en `~/.mem/mem.sqlite`.
- `src/mem.ts` genera un UUID por `mem save` y no acepta `--id`. `docs/cliente-mem.md` explica instalación y comandos; `docs/inicio-agentes.md` describe las integraciones reales.
- `scripts/verify-flujo.mjs` y `test/remote-cli.test.ts` comprueban que repetir un registro idéntico con el mismo ID es idempotente (200); el mismo ID con datos distintos produce 409 `id_conflict`.
- El usuario aceptó el 16-11-2026 documentar y probar ese contrato, en lugar de cambiar el servidor para devolver 409 por duplicados idénticos.
- Se omite la comparación adicional y validación separada de alternativas: el usuario aceptó conservar el contrato existente y no cambiar el servidor.

## Evaluación
Conservar el contrato existente evita cambios al servidor y dependencias. Cambiarlo alteraría un comportamiento probado y el alcance excluido.

## Supuestos
- El usuario ejecuta la prueba real con cinco memorias de su proyecto sin compartir su contenido; si prefiere otra evaluación, se modifica la guía.

## Decisiones ya tomadas
- La guía utiliza Bearer, ámbito de proyecto y las integraciones existentes; no registra secretos ni conversaciones completas.
- El smoke usa IDs y texto sintéticos únicos, contra el servidor configurado por entorno; no usa bases locales.
- Ejecutor: constructor, porque se cubren los requisitos y prerrequisitos, hay comprobaciones y no se accede a credenciales reales ni producción.

## Decisiones
Ninguna adicional.

## Validación
El usuario aceptó el contrato 200/409 existente y aprobó el plan completo el 16-11-2026.

## Alcance
Archivos de producto: `docs/arranque-local.md` y `scripts/smoke.mjs`. Pruebas automatizadas pertinentes en `test/`. Excluye cambios de servidor, MCP, embeddings, dependencias, instalación de servicios, Tailscale, WSL y configuración de producción. No leer `.env` ni credenciales; no imprimir tokens. Las pruebas usan solo tokens sintéticos.

## Verificación
`./verify` — aceptación desde cero; además ejecutar explícitamente la prueba automatizada del smoke que el constructor agregue, con Node compatible y servidor loopback aislado. Registrar ambos resultados y duración. `./verify` actual no ejecuta automáticamente archivos de prueba `.mjs` nuevos salvo que se integren en la suite existente.

## Condiciones de parada
Detenerse si una causa falla dos veces, se necesita salir del alcance o una decisión del usuario. No usar un servidor real para las pruebas automatizadas. Si la limpieza falla, el smoke devuelve error y explica que puede quedar el registro sintético sin mostrar credenciales.

## Pasos
### Tramo 1 — Historia: iniciar y comprobar memoria local
Como usuario quiero una guía y un smoke para comprobar que la memoria persiste entre sesiones.
Dependencias: Node.js >=24.22.1 <25, npm y Git; servidor local activo para el smoke; Docker operativo para `./verify`. El usuario instala sus herramientas y ejecuta la prueba real.
Contratos a conservar: autenticación Bearer; 200 para reintento idéntico y 409 `id_conflict` para mismo ID con datos diferentes; aislamiento de scopes; búsqueda incluye scope general; sin base local del cliente.
Rutas susceptibles de cambio: `docs/arranque-local.md`, `scripts/smoke.mjs` y prueba nueva en `test/smoke.test.ts`; no mover pruebas existentes.
Ejemplo concreto: `node scripts/smoke.mjs` con `MEM_URL` y `MEM_TOKEN` válidos encuentra su ID único, lo elimina y sale 0.
Alcance: los dos archivos de producto y pruebas nuevas necesarias.
Archivos: `docs/arranque-local.md`, `scripts/smoke.mjs`.
CUANDO el usuario sigue la guía ENTONCES levanta y usa el servidor autenticado (A1).
CUANDO ejecuta el smoke ENTONCES registra, busca y elimina el recuerdo de prueba o falla claramente (A2).
CUANDO evalúa memoria real ENTONCES dispone de pasos para recuperar cinco recuerdos en otra sesión (A3).
CUANDO reutiliza un ID ENTONCES entiende el éxito idempotente y la colisión 409 (A4).
Aceptación:
- A1: guía reproducible desde checkout limpio, instalación, token aleatorio sin exponerlo, servidor loopback, entorno en ambas terminales, `save/search/recent/forget` y comprobación Bearer; comprobar ejecutando el recorrido aislado, esperar éxito y rechazo sin token.
- A2: smoke con token ausente/inválido falla con mensaje claro y código no cero; servidor sano guarda, busca por ID y elimina, confirma ausencia y sale 0; ante errores intenta limpieza y no revela token. Comprobar con pruebas de servidor loopback aislado y casos de fallo; esperar los códigos y estados indicados.
- A3: guía pide cinco hechos útiles y no sensibles del proyecto, captura IDs y en sesión nueva con integración configurada verifica recuperación sin pegar contenidos; distingue evidencia automática de validación manual pendiente. Comprobar lectura de la guía.
- A4: guía explica que `mem save` crea IDs nuevos, que petición idéntica con mismo ID devuelve 200 y que datos distintos dan 409; comprobar contra `scripts/verify-flujo.mjs` y pruebas existentes.
- [x] Crear `scripts/smoke.mjs` usando HTTP Bearer y `MEM_URL`/`MEM_TOKEN`, con entrada validada, errores genéricos y tiempo límite (A2). Comprobación: prueba automatizada; esperar rechazo sin token y con token inválido sin filtración.
- [x] Implementar en `scripts/smoke.mjs` guardado sintético único, búsqueda por scope e ID, limpieza incluso ante fallo y comprobación posterior (A2). Comprobación: prueba automatizada; esperar éxito y ausencia del registro.
- [x] Añadir pruebas en `test/smoke.test.ts` para servidor real aislado, éxito, autenticación fallida y fallo de búsqueda o limpieza (A2). Comprobación: ejecutar prueba y una mutación aislada del resultado esperado; esperar éxito normal y fallo de sensibilidad.
- [x] Crear `docs/arranque-local.md` con requisitos, instalación y comandos exactos para token, servidor, variables, cuatro comandos y smoke (A1, A2). Comprobación: ejecutar recorrido con token sintético y revisar salida; esperar servidor autenticado y limpieza.
- [x] Añadir en `docs/arranque-local.md` sección de uso real con cinco memorias y sesión nueva del agente, enlazando `docs/inicio-agentes.md` (A3). Comprobación: revisión de pasos; esperar instrucciones y resultado verificable sin datos sensibles.
- [x] Explicar en `docs/arranque-local.md` idempotencia, colisión 409 y límite de IDs del CLI (A4). Comprobación: comparar con `scripts/verify-flujo.mjs`; esperar coherencia.
- [x] Ejecutar prueba nueva en `test/smoke.test.ts` y `./verify` (A1–A4). Comprobación: ambos comandos exit 0; resultado registrado abajo.
Verificación del tramo: `./verify` — nivel 3, exit 0; ejecutar además prueba nueva explícitamente y recorrido aislado documentado para cubrir A1–A4.
Handoff: no crear rama ni ejecutar antes de aprobación y comprobación de base por principal; no tocar servidor ni credenciales reales.

## Evidencia
Verificación inicial en la base, 16-11-2026: `./verify` terminó con exit 1; 55/55 tests pasaron, pero falló «empaquetado e instalación temporal del bin mem» (código 1). Docker limpió sus recursos. Causa no verificada; debe resolverse antes de aceptar el cambio.

$ `npm run build && node --test dist/test/smoke.test.js`
✔ 2 tests pass; 0 fail (incluye rechazo sin token, token inválido, ciclo exitoso en SQLite/HTTP loopback y fallos inyectados de búsqueda/limpieza).
exit 0

$ `npm run build && node --test dist/test/smoke.test.js` (con mutación temporal en `scripts/smoke.mjs`: la condición que confirma que search encuentra el ID se forzó a fallar)
exit 1 como se esperaba: falló la prueba de éxito con `1 !== 0` y el mensaje `la búsqueda no encontró el registro de prueba`; la prueba de fallos permaneció pasando (1/2 pass).
Restauré la condición original y repetí el comando sin mutación: 2/2 pass, exit 0.

$ `node scripts/smoke.mjs` (con servidor loopback `127.0.0.1:7420` y token sintético exportado)
mem smoke: guardó, encontró y eliminó el registro sintético.
exit 0

$ Recorrido aislado de A1 con servidor en `127.0.0.1:7420` y `MEM_URL`/`MEM_TOKEN` sintéticos; cuatro operaciones CLI separadas.
`mem save`, `mem search` y `mem recent` encontraron el registro; `mem forget` lo eliminó; una solicitud sin Bearer devolvió HTTP 401.
Recorrido completado.

$ `rg -n 'cinco|cinco hechos|sesión nueva|reales|pendiente|idempotente|409|UUID|no permite elegir' docs/arranque-local.md && rg -n 'same|409|id_conflict|collision|synthetic-id' scripts/verify-flujo.mjs test/remote-cli.test.ts`
La guía documenta cinco recuerdos, sesión nueva, UUID por `mem save`, idempotencia 200 y colisión 409 `id_conflict`; el script y la prueba existentes cubren la colisión.
exit 0

$ `rg -n 'id_conflict|collision|synthetic-id' scripts/verify-flujo.mjs test/remote-cli.test.ts`
Los scripts/pruebas existentes cubren colisión `id_conflict` y reutilización de IDs.
exit 0

$ `./verify`
`57` tests pass; verificación de limpieza, lectura, escritura y limpieza del registro de prueba OK; empaquetado del bin `mem` OK; `VERIFY OK`.
exit 0; duración aproximada 143 s.

## Notas
Revisión: falta evidencia de la mutación aislada del resultado esperado exigida por la tercera tarea de A2; ejecutarla sin debilitar pruebas existentes, revertirla y registrar el resultado.
La verificación inicial de la base falló en el empaquetado del bin `mem`; la causa anotada entonces (posible diferencia entre el texto de política y snippets) no se confirmó. En una ejecución de `./verify` del cambio, el contenedor no incluye `.git`, por lo que el smoke necesitó aceptar `MEM_SCOPE` explícito en ese entorno; tras ese ajuste, la prueba y la verificación completa pasaron.

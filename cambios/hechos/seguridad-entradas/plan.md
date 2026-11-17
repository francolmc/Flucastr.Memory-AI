---
estado: listo
rama: fix/seguridad-entradas
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
tramo: 1
---
# Grupo A: seguridad de entradas

## Objetivo
Acotar la lectura de cuerpos HTTP y hacer explícita la gracia existente de rotación.

## Exploración
- `src/http-server.ts` concatena todos los chunks sin límite. `src/serve.ts` configura el servidor productivo.
- `src/http-auth.ts` calcula dos veces el mismo término en `Math.min`. `archivo/features/completed/F03-http-local/task-02-credenciales.md` describe el mínimo entre 24 horas y una gracia configurable, pero esa configuración no existe. `test/http-auth.test.ts` espera 24 horas incluso al rotar al vencimiento de 30 días.
- El servidor productivo usa otra autenticación, sin rotación; la corrección de `http-auth.ts` afecta la implementación de rotación existente, no añade rotación al servicio.

## Evaluación
Añadir la gracia configurable histórica ampliaría la interfaz. Mantener 24 horas conserva la conducta observada y evita nueva configuración. Recomendación: mantenerla.

## Validación
Franco confirmó mantener la gracia fija de 24 horas y aprobó el plan y la evidencia. Se omiten fases adicionales: la regla está decidida y el alcance está delimitado.

## Supuestos
- El tamaño se mide en bytes, antes de decodificar UTF-8. El límite predeterminado es 65 536 bytes; se acepta exactamente ese tamaño.
- La configuración productiva será `MEM_MAX_BODY_BYTES`, un entero decimal positivo seguro; ausente utiliza el valor predeterminado y un valor inválido impide el arranque con el error genérico habitual. `startLocalServer` acepta `maxBodyBytes` opcional con la misma validación.
- Al exceder el límite se cierra la conexión después de enviar el 413, sin seguir consumiendo el cuerpo. Se conserva el orden actual de autenticación y validación de ruta, método y cabeceras.

## Alcance
Servidor HTTP, arranque, autenticación, pruebas y documentación de configuración. Sin producción ni credenciales reales. Constructor elegido por tratarse de seguridad y comportamiento de red; el contexto y las pruebas están en este repositorio.

## Prerrequisitos
Node y Docker/Compose operativos para `./verify`; base `main` limpia y actualizada según las reglas del proyecto. Usar exclusivamente credenciales sintéticas en pruebas.

### Tramo 1 — Historia: acotar entradas y fijar la gracia
Como usuario, quiero que un cuerpo excesivo se rechace pronto y que la gracia de rotación tenga un límite claro.

**Dependencias:** ninguna. Este grupo precede a B y C.

**Contratos a conservar:** respuestas existentes para entradas dentro del límite, prioridad de autorización, rutas, formato de memorias y rotación con inclusión del instante exacto de vencimiento. No modificar pruebas existentes; añadir pruebas independientes.

**Rutas susceptibles de cambio:** `src/http-server.ts`, `src/serve.ts`, `src/http-auth.ts`, pruebas HTTP y de autenticación, `docs/arranque-local.md`.

**Ejemplo:** con configuración predeterminada, un cuerpo de 65 537 bytes recibe 413 y `{"error":"payload_too_large"}`; uno de 65 536 sigue al procesamiento habitual. Una credencial anterior rotada en t es válida en t + 24 h y deja de serlo un milisegundo después.

**Alcance del tramo:** limitar bytes acumulados también con transferencia por chunks y sin confiar en `Content-Length`; detener la lectura al superar el máximo y entregar 413 antes de cerrar la conexión. Evitar cortar bytes UTF-8 entre chunks al decodificar. Sustituir el mínimo redundante por el límite fijo, sin alterar otras reglas de autenticación.

**Archivos de producto:** `src/http-server.ts`, `src/serve.ts`, `src/http-auth.ts` (máximo tres). Pruebas y documentación adicionales según necesidad.

**Escenarios:**
- CUANDO un cliente autorizado envía más bytes que el máximo, incluso sin `Content-Length`, ENTONCES recibe 413, no se invoca el almacenamiento y no se sigue leyendo el cuerpo (A1).
- CUANDO el cuerpo está en el límite o por debajo, incluso con caracteres UTF-8 repartidos entre chunks, ENTONCES se procesa normalmente (A2).
- CUANDO se establece un máximo válido, ENTONCES se respeta; si es inválido, el arranque falla sin revelar detalles internos (A3).
- CUANDO se rota una credencial, ENTONCES la anterior conserva exactamente la gracia de 24 horas y el resto de reglas no cambia (A4).
- CUANDO una petición no supera las comprobaciones previas de autorización, ruta, método o cabeceras, ENTONCES se conserva su respuesta anterior (A5).

**Aceptación:** A1–A5 cubiertos por pruebas; suite existente intacta y `./verify` en verde. La lectura conserva como máximo el límite y el chunk en curso, sin acumular el resto. La respuesta 413 se recibe aunque el cliente todavía no haya terminado de enviar; otra conexión posterior puede usar el servidor.

## Pasos
- [x] Añadir pruebas de límite predeterminado y configurado, límite exacto, UTF-8 dividido, envío por chunks y cuerpo todavía abierto; comprobar 413, ausencia de escritura y funcionamiento posterior. Cubrir configuración inválida y prioridad de comprobaciones. Rutas: `test/http-server.test.ts`, `test/serve.test.ts`; comprobar con `npm test`.
- [x] Implementar la lectura acotada y el cierre posterior a la respuesta en `src/http-server.ts`; conectar y validar `MEM_MAX_BODY_BYTES` en `src/serve.ts`, documentándolo en `docs/arranque-local.md`; comprobar con `npm test`.
- [x] Añadir pruebas del instante exacto y un milisegundo posterior en `test/http-auth.test.ts`, y simplificar `graceUntil` en `src/http-auth.ts` sin modificar la semántica; comprobar con `npm test`.
- [x] Ejecutar `./verify`, registrar resultado y evidencia de A1–A5; revisar que las pruebas existentes no se modificaron.

**Verificación del tramo:** `./verify` completo, nivel 3; duración pendiente de medir. Las pruebas de streaming deben demostrar que el 413 llega antes del final del envío, con tiempo de espera acotado.

**Handoff:** registrar archivos, resultados, duración y cualquier desviación en Evidencia y Notas; detenerse ante un fallo o una decisión de comportamiento no prevista. No hacer commit.

## Verificación
`./verify` desde la raíz. Si Docker o el entorno impiden ejecutarlo, registrar el error y detenerse.

## Evidencia
$ `npm test`
Resultado local: 65/70; 5 fallos por requisito del entorno, falta `sqlite3` CLI (`backup.test.ts` y `operation.test.ts`). Las pruebas HTTP, arranque y autenticación pasan.
exit 1

$ `npm run build && node --test dist/test/http-server.test.js dist/test/http-auth.test.js dist/test/serve.test.js`
ℹ tests 12
ℹ pass 12
ℹ fail 0
exit 0

$ `./verify`
ℹ tests 70
ℹ pass 70
ℹ fail 0
VERIFY OK
MEM BIN PACKAGE OK
exit 0

$ `npm run build && node --test dist/test/http-server.test.js dist/test/serve.test.js`
ℹ tests 8
ℹ pass 8
ℹ fail 0
exit 0

$ `./verify`
VERIFY OK
MEM BIN PACKAGE OK
exit 0

## Notas
Los grupos B, C y D tienen borradores separados y se revisarán por separado, en ese orden.
La suite `npm test` pasó completa dentro de `./verify`, donde están instaladas las herramientas del sistema requeridas; los tres borradores se conservaron intactos.
Se resolvió la devolución: las aserciones de `MEM_MAX_BODY_BYTES` están en una prueba independiente y la solicitud con cuerpo abierto tiene timeout explícito y propagación de errores.

Revisión DEVUELTO corregida: `test/serve.test.ts` conserva intacta la prueba existente y las aserciones nuevas están en pruebas independientes. La prueba del cuerpo abierto ahora tiene un timeout de 2 segundos y propaga errores de la petición. `./verify` repetido con resultado satisfactorio.

Revisión independiente: `./verify` terminó con 71/71 pruebas, `VERIFY OK` y `MEM BIN PACKAGE OK`; aceptación A1–A5 cumplida. Evidencia aprobada por Franco.

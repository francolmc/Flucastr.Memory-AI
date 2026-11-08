---
estado: listo
rama: feature/cliente-mem
base: main
repos: [.]
ejecutor: constructor
---
# S3 — Cliente global mem

## Objetivo
Migrar la fila S3 pendiente de `old/v1/definitions/BACKLOG.md`: cliente global HTTP sin DB local para Mac/WSL.

## Supuestos
- Origen automático predeterminado `mem/mac` o `mem/wsl` según plataforma; cambiarlo altera los datos registrados.
- Interfaz con `--type` y `--text` para save, `--query` para search y `--id` para forget; cambiarla afecta scripts consumidores.

## Alcance
`src/`, `test/`, `package.json`, `package-lock.json`, documentación y verify/auxiliares cuando existan. No operación S4, integraciones S5 ni archivo histórico.

## Decisiones ya tomadas
- Ejecutor: constructor, porque requisitos, contexto, verificaciones y límites operativos están cubiertos en el plan.
- Depende de verify y S2 completados; contrato en `old/v1/definitions/ARCHITECTURE.md`.
- `src/remote-cli.ts` solo admite save/search con url/token-file/input; `package.json` no declara bin. No confundirlo con el cliente objetivo terminado.
- MEM_URL/MEM_TOKEN; nunca abrir SQLite ni usar fallback local en el cliente.
- Save acepta --type, --scope opcional y texto, genera ID/fecha/origen; search, recent --limit (15 predeterminado) y forget usan el servidor.
- Scope predeterminado project:<carpeta raíz Git>; fuera de Git exigir scope explícito. Fallo de servidor: una línea `mem: servidor no disponible`, salida no cero.

## Escenarios
- CUANDO se instala el bin ENTONCES mem ofrece save/search/recent/forget y serve sin requerir DB cliente (A1).
- CUANDO dos clientes acceden al servidor ENTONCES comparten memorias; recent transmite límite y forget elimina (A2).
- CUANDO el servidor cae ENTONCES no crea una base local ni muestra token/stack (A3).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Bin instalado en prefijo temporal ofrece comandos remotos y serve existente | Ejecutar bin empaquetado en prefijo temporal con `--help` y `serve --help`; revisar que cliente no importe módulos de SQLite | Comandos documentados y sin DB cliente |
| A2 | Clientes interoperan con servidor real | Dos procesos clientes contra servidor loopback: save, search, recent con límite, forget y búsqueda posterior | Respuestas compartidas, límite transmitido y memoria eliminada |
| A3 | Fallo remoto es seguro | Invocar cliente con servidor no disponible y revisar stderr, código y directorio temporal | Una línea `mem: servidor no disponible`, código no cero y ninguna DB creada |

## Verificación
`./verify` — extender con ejecución del bin empaquetado/instalado en directorio temporal y servidor real; dependencia previa (≈5 min).

## Pasos
- [x] Revisar CLI/transporte actuales y evitar regresión del serve de S2 (A1).
  - evidencia: `./verify` completo, exit 0; 46/46 pruebas y flujo servidor pasan.
- [x] Implementar comandos/configuración y detección de raíz Git conforme al contrato (A1; A2; A3).
  - evidencia: `./verify` completo, exit 0; A2 E2E y revisión de detección Git desde subcarpeta.
- [x] Declarar bin y comprobar instalación en prefijo temporal (A1).
  - evidencia: `./verify` imprimió `MEM BIN PACKAGE OK`, exit 0.
- [x] Añadir E2E de dos clientes, servidor no disponible y ausencia de DB; extender y ejecutar `./verify` (A2; A3; ≈5 min).
  - evidencia: `./verify` completo, exit 0; `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; suite 46/46.

## Evidencia
`npm run build`: exit 0.
`node --test dist/test/mem.test.js`: E2E de cliente pasa con permisos elevados, exit 0.
`node --test dist/test/http-client-route.test.js dist/test/mem.test.js`: al cambiar el token E2E a corto falló `digestSyntheticKey` (requisito del autenticador de prueba); restaurado token sintético largo y añadido test separado para token corto válido, vacío e inválido. Recompilación posterior: exit 0.
`./verify` (sin caché): 46/46 pruebas; `LIMPIEZA OK`, `LECTURA OK`, `ESCRITURA OK`, `LIMPIEZA DE REGISTRO OK`, `VERIFY OK`, `MEM BIN PACKAGE OK`; exit 0.
Resultados de aceptación: A1 pasa (bin empaquetado e instalado temporalmente, comandos y serve disponibles); A2 pasa (save/search/recent --limit/forget y búsqueda posterior contra servidor real); A3 pasa (error genérico ante caída, HOME temporal permanece vacío).

## Notas
Revisión principal: diff completo de archivos existentes y lectura de src/mem.ts, test/mem.test.ts, scripts/verify-mem-bin.sh y docs/cliente-mem.md realizada. A1: bin declarado, carga de SQLite solo por import dinámico al ejecutar serve; instalación documentada corregida con --global. A2: Git real desde subcarpeta, dos memorias para límite, IDs tras forget y paquete instalado ejecutando servidor real. A3: HOME temporal vacío y error genérico exacto. Sensibilidad demostrada: test fuera de Git falló con código 1 y pasa al devolver uso inválido código 2. Comprobación propia adicional: recent --limit 0 con configuración sintética devuelve código 2 y mensaje de uso, sin intentar conexión. Suite vecina pasó 45/45 antes de añadir el caso de token corto. Se corrigió validación de token heredada para coincidir con sintaxis no vacía del servidor. Verificación final independiente del principal: ./verify sin caché exit 0, 46/46 pruebas y paquete instalado correcto.
Revisión resuelta: test usa Git real y Dockerfile instala Git; el paquete temporal ejecuta operaciones contra el servidor. Se documenta instalación global y configuración en docs/cliente-mem.md.
Reanudación supervisada: paquete verificado en prefijo temporal con operaciones remotas reales y manejo offline. Suite final incluye el test de token corto compatible con servidor; rechazo de token vacío/caracteres inválidos.
Reanudación: status confirma solo plan, package.json, transporte y los nuevos src/mem.ts y test/mem.test.ts. Para npm pack/install usar `--cache /tmp/mem-s3-npm-cache` y prefijo temporal. Para pruebas loopback y Docker solicitar ejecución elevada ante EPERM; no tratar esa restricción como fallo del código. Empaquetado y verify completados posteriormente.
Franco aprobó S3 y confirmó `main` actualizada; `origin/main` estaba cero commits adelante. Franco autorizó la creación de la rama y el trabajo se reanudó en `feature/cliente-mem`. Origen automático `mem/mac` o `mem/wsl`; save usa `--type`/`--text`, search `--query`, forget `--id`.
Durante las pausas había implementación parcial en `src/mem.ts`, transporte HTTPS/env token en `src/http-client.ts`, declaración bin en `package.json` y prueba E2E en `test/mem.test.ts`. Rama actual `feature/cliente-mem`. Estos bloqueos se resolvieron con permisos de loopback y caché temporal; no queda verificación local pendiente. Prueba distribuida Mac/WSL e instalación personal quedan fuera de S3 local.

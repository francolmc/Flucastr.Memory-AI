# Flucastr.Memory-AI
Memoria SQLite/FTS5 para agentes; transición hacia un servidor único WSL y clientes HTTP Mac/WSL, todavía incompleta.

## Estructura
- Un repositorio en la raíz; TypeScript ESM y Node.js >=24.22.1 <25 (package.json prevalece sobre documentos antiguos).
- `src/`: librería, CLI local, transporte HTTP, servidor y cliente remoto parcial.
- `test/`: pruebas Node, SQLite real y recorridos HTTP loopback.
- `docs/proyecto.md`: contexto duradero y diferencias entre implementación y objetivo.
- `cambios/`: planes v2; `old/v1/`: documentación histórica conservada, no instrucciones vigentes.

## Comandos
- Instalar desde lock: `npm ci`.
- Compilar: `npm run build`.
- CLI local (tras compilar): `npm run cli -- --help`.
- Pruebas: `npm test`.
- Comprobación parcial existente: `npm run verify` (no instala desde cero ni demuestra el MVP distribuido).
- **Verificar desde cero: `./verify`** — requiere Docker Engine/Compose operativos; construye sin caché por defecto, instala desde lock, compila, ejecuta suite/CLI y prueba servidor+SQLite aislados. `VERIFY_RAPIDO=1` permite caché. Modo remoto: `VERIFY_TARGET=<url> MEM_TOKEN=<token> ./verify` (solo lectura por defecto); con `VERIFY_PERMITIR_ESCRITURA=1`, guarda y elimina su registro de prueba mediante forget. Ver `cambios/hechos/verify/plan.md`.

## Reglas
- Agentes: sin commit, push, PR, merge ni despliegue; no leer `.env`, llaves ni credenciales (`.env.example` sí).
- Ramas: `feature/`, `fix/`, `chore/`, `docs/`.
- No leer `old/v1/registro/` sin pedido explícito; no borrar el archivo histórico.
- No instalar servicios ni configurar producción: lo hace Franco.
- El servidor central ya implementa save/search/recent/forget; bin mem e integraciones siguen pendientes.

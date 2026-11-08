# Flucastr.Memory-AI
Memoria SQLite/FTS5 para agentes; transición hacia un servidor único WSL y clientes HTTP Mac/WSL, todavía incompleta.

## Estructura
- Un repositorio en la raíz; TypeScript ESM y Node.js >=24.22.1 <25 (package.json prevalece sobre documentos antiguos).
- `src/`: librería, CLI local, transporte HTTP, servidor y bin remoto `mem`.
- `test/`: pruebas Node, SQLite real y recorridos HTTP loopback.
- `docs/proyecto.md`: contexto duradero y diferencias entre implementación y objetivo.
- `cambios/`: planes v2; `old/v1/`: documentación histórica conservada, no instrucciones vigentes.

## Comandos
- Instalar desde lock: `npm ci`.
- Compilar: `npm run build`.
- Cliente remoto: `mem --help`; instalación y configuración en `docs/cliente-mem.md` (requiere Git para scope automático).
- CLI local (tras compilar): `npm run cli -- --help`.
- Pruebas: `npm test` requiere las herramientas operativas Linux de S4 (sqlite3/FTS5, flock y systemd-analyze); `./verify` las instala dentro de Docker. Ver `docs/operacion-wsl.md`.
- Comprobación parcial existente: `npm run verify` (no instala desde cero ni demuestra el MVP distribuido).
- **Verificar desde cero: `./verify`** — requiere Docker Engine/Compose operativos; construye sin caché por defecto, instala desde lock, compila, ejecuta suite/CLI y prueba servidor+SQLite aislados. `VERIFY_RAPIDO=1` permite caché. Modo remoto: `VERIFY_TARGET=<url> MEM_TOKEN=<token> ./verify` (solo lectura por defecto); con `VERIFY_PERMITIR_ESCRITURA=1`, guarda y elimina su registro de prueba mediante forget. Ver `cambios/hechos/verify/plan.md`.

## Reglas
- Agentes: sin commit, push, PR, merge ni despliegue; no leer `.env`, llaves ni credenciales (`.env.example` sí).
- Rama base: `main`.
- Ramas: `feature/`, `fix/`, `chore/`, `docs/`.
- No leer `old/v1/registro/` sin pedido explícito; no borrar el archivo histórico.
- No instalar servicios ni configurar producción: lo hace Franco.
- El servidor central ya implementa save/search/recent/forget; bin `mem` implementado y verificado localmente. S4 entrega plantillas systemd/cron y backup probados por `./verify`; su instalación WSL/Tailscale y evidencia del host siguen pendientes de Franco. Evidencia de S3: `cambios/hechos/cliente-mem/plan.md`; S4: `cambios/hechos/servicio-backup/plan.md`.

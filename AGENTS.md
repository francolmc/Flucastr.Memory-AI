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
- **Verificar todo desde cero: `./verify`** — pendiente; ver `cambios/verify/plan.md`.

## Reglas
- Agentes: sin commit, push, PR, merge ni despliegue; no leer `.env`, llaves ni credenciales (`.env.example` sí).
- Ramas: `feature/`, `fix/`, `chore/`, `docs/`.
- No leer `old/v1/registro/` sin pedido explícito; no borrar el archivo histórico.
- No instalar servicios ni configurar producción: lo hace Franco.
- El objetivo de servidor central no implica que recent/forget, bin mem o integraciones estén terminados.

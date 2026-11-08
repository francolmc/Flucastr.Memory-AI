---
estado: borrador
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
- CUANDO se instala el bin ENTONCES mem ofrece los cuatro comandos y serve sin requerir DB cliente.
- CUANDO dos clientes acceden al servidor ENTONCES comparten memorias; recent transmite límite y forget elimina.
- CUANDO el servidor cae ENTONCES no crea una base local ni muestra token/stack.

## Verificación
`./verify` — extender con ejecución del bin empaquetado/instalado en directorio temporal y servidor real; dependencia previa.

## Pasos
- [ ] Revisar CLI/transporte actuales y evitar regresión del serve de S2; definir encaminamiento del bin sin importar almacenamiento en el cliente.
- [ ] Implementar comandos/configuración y detección de raíz Git conforme al contrato, sin cambiar la semántica del servidor.
- [ ] Declarar bin y probar instalación/enlace en prefijo temporal, nunca global personal de Franco.
- [ ] Añadir E2E loopback con dos procesos cliente, fallo de red y ausencia de DB; ejecutar verify desde cero (≈5 min).

## Evidencia
Se confirmaron las rutas citadas y ausencia de bin al migrar; no se ejecutó S3.

## Notas
Si hay que elegir el formato exacto de origen automático o interfaz de search/forget fuera del contrato existente, presentar opciones cerradas a Franco antes de ejecutar, no inventarlas en código.

# task-03 — Servidor HTTPS loopback con contrato cerrado
repo: Flucastr.Memory-AI   depende_de: F03-task-01, F03-task-02   estado: borrador

## Descripción
Servidor HTTPS loopback con contrato cerrado. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `src/response.ts:serializeSearch`, `src/memory.ts:MemoryInput`, `src/cli.ts:runCli` (no modificar CLI); crear `src/http-server.ts`, `test/http-server.test.ts`; tocar `README.md`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Factory `startLocalServer({store,auth,tls,port})` retorna dirección y close(); store es la fachada de task-01, auth de task-02. HTTPS node:https exclusivamente 127.0.0.1, port 0 permitido; no aceptar host configurable ni fallback HTTP. Cert/key sintéticos entregados por fixture posterior; faltantes/invalidos fallan antes de escuchar. Sin CORS ni proxy/trust headers.
POST JSON application/json (charset utf-8 opcional) solamente: /v1/search {scope,query}; /v1/memories {memory}; /v1/replacements {memory,previousId}; /v1/conflicts {ids}. Objetos cerrados y tipos estrictos; MemoryInput seis campos F02. Ningún confirmGeneralRule/confirmedByFranco/ticket. No listar ni obtener por ID. Auth antes de parsear datos o invocar store; duplicados Authorization denegados. JSON search usa serializeSearch literal, máximo 5/4000 bytes incluido LF sin envelope extra. Guardar/reemplazar 200 con MemoryInput+LF incluso reintento; conflicto 200 {ok:true}+LF. 400 entrada, 401 auth, 403 denegación opaca (incluye referencia desconocida), 409 colisión autorizada; errores {error:codigo}+LF sin mensajes internos. Rutas no soportadas 404, método distinto 405 tras auth; ninguna ruta administrativa. Sin límite nuevo de longitud de memoria; timeouts de transporte Node explícitos y destrucción segura de petición incompleta, sin registrar cuerpos/cabeceras.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Implementar router cerrado y ciclo de vida close() que cierra listener/conexiones; dependencia store se cierra por su propietario.
2. Añadir pruebas unitarias de routing con store espía: entradas inválidas/auth ausente no llaman núcleo; capturar stdout/stderr y comprobar ausencia de material sensible.
3. Documentar contrato, configuración programática local y carácter sintético en README; no añadir ejecución CLI ni remoto.

## Criterios de aceptación
1. Servidor escucha solo loopback usando HTTPS y falla cerrado sin TLS. Comprobar en las pruebas y revisión de diff de esta tarea.
2. Cuatro rutas aplican contratos cerrados y ningún booleano abre administración. Comprobar en las pruebas y revisión de diff de esta tarea.
3. Search conserva bytes/límites F02, errores no reflejan contenido o secretos. Comprobar en las pruebas y revisión de diff de esta tarea.
4. Pruebas cubren auth previa a datos, JSON inválido, campos extra y cierre sin handles abiertos. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
(lo llena el constructor; comandos, resultados, entorno y límites; nunca secretos)

## Notas
(lo llena el constructor; firmas públicas entregadas, archivos de prueba y límites para dependientes)

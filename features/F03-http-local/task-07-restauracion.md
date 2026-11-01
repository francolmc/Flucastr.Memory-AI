# task-07 — Ensayo manual de restauración y saneamiento autorizado
repo: Flucastr.Memory-AI   depende_de: F03-task-06   estado: borrador

## Descripción
Ensayo manual de restauración y saneamiento autorizado. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `src/recovery.ts` creado por task-06, `src/memory.ts:openMemory`; tocar `src/recovery.ts`, `README.md`; crear `test/f03-recovery.test.ts`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Restauración local sintética solo con servidor detenido (pausa de escrituras y cierre de DB), hacia destino nuevo, nunca sobre fuente abierta. Validar manifiesto e integridad antes de publicar, preservar copia original y rechazar corrupta sin alterar destino. No booleanos para habilitar administración HTTP; funciones de ensayo no acreditan frontera humana.
Saneamiento es runbook manual autorizado, no endpoint ni herramienta automática de purga: parar agentes/servidor, revocar credenciales si aplica, autorización fuera del entorno agente, inventariar DB/FTS/journal/WAL/copias/exportaciones/logs por identificadores sin copiar valores, reconstruir datos sintéticos limpios y FTS en destino nuevo, retirar copias afectadas bajo autorización, validar búsqueda/restauración limpia y reanudar solo tras revisión humana. No prometer borrado forense ni retener copias contaminadas disponibles como recuperación limpia. No usar secretos reales para ensayar.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Añadir restauración validada hacia DB nueva y pruebas de snapshot válido/corrupto, conflictos, sustituciones y archivados preservados; reabrir y comparar búsqueda.
2. Documentar secuencia manual de pausa/copia/restauración/revisión/reanudación y calendario diario/retención; separar simulación de contexto confiable pendiente.
3. Ensayar saneamiento con marcador sintético no secreto y reconstrucción limpia; inspeccionar DB/FTS/copias autorizadas sin imprimir marcador. Registrar duración descriptiva del ensayo, no garantía RTO.

## Criterios de aceptación
1. Restauración válida reproduce estados y búsqueda; corrupta no altera destino. Comprobar en las pruebas y revisión de diff de esta tarea.
2. Ensayo exige ausencia de escrituras concurrentes y no agrega administración HTTP. Comprobar en las pruebas y revisión de diff de esta tarea.
3. Runbook cubre todas las superficies/copias y autorización separada sin mostrar secretos. Comprobar en las pruebas y revisión de diff de esta tarea.
4. README distingue RPO 24h/RTO objetivo 4h de resultados temporales; destino real/cifrado/custodia y aislamiento siguen pendientes. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
(lo llena el constructor; comandos, resultados, entorno y límites; nunca secretos)

## Notas
(lo llena el constructor; firmas públicas entregadas, archivos de prueba y límites para dependientes)

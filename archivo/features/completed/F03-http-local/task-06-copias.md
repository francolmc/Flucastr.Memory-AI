# task-06 — Copias sintéticas consistentes y retención
repo: Flucastr.Memory-AI   depende_de: F03-task-05   estado: hecha

## Descripción
Copias sintéticas consistentes y retención. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `src/memory.ts:openMemory`, `package.json` Node 22 y `test/memory.test.ts` temporales; crear `src/recovery.ts`, `test/f03-backup.test.ts`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
API local `createSyntheticBackup({source,destination,now})` y `retainSyntheticBackups({destination,now})`; sin endpoints. node:sqlite backup para copia consistente (confirmar firma en tipos instalados al construir); no copiar archivo vivo con fs.copyFile. Solo temporales sintéticos explícitos. Nombres UTC diarios YYYY-MM-DD y semanales por lunes UTC, publicación atómica tras integrity_check y manifiesto versionado sin contenido. Scheduler queda como procedimiento manual diario, no servicio de despliegue: detectar/informar copia atrasada >24h, sin garantía de ejecución. Retener últimas 7 fechas diarias y últimas 4 semanas, un punto semanal copiado del primer snapshot válido de la semana; no eliminar archivos ajenos o copia en curso. Reintento mismo día conserva snapshot ya válido; reloj inyectado.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Implementar copia consistente, validación y publicación; fallo deja destino previo válido y limpia parcial.
2. Implementar promoción semanal y retención restringida al manifiesto; no tocar originales.
3. Probar 40 días simulados, repetición, fallo y copia durante escritura sintética; abrir copia y contrastar commits incluidos y estado FTS.

## Criterios de aceptación
1. Snapshots abren íntegros y coherentes sin secretos ni archivos parciales publicados. Comprobar en las pruebas y revisión de diff de esta tarea.
2. Simulación verifica exactamente hasta 7 diarias y 4 semanales sin borrar ajenos. Comprobar en las pruebas y revisión de diff de esta tarea.
3. Antigüedad >24h es visible; no se afirma scheduling ni independencia física real. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
- Entorno: Node v22.23.2. Verificación final completa: `npm run typecheck && npm test && npm run cli -- --help` → tipo correcto, 26 pruebas pasan (0 fallidas), ayuda CLI correcta. En las pruebas nuevas la copia SQLite se abre, `integrity_check=ok`, incluye registros y entradas FTS coherentes; el mismo día se conserva snapshot válido. Simulación de 40 fechas y retención verifica no más de 7 diarias más 4 puntos semanales, y deja intacto un archivo ajeno. >24 h se informa como `stale`; parciales temporales no permanecen.
- Error inicial en prueba por supuesto incorrecto sobre el reintento del mismo día; corregido para afirmar conservación del snapshot existente. En otra ejecución se detectó exceso de retención semanal por preservar todas las fechas de cada semana; reducido a un punto por semana. Nueva verificación completa final pasó.
- Límites: solo SQLite/datos sintéticos y destino temporal; no se configura scheduler/servicio ni se usa información o backups reales. El procedimiento diario es manual, sin garantía de ejecución, por lo que no acredita RPO real de 24 h. No demuestra independencia física ni RTO real de 4 h. Para uso real siguen pendientes destino independiente, cifrado y custodia. Sin endpoints de backup/administración.

## Notas
Firmas exportadas: `createSyntheticBackup({source,destination,now})`, `retainSyntheticBackups({destination,now})`, `syntheticBackupStatus({destination,now})` en `src/recovery.ts`; manifiesto de nombres únicamente, rotación opera solo sobre sus entradas. Archivos: `src/recovery.ts`, `test/f03-backup.test.ts`. Reintento diario conserva un snapshot previo válido en vez de sobrescribirlo; se registra como decisión conservadora acorde a la concreción aprobada. No hay scheduler automático.
Registro: n=1; herramienta=pi; modo=normal; intentos=3; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

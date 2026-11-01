# task-02 — Autenticación compartida con rotación y revocación
repo: Flucastr.Memory-AI   depende_de: —   estado: borrador

## Descripción
Autenticación compartida con rotación y revocación. Entrega un incremento ejecutable para F03 local sintética.
No autoriza datos reales ni administración del agente.

## Contexto
Leer `features/F03-http-local/refinado.md`; `definitions/ARCHITECTURE.md` §Decisiones, subsecciones «Política F03: HTTP local sintético» y «Rotación, durabilidad y recuperación F03», y §Seguridad; `definitions/PROJECT.md` §Qué significa «funcionando» y §Alcance; `definitions/REPOS.md` §Inventario. Repo único `/home/franco/Codes/flucastr/Flucastr.Memory-AI`. `AGENTS.md` no existe. Node observado v22.23.2; `package.json` scripts y `tsconfig.json` incluyen src/test completos. Convenciones: ESM .js, node:test, temporales con limpieza finally. `npm run typecheck`, `npm test` y `npm run cli -- --help` ejecutados al planificar: éxito, 15 pruebas. Los archivos nuevos indicados abajo son destinos propuestos, no existentes. De dependencias leer solo sus Notas; si aún no existen, esperar su entrega, no leer tareas hechas ajenas.

Lectura/tocados específicos: `src/index.ts` exportaciones; `package.json` dependencias solo TypeScript/@types/node; crear `src/http-auth.ts` y `test/http-auth.test.ts`.

## Decisiones ya tomadas
Confirmado: política de `features/F03-http-local/refinado.md`. Concreción técnica propuesta para revisión en esta tarea:
Usar crypto estándar Node y Bearer con exactamente un Authorization, sin query/cookies. Key sintética aleatoria >=32 bytes; no persistir texto de keys en estado ni logs, comparar hashes de longitud fija con timingSafeEqual. Estado en memoria y reloj inyectable (milisegundos UTC). Factory recibe digest/issuedAt de actual y opcional anterior con graceUntil; configuración uniforme de identidad única, sin permisos por cliente. No dependencia ni endpoint de administración.
Actual vence al cumplir 30 días; anterior solo hasta min(rotatedAt+24h, gracia configurada), nunca más; rotar instala nueva actual y una anterior; revocar compromiso elimina inmediatamente actual y anterior, requiere nueva instalación explícita para recuperar acceso. Rechazar tiempos/config inválidos y gracia >24h. Las funciones locales de rotar/revocar son para ensayo administrativo separado, no prueba de humanidad.

## Alcance / Fuera de alcance
Alcance: objetivo y archivos indicados. Fuera: hosting, remoto, exposición pública, clientes/MCP, embeddings, datos reales, cambios de estados/aprobaciones, rama, commits y despliegue. No modificar STATUS.md ni definiciones.

## Pasos
1. Implementar factory autenticadora con validar/rotar/revocar y reloj inyectado; no exponer key ni digest en retornos públicos.
2. Probar límites exactos 30 días/24h, nueva key inmediata, vieja tras gracia, compromiso durante gracia, esquema/cabeceras malformadas y estado revocado.
3. Capturar errores y comprobar que no contienen key, digest ni Authorization.

## Criterios de aceptación
1. Cada caso de frontera temporal se prueba sin dormir ni modificar reloj global. Comprobar en las pruebas y revisión de diff de esta tarea.
2. Revocación corta ambas keys inmediatamente y afecta identidad completa. Comprobar en las pruebas y revisión de diff de esta tarea.
3. Credenciales inválidas no producen información secreta; sin endpoints o atribución de cliente. Comprobar en las pruebas y revisión de diff de esta tarea.

## Verificación
Desde la raíz: `npm run typecheck` (sin errores), `npm test` (todas las pruebas existentes y nuevas pasan), `npm run cli -- --help` (ayuda CLI sin regresión). Comandos ejecutados al planificar sobre base F02; no acredita pruebas F03 aún inexistentes. 

## Evidencia
(lo llena el constructor; comandos, resultados, entorno y límites; nunca secretos)

## Notas
(lo llena el constructor; firmas públicas entregadas, archivos de prueba y límites para dependientes)

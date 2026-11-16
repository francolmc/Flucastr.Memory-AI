---
estado: listo
rama: docs/readme-mvp
base: main
repos: [.]
ejecutor: constructor
---
# README para instalar y usar el MVP

## Objetivo
Convertir el README en la entrada práctica para que Franco instale el MVP, arranque el servidor y conecte clientes y agentes con el soporte disponible.

## Supuestos
- Se conserva WSL como destino operativo documentado y se ofrece primero un arranque local en primer plano; si Franco cambia el destino, cambia la guía operativa enlazada.
- Otros agentes se explican mediante CLI e instrucciones manuales; no se implementan adaptadores nuevos. Si se pide uno, requiere otro alcance.

## Contexto y prerrequisitos
Repositorio único TypeScript ESM; Node >=24.22.1 <25. Base main limpia observada al planificar. Leer README.md, package.json, src/serve.ts, src/mem.ts, docs/cliente-mem.md, docs/operacion-wsl.md, docs/inicio-agentes.md e integrations/claude-settings.example.json. No leer credenciales.
`mem serve` escucha solo 127.0.0.1:7420; MEM_DB reemplaza ~/.mem/mem.sqlite. Token desde MEM_TOKEN o ~/.mem/token; admite letras, números, punto, guion bajo, tilde y guion. Cliente requiere MEM_URL y MEM_TOKEN. npm pack ejecuta prepack/build, paquete privado distribuido mediante tgz, no registro público. Hooks Claude y extensión Pi existentes; ningún adaptador nativo para otros agentes.

## Alcance
README.md. Solo si hace falta corregir contradicciones: docs/cliente-mem.md y docs/inicio-agentes.md (conservar idéntico su bloque de política y snippets). AGENTS.md y docs/proyecto.md solo para retirar el pendiente obsoleto de commit/PR de memoria contextual, confirmado por Franco; no afirmar merge.
Fuera: código, dependencias, integraciones nuevas, servicios, configuración del host, credenciales y despliegue.

## Decisiones ya tomadas
- README orientado al recorrido instalación → servidor → cliente → agentes → comprobación; conservar descripción breve de SQLite/FTS5 y límites.
- Mostrar dos terminales para servidor y cliente, token introducido de forma privada sin literales secretos ni lectura por el constructor de archivos privados.
- Mostrar ruta desde checkout con npm ci, build/pack e instalación local por prefijo; PATH y rutas absolutas de integraciones.
- Para operación WSL persistente, backup y acceso HTTPS privado, enlazar la guía existente; no inventar bind externo, Docker de producción, MCP ni endpoint de salud.
- Agentes con terminal pueden ejecutar mem y recibir el snippet manualmente; la carga automática al inicio solo se ofrece para Claude Code y Pi.
- Ejecutor: constructor, porque requisitos y contexto están definidos, verificaciones tienen resultados observables y no se toca producción ni credenciales.

## Escenarios
- CUANDO se parte de un checkout ENTONCES se puede instalar y arrancar un servidor local (A1).
- CUANDO se configura un cliente ENTONCES se comprueba lectura, guardado, búsqueda y limpieza con scope explícito (A2).
- CUANDO se elige un agente ENTONCES se distingue soporte Claude/Pi y uso manual de otros agentes (A3).
- CUANDO algo falla ENTONCES hay diagnóstico y enlaces operativos sin presentar validación local como instalación real (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Instalación y arranque reproducibles | Revisar comandos contra package.json, serve.ts y mem.ts; ejecutar ayuda compilada | Node exacto, tgz real, PATH, token privado, loopback, DB y terminal servidor claros |
| A2 | Recorrido cliente completo | Revisar ejemplos y ejecutar equivalente aislado con datos de prueba, nunca host productivo | MEM_URL/MEM_TOKEN, scope compartido, search antes de save, ID, recent/search y forget; texto literal con comillas simples |
| A3 | Matriz de soporte y conexión | Revisar README contra guías y archivos de integración | Claude hook y Pi -e con rutas correctas; otros agentes vía terminal/snippet sin prometer adaptador o MCP |
| A4 | Límites y ayuda precisos | Revisar enlaces locales y secciones diagnóstico/verificación | Fallos de entorno/token/scope/conexión, WSL/Tailscale/backup enlazados, startup solo lectura, confirmación reglas/general, deduplicación como política y proveedor simulado explícitos |

## Verificación
`./verify` — comprobación completa existente (≈3–5 min); además revisión manual A1–A4 y recorrido aislado A2. No agregar tests para texto documental. Registrar comandos y resultados; comprobar enlaces locales del README y git diff --check.

## Pasos
- [x] Reescribir README con instalación, servidor en primer plano y cliente en otra terminal; scope explícito y prueba con limpieza (A1, A2).
  - evidencia: `npm run build` exit 0; `node dist/src/mem.js --help` exit 0 y muestra save/search/recent/forget/serve; comandos revisados contra package.json, src/serve.ts y src/mem.ts.
- [x] Añadir matriz de agentes, instalación Claude/Pi enlazada y uso manual del CLI/snippet para otros agentes (A3).
  - evidencia: README enlaza `docs/inicio-agentes.md#claude-code` y `#pi`; revisadas rutas absolutas y carga `pi -e` en la guía.
- [x] Añadir operación WSL, diagnóstico, política contextual, verificación y límites; corregir contradicciones documentales dentro del alcance (A4).
  - evidencia: README enlaza las guías WSL/cliente, explica fallo de servidor, scopes, política, verify y límites; retirada nota obsoleta de commit/PR en AGENTS.md y docs/proyecto.md.
- [x] Revisar comandos/enlaces y ejecutar recorrido aislado de lectura/escritura/búsqueda/forget con token efímero no impreso (A1–A4).
  - evidencia: los enlaces locales del README existen; `./verify` ejecutó la suite aislada en Docker (55/55), incluido el flujo de cliente remoto contra servidor real con escritura explícita, limpieza y sin imprimir tokens.
- [x] Ejecutar ./verify (≈3–5 min), git diff --check y dejar evidencia y límites de revisión (A1–A4).
  - evidencia: `./verify` exit 0 con `VERIFY OK`; `git diff --check` exit 0.

## Evidencia
```text
$ node --input-type=module -e 'import fs from "node:fs"; import path from "node:path"; const source=fs.readFileSync("README.md","utf8"); const links=[...source.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]).filter(x=>!x.startsWith("https://")&&!x.startsWith("http://")&&!x.startsWith("#")); for(const link of links){const file=link.split("#")[0]; if(!fs.existsSync(path.resolve(file))) throw Error(`missing ${file}`)} console.log(`README local links OK (${links.length})`)'
README local links OK (6)
exit 0

$ ./verify
ℹ tests 55
ℹ pass 55
ℹ fail 0
LIMPIEZA OK
LECTURA OK
ESCRITURA OK
LIMPIEZA DE REGISTRO OK
VERIFY OK
MEM BIN PACKAGE OK
exit 0

$ git diff --check
exit 0
```

## Notas
Sin cambios de producto. Franco confirmó commit y PR de memoria contextual hacia main; no se dispone de confirmación explícita de merge.
El checkout quedó en la rama autorizada `docs/readme-mvp`. El intento de ejecutar A2 directamente en el host fue bloqueado por el sandbox (`listen EPERM`); se completó el recorrido equivalente del cliente real contra servidor/SQLite aislados dentro de `./verify` en Docker. Las pruebas usan proveedor simulado y no validan instalaciones Mac/WSL ni criterio autónomo de modelos comerciales.

Reanudación: el constructor no pudo crear la rama por montaje de .git en solo lectura; no modificó archivos. Principal reconstruyó estado: main, solo carpeta del plan sin seguimiento, diff vacío. Creó docs/readme-mvp con permiso de ejecución; plan aprobado y archivos esperados presentes. No hubo verify ni recursos Docker que limpiar.

Revisión manual principal: A1 comandos contrastados con package.json/serve.ts/mem.ts; añadida creación inicial exclusiva del token en archivo privado sin imprimirlo y aclarado uso de Bash. A2 recorrido independiente por cliente compilado y HTTP/SQLite temporales: search/save/recent/search/forget pasó, memoria recuperada y eliminación confirmada. A3 matriz revisada contra hook Claude y extensión Pi: solo esos agentes tienen startup integrado; otros vía CLI e instrucciones. A4 enlaces locales comprobados, límites de proveedor simulado y operación WSL conservados; aclarada recarga de entorno para agentes y token fuera de argumentos. git diff --check limpio. El recorrido aislado necesitó acceso fuera del sandbox por bloqueo de loopback; no tocó datos productivos.

Comprobación adicional principal: ejecutado el comando de creación de token del README en HOME temporal, sin leer su contenido: archivo de 64 bytes y permisos 600, sin salida estándar, segunda ejecución conserva mtime (no sobrescribe). Pasó.

Verificación final principal: `./verify` sin caché compiló y pasó 55/55 pruebas y HTTP/SQLite, pero falló en empaquetado sin diagnóstico adicional (log `/tmp/readme-mvp-principal-verify.log`). La misma comprobación de paquete pasó aisladamente en la misma imagen; no se reprodujo la causa. Repetición completa `VERIFY_RAPIDO=1 ./verify`: exit 0, 55/55, LECTURA OK, ESCRITURA OK, LIMPIEZA DE REGISTRO OK, VERIFY OK, MEM BIN PACKAGE OK y LIMPIEZA OK (log `/tmp/readme-mvp-principal-retry.log`). Sin cambios de código ni servicios productivos. Evidencia lista para revisión de Franco antes del archivado.

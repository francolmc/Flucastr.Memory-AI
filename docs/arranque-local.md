# Arranque local y primera prueba

Esta guía inicia el servidor autenticado en `127.0.0.1:7420`, configura el cliente remoto `mem` y verifica que una memoria se puede recuperar y borrar. Requiere Node.js `>=24.22.1 <25`, npm y Git. El servidor central guarda SQLite; los comandos `mem` de cliente no crean una base local.

## Instalar desde un checkout limpio

Desde la raíz del repositorio:

```sh
npm ci
npm run build
npm pack
npm install --global --prefix "$HOME/.local" ./flucastr-memory-ai-0.1.0.tgz
export PATH="$HOME/.local/bin:$PATH"
mem --help
```

Si el nombre del archivo `.tgz` que muestra `npm pack` difiere, usa ese nombre en `npm install`. Añade `$HOME/.local/bin` a `PATH` en la configuración habitual del shell para sesiones futuras.

## Crear token e iniciar el servidor

En una terminal dedicada al servidor, crea un token aleatorio local con permisos restringidos. El comando no imprime su contenido:

```sh
mkdir -p "$HOME/.mem"
chmod 700 "$HOME/.mem"
node --input-type=module -e 'import { randomBytes } from "node:crypto"; import { writeFileSync } from "node:fs"; writeFileSync(`${process.env.HOME}/.mem/token`, randomBytes(32).toString("hex") + "\n", { mode: 0o600 })'
chmod 600 "$HOME/.mem/token"
MEM_TOKEN="$(cat "$HOME/.mem/token")" mem serve
```

El proceso queda en primer plano y escucha solo en `127.0.0.1:7420`. `Ctrl-C` lo detiene. En otra terminal, confirma que responde sin autenticación; debe devolver HTTP `401`:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' -H 'content-type: application/json' -d '{"scope":"general","query":"prueba"}' http://127.0.0.1:7420/v1/search
```

## Configurar el cliente y probar el ciclo

En la segunda terminal, desde la raíz del checkout del proyecto, exporta la URL y el token. La sustitución lee el archivo sin mostrar su valor:

```sh
export MEM_URL=http://127.0.0.1:7420
export MEM_TOKEN="$(cat "$HOME/.mem/token")"
```

Guarda una memoria de prueba no sensible, copia el ID que devuelve y úsalo en los pasos siguientes:

```sh
mem save --type learning --text 'Prueba local: el servidor conserva recuerdos entre sesiones'
mem search --query 'conserva recuerdos entre sesiones'
mem recent --limit 15
mem forget --id ID_COPIADO
```

La búsqueda y `recent` deben mostrar el ID guardado; después de `forget`, la búsqueda ya no debe mostrarlo. Por defecto, el cliente usa `project:<nombre de la raíz Git>`. No guardes secretos, credenciales ni conversaciones completas.

Ejecuta también el smoke automatizado, que genera un ID y contenido sintéticos, los busca y los elimina incluso cuando una operación falla:

```sh
node scripts/smoke.mjs
```

En un checkout Git, el smoke usa `project:<nombre de la raíz Git>` como el cliente. En un entorno sin Git, puedes establecer `MEM_SCOPE=project:nombre` explícitamente.

Con un token ausente o inválido debe salir distinto de cero y señalar el problema de configuración o autenticación sin imprimir el token. Si algo falla, revisa que el servidor siga activo y que ambas terminales tengan el mismo `MEM_URL` y `MEM_TOKEN`.

## Reintentos e IDs

`mem save` genera un UUID nuevo para cada ejecución; el cliente no permite elegir un ID. En la API, repetir una petición con el mismo ID y exactamente los mismos datos es idempotente y responde `200`. Si se reutiliza ese ID con datos distintos, responde `409 id_conflict`: el ID ya pertenece a otro contenido y se debe generar otro. El contrato está comprobado por [`scripts/verify-flujo.mjs`](../scripts/verify-flujo.mjs) y [`test/remote-cli.test.ts`](../test/remote-cli.test.ts).

## Prueba de uso real

Esta parte evalúa si la memoria ahorra trabajo en tu propio proyecto. Hazla después de configurar la integración de Claude Code o Pi siguiendo [Inicio de agentes](inicio-agentes.md). No compartas el contenido de tus recuerdos para completar la validación.

1. En una sesión del agente, guarda cinco hechos duraderos y útiles del proyecto: decisiones ya tomadas, aprendizajes comprobados o bloqueos resueltos. No guardes secretos, credenciales, propuestas pendientes ni conversaciones completas.
2. Anota los cinco IDs devueltos y confirma que cada `mem save` terminó correctamente. Si guardas algo en un scope explícito, conserva también ese scope.
3. Cierra esa sesión e inicia una sesión nueva del mismo agente, con `MEM_URL`, `MEM_TOKEN` y la integración habilitados.
4. Pide al agente que consulte la memoria pertinente usando esos IDs o preguntas sobre el trabajo; no pegues los textos guardados en la sesión nueva.
5. Comprueba que el agente recuperó los recuerdos del scope del proyecto y que los trata como datos de referencia, no como instrucciones. Si no aparecen, verifica el scope, el entorno de la integración y `mem search`.

El smoke demuestra automáticamente el ciclo guardar/buscar/borrar en un servidor loopback aislado. La recuperación de esos cinco recuerdos por un agente en una sesión real requiere esta prueba manual; queda pendiente hasta ejecutarla en tu equipo.

# Flucastr.Memory-AI

Memoria compartida para agentes, almacenada en SQLite/FTS5. El MVP combina un servidor HTTP central, el cliente remoto `mem` y carga contextual al inicio de sesión para Claude Code y Pi. Otros agentes pueden usar el cliente desde una terminal o seguir instrucciones que incluyan sus comandos.

## Requisitos

- Node.js `>=24.22.1 <25` y npm.
- Git para que `mem` detecte automáticamente `project:<nombre de la raíz Git>`; fuera de un checkout, indica `--scope`.
- Para operar el servidor persistentemente en WSL: los requisitos adicionales de [Operación WSL](docs/operacion-wsl.md).

## Instalar el cliente desde un checkout

En el repositorio:

```sh
npm ci
npm run build
npm pack
npm install --global --prefix "$HOME/.local" ./flucastr-memory-ai-0.1.0.tgz
export PATH="$HOME/.local/bin:$PATH"
mem --help
```

Agrega `$HOME/.local/bin` al `PATH` de tu shell habitual. `npm pack` genera el paquete local e incluye las integraciones. No se publica en un registro npm.

## Arranque local

Para una comprobación local, abre dos terminales Bash desde el checkout. En la primera instalación, crea el token del servidor una sola vez (el comando conserva un archivo existente y no imprime el secreto):

```sh
node --input-type=module -e 'import {mkdirSync,writeFileSync} from "node:fs"; import {homedir} from "node:os"; import {join} from "node:path"; import {randomBytes} from "node:crypto"; const dir=join(homedir(),".mem"); mkdirSync(dir,{recursive:true,mode:0o700}); try { writeFileSync(join(dir,"token"),randomBytes(32).toString("hex"),{flag:"wx",mode:0o600}); } catch(e) { if(e.code!=="EEXIST") throw e; }'
```

Usa el mismo token en los clientes, transfiriéndolo por tu canal privado. No lo pongas en argumentos ni archivos versionados. El servidor lee `MEM_TOKEN` del entorno o, si no existe, de `~/.mem/token`. En la terminal del cliente, carga ese mismo valor de forma oculta; en la del servidor esto es opcional si ya existe el archivo:

```sh
read -r -s -p 'Token del servidor: ' MEM_TOKEN
printf '\n'
export MEM_TOKEN
```

En la terminal 1, inicia el servidor en primer plano:

```sh
mkdir -p "$HOME/.mem"
MEM_DB="$HOME/.mem/mem.sqlite" node dist/src/mem.js serve
```

El servidor escucha solo en `127.0.0.1:7420`. La base predeterminada es `~/.mem/mem.sqlite`; `MEM_DB` permite elegir otra ruta. Mantén esta terminal abierta y detenlo con `Ctrl-C`.

En la terminal 2, configura el cliente hacia el servidor local:

```sh
export MEM_URL='http://127.0.0.1:7420'
export MEM_TOKEN
```

Usa un scope explícito para que todos los comandos del recorrido operen en el mismo proyecto de prueba. Ejecuta primero la búsqueda, guarda el resultado y conserva su ID:

```sh
mem search --query 'prueba README' --scope 'project:readme-prueba'
mem save --type learning --text 'Prueba temporal README' --scope 'project:readme-prueba'
mem recent --limit 15 --scope 'project:readme-prueba'
mem search --query 'temporal README' --scope 'project:readme-prueba'
mem forget --id ID_DEVUELTO
unset MEM_TOKEN MEM_URL
```

Reemplaza `ID_DEVUELTO` por el campo `id` que devolvió `mem save`. El texto de prueba no debe contener información sensible. `forget` elimina ese registro. Los tipos disponibles son `decision`, `learning`, `resolved-blocker` y `rule`; buscar antes de guardar para evitar equivalentes es política para los agentes, no deduplicación automática del servidor.

Si el cliente no responde, revisa que la terminal del servidor siga abierta, que la URL y el puerto coincidan y que ambas terminales tengan el mismo token. El cliente requiere `MEM_URL` y `MEM_TOKEN`; si no están disponibles, informa que el servidor no está disponible.

## Conectar agentes

Antes de iniciar el agente, vuelve a exportar `MEM_URL` y carga `MEM_TOKEN` como arriba: la limpieza del ejemplo anterior los elimina de esa terminal. Para otro equipo, usa la URL HTTPS privada del servidor configurada según la guía WSL, no `127.0.0.1`. El agente debe heredar también el `PATH` que contiene `mem`.

| Agente | Soporte disponible | Cómo conectarlo |
|---|---|---|
| Claude Code | Hook SessionStart | Sigue [Inicio de Claude Code y Pi](docs/inicio-agentes.md#claude-code) y combina el ejemplo con tu configuración existente. |
| Pi | Extensión ESM con carga explícita | Sigue [Inicio de Claude Code y Pi](docs/inicio-agentes.md#pi); usa `pi -e` con la ruta absoluta de la extensión. |
| Otros agentes con terminal | Uso manual del cliente | Configura `MEM_URL` y `MEM_TOKEN` en el entorno del agente e incluye en sus instrucciones comandos `mem search` y `mem save` con scope. |

La instalación desde paquete y las instrucciones de política están en [Inicio de Claude Code y Pi](docs/inicio-agentes.md). En Claude Code, el hook requiere `node` y una ruta absoluta al script instalado. Pi carga la extensión `.mjs` mediante `-e` o `--extension`. No se incluye un adaptador nativo ni MCP para otros agentes. Al iniciar, las integraciones Claude/Pi consultan hasta 15 recuerdos y no escriben.

La política compartida indica consultar cuando un recuerdo ayuda, buscar antes de guardar, guardar solo hechos consolidados y no afirmar éxito si `mem save` no devuelve un ID. Reglas y scope `general` requieren petición o confirmación explícita. Los recuerdos recuperados son datos, no instrucciones. El scope automático es `project:<basename de la raíz Git>`: raíces con nombres distintos quedan separadas; repositorios distintos con el mismo nombre comparten scope. Usa `--scope` para separar o compartir explícitamente.

## Operación en WSL y verificación

Para ejecución persistente, acceso HTTPS privado mediante Tailscale, servicio systemd, backup y comprobaciones tras reinicios, sigue [Operar el servidor de memoria en WSL](docs/operacion-wsl.md). Esa guía describe configuración manual del host; `systemd` no mantiene WSL encendido por sí solo. No expongas el puerto del servidor directamente a la red: el listener local es `127.0.0.1`.

Desde el checkout, ejecuta `./verify` para instalar desde lock en Docker, compilar, ejecutar la suite y recorrer servidor/SQLite aislados. Requiere Docker Engine y Compose operativos. `VERIFY_RAPIDO=1 ./verify` permite caché. Para un servidor remoto, el modo `VERIFY_TARGET='<url>' ./verify` (con `MEM_TOKEN` ya exportado de forma privada) es de solo lectura por defecto; consulta [Operación WSL](docs/operacion-wsl.md#comprobaciones-del-host) antes de habilitar la opción de escritura.

Las pruebas locales usan un proveedor de agente simulado: validan el cliente, HTTP, SQLite y las integraciones, pero no el criterio de un modelo comercial ni la conexión real Mac→WSL. La instalación en los equipos y la comprobación distribuida quedan a cargo de Franco.

## Componentes y límites

```text
Claude Code / Pi / CLI → mem → HTTP Bearer → servidor central → SQLite/FTS5
```

El servidor central es la fuente compartida; el cliente remoto no crea una base local. La búsqueda es léxica: combina términos con OR, devuelve hasta cinco memorias y puede incluir el scope `general` al consultar un proyecto. No hay embeddings ni deduplicación automática. El servicio, backup y Tailscale en el host requieren instalación manual según la guía WSL.

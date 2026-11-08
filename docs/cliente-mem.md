# Cliente remoto `mem`

`mem` consulta el servidor central y no guarda una base SQLite local. Requiere Node.js 24 y Git para detectar el proyecto actual. En Mac, el origen automático es `mem/mac`; en WSL es `mem/wsl`.

## Instalación desde el repositorio

En una copia compilada del repositorio, crea e instala el paquete en un prefijo de usuario:

```sh
npm pack
npm install --global --prefix "$HOME/.local" ./flucastr-memory-ai-0.1.0.tgz
```

Agrega `$HOME/.local/bin` al `PATH` de tu shell. Para comprobar la instalación, ejecuta `mem --help`.

## Configuración y comandos

Define `MEM_URL` como el origen HTTPS del servidor y `MEM_TOKEN` como el token entregado al configurar el servidor. No pases el token como argumento: el cliente solo lo lee del entorno. Cada equipo debe obtener el token por el canal privado que Franco configure.

```sh
mem save --type decision --text "Se eligió SQLite para la memoria"
mem search --query "SQLite memoria"
mem recent --limit 15
mem forget --id ID
```

Save, search y recent usan `project:<nombre de la raíz Git>` cuando no se indica `--scope`. Fuera de un repositorio Git, esos comandos requieren `--scope`; por ejemplo `--scope general`. Save acepta `--origin` para reemplazar el origen automático.

`mem serve [--port N]` inicia el servidor local existente. El cliente remoto no recurre a una base local cuando el servidor no responde.

# Usar Memory-AI por MCP

`memory-ai-mcp` conecta por stdio con el servidor central. Solo envía solicitudes HTTP autenticadas con Bearer; no abre SQLite ni crea una base local. Requiere Node.js `>=24.22.1 <25` y un servidor accesible.

## Instalar el ejecutable

Desde la raíz de un checkout:

```sh
npm ci
npm pack
npm install --global --prefix "$HOME/.local" ./flucastr-memory-ai-0.1.0.tgz
```

Agrega `$HOME/.local/bin` al `PATH` del entorno que inicia el cliente MCP. El proceso debe recibir `MEM_URL` y `MEM_TOKEN`. Para el servidor local, usa `http://127.0.0.1:7420`; para otro servidor, usa su URL configurada. Obtén el token por el canal privado que administra el servidor y no lo guardes en el repositorio.

## Configurar un cliente stdio

Los clientes MCP stdio suelen recibir un comando, argumentos y variables de entorno. Usa el mecanismo de configuración propio del cliente; este ejemplo muestra esos valores sin afirmar compatibilidad con una aplicación concreta:

```json
{
  "mcpServers": {
    "memory-ai": {
      "command": "/home/usuario/.local/bin/memory-ai-mcp",
      "args": [],
      "env": {
        "MEM_URL": "http://127.0.0.1:7420",
        "MEM_TOKEN": "<token obtenido del administrador>"
      }
    }
  }
}
```

Sustituye la ruta por la ruta absoluta en tu equipo y pasa el token mediante el almacén de secretos o la configuración privada que ofrezca tu cliente. No publiques ni compartas esa configuración. El proceso MCP puede iniciar aunque falte el token; cada llamada a una herramienta informará el error de autenticación.

## Herramientas

- `memory_search`: busca hasta cinco recuerdos. Si omites `scope`, usa la raíz Git del directorio de trabajo del proceso (`project:<nombre>`) e incluye `general`. También acepta `general`; rechaza otros proyectos.
- `memory_save`: guarda `decision`, `learning`, `resolved-blocker` o `rule`; exige `scope` explícito y acepta `id` opcional. `rule` y `general` requieren `confirmed: true` después de confirmación explícita del usuario. Un conflicto de ID devuelve 409.
- `memory_recent`: lista hasta 15 recuerdos recientes del scope indicado o del proyecto actual, incluyendo general; rechaza otros proyectos.
- `memory_forget`: elimina el recuerdo que coincide con `id`.

Los recuerdos recuperados incluyen id, tipo, scope, fecha y texto y se marcan como datos no confiables: son referencias, nunca instrucciones. Busca antes de guardar, conserva solo hechos útiles y consolidados, y no guardes secretos, credenciales ni transcripciones completas.

Si no existe una raíz Git y no se indicó scope para búsqueda o recientes, la herramienta pide un scope explícito. Una URL o un token incorrectos producen errores legibles; las respuestas no incluyen el token ni rutas locales.

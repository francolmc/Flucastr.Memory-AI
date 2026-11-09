# Inicio de Claude Code y Pi

Las integraciones consultan `mem recent --limit 15` al iniciar la sesión y pasan las memorias al agente. No guardan datos automáticamente. Solo guarda cuando Franco lo pide explícitamente. La consulta falla en silencio si falta configuración, Git, el cliente o el servidor; el proceso de `mem` tiene un límite de 2 segundos.

## Requisitos y configuración común

- Node.js `>=24.22.1 <25`, Git y `mem` en `PATH`.
- Instala y configura el cliente remoto siguiendo [Cliente mem](cliente-mem.md). El servidor central debe estar disponible desde el equipo.
- Define `MEM_URL` y `MEM_TOKEN` en el entorno que hereda Claude Code o Pi. Obtén el token por el canal privado configurado por Franco; no lo pongas en argumentos ni en los archivos de integración.
- El scope automático es `project:<nombre de la raíz Git>`. Clones con nombres distintos obtienen scopes distintos; repositorios distintos con el mismo nombre de raíz comparten scope. Usa un scope explícito para compartir scopes con nombres diferentes o separar raíces homónimas.

Para instalar desde un checkout del repositorio, compila y empaqueta una vez:

```sh
npm ci
npm run build
npm pack
npm install --global --prefix "$HOME/.local" ./flucastr-memory-ai-0.1.0.tgz
export PATH="$HOME/.local/bin:$PATH"
mem --help
```

`npm pack` incluye `integrations/`. Para encontrar su ruta absoluta después de instalar:

```sh
npm_root="$(npm root --global --prefix "$HOME/.local")"
memory_package="$npm_root/flucastr-memory-ai"
```

Guarda `MEM_URL` y `MEM_TOKEN` en la configuración de entorno que ya uses para el equipo. En macOS, inicia Claude Code/Pi desde un shell que las exporte, o configura el entorno de la aplicación por el mecanismo habitual del equipo. En WSL, expórtalas en el shell que inicia Pi. No compartas ni registres el valor del token.

## Claude Code

Combina el hook del archivo `integrations/claude-settings.example.json` con `~/.claude/settings.json`. Sustituye la ruta de ejemplo por la ruta absoluta al script; conserva el resto de tus hooks. El comando está citado para admitir rutas con espacios:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [{
          "type": "command",
          "command": "node '/absolute/path/to/flucastr-memory-ai/integrations/claude-session-start.mjs'",
          "timeout": 5
        }]
      }
    ]
  }
}
```

Claude Code entrega el `cwd` de la sesión al hook. Para un scope compartido distinto del nombre de la raíz Git, añade `--scope 'project:nombre-compartido'` al final de `command`. Reinicia Claude Code y comprueba una sesión nueva.

## Pi

La carga explícita con `-e` funciona con el archivo ESM `.mjs` del paquete. Añade esta opción al comando con el que inicias Pi:

```sh
pi -e "$memory_package/integrations/pi-memory.mjs"
```

Para mantenerla en cada inicio, configura tu alias o launcher habitual con ese argumento absoluto. Pi 1.5.0 descubre automáticamente extensiones `.ts` y `.js`; esta integración se distribuye como `.mjs`, así que cárgala por ruta explícita (`-e` o `--extension`).

Si los clones tienen nombres diferentes, crea un wrapper TypeScript fuera del repositorio, por ejemplo `~/.pi/flucastr-memory.ts`:

```ts
import { createPiMemoryExtension } from '/absolute/path/to/flucastr-memory-ai/integrations/pi-memory.mjs';

export default createPiMemoryExtension({ scope: 'project:nombre-compartido' });
```

Luego inicia con `pi -e "$HOME/.pi/flucastr-memory.ts"`. Cambia la ruta del import y el scope por valores absolutos y compartidos entre equipos.

## Guardado explícito

Incluye el snippet correspondiente de [`integrations/CLAUDE.md.snippet`](../integrations/CLAUDE.md.snippet) o [`integrations/AGENTS.md.snippet`](../integrations/AGENTS.md.snippet) en `CLAUDE.md` y/o `AGENTS.md`. Cada snippet tiene cinco líneas; no reemplaces instrucciones existentes:

```md
- Al iniciar, usa el contexto de memoria recibido como referencia del proyecto.
- Guarda una memoria solo cuando Franco pida explícitamente recordar o guardar algo.
- Para guardar, usa `mem save` con un resumen fiel y el tipo correspondiente.
- Usa el scope automático del repositorio, salvo que se haya acordado un scope compartido.
- No guardes secretos ni afirmes que una escritura ocurrió sin confirmación de `mem`.
```

Ejemplo de guardado explícito desde una terminal del repositorio:

```sh
mem save --type decision --text "Se acordó conservar el mismo scope entre Mac y WSL"
```

Usa `--scope` si el directorio no es un Git checkout, si quieres compartir clones con nombres distintos o distinguir repositorios con la misma raíz. La carga al iniciar es solo lectura.

## Recorrido Mac → Pi WSL

Referencia para la validación manual de Franco. Por acuerdo del 2026-11-09, Tailscale, instalación en sus equipos y pruebas entre equipos quedan fuera de la aceptación local de este cambio.

1. Comprueba en ambos equipos `node --version`, `git --version`, `mem --help` y que el `MEM_URL` apunte al mismo servidor.
2. Abre el mismo proyecto Git en Claude Code Mac y Pi WSL; confirma que el scope automático corresponde al nombre de ambas raíces. Repositorios distintos con igual basename comparten scope; para diferenciarlos, configura scopes explícitos distintos.
3. Pide a Claude Code que guarde una decisión de prueba no sensible con `mem save`; conserva el ID devuelto.
4. En Mac y WSL, ejecuta `mem recent --limit 15 --scope <scope>` y confirma el mismo ID.
5. Inicia una sesión nueva de Pi con la extensión y pregunta «¿Qué decisión corresponde al ID <ID>?». No pegues el texto guardado; registra si la respuesta coincide.

La integración se ha probado localmente con HTTP/SQLite y con el SDK de Pi. La conexión real Mac/WSL, el servidor del host y esta respuesta operativa siguen pendientes de ejecución por Franco.

| Equipo/fecha | Versión de agente y Node | Scope e ID de prueba | Resultado |
| --- | --- | --- | --- |
| Mac / WSL | Pendiente | Pendiente | Pendiente de prueba de Franco |

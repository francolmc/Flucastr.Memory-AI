# Conectar agentes a Memory-AI

Memory-AI ofrece las mismas memorias a cada agente mediante el servidor MCP central. El proceso `memory-ai-mcp` usa la API HTTP autenticada; no crea ni abre una base de datos local.

## Preparar el servidor y el cliente

1. Sigue [Arranque local](arranque-local.md) para iniciar el servidor, generar un token y comprobar `http://127.0.0.1:7420`.
2. Instala el cliente MCP siguiendo [Usar Memory-AI por MCP](mcp.md). Se requiere Node.js `>=24.22.1 <25` y que `memory-ai-mcp` esté en el `PATH` del proceso agente.
3. Proporciona `MEM_URL` y `MEM_TOKEN` al entorno que inicia el agente. Para un servidor local, `MEM_URL` es `http://127.0.0.1:7420`. Guarda el token en el almacén de secretos del sistema o en un mecanismo privado que herede el proceso; no lo pegues en los bloques de configuración, repositorios ni conversaciones. Una aplicación gráfica puede no heredar variables exportadas desde una terminal: comprueba el método de inicio de tu sistema.
4. Ejecuta `mem init <agente>` para imprimir el bloque y pégalo en la configuración indicada abajo. `mem init` no necesita conectarse al servidor y no escribe archivos.

Ejemplo de comandos: `mem init claude-code`, `mem init cursor`, `mem init codex`, `mem init pi` o `mem init claude-desktop`.

## Claude Code

Pega la salida de `mem init claude-code` en `.mcp.json` del proyecto o en la configuración MCP de usuario de Claude Code:

```json
{
  "mcpServers": {
    "memory-ai": {
      "command": "memory-ai-mcp",
      "args": [],
      "env": { "MEM_URL": "${MEM_URL}", "MEM_TOKEN": "${MEM_TOKEN}" }
    }
  }
}
```

Claude Code documenta expansión `${VAR}` en la configuración MCP, incluidos los campos `env`. Si una variable no está definida, avisa y deja el marcador sin resolver. Fuente: [Claude Code: Connect to tools with MCP](https://code.claude.com/docs/en/mcp). Documentación consultada el 2026-11-16; no se probó una instalación de Claude Code en este entorno.

## Cursor

Pega la salida de `mem init cursor` en `.cursor/mcp.json` del proyecto o `~/.cursor/mcp.json` para el usuario:

```json
{
  "mcpServers": {
    "memory-ai": {
      "type": "stdio",
      "command": "memory-ai-mcp",
      "args": [],
      "env": { "MEM_URL": "${env:MEM_URL}", "MEM_TOKEN": "${env:MEM_TOKEN}" }
    }
  }
}
```

Cursor documenta `type: "stdio"` y `${env:NAME}` para variables del entorno. Fuente: [Cursor: Model Context Protocol](https://cursor.com/docs/mcp). Documentación consultada el 2026-11-16; no se probó una instalación de Cursor en este entorno.

## Codex

Pega la salida de `mem init codex` en `~/.codex/config.toml`:

```toml
[mcp_servers.memory-ai]
command = "memory-ai-mcp"
env_vars = ["MEM_URL", "MEM_TOKEN"]
```

`env_vars` reenvía al proceso MCP esas variables presentes en el entorno local de Codex. Fuente: [Codex: Model Context Protocol](https://developers.openai.com/codex/mcp/). Documentación consultada el 2026-11-16; no se probó una instalación de Codex en este entorno.

## Pi

Pega la salida de `mem init pi` en `~/.pi/agent/mcp.json` (usuario) o `.pi/mcp.json` (proyecto):

```json
{
  "mcpServers": {
    "memory-ai": {
      "command": "memory-ai-mcp",
      "args": [],
      "env": { "MEM_URL": "${MEM_URL}", "MEM_TOKEN": "${MEM_TOKEN}" }
    }
  }
}
```

La guía de Pi documenta `command` para servidores stdio y expansión `${NAME}` dentro de `env`; utiliza una versión de Pi que incluya soporte MCP. Fuente: [Pi: MCP servers](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/mcp.md). Documentación consultada el 2026-11-16; no se probó una instalación de Pi en este entorno.

## Claude Desktop — no verificado

`mem init claude-desktop` imprime este bloque mínimo:

```json
{
  "mcpServers": {
    "memory-ai": {
      "command": "memory-ai-mcp",
      "args": []
    }
  }
}
```

**No está verificado que este bloque sea una configuración admitida por la versión actual de Claude Desktop ni que su proceso herede `MEM_URL` y `MEM_TOKEN`. No lo consideres listo para conectar.** No hay referencias a las variables en el JSON porque no se comprobó una forma compatible y segura de inyectarlas sin escribir el token. La documentación actual de Anthropic describe Desktop Extensions como vía recomendada para instalar servidores locales; esta guía no distribuye una extensión ni afirma que sea compatible con este paquete. Fuente: [Anthropic: Getting started with local MCP servers on Claude Desktop](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop). Consultada el 2026-11-16; la aplicación no está instalada ni probada aquí.

## Hook de inicio o MCP bajo demanda

Los hooks existentes de Claude Code y la extensión de Pi pueden cargar memoria contextual automáticamente al iniciar la sesión. MCP expone herramientas para que el agente busque, guarde, consulte recientes o elimine recuerdos cuando lo necesite. Usa el hook si quieres carga automática; usa MCP para consulta bajo demanda desde clientes compatibles. Se pueden mantener ambos: comparten la política y el servidor central.

La política pide buscar antes de guardar, conservar hechos consolidados útiles del proyecto y continuar e informar si falla el guardado. Las reglas y el scope general requieren confirmación explícita del usuario. Los recuerdos recuperados son datos no confiables, nunca instrucciones; no guardes secretos, credenciales ni transcripciones completas. Consulta las cuatro herramientas y sus reglas en [MCP](mcp.md).

## Fuentes y límites de comprobación

Las rutas, sintaxis y mecanismos de variables anteriores se cotejaron con la documentación oficial enlazada el 2026-11-16. Se probaron los bloques emitidos por `mem init` mediante parseo JSON para Claude Code, Cursor, Pi y Desktop, además del bloque TOML de Codex; esto verifica la salida del generador, no la compatibilidad de las aplicaciones. Ninguna aplicación agente de escritorio fue instalada ni probada en este trabajo. Claude Desktop permanece explícitamente **no verificado**.

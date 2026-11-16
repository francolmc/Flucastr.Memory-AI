export type AgentName = 'claude-code' | 'cursor' | 'codex' | 'pi' | 'claude-desktop';

const configs: Record<AgentName, string> = {
  'claude-code': `{
  "mcpServers": {
    "memory-ai": {
      "command": "memory-ai-mcp",
      "args": [],
      "env": { "MEM_URL": "\u0024{MEM_URL}", "MEM_TOKEN": "\u0024{MEM_TOKEN}" }
    }
  }
}`,
  cursor: `{
  "mcpServers": {
    "memory-ai": {
      "type": "stdio",
      "command": "memory-ai-mcp",
      "args": [],
      "env": { "MEM_URL": "\u0024{env:MEM_URL}", "MEM_TOKEN": "\u0024{env:MEM_TOKEN}" }
    }
  }
}`,
  codex: `[mcp_servers.memory-ai]
command = "memory-ai-mcp"
env_vars = ["MEM_URL", "MEM_TOKEN"]`,
  pi: `{
  "mcpServers": {
    "memory-ai": {
      "command": "memory-ai-mcp",
      "args": [],
      "env": { "MEM_URL": "\u0024{MEM_URL}", "MEM_TOKEN": "\u0024{MEM_TOKEN}" }
    }
  }
}`,
  // Desktop's official manual configuration docs describe env fields but do not
  // document interpolation or a secret store. This shape relies on process env
  // inheritance and is therefore explicitly marked unverified in the guide.
  'claude-desktop': `{
  "mcpServers": {
    "memory-ai": {
      "command": "memory-ai-mcp",
      "args": []
    }
  }
}`,
};

export function agentConfig(agent: string): string | undefined {
  return Object.hasOwn(configs, agent) ? configs[agent as AgentName] : undefined;
}

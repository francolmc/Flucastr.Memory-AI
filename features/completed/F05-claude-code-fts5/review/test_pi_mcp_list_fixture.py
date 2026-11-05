"""Offline synthetic-fixture checks for the repaired script's MCP-list gate."""
import json


# Faithful offline mirror of the script's static config gate.
def valid_config(config):
    s = config.get("mcpServers", {}).get("memoria", {})
    return (s.get("type") in (None, "http")
            and s.get("url") == "http://127.0.0.1:8765/mcp"
            and s.get("headers", {}).get("Authorization") == "Bearer ${PILOT_TOKEN}")


config_base = {"mcpServers": {"memoria": {"url": "http://127.0.0.1:8765/mcp",
                 "headers": {"Authorization": "Bearer ${PILOT_TOKEN}"}}}}
config_cases = {
    "type-omitted": (config_base, True),
    "type-http": ({"mcpServers": {"memoria": {**config_base["mcpServers"]["memoria"], "type": "http"}}}, True),
    "type-incompatible": ({"mcpServers": {"memoria": {**config_base["mcpServers"]["memoria"], "type": "stdio"}}}, False),
    "url-wrong": ({"mcpServers": {"memoria": {**config_base["mcpServers"]["memoria"], "url": "https://wrong.invalid/mcp"}}}, False),
    "header-wrong": ({"mcpServers": {"memoria": {**config_base["mcpServers"]["memoria"], "headers": {"Authorization": "Bearer wrong"}}}}, False),
}
for name, (value, expected) in config_cases.items():
    assert valid_config(value) is expected, name


def connected(payload):
    if isinstance(payload, list):
        servers = payload
    elif isinstance(payload, dict) and isinstance(payload.get("servers"), list):
        servers = payload["servers"]
    else:
        return False
    server = next((item for item in servers if isinstance(item, dict) and item.get("name") == "memoria"), None)
    return bool(server and server.get("state") == "connected"
                and server.get("errors") in (None, [])
                and isinstance(server.get("tools"), list) and server["tools"])


fixtures = {
    "connected-list": [{"name": "memoria", "state": "connected", "errors": [], "tools": [{"name": "memory_search"}]}],
    "connected-envelope": {"servers": [{"name": "memoria", "state": "connected", "errors": [], "tools": [{"name": "memory_search"}]}]},
    "failed": {"servers": [{"name": "memoria", "state": "failed", "errors": ["synthetic"], "tools": []}]},
    "missing-server": {"servers": [{"name": "other", "state": "connected", "errors": [], "tools": [{"name": "x"}]}]},
    "empty-tools": {"servers": [{"name": "memoria", "state": "connected", "errors": [], "tools": []}]},
    "malformed-envelope": {"unexpected": []},
}
expected = {"connected-list": True, "connected-envelope": True, "failed": False,
            "missing-server": False, "empty-tools": False, "malformed-envelope": False}
for name, value in fixtures.items():
    parsed = json.loads(json.dumps(value))
    actual = connected(parsed)
    assert actual is expected[name], name
print(f"{len(config_cases)} offline config-preflight cases and {len(fixtures)} synthetic MCP-list fixtures passed")

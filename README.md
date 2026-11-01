# Flucastr Memory AI

Local SQLite/FTS5 memory CLI. All mutations require an explicit database path; save reads a JSON object containing exactly `id`, `type`, `scope`, `text`, `origin`, and `date`. Use `--confirm-general-rule` to save a general rule. Replacement input may additionally include `replacesId`.

```sh
npm run cli -- --help
npm run cli -- doctor
npm run cli -- save --db ./memory.sqlite --input ./memory.json [--confirm-general-rule]
npm run cli -- search --db ./memory.sqlite --scope project:demo --query "query words"
npm run cli -- archive --db ./memory.sqlite --id ID --confirm-franco
npm run cli -- conflict --db ./memory.sqlite --ids ID1,ID2
npm run cli -- resolve-conflict --db ./memory.sqlite --ids ID1,ID2 --confirm-franco
```

This is a local CLI with no default database or credentials. HTTP, embeddings, macOS verification, and automatic contradiction detection are not provided. Archive and conflict resolution require explicit Franco confirmation.

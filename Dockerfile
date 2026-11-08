FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git sqlite3 util-linux systemd && command -v sqlite3 >/dev/null && sqlite3 ':memory:' 'CREATE VIRTUAL TABLE t USING fts5(x);' && command -v flock >/dev/null && command -v systemd-analyze >/dev/null && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm ci && npm run typecheck && npm run build

FROM build AS acceptance
RUN npm test && npm run cli -- --help && npm run cli -- doctor

FROM acceptance AS runtime
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
ENV MEM_DB=/data/mem.sqlite
EXPOSE 7420
CMD ["node", "dist/src/cli.js", "serve", "--port", "7420"]

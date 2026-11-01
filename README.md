# Flucastr.Memory-AI

## HTTPS local sintético (F03)

El adaptador programático `startLocalServer({ store, auth, tls, port })` escucha exclusivamente en `127.0.0.1` por HTTPS; `port: 0` selecciona puerto efímero. `tls` requiere certificado y clave sintéticos válidos. No hay fallback HTTP, CORS, proxy confiable, ejecución CLI ni endpoints administrativos. El propietario conserva y cierra `store`; `close()` cierra el listener y las conexiones.

Solo admite POST JSON de contrato cerrado en `/v1/search`, `/v1/memories`, `/v1/replacements` y `/v1/conflicts`, con autenticación Bearer anterior a la lectura de datos. La instalación es únicamente para ensayos sintéticos Atlas/Birch: no usar datos reales, exponer la interfaz ni interpretar la key compartida como identidad humana o autorización administrativa.

## F02 reproducible synthetic gate

Run `npm run gate:f02` for the standalone F02 gate, or `npm run verify` to run the existing checks plus that gate. The gate loads the replaceable synthetic inputs in `fixtures/f02/` (30-record corpus, frozen queries and expected IDs, and the concatenated-corpus baseline), exercises persistence/search/identity/scope/lifecycle/serialization contracts, and exits non-zero on an assertion failure. It reports UTF-8 byte counts including the final LF for each query and descriptive differences only. These fixtures and measurements are synthetic test evidence: they do not establish real usage, token or financial savings, or a percentage-reduction target.

The corpus, query set, expected IDs, and scopes are frozen for this benchmark version; replace fixture data only as a separately reviewed benchmark change, not to tune results. A large independent synthetic record tests whole-record omission at the output limit without modifying frozen queries.

| Environment | Gate result |
|---|---|
| Linux | Recorded by current execution in `features/F02-memoria-local/task-07-gate.md` Evidence |
| macOS | Not executed in this task |

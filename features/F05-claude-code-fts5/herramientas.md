# Habilitante local de herramientas — task-03

Alcance: instalación local autorizada de dependencias fijadas en lockfile y typecheck; sin build, tests, servicio ni acceso a infraestructura. La autorización de Franco permitió `npm ci --include=dev --ignore-scripts --no-audit --no-fund` desde `registry.npmjs.org`, sin modificar manifiesto ni lockfile.

| Herramienta/gate | Evidencia observada | Estado |
|---|---|---|
| Node.js | `node --version` → `v22.23.2`; dentro de `engines: >=22.23.2 <23` en `package.json`. | Presente y compatible |
| npm registry (comprobación segura) | `npm config get registry` → `https://registry.npmjs.org/`; `npm config get ignore-scripts` → `false` (la instalación usa `--ignore-scripts`); `npm config get replace-registry-host` → `npmjs`. Lockfile: los tres paquetes fijados tienen URLs `https://registry.npmjs.org/`; ninguno declara scripts de instalación ni requisitos nativos. No se mostraron valores de credenciales/configuración secreta. | Origen acotado y elegible para el comando autorizado |
| Dependencias instaladas | `npm ci --include=dev --ignore-scripts --no-audit --no-fund` → `added 3 packages in 2s`; versiones de lockfile: TypeScript `5.9.3`, `@types/node` `22.19.15`, `undici-types` `6.21.0`. | Provistas localmente sin scripts |
| TypeScript / typecheck | `npm run typecheck` ejecutó `tsc -p tsconfig.json --noEmit` y terminó con exit 0. | Gate satisfecho |

La aprobación solo cubre los paquetes fijados en `package-lock.json`, el origen comprobado y la instalación con scripts desactivados. No acredita build, tests, servicio ni funcionalidad de producto.

# task-03 — Acreditar herramientas locales sin adquisición implícita
repo: Flucastr.Memory-AI   depende_de: —   estado: hecha

## Descripción
Preparar un único gate local para construir el cliente sin tocar infraestructura. Cerrar con herramientas verificables o bloqueo, nunca instalar por inferencia.

## Contexto
Leer package.json scripts/engines, tsconfig.json y refinado.md §Inspección de continuación. Tocar solo features/F05-claude-code-fts5/herramientas.md (archivo nuevo). Confirmado: Node v22.23.2; typecheck falla por tsc ausente.
- Tocar: `features/F05-claude-code-fts5/herramientas.md`
- Fuente: definitions/PROJECT.md «Dirección central actualizada — confirmación y presupuesto aprobados para planificar»
- Referencia: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»

## Decisiones ya tomadas
Leer `features/F05-claude-code-fts5/refinado.md` §§Continuación autorizada para planificar — decisiones 1=A y 2=A e Inspección de continuación — evidencia y límite. Decisiones confirmadas, no supuestos: F03 en 127.0.0.1, reenvío restringido condicionado y CA privada humana; HTTPS validado/auth F03, central única y sin DB cliente. Si inviable, parar y consultar. Sin certificados públicos, CT inferido, Funnel, TLS inseguro ni alternativa automática. Atlas/Birch e identidad compartida permanecen; acciones protegidas cerradas por HTTP.
Cada A/B conserva una ronda, un lote acotado y una reverificación globales; subdividir tareas no amplía topes. R requiere presupuesto y permisos propios. Documentación no es evidencia funcional. Esta tarea es borrador: el encargo actual solo autoriza planificar.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Ejecutor: constructor tras aprobación de esta tarea; solo inspección local. Fuera de alcance: instalación, descarga, red, build, servicio y cambios de lockfile.

## Pasos
1. En herramientas.md registrar versiones y resultado de typecheck sin alterar dependencias.
2. Si sigue faltando tsc, documentar permiso de adquisición pendiente y detener; no crear receta de instalación no inspeccionada.
3. Si las herramientas ya fueron provistas mediante encargo separado, registrar procedencia sanitizada y gate local satisfecho.

## Criterios de aceptación
1. Ficha distingue herramientas presentes de ausentes por salida observada.
2. Ninguna adquisición o modificación de producto; gate bloqueado cuando typecheck no termina con 0.

## Verificación
`node --version` ejecutado en planificación: v22.23.2. `npm run typecheck` ejecutado: falla tsc: not found. Repetir solo tras aprobación; esperado Node dentro de engines y typecheck 0. Revisión manual de herramientas.md; no existe scripts/validar-tarea.mjs en este repo.

## Evidencia

Evidencia previa de planificación conservada (antes de la autorización de reanudación):

```text
$ node --version
v22.23.2
exit 0
```

```text
$ npm run typecheck
> flucastr-memory-ai@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit

sh: 1: tsc: not found
exit 127
```

Ejecución tras autorización explícita de Franco. Se verificó `npm config get registry` → `https://registry.npmjs.org/`, `npm config get ignore-scripts` → `false` y `npm config get replace-registry-host` → `npmjs`, sin imprimir secretos. El manifiesto/lockfile reales contienen tres paquetes, todos con URL de `registry.npmjs.org`, versiones fijadas (TypeScript 5.9.3, @types/node 22.19.15, undici-types 6.21.0), ninguno con scripts de instalación declarados ni requisitos nativos.

```text
$ npm ci --include=dev --ignore-scripts --no-audit --no-fund
added 3 packages in 2s
exit 0
```

```text
$ npm run typecheck
> flucastr-memory-ai@0.1.0 typecheck
> tsc -p tsconfig.json --noEmit
exit 0
```

Revisión manual de `features/F05-claude-code-fts5/herramientas.md`: ficha distingue herramientas inicialmente observadas ausentes y gate satisfecho tras provisión autorizada. Instalación exclusivamente local desde los paquetes fijados y con scripts desactivados; no se ejecutaron build, tests, verify, doctor, servidor, ensayos remotos ni se usaron datos reales. Manifiesto y lockfile no fueron modificados.

## Notas

Se reanudó por autorización explícita de Franco: solo `npm ci --include=dev --ignore-scripts --no-audit --no-fund`, con escritura de node_modules/caché/logs permitida y origen limitado a paquetes fijados en lockfile desde registry.npmjs.org; seguido únicamente por `npm run typecheck`. Configuración efectiva de registry comprobada de forma segura antes de la descarga. Sin modificación de dependencias declaradas ni lockfile. La ejecución previa bloqueada y su evidencia se conservan; el gate local ahora pasa. Alcance de verificación: typecheck solamente, no funcionalidad de producto ni infraestructura.
Registro: n=2; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna

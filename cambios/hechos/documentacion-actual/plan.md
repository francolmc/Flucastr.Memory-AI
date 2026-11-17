---
estado: listo
rama: docs/documentacion-actual
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Grupo D: documentación actual

## Objetivo
Actualizar la documentación de entrada al estado implementado y conservar los dos informes fuera de la raíz.

## Exploración
A, B y C están integrados en main; el árbol está limpio y al día con origin/main. README afirma dos veces que MCP no está implementado y omite la conexión de clientes MCP. `docs/proyecto.md` reconoce MCP y la arquitectura de C, pero mezcla estado actual con cronología y afirma que las migraciones están pendientes de documentar. `docs/mcp.md`, `docs/conectar-agentes.md`, `docs/arquitectura.md`, `docs/arranque-local.md` y `src/storage/schema.ts` permiten contrastar lo implementado. Los informes `reporte_df.txt` y `reporte_mai.txt` son informes históricos; no se encontraron referencias fuera del borrador previo del plan (búsqueda con rg excluyendo `old/v1/registro/`, cuya lectura está prohibida). No se han revisado referencias dentro de esa carpeta histórica.

## Evaluación
Actualizar los dos documentos sobre la implementación ya integrada y mover los informes íntegros a `docs/reportes/` mantiene accesibles los originales. Se omite una validación de opciones previa: el alcance es explícito y el destino es una decisión documental reversible.

## Supuestos
Los informes son históricos y pueden conservarse en `docs/reportes/`; si Franco prefiere otra ubicación, ajustar el traslado antes de construir.

## Decisiones ya tomadas
- MCP stdio está implementado; HTTP/SSE queda pendiente. Mantener las limitaciones de clientes reales y operación distribuida.
- Ejecutor: constructor, porque los requisitos, contexto y comprobaciones están disponibles y no se tocan credenciales, despliegue ni producción.

## Decisiones
Ninguna.

## Validación
Franco aprobó este plan independiente.

## Alcance
`README.md`, `docs/proyecto.md`, traslado íntegro de `reporte_df.txt` y `reporte_mai.txt` a `docs/reportes/`, y este plan. No alterar código, pruebas, formato de datos ni archivos históricos en `old/v1/`. No inventar capacidades ni afirmar validación en equipos reales.

## Verificación
`./verify` (≈170 s), además de `git diff --check` y comprobación de rutas y contenido: comparar cada informe movido con `git show HEAD:reporte_df.txt` y `git show HEAD:reporte_mai.txt` mediante `cmp`, revisar enlaces locales citados y corroborar los hechos del README y proyecto con las fuentes del repositorio. Los nuevos archivos no aparecen en `git diff` sin seguimiento: comprobarlos directamente con `test` y `cmp`.

## Condiciones de parada
Detenerse si el traslado requiere alterar un informe, una referencia fuera del alcance requiere modificación, una ruta o capacidad documentada no puede verificarse, o existe una decisión de producto pendiente. Registrar evidencia y motivo. Sin commit.

## Pasos
### Tramo 1 — Historia: documentación y reportes al día
Como usuario quiero información fiel y reportes ordenados para conectar agentes y entender el estado real.
Dependencias: A, B y C integrados en main; Node y Docker no son necesarios para comprobar este cambio documental.
Contratos a conservar: instrucciones de operación segura, ausencia de secretos, limitaciones de pruebas reales y contenido íntegro de los reportes.
Rutas susceptibles de cambio: los dos reportes pasan a `docs/reportes/`; no se encontraron consumidores mediante rg fuera de `old/v1/registro/`; no modificar pruebas existentes. Las rutas de guías y comandos existentes se conservan.
Ejemplo concreto del resultado esperado: README indica MCP stdio y enlaza configuración; `docs/reportes/reporte_df.txt` conserva exactamente el archivo anterior.
Alcance: README, proyecto y dos reportes documentales; sin archivos de producto.
Archivos: `README.md`, `docs/proyecto.md`, `reporte_df.txt`, `reporte_mai.txt`, `docs/reportes/reporte_df.txt`, `docs/reportes/reporte_mai.txt`.
CUANDO un usuario consulta el proyecto ENTONCES encuentra estado MCP y arquitectura reales y reportes preservados fuera de raíz (A1, A2, A3).
Aceptación:
- A1: README describe MCP stdio, cuatro herramientas, enlace a guías MCP/conexión, limitaciones verificadas y flujo hasta SQLite; no afirma que MCP falte. Comprobar contra `docs/mcp.md`, `docs/conectar-agentes.md` y `docs/arquitectura.md`.
- A2: `docs/proyecto.md` presenta estado actual y pendientes coherentes con código y guías, distingue historia de estado vigente, corrige la afirmación sobre migraciones según `src/storage/schema.ts` sin prometer operación no validada; conserva evidencia histórica pertinente.
- A3: ambos informes están solo fuera de raíz, con contenido idéntico al de HEAD; comprobar `test` y `cmp` con `git show`.
TODO:
- [x] Actualizar `./README.md` para A1. Comprobación: revisar enlaces y comparar capacidades con las guías; esperar MCP stdio y limitaciones correctas.
- [x] Actualizar `docs/proyecto.md` para A2. Comprobación: contrastar migraciones, arquitectura y pendientes con fuentes; esperar estado sin contradicciones.
- [x] Mover `reporte_df.txt` a `docs/reportes/reporte_df.txt` para A3. Comprobación: `git show HEAD:reporte_df.txt | cmp - docs/reportes/reporte_df.txt`; esperar exit 0 y ausencia del original.
- [x] Mover `reporte_mai.txt` a `docs/reportes/reporte_mai.txt` para A3. Comprobación: `git show HEAD:reporte_mai.txt | cmp - docs/reportes/reporte_mai.txt`; esperar exit 0 y ausencia del original.
- [x] Revisar enlaces y comandos de `./README.md` y `docs/proyecto.md` para A1 y A2. Comprobación: `test -f docs/mcp.md && test -f docs/conectar-agentes.md && test -f docs/arquitectura.md && test -f package.json`; esperar exit 0 y verificar las demás rutas citadas.
Verificación del tramo: `./verify` (≈170 s), nivel 3; `git diff --check` y comprobaciones A1–A3 descritas arriba; exit 0.
Handoff: registrar archivos cambiados, comprobaciones y resultados en Evidencia; preservar contenidos y dejar el plan en listo si todo pasa.

## Evidencia
- Revisión independiente del principal: `./verify` → 74/74, `VERIFY OK`, salida 0; informes comparados con HEAD sin diferencias. Franco aprobó la evidencia.
- Verificación final: `$ ./verify` → `#11 ℹ tests 74; ℹ pass 74; ℹ fail 0; #17 Image verify_memory_171458-memory Built; LIMPIEZA OK; LECTURA OK; ESCRITURA OK; LIMPIEZA DE REGISTRO OK; VERIFY OK; MEM BIN PACKAGE OK`. `exit 0`.
- Verificación documental final: `$ git diff --check && test -f docs/mcp.md && test -f docs/conectar-agentes.md && test -f docs/arquitectura.md && test -f package.json && test -x ./verify && cmp <(git show HEAD:reporte_df.txt) docs/reportes/reporte_df.txt && cmp <(git show HEAD:reporte_mai.txt) docs/reportes/reporte_mai.txt && test ! -e reporte_df.txt && test ! -e reporte_mai.txt && rg -q 'memory_search.*memory_save.*memory_recent.*memory_forget' docs/proyecto.md && rg -q 'MCP stdio con cuatro herramientas' README.md && rg -q 'Migraciones: el esquema y las migraciones de versión están implementados' docs/proyecto.md && node -e 'const p=require("./package.json"); for (const k of ["build","test"]) if (!p.scripts?.[k]) process.exit(1); console.log("Rutas, reportes, afirmaciones y scripts: verificados")'` → `Rutas, reportes, afirmaciones y scripts: verificados`. `exit 0`.
- Verificación del tramo: `$ git diff --check && test -f docs/mcp.md && test -f docs/conectar-agentes.md && test -f docs/arquitectura.md && test -f package.json && test -x ./verify && git show HEAD:reporte_df.txt | cmp - docs/reportes/reporte_df.txt && git show HEAD:reporte_mai.txt | cmp - docs/reportes/reporte_mai.txt && test ! -e reporte_df.txt && test ! -e reporte_mai.txt && python3 <comprobación inline de enlaces locales> && rg -q 'memory_search.*memory_save.*memory_recent.*memory_forget' docs/proyecto.md && rg -q 'MCP stdio con cuatro herramientas' README.md && rg -q 'Migraciones: el esquema y las migraciones de versión están implementados' docs/proyecto.md && node <comprobación de binarios>` → `Enlaces locales: válidos`; `Rutas, contenido, enlaces y comandos verificados`. `exit 0`.
- A1 README: `$ test -f docs/mcp.md && test -f docs/conectar-agentes.md && test -f docs/arquitectura.md && rg -n 'memory_search|memory_save|memory_recent|memory_forget|stdio|HTTP' docs/mcp.md docs/arquitectura.md && ! rg -n 'MCP todavía no está implementado|Todavía no se incluye.*MCP' README.md` → guías presentes; cuatro herramientas y flujo stdio/HTTP descritos; afirmaciones obsoletas ausentes. `exit 0`.
- A3 informe MAI: `$ git show HEAD:reporte_mai.txt | cmp - docs/reportes/reporte_mai.txt` → contenido idéntico; `test ! -e reporte_mai.txt` → original ausente. `exit 0`.
- A3 informe DF: `$ git show HEAD:reporte_df.txt | cmp - docs/reportes/reporte_df.txt` → contenido idéntico; `test ! -e reporte_df.txt` → original ausente. `exit 0`.
- A2 proyecto: `$ test -f src/storage/schema.ts && rg -n 'version !== 0 && version !== 1 && version !== 2|ALTER TABLE memories ADD COLUMN|PRAGMA user_version=2' src/storage/schema.ts && rg -n 'memory_search|memory_save|memory_recent|memory_forget|memory-ai-mcp' docs/mcp.md src/mcp && ! rg -n 'Migraciones: pendiente documentar|Estado observado durante la migración' docs/proyecto.md && test -f docs/arquitectura.md && test -f docs/conectar-agentes.md` → migración, herramientas y guías corroboradas; contradicciones corregidas. `exit 0`.

## Notas
- Revisión de pausa resuelta por el principal: clasificación `tipo: codigo` y verificación completa `./verify` requerida. `./verify` pasó (74/74); comprobaciones documentales y `git diff --check` pasaron. Se conserva el traslado íntegro de los reportes dentro del alcance aprobado.

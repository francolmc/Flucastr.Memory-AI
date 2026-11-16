---
estado: listo
rama: fix/alinear-politica
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Alinear textos de política

## Objetivo
Alinear la terminología de las políticas de integración con la guía y restablecer la verificación existente.

## Exploración
La verificación inicial de arranque local terminó exit 1 en el empaquetado de `mem`. `scripts/verify-mem-bin.sh` compara exactamente el bloque de `docs/inicio-agentes.md` con `integrations/AGENTS.md.snippet` e `integrations/CLAUDE.md.snippet`. Ambos difieren: la guía dice «usuario» y los snippets un nombre propio. La comparación falla; falta confirmar que sea el único fallo de `./verify` ejecutándolo. Se omite evaluación separada porque el usuario ya definió la terminología y el contrato de igualdad es explícito.

## Evaluación
Actualizar los textos conservando la exigencia de igualdad y el significado de la política; no debilitar pruebas. No requiere dependencias.

## Supuestos
Ninguno.

## Decisiones ya tomadas
- Terminología del usuario: «usuario» y sin nombres propios en políticas.
- Ejecutor: constructor, porque el cambio modifica políticas y requiere comprobar su integración; contexto y pruebas accesibles, sin credenciales ni producción.

## Decisiones
Ninguna.

## Validación
Plan aprobado por el usuario el 16-11-2026.

## Alcance
`integrations/AGENTS.md.snippet`, `integrations/CLAUDE.md.snippet`; si `integrations/memory-policy.mjs` contiene el mismo texto con nombre propio, actualizarlo de forma equivalente para que la política entregada al agente coincida. No cambiar comportamiento, pruebas ni otros archivos.

## Verificación
`./verify` — aceptación desde cero; salida y código registrados.

## Condiciones de parada
Detenerse si la causa de fallo se repite dos veces o requiere salir del alcance. No leer credenciales ni modificar tests de aceptación.

## Pasos
### Tramo 1 — Historia: políticas coherentes
Como usuario quiero políticas con la misma terminología para que las integraciones y la verificación coincidan.
Dependencias: Docker operativo para `./verify`.
Contratos a conservar: confirmación explícita del usuario para reglas y scope general; bloque de la guía idéntico a ambos snippets; pruebas existentes intactas.
Rutas susceptibles de cambio: los tres archivos en Alcance, sin moverlos.
Ejemplo concreto: la línea compartida indica «confirmación explícita del usuario».
Alcance: los tres archivos de integración indicados.
Archivos: `integrations/AGENTS.md.snippet`, `integrations/CLAUDE.md.snippet`, `integrations/memory-policy.mjs`.
CUANDO se consultan las políticas ENTONCES usan «usuario» y mantienen la confirmación explícita (A1).
CUANDO se ejecuta `./verify` ENTONCES pasa el empaquetado y la verificación completa (A2).
Aceptación:
- A1: comparar ambos snippets con el bloque de la guía y revisar política generada; esperar igualdad y terminología coherente.
- A2: ejecutar `./verify`; esperar exit 0, sin modificar pruebas.
TODO:
- [x] Actualizar `integrations/AGENTS.md.snippet` para usar «usuario» (A1). Comprobación: comparar con bloque de la guía; esperar igualdad.
- [x] Actualizar `integrations/CLAUDE.md.snippet` para usar «usuario» (A1). Comprobación: comparar con bloque de la guía; esperar igualdad.
- [x] Revisar `integrations/memory-policy.mjs` y sustituir el nombre propio en la política si aparece (A1). Comprobación: búsqueda del nombre en políticas; esperar cero coincidencias.
- [x] Ejecutar `./verify` (≈10 min, duración no verificada) y registrar evidencia en `cambios/alinear-politica/plan.md` (A2). Comprobación: exit 0.
Verificación del tramo: `./verify` — nivel 3, exit 0; cubre A1 y A2.
Handoff: tras éxito, el usuario decide commit y merge hacia main antes de iniciar el plan de arranque local.

## Evidencia
- `integrations/AGENTS.md.snippet`: sustituido «Franco» por «usuario»; extracción del bloque de `docs/inicio-agentes.md` comparada con el snippet, igualdad confirmada.
- `integrations/CLAUDE.md.snippet`: sustituido «Franco» por «usuario»; extracción del bloque de `docs/inicio-agentes.md` comparada con el snippet, igualdad confirmada.
- `integrations/memory-policy.mjs`: sustituido «Franco» por «usuario»; búsqueda en los tres archivos del alcance sin coincidencias y comprobación de `renderMemoryPolicy` confirmó «confirmación explícita del usuario».
- `./verify`: exit 0; salida final incluyó `MEM BIN PACKAGE OK` y `VERIFY OK`.

## Notas
Tramo 1 listo: A1 comprobado por igualdad exacta de snippets y revisión de la política renderizada; A2 comprobado con `./verify` (exit 0).

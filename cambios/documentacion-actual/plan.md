---
estado: borrador
rama: docs/documentacion-actual
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Grupo D: documentación actual

## Objetivo
Actualizar README y documentación del proyecto y mover los informes fuera de la raíz.

## Exploración
`README.md` afirma erróneamente que MCP no está implementado; `docs/proyecto.md` ya reconoce MCP stdio, aunque contiene referencias de rutas y estado que deben revisarse tras C. `reporte_df.txt` y `reporte_mai.txt` están en la raíz; se propone moverlos a `archivo/` preservando contenido.

## Evaluación
Actualizar sobre la arquitectura resultante evita documentar una estructura provisional; conservar los informes en `archivo/` evita pérdida de contenido.

## Supuestos
Los informes son históricos; si no lo son, cambia el destino propuesto.

## Validación
Pendiente de Franco; historias detalladas después de integrar C.

## Alcance
`README.md`, `docs/proyecto.md` y traslado de los dos informes a `archivo/`, con actualización de referencias existentes si las hubiera.

## Verificación
`git diff --check` y comprobación de rutas y referencias documentadas.

## Evidencia
Pendiente.

## Notas
Depende de A, B y C. El traslado de archivos `.txt` requiere comprobar la clasificación `tipo: docs` al completar el plan.

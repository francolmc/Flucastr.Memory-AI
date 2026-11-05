# Preflight documental MCP Memory Service — task-10

**Resultado: bloqueado para solicitar ensayo; no es una demo ni acredita uso/integración.** Revisión documental acotada; sin instalaciones, ejecución de comandos/clientes/servicio ni prueba sintética. Tiempo activo aproximado: 18 min. No se consumió presupuesto operativo ni se usaron datos reales.

## Revisión y trazabilidad

- Candidato único: `doobidoo/mcp-memory-service`, release **v12.3.1**, publicado 2026-10-23; commit de release **8d0125d**. Evidencia de release: [GitHub releases](https://github.com/doobidoo/mcp-memory-service/releases) (consulta pública web, 2026-11-03; resultado identifica versión, fecha y commit). Las referencias de comparación son enlaces `main` y no fijan por sí mismas esta revisión: [README](https://github.com/doobidoo/mcp-memory-service/blob/main/README.md), [Remote MCP](https://github.com/doobidoo/mcp-memory-service/blob/main/docs/remote-mcp-setup.md), [configuración](https://github.com/doobidoo/mcp-memory-service/blob/main/docs/mastery/configuration-guide.md).
- Limitación de trazabilidad: en el tiempo disponible no se contrastó el contenido completo de cada archivo en el commit exacto `8d0125d` ni símbolos/contratos fuente para las capacidades de seguridad y ámbito. Por tanto los detalles siguientes son **propuestas y brechas**, no capacidades confirmadas de esa release. En particular, no se afirma que el resultado de releases verificara código/configuración.
- Clientes enlazados por comparación, fuentes oficiales: [Claude Code MCP](https://code.claude.com/docs/en/mcp), [Pi MCP](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/mcp.md). Contratos versionados y versiones instaladas no comprobados.
- Contexto local consultado: `package.json` declara Node `>=22.23.2 <23`, TypeScript como herramienta de desarrollo y no declara dependencia vectorial. `tsconfig.json` configura TS/NodeNext y `include` de `src/**/*.ts`, `test/**/*.ts`. Nada de ello acredita Python, servicio o clientes disponibles.

## Matriz de evidencia y brechas

| Requisito | Estado documental en este preflight | Brecha / prueba sintética posterior |
|---|---|---|
| Revisión reproducible | Parcial: tag/commit identificados por resultado de releases; fuentes enlazadas en comparación apuntan a `main`. | Verificar manualmente release/tag y cada archivo/símbolo en commit exacto antes de instalar. |
| Ámbito general + proyecto antes del ranking; general solo general | No acreditado por evidencia primaria revisada aquí. | Brecha esencial. Corpus Atlas/Birch/general y comprobar filtro previo al top-k con evidencia del filtro; ver aparte resultados, que no prueban orden de filtrado. |
| Exclusión Birch y filtro ≠ autorización | No acreditado. Tags no son autorización. | Prueba sintética negativa de aislamiento y revisión del mecanismo de autorización independiente. No deducir filtro de resultados. |
| OAuth persistente, cobertura MCP/REST/otras superficies, rechazo sin credencial, TLS validado | No acreditado en este preflight; enlaces de configuración/Remote MCP son pistas, no prueba revisada de cobertura completa. | Gate: inspeccionar control por superficie, persistencia/renovación OAuth, denegación anónima y verificación HTTPS; luego ensayo sin secretos documentados. |
| Sin purga/sustitución automática; desactivar automatismos | No acreditado por inspección de configuración/código. | Identificar opciones/tareas exactas en tag fijado y demostrar persistencia/ausencia de borrado en corpus sintético. |
| Idempotencia y límite 4000 bytes | Paridad no acreditada. | Brecha explícita; comparar contratos y probar sintéticamente si el ensayo se autoriza. |
| Persistencia e embeddings multilingües | Recomendación previa propone SQLite-vec en servidor y ONNX multilingüe integrado; esto es propuesta, no efectiva confirmada. | Confirmar backend/modelo, licencia de pesos (licencia del servicio no la sustituye), dimensiones y persistencia. Detectar y rechazar fallback hash/FTS5; compatibilidad/recursos quedan gate posterior. No proponer host ahora. |
| Claude Code: conexión, transporte, alcance, login y herramientas | Referencia oficial citada por comparación documenta comando HTTP/OAuth `claude mcp add --transport http --scope user memoria <HTTPS/mcp>` y `/mcp`; se rotula **inferido de fuente oficial, no ejecutado**. No se verificó versión mínima ni esquema de herramientas contra tag del servidor. | Confirmar cliente instalado y contratos/herramientas/ámbitos antes del ensayo; configuración local del ensayo y URL privada HTTPS con TLS válido. No implica interoperabilidad probada. |
| Pi: conexión, transporte, alcance, login y herramientas | Referencia upstream citada por comparación describe Streamable HTTP (no SSE), `pi mcp add memoria --url <HTTPS/mcp>`, configuración usuario `~/.pi/agent/mcp.json`, login OAuth y `/reload`; **inferido de fuente oficial, no ejecutado**. No se verificó versión mínima ni se inspeccionó la fuente en esta ronda. | Gate esencial: revisar docs oficiales/versionadas; comprobar MCP nativo y esquemas de herramientas/ámbitos. No inventar extensión ni actualizar cliente implícitamente. |

Los ejemplos anteriores contienen placeholders, no son comandos listos para operar. No ejecutar hasta autorización posterior y reemplazo por URL privada aprobada; ningún secreto debe quedar en documentación.

## Guion sintético posterior — no ejecutado

1. Servidor/DB persistentes autorizados y controles de ensayo aprobados. Insertar general: «Los reintentos de cobro requieren clave idempotente»; Atlas: «La cola de avisos conserva entregas fallidas para reintentar después»; Birch: decisión sintética contradictoria, marcada solo Birch. Registrar petición, permiso, ámbito y configuración persistente por cliente.
2. Claude Code guarda la decisión Atlas mediante herramienta; capturar nombre/esquema de llamada y respuesta, ID y ámbito real. Cerrar proceso y reiniciar servicio conservando base; capturar estado/configuración y persistencia. En sesión Pi nueva, buscar Atlas sin incluir respuesta esperada en prompt, recuperar/usar ID; capturar llamadas y resultados. Sin copiar resultado manualmente. Esto solo se hace tras comprobar compatibilidad.
3. Tres paráfrasis prefijadas de la pregunta sobre entregas perdidas; cada búsqueda declara entrada, ámbito, respuesta esperada dentro del top 5 y captura (consulta, parámetros, IDs/orden/score, modelo efectivo). Añadir caso vacío con captura de ausencia de respuesta relevante. No fabricar umbrales de similitud.
4. Negativos: consulta Atlas no debe incluir Birch; consulta solo general no debe incluir Atlas/Birch; petición sin credencial debe denegarse en cada superficie habilitada; capturar solicitud/ámbito, respuesta y evidencia del filtro **antes** del ranking. Que Birch no aparezca entre resultados no prueba por sí mismo filtrado previo.
5. Inspeccionar persistencia de configuración, OAuth/renovación y toda automatización/purga activa; capturar prueba sintética de ausencia de borrado/sustitución. Medir número de llamadas, permisos y fricción por operación. Idempotencia/4000 bytes quedan como casos de compatibilidad, no promesa.

Borrador de regla por cliente (no aplicado): consultar al iniciar trabajo y antes de decisiones relevantes; ofrecer guardar decisiones acordadas solicitando confirmación. El uso efectivo de estas instrucciones requiere ensayo y no se deriva de MCP.

## Veredicto y gates para pedir autorización agrupada

**Bloqueado documentalmente para pasar a ensayo** porque no quedó acreditado el contrato esencial de ámbitos pre-ranking y auth de todas las superficies en la revisión exacta, ni el MCP nativo de la versión disponible de Pi ni la correspondencia de herramientas. No concluir que el producto carece de estas capacidades: no verificadas aquí. Una nueva ronda correctiva está fuera del encargo.

Antes de cualquier ensayo, solicitar una autorización agrupada para: (1) host temporal y recursos; (2) operador/custodio; (3) instalar servicio y modelo, tras confirmar licencia de pesos, persistencia, backend y ausencia de fallback hash/FTS5; (4) red privada, TLS válido y auth; (5) acceso/versiones de Claude Code y Pi, con contratos y configuración local. Gasto/API pagada no autorizados; sin datos reales. Si hace falta fork amplio, parar. El presupuesto de piloto indicado en la comparación es propuesta, no saldo concedido.

## Fuentes locales indicadas por Contexto contrastadas

`definitions/COMPARACION-MEMORIA-MVP.md`: «Recomendación única», «Setup y uso», «Demo mínima, secuencia y parada», «Fuentes primarias (consulta 2026-11-03)»; `definitions/PROJECT.md`: «Restricciones», «Decisiones»; `definitions/BACKLOG.md`: «Organización vigente y dependencias»; `definitions/REVISION-MVP.md`: «Camino mínimo único y recorrido humano». No se ejecutaron comandos operativos; no se hizo ensayo ni demo. No se modificó ningún otro archivo.

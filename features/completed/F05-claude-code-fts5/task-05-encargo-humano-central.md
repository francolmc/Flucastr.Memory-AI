# task-05 — Preparar encargo humano A condicionado, sin provisionar
repo: Flucastr.Memory-AI   depende_de: —   estado: cancelada

## Descripción
Consolidar gates y autorización agrupada de central privada. No prometer comandos Windows/WSL sin plataforma acreditada. Esta entrega es un encargo documental ejecutable por fases con parada, no una provisión.

## Contexto
Leer acceso.md completo, refinado.md y src/http-server.ts startLocalServer, src/http-auth.ts CredentialState/createHttpAuthenticator. Tocar solo features/F05-claude-code-fts5/provision-humana.md (nuevo). No existe lanzador CLI del servidor acreditado.
- Tocar: `features/F05-claude-code-fts5/provision-humana.md`
- Fuente: definitions/PROJECT.md «Dirección central actualizada — confirmación y presupuesto aprobados para planificar»
- Referencia: definitions/ARCHITECTURE.md «Primera versión Tailscale y camino finito a uso útil — borrador de fidelidad»

## Decisiones ya tomadas
Leer `features/F05-claude-code-fts5/refinado.md` §§Continuación autorizada para planificar — decisiones 1=A y 2=A e Inspección de continuación — evidencia y límite. Decisiones confirmadas, no supuestos: F03 en 127.0.0.1, reenvío restringido condicionado y CA privada humana; HTTPS validado/auth F03, central única y sin DB cliente. Si inviable, parar y consultar. Sin certificados públicos, CT inferido, Funnel, TLS inseguro ni alternativa automática. Atlas/Birch e identidad compartida permanecen; acciones protegidas cerradas por HTTP.
Cada A/B conserva una ronda, un lote acotado y una reverificación globales; subdividir tareas no amplía topes. R requiere presupuesto y permisos propios. Documentación no es evidencia funcional. Esta tarea es borrador: el encargo actual solo autoriza planificar.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Constructor redacta; Franco decide/administra/custodia. Fuera de alcance: instalaciones, inspección remota, reglas firewall, certificados/credenciales, lanzamiento real, ensayos y elección inferida de nombre/puertos/herramienta de reenvío.

## Pasos
1. En provision-humana.md separar autorización de inspección humana de autorización de cambios: host/versión WSL/modo de red/runtime/recursos, plan/elegibilidad/gasto y ejecutor por acción; ausencia implica gate pendiente.
2. Definir viabilidad como demostración autorizada de ruta Windows privada→loopback WSL 127.0.0.1 con TLS F03 intacto, arranque/reinicio y rechazo fuera del origen privado autorizado. Exigir mecanismo y comandos literales revisados tras evidencia de plataforma, más rollback/retiro de reglas; no escribir receta ficticia ni cambiar escucha ante fallo.
3. Añadir gate lanzador: constructor debe proponer en encargo posterior arranque F03, DB exclusivamente central, carga humana TLS/auth y persistencia de configuración/estado de credenciales. Hasta existir lanzador verificado, bloquear operación; no presentar startLocalServer como comando desplegable.
4. Fijar CA privada humana: custodia de clave fuera del agente, nombre/SAN elegido por Franco y comprobado, transporte explícito CA pública a Mac y fingerprint por canal humano, confianza por --ca del cliente; renovación antes de expiración con nueva validación positiva/negativa y rollback humano. Ninguna clave en ficha.
5. Fijar matriz futura A: Mac LAN/exterior privados, TLS inválido/auth ausente e inválida, ámbitos/referencias/acciones protegidas sin mutación, persistencia tras reinicio y recuperación sintética; regresiones F02/F03 separadas. Registrar permiso, ejecutor, evidencia, brecha y contador compartido por fila.

## Criterios de aceptación
1. Revisión manual confirma gates de inspección, viabilidad, lanzador, permisos y prueba separados.
2. Inviabilidad bloquea y consulta, nunca escucha ampliada automática.
3. Confianza y renovación CA privada y autenticación F03 son obligatorias.
4. Cada acción tiene responsable/permiso y ningún comando operativo supuesto se presenta validado.
5. Salida documental no habilita central ni consume ronda técnica por inferencia.

## Verificación
Revisión manual cruzada con acceso.md y refinado.md. `npm run verify` futuro no ejecutado, inferido de package.json, esperado 0 pero insuficiente para gate privado. No ejecutar comandos Windows/red/certificados: no autorizados ni acreditados; comandos literales operativos solo en posterior encargo aprobado tras evidencia de plataforma.

## Evidencia
(lo llena el constructor; evidencia sanitizada, permisos y comandos no ejecutados separados)

## Notas

Cancelada: motivo=otra — Cierre por decisión explícita de Franco; entrega incompleta y evidencia conservada.
(lo llena el constructor; resultado, brecha mínima y siguiente gate, sin secretos)

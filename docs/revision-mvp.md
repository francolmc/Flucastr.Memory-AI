# Revisión de cobertura del MVP

Esta auditoría conserva el estado anterior a S2–S4. Para el estado vigente, ver `docs/proyecto.md`; la evidencia aprobada de S4 está en `cambios/hechos/servicio-backup/plan.md`. La instalación del host y el recorrido distribuido siguen pendientes.

## Dictamen
Los cuatro planes pendientes cubren las piezas principales del MVP documentado, pero **todavía no garantizan el recorrido completo**. Son borradores de migración, no traspasos listos para ejecutar: faltan contratos de unión entre transporte, cliente, operación e integraciones.

Esta revisión es de alcance y código, no una nueva aceptación funcional ni una aprobación de los planes. No se ejecutó otra vez la suite ni `./verify`; la evidencia existente es la aceptación independiente de verify (43/43 y recorrido HTTP/SQLite). La carpeta está en `main`, limpia y alineada con el seguimiento local `origin/main` al iniciar esta revisión. El commit de verify ya está integrado por el PR #10.

## MVP que se está contrastando
Según `docs/proyecto.md` y las definiciones históricas PROJECT/ARCHITECTURE:
1. Un único servidor Windows+WSL conserva SQLite; Mac y WSL son clientes sin DB ni fallback local.
2. Desde Claude Code en Mac se guarda una decisión de un proyecto.
3. Al iniciar Pi en WSL dentro del mismo proyecto, esa decisión llega al contexto del agente sin copiar/pegar.
4. El transporte externo es HTTPS privado mediante Tailscale Serve; internamente, HTTP loopback con Bearer.
5. Hay save/search/recent/forget, aislamiento por scope y búsqueda con general, idempotencia y errores definidos.
6. Servicio disponible y backup SQLite nocturno real con siete copias exitosas; instalación y prueba entre máquinas corresponden a Franco.

No se deduce de este contrato que toda conversación deba guardarse automáticamente.

## Matriz de cobertura
| Criterio | Implementación observada | Plan responsable y validación que falta |
|---|---|---|
| Persistencia y búsqueda | SQLite real, FTS persistente, OR/BM25 y transacciones en `src/memory.ts`; pruebas de durabilidad existentes | S2 conserva estos avances; verificar después de cambios, no rehacer por defecto |
| API de cuatro operaciones | HTTP save/search; faltan recent/forget; errores del store pasan a 403 | `cambios/servidor-central/plan.md`: contrato completo, códigos y borrado atómico |
| Respuestas y topes | `src/response.ts` limita search a 5/4000 pero serializa metadatos internos | S2 devuelve seis campos; S3 debe consumirlos sin exigir metadatos y sin imponer topes de search a recent |
| Cliente Mac/WSL sin DB | `src/remote-cli.ts` parcial; sin bin; CLI local importa almacenamiento | `cambios/cliente-mem/plan.md`: bin real, configuración, cuatro comandos y separación de imports |
| HTTPS hasta Tailscale | `src/http-client.ts` acepta solo HTTP | S3 debe añadir HTTPS real y pruebas de certificado/transporte; S4 publica el servicio privado |
| Mismo proyecto en ambas máquinas | Scope previsto por nombre de raíz Git | S3/S5 deben usar exactamente la misma regla y probar dos clones en rutas distintas; nombres de carpeta distintos requieren scope explícito |
| Guardar desde Claude | Cliente futuro y bloques de instrucciones previstos; no hay integración actual | S3/S5 necesitan procedimiento concreto para ejecutar save desde la sesión y confirmación observable |
| Recuperar en el contexto de Pi | No hay integración actual | `cambios/hechos/inicio-agentes/plan.md`: no basta imprimir en terminal; demostrar que el agente recibe y puede usar la memoria |
| Inicio sin servidor | HTTP cliente actual espera hasta 15 s | S5 necesita plazo de inicio explícito, silencio y salida no bloqueante en Claude/Pi |
| Operación y backup | Sin unidades/scripts operativos al momento de esta auditoría | `cambios/hechos/servicio-backup/plan.md`: entrega de software verificada y aprobada; instalación y comprobación del host pendientes |
| Aceptación distribuida | Verify demuestra loopback, no Mac/WSL/Tailscale ni hooks reales | S5 debe entregar comprobación manual completa y registro de resultados de Franco |

## Huecos que hay que cerrar al concretar los planes

### 1. Compatibilidad del transporte entre S2 y S3
`src/http-client.ts` rechaza HTTPS y su validador de search exige archived/conflict/replacesId. S2 eliminará esos metadatos de la salida. Si solo se modifica servidor/serialización, el cliente remoto existente dejará de funcionar.

Al concretar S2: incluir en su alcance los ajustes mínimos y pruebas del consumidor existente necesarios para aceptar el contrato de seis campos, sin adelantar el bin de S3. Al concretar S3: admitir HTTPS, no enviar tokens a redirecciones y separar límites de search/recent. El límite actual de 4000 bytes para cualquier respuesta no sirve para recent.

### 2. Guardado desde el agente: decisión de producto pendiente
Los planes dicen cómo recuperar al inicio, pero no fijan con suficiente precisión cómo decide Claude guardar una decisión. La CLI permite hacerlo; eso por sí solo no demuestra integración de uso.

Cerrar con Franco antes de aprobar S5:
- Guardado explícito: Franco pide al agente guardar y este ejecuta mem save; recuperación automática al iniciar (opción mínima compatible con el contrato actual).
- Captura automática: el agente decide qué guardar sin pedido explícito; requiere definir disparadores, contenido y controles, y ampliar el alcance. No está autorizada por los borradores actuales.

### 3. Identidad del proyecto y origen
La regla histórica usa el nombre de la carpeta raíz Git, no una identidad global del repositorio. Dos clones con nombres diferentes no compartirán scope por defecto; dos repos distintos con el mismo nombre pueden compartirlo. No sustituir esta regla silenciosamente: documentar la limitación y probar el scope explícito. Si Franco quiere identidad independiente del nombre, hace falta decisión de producto.

S3 debe fijar el origen automático y S5 cómo informa el agente/herramienta de procedencia; no dejar al constructor inventar valores incompatibles con el uso esperado.

### 4. Integración de inicio realmente útil y acotada
S5 necesita elegir mecanismos soportados tras consultar documentación vigente de Claude y Pi. La aceptación debe comprobar inyección en contexto, no solo salida de un script. Acordar el plazo máximo de inicio y probar sin datos, servidor caído y respuesta lenta. No confundir el límite de búsqueda con un eventual presupuesto de contexto de recent; cualquier truncado adicional requiere decisión explícita.

### 5. Camino operativo y verificación
El Dockerfile/Compose actual sirve para aceptación aislada y elimina la DB al terminar. S4 propone systemd y SQLite persistente del host. Precisar instalación/versionado del mismo artefacto compilado, ruta de datos, usuario y acceso del backup; no presentar el contenedor efímero como despliegue terminado.

S4 debe dejar instrucciones verificables para reinicio del servicio, continuidad WSL y acceso Tailscale, ejecutadas por Franco. S5 registra la prueba Mac→WSL real. No es necesario añadir web, correo, otra DB o MCP.

### 6. Cierre del recorrido de verificación
Extender verify gradualmente: S2 cuatro endpoints y errores; S3 bin instalado con servidor real; S4 backup; S5 integraciones. Tras implementar forget, actualizar la política de datos de prueba remotos y comprobar limpieza explícita cuando corresponda, sin prometer borrado si una prueba se interrumpe.

## Desactualizaciones documentales detectadas
- S2 cita `cambios/verify/plan.md` y dice que verify no existe; la evidencia está ahora en `cambios/hechos/verify/plan.md`.
- Los otros borradores también hablan de auxiliares de verify futuros, aunque ya existen.
- `docs/proyecto.md` aún dice que verify espera commit/PR, ya integrados por el PR #10.
- El README describe runtime y arquitectura antiguos; su actualización está prevista en S5, no es evidencia del estado actual.

No se corrigieron estos archivos durante la auditoría para no mezclar revisión con concreción/aprobación de otro cambio.

## Criterio de aceptación final propuesto
Un registro de prueba con id conocido se guarda desde una sesión real de Claude Code Mac mediante el cliente instalado. Se cierra esa sesión y se inicia Pi WSL en el mismo scope; Pi recibe la decisión en su contexto y la recupera sin copia manual. Se comprueba también que otro proyecto no la recibe, que caída del servidor no bloquea inicio ni crea DB cliente, que recent/forget funcionan y que existe evidencia de backup y operación del host. Franco registra comandos, resultados y versiones sin incluir tokens ni contenido sensible.

## Recomendación
Mantener los cuatro planes, sin agregar features ni dividirlos todavía. Primero confirmar la modalidad de guardado. Después concretar S2 con compatibilidad del consumidor y aceptación exacta; posteriormente S3, S4 y S5 con los contratos de unión anteriores. Los planes permanecen en borrador y esta revisión no autoriza implementación.

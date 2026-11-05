# F03 — decisiones de refinado
Estado del artefacto: borrador para revisión de fidelidad; respuestas de Franco aprobadas explícitamente, no aprobación de tareas.

## 1. Identidad y entorno
Una key compartida representa una identidad y configuración uniforme. Solo pruebas HTTP locales sintéticas en loopback, con TLS verificable. Proyectos autorizados Atlas/Birch. No exposición pública, despliegue, MCP ni clientes reales. No se acredita separación frente al shell.

## 2. Operaciones
Buscar con composición F02; guardar cuatro tipos en proyectos autorizados y tres tipos distintos de rule en general; marcar conflictos; sustituir solo dentro del mismo proyecto autorizado. Validar ámbitos y referencias antes de datos/mutaciones. No agregar listar ni consulta individual HTTP: el contrato aprobado enumera buscar. Reglas generales, sustitución general, archivo, resolución, credenciales, restauración y saneamiento cerrados HTTP, sin tickets ni booleanos de autoaprobación.

## 3. Administración y claves
Administración humana manual separada con pausa de escrituras. El entorno actual no acredita aislamiento: únicamente ensayos sintéticos. Rotación cada 30 días, gracia máxima 24 h y revocación inmediata sin gracia por compromiso, sin endpoints administrativos.

## 4. Recuperación
Copias diarias, RPO 24 h ante pérdida de disco, RTO objetivo 4 h, retención 7 diarias y 4 semanales. Ensayos efímeros con destino temporal; sin prometer independencia física ni RTO real. Antes de uso real faltan destino independiente, cifrado y custodia. Verificar conservación de confirmaciones ante caída del proceso.

## 5. Saneamiento y precedencia documental
Procedimiento manual autorizado sin revelar secretos y con revisión de copias afectadas. ARCHITECTURE.md §Decisiones (Política F03 y Rotación, durabilidad y recuperación F03) y §Seguridad contienen las decisiones explícitas. STATUS.md conserva solicitudes de aprobación antiguas; PROJECT.md conserva el procedimiento de saneamiento como propuesta: no invalidan el encargo explícito ni autorizan operación real. No hay nuevas decisiones de producto supuestas.

## Concreciones técnicas de planificación — inferidas, no aprobación adicional
Usar APIs estándar Node, HTTPS en 127.0.0.1, Bearer, reloj inyectable, credenciales sintéticas fuera de respuestas/logs, autorización en fachada del núcleo sin cambiar la CLI confiable. Solo cuatro rutas POST: /v1/search, /v1/memories, /v1/conflicts, /v1/replacements. Los contratos detallados se revisan como tareas en puerta 3. No se elige hosting ni infraestructura real.

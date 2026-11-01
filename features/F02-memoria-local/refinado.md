# F02 — respuestas de Franco
Estado: borrador (registro de decisiones ya aprobadas; no solicita reaprobarlas).

## 1. Gate
MVP sintético sin datos reales ni rutas autorizadas. Constructor crea 30 recuerdos verosímiles de decisiones, aprendizajes, bloqueos resueltos y reglas, general y >=2 proyectos ficticios. Versionados aparte de lógica y reemplazables. Fijar 10 consultas y esperado top5 antes de búsqueda. Baseline concatenación del mismo corpus. Informe exclusivamente de prueba, sin ahorro real.
## 2. Ámbitos y acceso
Proyecto busca proyecto+general; general solo general; nunca otro proyecto. CLI local única identidad confiable; reglas generales requieren confirmación explícita. Auth API fuera.
## 3. Bytes
4000 bytes UTF-8 de respuesta serializada completa más salto final. Hasta cinco recuerdos, omitir enteros, sin truncar. Comparar baseline sin umbral porcentual adicional.
## 4. Identidad
ID estable del emisor; reintento idéntico idempotente; mismo ID distinto contenido rechazado. Sustitución nuevo ID referencia anterior. Sin deduplicación automática de texto.
## 5. Contradicciones y retención
Señalar contradicciones hasta resolución humana Franco; sin caducidad/purga automática; archivados fuera de búsqueda normal. No inferir verdad por fecha ni exigir detección semántica automática.

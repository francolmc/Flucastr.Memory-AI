# task-02 — Adquisición controlada y ensayo aislado de factibilidad CPU
repo: Flucastr.Memory-AI   depende_de: task-01   estado: borrador

## Descripción
Solo tras permisos operativos explícitos, comprobar si el conjunto documentado puede adquirirse, cargarse y producir embeddings CPU con sqlite-vec en el host local. Es un ensayo habilitante, no implementación híbrida ni certificación del servidor. Conservar el producto FTS5 intacto y volver con evidencia a puerta 3.

## Contexto
Leer solo Notas de task-01; consumir sus entregables nuevos `features/F04-busqueda-hibrida/suministro.json` y `suministro.md`. Leer `features/F04-busqueda-hibrida/refinado.md` y `definitions/ARCHITECTURE.md` §Observaciones — evaluación documental F04: consolidación, instalación controlada, política de textos largos y gate descriptivo.
Base: `src/memory.ts:76–96,128–162` (SQLite/FTS5); `test/f02-gate.test.ts` (fixtures congelados) y `test/f03-gate.test.ts` (regresiones). `package.json` define los gates; `README.md` limita F03 a loopback sintético.
Crear solo tres entregables nuevos en esta carpeta: `factibilidad.mjs`, `factibilidad-lock.json` (lock npm del staging, no sustituye al raíz) e `informe-factibilidad.md`. Staging temporal fuera del repo, con modelos/paquetes/DB sintéticos, rutas registradas sin secretos. El script nuevo contendrá ensayo e instrucciones reproducibles del staging, sin descarga automática al importarlo. Documentar su CLI después de construirla. Comandos npm de regresión leídos, **no ejecutados por prohibición expresa**; compatibilidad inferida, no probada.

## Decisiones ya tomadas
Rige `features/F04-busqueda-hibrida/refinado.md`. Node 22.23.2, sqlite-vec 0.1.6, Transformers.js 3.7.2/ORT 1.21.0, FP32 del autor; sin sustitución de modelo/binding ni conversiones propias. Una sesión CPU, batch/concurrencia 1, hasta dos hilos si API validada; caché local y egress bloqueado durante ensayos. Aprobar la redacción o completar task-01 NO autoriza acciones operativas.

## Alcance / Fuera de alcance
Dentro: adquisición/verificación, staging reproducible y prueba de primitivas bajo permisos separados; regresiones del producto intacto. Fuera: índice persistente de producto, migraciones, endpoints, RRF/híbrido, implementación del fallback en producto, gate F04 completo, despliegue/contratación, clientes o datos reales, Mac, CUDA, compilaciones implícitas y cambios al package/lock raíz o fixtures. El resultado no marca F04 hecha.

## Pasos
1. En `informe-factibilidad.md`, registrar aprobación explícita y límites de cada fase antes de hacerla: **A** descargar solo URLs/artefactos del manifiesto y verificar/extraer sin ejecutar; **B** instalar en staging sin lifecycle scripts/builds; **C** ejecutar ensayo CPU y regresiones F02/F03 en loopback. Si cualquiera no está autorizada, detenerse antes de esa acción, registrar «no ejecutada por falta de permiso» y entregar lo documental. Dependencias satisfechas no reemplazan estos permisos. Si task-01 exige inspección de tarballs para cerrar suministro, solicitar únicamente A para esa lista mínima; inspeccionar sin imports y volver a revisión antes de B/C.
2. Antes de adquisición o pruebas, inventariar host sin credenciales: OS, arquitectura/ISA, glibc, memoria/CPU/disco disponible, límites de proceso y posibilidad de aislamiento de red. Comparar con Linux x64 glibc >=2.28, 2 vCPU/4 GiB/10 GiB libres propuestos. Si host incompatible, recursos insuficientes o aislamiento no acreditable, no iniciar inferencia; conservar FTS5. No contratar ni certificar por estimación.
3. Con A autorizado y manifiesto apto, adquirir exclusivamente artefactos listados. Verificar SRI/SHA-256, Git-blob de textos y firma de checksum Node contra claves públicas oficiales confiables; calcular SHA-256 locales. Inspeccionar archivo antes de extracción segura (rechazar escapes/enlaces peligrosos), licencias/avisos, ELF y ONNX/datos externos sin ejecutar binarios adquiridos. Si se necesita herramienta adicional no inventariada, detenerse y solicitar su acceso mínimo, sin instalarla automáticamente. Discrepancia o archivo externo no listado: abortar antes de B/C y documentar evidencia.
4. Con cierre de contenido revisado y B autorizado, materializar staging/lock exacto con integridades y scripts deshabilitados; no permitir resolución nueva de rangos ni paquetes de plataforma ajena. Usar `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` como defensa adicional; no ejecutar postinstall, rebuild ni autodetección de libvips global. Conservar avisos y registrar bytes de adquisición/disco. Extraer el lock revisable a `factibilidad-lock.json`. Si los precompilados CPU no bastan sin scripts, detenerse sin habilitarlos.
5. Con C autorizado, implementar y correr `factibilidad.mjs` sin red y solo sobre staging: imports exactos, carga ORT CPU/FP32 y tokenizador local con remotos desactivados; inspeccionar entradas/salidas/opset y acreditar receta query/passage, media enmascarada y L2 una sola vez, vector finito 384. Repetir consultas españolas sintéticas en frío/caliente. Ensayar conteo sin truncamiento con prefijos/especiales en límites 511/512/513 y texto muy largo; garantizar en el ensayo preservación de texto y selección FTS5 completa ante exceso, sin pretender haber integrado fallback. Si loader no soporta el layout del autor, solo permitir mapeo local documentado de nombres sin modificar pesos; si requiere conversión u otro runtime, detenerse.
6. En DB temporal separada, cargar extensión local verificada con Node exacto, comprobar versión y distancia conocida de vectores 384, deshabilitar carga después y comprobar rechazo de cargas posteriores. Separadamente verificar que `openMemory` actual abre/busca sin extensión/modelo. Medir tiempos fríos/calientes, RSS pico del proceso y descendientes, memoria disponible y disco; registrar repetición/cantidad y límites de medición. Ante OOM, fallos nativos o presión incompatible, detener ensayo y dictaminar no factible en ese host, sin swapping inducido ni ampliar recursos automáticamente.
7. Con C aún válido, ejecutar gates existentes sin tocar benchmark; registrar resultados y hashes de fixtures antes/después. Informar matriz observado/no ejecutado/falló y reproducción en `informe-factibilidad.md`; retirar solo staging propio autorizado. Dictaminar apto/no apto para **planificar integración**. Diferir índice/versionado, autorización previa, RRF, fallback y comparación descriptiva completa.

## Criterios de aceptación
1. Informe prueba permisos por fase y host/recursos, o parada antes del primer acceso no autorizado; revisión de evidencias, sin permisos implícitos.
2. Inventario adquirido coincide criptográficamente y lock reproduce el staging sin scripts/descargas extra; ante imposibilidad, fallo explícito antes de uso.
3. Ensayo reproducible acredita CPU offline, receta/vector/tokenización y sqlite-vec con Node exacto, o informa fallo concreto sin cambiar candidatos.
4. Gates F02/F03 y fixtures permanecen intactos; resultados reales o ausencia por permiso quedan diferenciados, sin atribuir éxito híbrido al producto actual.
5. Informe de recursos y dictamen delimita siguientes tareas; ningún cambio a producto, estados, infraestructura ni datos reales.

## Verificación
Solo con C autorizado, desde raíz: `npm run gate:f02` y `npm run gate:f03`; se esperan códigos 0 y suites locales sintéticas completas, sin alterar fixtures. Comandos leídos, no ejecutados en planificación. Documentar invocación exacta del ensayo/staging, versiones, lock, aislamiento y salidas. Sin C, la verificación es revisión documental de permisos/parada, no un pase de compatibilidad. Inspección final: `git status --short`, para separar entregables de cambios preexistentes de definitions.

## Evidencia
Lo llena el constructor: permisos, fases ejecutadas, comandos exactos, hashes, resultados y métricas o parada verificable. Sin contenidos privados ni credenciales.

## Notas
Lo llena el constructor: dictamen de factibilidad y restricciones para volver a puerta 3. No aprobar integración ni dar F04 por terminada.

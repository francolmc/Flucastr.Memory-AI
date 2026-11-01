# Flucastr.Memory-AI

## HTTPS local sintético (F03)

Las pruebas TLS requieren OpenSSL disponible en `PATH`; generan una CA y un certificado de loopback firmados, claves exclusivamente temporales y limpian el directorio al finalizar.

El adaptador programático `startLocalServer({ store, auth, tls, port })` escucha exclusivamente en `127.0.0.1` por HTTPS; `port: 0` selecciona puerto efímero. `tls` requiere certificado y clave sintéticos válidos. No hay fallback HTTP, CORS, proxy confiable, ejecución CLI ni endpoints administrativos. El propietario conserva y cierra `store`; `close()` cierra el listener y las conexiones.

Solo admite POST JSON de contrato cerrado en `/v1/search`, `/v1/memories`, `/v1/replacements` y `/v1/conflicts`, con autenticación Bearer anterior a la lectura de datos. La instalación es únicamente para ensayos sintéticos Atlas/Birch: no usar datos reales, exponer la interfaz ni interpretar la key compartida como identidad humana o autorización administrativa.

## F02 reproducible synthetic gate

Run `npm run gate:f02` for the standalone F02 gate, `npm run gate:f03` for the standalone F03 gate, or `npm run verify` for the complete local checks and both gates. Node.js 22.23.2 and npm dependencies are prerequisites. F03 gate compiles and runs the HTTP/authentication, authorization, TLS, durability/crash, backup and recovery suites; any missing suite or failed assertion exits non-zero. All F03 runs use synthetic Atlas/Birch data and loopback/temporary destinations only. A passing test process does not prove power-loss or disk-failure behavior; temporary backups are not physically independent; the four-hour RTO is an objective, not demonstrated; separate human administration does not demonstrate shell isolation. Real/private remote networking, encryption and key custody, an independent backup destination, and operational authorization remain pending. Passing the gate does not authorize real data, clients, exposure, deployment, or agent administration.


The corpus, query set, expected IDs, and scopes are frozen for this benchmark version; replace fixture data only as a separately reviewed benchmark change, not to tune results. A large independent synthetic record tests whole-record omission at the output limit without modifying frozen queries.

| Environment | Gate result |
|---|---|
| Linux | Recorded by current execution in `features/F02-memoria-local/task-07-gate.md` Evidence |
| macOS | Not executed in this task |

## Recuperación y saneamiento manual (F03 sintético)

**Ensayo solamente:** usar exclusivamente datos sintéticos efímeros, una base/copias dentro de un directorio temporal y procesos de prueba propios. No usar bases, copias, credenciales ni servicios reales. El script/API de restauración no es administración humana ni acredita separación respecto del shell actual.

### Copia y restauración

1. Una persona autorizada por un procedimiento separado pausa escrituras, detiene el servidor/agentes de prueba y cierra todas las conexiones SQLite. No ejecutar la restauración con escrituras concurrentes.
2. Crear una copia diaria con `createSyntheticBackup` hacia un destino temporal. El resultado sintético no es independiente del disco y no acredita una copia segura real. Revisar `syntheticBackupStatus`; no rotar ni borrar archivos fuera del manifiesto.
3. Revisar el snapshot elegido y restaurar solo a una ruta nueva y vacía mediante `restoreSyntheticBackup({ destination, backupName, target })`. Rechaza entradas no publicadas, corrupción o destino ya existente; no sobrescribe la fuente ni destinos existentes. Reabrir el destino con `openMemory`, comparar conteos/estados y verificar una búsqueda conocida antes de reanudar.
4. Revisión humana de evidencia y autorización separada antes de reanudar escrituras. Retirar el entorno temporal de ensayo al concluir. No publicar logs ni contenidos sensibles.

Calendario objetivo aprobado: copias diarias, retención de 7 diarias y 4 semanales; la retención actual solo gestiona entradas del manifiesto. RPO máximo 24 h ante pérdida de disco y RTO objetivo 4 h son objetivos documentados, no resultados ni garantías del ensayo. Destino real independiente, cifrado, custodia/recuperación de claves y aislamiento confiable permanecen pendientes. El tiempo local medido por la prueba no valida RTO real.

### Saneamiento autorizado (runbook, no purga automática)

1. Detener agentes/servidor y pausar escrituras; asegurar cierre de DB. La autorización humana debe proceder de cuenta/instalación/contexto separado del agente y su shell. El entorno actual no puede demostrar esa separación.
2. Si aplica, rotar/revocar credenciales afectadas: rotación cada 30 días con gracia máxima 24 h; ante compromiso, revocación inmediata sin gracia. No incluir valores de credenciales en comandos, evidencia o logs.
3. Inventariar por identificadores únicamente las superficies potencialmente afectadas: base SQLite, índices FTS, journals/WAL, copias diarias/semanales, exportaciones y logs. No copiar ni imprimir el marcador o ningún valor sensible. Determinar con revisión autorizada qué copias retirar; no presentar copias afectadas como recuperación limpia.
4. Reconstruir en destino nuevo solo datos sintéticos limpios y regenerar FTS; validar integridad, búsqueda/restauración y ausencia del registro sintético afectado sin revelar el marcador. Retirar copias identificadas únicamente tras autorización humana; registrar el resultado sin valores.
5. Revisar y autorizar reanudación por separado. Esto no garantiza borrado físico/forense de medios, journaling, snapshots o copias externas. No hay endpoint HTTP, booleano de autoaprobación ni herramienta automática de purga.

Duración descriptiva de los tests solo cuantifica una ejecución local sintética; no se interpreta como RTO.

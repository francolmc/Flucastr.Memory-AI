# F05 — decisiones recibidas

Documento de decisiones; estado: borrador para revisión de fidelidad.

## Dirección y aprobación
Confirmado por Franco: fidelidad de definición Tailscale y camino finito a uso útil Flucastr.AI. La organización anterior tuvo aprobación condicionada a abordabilidad, no ejecución. Revisar agrupación y aprobar tareas individualmente; no reaprobar dirección. Dependencias F02/F03 → A central → B Claude Code Mac → ficha R → primer uso real autorizado. Sustituye alcance local y presupuesto compartido anteriores.

## Candidato y responsabilidades
Windows 11/Ubuntu WSL, 16 GiB, 24/7 y más de 10 GB reservables son declaraciones. Franco administra, custodia y opera Mac. No están acreditados instalación, recursos efectivos, trayecto Windows→WSL, acceso del constructor ni aislamiento administrativo. Tailscale gestionado aprobado; Windows recomendado, no doble instalación por defecto. Cuenta/plan/elegibilidad, enrolamiento, instalación, red, TLS y credenciales requieren autorización explícita y evidencia sanitizada; nunca pedir secretos. Certificados públicos requieren consentimiento específico por transparencia de nombres.

## Paquetes y abordabilidad
Cada paquete A/B: una ronda, un único lote acotado y una reverificación, no presupuesto compartido. Los dos borradores se acotan ahora a fichas documentales construibles sin Mac ni permisos privilegiados. Sus criterios no exigen operaciones futuras: una brecha explícita permite cerrar documentación, nunca acreditar habilitación. Provisión humana y pruebas son etapas posteriores con gates y tareas operativas propias aprobadas antes de ejecución. No hay tareas nuevas en esta corrección ni permisos implícitos.

## Contratos y parada
CLI delgada → HTTPS validado/auth F03 → única SQLite/FTS5 central; no DB cliente. Mantener seis campos F02, identidad/idempotencia, ámbitos/referencias, vacío/archivados/conflictos humanos, cinco recuerdos/4000 bytes UTF-8 completos con salto final. Atlas/Birch, identidad compartida y operaciones protegidas cerradas por HTTP no cambian. Sin extracción, hooks, MCP, modelos/semántica, F04 ni otros clientes. Parar operación por permiso/acceso/control faltante, tope/gasto agotado, nuevo host/dependencia/transporte o cambio amplio; entregar brecha sanitizada, no sortearla instalando o cambiando seguridad.

## R y uso real
R queda fuera de A/B y no aprobado: una ficha agrupada al cierre, con aislamiento efectivo/pausa de escrituras, copia independiente cifrada/custodia recuperable, rotación/revocación/restauración/RPO 24 h/RTO objetivo 4 h/retención, saneamiento y ámbitos/datos mínimos Flucastr.AI. Requiere alcance/tope y permisos propios; allowlist real y primer ciclo real requieren autorización expresa. Ensayo sintético no satisface R; imposibilidad de aislamiento/recuperación exige cierre bloqueado y decisión mínima de contexto, no más rondas sintéticas.

## Continuación autorizada para planificar — decisiones 1=A y 2=A
Confirmado por Franco en el encargo de continuación: conservar F03 en `127.0.0.1`; planificar reenvío privado restringido Windows→WSL solo condicionado a viabilidad acreditada. Si es inviable, detener y consultar: no cambiar escucha, host, transporte ni instalar Tailscale en WSL automáticamente.

Confirmado: CA privada bajo custodia humana, distribución explícita de confianza al Mac y renovación; conservar HTTPS validado y autenticación F03. No certificado público ni consentimiento CT inferido. Nombre/SAN, puertos, mecanismo concreto de reenvío y ejecutables del host requieren evidencia de plataforma antes de redactar instrucciones operativas literales; no son elecciones suplidas por este plan.

Esta continuación permite crear tareas desde task-03 en borrador y sustituye únicamente la prohibición histórica de nuevas tareas «en esta corrección». No autoriza construir, instalar, aprovisionar, cambiar red, ensayar remotamente ni usar datos reales. Cliente HTTPS local, preparación del encargo humano A, preparación del ensayo B y ficha R permanecen separados. Cada ejecución requiere su aprobación propia; los topes A/B y el presupuesto R separado no se reinician por subdividir tareas.

## Inspección de continuación — evidencia y límite
Confirmado por lectura: no existe AGENTS.md en raíz; CLI local importa index y abre DB; servidor conserva loopback y no tiene lanzador operativo CLI. Node local v22.23.2. `npm run typecheck` intentado: falla `tsc: not found`. No se instalaron dependencias ni se ejecutaron build, tests, red o ensayos. Debe resolverse el habilitante de herramientas con permiso separado antes de construir/verificar; no equivale a defecto funcional demostrado.

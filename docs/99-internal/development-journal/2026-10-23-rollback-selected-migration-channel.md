# Instalación seleccionada del retroceso v1 — preparación, no ejecución

Se versiona `migrate-production.yml`, reutilizando el entorno `production-db`, los validadores de autoridad
Gate 7 y el pin CA/host de los scripts existentes. El archivo local no versionado hacía `supabase db push`
sin seleccionar migración y podía instalar SQL ajeno; no se copia esa ejecución indiscriminada.

Único destino EatClean `nhirlpkuvonggctdzzad`; única migración `20261023065216_cr_order_rollback_v1_atomic.sql`.
Manifiesto de bytes SHA-256; baseline obtenido por SELECT con ledger exacto (74 versiones), columnas,
constraints, triggers y funciones asociadas (incluida auditoría), enums y ausencia de cualquier sobrecarga del RPC.
La nueva conexión reutiliza `SUPABASE_DB_URL_PROD` del entorno protegido, verifica host/usuario/puerto/BD,
fuerza verify-full y CA pinneada y descarta opciones PG heredadas. No se consultan ni registran valores secretos.

Sólo `workflow_dispatch`, main exacto revisado, run/attempt inicial y alcance explícito de instalación.
Preflight secreto-cero verifica bytes/source/protecciones; el job protegido requiere aprobación de production-db
incluso para su modo de lectura. Se revalida el historial soberano y main antes de conectar y antes de instalar.
DDL de un único archivo + ledger + postchecks se ejecutan juntos en una transacción; bloqueo/advisory lock,
timeouts, rechazo de repetición, firma/body/search_path/EXECUTE y esquema/ledger posteriores.
Un resultado ambiguo se conserva como INSTALLATION_UNKNOWN y exige reconciliación de lectura, nunca retry ciego.

## Pruebas

Unit tests de contexto/alcance, target TLS, drift y autoridad; integración PostgreSQL local desechable del SQL
real generado. Se fuerzan fallos de baseline, inserción de ledger y postcheck y se comprueba ausencia de
RPC/fila de ledger tras cada rollback; éxito y segunda instalación rechazada. Sin conexiones productivas de escritura.

## Bloqueos productivos observados (no modificados)

GET production-db: `can_admins_bypass=true`, `prevent_self_review=true`, único revisor `losrealesplus`.
El ejecutor falla cerrado en esa configuración. Para una futura instalación, el propietario deberá deshabilitar
bypass con autorización separada y usar un actor legítimo distinto para iniciar el run si conserva self-review.
No se propone desactivar la prohibición de autoaprobación. La consulta de nombres de secretos devuelve 403;
no se puede afirmar que `SUPABASE_DB_URL_PROD` esté configurado. Debe verificarlo el propietario antes del preflight.
No se han ampliado permisos de tokens ni modificado entornos.

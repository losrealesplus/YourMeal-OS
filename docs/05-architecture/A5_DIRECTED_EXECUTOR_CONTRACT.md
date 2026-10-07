# A5 — Ejecutor dirigido: cualificación técnica aislada

## Contrato y autoridad

Human Product Authority: Alexander Hernandez. La autorización de implementación y cualificación aislada resuelve el STOP anterior por autoridad insuficiente. Ese STOP significa **QUALIFICATION_NOT_STARTED_DUE_TO_AUTHORITY_PRECHECK**, no un fallo demostrado del motor Supabase.

Base congelada: `c37c00c1d5d34babf0c8d5c38ad0f578017b717f`, merge humano de #506. Rama de esta unidad: `codex/a5-directed-executor-isolated`.

**PRODUCTION_EXECUTION = HARD_DISABLED**, incondicional. No approval, nonce, environment, manifest, credencial ni resultado advisory puede habilitarla. **A5_PRODUCTION_AUTHORITY_BINDING_BLOCKED** sigue siendo un gate separado, fuera de este PR. No afirmar readiness de migración al proveedor.

Este tooling reduce el riesgo de una futura conciliación A5: prueba la identidad exacta, el ledger y los resultados inciertos sin ampliar la autoridad de un agente. No cambia experiencia, SQL ni capabilities de EatClean.

## Document context check

Consultados: FOUNDATION; AGENTS; Contexto Estratégico Permanente; Filosofía de Producto; Contexto CTO; Engineering Operating Protocol; CR-GOV-02 materializado en Gatekeeper/broker/transcript-validator; diseño aprobado A5; las tres migraciones congeladas y el fixture v2. El alcance humano prevalece: diario, package.json, workflows y validadores existentes no se modifican. El contrato incluye el registro de esta unidad dentro del único documento autorizado.

## Motor fijado y alcance físico

Preference 3: módulo público oficial `github.com/supabase/cli/pkg v1.2.3`, origen `ae7642d5089c9752b543681010f1ef4c434794be`.

- módulo: `h1:YKa1BSsBoLENxf1V0z2HqFWCLJWq6iTaR3GnF0HzWcQ=`;
- go.mod upstream: `h1:79QdZr5TfuAJ4hnI0mF3Av6QGXgVzXRtcgSpMVYfuGg=`;
- pgx/v4: `v4.18.3`;
- toolchain de cualificación: Go `1.27.1`, darwin/arm64, preparado solo en directorio temporal;
- PostgreSQL de cualificación: `17.10`, cluster desechable, socket Unix, `listen_addresses=''`.

Solo `NewMigrationFromFile` y `MigrationFile.ExecBatch` ejecutan las migraciones y escriben su bookkeeping. No fork, motor copiado, ledger writer propio, repair, db push ni barrido de historial. El DDL del ledger sintético existe únicamente en tests; sus 61 filas se crean mediante el motor oficial, no INSERT manual.

Archivos: cuatro del módulo Go; wrapper y spec nuevos; este contrato; harness test-only bajo `tools/a5-directed-executor/testdata`. Dependencias transitivas del módulo Go fijadas en go.mod/go.sum; ninguna dependencia de la aplicación modificada.

## Identidades y parser

ProjectRef de referencia: `nhirlpkuvonggctdzzad`. Tenant de referencia: `8bba00ba-331b-42c8-9283-4e3836ffb870`. Son identidades de la fuente congelada, **no destinos de conexión disponibles**.

1. `20261007020208_cr_order_a5_lifecycle_ledger_expand.sql`: SHA-256 `a4ae81e745ec556485b004aaff218af97dcd1b60d8f32a430a2b01440491dc47`, 61→62.
2. `20261007020245_cr_order_a5_lifecycle_writer.sql`: `ffb41a798cddf851b34dc2bc7f63590edb33cdf3c69c1fa7b75ac914aeddf310`, 62→63.
3. `20261007020849_cr_order_a5_audit_uuid_compatibility.sql`: `303cd5971c63c726caa5cce234045baefba48a464d90c6150b3298e536024f4f`, 63→64.

Se rechazan campos extra, duplicados JSON, variantes de nombre de campo, source/project/tenant/version/name/path/SHA incorrectos, orden distinto, versiones duplicadas, traversal y symlinks en rutas SQL. El archivo leído debe coincidir con el blob Git congelado. Una vez verificado, el motor recibe solo esos bytes capturados en un FS en memoria; una sustitución posterior del archivo no cambia el SQL a ejecutar.

Cada statement debe ser un substring byte-exacto, en orden. Los gaps solo pueden contener `;` o whitespace ASCII. Se registran offsets y hashes. Strings, cuerpos de funciones, casts, JSON y expresiones permanecen intactos. `BEGIN`/`COMMIT` y sus comentarios permanecen; no se añade una transacción exterior.

## Entrada y frontera local

Manifest estricto: schemaVersion=1; mode=isolated-qualification; sourceSha/projectRef/tenantId congelados; tres entries exactas; baselineLedger sintético de 61 versiones, name=synthetic_baseline, statements=[SELECT 1]; cuatro schemaHashes (pre y tres post).

No SQL, DSN, host, project o directorio de migraciones arbitrario. `--repo` localiza los blobs verificados; no selecciona SQL libre. `--step` selecciona únicamente 1/2/3 dentro del manifest congelado. `--isolation` solo admite un directorio temporal a5-executor-* del UID actual, modo0700, sin sustitución del postmaster.pid, PID vivo, data_directory y socket concordantes, puerto fijo55449.

El dialer solo permite el socket Unix exacto. Sin fallback TCP. La conexión verifica cluster_name, ausencia de listener TCP, database=a5_qualification y user=a5_migrator. El rol debe ser LOGIN, NOINHERIT, NOSUPERUSER, NOBYPASSRLS, NOCREATEROLE y NOCREATEDB, distinto de cr_order_writer. El fixture otorga lectura de settings para comprobar el target. No se leen credenciales de producción. PGSERVICE se rechaza antes de interpretar configuración; passfile está fijado a /dev/null y cualquier password heredado queda descartado.

Estas comprobaciones no pretenden proteger frente a un administrador local que reescriba el binario o el servidor. Esta fase tampoco habilita una vía de producción: incluso con un manifest válido y autoridad simulada, ningún target remoto es accesible por el ejecutor.

## Un paso por invocación

Dry-run por defecto verifica manifest/bytes/parser y no conecta a DB. `--execute-local --step N` abre solo el cluster cualificado. Lock advisory de sesión serializa invocaciones en esa base sin envolver los BEGIN/COMMIT del archivo.

Antes del motor: duplicate version rejection, prefijo completo exacto del ledger, firma exacta pre del catálogo. Después: conexión nueva con transacción REPEATABLE READ READ ONLY, prefijo completo post y firma post. Se comparan versions/names/statements, no solo counts.

El catálogo firmado incluye schemas/ACL, relaciones/RLS, columnas/defaults, constraints, índices, enums, funciones/owners/ACL/search_path, policies, triggers, atributos y membresías de roles, default ACL. El fixture de referencia obtiene los poststates mediante el SQL congelado por un transporte independiente; el parser se demuestra aparte.

Éxito: **LOCAL_STEP_VERIFIED_STOP**. Nunca se ejecuta la siguiente migración automáticamente. Un postcheck fallido impide continuar. Los 61 rows anteriores permanecen exactos y solo se añade la fila pedida.

## Fallo e interrupción

Cualquier error del motor se comunica conservadoramente como **OUTCOME_UNCERTAIN** y se reconcilia por lectura independiente. No se imprime SQL/DSN/error de servidor. La pérdida de proceso/transporte detectada por el wrapper abre el modo `--reconcile-local`; jamás relanza `--execute-local`. Una sesión aún in-flight impide afirmar un resultado definitivo.

Clasificaciones: DDL_NOT_COMMITTED_LEDGER_NOT_COMMITTED; DDL_COMMITTED_LEDGER_COMMITTED; DDL_COMMITTED_LEDGER_MISSING; STATE_INCONSISTENT. Si no puede leerse el estado, OUTCOME_UNCERTAIN permanece sin resolver.

**DDL_COMMITTED_LEDGER_MISSING es posible** con v1.2.3: el COMMIT del archivo precede al INSERT de bookkeeping del motor. No hay atomicidad conjunta garantizada en estas migraciones. Se conserva esta limitación del diseño aprobado; no se oculta ni se corrige con ledger propio, cambio de SQL, retry o repair.

## Cualificación y reproducción

Desde tools/a5-directed-executor, con el toolchain exacto y caches temporales:

```sh
GOTOOLCHAIN=local go mod verify
GOTOOLCHAIN=local go test -race -v ./...
GOTOOLCHAIN=local go vet ./...
GOTOOLCHAIN=local go build -trimpath -buildvcs=false -o /tmp/a5-directed-executor .
```

Desde la raíz:

```sh
node --test scripts/governance/a5-directed-executor.spec.mjs
A5_PG_BIN=/absolute/local/postgresql/bin A5_GO=/absolute/go1.27.1/bin/go \
  node tools/a5-directed-executor/testdata/qualify.mjs
```

El harness requiere psql local `/opt/homebrew/bin/psql` y node disponibles, usa el binario local compilado `/tmp/a5-directed-executor`, crea/detiene/elimina el cluster y produce `/tmp/a5-qualification-evidence.json`. No descargar ni usar secrets. En entornos que bloquean shared memory, requiere permiso del sistema para este cluster local. Tests unitarios sin harness marcan los casos locales como SKIP: eso por sí solo no certifica la integración.

La evidencia registra manifest/parser/statement offsets-hashes, firmas de catálogo y ledger, resultados de cada paso, fallos, tres ventanas de interrupción y binary digest. Buildvcs=false permite reproducibilidad; la procedencia se liga externamente al commit y hashes de fuentes, no a una identidad VCS implícita del binario.

## Límites pendientes y siguiente actor

La cualificación técnica local no certifica conectividad, privilegios/owners del proveedor, compatibility live, autoridad humana OOB ni una operación productiva. El fixture es sintético y usa objetos/predecesores suficientes para probar la mecánica; no es copia del proveedor ni de customer data. PG17.10 local no certifica PG17.6.1.155 live. El changelog reciente de PG17.11 no cambia este pin local y no se aplicó actualización de proveedor.

A4b no se consulta ni se modifica; CLOSED según último preflight previo, sin nueva observación live. M3, OP08 y Extras intactos. Sin producción, deploy, Gate7, merge o reparación.

Tras PASS técnico: **A5_EXECUTOR_TECHNICALLY_QUALIFIED_READY_FOR_HUMAN_REVIEW + A5_PRODUCTION_AUTHORITY_BINDING_BLOCKED**. Human Product Authority revisa el PR. Solo después se diseña separadamente el binding productivo; no hay autorización implícita de ejecución.

## Evidencia del run aislado de esta unidad

Resultado: **A5_EXECUTOR_TECHNICALLY_QUALIFIED_READY_FOR_HUMAN_REVIEW + A5_PRODUCTION_AUTHORITY_BINDING_BLOCKED**.

- Binario cualificado SHA-256: `3bdb268bad8ba9d313c11e61a5cec3307094cce3c40bf1b1f5d90caeb8d7a18e`.
- Manifest cualificado SHA-256 (JSON compacto canónico del test): `4bc334f2008b58ee956479c0a34f34cc5563ff8134fa84d97ab5f7664de59651`.
- Parser: 7 / 48 / 12 statements, respectivamente; equivalencia byte-exacta y BEGIN/COMMIT preservados.
- Tres invocaciones separadas del binario: LOCAL_STEP_VERIFIED_STOP, ledger 62/63/64, prefijo previo exacto y catálogo post exacto.
- DDL failure antes de COMMIT: OUTCOME_UNCERTAIN → DDL_NOT_COMMITTED_LEDGER_NOT_COMMITTED.
- Fallo de ledger después de COMMIT: OUTCOME_UNCERTAIN → DDL_COMMITTED_LEDGER_MISSING, sin reparación.
- Interrupción antes de COMMIT: DDL ausente y ledger ausente.
- Interrupción durante bookkeeping, después de COMMIT: DDL presente y ledger ausente.
- Interrupción después de ledger commit y antes de éxito del cliente: DDL y ledger presentes; proxy Unix retuvo ReadyForQuery tras INSERT y se verificó por conexiones independientes.
- Reconciliación determinista: dos conexiones READ ONLY separadas observaron exactamente el mismo ledger y catálogo.
- Duplicado exacto y misma versión con otro name/statements: rechazo antes del motor. Prefijo y orden incorrectos: rechazo antes del motor. Lock contention: LOCK_FAILED antes del motor.
- Rol insuficiente: DDL y ledger ausentes.
- Wrapper: 6 tests PASS; pérdida de transporte causa solo una lectura posterior, no retry mutador; datos de aprobación y PG secrets no pasan al child.
- Governance existente: 123 PASS en el barrido inicial más 12 PASS de release-contract tras resolver js-yaml externo; cero cambios de dependencies o validators. El loader de prueba fue temporal fuera del repo y usó js-yaml ya instalado.
- Go unit tests con race detector, integración local con race detector, go vet, go mod verify, build y diff check: PASS. Los unit tests sin cluster dejan dos pruebas locales en SKIP; la integración real se ejecutó aparte y PASS.

Firmas de catálogo de la referencia aislada (no del proveedor):
- Stage 0: `346fde46a0d5011d8d7e71c39d93a88d7052f75a3800d44872de92743c249f8a`.
- Stage 1: `ce90ec0f335a9b5009ba56af1e7cbbe36c5cc75ebc7fa549c346850b6af2800e`.
- Stage 2: `e7e1773dec7a0e1efbb38f1e80dbad85e1a8afc5bf909936e1f5527da266f1e6`.
- Stage 3: `ee13713eca4a3589fcdd57e235902482caaf68bcb9560b4b20329d3f0fe504db`.

La prueba local requirió una excepción del sandbox para memoria compartida de PostgreSQL. No se habilitó listener TCP y el cluster terminó eliminado. No se instaló runtime global ni se consultó Supabase. La LOC real supera la estimación inicial debido a validación estricta, firma de catálogo y fault injection; no se añadió framework propio ni se amplió el scope físico.

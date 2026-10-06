# CR-ORDER A4a — Writer custom offline

Autoridad: Alexander Hernandez, HUMAN AUTHORIZATION POST-#498 / A4a OFFLINE. Base main verificada: `5e336e26af28a394c8ee983f5f5febb132cac673`. Implementación de ADR 0102 e I01–I10 sin alterar sus contratos congelados. Estado de capacidad: **CLOSED**; sin UI/A4b ni activación.

## Document context check

FOUNDATION, AGENTS, contexto estratégico, filosofía, CTO, Engineering Operating Protocol, PR Review Protocol, ADR 0102, contrato CR-ORDER r1 y matriz, ADR 0103/Offer Pricing r2 y revisiones A1/A2/A3/M1/M2 consultados. Supabase skill aplicada. La autorización humana delimita implementación offline y propuesta; ninguna evidencia local concede autoridad productiva.

## Contrato y fronteras

Se amplía el mismo núcleo privado v2: dish, custom y mixed comparten transacción, requestId/hash, revisión, audit, delivery derivado y rollback. No se crea una tabla de pedidos custom ni Dish sintético. Custom guarda `dish_id=NULL`, UUID de línea, nombre/descripcion, qty entera y precio decimal explícito. Cero requiere confirmación. UNKNOWN con declaraciones vacías persiste; receta/composición/ingredientes/coste siguen NOT_AVAILABLE en lectores, sin inventar columnas o recetas.

El camino SSR custom-only verifica usuario/membership/rol desde BD y llama `cr_order_custom_commit`, servicio privado que delega al núcleo. No utiliza registro comercial, menú, slot ni quote. Mixed conserva M2 para el subconjunto dish; el hash de quote incluye el comando completo, incluidas las intenciones custom. M2 continúa rechazando explicit slot + política comercial activa: no se implementa M3.

El `total` SQL de quote sigue siendo el subtotal dish de M2. La respuesta SSR valida ese subtotal, devuelve `dishSubtotal`, `customSubtotal` y un `total` general calculado en unidades de 4 decimales con BigInt y redondeo final a 2. El total del commit SQL se calcula sobre todas las líneas en la misma transacción. Subtotales mostrados se redondean por separado; no son la autoridad para sumar/redondear el total. CustomLines es intención explícita, no una cotización de disponibilidad/comercial.

La migración CLI nueva cambia nulabilidad y constraint discriminado en la misma transacción. Conserva las FKs compuestas de tenant de A1; añade identidad única de batch custom por tenant/día/UUID. La tabla privada de activación empieza vacía, RLS activo, sin permiso de modificación a writer/API. No hay flag productivo ni botón. Gate cerrado también impide reemplazar una orden custom por dish-only para archivar por bypass. Idempotent replay devuelve lectura autorizada del commit existente; no escribe ni activa.

Los callers no pueden asumir cr_order_writer ni obtener autoridad mediante un GUC: la procedencia depende del rol real. Writer NOLOGIN/NOBYPASSRLS y propietario de funciones, no de tablas. REVOKE del núcleo se ejecuta con su propietario para evitar la advertencia histórica del migrador NOINHERIT. Custom solo se persiste a través de staff verificado y gate; kitchen tiene exclusivamente transición serializada de lote con UUID/día, membership/rol, estado permitido y audit atomic. El servidor valida la respuesta real JSON del batch, incluida identidad tenant/UUID/día/kind/null dish/status. La ruta UI existente sigue rechazando comandos custom.

Edición conserva UUID, nombre/qty/precio explícito se actualizan con before/after audit, retirada archiva. Preparación o delivery iniciados impiden edición. Repetición sigue como propuesta pendiente: adaptador exige disponibilidad/preparación/precio confirmados y ligados al intento actual (nombre/descripción/qty/día/precio), origen tenant válido y nuevo UUID. Audit registra provenance y confirmación de cero. Un intento de captura nuevo de staff sin provenance no permite deducir si hubo un origen omitido: no se infiere por nombre; A4b deberá preservar provenance al consumir propuestas.

## Revisión técnica

Revisión local y red team: no P0/P1 conocidos pendientes en el alcance probado. Se corrigieron el gate de reemplazo dish-only, nullable CHECK de precio, ACL del núcleo, subtotal mixed, parser de snapshot y parser de batch real. Inversión operativa: permite conservar encargos fuera del catálogo sin pedidos parciales ni composición ficticia, preparando la captura futura con autoridad explícita.

Validación final y límites se registran junto al PR. Fixtures PostgreSQL contienen roles efectivos (SESSION AUTHORIZATION/SET ROLE), migrador no superusuario, constraints/triggers/RLS y fallos inyectados. `written-fixture.json` son filas sintéticas realmente comprometidas por SQL (pedido confirmado, dish y dos custom homónimas), no mock de estado reescrito para lectores. Tests downstream comprueban operaciones, resumen/history read, normalización, kitchen/batches, production, packing, CSV/etiquetas y repeat pendiente; modificación/delivery/rollback se comprueban en SQL.

Riesgo de futura aplicación de esquema: **HIGH**. El fixture local no certifica estado del proveedor ni historial completo; prueba de bootstrap CI sobre BD vacía no sustituye reconciliación, copia equivalente y ensayo. Track B y C son planes externos de diseño, no implementación comercial ni repair de ledger en este PR. UX/dispositivos/live break: N/A; no se afirma validación productiva.

Sin merge, proveedor, datos/precios live, migraciones aplicadas, Gate 7, deploy ni Cloudflare. A4b, reconciliación/aplicación y activación requieren gates humanos separados.

## Resultado final local

- Vitest completo: **301 archivos / 1.880 pruebas PASS**.
- PostgreSQL 17.10 aislado: A3 **19/19**, M2 **22/22**, A4a **20/20** (61 total, escenarios y suites).
- Gobernanza **25/25 PASS**, typecheck global, build SSR/Nitro con Node 20.20.2, ESLint de los archivos TS/runner afectados y git diff --check PASS.
- Preflight estático del historial: **61 migraciones / 133 políticas**, sin colisiones. El ensayo schema/ACL equivalente del proveedor continúa pendiente.
- Lint del archivo de tipos conserva 2.269 errores de formato preexistentes; los fragmentos nuevos no añaden deuda. Lint global heredado no está verde: baseline post-#498 12.963 errores/44 warnings. No se reformatea masivamente para ocultarlo. Doctor no se anuncia PASS: baseline conocido 55/57 con timeout example.com y public key de governance ausente.
- r1, matriz y r2 conservan exactamente sus tres SHA-256 aprobados.

Logs locales: `/tmp/a4a-vitest-verified.log`, `/tmp/a4a-postgres-verified.log`, `/tmp/a4a-a3-regression.log`, `/tmp/a4a-types-verified.log`, `/tmp/a4a-build.log`, `/tmp/a4a-scoped-lint-verified.log`, `/tmp/a4a-governance.log`, `/tmp/a4a-static.log`.

# Isolated qualification — 2026-10-07

State: **LOCAL_LAB_PASS / LINUX_CONTAINER_QUALIFICATION_BLOCKED**. Production remains HARD_DISABLED. This is not sovereign enrolment, cloud readiness or provider certification.

Human-approved architecture is implemented exclusively under tools/a5-sovereign-root-lab and its scope contract. Base main: 9a1ac18378158283455acab49f23f8ac330cf2c7 (#508, context packaging only). #507 executor and all SQL/workflows/flags/settings remain byte-identical.

## Evidence

- Node22.23.2, Darwin arm64: **93/93** protocol/CAS/adversarial tests PASS, 36.4s.
- Node26.5.0: initial 91/91 before the final two CAS-hardening cases. Final source is qualified on Node22; do not attribute 93 to Node26 without another run.
- **100 separate CAS processes:** one consumption accepted, 99 denied.
- Real SQLite process exits after durable consume/admission commits: replay rejected; readback observes committed control state.
- Counter races across two intents, assertion replay, revoked key/session, expiry/clock skew, modified intent/receipt/raw proof, fourth migration/order, partial baseline, wrong project, PAT-only fixture and algorithm confusion denied.
- CAS rechecks challenge expiry and immutable intent at durable commit, closing verification→persist TOCTOU.
- DDL_COMMITTED_LEDGER_MISSING is simulated here; #507 proved it using real isolated PostgreSQL previously. No new live/SQL claim from this worker.
- Browser TEST UI **1/1 PASS**, Chromium, widths375/1280, hashes visible, no overflow/runtime errors, production action disabled. Initial overflow was corrected before final PASS.
- Repository governance **136/136 PASS**; typecheck/build PASS; strict lab ESLint and formatting PASS; diff-check PASS.

## Boundaries checked

No source modifications to .github/workflows, supabase/migrations, a5-directed-executor, package/lock, product UI, flags or governance authority definitions. No Cloudflare/Supabase calls, DNS/settings, credentials or real WebAuthn enrolment. No external approval consumed. Node receipt signing keys and two software authenticator keys are generated TEST-only in memory, not stored or logged. Child store env is PATH only.

GitHub is a TEST fixture; no API/OIDC provenance integration. SQLite is local and accessible to the lab user: no claim of custody independence or cloud CAS. Registry has synthetic public keys, not attestation/real-human enrolment. Worker ledger/catalog are memory simulation; no SQL adapter or password path. UI is a read-only review demo and deliberately has no physical WebAuthn action. These are deliberate lab boundaries, not product activation.

## Linux/container status

Docker CLI exists, but the configured OrbStack Unix socket is absent; no runtime could execute a container. Existing executor cross-compiles to Linux amd64 ELF with Go1.27.1, SHA256 5d2f421dbc4f9f968647a4246c86547ee5f78f261290d4be02aecbb5ccd65b48. **Not executed; not qualified; not bound to a production receipt.** No runtime/VM or cloud resource created.

Container recipe is pending execution. Its Node base must be provided by immutable digest; Python is installed from apt and the final output image must then be pinned and qualified. No reproducible-build claim for unpinned apt. The Linux image must run offline without credentials. No complete Linux/container PASS declared.

## Remaining separate gates

Linux/container execution; real attestation/UV hardware qualification; human bootstrap and custodians; RP/origin; non-exportable signer; independent strongly-consistent store/audit; OIDC and direct GitHub checks; minimal-privilege DB credential plane; live compatibility; explicit exact-intent sovereign authorization. AWS/region/model/TTL/retention remain candidates. None is authorized by this qualification.

The laboratory makes maintenance cost concrete: no new npm dependency/provider SDK, but Node+Python, own narrow schema/crypto profile, process-based storage and two-store failure handling still need independent review. These tests are evidence of the local implementation only, not security certification of an independent root.

## Hardening mínimo autorizado — 2026-10-07

El baseline de implementación es b829e539ba4560493340d2d79f54f99ef0a68d77. La receta posterior fija manifest Node ARM64, snapshot Debian y 22 paquetes transitivos exactos. La autorización cubre builds Linux ARM64 aislados en OrbStack y registro de resultados; no cambios de lógica ni infraestructura/provider. El estado anterior corresponde a evidencia Darwin: los resultados Linux se registran separadamente vinculados al nuevo commit, sin reatribuirlos al baseline.

Método: dos builds --no-cache del mismo commit; ejecución de qualify.mjs offline/read-only con /tmp efímero; inventarios y hashes de contenido comparados además de IDs Docker. Registrar toda diferencia de metadatos. Producción HARD_DISABLED; PR509 Draft sin merge. El harness HTTP forma parte de la suite Linux; la prueba Chromium visual previa sigue siendo evidencia Darwin, no Chromium Linux.

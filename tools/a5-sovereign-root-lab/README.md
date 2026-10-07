# A5 Sovereign Root — TEST laboratory

**PRODUCTION HARD_DISABLED.** Keys, authenticator assertions, GitHub approvals and ledger progression are TEST. No hardware enrolment, cloud keys, production credentials, DB connection or SQL execution.

Requires Node >=22 and `/usr/bin/python3` with SQLite. No new npm dependencies, no application integration and no product package/workflow changes.

Run from repository root:

```sh
node tools/a5-sovereign-root-lab/qualify.mjs
node tools/a5-sovereign-root-lab/server.mjs
```

UI listens only on `127.0.0.1:8787`, serves read-only TEST scope and denies all POST actions. It does not call `navigator.credentials` or enrol a real key. Stop server with Ctrl-C. The assertion fixtures exercise real ES256 signatures over WebAuthn-shaped bytes; they do not demonstrate human presence or authenticator attestation.

The schema deliberately uses `TEST_*` operation/principal/repository/project and epoch-second candidate times. TEST registry has two generated ephemeral software keys. It is not the production receipt schema and cannot be promoted by renaming one field. Private key material is never persisted or logged. A temporary owned `a5-root-lab-*` directory under real `/tmp` contains two SQLite stores; tests remove only their own directory.

Authority store tests durable transaction/CAS, counter concurrency, expiry, revocation and chained events. Separate worker store rejects duplicate admission even if response was lost. Both are controlled by this local lab user: this does NOT certify independence of cloud custody or non-exportable signing. The worker does NOT execute the migrations: approved versions/hashes are scope evidence, its ledger/catalog are simulated values. Existing #507 executor stays unchanged/HARD_DISABLED.

A new intended process for the next migration is different from resuming after crash. All uncertainty ends the session; observation stays available but neither receipt nor reconcile allows repair or retry.

## Receta Linux ARM64 fijada

Baseline de implementación: `b829e539ba4560493340d2d79f54f99ef0a68d77`. El commit posterior de hardening cambia exclusivamente receta/documentación; sus resultados no se atribuyen al Dockerfile original.

La receta fija el manifest ARM64 de Node22.14.0 (`sha256:663c09e4fd483fbcb2bb7297b3618061ac23f0a1925b0958db2ab734efad7c94`), snapshot Debian `20250407T205129Z` y las 22 versiones transitivas en Dockerfile. No usa repositorios variables ni actualiza paquetes de la base. APT verifica firmas y hashes; únicamente se desactiva la caducidad del snapshot histórico, como documenta https://snapshot.debian.org/. Son dependencias históricas de laboratorio, no una recomendación productiva.

```sh
docker build --no-cache --platform linux/arm64 --provenance=false -f tools/a5-sovereign-root-lab/Dockerfile -t a5-root-lab:qualification-1 .
docker run --rm --network none --read-only --tmpfs /tmp:rw,nosuid,nodev,mode=1777 --cap-drop ALL --security-opt no-new-privileges --pids-limit 256 a5-root-lab:qualification-1
```

Repetir build sin cache en otra etiqueta sobre el mismo commit limpio. Comparar IDs de imagen, inventario `/lab-packages.txt`, hashes de archivos regulares (incluyendo Node/Python/SQLite y `/lab`) y metadatos. Los timestamps de instalación, logs y metadata de capas pueden variar; no afirmar identidad binaria si el digest difiere. El contenido efectivo y cada diferencia residual deben quedar registrados en la evidencia externa del commit exacto. Runtime offline, sin credenciales/mounts del host/socket ni acceso a contenedores existentes. Dockerfile ejecutado no equivale por sí solo a suite PASS. Solo ARM64; ninguna cualificación amd64.


Remaining gates: real attestation/hardware/enrolment, OIDC/GitHub API verification, non-exportable signing, independent CAS/custody, workload credential plane, Linux/container run, live schema compatibility and exact production authorization. AWS/domain/custodians/TTL remain candidates.

# A5 Sovereign Root — Isolated Implementation & Qualification

Scope lock derivado de aprobación humana del 2026-10-07. Base: main posterior a #508 (`9a1ac183…`); #508 solo añade context packaging, sin delta del ejecutor A5 ni migraciones. Producción HARD_DISABLED, A4b CLOSED según última evidencia, ningún proveedor conectado.

## Alcance cerrado

Únicamente `tools/a5-sovereign-root-lab/` y este contrato. Ningún workflow, package/lock del producto, migración, flag, GUC, environment ni endpoint productivo se cambia. Sin AWS/DNS/KMS/DynamoDB/secret productivo, sin enrolamiento físico, sin Supabase.

Laboratorio portable sin SDK de proveedor: Node crypto para firmas ES256 TEST, SQLite mediante Python para CAS transaccional persistido en directorio temporal propio, fixtures de GitHub inequívocamente TEST y worker de progresión de ledger/catalog simulado, sin SQL ni conexión DB. Root registry/key son efímeros TEST. RP `localhost`, principal `TEST_ALEXANDER`, proyecto `TEST_ONLY`. No admite el projectRef real. El recibo TEST es incompatible con un recibo soberano de producción.

No se implementa attestation hardware ni enrolamiento real: registry preestablecido de TEST public keys. Las assertions conservan el formato firmado authenticatorData + SHA256(clientDataJSON), UP/UV/contador y binding de challenge. No llamar a esos fixtures presencia humana ni KMS no exportable. Dos claves TEST simulan primaria/backup, no hardware.

Implementar schema/canonicalización/challenge, verificador y doble revalidación de proof por worker, receipt no bearer, CAS separado de consumo worker, replay/races/crash/revocation/TTL, UI local de revisión sin enrolamiento/aprobación humana, denial de production y qualification container reproducible sin proveedor. SQLite local verifica semántica de laboratorio; no acredita independencia administrativa ni DynamoDB cloud.

## Invariantes

GitHub fixture primero → assertion TEST final → receipt TEST firmado → CAS una sesión → tres pasos previstos con readback → COMPLETE. Alias/unknown/duplicate keys/Unicode fuera del perfil, expiry, drift, falsa signature y mutations al receipt/intents fallan cerrado. Consumo durable único. STARTED o resultado ambiguo termina en UNCERTAIN; jamás retry/repair implícito. Revocación y next-step admit se ordenan en transacción. Reconcile simulado siempre read-only.

Parámetros candidatos a medir: TTL 30min, challenge120s, margen120s, skew5s. No constitucionales. Un proceso de cualificación puede simular reloj; caller de UI no lo controla.

## Pruebas y límites

Negative matrix incluye PAT/approved=true, proof/receipt/artifact/binary/source/run/env/project alterados, fourth/order/partial baseline, counters/UP/UV/RP/origin, replay/copy/rerun, races, TTL/revoke, pérdida de resultado y DDL_COMMITTED_LEDGER_MISSING simulado. Crash real de proceso CAS y persistencia serán probados con procesos distintos.

Linux/container requiere runtime real; build recipe sin ejecución se reporta pendiente, nunca PASS. No cambiar el ejecutor #507 para superar ese bloqueo. Implementación aislada no certifica FIDO2 físico, cloud/custodia, proveedor, 61→64 live ni producción. Estado final para review humana: LOCAL_LAB_PASS / LINUX_CONTAINER_QUALIFICATION_BLOCKED con límites explícitos, producción HARD_DISABLED.

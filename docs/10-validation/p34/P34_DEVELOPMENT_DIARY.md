# Diario de desarrollo — P34 — 2026-10-08

## Intención

Una cocina necesita identificar el cliente y recibir contactos/direcciones coherentes en Centro de Operaciones. Se reutiliza CRM; Auth prueba identidad y no se convierte en una ficha comercial paralela. La asociación explícita y doble confirmación evita apropiarse de una ficha por correo coincidente.

## Implementación

Una frontera SQL transaccional compartida controla identidad, edición y direcciones, con revisión e idempotencia. UI self-service y staff consumen esa frontera. El default se cambia atómicamente; el historial conserva referencias archivadas. Auditoría queda dentro del commit, evitando un segundo audit postcommit que pudiera aparentar fallo tras éxito.

## Impacto y límite

Hay migración local y adaptación de callers CRM; requiere revisión y preflight antes de proveedor. La política legacy de autoapproval independiente permanece y bloquea activación OAuth. No se modifican writers financieros/lifecycle, workflows ni producción. Evidencia y exclusiones: P34_IMPLEMENTATION_CERTIFICATION.md.

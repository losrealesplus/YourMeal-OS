# ADR 0102 — Líneas nativas dish/custom en OrderItem

Fecha: 2026-10-05. Estado: **Accepted — CR-ORDER r1 APPROVED / FROZEN FOR IMPLEMENTATION**.
Autoridad de producto: Alexander Hernandez, aprobación explícita del 5 de octubre de 2026.
Base inspeccionada: `daa1fc4d945255eea0c6c541538c0162666d37d6` (origin/main).

## Decisión e identidad del contrato

Order + OrderItem conservan la única Source of Truth. Custom no crea Dish; su identidad es order_item.id. Captura/edición transaccionales, autorización efectiva orders.write, UNKNOWN, snapshots y compatibilidad downstream son obligatorios.

La especificación normativa es el [contrato r1 aprobado](../05-architecture/CR_ORDER_R1_APPROVED_CONTRACT.md), preservado byte por byte, junto a su [matriz de impacto](../05-architecture/CR_ORDER_IMPACT_MATRIX.json). Los invariantes I01–I10 permanecen exactamente como fueron aprobados. Este registro incorpora la aprobación posterior: los textos PROPOSED y las condiciones de firma del anexo describen su estado anterior, no el estado vigente. No se reescribe el artefacto firmado.

SHA-256 del contrato r1, UTF-8 exacto:
`a6380e08d9c46644316373378c29ad8ac95ca462b99953ca734325ec35c1fe98`.

SHA-256 de la matriz exacta:
`06690674f08fd04a8cdb97781744d4928469a385846502fbcf2c0c26b925510a`.

Identidad canónica: **ADR 0102 / CR-ORDER r1**, identificada por ambos digests anteriores. El digest del archivo de incorporación es adicional y se registra en la evidencia del PR; no sustituye el digest del contrato aprobado.

## Frontera de implementación

[Plan y descomposición](../05-architecture/CR_ORDER_IMPLEMENTATION_PLAN.md): expand → readers compatibles → writer v2 → habilitación estructural → activación humana separada. Autoriza preparar código, migraciones, tests y PRs; no aplicar migraciones productivas, activar custom, mergear, dispatch Gate 7, aprobar production-worker, desplegar ni mutar negocio productivo.

Cualquier hallazgo que requiera modificar un invariante I01–I10 vuelve a Alexander y detiene el bloque. El [Contract Gate de Offer Pricing](../05-architecture/CR_MENU_OFFER_PRICING_CONTRACT_GATE.md) es una propuesta separada; aprobar CR-ORDER no aprueba sus nuevas reglas de precio.

## Consecuencias y valor operativo

Permite capturar pedidos personalizados sin contaminar catálogo y conservarlos hasta cocina, packing, reparto e historial. Exige lectores completos y seguridad de BD antes de habilitar escrituras custom. Tras existir custom persistidas, un rollback mantiene esos lectores y snapshots; no restaura dish_id NOT NULL ni elimina datos para volver al código antiguo. Build Once → Deploy Exactly That y CR-GOV-02 permanecen intactos.

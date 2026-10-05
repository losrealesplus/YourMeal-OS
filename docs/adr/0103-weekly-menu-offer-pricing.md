# ADR 0103 — Precio por oferta del menú semanal

Estado: **Accepted / APPROVED / FROZEN** — 2026-10-05.
Autoridad de producto: Alexander Hernandez, autorización POST-#493.

La aprobación humana congela íntegramente OP01–OP10 y el cierre r2, incluido
`OFFER_PRICING_COMMERCIAL_UNSUPPORTED` ante combinación de precio explícito de slot
con pricing comercial activo sin contrato común. No concede autoridad de ejecución productiva.

Contrato canónico: [Offer Pricing r2 aprobado](../05-architecture/CR_MENU_OFFER_PRICING_R2_APPROVED_CONTRACT.md).
SHA-256 exacto de sus bytes:
`7eefc3cd73a20e3677d5248aef12fbfaa6bd7c02ff43b65e97a67952cedb2a85`.

El anexo se conserva byte por byte, incluidas sus etiquetas históricas de candidato
pendiente; este ADR registra la aprobación posterior y prevalece sobre esas etiquetas
sin reescribir OP01–OP10. CR-ORDER r1 / ADR 0102 no cambia.

M1 autoriza solo expansión compatible y lectores: columna nullable sin default/backfill,
proyección de identidad de oferta y fallback sin confundir cero. M2 establecerá captura,
quote, audit, seguridad de escrituras de precio y frontera comercial antes de cualquier
valor explícito productivo. M3 requerirá autorización y preflight propios para datos.

No se aplican migraciones, publican ofertas ni activan precios mediante este ADR.

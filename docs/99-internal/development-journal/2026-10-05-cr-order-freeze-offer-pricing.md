# CR-ORDER r1 congelado y Offer Pricing Contract Gate

## Intencionalidad y contexto

Alexander aprobó explícitamente el contrato técnico r1 y su matriz; autorizó persistencia/plan y preparación posterior de implementación, sin migraciones productivas, activación, merge ni deploy. Se consultaron Foundation, AGENTS, estrategia/filosofía/CTO, protocolo, ADR 0004, modelo Dish, contratos y código de menú/pedidos. Valor: preservar personalizados operativos sin inventar catálogo y ofrecer precios semanales sin alterar el precio global.

## Decisión y evidencia

ADR 0102 incorpora la aprobación; anexos r1/matriz copiados byte por byte con SHA-256. Sus textos PROPOSED históricos no se editan: la aprobación posterior reside en el ADR. Se fija plan P0–P6, schema expand/readers/writer v2/habilitación cerrada y gates humanos separados. Main permanece en daa1fc4d945255eea0c6c541538c0162666d37d6 al inspeccionarlo.

Offer Pricing se propone como CR/PR separado M0–M3. Solo comparte resolver dish y límite transaccional con CR-ORDER; no cambia I01–I10. Columna slot nullable, selección por slotId, quote revalidada, snapshot immutable y audit de procedencia sin FK adicional a OrderItem. CommercialPricingResolver y el guard cero existentes requieren compatibilidad explícita antes de habilitar; no afirmar que añadir columna los resuelve. Reuse singular/plural aprobado; 15 ofertas a 2.50 aún no ejecutadas.

## Validación y límites

Copias exactas contrastadas con digests aprobados; JSON y links locales nuevos verificados, gobierno y diff-check ejecutados para el PR documental. No tests de integración DB ni build de producto atribuidos a este bloque: no modifica código, schema ni workflow. Pruebas futuras detalladas en los contratos, no confundidas con resultados obtenidos.

CURRENT STATE: PR OPEN / READY FOR HUMAN REVIEW al completar creación del PR.
NEXT STEP: revisar documentación y decidir Offer Pricing Contract Gate; preparación posterior de P1 cubierta por autorización CR-ORDER vigente.
WHO: Alexander para review/merge/diseño Offer; Codex para siguientes PRs locales.
REQUIRES AUTHORIZATION: merge; contrato Offer; toda migración/publicación/activación por separado.
EXPECTED NEXT STATE: contrato de oferta aprobado o revisado, sin mutación productiva.

# Offer Pricing M1 — expansión y lectores compatibles

## DOCUMENT CONTEXT CHECK

- FOUNDATION.md: CONSULTED.
- AGENTS.md y Engineering Operating Protocol / FOPEBA: CONSULTED.
- Contexto estratégico, filosofía de producto y contexto CTO: CONSULTED.
- ADR 0102, ADR 0097 y contrato Offer Pricing r2: CONSULTED.
- Domain Dish y WeeklyMenu Repository/Service/Mapper/queries: CONSULTED.
- Provider runbooks: N/A, no ejecución de proveedor.

## Alcance

Base: merge #493 `54614a2ef29aba36977acf433a629d013d9b1305`.
El [ADR 0103](../adr/0103-weekly-menu-offer-pricing.md) registra aprobación y digest r2.
Esta inversión prepara precio por oferta sin alterar catálogo ni captura financiera.
No cambia contratos OrderItem/CatalogDish, ni I01–I10; A2 es independiente.

La migración añade exclusivamente `weekly_menu_slots.unit_price numeric(12,4)` nullable,
sin default/backfill, constraint finito y no negativo. No grants/policies/índices/FKs nuevos.
Row usa campo opcional como puente antes de aplicar la migración; Insert/Update aceptan
nullable. Los inserts legacy omiten la columna para funcionar antes de expand.

Repository valida precio decimal antes de enviar la inserción; ausencia omite columna,
NULL conserva fallback y cero no desaparece. No setter público ni control UI de precio.
Duplicar semana copia precio nullable explícitamente cuando existe la columna, a nuevos
slots de nuevo draft; audit de duplicación conserva referencias/precios fuente sin datos
sensibles. El ciclo de vida, capacidades y protección published existentes se conservan.

El mapper añade `days.offers` con slotId/menuId/tenantId/dishId/dayDate/basePrice/slotPrice/
effectivePrice/priceSource, sin colapsar dos slots del mismo Dish. Relativos mantienen
`Day N`, scheduled mantienen calendario UTC. Relaciones ajenas/mismatched fallan.
La selección read-only de DTO anterior admite exactamente un candidato con referencias
coherentes; cero candidatos o varios fallan. No se conecta a writers financieros.

`days.dishes` sigue siendo catálogo compatible: UI/capture actuales no se migran ni
se presenta esa proyección como precio financiero de oferta. `days.offers` es la nueva
frontera de lectura para M2. Por tanto NO introducir slots no NULL antes de M2 y preflight.

## Precisión y seguridad

Decimal monetario validado hasta 8 enteros y 4 decimales; base inválida no significa cero.
El precio efectivo se selecciona sin aritmética: slot ?? base. M2 debe usar decimal exacto
para operaciones/captura, no convertir esta proyección numérica en autoridad cliente.
PostgreSQL redondea exceso de scale antes de CHECK en numeric(12,4): la constraint no
puede demostrar rechazo de `1.00001`. Este rechazo se prueba en límite repository/reader;
SQL prueba rechazo negativo, no finito y overflow. No afirmar rechazo SQL de scale extra.

M1 no certifica RLS productiva ni introduce permiso nuevo. Tests locales usan roles reales
en esquema sintético y filtros repository; antes de aplicar se requiere inventario vivo de
RLS/grants/tenant FKs, duplicados, volumen y locks. M2 implementará enforcement/audit de
precio y protección published antes de habilitar edición/captura explícita; no hay bypass
comercial introducido aquí. No ejecutar INSERT/UPDATE productivos.

## Siguiente frontera y rollback

M2: todos los consumidores por slotId, quote/PRICE_CHANGED, snapshots y rechazo comercial,
validación/audit SQL/RPC, cero confirmado. M3: preflight y remediación 15 slots bajo autoridad
separada. No aplicar ahora ninguno ni modificar dishes.price.
Rollback anterior a activación: conservar columna NULL y deshabilitar nuevos callers;
no requiere DROP destructivo. Tras valores explícitos, no volver a lectores anteriores ni
poner NULL en masa. No hay datos explícitos creados por M1.

## Evidencia local

- Vitest weekly-menu/orders/dish-library: 271 tests / 35 archivos PASS.
- Gobernanza: 25 tests PASS; typecheck PASS; lint de todos los archivos tocados PASS.
- Build web/Nitro PASS. Warnings existentes del router sobre specs y plugin tsconfig.
- Test SQL: `node --test scripts/offer-pricing-m1.spec.mjs`, con Docker network none por
  defecto; alternativa `OFFER_TEST_POSTGRES_BIN=/ruta/bin` crea un cluster temporal propio,
  socket local y sin TCP. No acepta URL/credenciales/host de proveedor.
- En esta máquina Docker estaba indisponible; validación en PostgreSQL 17.10 temporal de
  `@embedded-postgres/darwin-arm64@17.10.0-beta.17`, SHA-512 del paquete comprobado antes
  de ejecutar. Runtime solo en /tmp; ninguna dependencia añadida al proyecto.
- Migración real ejecutada y assertions PASS en esquema sintético aislado: legacy NULL,
  tipo/default, cero/2.50, negativo/NaN/Infinity/overflow, ACL/policy/catalogue intactos y
  SELECT/INSERT/UPDATE/DELETE por tenant bajo rol SQL authenticated. No prueba schema vivo.
- Digest congelado y `git diff --check` PASS. Lint global tiene deuda preexistente; revisar
  reporte de PR para alcance. No se declara limpieza global ni certificación productiva.

# CR-COST-05: Contrato Core de Inteligencia de Mercado (Bloque 0)
**Fecha:** 2026-11-12  
**Alcance:** Bloque 0 — Arquitectura Core vs Tenant vs Configuración Regional  
**Conformidad:** `COST_INTELLIGENCE_CORE_BOUNDARY.md`, `CORE_DISTRIBUTION_CONTRACT.md`

---

## 1. Separación Arquitectónica Obligatoria

La capacidad de **Market Intelligence** pertenece al **Core de YourMealOS** (`losrealesplus/YourMeal-OS`) y se estructura en tres capas estrictamente desacopladas. EatClean actúa únicamente como el primer *tenant* consumidor y nunca debe acoplarse en esquemas, consultas, conectores o UI del Core.

| Capa | Responsabilidad | Ejemplos | Prohibición |
|---|---|---|---|
| **YourMealOS Core** | Normalización unitaria, matching multi-factor, mediana ponderada, auditoría e ingestas idempotentes, esquema base y contratos de fuente/observación. | `PriceNormalizer`, `ProductMatcher`, `BenchmarkCalculator`, `market_sources`, `market_products`, `market_price_observations`, `market_volume_tiers` | Prohibido hardcodear nombres de proveedores, islas, tasas fiscales concretas o slugs de EatClean en la lógica del Core. |
| **Tenant Instance** | Ingredientes internos, WAC real derivado de compras/facturas, mapeos privados `1:N` hacia SKUs de mercado, tarifas privadas del tenant, simulaciones y decisiones. | `product_mappings` (`tenant_id`), `market_price_observations` con `owner_tenant_id = <tenant_uuid>`, `cost_simulation_scenarios`, `cost_decision_intents` | Prohibido filtrar datos privados de un tenant hacia otro tenant o mutar facturas/WAC desde Market Intelligence. |
| **Configuración Regional** | Zonas geográficas (`region_code`), regímenes fiscales (IVA / IGIC / AIEM en bloques posteriores), moneda y parámetros de frescura inyectados como configuración o por fila observada. | `ES_TENERIFE_TF`, `ES_GRAN_CANARIA_GC`, `ES_CANARIAS_REGIONAL`, `ES_PENINSULA_MAINLAND`, `ES_NATIONAL` | Prohibido asumir por defecto impuestos fijos para todos los tenants sin declarar modo y tasa observada. |

---

## 2. Separación de Precios Públicos Compartidos vs Tarifas Privadas del Tenant

La tabla `public.market_price_observations` soporta convivencia multi-tenant segura mediante `owner_tenant_id`:

- **`owner_tenant_id IS NULL` (Observación Compartida dentro de la Instancia):**
  - Compartida únicamente **dentro de la base de datos de la instancia correspondiente** (no constituye por sí sola un catálogo global sincronizado entre instancias independientes).
  - Visible en `SELECT` para cualquier sesión autenticada (`authenticated`) de esa instancia.
  - Escritura y actualización de vigencia restringidas exclusivamente al administrador de plataforma autorizado (`public.is_saas_admin(auth.uid())`).
  - Prohibido adjuntar `raw_payload` privado o identificadores de tenant en filas compartidas (`owner_tenant_id IS NULL`).
  - Destinada a catálogos públicos observables, feeds autorizados de mayoristas/supermercados y referencias de mercado generales.
- **`owner_tenant_id = <tenant_uuid>` (Tarifa u Observación Privada de Tenant):**
  - Visible en `SELECT` únicamente para miembros aprobados del tenant propietario (`public.is_tenant_member(owner_tenant_id)`).
  - Inserción/actualización de vigencia restringida a staff aprobado del propio `owner_tenant_id` (o `is_saas_admin`).
  - Destinada a tarifas negociadas, condiciones comerciales particulares, presupuestos privados o listas de precios cargadas por un cliente concreto sin exponerlas al resto de tenants.

El *fingerprint* de deduplicación (`uq_market_price_obs_fingerprint`) incorpora ámbito de propiedad (`owner_tenant_id` o `'PUBLIC'`), formato físico, ámbito geográfico, canal/establecimiento y régimen/estado fiscal para evitar colisiones entre presentaciones o territorios distintos.

---

## 3. Mapeo `1:N` (Ingrediente del Tenant → Múltiples Productos de Mercado)

Un ingrediente del tenant (`tenant_ingredient_id`) puede mapearse simultáneamente a $N$ productos observables de distintas fuentes o formatos en `public.product_mappings` (`UNIQUE (tenant_id, tenant_ingredient_id, market_product_id)`). Las consultas de aplicación y repositorio deben tratar la relación como `1:N` en todo el ciclo de lectura, confirmación, rechazo y cálculo de dispersión.

---

## 4. Taxonomía Canónica de Evidencia y Fuentes

Toda cifra mostrada al operador debe declarar su naturaleza sin mezclar supuestos sintéticos:

| Etiqueta | Significado | Origen permitido |
|---|---|---|
| **`REAL`** | Coste interno auditado del tenant | Compras recibidas, facturas prorrateadas y WAC real del inventario. |
| **`OBSERVED`** | Precio de mercado observable o feed autorizado | Observaciones persistidas en `market_price_observations` (con `raw_payload`, `imported_by`, `capture_method` y vigencia). |
| **`MANUAL`** | Entrada asistida o supuesto operativo del usuario | Captura manual auditada en `assisted_entry` o supuestos explícitos introducidos por el operador. |

- Si un ingrediente no dispone de observaciones mapeadas en base de datos, la interfaz debe presentar un estado vacío honesto (sin valores de relleno ni cálculos inventados).
- La adquisición desde fuentes públicas externas queda desacoplada para adaptadores independientes en bloques posteriores, respetando términos de uso y sin evadir controles ni logins.

---

## 5. Contrato Físico de Productos (Bloque 2)

Cada SKU observable en `public.market_products` separa la presentación comercial de la magnitud física normalizable:

- **GTIN / EAN:** almacenado estrictamente como texto (`gtin text NULL`, nunca numérico) preservando ceros iniciales y longitudes GS1 válidas (`8`, `12`, `13`, `14` dígitos).
- **Estructura comercial del pack:**
  - `pack_presentation`: formato comercial observable (`bulk`, `bag`, `box`, `tray`, `bottle`, `can`, `jar`, `sachet`, `vacuum`, `drum`, `pack`, `other`).
  - `pack_count`: número entero (`>= 1`) de envases interiores vendibles dentro de la unidad comercial (`NULL` si es desconocido; nunca `0`).
  - `unit_content_qty` + `unit_content_unit`: contenido declarado de **un solo envase interior**.
  - `net_content_qty` + `net_content_unit`: contenido neto **total** de la presentación comercial completa.
  - `drained_weight_qty` + `drained_weight_unit`: peso escurrido **total** cuando conste en conservas/líquidos de cobertura (`NULL` si no aplica o es desconocido).
- **Dimensiones físicas y anti-doble-multiplicación:**
  - Las magnitudes (`measurement_dimension`: `'mass' | 'volume' | 'count'`) no se mezclan implícitamente; **prohibido convertir litros ↔ kilogramos sin `density_kg_per_l` documentado** (`NULL` si se desconoce).
  - La observación económica declara `observed_price_basis` (`'per_pack' | 'per_inner_unit' | 'per_base_unit' | 'unknown'`) y `normalization_basis` (`'net_content' | 'drained_weight' | 'unit_count' | 'unknown'`):
    - Si `observed_price_basis = 'per_pack'`, el divisor usa el neto/escurrido total o `pack_count * unit_content_qty` (nunca se multiplica `pack_count` dos veces si ya está informado el contenido neto total; cualquier contradicción se rechaza/cuarentena).
    - Si `observed_price_basis = 'per_inner_unit'`, el divisor usa únicamente `unit_content_qty`.
    - Datos desconocidos permanecen como `NULL`, nunca `0`.

---

## 6. Geografía, Proveedor/Canal y Cobertura de Entrega (Bloque 2)

El modelo separa cuatro dimensiones independientes:

1. **Identidad del proveedor (`market_sources`):** cadena o proveedor base, `provider_code`, país y tipología.
2. **Establecimiento o canal (`market_establishments`):** centro físico, cash & carry, delegación logística o storefront web concreto asociado a un proveedor (público Core cuando `owner_tenant_id IS NULL` o privado cuando `owner_tenant_id = <tenant_uuid>`).
3. **Lugar donde se observó el precio (`market_price_observations`):** `observation_country_code` (ISO 3166-1 alpha-2, sin limitar Core a España), `region_code`, `observation_subdivision_code`, `observation_province_code`, `observation_island_code`, `observation_postal_code` (`text` conservando ceros iniciales) y `observed_channel`.
4. **Cobertura de destino, disponibilidad y vigencia (`market_delivery_coverages` + observación):**
   - Ámbito documentado de entrega o recogida por país, región, subdivisión, isla, provincia o prefijo postal, más `delivery_coverage_state`, `availability_status` y `validity_source`.
   - **Invariante:** un precio observado en Península **no** acredita disponibilidad ni entrega en Canarias; la ausencia de cobertura documentada significa estado `'unknown'`, nunca disponible por omisión.

---

## 7. Contrato Fiscal y Condiciones Comerciales (Bloque 2)

En Bloque 2 se persisten los metadatos fiscales y comerciales necesarios sin implementar aún el comparador de costes ni inferir reglas tributarias ausentes:

- **Moneda y precio observado:** `price_raw` y `currency` (ISO 4217 de 3 letras, `EUR` por defecto, extensible a cualquier moneda en Core).
- **Inclusión fiscal y nulabilidad honesta:** `tax_mode` (`'ex_tax' | 'inc_tax' | 'unknown'`).
  - `tax_rate = 0` representa explícitamente tipo cero (`0%`), mientras `tax_rate IS NULL` representa tipo desconocido o no aplicable.
  - Cuando `tax_mode = 'unknown'` o (`tax_mode = 'inc_tax'` y `tax_rate IS NULL`), `normalized_price_ex_tax` permanece estrictamente `NULL` con `normalization_status` explícito (`'tax_unknown'` o `'tax_rate_missing'`), prohibiendo deducir tasas por nombre de producto o territorio.
- **Régimen y trazabilidad tributaria:** `tax_regime` (`IVA`, `IGIC`, `IPSI`, `VAT`, `GST`, `SALES_TAX`, `EXEMPT`, `OUT_OF_SCOPE`, `UNKNOWN`), `tax_rate_source`, `tax_rule_ref`, `tax_effective_from` y `tax_effective_to`.
- **AIEM:** `aiem_status` (`not_applicable`, `applicable_included`, `applicable_excluded`, `applicable_inclusion_unknown`, `unknown`), `aiem_evidence`, `aiem_rate` y `aiem_amount_raw`. Se conserva como metadato documental sin aplicarlo automáticamente como recargo ni duplicar importes.
- **Deducibilidad dependiente del comprador:** la recuperabilidad o prorrata fiscal **no** es propiedad del SKU ni de la observación compartida; pertenece al perfil fiscal del comprador (*tenant*) en capas posteriores.
- **Condiciones comerciales:** `freight_inclusion`, `freight_cost_raw`, `free_freight_min_order_amount`, `min_order_qty`, `min_order_unit`, `promotion_status`, `promotion_condition` y `promotion_valid_to`.

---

## 8. Política de Rollback Fail-Closed (Bloque 2)

- El script de reversión (`supabase/migrations/rollback/20261112200000_cr_cost_05_pr2_physical_geo_fiscal_contract_down.sql`) es estrictamente **fail-closed**: **prohibido** fabricar valores por defecto (`ex_tax`, `0%`, `price_raw`, fechas inferidas) o deshabilitar la inmutabilidad de observaciones para forzar una bajada de versión.
- Si existen filas con datos reales o metadatos específicos de Bloque 2 (observaciones con fiscalidad desconocida/`NULL`, metadatos fiscales/geo/comerciales, coberturas en `market_delivery_coverages`, establecimientos en `market_establishments`, packs/GTIN en `market_products` o regiones/códigos ampliados en `market_sources`), el rollback debe abortar explícitamente (`RAISE EXCEPTION`).
- **Una vez registrados datos reales de Bloque 2, cualquier remediación en entornos activos debe realizarse únicamente mediante migración hacia adelante (*forward-only*).**

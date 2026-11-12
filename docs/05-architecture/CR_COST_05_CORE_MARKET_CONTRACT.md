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

- **`owner_tenant_id IS NULL` (Observación Pública Compartida en Core):**
  - Visible en `SELECT` para cualquier sesión autenticada (`authenticated`).
  - Escritura restringida a miembros aprobados con rol staff activo (`has_any_staff_role` o `is_saas_admin`).
  - Destinada a catálogos públicos observables, feeds autorizados de mayoristas/supermercados y referencias de mercado generales.
- **`owner_tenant_id = <tenant_uuid>` (Tarifa u Observación Privada de Tenant):**
  - Visible en `SELECT` únicamente para miembros aprobados del tenant propietario (`public.is_tenant_member(owner_tenant_id)`).
  - Inserción/actualización de vigencia restringida a staff aprobado del propio `owner_tenant_id`.
  - Destinada a tarifas negociadas, presupuestos particulares o listas de precios privadas cargadas por un cliente concreto sin exponerlas al resto de la plataforma.

El *fingerprint* de deduplicación (`uq_market_price_obs_fingerprint`) incorpora siempre el ámbito de propiedad (`owner_tenant_id` o `'PUBLIC'`) para que una observación pública y una tarifa privada equivalente —o tarifas de dos tenants distintos— puedan coexistir de forma idempotente sin colisiones.

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

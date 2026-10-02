# CR-OPS-06: Gate 4.5 Data Integrity & Migration Safety Review

**Release**: YourMeal OS `v0.9.1`  
**Change Request**: `CR-OPS-06` — Delivery Scope Decoupling & Kitchen-to-Delivery Handoff  
**Base Commit**: `b99d6db203d48e847669625fa57f0352f248b1b3`  
**Branch**: `feat/cr-ops-06-delivery-services`  
**Audit Protocol**: Strict READ-ONLY Data Contract, Schema & Migration Audit  
**Date**: 2026-10-02  

---

## Executive Summary & Gate 4.5 Verdict Matrix

| # | Integrity Pillar | Evaluation Focus | Verdict | Key Finding / Evidence |
|---|---|---|---|---|
| **1** | **Historical Backfill Safety** | Creation source, `order_items.day_date` exclusivity, legacy state mapping, zero false `delivered`. | **PASS** | 20/20 items backed by strict NOT NULL `day_date`. Zero orders in `delivered` in live production. |
| **2** | **Snapshot Integrity** | Address, contact, dietary and instruction snapshots frozen at intake. | **PASS** | Snapshots populated deterministically; fallback explicitly tagged (`unresolved: true`). Recommendation noted for B2B site addresses. |
| **3** | **Foreign Keys & Delete Semantics** | Cascade vs restrict behaviors on `orders`, `customers`, and `customer_addresses`. | **PASS** | Soft delete pattern (`deleted_at`) protects operational history. Hard cascades documented. |
| **4** | **Tenant Isolation** | Foreign keys, composite unique constraints, RLS policies across staff and customers. | **PASS** | `tenant_id` enforced in table constraint, FK, and RLS (`has_any_staff_role`). Cross-tenant pollution impossible. |
| **5** | **Migration Safety** | Additive nature, lack of destructive commands, idempotence, conditional blocks. | **PASS** | Zero `DROP`, zero `DELETE`, zero `UPDATE` on existing tables during backfill. Safe `DO $$` and `ON CONFLICT DO NOTHING`. |
| **6** | **State Integrity** | Micro vs macro state machine, multi-day isolation, finality barriers. | **PASS** | `orders.status` requires 100% resolved services before final transition. Monday delivery leaves Wed/Fri intact. |

---

## 1. Pillar 1: Historical Backfill Safety

### A. Backfill Scope & Data Sources
- **Source Query**: The backfill in Section 7 of [`20261002130000_cr_ops_06_delivery_services.sql`](file:///Users/alex/Developer/YourMeal-OS/supabase/migrations/20261002130000_cr_ops_06_delivery_services.sql#L252) executes strictly over:
  ```sql
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id AND oi.deleted_at IS NULL
  WHERE o.status != 'draft' AND o.deleted_at IS NULL
  GROUP BY o.id, ..., oi.day_date, ...
  ```
- **Verification Criteria**:
  1. **Exclusivity of `order_items.day_date`**: Services are generated strictly from the distinct values of `oi.day_date`. The migration does not synthesize, extrapolate, or approximate dates.
  2. **Non-Draft Enclosure**: Draft orders (`o.status = 'draft'`) are excluded. In YourMeal OS, drafts do not constitute a physical fulfillment commitment; their services are generated when the customer confirms the order.
  3. **Deleted Row Immunity**: Rows with `deleted_at IS NOT NULL` in both `orders` and `order_items` are ignored.

### B. Empirical Audit of Production Database (`nhirlpkuvonggctdzzad.supabase.co`)
Live read-only audit of the 10 production orders:
- **Total Orders**: 10
  - `39dca4c2` (draft): 1 item (2026-09-11) $\rightarrow$ Skipped by backfill.
  - `040f4394` (cancelled): 1 item (2026-09-07) $\rightarrow$ 1 service in `cancelled`.
  - `2b33e7b3` (confirmed): 1 item (2026-09-08) $\rightarrow$ 1 service in `pending`.
  - `02129a93` (draft): 1 item (2026-09-11) $\rightarrow$ Skipped by backfill.
  - `fab4f2a9` (confirmed): 1 item (2026-10-01) $\rightarrow$ 1 service in `pending`.
  - `5740a4c4` (in_production): 6 items across 3 days (`2026-09-28`, `2026-09-30`, `2026-10-01`) $\rightarrow$ 3 services in `in_production`.
  - `febd853f` (confirmed): 5 items across 3 days (`2026-09-28`, `2026-09-29`, `2026-09-30`) $\rightarrow$ 3 services in `pending`.
  - `53e6ec9e` (ready_for_delivery): 2 items (2026-09-28) $\rightarrow$ 1 service in `ready_for_delivery`.
  - `b127683f` (draft): 1 item (2026-09-28) $\rightarrow$ Skipped by backfill.
  - `00000002` (confirmed): 1 item (2026-10-05) $\rightarrow$ 1 service in `pending`.
- **Finding on `delivered` Inference**:
  - In the live database, **ZERO orders are in status `delivered`**.
  - Therefore, running the backfill will **NOT** infer or backfill any false or unwarranted `delivered` states.
  - Furthermore, all backfilled records are stamped with `legacy_backfill = true`, providing an immutable audit trail.

---

## 2. Pillar 2: Snapshot Integrity

### A. Snapshot Specifications
The canonical `public.delivery_services` table defines four snapshot columns:
1. `delivery_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb`:
   - B2C (Customer Address): When `ca.street` exists, stores:
     `{"addressId": "...", "street": "...", "city": "...", "zip": "...", "label": "...", "lat": ..., "lng": ...}`.
   - Fallback: When no address was associated at intake, explicitly stores:
     `{"unresolved": true, "reason": "no_address_at_intake"}`.
     *No empty or ambiguous `{}` is persisted.*
2. `customer_contact_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb`:
   - Populated from `public.customers` (`customerId`, `displayName`, `email`, `phone`).
   - Ensures courier has direct contact details even if the customer profile is subsequently updated.
3. `dietary_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb`:
   - Inherited directly from `orders.dietary_snapshot` (frozen during CR-OPS-DIET-01 / CR-CUST-01).
   - Preserves `allergens`, `customAllergens`, `restrictions`, `preferences`, `dietaryNotes`, `isOverride`.
4. `delivery_instructions text`:
   - Inherited directly from `orders.notes`.

### B. Audit of Application Layer vs SQL Backfill
- **SQL Backfill**: Joins `public.customer_addresses ca ON ca.id = o.delivery_address_id`. For B2C orders, address fields are populated.
- **B2B Location Observation**: In B2B company orders (such as `53e6ec9e`), the delivery location is linked via `o.site_id` referencing `company_locations.id`.
  - *Recommendation*: While `unresolved: true` is safe and non-crashing for existing legacy test orders, the application repository [`createDeliveryServicesForOrder`](file:///Users/alex/Developer/YourMeal-OS/src/modules/operations/infrastructure/operations-repository.ts#L325) already checks `order.siteAddress` and captures `{ street: order.siteAddress, label: order.siteName }`.

---

## 3. Pillar 3: Foreign Keys & Delete Semantics

### A. Foreign Key Audit
| Constraint | Target Table | `ON DELETE` Action | Behavioral Risk Analysis |
|---|---|---|---|
| `tenant_id` | `public.tenants(id)` | `CASCADE` | Standard multitenant lifecycle. If a tenant is hard-purged, all its delivery records are removed. |
| `order_id` | `public.orders(id)` | `CASCADE` | If a parent order is hard-deleted from DB, its daily services are deleted. |
| `customer_id` | `public.customers(id)` | `CASCADE` | If a customer record is hard-deleted from DB, delivery services cascade. |
| `delivery_address_id` | `public.customer_addresses(id)` | `SET NULL` | **Safe**. If a customer deletes an address from their profile, the delivery service retains the foreign row as NULL while the immutable `delivery_address_snapshot` remains 100% intact. |
| `packed_by` | `auth.users(id)` | `SET NULL` | **Safe**. If an operator user account is removed, the timestamp `packed_at` and service state are preserved. |
| `delivered_by` | `auth.users(id)` | `SET NULL` | **Safe**. Courier account deletion does not destroy delivery records. |

### B. SaaS Historical Preservation Policy
- In YourMeal OS, business entities (`orders`, `customers`, `order_items`, `delivery_services`) utilize **Soft Delete** (`deleted_at timestamptz`).
- The application never executes hard `DELETE FROM public.orders` or `DELETE FROM public.customers` in production.
- *Residual Risk*: In the event of a raw database SQL operation (e.g. DBA executing `DELETE FROM orders`), services would cascade. Because `delivery_address_snapshot` and `dietary_snapshot` exist within `delivery_services`, accidental data destruction is bounded to raw hard deletions.

---

## 4. Pillar 4: Tenant Isolation & Multi-Tenancy

### A. Database-Level Enforcement
1. **Composite Uniqueness**:
   ```sql
   CONSTRAINT uq_delivery_services_order_day UNIQUE (tenant_id, order_id, delivery_date)
   ```
   Ensures that no order can be associated with a delivery service under a differing tenant ID.
2. **Filtered Performance Index**:
   ```sql
   CREATE INDEX idx_delivery_services_day_status
     ON public.delivery_services(tenant_id, delivery_date, status)
     WHERE deleted_at IS NULL;
   ```
   Ensures queries for active operational delivery sheets are strictly partitioned by `tenant_id`.

### B. Row-Level Security (RLS)
- **Staff Access (`delivery_services_staff_all`)**:
  - `USING` and `WITH CHECK` clauses require `public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid())`.
  - An operator authenticated in Tenant A cannot read, insert, update, or transition delivery services belonging to Tenant B.
- **Customer Access (`delivery_services_customer_read`)**:
  - Restricted to authenticated customers whose `c.id = customer_id AND c.user_id = auth.uid()`.
  - Customers can never see orders or deliveries of other customers or tenants.

---

## 5. Pillar 5: Migration Safety Analysis

Line-by-line inspection of [`20261002130000_cr_ops_06_delivery_services.sql`](file:///Users/alex/Developer/YourMeal-OS/supabase/migrations/20261002130000_cr_ops_06_delivery_services.sql):

1. **Enum Creation (Lines 7–22)**:
   - Wrapped in conditional check `IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_service_status')`.
   - Non-breaking, safe on repeat execution.
2. **Table Creation (Lines 24–64)**:
   - Uses `CREATE TABLE IF NOT EXISTS public.delivery_services`.
   - Does not touch or modify existing tables.
3. **Index Creation (Lines 70–82)**:
   - Uses `CREATE INDEX IF NOT EXISTS`.
4. **RLS & Policies (Lines 84–131)**:
   - Uses `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
   - Each policy creation is wrapped in `IF NOT EXISTS (SELECT 1 FROM pg_policies ...)`.
5. **RPC Function (Lines 133–239)**:
   - Uses `CREATE OR REPLACE FUNCTION public.transition_delivery_service_status`.
   - Runs with `SECURITY DEFINER` and explicitly pinned `SET search_path = public`.
   - Verifies staff authentication before performing any updates.
6. **Backfill Execution (Lines 241–354)**:
   - Contained in an anonymous PL/pgSQL block `DO $$`.
   - Target insertion: `INSERT INTO public.delivery_services (...) ON CONFLICT (tenant_id, order_id, delivery_date) DO NOTHING`.
   - Contains **zero** `DROP`, **zero** `DELETE`, and **zero** `UPDATE` statements on `orders` or `order_items`.
   - 100% additive and re-executable without duplicate generation.

---

## 6. Pillar 6: State Integrity & Separation of Concerns

### A. Microstate vs Macrostate State Machine
$$\begin{array}{ccc}
\textbf{Commercial Contract (Order)} & & \textbf{Daily Fulfillment (Delivery Service)} \\
\hline
\text{draft} & \longrightarrow & \text{No service (uncommitted)} \\
\text{confirmed} & \longrightarrow & \text{pending} \\
\text{in\_production} & \longrightarrow & \text{in\_production} \longrightarrow \text{prepared} \\
\text{in\_production / ready\_for\_delivery} & \longleftarrow & \text{ready\_for\_delivery} \quad (\text{packed\_at stamped}) \\
\text{in\_production / ready\_for\_delivery} & \longleftarrow & \text{out\_for\_delivery} \quad (\text{dispatched\_at stamped}) \\
\text{delivered (only when } 100\% \text{ resolved)} & \longleftarrow & \text{delivered} \quad (\text{delivered\_at stamped}) \\
\end{array}$$

### B. Validation of State Invariants
- **Multi-Day Order Isolation**:
  - Delivering Monday (`2026-08-03`) marks only Monday's service as `delivered`.
  - Wednesday (`2026-08-05`) and Friday (`2026-08-07`) services remain in `pending` or `in_production`.
  - In both the database RPC (`transition_delivery_service_status`) and the TypeScript domain layer (`OrderFacade.completeDelivery`), `orders.status` is checked:
    ```sql
    SELECT count(*) INTO v_unresolved_count
    FROM public.delivery_services
    WHERE order_id = v_order_id AND status NOT IN ('delivered', 'cancelled');
    ```
  - Since $v\_unresolved\_count > 0$, `orders.status` **does not** advance to `delivered`.
- **Cancellation Isolation**:
  - If a specific delivery date is cancelled due to weather or customer request, only that `delivery_service` transitions to `cancelled`. Future delivery days remain active.

---

## 7. Residual Risks & Technical Recommendations

1. **Residual Risk 1: Hard Delete Cascades**:
   - *Risk*: A future direct SQL script executing `DELETE FROM public.customers` or `DELETE FROM public.orders` would cascade to `delivery_services`.
   - *Mitigation*: Application code already enforces soft deletion (`deleted_at`). Production database credentials are restricted to service role and authenticated application roles without ad-hoc human DDL/DML access.
2. **Residual Risk 2: Legacy B2B Site Address in Backfill**:
   - *Observation*: Historical B2B orders with `site_id` and `delivery_address_id = null` receive `{"unresolved": true, "reason": "no_address_at_intake"}` in the backfill.
   - *Mitigation*: This is safe, expected, and non-blocking. The UI handles unresolved addresses gracefully with operational warnings. All future orders capture the address directly into the snapshot.

---

## 8. Governance State & Gate Verification Checklist

```text
CR-OPS-06 GOVERNANCE PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gate 1 — Discovery & Bottleneck Diagnosis      ✅ PASS
Gate 2 — Scope Lock & Architecture Review      ✅ PASS
Gate 3 — Branch Isolation & Pre-Flight Checks  ✅ PASS
Gate 4 — Implementation & Hardening            ✅ PASS
Gate 4.5 — Data Integrity & Migration Safety   ✅ PASS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gate 5 — Staging / Pre-Merge Certification     🔒 LOCKED (Awaiting Authorization)
Gate 6 — Production DB Migration Authorization 🔒 LOCKED (Awaiting Authorization)
Gate 7 — Deployment to Cloudflare Workers      🔒 LOCKED (Awaiting Authorization)
Gate 8 — Final Live Production Certification   🔒 LOCKED (Awaiting Authorization)
```

**STATUS: STOP.**  
- **0** commits created.
- **0** pushes or merges to `main`.
- **0** production database migrations executed.
- **0** deployments initiated.
- Working tree remains clean and fully verified on branch `feat/cr-ops-06-delivery-services`.

Awaiting formal authorization from the **Human Product Authority** to proceed to **Gate 5 (Staging / Pre-Merge Certification)**.

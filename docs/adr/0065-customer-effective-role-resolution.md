# ADR 0065: Customer Effective Role Resolution from Approved Membership

## Status
Accepted

## Context
In YourMeal OS, authorization relies on a four-tier ladder:
```text
Route → Permission Guard → Service → Repository → Database (RLS)
```
Capabilities are mapped from application roles (`AppRole`) in `src/permissions/index.ts` and `docs/09-security/CAPABILITY_MATRIX.md`. The `customer` role is explicitly granted the following consumer capabilities:
* `menus.read` (read published weekly menus)
* `orders.read` (read own orders)
* `orders.write` (create and confirm own weekly order drafts)

While administrative/staff roles (`saas_admin`, `company_admin`, `kitchen`, `logistics`, `support`, etc.) are assigned explicitly in `public.user_roles`, customer self-registrations via trusted deployments (ADR 0064) create an approved membership in `public.tenant_members` with `membership_type = 'customer'` and **0 rows** in `public.user_roles`.

Prior to this ADR, `SessionBootstrapService` loaded `roles` exclusively from `public.user_roles`. Consequently, customer users had `roles = []` during session bootstrap, failing `requireCapability(roles, "orders.write")` with:
```text
Missing capability: orders.write
```
even though their tenant membership was approved and `tenantId` was correctly bound.

## Decision
1. **Derive Effective Role in SessionBootstrapService**:
   When an authenticated user has an approved membership in `public.tenant_members` with:
   * `membership_type = 'customer'`
   * `status = 'approved'`
   * `deleted_at IS NULL`
   * and no administrative staff roles in `public.user_roles` (`user_roles.length === 0`),
   
   `SessionBootstrapService.ts` synthesizes the canonical effective role:
   ```ts
   roles = ["customer"]
   ```

2. **No DB Role Mutation**:
   `public.user_roles` remains reserved for staff and administrative assignments. No customer rows are inserted into `user_roles`.

3. **Staff Protection**:
   Staff users with roles in `public.user_roles` retain their exact staff roles uninhibited. A pending membership (`status = 'pending'`) never yields an effective `customer` role.

4. **Security & Ownership Invariants**:
   * `customer` role grants `orders.write`, but does **not** grant `orders.manage`, `customers.*`, `support.*`, `kitchen.*`, `logistics.*`, or `saas.manage`.
   * Double-layer ownership is strictly preserved:
     * **App Layer**: `OrderService` validates `order.customer_id === findCustomerIdForUser(userId)`.
     * **Postgres RLS**: `orders_customer_write` policy requires `(c.id = orders.customer_id AND c.user_id = auth.uid())`.
   * Customer A cannot read, create, or confirm orders for Customer B.

5. **AUTH USER != CUSTOMER**:
   Synthesizing `roles = ["customer"]` in the session identity ladder is an in-memory runtime resolution. It does not auto-materialize rows in `public.customers` or create spurious orders/payments.

## Consequences
### Positive
* Customers authenticated via trusted deployments can successfully program draft orders and confirm their weekly orders.
* Clean separation of concerns between commercial/tenant membership (`tenant_members`) and operational staff privileges (`user_roles`).
* Zero SQL migrations or database mutations required.

### Negative / Trade-offs
* Session bootstrap is the single source of truth for runtime customer role synthesis. Any bypass that bypasses `SessionBootstrapService` would observe raw `user_roles`.

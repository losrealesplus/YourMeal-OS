# Product Design 02-E · SaaS Platform Governance & Support Architecture
## 06 — Modules, Capabilities & Entitlements

---

### 1. The Three-Tier Capability Separation

A core tenet of YourMeal OS is maintaining clear separation between catalog definition, tenant entitlement, and business configuration:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. PLATFORM CATALOG (Platform Owned & Release Governed)     │
│    - Master inventory of all capabilities and modules.      │
│    - Governed by product releases, not ad-hoc UI buttons.   │
├─────────────────────────────────────────────────────────────┤
│ 2. TENANT ENTITLEMENT (Commercial Contract / Subscription)  │
│    - The concrete set of capabilities licensed to a Tenant. │
│    - Determined by Plan assignment or custom commercial add-on.
├─────────────────────────────────────────────────────────────┤
│ 3. TENANT CONFIGURATION (Tenant Owned & Configured)         │
│    - Operational enablement and parameter settings by Tenant.│
│    - E.g., activating WhatsApp notifications within entitlement.
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Module & Capability Lifecycle

1. **Capability Catalog (`Capability`)**:
   - The atomic unit of functionality (e.g., `dishes.update`, `orders.manage`, `kitchen.operate`, `whatsapp.notifications`).
   - Defined strictly in the product codebase and updated through release cycles.
   - Super Admin can inspect and govern catalog flags, but cannot arbitrarily create new application code capabilities from a runtime UI.
2. **Modular Packaging (`Module`)**:
   - A cohesive bundle of capabilities representing a functional domain (e.g., `Module: Kitchen Execution`, `Module: Multi-Stop Logistics`, `Module: B2B Invoicing`).
   - Modules have explicit dependency rules (e.g., `Module: Delivery Optimization` requires `Module: Basic Logistics`).
3. **Module Suspension**:
   - Super Admin may suspend a specific module platform-wide or for an individual tenant for security or emergency stability reasons.
   - Suspension isolates impact to the affected module without breaking unaffected core operations (such as ongoing kitchen order views).

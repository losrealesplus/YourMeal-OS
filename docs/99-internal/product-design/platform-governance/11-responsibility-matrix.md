# Product Design 02-E · SaaS Platform Governance & Support Architecture
## 11 — Cross-System Responsibility Matrix (RACI)

---

### 1. Responsibility Matrix

To eliminate ambiguity across all operational spheres, authority is distributed according to the following RACI matrix:

- **R (Responsible)**: Executes the activity.
- **A (Accountable)**: Final decision maker and owner of the outcome.
- **C (Consulted)**: Provides mandatory input or authorization.
- **I (Informed)**: Receives notification of the outcome.

| Activity / Domain Area | Platform (SaaS Admin) | Tenant (Company Admin) | Platform Support | Customer (End User) | Operations (Kitchen/Logistics) | Automation (Engines/Workers) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Platform Infrastructure & Uptime** | **A / R** | I | I | I | I | R |
| **Capability Catalog Definition** | **A / R** | I | I | I | I | I |
| **Tenant Provisioning & Suspension** | **A / R** | I / C | R | I | I | I |
| **Commercial Plan & Quota Catalog** | **A / R** | C | I | I | I | R |
| **Weekly Menu & Dish Pricing** | I | **A / R** | I | I | C | I |
| **Kitchen Production & Batching** | I | A | I | I | **R** | R |
| **Order Placement & Modification** | I | A | C (via Context) | **R** | I | R |
| **Order Cancellation / Refund Policy** | I | **A / R** | C | C | I | I |
| **Third-Party Provider Credentials** | C | **A / R** | I | I | I | R |
| **Support Context Initiation** | I | **C / I** | **A / R** | I | I | I |
| **Business Data Correction (Support)** | I | **A (Authorizes)** | **R (Executes)** | I | I | I |
| **Break Glass Emergency Invocation** | **A / R** | I | I | I | I | R |
| **Platform Audit & Compliance Purge** | **A / R** | I | I | I | I | I |

---

### 2. Core Separation Invariants

1. **Business Ownership**: The Tenant is solely Accountable (**A**) for recipes, pricing, order fulfillment, and customer terms.
2. **Platform Ownership**: YourMeal OS is solely Accountable (**A**) for infrastructure uptime, catalog integrity, tenant isolation, and security controls.
3. **Support Boundary**: Support acts only as an Authorized Executor (**R**) under Tenant Accountable (**A**) governance for business data changes.

# Product Design 02-E · SaaS Platform Governance & Support Architecture
## 07 — Plans, Quotas & Usage Telemetry

---

### 1. Conceptual Framework

YourMeal OS defines four distinct commercial and operational concepts:

```text
PLAN (Commercial Packaging)
  │
  ├── Entitlements (Capabilities Licensed)
  │
  └── Quotas (Quantitative Resource Limits)
          │
          └── Usage (Real-Time Consumption Telemetry)
```

1. **Plan**: A commercial tier (e.g. *Starter*, *Pro*, *Enterprise*) bundling a set of module entitlements and default resource quotas.
2. **Entitlement**: A discrete right or permission granted to a tenant to access a specific platform capability.
3. **Quota**: A numerical ceiling or constraint on a resource dimension over a billing or operational cycle.
4. **Usage**: The measured, real-time consumption of a quota by the tenant.

> *Note: While conceptually distinct in Product Design, their underlying technical data architecture will be specified during Technical Design without premature database schema constraints.*

---

### 2. Quota Dimensions & Threshold Alerts

Quotas are monitored continuously across operational dimensions (e.g., monthly active customers, weekly orders processed, active delivery zones, SMS alerts dispatched).

#### Progressive Warning Model:
- **80% Threshold**: Informational warning in Tenant Admin dashboard; non-blocking.
- **90% Threshold**: Warning alert with proactive upgrade recommendation; notification sent to Tenant Admin.
- **100% Threshold**: Action triggered according to the Quota Behavior Policy Matrix.

---

### 3. Quota 100% Policy Matrix

When a quota reaches 100% capacity, system behavior depends on the resource type and configuration:

| Resource Dimension | Quota Type | Default 100% Behavior | Grace Period / Policy |
| :--- | :--- | :--- | :--- |
| **Weekly Order Intake** | Soft Quota | Process orders with overage billing notice; do NOT drop customer orders. | 7-day grace period to upgrade plan or settle overage. |
| **Active Tenant Staff Seats** | Hard Quota | Block creation of new staff users until seat expansion is authorized. | Existing staff unaffected. |
| **SMS / Third-Party Messages** | Hard/Capped Quota | Pause automated SMS dispatches; fallback to email / in-app notifications. | Immediate fallback without order disruption. |
| **Storage / Recipe Photos** | Soft Quota | Allow upload with warning notice to clean up or purchase storage add-on. | 14-day grace period before upload throttling. |

---

### 4. Custom Plans & Commercial Exceptions

- **Custom Entitlements**: High-volume or enterprise tenants may be granted custom entitlements outside standard plan tiers upon YourMeal OS commercial approval.
- **Custom Quota Overrides**: Super Admin may configure custom quota allowances for specific tenants, tracked with full audit justification.

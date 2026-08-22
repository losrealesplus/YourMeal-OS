# Product Design 02-E · SaaS Platform Governance & Support Architecture
## 09 — Platform Reporting & Audit Model

---

### 1. Platform Reporting Hierarchy

To prevent cross-tenant privacy violations and maintain commercial boundaries:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. GLOBAL PLATFORM REPORTING (Super Admin Access)            │
│    - Global platform uptime, API latency, worker queue health.│
│    - Aggregated gross platform GMV, total platform order counts.│
│    - Per-tenant aggregated volume metrics (for billing/quotas). │
│    - NO row-level customer PII or dish recipes visible here.│
├─────────────────────────────────────────────────────────────┤
│ 2. TENANT BUSINESS REPORTING (Tenant Admin Access ONLY)     │
│    - Detailed customer order history, dish profitability,   │
│      kitchen batch metrics, local customer directory.       │
│    - Isolated strictly to the tenant's own workspace.        │
├─────────────────────────────────────────────────────────────┤
│ 3. SUPPORT INVESTIGATION (Governed Support Context ONLY)     │
│    - Row-level access granted temporarily to resolve an     │
│      authorized incident for ONE specified tenant.          │
└─────────────────────────────────────────────────────────────┘
```

#### Anti-Cross-Tenant Leakage Rules:
- Super Admin dashboard must never display comparative business performance between named tenants (e.g., "Tenant A vs Tenant B sales leaderboard") unless explicitly authorized by platform commercial agreements.
- Tenants have ZERO visibility into other tenants' existence, performance, or customer base.

---

### 2. Platform Audit Model

Every platform-level mutation, support action, and break-glass invocation generates an immutable audit entry:

#### Mandatory Audit Properties:
- `timestamp`: UTC ISO-8601 timestamp.
- `actor_id`: User ID of the initiating agent or system service.
- `actor_role`: Active role at the time of execution.
- `context_type`: `"platform" | "support_context" | "break_glass"`.
- `support_session_id`: Correlation ID linking the action to an approved Support Session (if applicable).
- `tenant_id`: Target tenant ID.
- `entity_type`: Target entity (e.g. `order`, `tenant_config`, `quota_override`).
- `entity_id`: Target entity ID.
- `action`: Specific operation performed.
- `old_state` & `new_state`: Before/after snapshot diffs.
- `reason`: Mandatory human-entered justification.

#### Audit Retention & Purge:
- Audit records are append-only and cannot be altered or deleted through standard UI.
- Purging historical audit logs requires statutory compliance approval and dual-control administrative sign-off.

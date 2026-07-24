# Driver Architecture Decision · RI-001

**Status:** Accepted · CHECK-IT 04 remediation
**Scope:** RBAC hardening, workspace consolidation

## Context

Two surfaces existed for drivers:

1. `/driver` — dedicated driver workspace (mobile-first, single-purpose).
2. `/admin/delivery` — logistics workspace inside the operations shell.

`admin.delivery` previously listed `driver` as an allowed role, and
`admin-shell` rendered the Reparto tab for drivers. The parent `/admin`
gate (`assertStaffRoute`) does not include `driver` in `STAFF_ROLES`, so
the check was unreachable — dead code that suggested access that never
worked.

## Decision

**One workspace per role class.**

| Role                                                    | Workspace         |
| ------------------------------------------------------- | ----------------- |
| `driver`                                                | `/driver` only    |
| `logistics`, `delivery`, `operations_manager`, admins   | `/admin/delivery` |

- `/driver` is the operational cockpit for on-the-road drivers: today's
  stops, POD capture, incident reporting. Gated by `assertDriverRoute`.
- `/admin/delivery` is the dispatch/logistics workspace. Gated by
  `assertCapabilityFromContext(context, "logistics.operate")` under the
  staff-only `/admin` layout.

Drivers **do not** access `/admin/*`. Logistics staff **do not** need the
`/driver` cockpit (they orchestrate, they do not drive the route).

## Consequences

- `roles.includes("driver")` removed from `showDelivery` in
  `src/components/admin-shell.tsx` — the tab no longer appears for
  driver-only users.
- The `driver` capability set (`orders.read`, `logistics.operate`) is
  preserved so the driver workspace and driver-side reads continue to work
  under RLS. `logistics.operate` on `driver` grants **data** access, not
  admin-shell access — the admin shell is gated by `hasStaffAccess`.
- Any future driver-facing feature must ship under `/driver`, never under
  `/admin/*`.

## References

- `src/permissions/route-guards.ts` — `assertDriverRoute`,
  `assertStaffRoute`, `assertCapabilityFromContext`.
- `src/routes/_authenticated/driver.tsx` — driver workspace gate.
- `src/routes/_authenticated/admin.tsx` — staff shell gate.
- `docs/09-security/CAPABILITY_MATRIX.md`

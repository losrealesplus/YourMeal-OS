# Bootstrap Ownership

**PRODUCT-CORE-003 · Stage Ownership Migration**  
**ADR:** [0052](../adr/0052-stage-ownership.md)  
**Depends:** [BOOTSTRAP_PIPELINE](./BOOTSTRAP_PIPELINE.md) · ADR 0050 / 0051

---

## Principle

```text
Stage          → coordinates startup for its domain
Application Service → business / data logic (unchanged queries)
Provider       → observes state, exposes context, renders, reacts
```

**Not:**

```text
Provider → starts services → changes startup flow
```

---

## Ownership matrix

| Responsibility | Before (002) | After (003) | Layer |
|----------------|--------------|-------------|-------|
| Cold `getSession` peek | AuthenticationStage | **AuthenticationStage** | Stage |
| Load roles / profile / membership | `SupabaseIdentityProvider` useEffect | **SessionStage** → `SessionBootstrapService` | Stage → Service |
| Bind `tenantId` / ActiveTenant | IdentityProvider | **TenantStage** → `TenantBootstrapService` | Stage → Service |
| Brand provenance resolve | delegated note | **BrandingStage** → `BrandingBootstrapService` | Stage → Service |
| Apply CSS theme | `TenantBrandScope` | **TenantBrandScope** (paint only) | Provider |
| `homePath` for AuthState | `homePathForRoles` in Provider | **NavigationStage** publishes; Provider reads store / fallback | Stage → Provider |
| Session subscription | IdentityProvider | IdentityProvider | Provider |
| Realtime `user_roles` | IdentityProvider | IdentityProvider | Provider |
| FCR-008 login milestones | auth routes + `resolveHomePath` | **unchanged** | Login UX / Service |
| Pipeline order | `BootstrapPipeline.ts` | **unchanged** | Orchestrator |

---

## DoD answers

| Question | Answer |
|----------|--------|
| Who starts Authentication? | `AuthenticationStage` |
| Who starts Session? | `SessionStage` |
| Who starts Tenant? | `TenantStage` |
| Who starts Branding? | `BrandingStage` |
| Who starts Navigation? | `NavigationStage` |

No Provider answers those questions.

---

## Data flow

```text
BootstrapPipeline / runOwnedIdentityStages
        │
        ▼
AuthenticationStage ── getSession (facade)
        │
        ▼
SessionStage ── SessionBootstrapService ──► BootstrapIdentityStore
        │
        ▼
TenantStage ── TenantBootstrapService ──► store.tenantId
        │
        ▼
BrandingStage ── BrandingBootstrapService ──► provenance
        │
        ▼
NavigationStage ── NavigationBootstrapService ──► store.homePath (ready)
        │
        ▼
SupabaseIdentityProvider ── subscribe(store) ──► AuthContext
```

---

## Files

| Path | Role |
|------|------|
| `src/bootstrap/pipeline/stages/*` | Coordinators |
| `src/bootstrap/pipeline/services/*` | Thin application services |
| `src/bootstrap/pipeline/BootstrapIdentityStore.ts` | Shared snapshot |
| `src/bootstrap/pipeline/runOwnedIdentityStages.ts` | Resume after login / INITIAL_SESSION |
| `src/identity/supabase-identity-provider.tsx` | Observer |

---

## Non-goals

- Ready UI gate  
- Provider tree rewrite  
- FCR-008 / Doctor / Runtime engine changes  
- New product features  

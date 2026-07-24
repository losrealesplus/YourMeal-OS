# Deployment Verification Gate

**FOPEBA gate (light)**  
**Código:** DV-001  
**Objetivo único:** Verificar que el entorno usado para certificación ejecuta **exactamente** el commit previsto.

Sin este gate, se puede invertir una jornada intentando certificar una versión que nunca llegó al runtime (AUD-001).

---

## When to run

| Moment | Required |
|--------|----------|
| Before Day-0 / ORR field fill | **Yes** |
| Before CHECK-IT 05 | **Yes** |
| After any merge to Lovable publish branch | **Yes** |
| Before claiming Bootstrap Evidence PASS | **Yes** |

---

## Record (fill per deployment)

| Field | Value |
|-------|-------|
| Date / time (UTC) | |
| Publish branch | `main` (or Lovable-connected branch) |
| Expected commit SHA (approved stack tip) | |
| Observed commit on publish branch (`git rev-parse origin/main`) | |
| SHA match? | Yes / No |
| Environment URL | e.g. `https://eatcleanapp.lovable.app` |
| `x-deployment-id` (response header) | |
| Build / deploy timestamp | |
| Probe method | curl headers + JS marker scan / UI |
| Operator | |

---

## Correspondence checks

```text
Expected SHA (certified stack)
        =
Publish branch tip
        =
Runtime identity (deployment-id + marker probe)
```

Minimum marker probe after OP-001 publish:

| Marker | Expected |
|--------|----------|
| `Dish Library — Module 01` (placeholder copy) | **ABSENT** |
| Real dish create / Weekly menu publish UI | **PRESENT** |
| `/saas` reachable for `saas_admin` | **PRESENT** |

---

## Verdicts

| Verdict | Meaning |
|---------|---------|
| **PASS** | Publish branch tip = expected SHA; new deployment-id; markers match intended release |
| **FAIL** | Publish branch or runtime still on wrong SHA / old markers (AUD-001 class) |
| **BLOCKED** | Cannot read headers / no access to env (process blocked, not product fail) |

---

## Relation to other domains

| Domain | Depends on DV-001 |
|--------|-------------------|
| Bootstrap Engineering | No (repo-only) |
| Runtime Deployment | DV-001 is its gate |
| Bootstrap Evidence | **Blocked** until DV-001 PASS |
| CHECK-IT 05 | **Blocked** until DV-001 PASS + Day-0 |

---

## Template log path

Store filled copies under:

```text
docs/10-validation/evidence/op001/DV001_<UTC-date>.md
```

See also: [AUD-001](./AUD001_RUNTIME_DEPLOYMENT_AUDIT.md) · [Post-deploy smoke](./POST_DEPLOY_SMOKE_OP001.md)

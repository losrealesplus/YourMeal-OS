# UX Decision · BrandLeafMark inside `/admin`

**Fecha:** 2026-07-25  
**Tipo:** Decisión de producto / UX (no bug)  
**Fuente:** Runtime Verification (Playwright)

---

## Observation

`BrandLeafMark` with admin entry (“Centro de Operaciones”) is **not** rendered inside the `/admin` shell.

It appears in authentication (and other pre-ops) flows.

---

## Decision

> Una vez que el usuario se encuentra dentro del Centro de Operaciones (`/admin`), no se vuelve a mostrar un acceso que navegue al mismo destino.

---

## Implications for certification

| Item | Treatment |
|------|-----------|
| Missing BrandLeafMark on `/admin` | **Not an incident** |
| Code change required | **No** |
| RBAC / home-path change required | **No** |
| Evidence | [RUNTIME_VERIFICATION_EVIDENCE.md](./RUNTIME_VERIFICATION_EVIDENCE.md) |

Do not open PRs to “fix” this.

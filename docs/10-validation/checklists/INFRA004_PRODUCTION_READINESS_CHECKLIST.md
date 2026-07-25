# INFRA-004 · Production Readiness Checklist

**Epic:** [INFRA004_PRODUCTION_READINESS.md](../INFRA004_PRODUCTION_READINESS.md)  
**Proyecto:** `djangucecsphnejplvic`  
**No marcar PASS con host legacy `cbeegcxkayybfncnuirg`.**

---

## A. Cutover binding (INFRA-002)

```text
□ .env SUPABASE_URL = https://djangucecsphnejplvic.supabase.co
□ .env VITE_SUPABASE_URL = mismo
□ .env SUPABASE_PROJECT_ID / VITE_SUPABASE_PROJECT_ID = djangucecsphnejplvic
□ Publishable key NO vacía (Dashboard → API)
□ Publishable key NO es la del proyecto legacy
□ supabase/config.toml project_id = djangucecsphnejplvic
□ No existen .env.local / .env.production con legacy (borrar o actualizar)
□ Lovable More → Cloud conectado a djangucecsphnejplvic
□ Lovable Preview rebuild tras sync Git
□ Grep operativo en tree publicado: cero hits de cbeegcxkayybfncnuirg en .env* / config.toml
□ Service role solo en entorno local/scripts — nunca VITE_*
```

---

## B. Dashboard Auth (Fase 1)

```text
□ Google Enabled + Client ID + Client Secret
□ Apple Enabled (si UI lo ofrece) + config válida
□ Site URL = host canónico (p.ej. https://eatcleanapp.lovable.app)
□ Redirect: http://localhost:8080/auth/callback  (o puerto real de vite)
□ Redirect: https://eatcleanapp.lovable.app/auth/callback
□ Redirect: …/reset-password (email recovery)
□ Redirect: cualquier dominio definitivo adicional
```

---

## C. OAuth E2E (Fase 2)

```text
□ /auth → Google
□ Network: authorize host = djangucecsphnejplvic.supabase.co
□ Network: CERO requests a /~oauth/initiate
□ Retorno /auth/callback?code=…
□ Sesión creada (Application → Local Storage → sb-*-auth-token)
□ Redirect a home según rol (cliente / admin / …)
□ Logout limpia sesión
□ Reload mantiene sesión
□ Cerrar navegador y reabrir recupera sesión
```

---

## D. Runtime surfaces (Fase 3)

```text
□ localhost — login Google OK
□ Lovable Preview — login Google OK + host oficial en Network
□ Producción — login Google OK + Site URL coherente
```

---

## E. Smoke portales (Fase 4)

```text
□ Cliente (/app)
□ Admin / Ops (/auth/admin → /admin)
□ Kitchen (rol kitchen)
□ Driver (rol driver)
□ Platform Owner / SaaS
□ Tenant membership visible donde aplica
□ RBAC: usuario sin staff no entra a /admin
□ Localization ES/EN
```

---

## F. Merge + tag (Fases 5–6)

```text
□ PR #66 mergeado (keys reales, no vacías)
□ PR #68 mergeado
□ main limpio de binding legacy
□ Tag v0.2.0-auth-complete creado y pusheado
□ INFRA-004 marcado PASS en status / acta breve
```

---

## Bloqueadores conocidos

| Bloqueador | Acción |
|------------|--------|
| PR #66 con publishable vacía | Pegar key del Dashboard antes de merge |
| Token Lovable solo lectura | Operador edita Cloud Connect / `.env` en UI o Git |
| Providers OFF en oficial | Fase B |
| Redirect no allowlisted | Fase B URL Configuration |

**PASS final:** A–F completos · sin `/~oauth/initiate` · sin host legacy en Network.

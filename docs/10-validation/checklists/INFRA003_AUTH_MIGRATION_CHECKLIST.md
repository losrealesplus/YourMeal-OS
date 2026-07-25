# INFRA-003 · Auth Migration — Validation Checklist

**Usar tras merge + cutover de keys al proyecto `djangucecsphnejplvic`.**

## A. Preflight (Dashboard Supabase)

```text
□ Google provider ON
□ Apple provider ON (si se ofrece en UI)
□ Redirect URL: http://localhost:<port>/auth/callback
□ Redirect URL: https://<preview-host>/auth/callback
□ Redirect URL: https://<prod-host>/auth/callback
□ Redirect URL: …/reset-password (email recovery)
□ Site URL = host canónico de producción
□ .env VITE_SUPABASE_URL apunta a djangucecsphnejplvic
□ Publishable key del proyecto oficial en VITE_SUPABASE_PUBLISHABLE_KEY
```

## B. Funcional

```text
□ Login Google → Network a *.supabase.co/auth/v1/authorize (NO /~oauth/initiate)
□ Retorno en /auth/callback → sesión → home por rol
□ Login Apple (si aplicable)
□ Logout (customer settings + admin shell + SaaS)
□ Refresh de página con sesión → sigue autenticado
□ Cerrar navegador y reabrir → sesión recuperada (localStorage)
□ Email/password sign-in (sin regresión)
□ Forgot password → /reset-password
□ Cambio de idioma autenticado
□ Cambio de rol / Platform Owner ensure (si aplica)
□ Auth guards: /admin sin staff → redirect; /saas sin saas_admin → redirect
□ Navegación portales: Customer / Admin / Kitchen / Driver / SaaS
```

## C. Regresión

```text
□ Portal Cliente
□ Portal Admin / Ops Center
□ Kitchen / Production vistas staff
□ Driver
□ SaaS / Platform Owner
□ Tenant branding / locale
□ Feature flags piloto (sin cambio esperado)
□ RBAC realtime (revoke rol → invalidate)
```

## D. Evidencia

```text
□ Screenshot Network: authorize host = djangucecsphnejplvic (o URL oficial)
□ Confirmación: cero requests a /~oauth/initiate
□ Notas en docs/10-validation/evidence/infra003/ (opcional)
```

**PASS final:** A + B verdes · sin `/~oauth/initiate` · sin dependencia `cloud-auth-js`.

# INFRA-005 · CHECKLIST_IDENTITY_VALIDATION

**Proyecto:** `djangucecsphnejplvic`  
**Modo:** Email/password nativo · OAuth UI oculto (`VITE_AUTH_OAUTH_SOCIAL_ENABLED=false`)

---

## A. Preparación

```text
□ .env apunta a djangucecsphnejplvic + publishable no vacía
□ VITE_AUTH_OAUTH_SOCIAL_ENABLED=false (rebuild Preview)
□ /auth no muestra botones Google/Apple
□ src/auth/oauth.ts y /auth/callback siguen en el repo
□ Email provider ON en Dashboard
□ (Opcional) SMTP / mailer configurado para confirm + reset
```

## B. Registro email/password

```text
□ /auth → Sign up con email real
□ Si mailer_autoconfirm=false: llega email de confirmación
□ Tras confirmar: puede hacer sign-in
□ Se crea fila en profiles (trigger)
□ Sin roles → home /app (cliente por defecto en useAuth)
```

## C. Login / logout / sesión

```text
□ signInWithPassword OK
□ Reload mantiene sesión (localStorage)
□ Cerrar navegador y reabrir recupera sesión
□ Logout limpia sesión (settings / admin shell / saas)
□ Tras logout, /app redirige a /auth
```

## D. Recuperación

```text
□ Forgot password con email válido (no @example.com si GoTrue lo rechaza)
□ Link → /reset-password
□ updatePassword → puede volver a login
```

## E. Perfiles (flujos definidos)

```text
□ Customer — signup / login → /app
□ Employee — inviteTenantStaff o vínculo company (flujo admin) → roles + /app u home según mapa
□ EatClean Tenant Admin — invite company_admin → /admin (o /auth/admin)
□ SaaS Platform Owner — Auth user con email en platform_owners.json → login → ensure_platform_owner_session → /admin o /saas
```

## F. RBAC + tenant

```text
□ Usuario sin staff no entra a /admin (redirect)
□ Usuario sin saas.manage no entra a /saas
□ Datos de otro tenant no visibles (profiles/dishes/tenants)
□ Brand leaf / Ops entry respeta roles
```

## G. Reactivar OAuth (post-validación)

```text
□ Dashboard Google/Apple ON + secrets
□ Redirect URLs /auth/callback
□ VITE_AUTH_OAUTH_SOCIAL_ENABLED=true + rebuild
□ Botones visibles · authorize host oficial · sin /~oauth/initiate
```

**PASS INFRA-005:** A–F verdes en Preview + al menos un Platform Owner en Auth.

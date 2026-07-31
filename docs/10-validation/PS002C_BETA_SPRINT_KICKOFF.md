# PS-002-C · Beta Sprint Kickoff (Product CTO)

**Fecha:** 2026-07-31 · **Actualizado:** Runtime Hardening + preflight  
**Prioridad:** **P0-1**  
**Gate:** [PS-002.md](./platform-stabilization/PS-002.md) · [FCR-008](./FCR008_CANONICAL_POST_LOGIN_SESSION.md)  
**Estándar FOPEBA:** cualquier desarrollador que clone el repo y siga este flujo obtiene el mismo resultado.

---

## Flujo único (máquina limpia)

```bash
cp .env.example .env
# Rellena SUPABASE_* / VITE_SUPABASE_* y PS002_EMAIL / PS002_PASSWORD en .env (local · gitignored)

npm install
npm run bootstrap:e2e          # Playwright + chromium_headless_shell

# Terminal 1
VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080

# Terminal 2
npm run test:ps002-canonical-auth
```

Sin `export` manual. Sin instalaciones ad-hoc no documentadas.

---

## Credenciales

| Archivo | Contenido |
|---------|-----------|
| `.env.example` (versionado) | `PS002_EMAIL=` · `PS002_PASSWORD=` (vacíos) |
| `.env` (gitignored) | Valores reales locales — **nunca** en git |

---

## Preflight (antes del test)

El runner comprueba, en orden, y sale **BLOCKED** con mensaje claro si falla:

1. Existe `.env`  
2. `PS002_EMAIL`  
3. `PS002_PASSWORD`  
4. Playwright disponible  
5. Chromium / `headless_shell` instalado (`npm run bootstrap:e2e`)  
6. Dev server responde  

No lanza stacks largos de Node por precondiciones de entorno.

---

## Objetivo de producto

1. Auth Supabase real (contrato PASS)  
2. Sesión tras kill/reopen (Web + Android + iPhone)  
3. Consistencia entre plataformas  
4. Sin fricción innecesaria  

---

## Tras PASS

1. Smoke nativo estricto  
2. Pedido → cocina → reparto  
3. Beta EatClean  

FLOW-01 ⏸ hasta PS-002-C PASS.

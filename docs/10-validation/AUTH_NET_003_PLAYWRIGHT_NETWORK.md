# AUTH-NET-003 · Playwright network evidence

**Fecha:** 2026-08-02  
**Alcance:** Instrumentación del runner PS-002-C **solo** — no Auth · no FCR-008 · no roles  
**Pregunta:** ¿El Chromium de Playwright llama a  
`https://djangucecsphnejplvic.supabase.co/auth/v1/token`  
o a otra URL / falla con `net::ERR_*`?

---

## Contexto

| Contexto | Evidencia |
|----------|-----------|
| Chrome manual | `POST …/token` → **200** + JWT |
| Playwright | `LOGIN` → `STOP` · `Failed to fetch` · sin `LOGIN_OK` |
| Código | Único await antes de `LOGIN_OK` = `signInWithPassword` |

Hipótesis principal: **contexto Playwright ≠ Chrome** (URL de bundle, red, CORS, intercept).

Incidencia aparte (no bloquea este gate): `HEAD /rest/v1/support_notes` → 400 — anotar, no mezclar.

---

## Qué captura

`attachPs002cNetworkCapture` en `scripts/ps002-canonical-auth.mjs`:

- Todas las request/response/`requestfailed` de la página  
- Fase `post_submit` marcada justo antes del click Entrar  
- Foco en `auth/v1/token` + hosts `*.supabase.co`  
- Headers sensibles y JWT **redactados**

Evidencia JSON: `auth_net_003` en `ps002c-canonical-auth.json`.  
Consola FAIL: bloque `AUTH-NET-003 · Playwright network…`.

---

## Cómo leer

| Señal | Conclusión |
|-------|------------|
| `wrongHost` no vacío | Bundle apunta a otro proyecto / URL mala |
| `failure.errorText` = `net::ERR_…` en host oficial | Red/contexto Playwright (no “Auth data”) |
| `status: 200` + `hasAccessToken` en Playwright | El fetch Auth OK → buscar fallo post-200 / otro request |
| `authToken` count = 0 | Click no llegó a `signInWithPassword` o captura incompleta |

---

## Uso

```bash
npm run test:ps002-canonical-auth
# ver consola AUTH-NET-003 o JSON auth_net_003.authTokenRequests
```

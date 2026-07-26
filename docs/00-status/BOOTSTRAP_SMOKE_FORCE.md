# Bootstrap Mode · Diagnostic Smoke (FORCE ON)

**Estado:** TEMPORAL · no permanente  
**Fecha:** 2026-07-26  
**Código:** `src/bootstrap/flag.ts` → `BOOTSTRAP_SMOKE_FORCE_ON = true`

---

## Por qué

Captura en `/auth` (login) sin selector ni panel DEV → Bootstrap Mode **no se está activando** en la preview observada.

Hipótesis (sin tocar Auth ni Supabase):

| | |
|--|--|
| **Caso 1** | Lovable no inyecta `VITE_BOOTSTRAP_MODE=true` en compile |
| **Caso 2** | La preview no corresponde al commit con Bootstrap |

---

## Prueba

`isBootstrapMode()` ignora env y **siempre** retorna `true`.

Árbol esperado (ya cableado en `__root.tsx`):

```text
IdentityProvider
 └─ BootstrapIdentityProvider   (porque flag = true)
     └─ BootstrapShell
         ├─ BootstrapModeBanner
         └─ BootstrapProfileSelector   (si no hay perfil)
            o app + BootstrapDevPanel
```

---

## Lectura del resultado

### Mundo A — aparece banner + selector / panel DEV

→ El código Bootstrap **sí** se ejecuta.  
→ Fallo = inyección de variables de entorno en Lovable.  
→ Siguiente: configurar `VITE_BOOTSTRAP_MODE=true` en el entorno Lovable y **revertir** este force.

### Mundo B — sigue `/auth` login

→ La preview **no** es este commit.  
→ **Parar** cambios de aplicación.  
→ Investigar sync GitHub ↔ Lovable / rebuild / commit desplegado.

---

## Revert obligatorio

Tras la prueba:

1. `BOOTSTRAP_SMOKE_FORCE_ON = false` (o eliminar la constante).
2. Restaurar tests env-based en `flag.spec.ts`.
3. Nunca dejar force-on en producción.

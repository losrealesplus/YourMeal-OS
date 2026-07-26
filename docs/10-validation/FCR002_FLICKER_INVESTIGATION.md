# FCR-002 · Titileo / vibración — investigación

**Severidad:** P1  
**Estado:** Hipótesis priorizadas — **sin fix en este PR**  
**Contexto:** Functional Review Mode · Centro de Operaciones

---

## Síntoma

Vibración / titileo durante la navegación en Ops (capturas Bootstrap).

---

## Búsqueda realizada

| Patrón | Hallazgos relevantes |
|--------|----------------------|
| `refetchInterval` | `use-upcoming-delivery.ts` → `60_000` (Customer Home; poco probable causa Ops) |
| `setInterval` | No en shell Ops |
| `setTimeout` | Debounce en `admin.customers` / `admin.support` — no continuo |
| `navigate()` en `useEffect` | `index`, `auth*`, `saas.tsx` sign-out — no loop obvio en `/admin` |
| `router.invalidate()` | `__root`, `supabase-identity-provider`, **`bootstrap-identity-provider`** (al cambiar perfil) |
| Animaciones | `animate-fade-in` en muchas rutas admin; **`ops-home-in`** (translateY) en `admin.index.tsx` |

---

## Hipótesis #1 (alta probabilidad) — deps inestables en Ops Home

`src/routes/_authenticated/admin.index.tsx`:

```ts
useEffect(() => { /* fetch counts; setLoading(true/false) */ }, [
  user, tenantId, roles, can, date, showKitchen, ...
]);
```

`useCan()` devuelve un **nuevo** `can` en cada render:

```ts
// src/hooks/use-can.ts
return { can: (capability) => can(roles, capability), ... };
```

Efecto: cada render → efecto se re-ejecuta → `setLoading(true)` → re-render → efecto otra vez.  
La animación `ops-home-in` / `animate-fade-in` se re-dispara → **titileo visual**.

**Fix candidato (bloque render, no este PR):** estabilizar `can` (`useCallback`) o quitar `can` de deps y depender solo de `roles`.

---

## Hipótesis #2 (media) — remount por `router.invalidate`

`BootstrapIdentityProvider` llama `router.invalidate()` en cada evento `subscribeBootstrapAuth`.  
Al cambiar perfil es correcto; si algo notificara listeners en bucle, remountaría el árbol.  
El DEV panel **no** hace polling; solo `navigate` al cambiar select.

---

## Hipótesis #3 (baja en Ops) — polling React Query

Único `refetchInterval` encontrado: 60s en upcoming delivery (Customer). No explica titileo continuo en `/admin`.

---

## Hipótesis #4 — CSS de entrada

`ops-home-in` mueve `translateY(6px)`. Si el nodo remonta a >1 Hz, se percibe como vibración aunque el layout sea estable.

---

## Cómo confirmar (operador / DevTools)

1. Abrir `/admin` como Company Admin (Bootstrap).
2. React Profiler / highlight updates — ¿Ops Home parpadea sin interacción?
3. Comentar temporalmente (solo local) deps `can` o las keyframes — ¿desaparece?
4. Ocultar DEV panel (CSS) — ¿persiste? (esperado: sí, si H1 es cierta)

---

## Decisión

No aplicar fix hasta cerrar más hallazgos del bloque «Render».  
Prioridad del bloque: FCR-002 H1 primero.

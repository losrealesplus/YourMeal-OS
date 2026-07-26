# FCR-002 · Render Stability Regression

**Severidad:** P1  
**Clasificación:** Render Stability Regression (no «solo titileo»)  
**Síntoma visible:** titileo / parpadeo / vibración en Ops  
**Estado:** Hipótesis priorizadas — **sin fix en este PR**  
**Contexto:** Functional Review Mode · Centro de Operaciones

---

## Nota metodológica

| | |
|--|--|
| **Síntoma** | Titileo / parpadeo |
| **Clase de defecto** | **Render Stability Regression** |
| **Causa sospechada** | Render loop inducido por dependencia inestable |

No clasificar el hallazgo solo por el síntoma visual.  
ORR y el bloque de fixes deben atacar la estabilidad de render, no «quitar la animación».

---

## Cadena sospechada

```text
render
  → useCan()  (nueva referencia de `can`)
  → useEffect([…, can, …])
  → setLoading(…)
  → render
  → useCan()
  → …
```

Patrón: **render loop inducido por dependencia inestable**.

---

## Búsqueda realizada

| Patrón | Hallazgos relevantes |
|--------|----------------------|
| `refetchInterval` | `use-upcoming-delivery.ts` → `60_000` (Customer; poco probable en Ops) |
| `setInterval` | No en shell Ops |
| `setTimeout` | Debounce customers/support — no continuo |
| `navigate()` en `useEffect` | Auth/index — no loop obvio en `/admin` |
| `router.invalidate()` | Bootstrap al cambiar perfil (esperado) |
| Animaciones | `ops-home-in` / `animate-fade-in` — **amplifican** el síntoma al remount; no son la causa raíz |

---

## Hipótesis #1 (alta) — deps inestables en Ops Home

`src/routes/_authenticated/admin.index.tsx` incluye `can` en el array de deps del `useEffect` de contadores.

`useCan()` devuelve un **nuevo** `can` en cada render → el efecto se re- dispara → `setLoading` → re-render.

**Fix candidato (bloque Render Stability, no ahora):** estabilizar `can` o depender de `roles` (valores), no de la identidad de la función.

---

## Hipótesis #2 (media) — remount por `router.invalidate`

Solo al cambiar identidad Bootstrap. No explica titileo en idle si no hay eventos de auth.

---

## Hipótesis #3 (baja) — polling

Único `refetchInterval` 60s en Customer Home.

---

## Cómo confirmar

1. `/admin` Company Admin — ¿parpadea sin interacción?
2. Profiler: ¿Ops Home re-renderiza en bucle?
3. Quitar `can` de deps (solo local) — ¿desaparece el loop?
4. Ocultar DEV panel — esperado: el síntoma **persiste** si H1 es cierta

---

## Decisión

Sin fix hasta el bloque «Render stability». Prioridad: H1.

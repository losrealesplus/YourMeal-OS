# MC-005 — Cardinalidad y paralelismo (solo docs) · aparcado

**Validation Report:** [VR-005](../05-validation-reports/VR-005-escalabilidad-eatclean.md)  
**Fecha:** 2026-07-22  
**Capa afectada:** UL / level-2 Supporting / spine-flow cardinalidades — **texto**, no nuevos objetos  
**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22

---

## Problema demostrado

VS-005: el modelo **soporta** escala; la documentación puede leerse como si Kitchen/Vehicle/paralelismo fueran 1:1 implícitos.

---

## Cambio propuesto (borrador)

1. **Kitchen / Vehicle:** Organization **owns** 1..n; «a menudo 1» = default de arranque, no Invariant.  
2. **spine-flow / state-index:** explicitar Batches y Routes **en paralelo** bajo el mismo Plan / día.  
3. **Batch:** puede registrar Kitchen + ventana horaria (atributo) sin objeto Shift.  
4. **Rechazos canónicos:** Shift · Wave · Session · Order Bundle · Super-Route como Core — no entrar sin VR Contradicted/Extended con evidencia de capacidad nueva (no volumen).

---

## Impacto

| | |
|--|--|
| Core Objects | 0 |
| Invariants | 0 nuevos |
| Lifecycles | 0 |

**Estado:** ✅ **aplicado** — tren Dynamics post [09 joint gap analysis](../09-joint-gap-analysis.md) — 2026-07-22

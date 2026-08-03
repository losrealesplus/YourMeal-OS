# CAPACITOR-002 · C2 Native Shell · Acta

**Documento:** `CAPACITOR_002_C2_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** CAPACITOR-002  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN** (#250)  
**Precondición:** [CAPACITOR_001_C1_ACTA](./CAPACITOR_001_C1_ACTA.md) ✅ · Gate ✅ · Land Check C1 on `main` @ `4656bd4`  
**Nivel:** Distribution · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Ready for Native Shell → **Ready for Android/iOS**.  
> No C3 Android · no C4 iOS · no `cap add` · no stores · Core Integrity.

---

## Pregunta certificada

> ¿Queda integrado el Native Shell de Capacitor sobre el Core (C2)?

---

## Contrato observado

```text
CAPACITOR_C1_COMPLETED      ✔
CAPACITOR_C2_STARTED        ✔ (exactly once)
CAPACITOR_C2_COMPLETED      ✔ (exactly once)
CAPACITOR_C3_STARTED        BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for Native Shell (outcome C1)
  ↓
Shell init representado (capacitor.config.ts · CapacitorConfig)
  ↓
Sync path (npx cap sync / sync:mobile)
  ↓
Web → Shell pipeline (build:mobile)
  ↓
Web ↔ Shell bridge (@capacitor/core · isNativePlatform)
  ↓
Shell artifact verifier
  ↓
END · Ready for Android / iOS
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| C1 CERTIFIED | ✅ |
| Gate autoriza CAPACITOR-002 | ✅ |
| Native Shell config (init) presente | ✅ |
| Shell sync script presente | ✅ |
| Mobile build pipeline presente | ✅ |
| Web ↔ Shell bridge presente | ✅ |
| Shell artifact verifier presente | ✅ |
| Spec C2 → Ready for Android/iOS | ✅ |
| Sin certificar android/ · ios/ · C3+ | ✅ |
| Runner: PASS through C2 · BLOCKED at C3 | ✅ |

---

## Comandos

```bash
npm run test:capacitor-002
# → PASS through C2 · blocked_at=CAPACITOR_C3_STARTED · exit 0

npm run test:capacitor
# → PASS through C2 · blocked_at=CAPACITOR_C3_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Init / config | `capacitor.config.ts` |
| Sync | `package.json` (`cap:sync` · `sync:mobile`) |
| Build pipeline | `package.json` (`build:mobile`) |
| Bridge | `src/platform/device-capabilities/resolve.ts` |
| Verifier | `scripts/verify-mobile-shell.mjs` |
| C2 driver | `scripts/lib/capacitor-c2-native-shell.mjs` |
| Runner | `CERTIFIED_THROUGH=2` |
| Evidence | `docs/10-validation/capacitor/evidence/capacitor-002-canonical-live.json` |

**Nota:** `android/` / `ios/` pueden existir por spikes previos.  
C2 **no** los certifica — C3 / C4.

---

## Regla

```text
C2: Ready for Native Shell → Ready for Android/iOS.
Core Integrity: no altera el comportamiento funcional del Core.
No consume C3/C4 (cap add · builds nativos).
```

---

## Siguiente

Land Check desde `main` → **CAPACITOR-003 · C3 Android Build** only.

---

## End of CAPACITOR-002 Acta

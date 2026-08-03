# CAPACITOR-004 · C4 iOS Platform · Acta

**Documento:** `CAPACITOR_004_C4_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** CAPACITOR-004  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN** (#250) · bloque Spec **C4 · iOS Build**  
**Precondición:** [CAPACITOR_003_C3_ACTA](./CAPACITOR_003_C3_ACTA.md) ✅ · Gate ✅ · Land Check C3 on `main` @ `99985a8`  
**Nivel:** Distribution · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Ready for iOS → plataforma iOS válida → **Ready for Acceptance**.  
> Representa `npx cap add ios` por presencia del proyecto.  
> No IPA · no simuladores · no App Store · no certificados · no C5.

---

## Pregunta certificada

> ¿Existe una plataforma iOS válida y sincronizable con el Native Shell (C4)?

---

## Contrato observado

```text
CAPACITOR_C1…C3_COMPLETED   ✔
CAPACITOR_C4_STARTED        ✔ (exactly once)
CAPACITOR_C4_COMPLETED      ✔ (exactly once)
CAPACITOR_C5_STARTED        BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for iOS (outcome C3)
  ↓
Proyecto ios/ presente (cap add representado)
  ↓
App.xcodeproj · capacitor.config.json
  ↓
CapApp-SPM · Capacitor product
  ↓
@capacitor/ios · cap open/sync preparados
  ↓
END · Ready for Acceptance (Spec C4)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| C3 CERTIFIED | ✅ |
| Gate autoriza CAPACITOR-004 | ✅ |
| ios/ platform presente | ✅ |
| Xcode project presente | ✅ |
| capacitor.config.json (iOS) presente | ✅ |
| CapApp-SPM · Capacitor presente | ✅ |
| @capacitor/ios dependency presente | ✅ |
| cap open/sync script presente | ✅ |
| Spec C4 → Ready for Acceptance | ✅ |
| Sin IPA / App Store / C5 | ✅ |
| Runner: PASS through C4 · BLOCKED at C5 | ✅ |

---

## Comandos

```bash
npm run test:capacitor-004
# → PASS through C4 · blocked_at=CAPACITOR_C5_STARTED · exit 0

npm run test:capacitor
# → PASS through C4 · blocked_at=CAPACITOR_C5_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| iOS project | `ios/App/` |
| Xcodeproj | `ios/App/App.xcodeproj/` |
| Cap config | `ios/App/App/capacitor.config.json` |
| SPM | `ios/App/CapApp-SPM/Package.swift` |
| Dep | `package.json` (`@capacitor/ios`) |
| Scripts | `cap:open:ios` · `cap:sync` |
| C4 driver | `scripts/lib/capacitor-c4-ios-platform.mjs` |
| Runner | `CERTIFIED_THROUGH=4` |
| Evidence | `docs/10-validation/capacitor/evidence/capacitor-004-canonical-live.json` |

---

## Regla

```text
C4: Ready for iOS → iOS Platform → Ready for Acceptance.
Core Integrity: no altera el comportamiento funcional del Core.
No consume C5 (Acceptance) · no IPA · no App Store · no certificados Apple.
```

---

## Siguiente

Land Check desde `main` → revisar `npx cap add ios` / `cap sync ios` / `cap open ios` (Terminal · Xcode) → **CAPACITOR-005 · C5 Acceptance** only.

---

## End of CAPACITOR-004 Acta

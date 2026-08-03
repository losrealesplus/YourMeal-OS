# CAPACITOR-001 · C1 Platform Preparation · Acta

**Documento:** `CAPACITOR_001_C1_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** CAPACITOR-001  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN** (#250)  
**Precondición:** DoR ✅ · Spec ✅ · Runner + Gate land on `main` (este PR) · `flow05-pass`  
**Nivel:** Distribution · YourMeal OS (tenant-agnostic)

> Certifica **una** transición de Distribution: React/Vite SaaS → **Ready for Native Shell**.  
> No C2 Native Shell · no android/ios certify · no stores · Core Integrity.

---

## Pregunta certificada

> ¿Queda el proyecto preparado para aceptar Capacitor (C1 · Platform Preparation)?

---

## Contrato observado

```text
CAPACITOR_C1_STARTED        ✔ (exactly once)
CAPACITOR_C1_COMPLETED      ✔ (exactly once)
CAPACITOR_C2_STARTED        BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · React / Vite SaaS certificado
  ↓
Dependencias oficiales (@capacitor/core · @capacitor/cli)
  ↓
Configuración institucional (capacitor.config.ts)
  ↓
App ID · App Name · webDir (.output/public)
  ↓
Compatibilidad Vite (CAPACITOR_BUILD)
  ↓
Core Web intacto (build / build:web)
  ↓
END · Ready for Native Shell
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Gate autoriza CAPACITOR-001 | ✅ |
| @capacitor/core presente | ✅ |
| @capacitor/cli presente | ✅ |
| capacitor.config.ts presente | ✅ |
| App ID definido | ✅ |
| App Name definido | ✅ |
| webDir = `.output/public` | ✅ |
| Vite CAPACITOR_BUILD compat | ✅ |
| Web build script intacto | ✅ |
| Spec C1 → Ready for Native Shell | ✅ |
| Sin certificar android/ · ios/ · C2+ | ✅ |
| Runner: PASS through C1 · BLOCKED at C2 | ✅ |

---

## Comandos

```bash
npm run test:capacitor-001
# → PASS through C1 · blocked_at=CAPACITOR_C2_STARTED · exit 0

npm run test:capacitor
# → PASS through C1 · blocked_at=CAPACITOR_C2_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Config | `capacitor.config.ts` |
| Vite dual build | `vite.config.ts` (`CAPACITOR_BUILD`) |
| Deps | `package.json` (`@capacitor/core` · `@capacitor/cli`) |
| C1 driver | `scripts/lib/capacitor-c1-platform-preparation.mjs` |
| Capability driver | `scripts/lib/capacitor-capability-driver.mjs` |
| Runner | `CERTIFIED_THROUGH=1` |
| Evidence | `docs/10-validation/capacitor/evidence/capacitor-001-canonical-live.json` |

**Nota:** Pueden existir directorios `android/` / `ios/` de spikes previos (MF-001).  
C1 **no** los certifica — pertenecen a C2+ (Native Shell / builds).

---

## Regla

```text
Cada bloque certifica exactamente una transición de Distribution.
C1: SaaS web → Ready for Native Shell.
Core Integrity: no altera el comportamiento funcional del Core.
No consume C2.
```

---

## Siguiente

Land Check desde `main` → **CAPACITOR-002 · C2 Native Shell** only.

---

## End of CAPACITOR-001 Acta

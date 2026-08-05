# DEVELOPER-PLATFORM-01 · Specification

**Documento:** `DEVELOPER_PLATFORM_01_SPEC.md`  
**Fecha:** 2026-08-05  
**Estado:** ✅ **OPEN** · Spec ✅ · Runner ✅ · Capability Drivers ✅ · Tests ✅  
**Dominio:** **Platform** · Developer Experience / Environment Integrity  
**Nivel:** Developer Platform · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿YourMeal OS puede certificar que el entorno de desarrollo (Node, toolchain Android, Capacitor, Vite, assets, runtime, Git, red, Supabase) es coherente y operable antes de tocar Core, Capacitor o Mobile Release?  
**Runner:** `npm run doctor` · `scripts/developer/index.mjs`  
**Estándar:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Precondiciones:** repo YourMeal OS · `package.json` type=module  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md)

> Developer Platform **no** es funcionalidad de negocio.  
> Developer Platform **no** reescribe Capacitor ni Mobile Release.  
> Developer Platform certifica la **integridad del entorno de desarrollo** como Capability Drivers verificables.  
> **Core Integrity Rule** · Evidence before Implementation · No Artificiality.

---

## Pregunta de dominio

> ¿YourMeal OS certifica el entorno de desarrollo  
> (Environment → Node → Java → Gradle → Android SDK → Capacitor → Vite → Assets → Runtime → Git → Network → Supabase)  
> como un contrato `DEVELOPER_PLATFORM_D*` verificable, sin modificar pipelines de Distribution?

No: *¿compila el APK?* · *¿pasa FLOW-05?* · *¿está el Core listo?*  
Sí: *¿el ingeniero / CI puede demostrar evidencia de un entorno coherente con un solo comando?*

Separación de responsabilidades:

```text
Capacitor          → ¿puede ejecutarse como app nativa?
MOBILE-RELEASE-01  → ¿puede distribuirse de forma profesional y repetible?
DEVELOPER-PLATFORM → ¿el entorno de desarrollo está íntegro para trabajar?
```

---

## 1. Contract Boundary (inmutable tras Freeze)

### Principio arquitectónico

```text
Developer Platform (doctor)
    ↓
Evidence of environment integrity
    ↓
Safe work on Core / Capacitor / Mobile Release
```

**Nunca** modifica:

- `scripts/capacitor-canonical.mjs` ni `scripts/lib/capacitor-*`
- `scripts/mobile-release-canonical.mjs` ni `scripts/lib/mobile-release-*`
- RELEASE / FLOW canonical runners
- Product runtime behaviour (solo **lee** anclas de assets / consistency)

### START

```text
START = YourMeal OS repository checkout
        (package.json · scripts/ · src/)
```

### END

```text
END = Doctor PASS
      (todos los módulos ok · exit code 0)
      + evidencia imprimible / JSON
```

### Freeze rule

```text
Toda modificación del recorrido de módulos DEBE cambiar este Spec.
NO se amplía ad-hoc con scripts .sh sueltos.
NO se acopla a Capacitor / Mobile Release pipelines.
```

### Core Integrity Rule

```text
Developer Platform puede añadir tooling de diagnóstico.
Nunca puede modificar el comportamiento certificado del Core SaaS
ni los pipelines de Distribution.
```

| Implica | |
|---------|---|
| Sí | Lectura de paths · versiones · env · reports · tests del doctor |
| No | Cambiar contratos FLOW / RELEASE / Capacitor / Mobile Release |
| Si un cambio altera Distribution o Core | **Deja de pertenecer a Developer Platform** |

---

## 2. Canonical pipeline

```text
D1  Environment
D2  Node / npm
D3  Java
D4  Gradle wrapper
D5  Android SDK + ADB
D6  Capacitor (read-only)
D7  Vite
D8  Assets
D9  Runtime consistency anchors
D10 Git
D11 Network
D12 Supabase configuration
```

```text
Repo checkout
      │
      ▼
Doctor modules (D1–D12)
      │
      ▼
Aggregate report
      │
      ▼
exit 0 ⇔ every module ok
```

---

## 3. Capability Drivers

Cada módulo exporta `runDoctor<Name>(options?)` y retorna:

```text
{
  ok: boolean,
  checks: [{ id, ok, detail? }],
  evidence: {},
  warnings: [],
  errors: []
}
```

| Driver | Module | Qué demuestra |
|--------|--------|----------------|
| D1 | `doctor-environment.mjs` | Raíz del repo · `package.json` type=module · `scripts/developer/` |
| D2 | `doctor-node.mjs` | Node ≥ 20 · npm en PATH |
| D3 | `doctor-java.mjs` | Java ≥ 17 (soft en `--ci`) |
| D4 | `doctor-gradle.mjs` | `android/gradlew` + wrapper props (soft en `--ci`) |
| D5 | `doctor-android-sdk.mjs` | SDK root · platforms · adb (soft en `--ci`) |
| D6 | `doctor-capacitor.mjs` | config + deps Capacitor + `android/` (solo lectura) |
| D7 | `doctor-vite.mjs` | `vite.config.*` · scripts build/dev |
| D8 | `doctor-assets.mjs` | logo local · sin `.asset.json` Lovable · TenantLogo limpio |
| D9 | `doctor-runtime.mjs` | `ymos-runtime-assets` + `ymos-runtime-consistency` |
| D10 | `doctor-git.mjs` | git repo · branch · status |
| D11 | `doctor-network.mjs` | HTTP reachability hacia URL Supabase / probe |
| D12 | `doctor-supabase.mjs` | `.env.example` VITE_* · client.ts |

Orquestación: `scripts/developer/index.mjs` · informe: `doctor-report.mjs` · alias CLI: `doctor.mjs`.

---

## 4. Evidence

Evidencia **antes** de implementar cambios de producto:

| Señal | Fuente |
|-------|--------|
| Versiones toolchain | `evidence.*Version` por módulo |
| Paths canónicos | `capacitor.config.ts`, `vite.config.ts`, logo, runtime dirs |
| Soft vs hard | `--ci` / `--soft-android` → warnings, no FAIL por Android ausente |
| Aggregate | `status=PASS|FAIL` · `failed_modules=[]` · JSON completo con `--json` |

No se escribe evidencia en `docs/10-validation/` en v1 (extensión futura).

---

## 5. Acceptance Criteria

1. Existe `scripts/developer/` con los módulos listados en §3.
2. `npm run doctor` imprime un reporte estilo runners canónicos y sale `0` solo si todos los módulos pasan.
3. `npm run doctor:ci` · `doctor:json` · `doctor:info` están cableados en `package.json` sin romper scripts existentes.
4. No se modifica Capacitor ni Mobile Release.
5. Cada módulo tiene spec bajo `scripts/developer/*.spec.mjs`; el runner tiene integration spec.
6. `npm run test:doctor:unit` PASS; `npm test` runs vitest (`src/`) then the doctor suite (`scripts/**` excluded from vitest — node:test convention).

---

## 6. Runner Modes

| Comando | Comportamiento |
|---------|----------------|
| `npm run doctor` | Default local · Android toolchain requerido |
| `npm run doctor:ci` | `--ci` · Android soft · apto CI |
| `npm run doctor:json` | Solo JSON en stdout |
| `npm run doctor:info` | `--verbose` / `--info` · cada check |
| flags | `--skip-network` · `--strict-android` · `--soft-android` |

Exit codes:

| Code | Meaning |
|------|---------|
| 0 | PASS — todos los módulos `ok` |
| 1 | FAIL — al menos un módulo con errors hard |

---

## 7. Future extensions

- Escritura de evidence pack en `docs/10-validation/developer/`
- Módulo iOS / Xcode doctor
- Integración opcional en GitHub Actions preflight
- DoR + Gate formales (`DEVELOPER_PLATFORM_01_DOR` / `GATE`)
- Deep probe Supabase live (auth) separado del doctor estructural

---

## 8. Non-goals (v1)

- Compilar APK / firmar / sync Capacitor
- Sustituir `bootstrap:verify` o runners FLOW/RELEASE
- Mutar `.env` o secretos
- “Arreglar” el entorno automáticamente

---

**Evidence before Implementation.**  
**One capability · one driver · one report.**

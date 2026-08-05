# Doctor Engine

**Documento:** `DOCTOR_ENGINE.md`  
**Track:** DEVELOPER-PLATFORM-004  
**Producto:** YourMeal OS **Developer Platform v1.1**  
**Código:** `src/runtime/runtime-doctor/`  
**ADR:** [0040 — Doctor Engine](../adr/0040-doctor-engine.md)  
**Host:** [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md) · **Kernel:** [RUNTIME_CORE](./RUNTIME_CORE.md)

> Doctor no conoce checks.  
> Los checks se registran con `registerCheck()` — igual que los módulos con `registerModule()`.

---

## Vocabulario oficial

| Pieza | Rol |
|-------|-----|
| **Developer Portal** | Puerta de entrada del equipo técnico |
| **Developer Platform** | Producto de diagnóstico y soporte |
| **Runtime Engine** | Kernel: Registry · Evidence · Events · Modules |
| **Runtime Host** | Shell dinámico que pinta módulos del Registry |
| **Doctor Engine** | Motor de capabilities → checks → evidence → recommendations |

El término histórico “Runtime Suite” sigue siendo la superficie overlay; el producto se nombra **YourMeal OS Developer Platform**.

---

## Arquitectura

```text
Doctor
  │
  ▼
Capabilities
  │
  ▼
Checks          ← registerCheck()
  │
  ▼
Evidence        ← FOPEBA (fail / warning)
  │
  ▼
Recommendations
  │
  ▼
Export          ← prepare via module.export() · ZIP later
```

```text
registerDoctorModule()
        │
        ├── registerBuiltinDoctorChecks()
        ├── registerModule({ id: "doctor", category: "Health" })
        └── registerModuleRenderer("doctor", DoctorPanel)
```

---

## Contrato `DoctorCheck`

```ts
type DoctorCheck = {
  id: string
  name: string
  capability: DoctorCapabilityId
  severity: RuntimeSeverity
  supports?: ("web" | "android" | "ios")[]
  soft?: boolean
  run(ctx): DoctorCheckResult | Promise<DoctorCheckResult>
}
```

Resultado: `pass` · `warning` · `fail` · `info` · `skip` + `message` + `payload?` + `recommendations?`.

---

## Health Score

```text
skip → excluido
pass / info → 1.0
warning → 0.5
fail → 0.0
```

Score = `round(earned / possible * 100)`.

---

## Capabilities (orden Host Doctor)

Runtime · Assets · Branding · Android · iOS · Supabase · Network · Storage · Session · Performance · Security · Developer

Foundation checks (este PR): Runtime, Assets, Branding, Android (probe), Supabase (env).

Futuros PRs **solo** añaden `registerCheck()` — no editan el Engine.

---

## FOPEBA Evidence

Cada `fail` / `warning` emite `RuntimeEvidence` con:

`timestamp` · `device` · `platform` · `module` · `check` · `severity` · `payload`

Base para Issue Registry / Knowledge Engine posteriores.

---

## Relación con CLI Doctor

`npm run doctor` (scripts/developer) sigue siendo el doctor de **toolchain** (Node, Vite, Gradle, SDK).

El **Doctor Engine** es el doctor de **runtime de aplicación** dentro del Host.

Complementarios · no sustitutos.

---

## Cómo añadir un check

```ts
registerCheck({
  id: "network.http-ok",
  name: "HTTP probe",
  capability: "network",
  severity: "error",
  run: async () => ({ status: "pass", message: "ok" }),
})
```

Sin tocar `DoctorRunner` ni `DoctorPanel`.

---

## Non-goals (este PR)

- Export ZIP  
- Knowledge Engine / Issue Registry  
- Network / Storage / Session / Performance suites completas  
- Sustituir CLI doctor  
- Cambios Assets/DOM/Consistency engines · Android nativo

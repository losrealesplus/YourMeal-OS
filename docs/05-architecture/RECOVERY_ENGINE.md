# Recovery Engine

**Documento:** `RECOVERY_ENGINE.md`  
**Track:** DEVELOPER-PLATFORM-010  
**Producto:** YourMeal OS **Developer Platform v1.7**  
**Código:** `src/runtime/recovery-engine/`  
**ADR:** [0046 — Recovery Engine](../adr/0046-recovery-engine.md)  
**Roadmap:** [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md)

> Recovery **no** significa reparar.  
> Recovery significa ejecutar un flujo controlado.  
> Cada Capability decide qué puede recuperar; el Engine solo orquesta.

---

## Arquitectura

```text
Recommendation
      │
      ▼
Recovery Engine
      │
      ├── Capability.recover()
      │
      ├── Capability.verify()
      │
      └── Recovery Report → Timeline → Evidence
```

```text
Developer Portal → Host → Capability → Doctor → Evidence → Incident
  → Knowledge → Recommendation → Recovery → Verify
```

El Recovery Engine **solo conoce**:

- Capability Engine  
- Recommendation Engine  

**Nunca** conoce Assets · Android · Supabase · Branding · Storage.

**Nunca modifica** Doctor · Incident · Knowledge.

---

## Contrato

```ts
type RuntimeRecovery = {
  id: string;
  capabilityId: string;
  recommendationId: string;
  startedAt: number;
  finishedAt?: number;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  verifyResult?: RuntimeVerificationResult;
  evidences: string[];
};
```

---

## Componentes

| Componente | Rol |
|------------|-----|
| `RecoveryEngine` | API pública (`runRecovery`, `verifyRecovery`, `cancelRecovery`, history/export) |
| `RecoveryRunner` | Ejecuta `recover()` → `verify()` |
| `RecoveryRegistry` / `RecoveryHistory` | Historial en memoria + timeline |
| `RecoveryPolicy` | Resuelve capability recuperable desde recommendation |
| `RecoveryResult` | Alias de `RuntimeRecovery` |

---

## API

| Método | Rol |
|--------|-----|
| `runRecovery({ recommendationId })` | Orquesta recover → verify → evidence |
| `verifyRecovery(id)` | Lee resultado de verify (si existe) |
| `cancelRecovery(id)` | Cancela pending/running |
| `getRecoveryHistory()` | Historial en memoria |
| `exportRecoveryHistory()` | Array JSON-serializable |
| `exportRecoveryHistoryDocument()` | Documento JSON (history + timeline) |

---

## Flujo oficial

```text
Recommendation (recovery.supported = true)
  → Run Recovery (manual)
  → Capability.recover(ctx)
  → Capability.verify(ctx)
  → Recovery Report
  → Timeline (Started → Finished → Verify PASS/FAIL → Evidence Linked)
  → Evidence
```

Si `recover` es `undefined` → **Recovery Not Supported** (sin throw).

---

## Lifecycle

```text
pending → running → success | failed
                  ↘ cancelled
```

Toda recuperación es **iniciada manualmente** por el usuario. No hay Automatic Recovery.

---

## Verify

Tras `recover()`, el Runner llama `verify()` si existe.  
El resultado se adjunta a `RuntimeRecovery.verifyResult` y se registra en timeline (`verify-pass` / `verify-fail`).

---

## Integración con Recommendation

- Recommendation expone `capabilityIds` + action `type: "recovery"`.  
- `supported = true` cuando alguna capability vinculada implementa `recover()`.  
- Doctor muestra **Run Recovery** si `supported`; si no, **Manual Action**.

---

## Integración con Capability

- Foundation: Assets / Branding / Android / Supabase → `recover = undefined` → Not Supported.  
- **Runtime** es la primera capability recuperable: limpia dismiss de `sessionStorage["ymos.runtime-inspector"]` y verifica que el gate ≠ `"0"`.

---

## Host

Módulo `recovery` · categoría **Recovery**:

Recovery Queue · Running · History · Verify Result · Evidence · Duration · Export JSON

---

## Non-goals

ZIP · Telemetry · Cloud · Remote · AI · Automatic Recovery · recover específico Assets/Android/Supabase

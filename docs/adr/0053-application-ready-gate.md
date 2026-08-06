# ADR 0053 — Application Ready Gate

## Estado

**Accepted** — 2026-08-06  
**Track:** PRODUCT-CORE-004  
**Depends on:** ADR [0050](./0050-bootstrap-pipeline.md) · [0051](./0051-bootstrap-orchestrator.md) · [0052](./0052-stage-ownership.md)  
**Detalle:** [APPLICATION_READY_GATE](../05-architecture/APPLICATION_READY_GATE.md)

## Contexto

Architecture, Orchestrator y Ownership ya definen *qué*, *en qué orden* y *quién*. Faltaba el **latch** de ciclo de vida: impedir que el Product Core (workspaces autenticados) exista antes de que el bootstrap haya terminado.

Sin Gate, la app pinta mientras ocurren cosas — fuente de parpadeos, tenant null y carreras.

## Decisión

1. Introducir **Application Ready Gate** en `src/bootstrap/ready/`.  
2. Estados explícitos: `NOT_STARTED` → `BOOTSTRAPPING` → (`AUTH_REQUIRED` | `READY` | `FAILED`).  
3. **Una sola función de decisión:** `isApplicationReady` / `deriveApplicationReadySnapshot`.  
4. `ApplicationReadyGate` observa `BootstrapResult` + `BootstrapIdentityStore`, publica `application:*` events, y **no inventa UI**.  
5. Product Core entry (`/_authenticated`) llama `ensureApplicationReady()` en `beforeLoad`.  
6. Rutas públicas (auth / landing) permanecen fuera del latch.  
7. No modificar Providers ni lógica de negocio.  
8. Doctor sin cambios (observe-only events).

## Consecuencias

- Todo workspace autenticado depende del Gate.  
- Post-login: identity snapshot `ready` también satisface Ready (cold pipeline pudo quedar en `auth_required`).  
- Siguiente paso natural: smoke test → declarar Product Core Foundation estable.

## Referencias

- `src/bootstrap/ready/*` · `src/routes/_authenticated/route.tsx` · `src/routes/__root.tsx`

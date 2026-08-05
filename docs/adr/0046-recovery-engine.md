# ADR 0046 — Recovery Engine

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-010  
**Producto:** Developer Platform **v1.7**  
**Detalle:** [RECOVERY_ENGINE](../05-architecture/RECOVERY_ENGINE.md)

## Contexto

Con Capability Engine (ADR 0045) y Recommendation Engine (ADR 0044), la plataforma puede decidir *qué* hacer, pero aún no orquestaba *cómo* recuperar. Si Recovery conociera Assets/Android/Supabase directamente, rompería el contrato único de capabilities y no escalaría.

## Decisión

1. Introducir **Recovery Engine** (`RuntimeRecovery`, Runner, History, Policy, Panel).  
2. Recovery **solo orquesta**: Recommendation → `Capability.recover()` → `Capability.verify()` → Report / Timeline / Evidence.  
3. Recovery **no** contiene lógica de reparación de dominio.  
4. Foundation capabilities sin `recover` → **Recovery Not Supported** (sin error).  
5. Primera capability recuperable: **Runtime** (clear dismiss / verify overlay gate).  
6. Host categoría **Recovery**. Doctor muestra **Run Recovery** cuando `action.supported`.  
7. Historial en memoria; export JSON. Sin persistencia.  
8. **No** Automatic Recovery · ZIP · Telemetry · AI.

## Consecuencias

- Cierra el primer ciclo funcional: Diagnose → Evidence → Incident → Knowledge → Recommendation → Recovery → Verify.  
- Momento natural para consolidar **Developer Platform v1.0** antes de ZIP / Telemetry / IA.  
- Cadena unidireccional preservada: Recovery no modifica Doctor / Incident / Knowledge.

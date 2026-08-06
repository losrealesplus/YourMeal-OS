# ADR 0054 — Product Core Foundation Declared

## Estado

**Accepted** — 2026-08-06  
**Track:** PRODUCT-CORE-FOUNDATION-001  
**Detalle:** [PRODUCT_CORE_FOUNDATION_001](../00-status/PRODUCT_CORE_FOUNDATION_001.md)

## Contexto

Tras ADR 0050–0053 (Architecture → Orchestrator → Ownership → Ready Gate), el Product Core tiene un ciclo de vida oficial. No debe abrirse desarrollo de negocio EatClean sin evidencia de que la fundación construye y pasa Doctor.

## Decisión

1. Declarar **Product Core Foundation** como **engineering-validated** en `main`.  
2. Publicar acta FOPEBA con matriz Doctor / tests / web / mobile / APK.  
3. Dejar **Field Smoke (OPPO)** como gate de operador (no fingir evidencia de dispositivo).  
4. Autorizar el cambio de foco de roadmap: **Developer Platform → EatClean Core**, usando la Developer Platform solo como instrumento.  
5. Corregir el único defecto encontrado en validación (`ReadyContext.tsx`).

## Consecuencias

- Nuevos módulos de negocio asumen Bootstrap + Ready Gate.  
- Smoke OPPO cierra la certificación de campo; no bloquea documentación de fundación engineering.  
- No más trabajo de plataforma/fundación salvo bugfix o perf.

## Referencias

- ADR 0050–0053 · tag histórico `developer-platform-v1.0.0`

# Delivery Workspace · Capability Demo

**Track:** OPERATIONAL-006 · Phase 4  
**Status:** ▶ **Capability Demo**  
**ADR:** [0086](../adr/0086-delivery-workspace-demo.md)  
**Route:** `/admin/delivery-workspace`  
**Entry:** `useDelivery()` → `DeliveryFacade`  
**Capability:** `logistics.operate`

```text
Screen
  ↓
useDelivery()
  ↓
DeliveryFacade
  ↓
OrderFacade · KitchenExecutionFacade
```

Never: Workspace → Supabase · Services · Repositories · GPS.

---

## Purpose

Prove the canonical Operational Capability consumption pattern for Delivery — the same pattern as Customer · Order · Production · Kitchen workspaces.

Answer demonstrated:

```text
¿Qué compromisos deben salir del tenant
y cómo aseguramos que llegan correctamente?
```

Delivery is **controlled transfer of responsibility**, not “the courier.”

---

## Demonstrated intents

| Intent | Honesty |
|--------|---------|
| GetDeliveryContext | Composed (ready_for_delivery) |
| GetDeliveryAssignments | Composed |
| GetDeliveryStops | Composed |
| GetCompletedDeliveries | Composed |
| ConfirmDelivery | Composed (`OrderFacade.completeDelivery`) |
| GetDeliveryRoutes | **UNIMPLEMENTED** (explicit) |
| AssignDelivery | **UNIMPLEMENTED** (explicit) |
| StartDelivery | **UNIMPLEMENTED** (explicit) |
| ReportDeliveryException | **UNIMPLEMENTED** (explicit) |
| CloseDelivery | **UNIMPLEMENTED** (explicit) |

Delivery Evidence appears as `DeliveryConfirmation` returned by ConfirmDelivery. Photo/signature kinds are Product UI — not simulated in this Demo.

---

## Laws respected

| Law | How |
|-----|-----|
| FOUNDATION LAW 003 | Screen orchestrates; Facade owns behaviour |
| FOUNDATION LAW 006 | One business question; never plans / cooks / bills |
| FOUNDATION LAW 007 | No bypass of Capabilities |
| PRODUCT LAW 001 | Demo proves operators can fulfill via Capability path (time saved later measured in Field / Tenant Success) |

---

## Explicit non-goals

- No new architecture / contracts  
- No new Commands · Queries · Facades  
- No database changes  
- No business logic in the Workspace  
- No Billing · no GPS · no Product UI polish  

---

## Definition of Done

```text
Delivery demonstrates the canonical Capability consumption pattern.
Delivery becomes Capability Demo.
```

Next Engine block: **Billing Capability** (Architecture → Facade → Certification → Demo) → declare **Operational Engine v1.0 COMPLETE**.

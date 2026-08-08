# CUSTOMER EXPERIENCE 002

**Status:** ▶ **ACTIVE** — Era 2 Experience Sprint  
**Type:** Experience Sprint (build) — **not** Observation Sprint  
**Mission:** **Zero Friction Customer Search**  
**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · EXPERIENCE LAW 001 · EXPERIENCE MANIFESTO 001 · TENANT SUCCESS 001 / 001-A · TEAM LAW 001  
**Card:** [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md) · Customer · Phase 002  
**Surface:** `/admin/customer-workspace` · `useCustomer()` only (LAW 003)  
**Constraint:** Experience **above** Facade — **no** Capability / Facade / Engine / Foundation changes  

```text
Mission
Zero Friction Customer Search

The operator should never browse lists.
The operator searches.
The system finds.
```

```text
Primary KPI
Time-to-Find Customer (TTF) < 10 seconds
```

---

## Why Search before Edit

Frequency rules:

| Action | Typical frequency |
|--------|-------------------|
| Create | Few times / day |
| Edit | Occasional |
| **Search** | **Constant** |

Optimizing Find returns more cumulative time than Edit.

---

## Measurable question

> ¿Puedo encontrar un cliente en menos de 10 segundos?

---

## Behaviour (shipped)

* Results update while typing — no Search button  
* Partial · case-insensitive · phone fragments · company names (via existing Facade search)  
* Sources: name · phone · company · company employee · recent (empty query)  
* Result **Customer Card** identifies without opening: name · type · company · phone · area · status  
* **Quick Actions:** Open · Create Order · Call · (WhatsApp / Directions future)  
* **Empty state:** No customer found → primary **Create Customer** — no dead end  

---

## Operational Time Saved

| Field | Value |
|-------|-------|
| **Current estimated search** | ≈ 20–45 s (browse / multi-step / open to identify) |
| **New target** | ≤ 10 s (type → recognize → act) |
| **Estimated saving** | ≈ **10–35 s per search** |
| **Daily leverage** | Search runs far more often than create → larger cumulative return |
| **Validation** | Dogfood stopwatch · Observation Sprint later (LAW 001-A) |

Label: **Estimated** until Observation.

---

## Deferred (documented, not this sprint)

### Recientes (auto)

When Isabella creates or opens a customer, bump to Recientes — no re-search.  
Empty-query recent list exists today; **auto-bump ranking** is next polish.

### Búsqueda tolerante (enhanced)

Operator often remembers one fragment (Juan · 622… · Adeje).  
Facade already matches name / phone / company / city partially.  
Richer ranking (exact → frequent → recent) remains progressive.

### Universal Command Bar (CX006 accelerator idea)

```text
⌘ K → Juan → Open · Create Order · Call · History
```

Platform-wide **Operational Accelerator** — not a Capability.  
Registered in [TENANT_TIME_SAVINGS_BACKLOG](./TENANT_TIME_SAVINGS_BACKLOG.md).

---

## Customer Experience sequence

```text
001 Create     ✅
002 Search     ← active
003 Edit
004 Company Management
005 Preferences
006 Bulk Operations
↓
then Order Experience
```

Each mission answers one measurable question (see [EXPERIENCE_MISSIONS](./EXPERIENCE_MISSIONS.md)).

---

## Acceptance

* No Capability changes  
* No Facade changes  
* No Engine changes  
* Experience only  

## Definition of Done

* Operator finds the intended customer in &lt; 10 s on the happy path  
* Searching feels immediate  
* The software disappears  

---

## Related

* [CUSTOMER_EXPERIENCE_001](./CUSTOMER_EXPERIENCE_001.md) · [Phase 1](./CUSTOMER_EXPERIENCE_001_PHASE1.md)  
* [EXPERIENCE_CARDS](./EXPERIENCE_CARDS.md)  
* [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md)

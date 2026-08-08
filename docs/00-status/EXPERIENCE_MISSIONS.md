# Experience Missions (Era 2)

**Status:** ▶ **ACTIVE** — **DELIVERY EXPERIENCE REVIEW** READY WITH IMPROVEMENTS · Journey Certification **NEXT** · Kitchen Journey **Certified · Frozen**


**Declared:** 2026-08-07  
**Laws:** PRODUCT LAW 001 · 002 · EXPERIENCE LAW 001 (ADR [0098](../adr/0098-experience-law-001.md)) · **EXPERIENCE MANIFESTO 001** (ADR [0099](../adr/0099-experience-manifesto-001.md)) · TENANT SUCCESS 001 / 001-A · TEAM LAW 001  
**Pattern:** Progressive Completion · Living Customer Profile · Time-to-Action (TTA)  
**Lifecycle:** [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md) · [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)  
**Manifesto:** [EXPERIENCE_MANIFESTO](./EXPERIENCE_MANIFESTO.md)  
**Customer Review:** [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md) · Verdict **READY WITH IMPROVEMENTS** · **Frozen** · Journey Certified  
**Order Review:** [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md) · Verdict **READY WITH IMPROVEMENTS** · **Frozen** · Journey Certified

```text
We do not build screens.
We do not build forms.
We build measurable experiences.

A great Experience is invisible.
```

---

## Time-to-Action (TTA)

| Experience | Mission | Primary TTA | Status |
|------------|---------|-------------|--------|
| **Customer** | Zero Friction (001–005) · includes **CUSTOMER_EXPERIENCE_005** Growth | Create <30s · Find <10s · Edit <20s · Org <45s · enriquecer < 30s | ✅ **Frozen** · Journey Certified |
| **Order** | Zero Friction Capture · Search · Edit · Templates · Incident (001–005) | TTO <45s · TTFO <10s · TTEO <20s · Reuse <10s · TTRI <30s | ✅ **Frozen** · Journey Certified |
| **Menu** | Zero Friction Planning · Search · Adaptation · Dish Library · Publish (001–005) | TTWM <10 min · TTFM <10s · TTAW <5 min · TTFID <15s · TTRP <5 min | ✅ **Certified** |
| **Production** | Zero Friction Planning · Search · Adaptation · Preps · Alerts · Handoff (001–006) | TPP <10 min · TTFPW <10s · TAPP <5 min · TIRP <15s · TTPR <10s · TPKH <5 min | ✅ **Frozen** · Journey Certified |
| **Kitchen** | Zero Friction Today's Work → Completion (001–006) | TTUKW <10s · TTFEW <10s · TTAE <30s · TILC <10s · TTEP <5s · TTUC <5s · Next <10s | ✅ **Frozen** · Journey Certified |
| **Delivery** | Zero Friction Day → Completion (001–006) · Review | TTUDD &lt;2 min · TTFD &lt;10s · TTAD &lt;30s · TTDR &lt;10s · TPDD &lt;5 min (hyp) · TTDO &lt;5s | ✅ **READY WITH IMPROVEMENTS** · Certification NEXT |

---

## EXPERIENCE LAW 001

```text
The first interaction
must require the minimum information
needed to continue working.

Everything else
can be completed later.
```

---

## Living Customer Profile

```text
A customer profile should grow with the relationship,
never before it.
```

---

## Customer Experience — MVP COMPLETE · FROZEN · JOURNEY CERTIFIED

```text
001 Create          ✅
002 Search          ✅
003 Edit            ✅
004 Organization    ✅
005 Growth          ✅
↓
Review              ✅ READY WITH IMPROVEMENTS
↓
Journey Certification ✅ Customer Journey
↓
Freeze              ← no new Customer missions
↓
ORDER EXPERIENCE    ✅ Frozen (below)
```

Detail: [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md)

**CX006 withdrawn** → [ACCELERATOR-002 Operational Bulk](./ACCELERATOR_002_OPERATIONAL_BULK.md)

---

## Order Experience — MVP COMPLETE · FROZEN · JOURNEY CERTIFIED

```text
OE001 Capture ✅ → OE002 Search ✅ → OE003 Edit ✅ → OE004 Templates ✅ → OE005 Incident ✅
↓
Review ✅ READY WITH IMPROVEMENTS
↓
Journey Certification ✅ Order Journey
↓
Freeze ← no new Order missions
↓
MENU EXPERIENCE ✅ phases · Review pending
```

Detail: [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md) · [ORDER-EXPERIENCE-005](./ORDER_EXPERIENCE_005.md) complete · [004](./ORDER_EXPERIENCE_004.md) · [003](./ORDER_EXPERIENCE_003.md) · [002](./ORDER_EXPERIENCE_002.md) · [001](./ORDER_EXPERIENCE_001.md)

Surface retained: `/admin/order-capture`

---

## Menu Experience — MVP COMPLETE · JOURNEY CERTIFIED

```text
ME001 Weekly Planning ✅ → ME002 Search ✅ → ME003 Weekly Adaptation ✅ → ME004 Dish Library ✅ → ME005 Publish & Preview ✅
↓
Review → Journey Certification ✅ Menu Journey
↓
Freeze
```

Surface retained: `/admin/menu-planning` · [MENU_EXPERIENCE_005](./MENU_EXPERIENCE_005.md)  
Temporal model: **Semana → Día → Menú → Platos**

---

## Active mission

▶ **DELIVERY EXPERIENCE REVIEW** ✅ **READY WITH IMPROVEMENTS** · [DELIVERY_EXPERIENCE_REVIEW](../tenant-success/DELIVERY_EXPERIENCE_REVIEW.md)  
**DELIVERY EXPERIENCE 006** ✅ · [DELIVERY_EXPERIENCE_006](./DELIVERY_EXPERIENCE_006.md) · **005** ✅ · **004** ✅ · **003** ✅ · **002** ✅ · **001** ✅  
Surface `/admin/delivery-today` · Input: Orders `ready_for_delivery` via Delivery Facade · Kitchen Frozen  
**KITCHEN JOURNEY** ✅ **CERTIFIED · FROZEN** · [KITCHEN_JOURNEY_CERTIFICATION](../tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md)  
**Next:** Delivery Journey Certification → Freeze · then observe full organism (no Accelerators yet)

```text
DE001 Today's Delivery Day ✅ → DE002 Search ✅ → DE003 Adaptation ✅ → DE004 Responsibility ✅ → DE005 Route Preparation ✅ → DE006 Completion ✅ → Delivery Experience Review ✅ READY WITH IMPROVEMENTS → Journey Certification ▶ → Freeze
```

Kitchen remains frozen:

```text
KE001 Today's Work ✅ → KE002 Search ✅ → KE003 Adaptation ✅ → KE004 Labels ✅ → KE005 Progress ✅ → KE006 Completion ✅ → Kitchen Experience Review ✅ READY WITH IMPROVEMENTS → Journey Certification ✅ CERTIFIED → Freeze ✅
```

Production remains frozen:

```text
PE001 Production Planning ✅ → PE002 Search ✅ → PE003 Adaptation ✅ → PE004 Pre-Preparations ✅ → PE005 Alerts ✅ → PE006 Kitchen Handoff ✅ → Review ✅ → Journey Certification ✅ CERTIFIED → Freeze ✅
```

Kitchen temporal model: **Día → Cola → Trabajo → Cantidad → Deadline → Ejecutar → Cierre**  
Boundary: Production prepares · Handoff transfers · Kitchen executes / adapts / labels / tracks session progress / closes honestly (no replan · no invent durable Complete · no Delivery acceptance).  
OTS: **Estimated ≠ Measured** — Observation Sprint pending (LAW 001-A).  
Delivery temporal model: **Día → Cola → Search → Adaptation → Responsibility → Route Preparation (sesión) → Completion (ConfirmDelivery Facade · no POD/Billing invent)**  
Boundary: Kitchen executes · Delivery prepares & closes controlled transfer · AssignDelivery / ReportDeliveryException UNIMPLEMENTED · ConfirmDelivery vía Facade · no auto-Billing.  
OTS: **Estimated ≠ Measured** — Observation Sprint pending (LAW 001-A).  
Kitchen: ✅ Certified · Frozen · [KITCHEN_JOURNEY_CERTIFICATION](../tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md)  
Production: ✅ Certified · Frozen · [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md)  
Menu: ✅ Certified · Order: frozen · Customer: frozen  
Historical ids: **DELIVERY-EXPERIENCE-REVIEW** · **DELIVERY-EXPERIENCE-006** · **DELIVERY-EXPERIENCE-005** · **DELIVERY-EXPERIENCE-004** · **DELIVERY-EXPERIENCE-003** · **DELIVERY-EXPERIENCE-002** · **DELIVERY-EXPERIENCE-001** · **KITCHEN-EXPERIENCE-001** · **KITCHEN-EXPERIENCE-002** · **KITCHEN-EXPERIENCE-003** · **KITCHEN-EXPERIENCE-004** · **KITCHEN-EXPERIENCE-005** · **KITCHEN-EXPERIENCE-006** · **KITCHEN-EXPERIENCE-REVIEW** · **KITCHEN-JOURNEY-CERTIFICATION** · **PRODUCTION-EXPERIENCE-001** · **PRODUCTION-EXPERIENCE-002** · **PRODUCTION-EXPERIENCE-003** · **PRODUCTION-EXPERIENCE-004** · **PRODUCTION-EXPERIENCE-005** · **PRODUCTION-EXPERIENCE-006** · **PRODUCTION-EXPERIENCE-REVIEW** · **PRODUCTION-JOURNEY-CERTIFICATION** · **MENU-EXPERIENCE-001** · **MENU-EXPERIENCE-002** · **MENU-EXPERIENCE-003** · **MENU-EXPERIENCE-004** · **MENU-EXPERIENCE-005**

---

## Platform roadmap

```text
Customer Experience     ✅ MVP · Reviewed · Journey Certified · Frozen
↓
Order Experience        ✅ MVP · Reviewed · Journey Certified · Frozen
↓
Menu Experience         ✅ MVP · Journey Certified
↓
Production Experience   ✅ Journey Certified · Frozen (001–006 ✅)
↓
Kitchen Experience      ✅ Journey Certified · Frozen (001–006 ✅)
↓
Delivery Experience     ✅ Review READY WITH IMPROVEMENTS (001–006 ✅) · Certification ▶
↓
Operational Journey Review
↓
Observation Sprint
↓
Evidence
↓
Operational Accelerators
  001 OCC                 Reserved
  002 Operational Bulk    Registered (ex-CX006) — weeks may reveal need
  003 Import Pipeline     Reserved — Excel/PDF heritage likely
  004 Quick Capture       Reserved — natural-language menus if evidenced
  …
```

---

## Related

* [EXPERIENCE_LIFECYCLE](./EXPERIENCE_LIFECYCLE.md)  
* [JOURNEY_CERTIFICATION](./JOURNEY_CERTIFICATION.md)  
* [DELIVERY_EXPERIENCE_REVIEW](../tenant-success/DELIVERY_EXPERIENCE_REVIEW.md)  
* [DELIVERY_EXPERIENCE_006](./DELIVERY_EXPERIENCE_006.md)  
* [DELIVERY_EXPERIENCE_005](./DELIVERY_EXPERIENCE_005.md)  
* [DELIVERY_EXPERIENCE_004](./DELIVERY_EXPERIENCE_004.md)  
* [DELIVERY_EXPERIENCE_003](./DELIVERY_EXPERIENCE_003.md)  
* [DELIVERY_EXPERIENCE_002](./DELIVERY_EXPERIENCE_002.md)  
* [DELIVERY_EXPERIENCE_001](./DELIVERY_EXPERIENCE_001.md)  
* [KITCHEN_JOURNEY_CERTIFICATION](../tenant-success/KITCHEN_JOURNEY_CERTIFICATION.md)  
* [KITCHEN_EXPERIENCE_REVIEW](../tenant-success/KITCHEN_EXPERIENCE_REVIEW.md)  
* [KITCHEN_EXPERIENCE_006](./KITCHEN_EXPERIENCE_006.md)  
* [KITCHEN_EXPERIENCE_001](./KITCHEN_EXPERIENCE_001.md)  
* [PRODUCTION_JOURNEY_CERTIFICATION](../tenant-success/PRODUCTION_JOURNEY_CERTIFICATION.md)  
* [PRODUCTION_EXPERIENCE_REVIEW](../tenant-success/PRODUCTION_EXPERIENCE_REVIEW.md)  
* [PRODUCTION_EXPERIENCE_006](./PRODUCTION_EXPERIENCE_006.md)  
* [PRODUCTION_EXPERIENCE_005](./PRODUCTION_EXPERIENCE_005.md)  
* [PRODUCTION_EXPERIENCE_004](./PRODUCTION_EXPERIENCE_004.md)  
* [PRODUCTION_EXPERIENCE_003](./PRODUCTION_EXPERIENCE_003.md)  
* [PRODUCTION_EXPERIENCE_002](./PRODUCTION_EXPERIENCE_002.md)  
* [PRODUCTION_EXPERIENCE_001](./PRODUCTION_EXPERIENCE_001.md)  
* [MENU_EXPERIENCE_005](./MENU_EXPERIENCE_005.md)  
* [MENU_EXPERIENCE_004](./MENU_EXPERIENCE_004.md)  
* [OPERATIONAL_LIBRARIES](./OPERATIONAL_LIBRARIES.md)  
* [MENU_EXPERIENCE_003](./MENU_EXPERIENCE_003.md)  
* [MENU_EXPERIENCE_002](./MENU_EXPERIENCE_002.md)  
* [MENU_EXPERIENCE_001](./MENU_EXPERIENCE_001.md)  
* [ORDER_EXPERIENCE_REVIEW](./ORDER_EXPERIENCE_REVIEW.md)  
* [ORDER_EXPERIENCE_005](./ORDER_EXPERIENCE_005.md)  
* [ORDER_EXPERIENCE_004](./ORDER_EXPERIENCE_004.md)  
* [ORDER_EXPERIENCE_003](./ORDER_EXPERIENCE_003.md)  
* [ORDER_EXPERIENCE_002](./ORDER_EXPERIENCE_002.md)  
* [CUSTOMER_EXPERIENCE_REVIEW](./CUSTOMER_EXPERIENCE_REVIEW.md)  
* [OPERATIONAL_ACCELERATORS](./OPERATIONAL_ACCELERATORS.md)  
* [ACCELERATOR_002_OPERATIONAL_BULK](./ACCELERATOR_002_OPERATIONAL_BULK.md)  
* [SPRINT_001_TENANT_SUCCESS](./SPRINT_001_TENANT_SUCCESS.md)  
* [PR_REVIEW_PROTOCOL](./PR_REVIEW_PROTOCOL.md)

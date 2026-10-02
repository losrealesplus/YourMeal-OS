# CR-OPS-05 · Architecture Review: Published Weekly Menu ↔ Universal Order Intake Availability

**Initiative:** CR-OPS-05  
**Domain:** Operations & Order Intake Experience  
**Ownership:** YourMeal OS Core  
**Status:** 🟡 **ARCHITECTURE REVIEW (Ready for Scope Lock)**  
**Target:** Universal Order Intake Drawer & Weekly Menu Availability Alignment  

---

## 1. Context & Business Intent

In YourMeal OS, commercial food operations operate on a **Weekly Menu Cycle**. For any given operational week (`week_start` Monday), the kitchen plans and publishes a rotational offer comprising specific dishes for each day of the week (e.g., 7 dishes on Monday, 7 on Tuesday, etc., totaling 35 slots).

### The Inconsistency
1. **Admin Weekly Menu Planning (`/admin/menus`)**:
   - Accurately creates, plans, and publishes 35 slots across Monday–Friday for the week `2026-09-28`.
   - Status is marked as **`published`**.
2. **Consumer Ordering (`/app/menu` and `/app/schedule`)**:
   - Consumes `useWeeklyMenu(weekStart)` $\rightarrow$ `fetchPublishedWeeklyMenu(tenantId, weekStart)`.
   - Accurately renders the published daily dishes per selected delivery day.
3. **Universal Order Intake Drawer (`UniversalOrderIntakeDrawer.tsx`)**:
   - Used by staff in administrative workflows (Dashboard, Orders, Companies, Customers, Monthly Operations Calendar).
   - Erroneously queried the raw table `dishes` with a non-existent column `category` (`select("id, name, price, category")`), throwing a 400 error caught silently and displaying:
     `"No hay platos configurados en el catálogo."`
   - Even without the schema error, querying raw `dishes` completely bypassed `weekly_menus` and `weekly_menu_slots`, failing to reflect daily menu planning.

---

## 2. Architectural Decisions

```text
                                  COMMERCIAL OFFER FLOW
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ DISH LIBRARY (Master Dictionary / Recipes / Baseline Economics)                         │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Planned into
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ WEEKLY MENU PLANNING (weekly_menus + weekly_menu_slots, status = 'published')           │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Resolves into
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ CANONICAL AVAILABILITY CONTRACT: fetchPublishedWeeklyMenu(tenantId, weekStart)          │
├───────────────────────────────────────────┬─────────────────────────────────────────────┤
│ Consumer Flow (/app/menu, /app/schedule)  │ Staff Flow (UniversalOrderIntakeDrawer)     │
│ 🟢 Already uses fetchPublishedWeeklyMenu  │ 🟡 To be aligned with fetchPublishedMenu    │
└───────────────────────────────────────────┴─────────────────────────────────────────────┘
```

### Key Decisions:
1. **Published Weekly Menu as Sole Commercial Availability Source**:
   - The dishes available for selection in `UniversalOrderIntakeDrawer` for any day `dayDate` (e.g. `2026-09-28`) MUST be derived from the published weekly menu of that week (`weekly_menus.week_start`).
2. **Day-Specific Dish Projection**:
   - When the user selects "Lunes (2026-09-28)", only Monday's planned dishes are displayed.
   - When the user selects "Martes (2026-09-29)", only Tuesday's planned dishes are displayed.
3. **Graceful Fallbacks & Operator Feedback**:
   - **Published Menu with Slots**: Render planned daily dishes with real photos (`DishThumb`), names, baseline prices, and stepper counters.
   - **Unplanned Day (e.g. Weekend)**: Explicit message `"Sin servicio planificado para este día"`.
   - **Week Without Published Menu**: Explicit banner `"No hay menú publicado para la semana seleccionada"`.
4. **Zero Impact on Order Persistence Contract**:
   - `StaffOrderCaptureService.captureOrder` and `UniversalOrderCaptureDTO` remain 100% backward compatible. Line items continue to capture `{ dayDate, dishId, qty, unitPriceOverride, comment }`.
   - Historical orders, `order_items.unit_price` snapshots, and accounting invariants remain completely untouched.

---

## 3. Component Architecture & State Flow

```text
UniversalOrderIntakeDrawer
├── Props: { open, weekStart, initialDayDate, preselectedCustomerId, ... }
├── State:
│    ├── weekStart (derived from initialDayDate / preselectedWeekStart)
│    ├── selectedDayDate (active tab)
│    ├── weeklyMenuView (loaded via fetchPublishedWeeklyMenu / WeeklyMenuService)
│    ├── quantities: Record<dayDate, Record<dishId, number>>
│    ├── comments: Record<dayDate, Record<dishId, string>>
│    └── priceOverrides: Record<dayDate, Record<dishId, number>>
└── Render:
     ├── Tabs: Monday through Sunday
     └── TabContent: Renders dishes from weeklyMenuView.days[dayIndex].dishes
```

---

## 4. Verification Matrix & Quality Gates

| Gate | Verification Target |
| :--- | :--- |
| **G1** | **Type Safety**: Full TypeScript compilation with 0 errors (`npx tsc --noEmit`). |
| **G2** | **Production Build**: Nitro/Vite production build succeeds cleanly. |
| **G3** | **Daily Offer Resolution**: Drawer renders exact planned dishes for each day matching `weekly_menu_slots`. |
| **G4** | **Weekend / Empty Fallback**: Explicit fallback displayed when a day or week has no planned dishes. |
| **G5** | **Order Capture Persistence**: Capturing an order through the drawer creates valid `orders` and `order_items` records with correct prices. |
| **G6** | **Multi-Tenant Isolation**: Offer resolution strictly queries the active `tenantId`. |

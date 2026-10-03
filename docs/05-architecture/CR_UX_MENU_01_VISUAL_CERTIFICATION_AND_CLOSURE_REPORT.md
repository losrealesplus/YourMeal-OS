# 🏛️ CR-UX-MENU-01 · Visual Certification & Closure Report

**Change Request:** `CR-UX-MENU-01`  
**Title:** Full Dish Composition & Name Visibility  
**Scope:** `/admin/menus` Weekly Menu Planning & Dish Search  
**Ratified by:** Human Product Authority  
**Status:** **CERTIFIED & CLOSED**  

---

## 1. Executive Summary

In response to truncated dish presentation in `/admin/menus` (e.g. `"Lomo de atú..."`), an audit confirmed that all ingredient and accompaniment data are stored intact in `public.dishes.name`. The truncation was caused by premature CSS truncation (`truncate`) in the 7-column desktop grid.

Under strict Agency Core Governance, **CR-UX-MENU-01** eliminated the CSS truncation without modifying database records, without altering historical orders, and without introducing heuristic string parsing.

---

## 2. Implemented Changes

1. **7-Day Planning Board (`src/routes/_authenticated/admin.menus.tsx`)**:
   - Replaced `truncate` with `line-clamp-5 hover:line-clamp-none leading-snug break-words`.
   - Added native accessible `title` attribute containing the complete dish string.
   - Refined typography hierarchy for calories (`mt-0.5`) and allergens (`text-[9px] font-medium mt-1 line-clamp-2`).
2. **Dish Picker Modal (`src/routes/_authenticated/admin.menus.tsx`)**:
   - Replaced `truncate` with `line-clamp-2 leading-snug break-words`.
   - Structured allergen display on a secondary line.

---

## 3. Quality & Verification Gates

| Gate | Target | Result | Evidence |
| :--- | :--- | :---: | :--- |
| **Weekly Menu Unit Tests** | `src/modules/weekly-menu/` | 🟢 PASS | `37/37` tests passed |
| **Drawer Contract Tests** | `universal-order-intake-drawer.spec.tsx` | 🟢 PASS | `4/4` tests passed |
| **TypeScript Typecheck** | Full Codebase | 🟢 PASS | `0` errors (`npx tsc --noEmit`) |
| **Production Build** | Nitro / Vite SSR | 🟢 PASS | Clean production bundle |
| **Visual Inspection** | 8 Checkpoints | 🟢 PASS | Verified on high-res screenshots (`01` to `04`) |

### Visual Checkpoints Summary (8/8 PASS)
1. **Lomo de atún:** Complete accompaniment visible (*"puré de papas y judías salteadas"*).
2. **Poke bowl:** All 6 ingredients clearly legible (*"arroz de sushi, wakame, cebolla encurtida, maíz, edamames"*).
3. **Pasta boloñesa:** Harmonious multiline wrapping without clipping.
4. **20 slots grid:** Perfectly balanced across 5 daily columns without horizontal overflow or grid disruption.
5. **Allergens:** Legible secondary lines below calories.
6. **Title Attribute:** Tooltip contains 100% full text.
7. **Dish Picker Search:** Clean 2-line title and pricing presentation in modal.
8. **Responsive:** 1024px tablet breakpoint renders expansive 3/2 column layout with zero truncation.

---

## 4. Invariants & Governance Compliance

- **DB Mutations:** `0` (Catálogo, `weekly_menus`, `weekly_menu_slots` schemas 100% untouched).
- **Orders Integrity:** `orders` and `order_items` tables 100% untouched.
- **Heuristic Parsing:** `0` (Complete string from `dishes.name` is preserved as single source of truth).
- **Scope Compliance:** Strict boundary maintained within `src/routes/_authenticated/admin.menus.tsx`.

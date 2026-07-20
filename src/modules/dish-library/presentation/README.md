# Dish Library — presentation

UI for this module lives primarily in `src/routes/_authenticated/admin.dishes.tsx`.

Rules:
- Call `DishService` via application layer only
- Never import the repository from presentation
- Format money/weight with `useFmt()`
- Gate controls with `useCan("dishes.*")`

Module 01 UI is **blocked** until Foundation Lock is tagged `v0.1.0`.

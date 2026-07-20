# Roadmap

## Now — Foundation (in progress)

- [x] Multi-tenant schema + RLS
- [x] Auth shell + profiles + roles enum
- [x] Localization + `useFmt`
- [x] Design tokens + app/admin shells
- [x] Docs constitution + ADRs
- [x] Soft delete / audit / feature flag schema
- [x] Services scaffolding (`DishService` + audit + flags)
- [x] Permissions capability map
- [x] Department + SaaS placeholder routes
- [x] Role-based post-login redirect
- [ ] RBAC `beforeLoad` gates for departments
- [ ] Permission-filtered navigation

## Next — Dish Library (first business module)

- DishService (create, update, archive/soft-delete, list, get)
- Admin `/admin/dishes` UI
- Ingredient linking
- Audit writes on mutations
- Permission capabilities for dishes

## Then — Dependent modules

1. Weekly menus
2. Orders (customer)
3. Kitchen / Production
4. Purchasing / Inventory
5. Logistics / Routes
6. Accounting
7. Support tooling
8. SaaS admin (companies, licenses, branding, domains)

## Later — Platform integrations

- PostHog
- Resend
- Google Maps
- Push notifications

## Explicitly deferred

- AI (demand prediction, auto purchasing, route optimization, …) — architecture ready only
- Offline sync — architecture ready only
- Full monorepo split — when Lovable-safe

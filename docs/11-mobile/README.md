# Mobile

## Current

Customer experience is **mobile-first web** inside the same TanStack Start app (`/app`, `MobileShell`, bottom navigation).

## Future

Dedicated `apps/mobile` (target monorepo) sharing:

- `packages/auth`
- `packages/permissions`
- `packages/localization`
- `packages/shared` (types, Services clients)
- `packages/ui` where applicable

## Offline

Architecture should support offline synchronization later. **Do not implement now.** Design Services and mutations so they can accept idempotent sync later (stable IDs, soft delete, audit).

# Design

## Philosophy

Apple quality. Minimal. Professional. Fast. Native feeling. Large touch targets. Little visual noise. Design system first.

## Current system

**Name:** Stainless industrial precision

**Tokens:** `src/styles.css`

| Token | Value / intent |
|-------|----------------|
| Fonts | Inter (UI), JetBrains Mono (data) |
| Background | `#f8fafc` / slate |
| Foreground | `#0f172a` |
| Primary | Emerald `#059669` |
| Warn / Critical | Amber / Red |
| Radius | `1rem` (cards `rounded-2xl`) |
| Motion | `--ease-out-expo`, restrained reveal |

## Rules

- Prefer shared primitives over one-off card stacks.
- Numbers and codes use mono typography.
- Tenant theming: override `--brand-primary` from `tenants.brand` on load.
- Customer surfaces are mobile-first; admin is desktop-first and responsive.
- Never call `toLocaleString()` in components — use `useFmt()`.

## Planned shared primitives

| Component | Purpose |
|-----------|---------|
| MetricCard | Dashboard metric |
| DataTable | Admin tabular data |
| StatusPill | Operational status |
| AdminSidebar | Department navigation |
| PhoneBottomNav | Customer app nav |

## Shells today

- `src/components/admin-shell.tsx` — company suite
- `src/components/mobile-shell.tsx` — customer app

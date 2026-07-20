# User flows

## Authentication

1. User opens `/auth`.
2. Signs in via email/password, phone OTP, Google, or Apple.
3. Session established via Supabase Auth.
4. Profile exists (created by `handle_new_user` trigger).
5. Roles loaded from `user_roles`.
6. Redirect to `homePath`: `/saas` | `/admin` | `/driver` | `/app`.

Password reset: `/reset-password`.

## Customer

1. Land on `/app` (Home).
2. Browse weekly menu (`/app/menu`) — feature TBD.
3. Manage settings (profile, addresses, language, …) — scaffold TBD.

## Staff (company)

1. Land on `/admin` (Dashboard).
2. Navigate departments via sidebar (Dish Library first real module).
3. Permissions gate each department route.

## SaaS administrator

1. Land on `/saas` (planned).
2. Manage companies, licenses, branding, domains, analytics, global settings.

## Principle

Users do not switch applications. Users switch departments within one OS.

# API

## Current approach

TanStack Start server functions + Supabase client (browser and server). Supabase PostgREST is the primary data API, constrained by RLS.

## Conventions

1. UI → Service → Supabase (never UI → ad-hoc business SQL).
2. Server functions that need identity use Supabase auth middleware (`requireSupabaseAuth` / auth attacher).
3. Inputs validated with Zod at the Service boundary.
4. Canonical units in payloads; localization only in clients via `useFmt()`.

## Future

Documented OpenAPI / RPC surface may grow for mobile and integrations. Keep Services as the stable domain boundary so transports can change without rewriting rules.

## Out of scope now

Public third-party API, webhooks, Stripe billing endpoints.

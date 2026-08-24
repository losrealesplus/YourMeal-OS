# YourMeal OS — EatClean Real Instance Provisioning Specification

## 1. Infrastructure Topology
- **Instance Repository:** `github.com/losrealesplus/YourMeal-EatClean` (Private)
- **Core Release Version:** `0.1.0` (Pinned dependency)
- **Target Subdomain:** `eatclean.yourmealos.com`
- **Staging Subdomain:** `eatclean-staging.yourmealos.com`
- **Supabase Project ID:** `eatclean-prod`
- **Supabase Region:** `eu-central-1` (Frankfurt / Madrid Low Latency)

## 2. Empty but Schematized Database Invariant
The instance executes the exact DDL migrations of YourMeal OS Core v0.1.0.
At the conclusion of provisioning, all tables, indices, functions, and RLS policies are active, but entity row counts MUST be strictly zero:
- `customers`: 0
- `companies`: 0
- `dishes`: 0
- `menus`: 0
- `orders`: 0
- `support_notes`: 0
- `operational_exceptions`: 0

## 3. Storage Buckets
- `eatclean-branding` (Public read, authenticated write)
- `eatclean-onboarding` (Private read/write, service-role only for Excel/PDF ingest)
- `eatclean-attachments` (Authenticated read/write for support and operational tickets)

## 4. Auth & Security Configuration
- **Auth Provider:** Supabase Auth (Email + Magic Link / Secure password)
- **Redirect URLs:**
  - `https://eatclean.yourmealos.com/auth/callback`
  - `https://eatclean-staging.yourmealos.com/auth/callback`
- **JWT Expiry:** 3600 seconds
- **RLS Enforced:** `tenant_id = 'eatclean'` on all tenant-isolated tables.

## 5. Analytics Isolation
- **Event Namespace:** `eatclean.*`
- **Telemetry Project:** Isolated tenant telemetry container (strictly decoupled from YourMeal OS corporate marketing analytics).

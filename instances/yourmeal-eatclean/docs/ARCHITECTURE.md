# YourMeal OS — EatClean Instance Architecture

## 1. Instance Overview
- **Tenant Slug:** `eatclean`
- **Domain:** `eatclean.yourmealos.com`
- **Pinned Core Version:** `0.1.0`
- **Isolation Model:** Physical Supabase Project + Independent Cloudflare Deployment.

## 2. Invariants
1. **Zero Core Duplication:** The instance owns only configuration (`config/`), branding assets (`assets/`), feature toggles (`features.ts`), environment secrets (`deployment/`), and data onboarding pipelines (`data/`).
2. **Schema Uniformity:** PostgreSQL tables, functions, RLS policies, and domain logic are inherited from the versioned YourMeal OS Core (`0.1.0`).
3. **Empty Foundation Certification:** Prior to onboarding, this instance contains zero mock/demo records and zero customer data.

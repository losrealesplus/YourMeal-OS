# Product

## Name

**YourMeal OS** — The Operating System for Meal Prep & Catering

## What it is

A multi-tenant SaaS platform that becomes the operating system for meal prep, catering, and prepared-food companies.

## What it is not

This is **not** an ordering application.

It is a complete business operating system connecting every department of a company through one shared source of truth.

## First tenant

EatClean Tenerife — the reference implementation. Architecture must support hundreds of future companies without redesign.

## Product philosophy

| Principle | Meaning |
|-----------|---------|
| One platform | Single application for all users |
| One login | Supabase Authentication |
| One database | Shared Postgres; tenant isolation via RLS |
| One source of truth | Canonical domain data |
| Different permissions | RBAC; never hardcoded in UI |
| Different departments | Same app; interface changes by role |
| Tenant isolation | No shared business data across companies |

## Departments

After login, everyone lands on **Home**. The interface changes according to permissions. Users do not change applications — they change departments.

| Department | Typical roles |
|------------|---------------|
| Customer Support | `support`, `company_admin` |
| Kitchen | `kitchen` |
| Production | `production` |
| Purchasing | `purchasing` |
| Inventory | `inventory` |
| Accounting | `accounting` |
| Logistics | `logistics`, `driver` |
| Administration | `company_admin` |
| Customer app | `customer` |

SaaS Administrators (`saas_admin`) additionally access: Companies, Licenses, Branding, Domains, Analytics, Global Settings.

# ADR 0059 — Customer Facade

## Estado

**Accepted** — 2026-08-06  
**Track:** OPERATIONAL-002 · Phase 2 (Implement Facade)  
**Depends on:** [ADR 0058](./0058-customer-capability.md) · Identity Facade [ADR 0056](./0056-identity-facade.md)  
**Detalle:** [CUSTOMER_CAPABILITY](../05-architecture/CUSTOMER_CAPABILITY.md) · [CAPABILITY_REGISTRY](../00-status/CAPABILITY_REGISTRY.md)

## Contexto

ADR 0058 congeló Customer Capability (demand Party). Identity ya expone `IdentityFacade` (solo lectura). Customer es la **primera Operational Capability escribible**: necesita una fachada pública con intenciones de lectura y escritura, sin exponer almacenamiento.

## Decisión

1. Implementar `CustomerFacade` + `useCustomer` en `src/customer/`.  
2. Separar intenciones en **`CustomerCommand`** y **`CustomerQuery`** (no CQRS completo — claridad de lenguaje).  
3. Commands: `CreateCustomer` · `UpdateCustomer` · `ArchiveCustomer` · `RestoreCustomer` · `MergeCustomer` (future stub).  
4. Queries: `GetCustomer` · `SearchCustomers` · `ListRecentCustomers` · `GetDeliveryLocations` · `GetCompanyAccounts`.  
5. **Componer** `CustomerDirectoryService` + `CompanyAccountService` — sin reescribir CRM.  
6. `ServiceContext` / Supabase se resuelven **dentro** de la fachada; UI nunca importa repos ni Supabase.  
7. Declarar **FOUNDATION LAW 002**: cada Operational Capability posee exactamente una Facade; nunca expone storage.  
8. Introducir vocabulario de **Capability Maturity** en el Registry.

### API shape (business concepts)

```ts
// Commands — not customer.save()
CreateCustomerCommand | UpdateCustomerCommand | ArchiveCustomerCommand | …

// Queries — not customer.search()
SearchCustomersQuery | GetCustomerQuery | …
```

### Compose vs stub (honest substrate)

| Operation | Substrate |
|-----------|-----------|
| CreateCustomer (ensure session) | `CompanyAccountService.ensureIndividualCustomer` |
| CreateCustomer (company) | `CompanyAccountService.provisionCompany` |
| ArchiveCustomer (individual) | `CustomerDirectoryService.archiveCustomer` |
| Search / Get / List / CompanyAccounts | Directory list + map → `CustomerSummary` |
| GetDeliveryLocations (company) | `CompanyAccountService.listSites` |
| UpdateCustomer · RestoreCustomer · MergeCustomer | `UNIMPLEMENTED` (intent frozen; substrate later) |
| GetDeliveryLocations (individual) | empty + `UNIMPLEMENTED` warning (CJ-002 gap) |

## Consecuencias

- Toda pantalla Customer futura se construye solo con `CustomerFacade` / `useCustomer`.  
- Orders / Delivery / Billing consumen language de negocio, no tablas.  
- Gaps de escritura quedan visibles como `CustomerError.code = UNIMPLEMENTED` — no se inventan workflows.

## Referencias

- Código: `src/customer/CustomerFacade.ts` · `CustomerCommands.ts` · `CustomerQueries.ts` · `useCustomer.ts`  
- Law: [FOUNDATION_LOCK](../05-architecture/FOUNDATION_LOCK.md) · FOUNDATION LAW 002

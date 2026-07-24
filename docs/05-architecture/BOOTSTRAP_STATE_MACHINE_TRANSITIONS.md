# BOOTSTRAP_STATE_MACHINE — Transition table (OP-001.2)

Canonical reference for architecture **and** RI-001 certification.

See also: narrative ladder in this file’s parent sections · [OP001_DAY0_CHECKLIST](../10-validation/OP001_DAY0_CHECKLIST.md)

## Event table

| Estado origen | Evento | Actor | Servicio | Estado destino | Evidencia |
| ------------- | ------ | ----- | -------- | -------------- | --------- |
| No Tenant | `seed` / platform install | CLI / installer | `npm run seed` | Platform Ready (`saas_admin`) | EV-SEED-01 · audit `DAY0_SAAS_ADMIN_SEEDED` |
| Platform Ready | `createTenant` | `saas_admin` | `createTenant` | Tenant | EV-TEN-01 |
| Tenant | `activateTenant` | `saas_admin` | `setTenantStatus` | Tenant Active | EV-TEN-02 |
| Tenant Active | `inviteCompanyAdmin` | `saas_admin` | `createCompanyAdmin` | Company Admin | EV-ADM-01 |
| Company Admin | `inviteStaff` | `company_admin` / `operations_manager` | `inviteTenantStaff` | Staff | EV-STF-01 |
| Company Admin / Staff | `createDish` | `company_admin` | `DishService.create` | Dish Library | EV-DSH-01 |
| Dish Library | `ensureDraft` | `company_admin` | `WeeklyMenuService.ensureDraft` | Menu Draft | EV-MNU-01 (draft) |
| Menu Draft | `publishMenu` | `company_admin` | `WeeklyMenuService.publish` | Published Menu | EV-MNU-01 (published) |
| Published Menu | `programOrder` | `customer` | `OrderService.programDraft*` | Order Draft | EV-ORD-01 |
| Order Draft | `confirmOrder` | `customer` | `OrderService.confirm` | Confirmed Order | EV-ORD-01 |
| Confirmed Order | `startKitchen` | `kitchen` | `OperationsService.transitionKitchen` | Kitchen / Production | EV-KIT-01 |
| Prepared | `readyForDelivery` | `kitchen` | `OperationsService.transitionKitchen` | Ready for Delivery | EV-KIT-01 |
| Ready for Delivery | `dispatch` | `delivery` | `OperationsService.transitionDelivery` | Out for Delivery | EV-DEL-01 |
| Out for Delivery | `deliver` | `delivery` | `OperationsService.transitionDelivery` | Delivered / Operational | EV-DEL-02 |

## Forbidden events (negative evidence)

| Attempted event | Guard | Expected error | Evidence ID |
| --------------- | ----- | -------------- | ----------- |
| `publishMenu` without dishes | `canPublishWeeklyMenu` · WeeklyMenuService | `BOOTSTRAP_NO_DISHES` | EV-NEG-01 |
| `programOrder` without published menu | `canAcceptOrders` · OrderService | `MENU_LOCKED` / `BOOTSTRAP_NO_PUBLISHED_MENU` | EV-NEG-02 |
| `startKitchen` with empty kitchen queue | `canOperateKitchen` · OperationsService | `BOOTSTRAP_NO_KITCHEN_DEMAND` | EV-NEG-03 |
| `dispatch` with empty delivery queue | `canOperateDelivery` · OperationsService | `BOOTSTRAP_NO_DELIVERY_DEMAND` | EV-NEG-04 |
| `inviteStaff` without Company Admin | `canInviteOperationalStaff` · inviteTenantStaff | `BOOTSTRAP_NO_COMPANY_ADMIN` | EV-NEG-05 |

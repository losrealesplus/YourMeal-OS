# GATE 7 — RELEASE A (PARTIAL LAUNCH) RECONCILIATION MANIFESTO

**Repository:** `losrealesplus/YourMeal-OS`  
**Target Environment:** `production-worker`  
**Production Worker:** `yourmeal-instance-eatclean`  
**Production URL:** `https://eatclean.yourmealos.com`  
**Supabase Project ID:** `nhirlpkuvonggctdzzad`  
**Baseline Authoritative Deployment:** `6981646840` (`b9d9ff56c50570f60f6b1cb1db0e41909b477d2d`)  
**Candidate Sealed Source:** `81b0da1533f9442d8171d9bbb9863343c13389f0` (PR #519 merged)  
**Governance PR Branch:** `ag/gate7-release-a-reconciliation`  
**Release Mode:** `EATCLEAN_RELEASE_A_RECONCILIATION` (Piloto Operativo Controlado)

---

## 1. Contexto y Decisión de Release

El Pull Request de producto `#519` (`feat/eatclean-partial-launch`) fue fusionado manualmente en `main` el 11 de octubre de 2026 a las 08:32 UTC (`81b0da1533f9442d8171d9bbb9863343c13389f0`).

El clasificador de Gate 7 rechazó inicialmente la ejecución `38125150507` con:
`Privileged/unknown delta requires a separate authorization path` debido a que el intervalo acumulado desde el baseline productivo `b9d9ff56` comprende 5 pull requests fusionados (`#515`, `#516`, `#517`, `#518`, `#519`) que incluyen modificaciones en archivos clasificados como `SPECIAL` (entre ellos, `src/components/customer/customer-identity-link-review.tsx` modificado en el PR #519 para congelar el CRM P34).

Este manifiesto establece la reconciliación criptográfica y contractual exacta y cerrada para autorizar la construcción y sellado del artefacto de Gate 7 correspondiente al **Release A**.

---

## 2. Invariantes de Seguridad y Restricciones Productivas

1. **Supabase Production Migrations:**
   - 0 de 4 migraciones aplicadas.
   - Migraciones M1, M2, M3 y M4 estrictamente congeladas.
   - 61 tablas en el esquema `public`, 61 registros en `supabase_migrations`.
   - Prohibición total de mutaciones DDL o DML en la base de datos de producción durante este release.

2. **Alcance Funcional Release A (EatClean):**
   - **OPERATIVO:** Autenticación, gestión de platos, catálogo, menús semanales, consulta de pedidos existentes, operaciones de cocina compatibles y directorio de clientes.
   - **CONGELADO:** Creación de nuevos pedidos B2C (`/app/schedule`), captura manual de pedidos administrativos (`StaffOrderCaptureService.captureOrder`), y vinculación de identidades CRM P34.
   - **Zero Regression:** Ninguna limitación se aplica a tenants no-EatClean.

3. **Gobernanza de Despliegue:**
   - Este PR de gobernanza **NO** aprueba la Phase 2 de producción.
   - Tras el merge manual de este PR en `main`, el pipeline de Gate 7 construirá y sellará el nuevo artefacto y quedará en estado `WAITING` para la aprobación soberana del revisor humano autorizado en GitHub (`losrealesplus`).

---

## 3. Cadena de Commits Reconciliada (First-Parent)

| Commit SHA | PR | Descripción | Estado de Verificación |
|---|---|---|---|
| `38eb0b5d` | #515 | Staging runtime isolation | Verificado y sellado |
| `91061244` | #516 | Eatclean final release package | Verificado y sellado |
| `2d5b3914` | #517 | Governance reconciliation | Verificado y sellado |
| `0b88e976` | #518 | Hotfix governance classification | Verificado y sellado |
| `81b0da15` | #519 | EatClean partial production launch (Release A) | Verificado y sellado |
| *(Final)* | PR de Gobernanza | Reconciliación de gobernanza Release A | Pendiente de merge humano |

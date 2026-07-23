# PM-002 — Admin Suite

**Sprint:** 2.2  
**Estado:** 🔒 Tras PM-001  
**Depende de:** [PM-001](./PM-001-Customer-App.md)

---

## 1. Objetivo

Materializar la **Admin Suite** para gestionar la operación EatClean sin inventar reglas de negocio.

---

## 2. Alcance

**Incluye:** Dashboard admin · Gestión clientes · Menús · Vista producción (consulta) · Promociones · Facturación (consulta/estado)

**Excluye:** Motores de dominio · heurísticas · Production app completa (PM-003) · Delivery (PM-004)

---

## 3. Actores

Administrador / back-office de la Organization.

---

## 4. Capacidades

Configurar oferta (Menu) · ver clientes/beneficiarios · consultar estado operacional · promociones (si Capability existe en roadmap; sin inventar motor) · consultar facturación/cuentas.

---

## 5. Objetos operacionales

Organization · Menu · Dish · Account · Beneficiary · Order (consulta) · Payment · Capabilities/RBAC.

---

## 6. Restricciones

Reutilizar auth, RBAC, audit_log, feature_flags, i18n.  
Rutas admin existentes bajo `/_authenticated/admin.*` — evolucionar, no reemplazar stack.  
Experiencias completas (estados).  
No inventar lógica.

---

## 7. Referencias OM

`docs/17` · matriz Admin · [Rules](./PRODUCT_MATERIALIZATION_RULES.md)

---

## 8. Criterios de aceptación

- [ ] Dashboard + módulos del alcance navegables  
- [ ] Cada pantalla mapeada a objeto/capability  
- [ ] RBAC respetado · audit donde haya mutaciones UI-level ya soportadas  
- [ ] Sin lógica de negocio nueva  

---

## 9. Entregables

Suite admin revisable · matriz actualizada · sync repo.

---

## 10. Prompt Lovable

```text
PM-002 — Admin Suite
Materializa la Admin Suite de EatClean / YourMeal OS.
Reutiliza rutas admin existentes, RBAC, audit_log, feature_flags, i18n.
Incluye: Dashboard, clientes, menús, producción (consulta), promociones, facturación.
Experiencias completas (vacío/datos/loading/error).
No inventes reglas ni motores. No recrees infraestructura.
Incremento revisable tras PM-001.
```

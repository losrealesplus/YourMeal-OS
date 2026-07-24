# Pilot Security Checklist · RI-001

**Fecha:** 2026-07-24  
**Tipo:** Security memory · Evidence *(no metodología nueva)*  
**Knowledge Lifetime:** Iteration  
**Alcance:** preparación de piloto EatClean / YourMeal OS (RI-001)  
**No es:** “0 issues” como objetivo · auditoría final de producción

> **FOPEBA:** cuando algo no se cambia, debe quedar claro **por qué** no se cambia y bajo qué condiciones sigue siendo aceptable.

---

## 1. Dos tipos de hallazgos

| Tipo | Tratamiento |
|------|-------------|
| **1. Vulnerabilidades reales** | Corregir antes del piloto (o declarar fuera de alcance con Explicit Uncertainty). |
| **2. Patrones necesarios** (Supabase / Postgres / RLS) | Documentar + justificar. No “arreglar” a costa de romper políticas. |

Ignorar un hallazgo **sin memoria** no es aceptable.  
Aceptar un hallazgo **con justificación técnica** sí lo es.

---

## 2. Estado del escaneo pre-piloto

| Métrica | Resultado |
|---------|-----------|
| Hallazgos iniciales (referencia) | 11 |
| Corregidos | 10 |
| Restantes documentados | **1** (Accepted · justificado) |

### Correcciones aplicadas (resumen)

- RLS endurecido en tablas sensibles de cliente / empresa / proveedores: acceso solo a **propietario**, **staff autorizado** (`has_any_staff_role`) o **saas_admin**.
- Migration: `supabase/migrations/20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql`
- `REVOKE EXECUTE … FROM PUBLIC, anon` en helpers `SECURITY DEFINER` usados por RLS.
- `GRANT EXECUTE … TO authenticated` retenido **a propósito** (ver §3).

### Tablas cubiertas en el endurecimiento

`customers` · `customer_addresses` · `customer_allergies` · `customer_phones` · `customer_preferences` · `company_departments` · `company_employees` · `company_locations` · `suppliers`

---

## 3. Hallazgo restante · Accepted

### Finding

> `authenticated` can execute `SECURITY DEFINER` functions

### Clasificación

**Tipo 2 — patrón necesario para RLS / Supabase.**

### Decisión

**No corregir** (no revocar EXECUTE a `authenticated`).

### Por qué es necesario

En Postgres/Supabase, las políticas RLS se evalúan en el contexto del rol llamante. Los helpers `SECURITY DEFINER` (`has_role`, `is_tenant_member`, `has_any_staff_role`, `is_customer_owner`, …) deben ser ejecutables por `authenticated`; si no, **las propias políticas dejan de funcionar**.

La migración lo deja explícito:

```sql
-- These are RLS helpers; anon has no reason to call them. Authenticated must
-- retain EXECUTE because policies evaluate them in the caller's role context.
```

### Condiciones de aceptación (todas deben cumplirse)

| Condición | Estado esperado |
|-----------|-----------------|
| La función hace **solo comprobaciones** (o mutaciones acotadas con checks internos) | ✅ helpers booleanos / ownership |
| No permite **modificar datos arbitrarios** fuera de su contrato | ✅ |
| No **devuelve filas de negocio entre tenants** | ✅ (membership / role checks) |
| No puede usarse para **escalar privilegios** más allá de lo que ya implica el rol | ✅ |
| `anon` / `PUBLIC` **sin** EXECUTE | ✅ revocado |
| `search_path` fijado en definición | ✅ `SET search_path = public` |

### Qué no implica esta aceptación

- No implica que **todas** las RPCs `SECURITY DEFINER` de negocio estén libres de revisión (p. ej. `program_draft_order`, `transition_order_status` siguen en el inventario de la **segunda auditoría**).
- No implica “0 issues” en el escáner — el escáner puede seguir marcando el patrón; la memoria manda.

### Inventario mínimo de helpers RLS (Accepted)

| Función | Uso |
|---------|-----|
| `has_role` | Rol exacto en tenant |
| `is_saas_admin` | Admin de plataforma |
| `current_user_tenants` | Membership set |
| `is_tenant_member` | Miembro o saas_admin |
| `has_any_staff_role` | Staff de operación |
| `is_customer_owner` | Dueño del customer row |

---

## 4. Pilot Security Checklist (RI-001)

Usar antes de firmar G-02 / arrancar FOV. Marcar en entorno real.

```text
□ No existen tablas de negocio sin RLS.
□ Todas las tablas sensibles tienen políticas activas.
□ No existen funciones SECURITY DEFINER innecesarias.
□ Todas las funciones SECURITY DEFINER están documentadas (esta memoria + docs/06-database).
□ Ninguna función SECURITY DEFINER modifica permisos / roles.
□ Ninguna función SECURITY DEFINER devuelve datos entre tenants.
□ Todas las consultas de app utilizan tenant_id cuando aplica.
□ Storage utiliza políticas RLS.
□ Signed URLs tienen expiración limitada.
□ No existen claves de servicio (service_role) expuestas al cliente.
□ No existen secretos en el frontend.
□ Audit Log registra acciones administrativas relevantes.
□ RBAC validado con todos los roles del piloto.
```

**Nota:** el ítem “authenticated puede ejecutar SECURITY DEFINER (helpers RLS)” **no** es un fallo de checklist si cumple §3.

---

## 5. Segunda auditoría (después de RI-001)

No invertir más tiempo ahora en perseguir “0 issues”.

Orden recomendado:

```text
1. ✅ Terminar Functional Completeness (EP-001)
2. ⏳ Ejecutar RI-001 (piloto / evidencia)
3. ⏳ Corregir hallazgos operacionales
4. ⏳ Repetir escaneo de seguridad
5. ⏳ Revisión manual de alto nivel:
      RLS · Storage · API · RBAC · autenticación · RPCs SECURITY DEFINER de negocio
```

Así la segunda auditoría evalúa un sistema **cercano al que entrará en producción**, no un prototipo en movimiento.

---

## 6. Referencias

- Migration RLS + revoke: `supabase/migrations/20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql`
- [Database README](../06-database/README.md) · helpers
- [Capability Matrix](./CAPABILITY_MATRIX.md)
- [G-02 Pilot Readiness](../20-evidence-framework/08-gate-g02-pilot-readiness.md)
- [PILOT_ACCEPTANCE_CHECKLIST](../00-status/PILOT_ACCEPTANCE_CHECKLIST.md)
- [Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md) (honestidad de superficie; aquí: honestidad de riesgo aceptado)

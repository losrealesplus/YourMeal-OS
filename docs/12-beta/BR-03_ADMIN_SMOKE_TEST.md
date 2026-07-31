# BR-03.2 · Admin Smoke Test

**Fecha:** 2026-07-31  
**Tipo:** Certificación de flujo (sin nuevas funcionalidades)  
**Precedente:** [BR-03.1 Admin Audit](./BR-03_ADMIN_AUDIT.md)  
**Estrategia BR-03:** Certificar Admin (no construir Admin desde cero)  
**Pregunta:** ¿Puede un administrador preparar una semana completa de EatClean?

---

## Método de evidencia

| Capa | Qué se hizo |
|------|-------------|
| **Estructural** | Recorrido código UI + servicios (`admin.dishes`, `admin.menus`, CAP-003 customer read) |
| **Runtime live** | **No ejecutado** en este entorno (login real / PS-002-C · credenciales operador) |

Leyenda de resultado por paso:

| Resultado | Significado |
|----------|------------|
| **PASS** | El paso es realizable en la UI/código actual |
| **FAIL** | El paso es requerido por el smoke y **no** está disponible o falla por gap de producto |
| **BLOCKED** | No se pudo verificar en runtime (entorno / auth), sin invalidar el hallazgo estructural |

---

## Flujo bajo prueba

```text
Login admin
  → Crear plato
  → Editar plato
  → Activar / Desactivar
  → Crear Weekly Menu (draft)
  → Añadir platos a todos los días
  → Publicar
  → Verificar visible para cliente
```

---

## Resultados por paso

### 1. Login administrador

| | |
|--|--|
| **Resultado** | **BLOCKED** (runtime) · **PASS** (estructural) |
| Evidencia | `/auth` · `/auth/admin` · guard `assertStaffRoute` en `admin.tsx` · home admin vía `resolveHomePath` |
| Runtime | Requiere PS-002-C / credenciales staff reales en dispositivo o browser |
| Notas | Sin login real no se certifican los pasos siguientes en vivo; el resto se evalúa por código |

---

### 2. Crear un plato

| | |
|--|--|
| **Resultado** | **PASS** |
| Evidencia | `admin.dishes.tsx` → formulario «Nuevo plato» → `DishService.create(..., status: "active")` |
| Capacidades | `dishes.create` |
| Notas | El plato nace **ya activo** («Crear activo») |

---

### 3. Editar el plato

| | |
|--|--|
| **Resultado** | **FAIL** |
| Causa | La UI de `/admin/dishes` **no** expone formulario de edición ni llama a `DishService.update` con campos de negocio (solo `update` para activar) |
| Dominio | `UpdateDishUseCase` / `DishService.update` existen en módulo, **no cableados a la pantalla** |
| Impacto | No se puede corregir nombre/precio/descripción tras el alta sin intervención técnica |
| Propuesta mínima (BR-03.3) | Botón «Editar» en fila → mismo formulario de alta en modo patch (`name`, `description`, `price`, `kcal`) vía `DishService.update` · sin rediseño |

---

### 4. Activar / Desactivar

| | |
|--|--|
| **Resultado** | **FAIL** (par incompleto) |
| Activar | **PASS** — botón «Activar» si `status !== "active"` · `DishService.update({ status: "active" })` |
| Desactivar | **FAIL** — no hay control UI; `DeactivateDishUseCase` existe solo en dominio |
| Impacto | No se puede retirar un plato de la oferta operativa desde el panel (salvo no usarlo en el menú) |
| Propuesta mínima (BR-03.3) | Botón «Desactivar» para filas `active` → `DishService.update({ status: "inactive" })` o use case UC-004 · filtrar `DishService.list` / selector de menú a platos activos (ya alineado en menús) |

**Workaround beta (sin BR-03.3):** crear platos ya activos y no depender de desactivar para preparar la semana.

---

### 5. Crear un Weekly Menu

| | |
|--|--|
| **Resultado** | **PASS** |
| Evidencia | `admin.menus.tsx` → «Borrador semana actual» → `WeeklyMenuService.ensureDraft` |
| Capacidades | `menus.write` |

---

### 6. Añadir platos a todos los días

| | |
|--|--|
| **Resultado** | **PASS** (con matiz operativo) |
| Evidencia | Selector día + plato → `WeeklyMenuService.addDishToDay` · días = `utcWeekDates(week_start)` |
| Matiz | La UI añade **un slot por acción**; cubrir «todos los días» es repetición manual (lun–dom), no un botón «rellenar semana» |
| Impacto | No bloquea la beta; solo DX |
| Propuesta mínima | Ninguna obligatoria; opcional más adelante «copiar a resto de días» (fuera de BR-03.3 salvo que el smoke live lo declare bloqueante) |

---

### 7. Publicar el Weekly Menu

| | |
|--|--|
| **Resultado** | **PASS** |
| Evidencia | Botón «Publicar menú» (si draft y `slots.length > 0`) → `WeeklyMenuService.publish` · status `published` + `published_at` |
| Capacidades | `menus.write` |

---

### 8. Verificar que queda visible para clientes

| | |
|--|--|
| **Resultado** | **PASS** (estructural) · **BLOCKED** (runtime cliente) |
| Evidencia | Cliente `/app/menu` → `useWeeklyMenu` → `fetchPublishedWeeklyMenu` → `weekly_menus` con `status = published` + slots |
| Runtime | Requiere sesión cliente + menú publicado en el mismo tenant |
| Notas | Cadena de lectura CAP-003 cableada; no se ejecutó smoke E2E admin→cliente en este PR |

---

## Tabla resumen

| # | Paso | Resultado |
|---|------|-----------|
| 1 | Login administrador | BLOCKED runtime / PASS estructural |
| 2 | Crear plato | **PASS** |
| 3 | Editar plato | **FAIL** |
| 4 | Activar / Desactivar | **FAIL** (activar OK · desactivar no) |
| 5 | Crear Weekly Menu | **PASS** |
| 6 | Añadir platos a todos los días | **PASS** |
| 7 | Publicar | **PASS** |
| 8 | Visible para clientes | PASS estructural / BLOCKED runtime |

---

## Veredicto de certificación

```text
Administrador puede preparar una semana completa
  → NO CERTIFICADO aún (criterio smoke estricto)
```

### Por qué

El smoke pide **Editar** y **Desactivar**. Ambos faltan en UI → **FAIL**.

### Matiz de producto (beta acotada)

El camino **mínimo para publicar una semana**:

```text
Crear plato (ya activo) → Borrador semana → Añadir slots → Publicar → Cliente lee published
```

está **estructuralmente PASS** (pasos 2, 5, 6, 7, 8).

Si Product CTO acepta ese camino acotado **sin** editar/desactivar en la beta, BR-03.4 puede certificarse tras:

1. Smoke **runtime** de login + create + publish + vista cliente (cierra BLOCKED), y  
2. Declarar explícitamente fuera de alcance: editar / desactivar (o cerrarlos en BR-03.3).

---

## Gaps para BR-03.3 (solo lo que desbloquea)

| ID | Gap | Severidad beta | Fix mínimo |
|----|-----|----------------|------------|
| G1 | Sin editar plato en UI | Media (smoke estricto FAIL) | Form patch 4 campos |
| G2 | Sin desactivar plato en UI | Media (smoke estricto FAIL) | Botón desactivar |
| G3 | Smoke runtime no ejecutado | Alta para certificación real | Operador: login staff + recorrido live |
| G4 | Rellenar todos los días manual | Baja | No obligatorio |

**No priorizar en BR-03.3:** inventario, promociones, informes, quitar slot, unpublish, categorías.

---

## Roadmap BR-03 (actualizado)

| ID | Objetivo | Estado |
|----|----------|--------|
| BR-03.1 | Admin Audit | Documento (PR audit) |
| **BR-03.2** | **Admin Smoke Test** | **Este documento** |
| BR-03.3 | Gap Fixes (solo G1/G2/G3 si se exige smoke estricto) | Pendiente decisión Product CTO |
| BR-03.4 | Admin Certified | Tras PASS runtime + política de gaps |

---

## Evidencia de código

| Paso | Path |
|------|------|
| Login / shell | `src/routes/_authenticated/admin.tsx` · `admin-shell.tsx` |
| Platos | `src/routes/_authenticated/admin.dishes.tsx` |
| Menús | `src/routes/_authenticated/admin.menus.tsx` |
| Publish / slots | `src/modules/weekly-menu/application/weekly-menu-service.ts` |
| Cliente menú | `src/routes/_authenticated/app.menu.tsx` · `fetchPublishedWeeklyMenu` |

---

## Decisión pedida (Product CTO)

Elegir una:

**A — Smoke estricto**  
Exige Editar + Desactivar → abrir **BR-03.3** (G1+G2) → luego runtime → BR-03.4.

**B — Beta acotada**  
Aceptar alta-activa + publish sin editar/desactivar → solo **runtime smoke** (G3) → BR-03.4 con gaps declarados fuera de alcance.

Recomendación alineada a «jornada EatClean»: **B**, salvo que el operador necesite corregir platos tras el alta en la primera semana piloto.

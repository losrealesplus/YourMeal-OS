# Dish (Plato)

**Término ubicuo:** Dish  
**Módulo:** Dish Library (Module 01)  
**Persistencia actual:** `dishes`  
**Estado del documento:** 🚧 Borrador de dominio — listo para guiar implementación  
**Código:** inglés · **Docs:** español

---

## Responsabilidad

Un **Dish** es un plato **comercializable** ofrecido por un tenant (ej. “Chicken Teriyaki”).

Es el corazón del modelo: menús, pedidos, cocina, producción, compras, inventario, contabilidad e IA futura referencian platos.

No es una materia prima (eso es **Ingredient**).  
No es la lista de cantidades (eso es **Recipe**).

---

## Invariantes

1. Pertenece a **exactamente un** `tenant_id`.
2. `name` obligatorio (no vacío tras trim).
3. Pesos en **gramos** (`weight_g`); costes/precios en **decimal**; moneda vía settings del tenant.
4. No se hard-delete en flujos normales: `archive` / `restore`; `purge` solo SaaS Admin.
5. Las líneas históricas de pedido pueden conservar `dish_id` tras archivar; la UI de selección oculta no activos.
6. Toda mutación relevante escribe auditoría.
7. Quien muta debe tener la capability correspondiente (`dishes.create|update|archive|…`).

---

## Estados

| Estado ubicuo | Valor BD hoy | Significado |
|---------------|--------------|-------------|
| Draft | `draft` | Editable; no ofrecible en menús |
| Published | `active` | Disponible para menús/pedidos |
| Archived | `archived` (+ `deleted_at`) | Retirado; no seleccionable en nuevos flujos |

**Transiciones (Service):**

```text
draft → published → archived
draft → archived
archived → draft | published   (restore)
```

> Migrar el nombre BD `active` → `published` solo con ADR.

Detalle: [STATE_MACHINES.md](../STATE_MACHINES.md)

---

## Relaciones

| Relación | Entidad | Cardinalidad | Notas |
|----------|---------|--------------|-------|
| Tenant | Tenant | N:1 | Obligatorio |
| Recipe | Recipe / RecipeIngredient | 1:N líneas | Composición |
| Menu Slot | WeeklyMenu / MenuItem | 1:N usos | Oferta semanal |
| Order Item | OrderItem | 1:N | Demanda |
| Audit | audit_log | 1:N | Trazabilidad |

---

## Reglas de negocio

- Crear: capability `dishes.create`; estado inicial `draft`.
- Publicar: solo desde `draft` (o restore a published según reglas del Service).
- Archivar: `dishes.archive`; set `deleted_at`, `deleted_by`, `status = archived`.
- Restaurar: `dishes.restore`; limpia soft-delete; estado por defecto `draft` salvo regla explícita.
- Purge: `dishes.purge` + `records.purge`; SaaS Admin; audit previo.
- Precio/coste: no strings localizados en BD.
- Alérgenos: lista canónica en array (evolución futura a tablas si ADR lo pide).

---

## Casos límite

| Caso | Tratamiento |
|------|-------------|
| Nombre vacío / solo espacios | Rechazar (`INVALID_STATE`) |
| Update de plato archivado | No vía `update` normal; primero `restore` |
| Plato referenciado en pedidos al archivar | Permitir archive; no romper FKs |
| Tenant mismatch | `TENANT_MISMATCH` / RLS |
| Sin capability | `PERMISSION_DENIED` |
| Duplicado de nombre | TBD (¿único por tenant?): decidir en implementación Service; documentar aquí al cerrar |

---

## Eventos que genera (futuro)

| Evento | Cuándo |
|--------|--------|
| `DishCreated` | Alta |
| `DishPublished` | draft → published |
| `DishArchived` | archive |

Emisión real diferida (scaffold en `packages/events`).

---

## Eventos que consume

Ninguno en Module 01. (Futuro: posibles reacciones a cambios de Ingredient/coste — fuera de alcance ahora.)

---

## Capacities / permisos

Ver [CAPABILITY_MATRIX.md](../../09-security/CAPABILITY_MATRIX.md): `dishes.read|create|update|archive|restore|purge`.

---

## Objetivos de este documento

Cerrar el **qué / cómo / por qué / para qué** del Dish **antes** de ampliar CRUD/UI.

Implementación de dominio: `src/modules/dish-library/domain/`.

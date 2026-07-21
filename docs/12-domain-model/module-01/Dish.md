# Dish (Plato)

**Término ubicuo:** Dish  
**Módulo:** Dish Library (Module 01)  
**Persistencia actual:** `dishes`  
**Estado del documento:** ✅ Dominio cerrado — Domain Done ([DOMAIN_DONE.md](../DOMAIN_DONE.md))  
**Código:** inglés · **Docs:** español

---

## ¿Qué es un Dish?

Un **Dish** representa un producto que la empresa puede **producir, planificar, vender y gestionar** durante todo su ciclo de vida.

No representa únicamente una receta.

Representa una **unidad de negocio**.

Es la entidad central sobre la que giran la planificación, la producción, los costes y la venta.

No es una materia prima (eso es **Ingredient**).  
No es la lista de cantidades (eso es **Recipe**).  
No es una pantalla ni un formulario: debe poder existir únicamente como **concepto de dominio**.

## Misión

Permitir que cualquier empresa gestione de forma consistente su catálogo de productos alimentarios.

Dish debe ser completamente independiente de la interfaz.

---

## Responsabilidades

Un Dish es responsable de:

- mantener su identidad;
- mantener su estado;
- conocer su receta asociada;
- conocer su información nutricional;
- conocer sus alérgenos;
- conocer su coste calculado;
- conocer su precio de venta;
- conocer su rendimiento;
- conocer su categoría;
- conocer sus etiquetas;
- poder activarse;
- poder desactivarse;
- poder archivarse;
- poder restaurarse.

## No es responsabilidad de Dish

Dish **no** conoce:

- clientes;
- pedidos;
- producción;
- inventario;
- compras;
- reparto;
- rutas;
- empleados;
- facturación;
- pagos.

Estas responsabilidades pertenecen a otros módulos.

---

## Estados

```text
Draft
↓
Active
↓
Inactive
↓
Archived
```

| Estado | Significado |
|--------|-------------|
| `draft` | El plato está siendo creado. Puede modificarse libremente. No aparece en producción ni puede venderse. |
| `active` | Disponible para planificación, producción, pedidos y menús. |
| `inactive` | Existe y conserva su historial, pero no puede utilizarse para nuevas operaciones. |
| `archived` | Soft Delete. Nunca se elimina físicamente. Mantiene relaciones e historial. Solo puede restaurarse o purgarse según permisos de plataforma. |

**Transiciones esperadas (Service / casos de uso):**

```text
draft → active
active → inactive
inactive → active
draft | active | inactive → archived
archived → inactive | draft   (según regla de restore)
```

**Nota de implementación futura:** si la persistencia actual todavía no soporta `inactive`, el dominio sigue mandando. La capa de implementación deberá adaptarse al dominio, no al revés.

Detalle transversal: [STATE_MACHINES.md](../STATE_MACHINES.md)

---

## Invariantes

Un Dish nunca puede incumplir las siguientes reglas:

1. Debe pertenecer a **exactamente un** `tenant_id`.
2. Debe tener `name` obligatorio (no vacío tras trim).
3. Debe pertenecer a una **categoría**.
4. Debe tener una **receta válida** cuando el negocio así lo requiera.
5. No puede estar archivado y activo al mismo tiempo.
6. No puede existir duplicado dentro del mismo tenant según las reglas de negocio.
7. Todas las operaciones respetan el tenant activo.
8. Todas las operaciones generan auditoría.
9. Pesos en **gramos** (`weight_g`); costes/precios en **decimal**; moneda vía settings del tenant.
10. No existe hard-delete en flujos normales: `archive` / `restore`; `purge` solo SaaS Admin.

---

## Value Objects

El dominio utilizará objetos de valor cuando aporten reglas propias. Ejemplos iniciales:

- `DishName`
- `PortionSize`
- `Calories`
- `Price`
- `NutritionFacts`

Regla: **no utilizar primitivas cuando exista comportamiento asociado**.

> La selección exacta de Value Objects se cierra en la implementación de dominio, pero su necesidad ya forma parte del modelo.

---

## Relaciones

Dish se relaciona con:

- `Recipe`
- `Category`
- `Tags`
- `Allergens`
- `Nutrition`
- `WeeklyMenu` (futuro)

La relación con `Ingredient` se realiza siempre a través de `Recipe`.

Relaciones transversales relevantes:

| Relación | Entidad | Cardinalidad | Notas |
|----------|---------|--------------|-------|
| Tenant | Tenant | N:1 | Obligatorio |
| Recipe | Recipe / RecipeIngredient | 1:N líneas | Composición |
| Category | Category | N:1 | Obligatoria a nivel de dominio |
| Tags | Tag | N:M | Clasificación de negocio |
| Menu Slot | WeeklyMenu / MenuItem | 1:N usos | Oferta semanal futura |
| Order Item | OrderItem | 1:N | Referencia histórica |
| Audit | audit_log | 1:N | Trazabilidad |

---

## Eventos de dominio

Dish puede generar eventos como:

- `DishCreated`
- `DishUpdated`
- `DishActivated`
- `DishDeactivated`
- `DishArchived`
- `DishRestored`
- `RecipeAssigned`
- `RecipeUpdated`
- `DishDuplicated`

No es necesario implementarlos todavía.  
Sí deben quedar definidos como parte del dominio.

## Eventos que consume

Ninguno en Module 01.  
Futuro fuera de alcance: reacciones a cambios de coste, nutrición o ingredientes.

---

## Operaciones permitidas

El dominio permite:

- crear;
- actualizar;
- activar;
- desactivar;
- archivar;
- restaurar;
- duplicar.

No existe `delete()` físico como operación de negocio.

---

## Reglas de negocio

Toda operación debe:

- respetar RBAC;
- respetar `ServiceContext`;
- respetar `tenant`;
- respetar Auditoría;
- respetar Feature Flags;
- respetar Soft Delete.

Reglas específicas de negocio:

- Crear: capability `dishes.create`; estado inicial `draft`.
- Activar: solo si el Dish cumple las invariantes requeridas por negocio.
- Desactivar: conserva historial, pero lo bloquea para nuevas operaciones.
- Archivar: `dishes.archive`; set `deleted_at`, `deleted_by`, `status = archived`.
- Restaurar: `dishes.restore`; limpia soft-delete y devuelve a un estado permitido por la política del Service.
- Duplicar: crea una nueva identidad dentro del mismo tenant respetando reglas de unicidad.
- Purge: `dishes.purge` + `records.purge`; SaaS Admin; audit previo.
- Precio/coste: nunca strings localizados en BD.
- Alérgenos: lista canónica en array o estructura equivalente hasta que una tabla dedicada sea necesaria.

---

## Casos límite

| Caso | Tratamiento |
|------|-------------|
| Nombre vacío / solo espacios | Rechazar (`INVALID_STATE`) |
| Dish archivado con historial | Nunca borrar físicamente en flujo normal |
| Dish archivado | Puede restaurarse |
| Cambio de receta | El historial anterior debe seguir siendo consistente |
| Tenant mismatch | `TENANT_MISMATCH` / RLS |
| Sin capability | `PERMISSION_DENIED` |
| Duplicado de nombre | Rechazar si rompe unicidad del tenant |
| Rename permitido | Sí, mientras no rompa reglas de unicidad del tenant |

---

## Futuro

El dominio debe permitir incorporar sin romper la arquitectura:

- versiones de recetas;
- variantes de un plato;
- escalado automático;
- IA nutricional;
- IA de costes;
- IA de producción;
- múltiples formatos de venta;
- información nutricional avanzada.

Estas capacidades **no forman parte del MVP**.

---

## Definition of Done — Dish

Dish se considera terminado únicamente cuando existan:

- Dominio definido
- Entidad implementada según [ENTITY_GUIDELINES.md](../ENTITY_GUIDELINES.md)
- Value Objects necesarios
- Estados implementados
- Invariantes protegidas
- Eventos definidos
- Repository Interface
- Service
- Casos de uso
- Tests del dominio
- Documentación actualizada

La interfaz **no** forma parte del cierre del dominio.

---

## Capacities / permisos

Ver [CAPABILITY_MATRIX.md](../../09-security/CAPABILITY_MATRIX.md): `dishes.read|create|update|activate|deactivate|archive|restore|purge`.

---

## Regla permanente

Dish no se desarrolla pensando únicamente en EatClean.

Dish se desarrolla como una capacidad reutilizable del Core.

Sin embargo, toda decisión funcional deberá justificarse por una necesidad real detectada durante la implantación de EatClean.

Todo lo que fortalezca el Core será reutilizado por futuros clientes sin duplicar código.

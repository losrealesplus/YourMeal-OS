# Infrastructure Validation — hito

**Estado:** 🟢 **Infrastructure Validation ✅**  
**Capability:** Dish Management  
**Fecha:** 2026-07-21  
**Versión plataforma:** `v0.1.0`

> El Core de Dish Management permaneció inalterado.  
> Este hito no celebra Supabase.  
> Celebra que **el Core es independiente de la tecnología**.

---

## Definición (cumplida)

> El dominio y la aplicación permanecen inalterados mientras una implementación concreta de infraestructura satisface todos los contratos y todas las pruebas.

```text
DishRepository (contrato)
        ↓
SupabaseDishRepository (adaptador) + mapper Domain ↔ Row
```

---

## Evidencia

| Criterio | Estado |
|----------|--------|
| Especificación `SupabaseDishRepository.md` | ✅ |
| `SupabaseDishRepository` implementa el contrato | ✅ |
| Mapper solo en Infrastructure | ✅ |
| Domain / Application / Guidelines intactos | ✅ |
| Migración de esquema alinea persistencia al dominio (`inactive`, `category_id`, …) | ✅ |
| Tests mapper + UCs vía adaptador de persistencia (mismo mapper) | ✅ 45 tests totales |

**Hallazgo (no inventado):** el esquema legado no cubría `inactive` ni `category_id` / `recipe_id` / `tags`.  
Infrastructure se adaptó al dominio con migración — el Core no se redujo al esquema.

---

## Qué queda fuera (siguiente hito)

```text
Integration Validation ⏳
```

Probar el cliente Supabase real (proyecto / RLS / EatClean) en entorno integrado.  
Eso ya no examina la arquitectura del Core; examina el cableado operativo.

---

## Después

```text
Infrastructure Validation ✅
        ↓
Integration Validation
        ↓
UI MVP
        ↓
Primer usuario real (EatClean = primer profesor del Core)
        ↓
Segunda Capability
```

---

## Relacionado

- [SupabaseDishRepository.md](../13-repositories/SupabaseDishRepository.md)
- [DishRepository.md](../13-repositories/DishRepository.md)
- Diario de Capabilities / metodología estable

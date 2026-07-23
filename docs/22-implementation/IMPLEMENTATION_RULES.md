# Implementation Rules — Constitución Etapa 2

**Ámbito:** Carril B · fase de **conexión** (Cursor = ingeniero de materialización).  
**Premisa:** el Product Skeleton UX ya existe. Cursor **no rediseña**. Cursor **conecta**.

---

## Principio único

```text
Cursor no implementa funcionalidades.
Cursor implementa capacidades previamente certificadas.
```

---

## Constitución

```text
La implementación está subordinada al Operational Model.

Toda lógica implementada debe tener una referencia explícita
(Knowledge Traceability).

Nunca se implementará una regla operacional que no exista
previamente en el Knowledge Base (docs/17 + checks + dynamics).

Si una funcionalidad requiere una regla nueva:

        STOP

Debe volver al Carril A (FOV → FER → KU).
No se implementa.
```

---

## Roles

| Quién | Rol |
|-------|-----|
| **FOPEBA** | Certifica conocimiento |
| **Lovable** | Arquitecto visual (Product Skeleton) — **no reabrir rediseño** sin causa |
| **Cursor** | Ingeniero de materialización — estado · query · repos · services · hooks · adapters · Supabase |
| **EatClean** | Laboratorio FOV (Carril A) |

---

## Prohibido en Cursor (salvo ADR / bug visual bloqueante)

- Modificar diseño / UX / layout «porque queda mejor»  
- Cambiar rutas o navegación sin justificación OM  
- Cambiar o eliminar componentes visuales de Lovable  
- Inventar campos, entidades o reglas  
- «Aprovechar» para meter Fase D (heurísticas de campo)

---

## Permitido

- Estado · loaders · TanStack Query  
- Repositorios · servicios · hooks · adapters  
- Supabase / RLS / audit_log / feature_flags (infra existente)  
- i18n keys **si** faltan para copy ya prevista (no copy de producto nueva inventada)  
- Knowledge Traceability en cabeceras de services/use cases  
- Tests de conexión / contratos  

---

## Plantilla de instrucción a Cursor

```text
Conecta [capacidad / pantalla existente].
No modifiques el diseño.
No modifiques UX.
No cambies rutas.
No cambies componentes visuales.
Implementa únicamente: estado · loaders · query · repository · service · hooks · adapters · Supabase.
Mantén intacta la estructura visual creada por Lovable.
Knowledge Source: [ruta OM / objeto / lifecycle].
Evidence Level: Table-Validated.
```

---

## Si aparece una regla nueva

1. STOP  
2. Registrar como observación / candidato FOV o FO-E/C  
3. Carril A (FER → KU)  
4. Solo entonces volver a implementar  

---

## Relacionado

- [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md)  
- [Happy Path E2E](./HAPPY_PATH_E2E.md)  
- [Knowledge Traceability](../15-product/etapa-2/knowledge-traceability.md)  
- [Product Materialization Rules](../21-product-materialization/PRODUCT_MATERIALIZATION_RULES.md)

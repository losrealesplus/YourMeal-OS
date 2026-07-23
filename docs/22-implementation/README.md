# 22 · Implementation — conectar el Product Skeleton

**Product Skeleton UX:** materializado (Lovable).  
**Business logic:** 🔒 deliberadamente bloqueada salvo capacidades certificadas.

```text
Operational Knowledge
        ↓
Operational Model (Table-Validated)
        ↓
UX / Product Skeleton
        ↓
Frontend connected      ← Cursor ahora
        ↓
Backend / Supabase
```

---

## Documentos

| Doc | Rol |
|-----|-----|
| [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md) | Constitución Etapa 2 (Cursor) |
| [IMPLEMENTATION_BACKLOG](./IMPLEMENTATION_BACKLOG.md) | Scaffold → Connected → Operational → Validated |
| [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md) | Primer pedido real · puente a FOV |

---

## Evaluación de estado

| Área | Estado |
|------|--------|
| Operational Model | ✅ Table-Validated |
| Customer / Admin / Production / Delivery / DS | ✅ Product Skeleton (UX) |
| UX Foundation | ✅ |
| Business Logic | 🔒 Solo vía capacidades certificadas + trazabilidad |
| Conexión E2E Happy Path | ⏳ Siguiente Cursor |

---

## Siguiente sprint Cursor

No conectar todo. Ejecutar [Happy Path E2E](./HAPPY_PATH_E2E.md) pasos 1→8.

Plantilla de prompt: ver [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md).

# Lovable findings · Decision log (2026-07-24)

**Tipo:** Decision memory · Iteration  
**Foco del proyecto:** EP-002A → EP-002B → RI-001 *(no SEO como prioridad de jornada)*

---

## 1. Contraste (WCAG / tenant branding)

| Campo | Valor |
|-------|--------|
| **Decisión** | ✅ **Cerrado** |
| **Acción** | Usar tokens `text-muted-foreground` / `text-foreground` (y hover a `text-foreground`) |
| **Por qué** | Mejora de **plataforma**: el contraste sobrevive al branding tenant-managed, no es un parche EatClean |
| **Estado código** | Auth / Powered by / BrandLeafMark / QuietLocaleSwitch alineados a tokens semánticos |

Respuesta a Lovable:

> Contrast fixes approved. Mark them as complete.

---

## 2. Google Search Console

| Campo | Valor |
|-------|--------|
| **Decisión** | 🟡 **Aplazado** |
| **No bloquea** | RI-001 · piloto EatClean |
| **Hito** | [Marketing Readiness](./MILESTONE_MARKETING_READINESS.md) |
| **Incluye más adelante** | GSC · sitemap · robots.txt · SEO técnico · Analytics · Rich Results |

Respuesta a Lovable:

> Google Search Console: postpone until the Marketing Readiness milestone. Do not block RI-001 or the pilot.

---

## 3. Semrush · «menú semanal saludable»

| Campo | Valor |
|-------|--------|
| **Decisión** | 🟢 **Sí, con condición** |
| **Formato** | Contenido **product-led** (no artículo SEO vacío) |
| **Borrador** | [tenants/eatclean/copy/drafts/guia-menu-semanal-saludable.md](../../tenants/eatclean/copy/drafts/guia-menu-semanal-saludable.md) |
| **Publicación** | **No** automática — draft para revisión humana |

Estructura acordada:

```text
Guía definitiva para organizar un menú semanal saludable
  → Beneficios
  → Cómo planificar la semana
  → Errores frecuentes
  → Cómo lo hace EatClean
  → CTA: Programa tu menú semanal
```

Respuesta a Lovable:

> Semrush content: yes, scaffold a long-form guide focused on "menú semanal saludable", but structure it as product-led content that educates users, explains EatClean's service, and naturally drives readers to the weekly ordering experience. Do not publish automatically; generate it as draft content for review.

---

## Prioridad de jornada (sin cambio)

```text
1. EP-002A · Customer Weekly Cycle
2. EP-002B · Operational Execution
3. RI-001
```

El marketing crece sobre un producto que ya funciona. El piloto aporta aprendizajes que también mejoran el contenido.

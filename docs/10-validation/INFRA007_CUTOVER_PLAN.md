# INFRA-007 · SUPABASE CUTOVER PLAN
## Project B becomes Source of Truth (repo preparation)

**Fecha:** 2026-07-29  
**Proyecto SoT:** `djangucecsphnejplvic`  
**URL:** `https://djangucecsphnejplvic.supabase.co`  
**Fuera de alcance de este paso:** Lovable Cloud env · SMTP · OAuth · usuarios · SQL/migraciones · Auth/Identity/Flow code  

---

## Objetivo

Dejar el **repositorio** alineado con **B** como único Source of Truth de binding (CLI, templates, types script, docs de onboarding/infra), sin tocar lógica de negocio ni Environment Variables de Lovable.

Legacy `cbeegcxkayybfncnuirg` permanece **solo** en documentación histórica (FCR, auditorías, evidencias).

---

## Pre-check

| Item | Resultado |
|------|-----------|
| PR #107 INFRA-004 | OPEN (draft) — comparación A/B **VALID** |
| Objetivo SoT | `djangucecsphnejplvic` |
| Auth / Identity / Flow / SQL | **No modificados** |

---

## Verificación de superficies de binding

| Archivo | Estado pre-INFRA-007 | Acción |
|---------|----------------------|--------|
| `.env.example` | Ya `djangucecsphnejplvic` | Confirmado — sin cambio de valores |
| `supabase/config.toml` | `project_id = "djangucecsphnejplvic"` | Confirmado |
| `package.json` `gen:types` | `--project-id djangucecsphnejplvic` | Confirmado |
| `scripts/*` | Env-driven (sin hardcode A) | Confirmado |
| `src/integrations/supabase/client.ts` | Lee `VITE_SUPABASE_*` | Confirmado — sin hardcode |
| `.env` (tracked) | Aún legacy A | **No modificado** (Environment Variables / Lovable fuera de alcance) |
| Docs FCR / INFRA-001…006 / evidence | Contienen A históricos | **Preservados** |

---

## Archivos modificados (este PR)

| Archivo | Cambio |
|---------|--------|
| `docs/10-validation/INFRA007_CUTOVER_PLAN.md` | Este plan |
| `docs/10-validation/README.md` | Enlace onboarding → INFRA-007 |
| `docs/06-database/README.md` | Enlace cutover → INFRA-007 |

---

## Variables esperadas (B)

Para runtime local / Lovable Cloud (**operador**; no aplicado aquí):

```bash
SUPABASE_PROJECT_ID="djangucecsphnejplvic"
SUPABASE_URL="https://djangucecsphnejplvic.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<publishable de B>"
VITE_SUPABASE_PROJECT_ID="djangucecsphnejplvic"
VITE_SUPABASE_URL="https://djangucecsphnejplvic.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable de B>"
```

Plantilla: `.env.example`.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `.env` tracked sigue en A hasta acción operador/Lovable | Conectar Lovable Cloud con vars B; no confiar solo en `.env` del repo |
| Revert Lovable previo (#106 → A) | Tras merge, fijar vars Cloud B y rebuild |
| SMTP / Site URL / Redirects (INFRA-006) | Fuera de este PR; requisito Dashboard operador |
| Keys en git | Usar placeholders en templates; no commitear secrets nuevos aquí |

---

## Plan de rollback

1. Restaurar `VITE_SUPABASE_*` / `SUPABASE_*` al ref A **solo** en entorno operador si hace falta emergencia.  
2. Revertir este PR de docs si el plan se invalida.  
3. **No** reintroducir hardcodes de A en `config.toml` / `package.json` / `.env.example`.

---

## Checklist de verificación

```text
□ Runtime apunta a B
  (operador: Lovable Cloud + .env local = djangucecsphnejplvic + publishable B)

□ CLI apunta a B
  (supabase/config.toml project_id = djangucecsphnejplvic) ✅ repo

□ Types apuntan a B
  (npm run gen:types --project-id djangucecsphnejplvic) ✅ repo

□ Configuración consistente
  (.env.example ↔ config.toml ↔ gen:types = B) ✅ repo

□ No quedan referencias runtime a A
  (src/ / scripts/ / package.json / config.toml / .env.example) ✅
  (.env tracked: pendiente operador — no tocado en INFRA-007)
```

---

## Post-check (repo prep)

| Pregunta | Respuesta |
|----------|-----------|
| ¿Código Auth/Identity/Flow tocado? | No |
| ¿SQL/migraciones tocadas? | No |
| ¿Lovable env modificado? | No |
| ¿Repo templates listos para conectar Lovable a B? | **Sí** |

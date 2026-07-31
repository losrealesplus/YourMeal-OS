# BR-03.3 · Admin Runtime Validation (G3)

**Fecha:** 2026-07-31  
**Tipo:** Validación runtime del flujo operativo acotado (sin nuevas funcionalidades)  
**Precedente:** [BR-03 Scope Decision B](./BR-03_SCOPE_DECISION.md) · [BR-03.2 Smoke](./BR-03_ADMIN_SMOKE_TEST.md)  
**Alcance:** Solo **G3** — recorrido live admin → menú visible para cliente  
**Fuera de alcance:** Edit Dish · Disable Dish (Beta vNext)

---

## Objetivo

Cerrar el único bloqueo que impide certificar BR-03 bajo decisión B:

> El menú publicado debe ser consumible por el cliente en runtime real.

---

## Flujo a ejecutar (operador)

```text
1. Login administrador (staff)
2. Crear un plato (activo)
3. Crear Weekly Menu (draft / semana actual)
4. Añadir platos a los días de la semana
5. Publicar el Weekly Menu
6. Login cliente (mismo tenant) · abrir /app/menu
7. Verificar menú published visible
```

**No se exige:** editar plato · desactivar plato.

---

## Checklist de evidencia

| # | Paso | Resultado | Notas / captura |
|---|------|-----------|-----------------|
| 1 | Login admin | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| 2 | Crear plato | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| 3 | Crear semana draft | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| 4 | Añadir slots (días) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| 5 | Publicar | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| 6 | Cliente ve menú | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |

**Entorno:** URL / tenant / fecha · operador · build (web o nativo).

**Dependencias conocidas:** PS-002-C / credenciales staff + cliente en el mismo tenant.

---

## Criterio de cierre BR-03.3

| Condición | Efecto |
|-----------|--------|
| Pasos 1–6 **PASS** | BR-03.3 cerrado → abrir **BR-03.4 Admin Certified** |
| Cualquier FAIL que rompa el flujo acotado | Documentar causa · impacto · fix mínimo (solo si bloquea el flujo) |
| BLOCKED por credenciales / entorno | No es FAIL de producto; resolver entorno y reintentar |

Regla FOPEBA: un FAIL solo bloquea certificación si impide el flujo operativo definido ([Scope Decision](./BR-03_SCOPE_DECISION.md)).

---

## Plantilla de fallo (si aparece)

```text
Paso:
Resultado: FAIL
Causa:
Impacto (¿impide Create→Publish→Client?):
Propuesta mínima para desbloquear beta:
```

No implementar soluciones grandes en este ticket: documentar y, si es bloqueante, un gap fix mínimo en PR aparte.

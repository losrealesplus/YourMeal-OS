# Cursor CTO · Lovable UI · Docs como fuente de verdad

Fecha: 2026-07-20  
Versión: v0.1.0  
Módulo: Gobierno  
Estado: ✅ Regla permanente (ADR 0012)

---

## ¿Qué es?

Formalización del reparto de responsabilidades:

- **Cursor** = CTO (arquitectura, dominio, implementación seria)
- **Documentación** = fuente de verdad
- **Lovable** = acelerador de UI
- El código sigue a los docs, no al revés

Incluye el documento de contexto permanente [CONTEXTO_CTO.md](../../05-architecture/CONTEXTO_CTO.md) para no reiniciar Foundation en cada chat.

---

## ¿Cómo es?

```text
docs/ + ADRs  →  deciden
Cursor        →  aplica / implementa dominio y plataforma
Lovable       →  pantallas bajo design system + Services
Código        →  evidencia de la documentación
```

---

## ¿Por qué existe?

Evitar que las decisiones de arquitectura queden dispersas entre prompts de Lovable y chats cortos. El proyecto deja de “crecer por accidente” y pasa a **construir conocimiento** de empresa de software.

---

## ¿Para qué sirve?

| Aporta a | Valor |
|----------|--------|
| Equipo | Roles claros |
| Agentes IA | Misma constitución en cada sesión |
| Producto | Consistencia a escala multi-tenant |

---

## Objetivos

**Principal:** fijar Cursor como CTO y docs como SoT.  
**Secundarios:** onboarding rápido vía CONTEXTO_CTO; no rehacer Architecture Review.

---

## Reglas

- No inventar arquitectura en prompts de UI
- `.lovable/plan.md` subordinado a `docs/`
- Module 01+ Domain Driven bajo Cursor

---

## Dependencias

Necesita: Foundation Lock, ADR 0010/0011.  
Utilizado por: todas las sesiones futuras.

---

## Futuro

Mantener CONTEXTO_CTO actualizado en cada cambio de fase (status + roadmap).

---

## Decisiones tomadas

- No repetir Architecture Review: ya aprobado y lockeado
- Siguiente trabajo: dominio Dish en código, sin UI
- ADR 0012

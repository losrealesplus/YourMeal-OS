# VS-002 — Semana con festivo

**Estado:** ⏳ pendiente  
**Validation Report:** —

## Pregunta de refutación

¿El modelo distingue **menú aplicable** vs **día sin servicio** sin romper INV-032 (Order dentro de Menu) ni crear Orders «fuera de calendario»?

## Narrativa operativa

Festivo nacional en miércoles. Menú de dos días laborables ajustado. Parte de Beneficiaries no piden ese día. Plan de producción con demanda desigual.

## Cadena de comprobación

| Capa | Tensión esperada | Coherente |
|------|------------------|-----------|
| Core Objects | Weekly Menu · Order · Plan | ⏳ |
| Dependencies | Menu `covers` período vs día | ⏳ |
| Lifecycles | Menu Published con excepción de día | ⏳ |
| Checks | ¿Puede confirmarse Order para día no ofertado? | ⏳ |
| Invariants | INV-012 · INV-032 | ⏳ |

## Hipótesis de rotura

Falta concepto de «día sin servicio» o exceso de excepciones ad hoc fuera del modelo.

## Resultado preliminar

⏳ Pendiente

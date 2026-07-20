# Protocolo de cierre de jornada

Cuando el equipo diga **"Ya casi terminamos por hoy"**, se sigue siempre este protocolo antes de cerrar la sesión.

## Regla de color

**No dejar el proyecto en amarillo.**

| Estado | Significado | ¿Cerrar así? |
|--------|-------------|--------------|
| 🟢 Verde | Funcional, documentado y estable | **Objetivo habitual** |
| 🔴 Rojo | Refactor grande incompleto a propósito | Solo excepción documentada |
| 🟡 Amarillo | ¿Funciona o no? Estado intermedio | **Prohibido al cerrar** |

---

## 1. Revisión del trabajo realizado

- Qué se desarrolló
- Qué quedó terminado
- Qué quedó parcialmente implementado
- Qué quedó pendiente

## 2. Revisión técnica

Comprobar: arquitectura, errores, duplicados, TODOs, deuda técnica, ADRs, modelo de dominio.

## 3. Git

Verificar: compilación, sin temporales, commits claros, PR revisado, merge si procede, `main` estable.

## 4. Documentación

Actualizar solo lo necesario: roadmap, estado, ADRs, docs de módulo.

## 5. Actualización del Diario de Desarrollo

Registrar funcionalidades, decisiones y cambios relevantes del día en:

`docs/99-internal/development-journal/YYYY-MM-DD-<tema>.md`

Siguiendo la plantilla del [Diario](../99-internal/development-journal/README.md).

## 6. Resumen del día

### Avance del día
### Errores encontrados
### Checklist del roadmap (hecho / en progreso / pendiente)
### Estado general (fase, próximo objetivo, riesgos)

## 7. Preparación de la siguiente sesión

Dejar definido: siguiente objetivo, primer paso, contexto para retomar.

---

## Relacionado

- [Diario de Desarrollo](../99-internal/development-journal/README.md)
- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
- [ADR 0011](../adr/0011-diario-desarrollo-intencionalidad.md)

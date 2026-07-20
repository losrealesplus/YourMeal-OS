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

Comprobar:

- Arquitectura
- Errores
- Código duplicado
- TODOs
- Deuda técnica
- Consistencia con ADRs
- Consistencia con el modelo de dominio

## 3. Git

Verificar:

- Que todo compile
- Que no existan archivos temporales
- Commits organizados
- Pull Request revisado
- Merge realizado (si procede)
- Rama principal estable

## 4. Documentación

Actualizar solo lo necesario:

- Roadmap
- Estado del proyecto
- ADRs (si hubo decisiones de arquitectura)
- Documentación del módulo (si aplica)

## 5. Resumen del día

Informe con este formato:

### Avance del día

- Funcionalidades implementadas
- Arquitectura añadida
- Documentación creada

### Errores encontrados

- Lista de errores
- Causa
- Solución aplicada

### Checklist del roadmap

- Completado
- En progreso
- Pendiente

### Estado general del proyecto

- Fase actual
- Próximo objetivo
- Riesgos detectados (si existen)

## 6. Preparación de la siguiente sesión

Dejar definido:

- El siguiente objetivo
- El primer paso de la próxima sesión
- El contexto necesario para retomar sin perder tiempo

---

## Relacionado

- [Definition of Done](../00-status/DEFINITION_OF_DONE.md)
- [ADR 0010 — Idioma](../adr/0010-idioma-oficial-desarrollo.md)

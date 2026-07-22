# Product Materialization Rules

Reglas permanentes del Carril B al trabajar con Lovable / Cursor.

---

## Roles de herramientas

| Herramienta | Rol |
|-------------|-----|
| **FOPEBA** | Define y certifica el conocimiento |
| **YourMeal OS** | Arquitectura y dominio |
| **Lovable** | Materializa conocimiento → experiencia de producto |
| **Cursor** | Refina, integra y conecta con implementación técnica |

Ninguna herramienta **inventa** producto. Materializan el OM Table-Validated.

---

## Incrementos, no transformaciones masivas

Cada conversación con Lovable produce un **incremento funcional y revisable** (un PM).  
No un rediseño completo de la aplicación en un solo prompt.

Secuencia: [PM-001](./PM-001-Customer-App.md) → … → [PM-005](./PM-005-Design-System.md).

---

## Infraestructura existente (no recrear)

El proyecto ya dispone de:

- Shell móvil Customer (`MobileShell` · rutas `/app/*`)
- Infraestructura de auditoría (`audit_log` · AuditService)
- Feature flags (`feature_flags` · FeatureFlagService)
- Internacionalización preparada para **seis idiomas** (en · es · de · fr · it · pt)

**Utiliza esta infraestructura.**  
**No la recrees.**  
**No propongas alternativas.**

---

## Experiencias completas, no pantallas sueltas

Cada pantalla/flujo debe incluir estados:

- vacío  
- con datos (variantes relevantes del dominio)  
- loading  
- error  
- offline (si aplica al actor)  
- accesibilidad básica  

Ejemplo: Dashboard con pedido confirmado / pendiente / sin pedido — no solo el happy path feliz.

---

## No inventar lógica

- Sin entidades nuevas fuera del OM.  
- Sin heurísticas / automatizaciones (Fase D 🔒).  
- Sin reglas «porque queda mejor».  
- Toda pantalla → fila en [matriz](./01-screen-knowledge-matrix.md).

---

## Estructura obligatoria de cada PM-xxx

1. Objetivo  
2. Alcance  
3. Actores  
4. Capacidades  
5. Objetos operacionales implicados  
6. Restricciones  
7. Referencias al Operational Model  
8. Criterios de aceptación  
9. Entregables esperados  
10. Prompt Lovable (copiable)

---

## Relacionado

- [README](./README.md) · [02 Lovable Brief](./02-lovable-brief.md)

# MVP Scope Lock 001

Fecha: 2026-08-09  
Versión: MVP_SCOPE_LOCK_001  
Módulo: Gobierno de producto / alcance MVP  
Estado: Scope Locked (documentación)

---

## ¿Qué es?

Contrato oficial que fija el organismo MVP de YourMeal OS: Tenant + Customer App, Order por ambos caminos, Bulk IN (después de individual), Work Plan = Hoja de Producción, Android/iOS mismo commit.

## ¿Cómo es?

Documento en `docs/00-status/MVP_SCOPE_LOCK_001.md` + nota de supersesión de alcance en `ACCELERATOR_002` (Bulk ya no se interpreta como OUT del MVP).

## ¿Por qué existe?

La auditoría baseline mostró substrate amplio y Journeys Certified sin Organism MVP GREEN. Había que fijar IN/OUT (especialmente Tenant Order, Customer Order y Bulk) antes de implementar, para que agentes no sigan el scope histórico de Accelerators/Experiences.

## ¿Para qué sirve?

Gate de construcción: primera implementación = MVP-01 Customer Core (LOCAL Mac), no Order/Bulk/Places.

## Objetivos

- Congelar organismo y orden de fases  
- Registrar blockers B001–B010  
- Definir Organism MVP GREEN  

## Reglas

Ver el Scope Lock. No medir progreso por pantallas ni Journey Certified.

## Dependencias

Baseline `origin/main` @ `6f85053` · Zero Lost Changes en `AGENTS.md`

## Futuro

Misión de implementación MVP-01 tras aprobación humana del documento (commit/PR separados).

## Decisiones tomadas

- Tenant Order IN · Customer Order IN · Bulk IN (después)  
- Work Plan = Hoja · PE Planning no es Work Plan MVP  
- OUT: AI, maps/POD, billing automation, etc. (lista en Scope Lock)  

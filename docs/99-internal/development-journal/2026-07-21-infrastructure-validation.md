# Infrastructure Validation — Core independiente de la tecnología

Fecha: 2026-07-21  
Versión: v0.1.0  
Capability: Dish Management  
Estado: Infrastructure Validation ✅

---

## ¿Qué es?

Hito que demuestra que `DishRepository` puede implementarse sin tocar Domain ni Application.

## ¿Cómo es?

```text
Problema del negocio → … → Application → Tests
                                              ↓
                         Infrastructure Specification
                                              ↓
                         SupabaseDishRepository + mapper
                                              ↓
                         Infrastructure Validation ✅
```

## ¿Por qué existe?

Supabase dejó de ser una decisión de negocio: es solo el primer adaptador.

## ¿Para qué sirve?

Probar que el Core no necesita saber que Supabase existe.

## Objetivos

- Spec corta del adaptador
- Implementación fiel al contrato
- Migración de esquema hacia el dominio (no al revés)
- Pruebas sin modificar Use Cases

## Reglas

- No reglas de negocio en Infrastructure
- Primero evidencia; después abstracción
- Si el esquema no alcanza al dominio: migra infra, no reduce el Core

## Dependencias

- Dish Management Application ✅
- DishRepository contract ✅

## Futuro

Integration Validation → UI MVP → EatClean como profesor del Core → Segunda Capability

## Decisiones tomadas

1. Lenguaje del hito = Infrastructure Validation (no “hacer Supabase”).
2. Hueco de esquema reportado y cerrado en infra.
3. Core intacto.

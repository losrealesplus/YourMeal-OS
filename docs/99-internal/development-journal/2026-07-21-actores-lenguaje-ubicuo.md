# Actores · Lenguaje ubicuo oficial

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Transversal (dominio / lenguaje)  
Estado: ✅ Incorporado

---

## ¿Qué es?

La definición oficial de actores del dominio de YourMeal OS:

- Organización
- Administrador
- Empleado
- Consumidor
- Cuenta Empresa
- Beneficiario

## ¿Cómo es?

Documento en `docs/12-domain-model/ACTORS.md`, integrado en `UBIQUITOUS_LANGUAGE.md` y enlazado desde el índice de docs y `AGENTS.md`.

Regla dura: **prohibido** usar «Cliente» sin contexto que indique el actor concreto.

## ¿Por qué existe?

«Cliente» generaba ambigüedad constante: ¿Organización SaaS? ¿Consumidor B2C? ¿Cuenta Empresa? ¿Beneficiario?

Sin actores formales, el dominio, los ADRs y el código terminan hablando de cosas distintas con la misma palabra.

## ¿Para qué sirve?

- Forzar precisión en docs, PRs, ADRs y conversaciones técnicas.
- Separar roles de identidades (una persona puede ser Administradora y Consumidora).
- Alinear código inglés (`Consumer`, `CompanyAccount`, `Beneficiary`) con docs en español.

## Objetivos

- Cerrar el vocabulario de actores antes de modelar Orders / portal.
- Corregir glosario legado (`Customer`, `company_employees` = Beneficiario).
- Actualizar Filosofía de Producto y Roadmap para hablar de Organización.

## Reglas

- YourMeal OS modela roles, no personas.
- Cada actor tiene un significado y una responsabilidad.
- Renombrar BD/código legado solo con ADR; hasta entonces usar el mapa de migración.

## Dependencias

- ADR 0010 (idioma)
- `UBIQUITOUS_LANGUAGE.md`
- Filosofía de Producto / Contexto Estratégico

## Futuro

- Aplicar actores al modelar Orders, Consumer Portal y Cuenta Empresa.
- Evaluar ADR de renombre `Customer` → `Consumer` y `company_employees` → beneficiaries cuando toque el módulo.

## Decisiones tomadas

1. Actores oficiales fijados en `ACTORS.md`.
2. «Cliente» sin contexto queda prohibido en documentación nueva.
3. En docs comerciales/estratégicos, «cliente SaaS» = Organización.
4. Empleado ≠ Beneficiario (antes ambos se mezclaban con `Employee` / `company_employees`).

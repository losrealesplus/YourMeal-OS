# EXPERIENCE REFACTOR · EatClean v1

**Sprint:** Experience only · no lógica · no Supabase · no HP-001  
**Docs:** [TENANT_IMPLEMENTATION](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) · [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) · [CJ-001](./CUSTOMER_JOURNEYS.md#cj-001--pedido-semanal) · [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
**Continuación (bitácora):** [EXPERIENCE_REFACTOR_EATCLEAN_V1_1](./EXPERIENCE_REFACTOR_EATCLEAN_V1_1.md)

## Objetivo

> Que la Customer Application se sienta como la **app oficial de EatClean**.

Pregunta: ¿Mi madre podría hacer un pedido sin que nadie le explique la app?

**Product identity:** Instagram EatClean (platos reales) + brand de la web.  
El Menú semanal debe sentir «hoy toca elegir qué voy a comer», no un CRUD.

## Cierre del sprint UI → evidencia

Cuando Splash · Login · Home · Menú · Resumen están en la app:

> **Dejar de diseñar por intuición. Observar uso real.**

Protocolo: [CJ001_USAGE_OBSERVATION](./CJ001_USAGE_OBSERVATION.md)  
Cuatro preguntas · sesión 20–30 min · sin ayudar.

## Fuera de alcance (hard)

- Lógica de negocio · repositorios · servicios · BD · HP-001 · nuevas capabilities  

## Primer entregable (5 pantallas)

1. Splash  
2. Login  
3. Home  
4. Menú semanal  
5. Resumen del pedido (schedule step 3)  

Si estas cinco transmiten «app oficial de EatClean», el resto sigue el mismo lenguaje.

## Misión Lovable / diseño

> Imagina que un cliente de EatClean acaba de descargar la aplicación desde la App Store. La experiencia debe ser tan coherente con la web oficial que el usuario nunca perciba que existe una plataforma SaaS detrás. Diseña una interfaz moderna, limpia y cálida, donde el objetivo principal sea completar el pedido semanal en menos de dos minutos. Prioriza la simplicidad, las fotografías de comida real, el espacio en blanco y una navegación intuitiva. El BackOffice no forma parte de esta experiencia y permanece oculto salvo para usuarios autorizados.

Fuente de marca: https://eatcleantenerifecatering.es/ — identidad/tono/fotos, **no** layout.

## Checklist PR

Ver [cinco preguntas](./README.md#revisión-de-pr-experience).

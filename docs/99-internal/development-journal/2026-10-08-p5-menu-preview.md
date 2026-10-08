# Preview de presentación del menú

Fecha: 2026-10-08. Versión: Sprint 01 P5.1. Módulo: Food / Instance presentation. Estado: preview aislada para revisión.

## ¿Qué es?

Proyección de slots canónicos a posiciones principales y Extras configurables.

## ¿Cómo es?

Overlay local por slotId, configuración en instancia, DTO financiero existente intacto.

## ¿Por qué existe?

EatClean necesita comunicar su oferta con cuatro platillos y Extras.

## ¿Para qué sirve?

Permite revisar el formato antes de tocar publicaciones o proveedor.

## Objetivos

Orden estable, compatibilidad legacy y validación explícita de borrador.

## Reglas

Sin rutas productivas, schema, publicaciones, activación ni fotos inventadas.

## Dependencias

WeeklyMenuDayView y OfferPricing existentes; nombres fuente Excel C2:C8, IDs LAB.

## Futuro

Contrato exacto de persistencia y aprobación separada antes de implementar SQL.

## Decisiones tomadas

Separar preview de autoridad de publicación; mantener un Dish, un slot y un pedido canónicos.

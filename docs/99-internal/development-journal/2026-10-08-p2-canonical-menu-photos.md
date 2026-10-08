# Fotos canónicas en menú cliente

Fecha: 2026-10-08. Versión: Sprint 01 P2.1. Módulo: Weekly Menu / Customer Experience. Estado: implementación aislada para revisión.

## ¿Qué es?

Conexión del campo photoUrl ya proyectado a la vista de menú.

## ¿Cómo es?

HTTPS válido, fallback al hero y después emoji ante error; estado separado por fuente.

## ¿Por qué existe?

La vista anterior mostraba la misma imagen para platos diferentes.

## ¿Para qué sirve?

Permite reconocer visualmente qué comida se selecciona.

## Objetivos

Fotos correctas, navegación y precios intactos, errores de red sin imagen rota permanente.

## Reglas

Sin asociación aproximada, importación Drive o mutación productiva.

## Dependencias

CAP-003 y catálogo tenant-scoped existentes.

## Futuro

Manifest de fotografías con IDs y revisión humana; separado de este PR.

## Decisiones tomadas

Reutilizar mapper, Storage y DishThumb; no crear infraestructura ni writer.

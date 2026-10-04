# Carril explícito de activación inicial Gate 7

Fecha: 2026-10-04. Versión: 1. Módulo: gobierno/despliegue. Estado: LOCAL_VERIFIED, pendiente de PR/revisión humana.

## ¿Qué es?

Remediación de la activación que #488 había descrito sin mecanismo ejecutable.

## ¿Cómo es?

Contrato limitado a base/deployment reales, historial inicial fijo y un único PR de remediación; payload determinista con hashes de archivos, actor y contexto de run comprobados, manifest y revalidación Phase 2. [Contrato canónico](../../05-architecture/GATE7_POST_MERGE_AUTOMATION.md#carril-initial_activation--remediación-acotada).

## ¿Por qué existe?

La reconciliación mostró un fail-closed correcto pero ningún carril capaz de consumir la autorización explícita de bootstrap.

## ¿Para qué sirve?

Preparar una sola activación conocida hasta aprobación soberana; no conceder autoridad futura sobre SPECIAL.

## Objetivos

Conservar SPECIAL, Build Once → Deploy Exactly That, aprobación production-worker, ledger auténtico y publicación sin administración de dominios.

## Reglas

Este bloque termina en PR OPEN; sin merge/dispatch/deploy. El target y autorización reales se obtienen solo tras merge humano y nueva reconciliación. Ningún dato de fixture equivale a publicación real.

## Dependencias

Contrato #488 y #483; historia/protecciones GitHub existentes; reviewer Alexander; Node 20 y Wrangler 4.86. Sin permisos nuevos ni consulta necesaria del inventario de secretos.

## Futuro

Alexander revisa/mergea el PR; se verifica el main nuevo y se autoriza preparación por su contrato exacto. Producción conserva aprobación OOB independiente.

## Decisiones tomadas

Anclar también deployment ID impide reabrir el bootstrap con una publicación posterior al mismo SHA. El hash es identidad de alcance, no firma/autoridad. Manifest y ledger conservan esa identidad; discrepancia bloquea, nunca cae a modo normal. Si main avanza durante upload, no se aplica la versión ni se revierte automáticamente. No se toca el modelo operativo ni el producto.

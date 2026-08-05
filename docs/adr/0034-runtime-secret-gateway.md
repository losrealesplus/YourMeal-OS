# ADR 0034 — Runtime Secret Gateway (hidden command palette)

## Estado

**Accepted** — 2026-08-05  
**Detalle técnico:** [RUNTIME_SECRET_GATEWAY](../05-architecture/RUNTIME_SECRET_GATEWAY.md)

## Contexto

YourMeal OS necesita un Runtime Developer Suite (Inspector) para diagnóstico en Web y Android. Exponer botones “Developer” / “Debug” en producto diluye la marca y enseña la puerta a cualquiera.

## Decisión

Acceso al Inspector (y futuras herramientas) mediante una **Command Palette oculta**: frase secreta por teclado, sin UI, sin persistencia del secreto, desacoplada del Inspector vía `CustomEvent`.

Comando v1: **`YMOS Horus`** (case-insensitive) → `ymos-runtime-open`.

## Consecuencias

- Firma operativa de ingeniería: solo quien conoce la frase entra.
- Extensible (`YMOS Doctor`, `YMOS Assets`, …) sin rediseño.
- Riesgo aceptado: keydown en soft-keyboards Android puede variar; mecanismos previos (query/storage/gesture) permanecen.

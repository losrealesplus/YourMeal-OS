# Gate 7 — diagnóstico seguro del parser

## DOCUMENT CONTEXT CHECK

Foundation, AGENTS, protocolo operativo, estrategia/filosofía/contexto CTO, ADR 0101 y contrato Gate 7 consultados en este bloque de remediación. La autorización humana pide diagnóstico mínimo y extensión bootstrap exacta, sin producción ni cambio de dominio. Inversión operativa: explicar por qué se bloquea una preparación de EatClean conservando autoridad humana.

## Causa y corrección documental

Causa de run #17 STILL UNKNOWN. El input previsto de PRs era `[486,487,488,489,490]`; el estado AUTHORIZED_INITIAL_ACTIVATION no debe atribuirse como entrada recibida. Se corrige el informe local anterior. No se reconstruye ni inventa el evento desaparecido.

## Implementación

Cinco límites de parseo contextualizados; helper pequeño sin raw/cause ni endpoints en mensajes. Formas JSON mínimas y validaciones semánticas existentes se conservan. Suite diagnóstica integrada en Phase 1, negativos con sentinelas sensibles y procesos CLI sin red. Extensión de un único sexto PR con #490 fijado, branch y ocho paths exactos; no permiso genérico SPECIAL.

## Evidencia y stop

PASS: release/activación/publicación/diagnóstico 46/46 con evento de activación heredado; gobernanza 25/25; typecheck/build Node 20.20.2; lint/Prettier de cambios, YAML, nueve bloques shell y diff-check. Actionlint 1.7.12 pasa excluyendo solo el diagnóstico heredado sobre queue:max, ya aceptado por GitHub. También se detectó y corrigió escritura canónica truncada sobre pipe antes de process.exit; prueba de certificado completo mayor de 8 KiB, sin atribuirlo al run #17. Resultados completos en descripción del PR; no afirmar CI remoto ni causa original demostrada. Riesgo residual: evento #17 irrecuperable; fallo futuro será diagnosticable en estos límites, sin asegurar que la causa haya sido corregida.

CURRENT STATE: PR OPEN / READY FOR HUMAN REVIEW al completar PR.
NEXT STEP: revisión y merge humano si se acepta.
WHO: Alexander.
REQUIRES AUTHORIZATION: YES, merge y cualquier nueva ejecución separados.
EXPECTED NEXT STATE: main nuevo → reconciliación nueva → identidad canónica nueva.

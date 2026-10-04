# Gate 7 — historial real de Phase 1 y aislamiento del evento de prueba

## DOCUMENT CONTEXT CHECK

L0 FOUNDATION; L1 AGENTS / ENGINEERING_OPERATING_PROTOCOL; L2 estrategia, filosofía, contexto CTO, ADR 0101; contrato Gate7_POST_MERGE_AUTOMATION y autorización humana de investigación/remediación consultados. No cambia dominio, producto, configs Wrangler ni autoridad productiva. Inversión operativa: permitir preparación verificable de EatClean sin debilitar ancestralidad o privilegios.

## Evidencia y causa

Run 37229919269 / SHA 8680099c: classify pasa, build falla en validación, build/package/upload omitidos y deploy omitido. Log demuestra fetch-depth 1 y commit 820eef ausente. Reproducción con fetch depth 1 del SHA exacto reproduce el mismo fatal; unshallow y las mismas 20 pruebas originales pasan. Objeto 820eef existe en historial de origin/main.

Publicación falla independientemente: con historial completo y GITHUB_EVENT_PATH de initial_activation se reproduce el assertion de SUPERSEDED; fixture heredaba inputs de dispatch pese a GITHUB_EVENT_NAME push. Evento propio explícito restaura el escenario sin cambiar validación real.

## Implementación y frontera

Historial completo solo en checkout faltante; evento explícito solo en prueba; extensión determinista de un quinto PR de reparación con #489 fijado, branch y paths exactos y hashes canonicales nuevos. Suite conserva negativos, ancestralidad real y publicación simulada sin red. No hay bypass ni publicación alternativa. Aprobar producción sigue siendo acto humano exclusivo.

## Validación y riesgos

36 pruebas de contrato/activación/publicación pasan con evento initial_activation heredado; gobernanza 25/25, typecheck, build Node 20.20.2, lint de cambios, Prettier, YAML, nueve bloques shell y diff-check pasan. Actionlint 1.7.12 pasa excluyendo únicamente el diagnóstico heredado sobre queue: max, ya aceptado por GitHub; no se cambia esa cola. Evidencia detallada en descripción del PR. CI remoto no se afirma hasta ejecutarse. Historial completo tiene coste de transferencia; activación requiere identidad nueva después de merge y reconciliación posterior. No ejecutado Gate 7, rerun, dispatch o deploy durante esta tarea.

CURRENT STATE: READY FOR HUMAN REVIEW al completar validaciones/PR.
NEXT STEP: revisión humana del PR.
WHO: Alexander.
REQUIRES AUTHORIZATION: YES, merge y nueva ejecución separados.
EXPECTED NEXT STATE: cambio revisado; nuevo target reconciliado antes de activación.

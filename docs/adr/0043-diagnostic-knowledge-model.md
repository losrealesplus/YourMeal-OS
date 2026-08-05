# ADR 0043 — Diagnostic Knowledge Model

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-007  
**Producto:** Developer Platform **v1.4**  
**Detalle:** [KNOWLEDGE_ENGINE](../05-architecture/KNOWLEDGE_ENGINE.md)

## Contexto

Con Doctor · Incident · Doctor UI (#298–#300), el siguiente impulso natural parecía Recommendation Engine. Sin un lenguaje común, cada check nuevo acumularía `if` y strings de consejo duplicados. Recommendation, Recovery, IA y soporte remoto necesitan **un único origen de verdad** declarativo.

## Decisión

1. Introducir **Knowledge Engine** (`src/runtime/knowledge-engine/`) con `RuntimeKnowledge`, Registry, Index y Matcher declarativo.  
2. Cadena oficial: Check → Evidence → Incident → **Knowledge** → Recommendation → Recovery.  
3. Regla de dependencia: Knowledge **no** importa Doctor; Doctor UI **sí** puede consumir Knowledge.  
4. Foundation articles mínimos (Assets, Branding, Supabase, Android, Runtime).  
5. Panel Host `Knowledge` + sección en Doctor UI.  
6. **No** implementar Recommendation Engine, Recovery, ZIP ni IA en este ADR.

## Consecuencias

- Recommendation Engine leerá artículos registrados en lugar de inventar texto.  
- Recovery / Remote Support / AI Assistant reutilizarán el mismo modelo.  
- Añadir conocimiento = `registerKnowledge()` — sin tocar Host ni Doctor Engine.

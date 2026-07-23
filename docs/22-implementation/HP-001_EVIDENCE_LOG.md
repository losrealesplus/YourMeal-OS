# HP-001 Evidence Log — plantilla

**Puente Carril B → Carril A (FOV).**  
No rellenar hasta el primer recorrido real EatClean (post-ORR o durante FOV).

---

```text
HP-001

Fecha:
Versión (commit / tag):
Tenant:
Usuario:

Resultado: (ok | parcial | fallo)

Problemas encontrados:


Knowledge Gap:


Evidence creada: (FO-V / FO-E / FO-C / …)


Knowledge Update necesario: (sí/no · ref KUR)


Resultado ORR: (PASSED | BLOCKED)
```

---

## Uso

1. Fusionar Hardening (PR #23) · aplicar migración `program_draft_order`.  
2. Ejecutar smoke HP-001 con datos reales (sin mocks live).  
3. Completar este log / acta `docs/00-status/ORR_HP-001.md`.  
4. Si hay Knowledge Gap → Carril A (FER → KU), no parchear en código.  
5. Solo con ORR **PASSED** → Ready for FOV.  

Ver [HAPPY_PATHS](./HAPPY_PATHS.md) · [ORR](./ORR.md) · [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md).

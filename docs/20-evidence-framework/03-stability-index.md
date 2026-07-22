# 03 · Stability Index

Parte del [Evidence Framework](./README.md).

## Confidence ≠ Stability

Dos Capabilities pueden compartir **ECL-5** y no ser equivalentes para gobernanza:

| | Planning | Routes |
|--|----------|--------|
| ECL | 5 | 5 |
| Historia | Sin cambios en 6 meses | Cinco iteraciones seguidas |

Misma evidencia. **Distinta estabilidad.**

El Stability Index gestiona **deuda conceptual**: qué es seguro asumir como fijo y qué sigue en movimiento.

---

## Niveles

| Nivel | Nombre | Significado |
|-------|--------|-------------|
| **S0** | Experimental | Recién introducido; puede desaparecer |
| **S1** | Changing | Iteraciones frecuentes; no anclar producto |
| **S2** | Stable | Pocos cambios; base razonable |
| **S3** | Frozen | Congelado salvo VR→MC / G-01 excepcional |

```text
S0 Experimental → S1 Changing → S2 Stable → S3 Frozen
```

---

## Lectura conjunta (ECL × Stability)

| Concepto | ECL | Stability |
|----------|-----|-----------|
| Order | 5 | S3 |
| Batch | 5 | S3 |
| Route | 4 | S2 |
| Planning | 3 | S1 |
| Dynamic Pricing | 1 | S0 |

**Implicaciones:**

- ECL alto + S0/S1 → evidencia fuerte pero concepto aún volátil; cuidado al acoplar código.  
- ECL bajo + S3 → peligro: congelar hipótesis.  
- ECL alto + S3 → candidato a base permanente / Certified.

---

## Reglas

1. Un MC aplicado **baja** Stability al menos a S1 hasta re-estabilizar.  
2. **Frozen (S3)** exige ECL ≥ 3 (preferible ≥ 4 en Core).  
3. Etapa 2 puede implementar S2/S3; S0/S1 solo con waiver explícito.  
4. Stability no se “sube” por calendario vacío de commits — se sube por **ausencia de MC/FOR Extended** en ventana acordada + revisión.

---

## Relacionado

- [02 ECL](./02-evidence-confidence-levels.md)  
- [05 Knowledge Update](./05-knowledge-update.md)  
- [07 G-01](./07-gate-g01-operational-readiness.md)

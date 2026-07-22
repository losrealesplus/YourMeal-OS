# G-01 · Decisión

Solo existen **tres** resultados. Nada más.

```text
APPROVED
```

```text
APPROVED WITH CONDITIONS
```

```text
REJECTED
```

---

## Definiciones

### APPROVED

Package completo.  
EC positiva.  
Riesgos críticos = 0.  
Known Limitations explícitas (no ocultan agujeros estructurales).  

Efecto:

```text
Operational Knowledge Certified
        ↓
Stage 2 — Product Engineering
```

Desbloquea: UX de espina · Capabilities · código de dominio · roadmap por evidencia.

---

### APPROVED WITH CONDITIONS

Package completo.  
Valor/EC suficiente para un **alcance acotado**.  
Condiciones **explícitas, fechadas y con owner** — no waivers silenciosos.

| Condición válida | Condición **inválida** (→ REJECTED) |
|------------------|-------------------------------------|
| Material risk con plan ≤ N días | Saltar FOV / FER / KUR / ECR |
| Subconjunto de Capabilities autorizado | «Aprobamos Core a medias» |
| Known Limitation que acota Stage 2 | Riesgo Critical abierto |
| Medición OVI a reforzar en paralelo | Editar modelo sin KU |

Efecto: Stage 2 **solo** dentro del alcance condicionado.  
Fuera de alcance = sigue bloqueado.  
Condiciones incumplidas en fecha → el gate se **revisa** (puede pasar a REJECTED).

---

### REJECTED

Cualquiera de:

- Package incompleto  
- EC negativa  
- FO-C estructural sin KUR  
- Riesgo Critical abierto  
- Intento de waiver de criterios de conocimiento  

Efecto: Stage 2 de espina **no** abre.  
Carril B (sin engines) puede continuar.  
Se indica qué remediar para reabrir sesión.

---

## Qué no desbloquea nunca (cualquier resultado)

- Reinventar dominio sin VR→MC  
- Sustituir evidencia por preferencia de stack  
- Tratar Lovable / UI como fuente de verdad de dominio  

---

## Relacionado

- [01 Package](./01-package.md)  
- [03 Acta](./03-acta.md)

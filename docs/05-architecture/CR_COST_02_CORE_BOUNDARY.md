# CR-COST-02: CORE VS FOOD BOUNDARY SPECIFICATION (REFINED)
**Versión:** 2.0.0  
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)

---

## 1. Matriz de Separación de Capas

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PLATFORM CORE (src/modules/cost-intelligence/)                           │
│    • Motor matemático WAC (calculateWeightedAverageCost)                    │
│    • Motor genérico de composición BOM (bom-calculator.ts)                 │
│    • Contratos agnósticos: BOMComponent, YieldLossConfig, OverheadsConfig   │
│    • Motor Sandbox de Simulación E9 (cost-simulation-engine.ts)             │
│    • Invariante: CERO referencias a "dish", "recipe" o "kitchen" en Core    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FOOD & CATERING VERTICAL PACK (src/modules/dish-library/ / Food Adapter) │
│    • Adaptador FoodCostBaselineAdapter (transforma dishes -> Core Snapshot) │
│    • Tablas culinarias: 'ingredients', 'dishes', 'dish_ingredients'         │
│    • Almacenamiento culinario: 'waste_percentage', 'kcal', 'macros'         │
│    • Overheads de plato: 'labor_cost', 'energy_cost', 'packaging_cost'      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. INSTANCE LAYER (EatClean Tenerife)                                       │
│    • Datos reales de ingredientes y recetas de EatClean                     │
│    • Costes específicos de mano de obra y envases de la cocina de Tenerife │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariante del Adaptador Food $\rightarrow$ Core

```typescript
/**
 * FoodCostBaselineAdapter transforma entidades culinarias en el contrato
 * neutro que exige el motor E9 del Core.
 */
export function buildFoodCostBaselineSnapshot(
  snapshotId: string,
  dishes: Array<FoodDishRecord>,
  ingredients: Map<string, FoodIngredientRecord>,
  recipes: Array<FoodRecipeLineRecord>,
): CostBaselineSnapshot {
  const products: BaselineProduct[] = dishes.map((dish) => {
    const dishRecipes = recipes.filter((r) => r.dishId === dish.id);
    const bomComponents: BOMComponent[] = dishRecipes.map((r) => {
      const ing = ingredients.get(r.ingredientId);
      return {
        componentId: r.ingredientId,
        componentName: ing?.name ?? "Unknown Ingredient",
        quantity: r.amount,
        unit: ing?.unit ?? "g",
        unitCost: ing?.cost ?? 0,
        yieldLoss: {
          wastePercentage: ing?.wastePercentage ?? 0,
        },
        supplierId: ing?.supplierId,
      };
    });

    return {
      productId: dish.id,
      productName: dish.name,
      salesPrice: dish.price,
      monthlyVolume: dish.monthlyVolume ?? 0,
      bomComponents,
      overheads: {
        laborCost: dish.laborCost ?? 0,
        energyCost: dish.energyCost ?? 0,
        packagingCost: dish.packagingCost ?? 0,
      },
    };
  });

  return {
    snapshotId,
    createdAt: new Date().toISOString(),
    products,
  };
}
```

/**
 * Mock catalog for the Customer App scaffold.
 *
 * NOT business data. NOT persisted. Do NOT use in Services.
 * Exists only so screens can render coherent placeholders while the real
 * DishService / OrderService / MenuService are wired in.
 *
 * Backed conceptually by Operational Model:
 *   Dish · WeeklyMenu · Order · Delivery
 * See docs/17-operational-model/02-core-objects/README.md
 */
export type MockDish = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  kcal: number;         // canonical calories
  proteinG: number;     // grams (canonical)
  carbsG: number;       // grams
  fatG: number;         // grams
  tags: Array<"vegan" | "vegetarian" | "glutenFree" | "lactoseFree" | "spicy">;
  allergens: string[];
  ingredients: string[];
};

export type MockOrderStatus =
  | "pending" | "preparing" | "dispatched" | "delivered" | "cancelled";

export type MockOrder = {
  id: string;
  weekLabel: string;
  meals: number;
  status: MockOrderStatus;
  deliveryDateIso: string;       // UTC
  totalCents: number;            // canonical decimal
  currency: string;              // ISO 4217
  items: Array<{ dishId: string; qty: number }>;
};

export const MOCK_DISHES: MockDish[] = [
  {
    id: "dish-01",
    name: "Bowl de quinoa & aguacate",
    tagline: "Bowl fresco de temporada",
    emoji: "🥗",
    kcal: 520, proteinG: 22, carbsG: 58, fatG: 18,
    tags: ["vegetarian", "glutenFree"],
    allergens: ["sesame"],
    ingredients: ["quinoa", "aguacate", "tomate cherry", "pepino", "semillas de sésamo", "lima"],
  },
  {
    id: "dish-02",
    name: "Salmón al horno con brócoli",
    tagline: "Fuente de omega-3",
    emoji: "🐟",
    kcal: 610, proteinG: 42, carbsG: 32, fatG: 28,
    tags: ["glutenFree", "lactoseFree"],
    allergens: ["fish"],
    ingredients: ["salmón atlántico", "brócoli", "aceite de oliva", "limón", "ajo"],
  },
  {
    id: "dish-03",
    name: "Curry de garbanzos",
    tagline: "Especias suaves, base cremosa",
    emoji: "🍛",
    kcal: 540, proteinG: 18, carbsG: 66, fatG: 20,
    tags: ["vegan", "spicy"],
    allergens: [],
    ingredients: ["garbanzos", "leche de coco", "tomate", "cebolla", "curry", "arroz basmati"],
  },
  {
    id: "dish-04",
    name: "Pollo teriyaki con arroz",
    tagline: "Proteína magra y arroz jazmín",
    emoji: "🍗",
    kcal: 640, proteinG: 46, carbsG: 68, fatG: 14,
    tags: ["lactoseFree"],
    allergens: ["soy", "gluten"],
    ingredients: ["pollo de corral", "arroz jazmín", "soja", "jengibre", "cebolleta"],
  },
  {
    id: "dish-05",
    name: "Ensalada mediterránea",
    tagline: "Ligera, fresca, canaria",
    emoji: "🥙",
    kcal: 430, proteinG: 16, carbsG: 34, fatG: 24,
    tags: ["vegetarian"],
    allergens: ["milk"],
    ingredients: ["lechuga", "tomate", "aceituna", "feta", "pepino", "aceite de oliva"],
  },
  {
    id: "dish-06",
    name: "Tacos de tempeh",
    tagline: "Plant-based, alto en proteína",
    emoji: "🌮",
    kcal: 560, proteinG: 28, carbsG: 52, fatG: 22,
    tags: ["vegan"],
    allergens: ["soy", "gluten"],
    ingredients: ["tempeh", "tortilla de maíz", "aguacate", "lima", "cilantro"],
  },
];

export function getMockDish(id: string): MockDish | undefined {
  return MOCK_DISHES.find((d) => d.id === id);
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "order-2026-w30",
    weekLabel: "20 – 26 jul 2026",
    meals: 10,
    status: "preparing",
    deliveryDateIso: "2026-07-27T09:00:00Z",
    totalCents: 8990,
    currency: "EUR",
    items: [
      { dishId: "dish-01", qty: 2 },
      { dishId: "dish-02", qty: 3 },
      { dishId: "dish-03", qty: 2 },
      { dishId: "dish-04", qty: 3 },
    ],
  },
  {
    id: "order-2026-w29",
    weekLabel: "13 – 19 jul 2026",
    meals: 8,
    status: "delivered",
    deliveryDateIso: "2026-07-20T09:00:00Z",
    totalCents: 7290,
    currency: "EUR",
    items: [
      { dishId: "dish-05", qty: 3 },
      { dishId: "dish-06", qty: 3 },
      { dishId: "dish-02", qty: 2 },
    ],
  },
];

export function getMockOrder(id: string): MockOrder | undefined {
  return MOCK_ORDERS.find((o) => o.id === id);
}

/**
 * OE001 — Experience-layer conversation picks for menu items.
 *
 * No Menu Facade yet. These labels accelerate phone capture until
 * Menu Experience ships. Not a second catalog database.
 */

export type ConversationDish = {
  /** Local Experience id — never pretend this is a durable catalog UUID. */
  id: string;
  label: string;
  short: string;
};

/** Common EatClean-style conversation accelerators (Spanish operator language). */
export const CONVERSATION_DISHES: ConversationDish[] = [
  { id: "exp:poke-salmon", label: "Poke salmón", short: "Poke" },
  { id: "exp:bowl-pollo", label: "Bowl pollo", short: "Bowl" },
  { id: "exp:ensalada-cesar", label: "Ensalada César", short: "César" },
  { id: "exp:wrap-atun", label: "Wrap atún", short: "Wrap" },
  { id: "exp:quinoa-veggie", label: "Quinoa veggie", short: "Quinoa" },
  { id: "exp:smoothie-verde", label: "Smoothie verde", short: "Smoothie" },
];

export function dishById(id: string): ConversationDish | undefined {
  return CONVERSATION_DISHES.find((d) => d.id === id);
}

export function customDishId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `exp:custom:${slug || "item"}`;
}

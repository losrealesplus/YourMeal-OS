import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MenuDishPhoto, canonicalDishPhotoUrl } from "./menu-dish-photo";
import { MenuDishPost } from "./menu-dish-post";
import type { MockDish } from "@/lib/mock-catalog";
const dish: MockDish = {
  id: "dish-a",
  name: "Plato A",
  tagline: "",
  emoji: "🍽️",
  kcal: 100,
  proteinG: 1,
  carbsG: 2,
  fatG: 3,
  price: 11.9,
  tags: [],
  allergens: [],
  ingredients: [],
};
describe("canonical menu photos", () => {
  it("keeps distinct photos attached to their own dish and preserves selection", () => {
    const html = renderToStaticMarkup(
      <>
        {["a", "b"].map((id) => (
          <MenuDishPost
            key={id}
            dish={{ ...dish, id, name: id }}
            photoUrl={`https://media.example/${id}.webp`}
            imageSrc="/placeholder.jpg"
            macrosLabel="Macros"
            cta={<a href={`/app/schedule?dish=${id}`}>Seleccionar</a>}
          />
        ))}
      </>,
    );
    expect(html).toContain('src="https://media.example/a.webp"');
    expect(html).toContain('src="https://media.example/b.webp"');
    expect(html).toContain("/app/schedule?dish=a");
    expect(html).toContain("/app/schedule?dish=b");
    expect(html).not.toContain('src="/placeholder.jpg"');
  });
  it.each([
    null,
    undefined,
    "",
    "not a url",
    "javascript:alert(1)",
    "data:image/png,x",
    "https://user:pass@media.example/a",
    "http://media.example/a",
  ])("uses placeholder for invalid or missing canonical photo %s", (photoUrl) => {
    const html = renderToStaticMarkup(
      <MenuDishPhoto photoUrl={photoUrl} placeholder="/placeholder.jpg" emoji="🍽️" />,
    );
    expect(html).toContain('src="/placeholder.jpg"');
  });
  it("renders decorative emoji when neither photo nor placeholder is available", () => {
    const html = renderToStaticMarkup(<MenuDishPhoto emoji="🍽️" />);
    expect(html).not.toContain("<img");
    expect(html).toContain("aria-hidden");
  });
  it("normalizes the canonical value without inventing a Drive URL", () => {
    expect(canonicalDishPhotoUrl(" https://media.example/a.webp ")).toBe(
      "https://media.example/a.webp",
    );
  });
});

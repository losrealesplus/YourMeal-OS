import { eatcleanPreviewConfig } from "../../../../../instances/yourmeal-eatclean/config/menu-presentation.preview";
import type { WeeklyMenuDayView } from "../../application/weekly-menu-mapper";
import { offerPrices } from "../../application/offer-pricing";
import type { SlotPresentation } from "../draft-menu-presentation";
/** Names transcribed from the supplied workbook Hoja 1 C2:C8. IDs/date/prices are LAB fixtures, not provider observations. */
const names = [
  "Pechuga de pollo en rodajas y salsa 4 quesos acompañado de espaguetti y brócoli al vapor",
  "Merluza en mojo rojo, con papas arrugadas y verduras salteadas.",
  "bisteck de vegetales, arroz blanco y vegetales salteados.",
  "Ensalada de garbanzos crocantes",
  "Crema de calabaza",
  "Yogurt de piña y canela",
  "Zumo natural de frutos rojos",
];
export const previewDay: WeeklyMenuDayView = {
  dayDate: "2026-10-12",
  dishes: names.map((name, i) => ({
    id: `LAB_DISH_${i}`,
    name,
    tagline: "",
    emoji: "",
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    price: 11.9,
    tags: [],
    allergens: [],
    ingredients: [],
  })),
  offers: names.map((_, i) => ({
    slotId: `LAB_SLOT_${i}`,
    dishId: `LAB_DISH_${i}`,
    tenantId: "LAB_EATCLEAN",
    menuId: "LAB_MENU",
    dayDate: "2026-10-12",
    ...offerPrices(11.9, i < 4 ? null : 2.5),
  })),
};
export const previewAssignments: SlotPresentation[] = [
  ...Array.from({ length: 4 }, (_, i) => ({
    slotId: `LAB_SLOT_${i}`,
    section: "primary" as const,
    positionId: `main-${i + 1}`,
  })),
  ...["soups", "yogurt", "juice"].map((categoryId, i) => ({
    slotId: `LAB_SLOT_${i + 4}`,
    section: "extras" as const,
    categoryId,
    sortOrder: 0,
  })),
];
export const previewInput = {
  tenantId: "LAB_EATCLEAN",
  menuId: "LAB_MENU",
  day: previewDay,
  config: eatcleanPreviewConfig("LAB_EATCLEAN"),
  assignments: previewAssignments,
};

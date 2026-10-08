import type { MenuPresentationConfig } from "../../../src/modules/weekly-menu/presentation/draft-menu-presentation";
/** Explicit lab input, not imported by instance runtime and not an activation flag. */
export function eatcleanPreviewConfig(tenantId: string): MenuPresentationConfig {
  return {
    tenantId,
    primaryPositions: [
      { id: "main-1", label: "Platillo 1", categoryLabel: "Carnes" },
      { id: "main-2", label: "Platillo 2", categoryLabel: "Pescados" },
      { id: "main-3", label: "Platillo 3", categoryLabel: "Vegetariano" },
      { id: "main-4", label: "Platillo 4", categoryLabel: "Ensaladas" },
    ],
    extraCategories: [
      { id: "soups", label: "Sopas/Cremas" },
      { id: "yogurt", label: "Yogurt" },
      { id: "juice", label: "Zumo" },
    ],
  };
}

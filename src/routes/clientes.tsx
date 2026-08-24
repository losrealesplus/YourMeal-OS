import { createFileRoute } from "@tanstack/react-router";
import { ClientPortalDirectory } from "@/components/public/client-portal-directory";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Nuestros Clientes — YourMeal OS" },
      {
        name: "description",
        content:
          "Directorio público de marcas de restauración organizada, catering y meal prep operadas sobre YourMeal OS.",
      },
      { property: "og:title", content: "Portal de Clientes — YourMeal OS" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ClientPortalDirectory,
});

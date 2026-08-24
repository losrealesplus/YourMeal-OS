/**
 * YOURMEAL OS — EATCLEAN INSTANCE BRANDING
 *
 * Visual identity and design tokens owned by EatClean instance.
 */

export interface InstanceBranding {
  name: string;
  shortName: string;
  palette: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    foreground: string;
    accent: string;
    success: string;
    error: string;
  };
  typography: {
    display: string;
    body: string;
  };
  borderRadius: string;
  assets: {
    logoSvg: string;
    logoPng: string;
    iconPng: string;
    heroJpg: string;
  };
  poweredBy: {
    visible: boolean;
    label: string;
  };
}

export const eatCleanBranding: InstanceBranding = {
  name: "EatClean",
  shortName: "EatClean",
  palette: {
    primary: "#145B32",
    secondary: "#EDB32A",
    background: "#F7F5F1",
    surface: "#FFFFFF",
    foreground: "#0F2317",
    accent: "#EFF4F1",
    success: "#145B32",
    error: "#B42318",
  },
  typography: {
    display: "Montserrat",
    body: "Open Sans",
  },
  borderRadius: "1.25rem",
  assets: {
    logoSvg: "/tenant/eatclean-logo.svg",
    logoPng: "/tenant/eatclean-logo.png",
    iconPng: "/tenant/eatclean-icon.png",
    heroJpg: "/tenant/eatclean-hero.jpg",
  },
  poweredBy: {
    visible: true,
    label: "Powered by YourMeal OS",
  },
};

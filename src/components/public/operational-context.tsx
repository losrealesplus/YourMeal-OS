import { ChefHat, Truck, BarChart3, Check } from "lucide-react";

export interface ContextCard {
  area: string;
  tagline: string;
  description: string;
  points: string[];
  icon: typeof ChefHat;
}

const CONTEXT_CARDS: ContextCard[] = [
  {
    area: "COCINA & OBRADOR",
    tagline: "Donde los pedidos se convierten en producción.",
    description:
      "Diseñado para soportar el ritmo real de una cocina central: comandas agrupadas por lote, visibilidad inmediata de raciones y advertencias claras de alérgenos.",
    points: [
      "Tabletas táctiles KDS de alta resistencia",
      "Control de tiempos y avance de tandas",
      "Eliminación de papeles mojados o extraviados",
    ],
    icon: ChefHat,
  },
  {
    area: "LOGÍSTICA & FLOTA",
    tagline: "Donde cada ruta tiene un plan.",
    description:
      "Despacha decenas de entregas sin fricción. Los choferes reciben sus listas ordenadas por zona y confirman las entregas directamente en la plataforma.",
    points: [
      "Planificación por códigos postales",
      "Asignación individual a cada repartidor",
      "Gestión de incidencias y reintentos en vivo",
    ],
    icon: Truck,
  },
  {
    area: "GESTIÓN & DIRECCIÓN",
    tagline: "Donde toda la operación termina conectada.",
    description:
      "Visibilidad completa sobre demanda, compras requeridas, costes de materia prima y márgenes reales por cliente y lote cocinado.",
    points: [
      "Consolidación automática de ingresos y costes",
      "Escandallos y recetas siempre actualizados",
      "Gobernanza multi-tenant y auditoría continua",
    ],
    icon: BarChart3,
  },
];

export function OperationalContext() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
      {CONTEXT_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.area}
            className="p-6 sm:p-7 rounded-3xl bg-card border border-border flex flex-col justify-between space-y-6 shadow-sm hover:border-primary/40 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-primary">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  {card.area}
                </span>
              </div>
              <h4 className="font-display font-bold text-lg sm:text-xl text-foreground leading-snug">
                {card.tagline}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border/70">
              {card.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

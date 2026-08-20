import {
  ShoppingBag,
  Layers,
  Flame,
  Truck,
  Users,
  Boxes,
  BarChart3,
  Building2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { YourMealMark } from "@/components/brand/yourmeal-os-logo";

interface ConnectedNode {
  title: string;
  role: string;
  icon: typeof ShoppingBag;
  description: string;
}

const NODES: ConnectedNode[] = [
  {
    title: "Ventas & Pedidos",
    role: "Captura Multicanal",
    icon: ShoppingBag,
    description: "App móvil para comensales, web y entrada manual para recepcionistas.",
  },
  {
    title: "Planificación",
    role: "Lotes & Escandallos",
    icon: Layers,
    description: "Cálculo de raciones totales y materias primas requeridas para el turno.",
  },
  {
    title: "Cocina KDS",
    role: "Tabletas Táctiles",
    icon: Flame,
    description: "Comandas digitales con control de alérgenos y avance sin papeles.",
  },
  {
    title: "Directorio Clientes",
    role: "CRM & Dietas",
    icon: Users,
    description: "Perfiles de salud, exclusiones dietéticas y soporte personalizado.",
  },
  {
    title: "Logística & Rutas",
    role: "Despacho Choferes",
    icon: Truck,
    description: "Organización geográfica de paradas y seguimiento de entregas.",
  },
  {
    title: "Inventario",
    role: "Materias Primas",
    icon: Boxes,
    description: "Control de stock, lista de compras y reposición de ingredientes.",
  },
  {
    title: "Finanzas",
    role: "Márgenes & Costes",
    icon: BarChart3,
    description: "Liquidaciones por lote, costes de producción y balances consolidados.",
  },
  {
    title: "Multi-Tenant",
    role: "Gobernanza de Marcas",
    icon: Building2,
    description: "Subdominios independientes con aislamiento estricto en base de datos (RLS).",
  },
];

export function ProductEcosystem() {
  return (
    <div className="space-y-12">
      {/* Central Platform Hub Card */}
      <div className="max-w-md mx-auto p-6 rounded-3xl bg-card border-2 border-primary/40 shadow-xl text-center space-y-3 relative">
        <div className="flex justify-center">
          <YourMealMark size={56} className="rounded-2xl" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-black text-xl text-foreground">
            YourMeal <span className="text-primary">OS</span>
          </h3>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            Capa Operativa Central
          </p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          El núcleo unificado que sincroniza datos entre cocina, choferes, comensales y administración.
        </p>
      </div>

      {/* Connected 8 Nodes Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {NODES.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.title}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition space-y-3 text-left shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                    {node.role}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-foreground">
                  {node.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {node.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

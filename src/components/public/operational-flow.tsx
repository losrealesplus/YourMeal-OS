import {
  ShoppingBag,
  Layers,
  Flame,
  PackageCheck,
  Truck,
  UserCheck,
  BarChart3,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export interface FlowStep {
  step: string;
  name: string;
  title: string;
  description: string;
  stateBadge: string;
  icon: typeof ShoppingBag;
  passesTo: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    step: "01",
    name: "PEDIDOS",
    title: "Entrada & Registro",
    description: "Captura multicanal vía App móvil, tienda web, carga masiva Excel o pedidos directos.",
    stateBadge: "Confirmado",
    icon: ShoppingBag,
    passesTo: "Demanda Agregada",
  },
  {
    step: "02",
    name: "PRODUCCIÓN",
    title: "Planificación & Lotes",
    description: "Cálculo de raciones totales, materias primas requeridas y escandallos por lote de cocción.",
    stateBadge: "Planificado",
    icon: Layers,
    passesTo: "Comandas KDS",
  },
  {
    step: "03",
    name: "COCINA KDS",
    title: "Ejecución en Tiempo Real",
    description: "Tabletas de cocina sin papel. Avance de tanda, tiempos de cocción y alertas de alérgenos.",
    stateBadge: "En Preparación",
    icon: Flame,
    passesTo: "Estación de Empaque",
  },
  {
    step: "04",
    name: "EMPAQUETADO",
    title: "Etiquetado Térmico",
    description: "Generación de etiquetas con fecha, ingredientes y código de lote para cada ración.",
    stateBadge: "Etiquetado",
    icon: PackageCheck,
    passesTo: "Muelle de Despacho",
  },
  {
    step: "05",
    name: "LOGÍSTICA",
    title: "Rutas & Choferes",
    description: "Agrupación geográfica de paradas, asignación a choferes y control de despachos.",
    stateBadge: "En Reparto",
    icon: Truck,
    passesTo: "Punto de Entrega",
  },
  {
    step: "06",
    name: "ENTREGA",
    title: "Recepción por Cliente",
    description: "Confirmación de entrega en mano, resolución de incidencias en ruta y soporte directo.",
    stateBadge: "Entregado",
    icon: UserCheck,
    passesTo: "Cierre Operativo",
  },
  {
    step: "07",
    name: "FINANZAS",
    title: "Márgenes & Cierre",
    description: "Liquidación contable, coste real de producción por lote y balances consolidados.",
    stateBadge: "Liquidado",
    icon: BarChart3,
    passesTo: "Histórico & Auditoría",
  },
];

export function OperationalFlow() {
  return (
    <div className="space-y-10">
      {/* Desktop / Tablet Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4 relative">
        {FLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.step}
              className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-3 relative group hover:border-primary/50 transition shadow-sm text-left"
            >
              {/* Header: Step Number + Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {step.step}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                  {step.stateBadge}
                </span>
              </div>

              {/* Icon + Title */}
              <div className="space-y-1.5 pt-1">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon className="size-4" />
                </div>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-foreground">
                  {step.name}
                </h4>
                <p className="font-semibold text-xs text-foreground/90 leading-tight">
                  {step.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Next Step Footnote */}
              <div className="pt-2 border-t border-border/60 text-[10px] font-mono text-primary flex items-center gap-1">
                <span>Pasa a: {step.passesTo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

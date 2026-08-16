import { useState } from "react";
import {
  ShoppingBag,
  ChefHat,
  Flame,
  Truck,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  MapPin,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface ShowcaseTab {
  id: string;
  badge: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  description: string;
  points: string[];
  imageSrc?: string;
  workspaceType: "orders" | "production" | "kitchen" | "logistics" | "finance";
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: "pedidos",
    badge: "01 · CAPTURA & ENTRADA",
    tabLabel: "01. Pedidos",
    title: "Todo empieza con el pedido.",
    subtitle: "Recibe, organiza y controla cada pedido desde un único punto operativo.",
    description:
      "Captura pedidos desde la app de clientes, carga masiva desde hojas de cálculo o entrada manual en cabina de operaciones. Cada pedido queda registrado con sus platos, días de entrega y alérgenos.",
    points: [
      "Entrada multicanal unificada (Móvil, Web y Manual)",
      "Importación tolerante a fallos desde archivos Excel (.xlsx)",
      "Historial y repetición rápida para clientes frecuentes",
    ],
    workspaceType: "orders",
  },
  {
    id: "produccion",
    badge: "02 · PLANIFICACIÓN",
    tabLabel: "02. Producción",
    title: "Del pedido a la producción.",
    subtitle: "YourMeal OS transforma la demanda en producción organizada para cocina.",
    description:
      "Agrega automáticamente las raciones de todos los pedidos activos para calcular ingredientes requeridos, escandallos y hojas de producción por tanda y día.",
    points: [
      "Cálculo automático de demanda agregada por plato y lote",
      "Escandallos vinculados a gramajes y costes de materia prima",
      "Hojas de elaboración descargables e imprimibles",
    ],
    workspaceType: "production",
  },
  {
    id: "cocina",
    badge: "03 · KDS EN TIEMPO REAL",
    tabLabel: "03. Cocina KDS",
    title: "Cocina en tiempo real.",
    subtitle: "Las comandas llegan a cocina con estados, prioridades, personalizaciones y alertas críticas.",
    description:
      "Pantalla de cocina táctil diseñada para entornos de calor y ritmo alto. Los cocineros avanzan comandas en un toque y visualizan claramente exclusiones de ingredientes.",
    points: [
      "Comandas organizadas por estado: Cola, Preparación y Listo",
      "Alertas destacadas de alérgenos (sin gluten, sin lácteos, vegano)",
      "Sincronización instantánea sin necesidad de tickets de papel",
    ],
    workspaceType: "kitchen",
  },
  {
    id: "logistica",
    badge: "04 · DESPACHO & RUTAS",
    tabLabel: "04. Logística",
    title: "Del pase a la puerta.",
    subtitle: "Organiza rutas, entregas y responsables sin perder visibilidad sobre la operación.",
    description:
      "Planifica paradas por código postal o zona, asigna rutas a choferes con un clic y registra el estado de entrega o incidencias en ruta con confirmación instantánea.",
    points: [
      "Agrupación automática de paradas por zona geográfica",
      "Asignación de rutas a choferes con control de entregas",
      "Gestión de incidencias y reintentos en tiempo real",
    ],
    workspaceType: "logistics",
  },
  {
    id: "finanzas",
    badge: "05 · CONTROL & MÁRGENES",
    tabLabel: "05. Finanzas",
    title: "La operación también habla de números.",
    subtitle: "Costes, ingresos y márgenes conectados con la actividad real del negocio.",
    description:
      "Comprende la rentabilidad real de cada lote producido. Conecta los pedidos liquidados con el coste de materia prima y mano de obra para proteger tus márgenes.",
    points: [
      "Cálculo de margen bruto por plato y lote cocinado",
      "Resumen de liquidaciones por período y tenant",
      "Directorio de clientes con histórico de consumo y saldo",
    ],
    workspaceType: "finance",
  },
];

export function ProductShowcase() {
  const [activeTabId, setActiveTabId] = useState<string>("pedidos");
  const activeTab = SHOWCASE_TABS.find((t) => t.id === activeTabId) || SHOWCASE_TABS[0];

  return (
    <div className="space-y-8">
      {/* Selector de Pestañas / Módulos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border">
        {SHOWCASE_TABS.map((tab) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-display text-xs font-bold transition whitespace-nowrap min-h-[44px] flex items-center gap-2 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Contenedor Principal: Texto Explicativo + Vista de Producto */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Columna Izquierda: Información del Módulo */}
        <div className="lg:col-span-5 space-y-5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold">
            <span>{activeTab.badge}</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {activeTab.title}
            </h3>
            <p className="font-semibold text-sm sm:text-base text-foreground/90 leading-snug">
              {activeTab.subtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {activeTab.description}
          </p>

          <div className="space-y-2.5 pt-2">
            {activeTab.points.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/80">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Screenshot o Representación Fidedigna */}
        <div className="lg:col-span-7">
          <ProductScreenshot
            workspaceType={activeTab.workspaceType}
            imageSrc={activeTab.imageSrc}
          />
        </div>
      </div>
    </div>
  );
}

interface ProductScreenshotProps {
  workspaceType: "orders" | "production" | "kitchen" | "logistics" | "finance";
  imageSrc?: string;
}

export function ProductScreenshot({ workspaceType, imageSrc }: ProductScreenshotProps) {
  if (imageSrc) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
        <img
          src={imageSrc}
          alt="YourMeal OS Interfaz Real"
          className="w-full h-auto object-cover"
        />
      </div>
    );
  }

  // Representación fidedigna construida con los componentes y tokens reales del sistema
  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden text-left font-sans">
      {/* Top OS Window Header */}
      <div className="bg-muted/70 border-b border-border px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500/80" />
            <span className="size-2.5 rounded-full bg-amber-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] font-mono font-bold text-foreground pl-1">
            YourMeal OS · Vista de Demostración
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
          Workspace: {workspaceType.toUpperCase()}
        </span>
      </div>

      {/* Structured Mockup Area according to Workspace */}
      <div className="p-4 sm:p-5 bg-card/60 min-h-[300px]">
        {workspaceType === "orders" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-foreground">Bandeja de Pedidos Activos</span>
              <span className="text-muted-foreground text-[11px]">Turno: Hoy</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Pedido #1042 — Roberto M.</p>
                  <p className="text-muted-foreground text-[11px]">5 platos · Entrega: Lunes Mañana · Santa Cruz</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                  Confirmado
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Pedido #1043 — Clínica Norte</p>
                  <p className="text-muted-foreground text-[11px]">18 platos · Menú Corporativo · La Laguna</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px]">
                  En Producción
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Pedido #1044 — Laura G.</p>
                  <p className="text-muted-foreground text-[11px]">3 platos · Dieta Celíaca · Adeje</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold text-[10px]">
                  Alérgeno: Sin Gluten
                </span>
              </div>
            </div>
          </div>
        )}

        {workspaceType === "production" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-foreground">Hoja de Producción & Demanda Agregada</span>
              <span className="text-muted-foreground text-[11px]">Lote #402</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Plato Principal A</span>
                <p className="font-bold text-foreground">Salmón al Horno con Verduras</p>
                <p className="text-primary font-bold text-xs">84 raciones requeridas</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Plato Principal B</span>
                <p className="font-bold text-foreground">Pollo Teriyaki con Arroz Jazmín</p>
                <p className="text-primary font-bold text-xs">62 raciones requeridas</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Plato Vegetariano</span>
                <p className="font-bold text-foreground">Pasta Boloñesa de Lentejas</p>
                <p className="text-primary font-bold text-xs">47 raciones requeridas</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">Total Raciones Lote</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">193 raciones calculadas</p>
                <p className="text-muted-foreground text-[10px]">Escandallos y compras listos</p>
              </div>
            </div>
          </div>
        )}

        {workspaceType === "kitchen" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-foreground">KDS Pantalla Táctil de Cocina</span>
              <span className="text-emerald-500 font-bold text-[11px]">● Conectado en Tiempo Real</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">TANDA 01</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-bold">PREP</span>
                </div>
                <p className="font-bold text-foreground text-xs">Salmón al Horno</p>
                <p className="text-[10px] text-muted-foreground">14 bandejas · Horno 1</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-600">TANDA 02</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold">LISTO</span>
                </div>
                <p className="font-bold text-foreground text-xs">Pollo Teriyaki</p>
                <p className="text-[10px] text-muted-foreground">En estación de empaque</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground">TANDA 03</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-bold">COLA</span>
                </div>
                <p className="font-bold text-foreground text-xs">Pasta Boloñesa</p>
                <p className="text-[10px] text-muted-foreground">Inicio estimado: 11:30</p>
              </div>
            </div>
          </div>
        )}

        {workspaceType === "logistics" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-foreground">Control de Rutas & Despacho</span>
              <span className="text-muted-foreground text-[11px]">Turno Despachado</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Ruta 01 — Santa Cruz Centro (Carlos M.)</p>
                  <p className="text-muted-foreground text-[11px]">38 entregas · 12 paradas completadas</p>
                </div>
                <span className="text-emerald-500 font-bold text-[11px]">100% a tiempo</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">Ruta 02 — La Laguna / Norte (Elena R.)</p>
                  <p className="text-muted-foreground text-[11px]">27 entregas · En reparto activo</p>
                </div>
                <span className="text-primary font-bold text-[11px]">En curso</span>
              </div>
            </div>
          </div>
        )}

        {workspaceType === "finance" && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-foreground">Márgenes y Balance de Operación</span>
              <span className="text-emerald-500 font-bold text-[11px]">Liquidación Consolidada</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground">Ingreso por Lotes</span>
                <p className="font-bold text-foreground text-sm mt-1">Conforme a Pedidos</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground">Coste Materia Prima</span>
                <p className="font-bold text-foreground text-sm mt-1">Escandallos Calculados</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground">Rendimiento de Producción</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-1">Óptimo sin mermas</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground">Trazabilidad</span>
                <p className="font-bold text-primary text-sm mt-1">100% Auditada</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

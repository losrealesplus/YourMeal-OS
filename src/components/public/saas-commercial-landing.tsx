/**
 * PUBLIC: YourMeal OS Commercial Landing (B2B SaaS Platform)
 * Rendered on www.yourmealos.com / yourmealos.com
 */

import { Link } from "@tanstack/react-router";
import {
  ChefHat,
  Truck,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  Cpu,
  Smartphone,
  BarChart3,
  Users,
  Database,
  Calendar,
  AlertTriangle,
  Flame,
  PackageCheck,
  Mail,
  Check,
  Layers3,
  KeyRound,
  Sparkles,
  Compass,
  ArrowDown,
  FileText,
  Boxes,
  Tag,
  MapPin,
  Receipt,
  Scale,
  Clock,
  ChevronRight,
  Shield,
} from "lucide-react";
import { YourMealLogo, YourMealMark } from "@/components/brand/yourmeal-os-logo";
import { ProductShowcase } from "@/components/public/product-showcase";
import { OperationalFlow } from "@/components/public/operational-flow";
import { ProductEcosystem } from "@/components/public/product-ecosystem";
import { OperationalContext } from "@/components/public/operational-context";

export function SaasCommercialLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* 1. HEADER INSTITUCIONAL */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <YourMealLogo size={34} />
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
            <a href="#en-accion" className="hover:text-foreground transition py-2">
              En Acción
            </a>
            <a href="#flujo-operativo" className="hover:text-foreground transition py-2">
              Flujo Operativo
            </a>
            <a href="#ecosistema" className="hover:text-foreground transition py-2">
              Ecosistema
            </a>
            <a href="#modulos" className="hover:text-foreground transition py-2">
              Módulos
            </a>
            <a href="#multi-tenant" className="hover:text-foreground transition py-2">
              Multi-Tenant
            </a>
            <a href="#seguridad" className="hover:text-foreground transition py-2">
              Seguridad & RLS
            </a>
          </nav>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/auth/admin"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition px-3 py-2 min-h-[44px] inline-flex items-center"
            >
              Acceso Empresas
            </Link>
            <Link
              to="/saas"
              className="text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground px-3.5 sm:px-4 py-2 rounded-xl transition min-h-[44px] inline-flex items-center gap-1.5 border border-border"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Consola SaaS</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. HERO SECTION — PRODUCTO REAL */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-28 px-4 sm:px-6 overflow-hidden border-b border-border/60">
          <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
            {/* Top Brand Emblem & Category Badge */}
            <div className="flex flex-col items-center gap-3">
              <YourMealMark size={64} className="rounded-2xl" />
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-bold tracking-wider uppercase">
                <span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                <span>Software de Operaciones Gastronómicas</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08]">
                El sistema operativo para <br className="hidden sm:block" />
                <span className="text-primary">negocios de alimentación.</span>
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Una plataforma unificada para conectar{" "}
                <span className="text-foreground font-semibold">
                  pedidos, producción, cocina, logística, atención y administración
                </span>.
              </p>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground">
                Diseñado para Meal Prep · Cocinas Centrales · Catering Corporativo · Cadenas Gastronómicas
              </p>
            </div>

            {/* CTAs Principales B2B */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="mailto:hola@yourmealos.com?subject=Solicitud%20de%20Demostraci%C3%B3n%20YourMeal%20OS"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-md hover:bg-primary/90 transition min-h-[48px]"
              >
                <span>Solicitar una demo</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="#en-accion"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm border border-border transition min-h-[48px]"
              >
                <span>Ver cómo funciona</span>
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </div>

            {/* REPRESENTACIÓN DE PRODUCTO REAL: Cockpit Operativo */}
            <div className="pt-8 max-w-5xl mx-auto">
              <div className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden text-left">
                {/* Header Bar */}
                <div className="bg-muted/70 border-b border-border px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="size-3 rounded-full bg-red-500/80" />
                      <span className="size-3 rounded-full bg-amber-500/80" />
                      <span className="size-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-foreground">YourMeal OS</span>
                      <span className="text-muted-foreground">· Centro de Operaciones</span>
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[10px]">
                        Tenant: EatClean Tenerife
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                    <span className="hidden sm:inline">Turno Operativo: Mañana</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      Producción Activa
                    </span>
                  </div>
                </div>

                {/* Cockpit Dual-Workspaces (KDS Cocina + Logística en Vivo) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                  {/* Workspace 1: KDS Cocina */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="size-4 text-primary" />
                        <span className="font-display font-bold text-sm">KDS Pantalla de Cocina</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">Lote Diario #402</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm text-foreground">Salmón al Horno con Verduras</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 font-bold">
                              Sin Gluten
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">84 raciones · 14 bandejas · Temp: 180°C</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-mono font-bold text-xs shrink-0">
                          PREPARANDO
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm text-foreground">Pollo Teriyaki con Arroz Jazmín</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 font-bold">
                              12 sin sésamo
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">62 raciones · En empaque térmico</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs shrink-0">
                          LISTO
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm text-foreground">Pasta Boloñesa de Lentejas</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 font-bold">
                              Vegano
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">47 raciones · Esperando tanda</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground font-mono font-bold text-xs border border-border shrink-0">
                          EN COLA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Workspace 2: Logística y Rutas */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-primary" />
                        <span className="font-display font-bold text-sm">Control de Rutas & Despacho</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">Despacho de Turno</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-sm text-foreground">Ruta 01 — Santa Cruz / Centro</span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">En Reparto</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                          <span>38 pedidos · 12 paradas</span>
                          <span>Chofer: Carlos M.</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-[75%]" />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-sm text-foreground">Ruta 02 — La Laguna / Norte</span>
                          <span className="text-xs font-mono font-bold text-primary">Asignada</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                          <span>27 pedidos · 9 paradas</span>
                          <span>Chofer: Elena R.</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-full rounded-full w-[40%]" />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-sm text-foreground">Ruta 03 — Adeje / Sur</span>
                          <span className="text-xs font-mono font-bold text-muted-foreground">Preparada</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                          <span>42 pedidos · 15 paradas</span>
                          <span>Chofer: David S.</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-muted-foreground/30 h-full rounded-full w-[15%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. NUEVA SECCIÓN — YOURMEAL OS EN ACCIÓN */}
        <section id="en-accion" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              Recorrido de Producto
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              YourMeal OS en acción.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Una operación completa. Un solo sistema para gobernar cada fase.
            </p>
          </div>

          <ProductShowcase />
        </section>

        {/* 4. EL PROBLEMA OPERATIVO */}
        <section className="py-20 bg-muted/30 border-y border-border/70 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Fricción Operacional
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
                El coste de operar con herramientas desconectadas.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Cuando los pedidos entran por mensajería, las recetas se calculan en hojas sueltas y las comandas
                se imprimen en papel, la operación pierde trazabilidad, tiempo y margen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {/* Problema Clásico */}
              <div className="p-8 rounded-3xl border border-destructive/30 bg-destructive/5 space-y-6">
                <div className="flex items-center gap-3 text-destructive font-bold text-sm">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                  <span>La Operación Fragmentada Tradicional</span>
                </div>
                <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span>
                    <span>Hojas de cálculo manuales con desfases entre pedidos, producción y compras.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span>
                    <span>Comandas de papel en cocina que provocan errores en raciones y alérgenos.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span>
                    <span>Planificación manual de rutas sin trazabilidad de entregas ni incidencias.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-destructive font-bold">✕</span>
                    <span>Falta de visibilidad sobre los costes reales y márgenes de cada lote cocinado.</span>
                  </li>
                </ul>
              </div>

              {/* Solución YourMeal OS */}
              <div className="p-8 rounded-3xl border border-primary/30 bg-primary/5 space-y-6">
                <div className="flex items-center gap-3 text-primary font-bold text-sm">
                  <YourMealMark size={22} />
                  <span>El Flujo Integrado de YourMeal OS</span>
                </div>
                <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Demanda agregada instantánea que calcula raciones e ingredientes necesarios.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>KDS táctil en tabletas de cocina con avance de comandas en un solo toque.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Generación automática de etiquetas térmicas con alérgenos y trazabilidad.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Rutas organizadas por chofer con confirmación y liquidación contable directa.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FLUJO OPERATIVO VISUAL (Pipeline de Extremo a Extremo) */}
        <section id="flujo-operativo" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              El Ciclo de Trabajo
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
              Flujo operativo de extremo a extremo.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Cada pedido recorre un ciclo estricto y trazable donde cada área recibe la información exacta que necesita.
            </p>
          </div>

          <OperationalFlow />
        </section>

        {/* 6. UNA PLATAFORMA. TODA LA OPERACIÓN (Ecosistema Central) */}
        <section id="ecosistema" className="py-20 bg-muted/30 border-y border-border/70 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Ecosistema Conectado
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
                Una plataforma. Toda la operación.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                YourMeal OS no es un módulo aislado: es la capa central que integra todas las áreas de la empresa.
              </p>
            </div>

            <ProductEcosystem />
          </div>
        </section>

        {/* 7. CONTEXTO HUMANO & OPERATIVO */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              Contexto de Trabajo
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
              Diseñado para operaciones reales.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Herramientas pensadas para las condiciones exigentes del obrador, la furgoneta de reparto y la oficina.
            </p>
          </div>

          <OperationalContext />
        </section>

        {/* 8. MÓDULOS AGRUPADOS CONCEPTUALMENTE */}
        <section id="modulos" className="py-20 bg-muted/30 border-y border-border/70 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-14">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Capacidades Modulares
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
                Módulos organizados por área de trabajo.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Cinco pilares funcionales que cubren toda la operación sin necesidad de herramientas externas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Grupo 1: Operación */}
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <Flame className="size-5" />
                  <h3 className="font-display">OPERACIÓN & COCINA</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>KDS Cocina Digital:</strong> Pantallas táctiles de 1-toque sin papel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Producción por Lotes:</strong> Agregación de demanda y turnos de cocción.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Captura de Pedidos:</strong> Entrada multicanal y pedidos manuales rápidos.</span>
                  </li>
                </ul>
              </div>

              {/* Grupo 2: Planificación */}
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <Calendar className="size-5" />
                  <h3 className="font-display">PLANIFICACIÓN</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Menús Semanales:</strong> Calendarios y rotación de catálogo de platos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Escandallos & Recetas:</strong> Gramajes, ingredientes y costes base.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Materias Primas:</strong> Cálculo de compras para producción.</span>
                  </li>
                </ul>
              </div>

              {/* Grupo 3: Logística */}
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <Truck className="size-5" />
                  <h3 className="font-display">LOGÍSTICA & DESPACHO</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Planificación de Rutas:</strong> Organización por zonas y paradas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Asignación de Choferes:</strong> Control de entregas en tiempo real.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Gestión de Incidencias:</strong> Registro de fallos y reintentos de ruta.</span>
                  </li>
                </ul>
              </div>

              {/* Grupo 4: Control */}
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <BarChart3 className="size-5" />
                  <h3 className="font-display">CONTROL & FINANZAS</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Directorio de Clientes:</strong> Dietas, notas de soporte y alérgenos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Contabilidad & Márgenes:</strong> Costes operativos y balances por lote.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Importación Masiva Excel:</strong> Ingesta segura con validación previa.</span>
                  </li>
                </ul>
              </div>

              {/* Grupo 5: Plataforma */}
              <div className="p-6 rounded-2xl bg-card border border-border space-y-4 lg:col-span-2">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <Building2 className="size-5" />
                  <h3 className="font-display">GOBERNANZA & PLATAFORMA</h3>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Multi-Tenant Nativo:</strong> Subdominios dinámicos y marcas independientes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Aislamiento PostgreSQL RLS:</strong> Seguridad en el motor de base de datos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Control de Roles (RBAC):</strong> Permisos granulares para cada perfil de empleado.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span><strong>Auditoría Transaccional:</strong> Registro estructurado de eventos administrativos.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 9. ARQUITECTURA MULTI-TENANT */}
        <section id="multi-tenant" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              Arquitectura de Dominio
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
              Un solo despliegue. Múltiples marcas independientes.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Cada empresa opera bajo su propio subdominio con branding personalizado en tiempo de ejecución.
            </p>
          </div>

          {/* Diagrama Visual Multi-Tenant */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-display font-bold text-sm">
                <YourMealMark size={20} />
                <span>YOURMEAL OS · www.yourmealos.com (Plataforma Central)</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Gobernanza SaaS · Onboarding B2B · Enrutamiento de Tenants
              </p>
            </div>

            {/* Tree branches */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tenant A: EatClean */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-emerald-500/30 text-center space-y-2">
                <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-display font-black text-xs mx-auto">
                  EC
                </div>
                <h4 className="font-display font-bold text-xs">eatclean.yourmealos.com</h4>
                <p className="text-[11px] text-muted-foreground">
                  EatClean Tenerife <br />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Tenant Producción</span>
                </p>
              </div>

              {/* Tenant B: Singular */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-orange-500/30 text-center space-y-2">
                <div className="size-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-display font-black text-xs mx-auto">
                  SF
                </div>
                <h4 className="font-display font-bold text-xs">singular.yourmealos.com</h4>
                <p className="text-[11px] text-muted-foreground">
                  Singular Street Food <br />
                  <span className="text-orange-600 dark:text-orange-400 font-semibold font-mono">Tenant Demo</span>
                </p>
              </div>

              {/* Tenant C: Futuro */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-dashed border-border text-center space-y-2">
                <div className="size-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center font-display font-black text-xs mx-auto">
                  +
                </div>
                <h4 className="font-display font-bold text-xs font-mono">{"{empresa}"}.yourmealos.com</h4>
                <p className="text-[11px] text-muted-foreground">
                  Nueva Empresa Contratante <br />
                  <span className="text-muted-foreground font-mono">Alta en 7 Pasos</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. SEGURIDAD Y AISLAMIENTO */}
        <section id="seguridad" className="py-20 bg-muted/30 border-y border-border/70 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Aislamiento de Datos
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
                Cada empresa opera dentro de su propio espacio de datos.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Los permisos y el acceso se controlan de forma estricta por organización y perfil de usuario.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Database className="size-5" />
                </div>
                <h3 className="font-display font-bold text-base">Row Level Security (RLS)</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cada consulta SQL incluye automáticamente el filtro de empresa verificado por el motor de PostgreSQL.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Lock className="size-5" />
                </div>
                <h3 className="font-display font-bold text-base">Cross-Tenant Guard</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Capa de software que bloquea accesos cruzados entre subdominios u organizaciones ajenas.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound className="size-5" />
                </div>
                <h3 className="font-display font-bold text-base">Control de Acceso por Roles</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Permisos específicos para cocina, reparto, jefes de operaciones y administradores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 11. TECNOLOGÍA & RENDIMIENTO */}
        <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Infraestructura
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight">
                Construido para operaciones críticas.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Desplegado sobre Cloudflare Workers con renderizado híbrido SSR en TanStack Start,
                base de datos PostgreSQL con RLS y compilación nativa en iOS vía Capacitor.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>Cloudflare Workers Serverless Edge Runtime</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>Renderizado SSR de Alta Velocidad (TanStack Start + Nitro)</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>Compilación Nativa Apple iOS con Capacitor SPM</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>Importación masiva tolerante a fallos para catálogos y clientes</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-lg space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <span className="text-muted-foreground">stack-overview.json</span>
                <span className="text-emerald-500 font-bold">OPERATIONAL</span>
              </div>
              <div className="space-y-2 text-[11px] text-muted-foreground">
                <p><span className="text-primary font-bold">Edge Runtime:</span> Cloudflare Workers (losrealesplus-yourmeal-os)</p>
                <p><span className="text-primary font-bold">Framework:</span> TanStack Router + Dynamic SSR Resolution</p>
                <p><span className="text-primary font-bold">Database:</span> PostgreSQL + Row Level Security (RLS)</p>
                <p><span className="text-primary font-bold">Mobile Build:</span> iOS Swift Package Manager (Capacitor)</p>
                <p><span className="text-primary font-bold">Isolation:</span> Multi-Tenant Subdomain Routing</p>
              </div>
            </div>
          </div>
        </section>

        {/* 12. FINAL CTA SECTION */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center">
            <YourMealMark size={52} />
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              El Estándar Operativo
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
              Lleva tu operación gastronómica <br />
              al estándar del software moderno.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Conecta pedidos, producción, cocina, reparto y finanzas en una sola fuente de verdad.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="mailto:hola@yourmealos.com?subject=Solicitud%20de%20Demostraci%C3%B3n%20YourMeal%20OS"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-sm shadow-lg hover:bg-primary/90 transition min-h-[48px]"
            >
              <span>Solicitar una demo</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <Link
              to="/auth/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm border border-border transition min-h-[48px]"
            >
              <span>Acceso Empresas</span>
            </Link>
          </div>
        </section>
      </main>

      {/* 13. FOOTER INSTITUCIONAL */}
      <footer className="border-t border-border/80 py-12 px-4 sm:px-6 bg-card">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <Link to="/" className="flex items-center gap-3">
            <YourMealLogo size={28} />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <a href="#en-accion" className="hover:text-foreground transition">
              En Acción
            </a>
            <a href="#flujo-operativo" className="hover:text-foreground transition">
              Flujo Operativo
            </a>
            <a href="#ecosistema" className="hover:text-foreground transition">
              Ecosistema
            </a>
            <a href="#modulos" className="hover:text-foreground transition">
              Módulos
            </a>
            <Link to="/auth/admin" className="hover:text-foreground transition">
              Acceso Empresas
            </Link>
            <Link to="/saas" className="hover:text-foreground transition">
              Consola SaaS
            </Link>
          </div>

          <div className="text-center sm:text-right font-mono text-[11px]">
            © {new Date().getFullYear()} YourMeal OS · Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

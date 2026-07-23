export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip: string | null
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip?: string | null
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip?: string | null
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          billing_rule: Database["public"]["Enums"]["pay_mode"]
          created_at: string
          id: string
          name: string
          tenant_id: string
          vat_id: string | null
        }
        Insert: {
          billing_rule?: Database["public"]["Enums"]["pay_mode"]
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          vat_id?: string | null
        }
        Update: {
          billing_rule?: Database["public"]["Enums"]["pay_mode"]
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          vat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_departments: {
        Row: {
          company_location_id: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          company_location_id: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          company_location_id?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_departments_company_location_id_fkey"
            columns: ["company_location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employees: {
        Row: {
          company_id: string
          customer_id: string
          department_id: string | null
          id: string
          pay_mode: Database["public"]["Enums"]["pay_mode"]
          tenant_id: string
        }
        Insert: {
          company_id: string
          customer_id: string
          department_id?: string | null
          id?: string
          pay_mode?: Database["public"]["Enums"]["pay_mode"]
          tenant_id: string
        }
        Update: {
          company_id?: string
          customer_id?: string
          department_id?: string | null
          id?: string
          pay_mode?: Database["public"]["Enums"]["pay_mode"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_locations: {
        Row: {
          address: string | null
          company_id: string
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          address?: string | null
          company_id: string
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          address?: string | null
          company_id?: string
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string | null
          customer_id: string
          id: string
          is_default: boolean
          label: string | null
          lat: number | null
          lng: number | null
          street: string
          tenant_id: string
          zip: string | null
        }
        Insert: {
          city?: string | null
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          street: string
          tenant_id: string
          zip?: string | null
        }
        Update: {
          city?: string | null
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string | null
          lat?: number | null
          lng?: number | null
          street?: string
          tenant_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_allergies: {
        Row: {
          allergen: string
          customer_id: string
          id: string
          severity: string | null
          tenant_id: string
        }
        Insert: {
          allergen: string
          customer_id: string
          id?: string
          severity?: string | null
          tenant_id: string
        }
        Update: {
          allergen?: string
          customer_id?: string
          id?: string
          severity?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_allergies_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_allergies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_phones: {
        Row: {
          customer_id: string
          id: string
          is_primary: boolean
          phone: string
          tenant_id: string
        }
        Insert: {
          customer_id: string
          id?: string
          is_primary?: boolean
          phone: string
          tenant_id: string
        }
        Update: {
          customer_id?: string
          id?: string
          is_primary?: boolean
          phone?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_phones_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_phones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          customer_id: string
          id: string
          key: string
          tenant_id: string
          value: string | null
        }
        Insert: {
          customer_id: string
          id?: string
          key: string
          tenant_id: string
          value?: string | null
        }
        Update: {
          customer_id?: string
          id?: string
          key?: string
          tenant_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["customer_kind"]
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["customer_kind"]
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["customer_kind"]
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_ingredients: {
        Row: {
          dish_id: string
          ingredient_id: string
          qty: number
          tenant_id: string
          unit: string
        }
        Insert: {
          dish_id: string
          ingredient_id: string
          qty: number
          tenant_id: string
          unit?: string
        }
        Update: {
          dish_id?: string
          ingredient_id?: string
          qty?: number
          tenant_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dish_ingredients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[]
          category_id: string
          cost: number
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          kcal: number | null
          macros: Json
          name: string
          photo_url: string | null
          prep_instructions: string | null
          prep_minutes: number | null
          price: number
          recipe_id: string | null
          status: Database["public"]["Enums"]["dish_status"]
          tags: string[]
          tenant_id: string
          updated_at: string
          weight_g: number | null
        }
        Insert: {
          allergens?: string[]
          category_id?: string
          cost?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          kcal?: number | null
          macros?: Json
          name: string
          photo_url?: string | null
          prep_instructions?: string | null
          prep_minutes?: number | null
          price?: number
          recipe_id?: string | null
          status?: Database["public"]["Enums"]["dish_status"]
          tags?: string[]
          tenant_id: string
          updated_at?: string
          weight_g?: number | null
        }
        Update: {
          allergens?: string[]
          category_id?: string
          cost?: number
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          kcal?: number | null
          macros?: Json
          name?: string
          photo_url?: string | null
          prep_instructions?: string | null
          prep_minutes?: number | null
          price?: number
          recipe_id?: string | null
          status?: Database["public"]["Enums"]["dish_status"]
          tags?: string[]
          tenant_id?: string
          updated_at?: string
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dishes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          metadata: Json
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          metadata?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          metadata?: Json
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          allergens: string[]
          cost: number
          expiration: string | null
          id: string
          min_stock: number
          name: string
          stock: number
          supplier_id: string | null
          tenant_id: string
          unit: string
        }
        Insert: {
          allergens?: string[]
          cost?: number
          expiration?: string | null
          id?: string
          min_stock?: number
          name: string
          stock?: number
          supplier_id?: string | null
          tenant_id: string
          unit?: string
        }
        Update: {
          allergens?: string[]
          cost?: number
          expiration?: string | null
          id?: string
          min_stock?: number
          name?: string
          stock?: number
          supplier_id?: string | null
          tenant_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_period: string | null
          company_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
        }
        Insert: {
          amount?: number
          billing_period?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          billing_period?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          comment: string | null
          day_date: string
          dish_id: string
          id: string
          order_id: string
          qty: number
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          day_date: string
          dish_id: string
          id?: string
          order_id: string
          qty?: number
          tenant_id: string
        }
        Update: {
          comment?: string | null
          day_date?: string
          dish_id?: string
          id?: string
          order_id?: string
          qty?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total: number
          week_start: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total?: number
          week_start: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id?: string
          total?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          method: string | null
          paid_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          method?: string | null
          paid_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          method?: string | null
          paid_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          currency: string | null
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          time_format: string | null
          timezone: string | null
          unit_distance: string | null
          unit_temperature: string | null
          unit_volume: string | null
          unit_weight: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          time_format?: string | null
          timezone?: string | null
          unit_distance?: string | null
          unit_temperature?: string | null
          unit_volume?: string | null
          unit_weight?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          time_format?: string | null
          timezone?: string | null
          unit_distance?: string | null
          unit_temperature?: string | null
          unit_volume?: string | null
          unit_weight?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          body: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          scope: Database["public"]["Enums"]["promotion_scope"]
          starts_at: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          scope?: Database["public"]["Enums"]["promotion_scope"]
          starts_at?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          scope?: Database["public"]["Enums"]["promotion_scope"]
          starts_at?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          delivered_at: string | null
          eta: string | null
          id: string
          lat: number | null
          lng: number | null
          order_id: string | null
          route_id: string
          sequence: number
          tenant_id: string
        }
        Insert: {
          delivered_at?: string | null
          eta?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          order_id?: string | null
          route_id: string
          sequence?: number
          tenant_id: string
        }
        Update: {
          delivered_at?: string | null
          eta?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          order_id?: string | null
          route_id?: string
          sequence?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          delivery_date: string
          driver_id: string | null
          id: string
          status: Database["public"]["Enums"]["route_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          delivery_date: string
          driver_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["route_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          driver_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["route_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact: Json
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          contact?: Json
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          contact?: Json
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          customer_id: string
          id: string
          kind: Database["public"]["Enums"]["support_kind"]
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          customer_id: string
          id?: string
          kind?: Database["public"]["Enums"]["support_kind"]
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["support_kind"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          domain: string
          id: string
          is_primary: boolean
          tenant_id: string
        }
        Insert: {
          domain: string
          id?: string
          is_primary?: boolean
          tenant_id: string
        }
        Update: {
          domain?: string
          id?: string
          is_primary?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          joined_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          brand: Json
          brand_accent: string | null
          brand_logo_path: string | null
          brand_primary: string | null
          brand_primary_foreground: string | null
          brand_updated_at: string | null
          country: string | null
          created_at: string
          currency: string | null
          id: string
          locale_default: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          time_format: string | null
          timezone: string | null
          unit_distance: string | null
          unit_temperature: string | null
          unit_volume: string | null
          unit_weight: string | null
        }
        Insert: {
          brand?: Json
          brand_accent?: string | null
          brand_logo_path?: string | null
          brand_primary?: string | null
          brand_primary_foreground?: string | null
          brand_updated_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          locale_default?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          time_format?: string | null
          timezone?: string | null
          unit_distance?: string | null
          unit_temperature?: string | null
          unit_volume?: string | null
          unit_weight?: string | null
        }
        Update: {
          brand?: Json
          brand_accent?: string | null
          brand_logo_path?: string | null
          brand_primary?: string | null
          brand_primary_foreground?: string | null
          brand_updated_at?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          locale_default?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          time_format?: string | null
          timezone?: string | null
          unit_distance?: string | null
          unit_temperature?: string | null
          unit_volume?: string | null
          unit_weight?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_menu_slots: {
        Row: {
          day_date: string
          dish_id: string
          id: string
          sort_order: number
          tenant_id: string
          weekly_menu_id: string
        }
        Insert: {
          day_date: string
          dish_id: string
          id?: string
          sort_order?: number
          tenant_id: string
          weekly_menu_id: string
        }
        Update: {
          day_date?: string
          dish_id?: string
          id?: string
          sort_order?: number
          tenant_id?: string
          weekly_menu_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_menu_slots_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_menu_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_menu_slots_weekly_menu_id_fkey"
            columns: ["weekly_menu_id"]
            isOneToOne: false
            referencedRelation: "weekly_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_menus: {
        Row: {
          id: string
          published_at: string | null
          status: string
          tenant_id: string
          week_start: string
        }
        Insert: {
          id?: string
          published_at?: string | null
          status?: string
          tenant_id: string
          week_start: string
        }
        Update: {
          id?: string
          published_at?: string | null
          status?: string
          tenant_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_menus_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_tenants: { Args: never; Returns: string[] }
      has_any_staff_role: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_saas_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "saas_admin"
        | "company_admin"
        | "operations_manager"
        | "kitchen"
        | "purchasing"
        | "inventory"
        | "production"
        | "support"
        | "accounting"
        | "logistics"
        | "delivery"
        | "driver"
        | "employee"
        | "customer"
      customer_kind: "individual" | "company_employee"
      dish_status: "draft" | "active" | "archived" | "inactive"
      invoice_status: "pending" | "paid" | "overdue" | "void"
      order_status:
        | "draft"
        | "confirmed"
        | "in_production"
        | "prepared"
        | "ready_for_delivery"
        | "out_for_delivery"
        | "delivered"
        | "delivery_issue"
        | "cancelled"
      pay_mode: "employee_pays" | "company_pays" | "grouped" | "custom"
      promotion_scope: "global" | "group" | "personal"
      route_status: "planned" | "in_progress" | "completed" | "cancelled"
      support_kind:
        | "note"
        | "incident"
        | "request"
        | "allergy_update"
        | "complaint"
      tenant_status: "active" | "suspended" | "trial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "saas_admin",
        "company_admin",
        "operations_manager",
        "kitchen",
        "purchasing",
        "inventory",
        "production",
        "support",
        "accounting",
        "logistics",
        "delivery",
        "driver",
        "employee",
        "customer",
      ],
      customer_kind: ["individual", "company_employee"],
      dish_status: ["draft", "active", "archived", "inactive"],
      invoice_status: ["pending", "paid", "overdue", "void"],
      order_status: [
        "draft",
        "confirmed",
        "in_production",
        "prepared",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "delivery_issue",
        "cancelled",
      ],
      pay_mode: ["employee_pays", "company_pays", "grouped", "custom"],
      promotion_scope: ["global", "group", "personal"],
      route_status: ["planned", "in_progress", "completed", "cancelled"],
      support_kind: [
        "note",
        "incident",
        "request",
        "allergy_update",
        "complaint",
      ],
      tenant_status: ["active", "suspended", "trial"],
    },
  },
} as const

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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          commercial_terms: string | null
          company_code: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          fiscal_address: string | null
          id: string
          internal_location_label: string
          name: string
          org_unit_label: string
          tenant_id: string
          vat_id: string | null
        }
        Insert: {
          billing_rule?: Database["public"]["Enums"]["pay_mode"]
          commercial_terms?: string | null
          company_code: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          fiscal_address?: string | null
          id?: string
          internal_location_label?: string
          name: string
          org_unit_label?: string
          tenant_id: string
          vat_id?: string | null
        }
        Update: {
          billing_rule?: Database["public"]["Enums"]["pay_mode"]
          commercial_terms?: string | null
          company_code?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          fiscal_address?: string | null
          id?: string
          internal_location_label?: string
          name?: string
          org_unit_label?: string
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
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          company_location_id: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          company_location_id?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
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
          deleted_at: string | null
          department_id: string | null
          id: string
          internal_location: string | null
          is_admin: boolean
          joined_at: string
          location_id: string | null
          pay_mode: Database["public"]["Enums"]["pay_mode"]
          status: string
          tenant_id: string
        }
        Insert: {
          company_id: string
          customer_id: string
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          internal_location?: string | null
          is_admin?: boolean
          joined_at?: string
          location_id?: string | null
          pay_mode?: Database["public"]["Enums"]["pay_mode"]
          status?: string
          tenant_id: string
        }
        Update: {
          company_id?: string
          customer_id?: string
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          internal_location?: string | null
          is_admin?: boolean
          joined_at?: string
          location_id?: string | null
          pay_mode?: Database["public"]["Enums"]["pay_mode"]
          status?: string
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
            foreignKeyName: "company_employees_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
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
          city: string | null
          company_id: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          zip?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      customer_dish_favorites: {
        Row: {
          created_at: string
          customer_id: string
          deleted_at: string | null
          dish_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          dish_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          dish_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_dish_favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_dish_favorites_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_dish_favorites_tenant_id_fkey"
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
          deleted_at: string | null
          id: string
          is_primary: boolean
          phone: string
          tenant_id: string
        }
        Insert: {
          customer_id: string
          deleted_at?: string | null
          id?: string
          is_primary?: boolean
          phone: string
          tenant_id: string
        }
        Update: {
          customer_id?: string
          deleted_at?: string | null
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
          deleted_at: string | null
          display_name: string | null
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["customer_kind"]
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["customer_kind"]
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
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
      delivery_groups: {
        Row: {
          company_id: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organizational_unit_id: string
          site_id: string
          tenant_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organizational_unit_id: string
          site_id: string
          tenant_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organizational_unit_id?: string
          site_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_groups_organizational_unit_id_fkey"
            columns: ["organizational_unit_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_groups_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_groups_tenant_id_fkey"
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
      employee_profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          department: string | null
          employee_number: string | null
          hire_date: string | null
          id: string
          manager_user_id: string | null
          membership_id: string | null
          position: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          employee_number?: string | null
          hire_date?: string | null
          id?: string
          manager_user_id?: string | null
          membership_id?: string | null
          position?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          department?: string | null
          employee_number?: string | null
          hire_date?: string | null
          id?: string
          manager_user_id?: string | null
          membership_id?: string | null
          position?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "tenant_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_profiles_tenant_id_fkey"
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
      financial_period_closures: {
        Row: {
          billing_period: string
          closed_at: string
          closed_by: string | null
          invoice_count: number
          paid_amount: number
          tenant_id: string
        }
        Insert: {
          billing_period: string
          closed_at?: string
          closed_by?: string | null
          invoice_count?: number
          paid_amount?: number
          tenant_id: string
        }
        Update: {
          billing_period?: string
          closed_at?: string
          closed_by?: string | null
          invoice_count?: number
          paid_amount?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_period_closures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_events: {
        Row: {
          event_type: Database["public"]["Enums"]["identity_event_type"]
          id: string
          membership_id: string | null
          metadata: Json
          performed_at: string
          performed_by: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          event_type: Database["public"]["Enums"]["identity_event_type"]
          id?: string
          membership_id?: string | null
          metadata?: Json
          performed_at?: string
          performed_by?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: Database["public"]["Enums"]["identity_event_type"]
          id?: string
          membership_id?: string | null
          metadata?: Json
          performed_at?: string
          performed_by?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_events_tenant_id_fkey"
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
          deleted_at: string | null
          deleted_by: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
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
      invoice_orders: {
        Row: {
          created_at: string
          invoice_id: string
          order_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          invoice_id: string
          order_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          invoice_id?: string
          order_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_orders_tenant_id_fkey"
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
          deleted_at: string | null
          id: string
          pdf_url: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
        }
        Insert: {
          amount?: number
          billing_period?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          id?: string
          pdf_url?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          billing_period?: string | null
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          id?: string
          pdf_url?: string | null
          reviewed_at?: string | null
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
      kitchen_production_batches: {
        Row: {
          created_at: string
          delivery_date: string
          dish_id: string
          finished_at: string | null
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["kitchen_batch_status"]
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          delivery_date: string
          dish_id: string
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["kitchen_batch_status"]
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          delivery_date?: string
          dish_id?: string
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["kitchen_batch_status"]
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_production_batches_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_production_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_exceptions: {
        Row: {
          acknowledged_at: string | null
          closed_at: string | null
          company_id: string | null
          created_at: string
          created_by: string
          customer_id: string | null
          detected_at: string
          id: string
          order_id: string | null
          owner_user_id: string | null
          resolution_notes: string | null
          resolution_payload: Json | null
          resolution_type: string | null
          resolved_at: string | null
          severity: string
          source_domain: string
          source_entity_id: string
          source_entity_type: string
          status: string
          tenant_id: string
          type: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          acknowledged_at?: string | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          customer_id?: string | null
          detected_at?: string
          id?: string
          order_id?: string | null
          owner_user_id?: string | null
          resolution_notes?: string | null
          resolution_payload?: Json | null
          resolution_type?: string | null
          resolved_at?: string | null
          severity?: string
          source_domain: string
          source_entity_id: string
          source_entity_type: string
          status?: string
          tenant_id: string
          type: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          acknowledged_at?: string | null
          closed_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string | null
          detected_at?: string
          id?: string
          order_id?: string | null
          owner_user_id?: string | null
          resolution_notes?: string | null
          resolution_payload?: Json | null
          resolution_type?: string | null
          resolved_at?: string | null
          severity?: string
          source_domain?: string
          source_entity_id?: string
          source_entity_type?: string
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "operational_exceptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_exceptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_exceptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_exceptions_tenant_id_fkey"
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
          deleted_at: string | null
          dish_id: string
          id: string
          order_id: string
          qty: number
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          day_date: string
          deleted_at?: string | null
          dish_id: string
          id?: string
          order_id: string
          qty?: number
          tenant_id: string
        }
        Update: {
          comment?: string | null
          day_date?: string
          deleted_at?: string | null
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
          company_id: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          delivery_address_id: string | null
          delivery_group_id: string | null
          demand_channel: Database["public"]["Enums"]["demand_channel"]
          id: string
          notes: string | null
          organizational_unit_id: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total: number
          week_start: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          delivery_address_id?: string | null
          delivery_group_id?: string | null
          demand_channel?: Database["public"]["Enums"]["demand_channel"]
          id?: string
          notes?: string | null
          organizational_unit_id?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total?: number
          week_start: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          delivery_address_id?: string | null
          delivery_group_id?: string | null
          demand_channel?: Database["public"]["Enums"]["demand_channel"]
          id?: string
          notes?: string | null
          organizational_unit_id?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id?: string
          total?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_group_id_fkey"
            columns: ["delivery_group_id"]
            isOneToOne: false
            referencedRelation: "delivery_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organizational_unit_id_fkey"
            columns: ["organizational_unit_id"]
            isOneToOne: false
            referencedRelation: "company_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
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
          deleted_at: string | null
          id: string
          invoice_id: string
          method: string | null
          paid_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          amount: number
          deleted_at?: string | null
          id?: string
          invoice_id: string
          method?: string | null
          paid_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          deleted_at?: string | null
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
      platform_owners: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string | null
          tenant_slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name?: string | null
          tenant_slug?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string | null
          tenant_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          deleted_by: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
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
          deleted_at?: string | null
          deleted_by?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
          delivery_date: string
          driver_id: string | null
          id: string
          status: Database["public"]["Enums"]["route_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          delivery_date: string
          driver_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["route_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
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
          deleted_at: string | null
          deleted_by: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          contact?: Json
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          contact?: Json
          deleted_at?: string | null
          deleted_by?: string | null
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
          closed_at: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          id: string
          kind: Database["public"]["Enums"]["support_kind"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["support_note_status"]
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          closed_at?: string | null
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["support_kind"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_note_status"]
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          closed_at?: string | null
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["support_kind"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["support_note_status"]
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
      tenant_deployments: {
        Row: {
          created_at: string
          id: string
          identifier: string
          is_primary: boolean
          platform: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          is_primary?: boolean
          platform: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          is_primary?: boolean
          platform?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_deployments_tenant_id_fkey"
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
          approved_at: string | null
          approved_by: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          invited_by: string | null
          joined_at: string
          membership_type: Database["public"]["Enums"]["membership_type"]
          notes: string | null
          provisioning_channel: Database["public"]["Enums"]["provisioning_channel"]
          reactivated_at: string | null
          reactivated_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["membership_status"]
          suspended_at: string | null
          suspended_by: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          membership_type?: Database["public"]["Enums"]["membership_type"]
          notes?: string | null
          provisioning_channel?: Database["public"]["Enums"]["provisioning_channel"]
          reactivated_at?: string | null
          reactivated_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          membership_type?: Database["public"]["Enums"]["membership_type"]
          notes?: string | null
          provisioning_channel?: Database["public"]["Enums"]["provisioning_channel"]
          reactivated_at?: string | null
          reactivated_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspended_by?: string | null
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
          join_code: string | null
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
          join_code?: string | null
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
          join_code?: string | null
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
      user_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          channel: Database["public"]["Enums"]["provisioning_channel"]
          created_at: string
          email: string
          expires_at: string
          id: string
          intended_role: Database["public"]["Enums"]["app_role"] | null
          invited_by: string | null
          membership_id: string | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          notes: string | null
          resent_at: string | null
          resent_by: string | null
          resent_count: number
          status: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          channel?: Database["public"]["Enums"]["provisioning_channel"]
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          intended_role?: Database["public"]["Enums"]["app_role"] | null
          invited_by?: string | null
          membership_id?: string | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          notes?: string | null
          resent_at?: string | null
          resent_by?: string | null
          resent_count?: number
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          channel?: Database["public"]["Enums"]["provisioning_channel"]
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          intended_role?: Database["public"]["Enums"]["app_role"] | null
          invited_by?: string | null
          membership_id?: string | null
          membership_type?: Database["public"]["Enums"]["membership_type"]
          notes?: string | null
          resent_at?: string | null
          resent_by?: string | null
          resent_count?: number
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          day_date: string | null
          day_of_week: number | null
          dish_id: string
          id: string
          sort_order: number
          tenant_id: string
          weekly_menu_id: string
        }
        Insert: {
          day_date?: string | null
          day_of_week?: number | null
          dish_id: string
          id?: string
          sort_order?: number
          tenant_id: string
          weekly_menu_id: string
        }
        Update: {
          day_date?: string | null
          day_of_week?: number | null
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
          customer_go_live_date: string | null
          deleted_at: string | null
          id: string
          internal_go_live_date: string | null
          menu_type: string
          published_at: string | null
          relative_week: number | null
          status: string
          tenant_id: string
          week_start: string | null
        }
        Insert: {
          customer_go_live_date?: string | null
          deleted_at?: string | null
          id?: string
          internal_go_live_date?: string | null
          menu_type?: string
          published_at?: string | null
          relative_week?: number | null
          status?: string
          tenant_id: string
          week_start?: string | null
        }
        Update: {
          customer_go_live_date?: string | null
          deleted_at?: string | null
          id?: string
          internal_go_live_date?: string | null
          menu_type?: string
          published_at?: string | null
          relative_week?: number | null
          status?: string
          tenant_id?: string
          week_start?: string | null
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
      current_membership_id: { Args: { _tenant_id: string }; Returns: string }
      current_user_tenants: { Args: never; Returns: string[] }
      ensure_individual_customer: {
        Args: {
          p_display_name?: string
          p_email?: string
          p_tenant_id: string
          p_user_id: string
        }
        Returns: string
      }
      ensure_platform_owner_for_user: {
        Args: { _user_id: string }
        Returns: Json
      }
      ensure_platform_owner_session: { Args: never; Returns: Json }
      generate_company_code: { Args: { p_tenant_id: string }; Returns: string }
      generate_tenant_join_code: {
        Args: { p_tenant_id: string }
        Returns: string
      }
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
      is_customer_owner: { Args: { _customer_id: string }; Returns: boolean }
      is_platform_owner_email: { Args: { _email: string }; Returns: boolean }
      is_saas_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
      program_draft_order:
        | {
            Args: {
              _customer_id: string
              _items: Json
              _notes: string
              _tenant_id: string
              _total: number
              _week_start: string
            }
            Returns: Json
          }
        | {
            Args: {
              _company_id?: string
              _customer_id: string
              _delivery_group_id?: string
              _demand_channel?: Database["public"]["Enums"]["demand_channel"]
              _items: Json
              _notes: string
              _organizational_unit_id?: string
              _site_id?: string
              _tenant_id: string
              _total: number
              _week_start: string
            }
            Returns: Json
          }
      request_tenant_association_by_join_code: {
        Args: { p_code: string }
        Returns: Json
      }
      request_tenant_association_for_deployment: {
        Args: { p_identifier: string; p_platform: string }
        Returns: Json
      }
      resolve_delivery_group: {
        Args: {
          p_company_id: string
          p_ou_id: string
          p_site_id: string
          p_tenant_id: string
        }
        Returns: string
      }
      resolve_tenant_join_code: { Args: { p_code: string }; Returns: Json }
      revoke_platform_owner_for_email: {
        Args: { _email: string }
        Returns: Json
      }
      transition_order_status: {
        Args: {
          p_order_id: string
          p_tenant_id: string
          p_to_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: {
          company_id: string | null
          created_at: string
          customer_id: string
          deleted_at: string | null
          delivery_address_id: string | null
          delivery_group_id: string | null
          demand_channel: Database["public"]["Enums"]["demand_channel"]
          id: string
          notes: string | null
          organizational_unit_id: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          total: number
          week_start: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_tenant_deployment: {
        Args: {
          p_identifier: string
          p_is_primary?: boolean
          p_platform: string
          p_tenant_id: string
        }
        Returns: {
          created_at: string
          id: string
          identifier: string
          is_primary: boolean
          platform: string
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_deployments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "saas_admin"
        | "company_admin"
        | "kitchen"
        | "purchasing"
        | "inventory"
        | "production"
        | "support"
        | "accounting"
        | "logistics"
        | "driver"
        | "employee"
        | "customer"
        | "operations_manager"
        | "delivery"
      customer_kind: "individual" | "company_employee"
      demand_channel: "individual" | "company"
      dish_status: "draft" | "active" | "archived" | "inactive"
      identity_event_type:
        | "USER_REGISTERED"
        | "PROFILE_CREATED"
        | "PROFILE_UPDATED"
        | "INVITATION_SENT"
        | "INVITATION_RESENT"
        | "INVITATION_ACCEPTED"
        | "INVITATION_EXPIRED"
        | "INVITATION_CANCELLED"
        | "INVITATION_REVOKED"
        | "MEMBERSHIP_CREATED"
        | "MEMBERSHIP_APPROVED"
        | "MEMBERSHIP_REJECTED"
        | "MEMBERSHIP_SUSPENDED"
        | "MEMBERSHIP_REVOKED"
        | "MEMBERSHIP_REACTIVATED"
        | "MEMBERSHIP_ARCHIVED"
        | "ROLE_ASSIGNED"
        | "ROLE_REMOVED"
        | "USER_LAST_LOGIN"
        | "PASSWORD_RESET"
        | "EMAIL_CHANGED"
        | "PHONE_CHANGED"
        | "ACCESS_DENIED_INCONSISTENT"
      invitation_status:
        | "pending"
        | "accepted"
        | "expired"
        | "revoked"
        | "cancelled"
      invoice_status: "pending" | "paid" | "overdue" | "void"
      kitchen_batch_status: "pending" | "preparing" | "plating" | "finished"
      membership_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "revoked"
      membership_type:
        | "customer"
        | "employee"
        | "supplier"
        | "company"
        | "company_employee"
      order_status:
        | "draft"
        | "confirmed"
        | "in_production"
        | "delivered"
        | "cancelled"
        | "prepared"
        | "ready_for_delivery"
        | "out_for_delivery"
        | "delivery_issue"
      pay_mode: "employee_pays" | "company_pays" | "grouped" | "custom"
      promotion_scope: "global" | "group" | "personal"
      provisioning_channel: "self_registration" | "invitation" | "provisioning"
      route_status: "planned" | "in_progress" | "completed" | "cancelled"
      support_kind:
        | "note"
        | "incident"
        | "request"
        | "allergy_update"
        | "complaint"
      support_note_status: "open" | "resolved" | "closed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "saas_admin",
        "company_admin",
        "kitchen",
        "purchasing",
        "inventory",
        "production",
        "support",
        "accounting",
        "logistics",
        "driver",
        "employee",
        "customer",
        "operations_manager",
        "delivery",
      ],
      customer_kind: ["individual", "company_employee"],
      demand_channel: ["individual", "company"],
      dish_status: ["draft", "active", "archived", "inactive"],
      identity_event_type: [
        "USER_REGISTERED",
        "PROFILE_CREATED",
        "PROFILE_UPDATED",
        "INVITATION_SENT",
        "INVITATION_RESENT",
        "INVITATION_ACCEPTED",
        "INVITATION_EXPIRED",
        "INVITATION_CANCELLED",
        "INVITATION_REVOKED",
        "MEMBERSHIP_CREATED",
        "MEMBERSHIP_APPROVED",
        "MEMBERSHIP_REJECTED",
        "MEMBERSHIP_SUSPENDED",
        "MEMBERSHIP_REVOKED",
        "MEMBERSHIP_REACTIVATED",
        "MEMBERSHIP_ARCHIVED",
        "ROLE_ASSIGNED",
        "ROLE_REMOVED",
        "USER_LAST_LOGIN",
        "PASSWORD_RESET",
        "EMAIL_CHANGED",
        "PHONE_CHANGED",
        "ACCESS_DENIED_INCONSISTENT",
      ],
      invitation_status: [
        "pending",
        "accepted",
        "expired",
        "revoked",
        "cancelled",
      ],
      invoice_status: ["pending", "paid", "overdue", "void"],
      kitchen_batch_status: ["pending", "preparing", "plating", "finished"],
      membership_status: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "revoked",
      ],
      membership_type: [
        "customer",
        "employee",
        "supplier",
        "company",
        "company_employee",
      ],
      order_status: [
        "draft",
        "confirmed",
        "in_production",
        "delivered",
        "cancelled",
        "prepared",
        "ready_for_delivery",
        "out_for_delivery",
        "delivery_issue",
      ],
      pay_mode: ["employee_pays", "company_pays", "grouped", "custom"],
      promotion_scope: ["global", "group", "personal"],
      provisioning_channel: ["self_registration", "invitation", "provisioning"],
      route_status: ["planned", "in_progress", "completed", "cancelled"],
      support_kind: [
        "note",
        "incident",
        "request",
        "allergy_update",
        "complaint",
      ],
      support_note_status: ["open", "resolved", "closed"],
      tenant_status: ["active", "suspended", "trial"],
    },
  },
} as const

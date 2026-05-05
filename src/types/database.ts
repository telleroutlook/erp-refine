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
      account_subjects: {
        Row: {
          balance_direction: string
          category: string
          code: string
          created_at: string
          id: string
          is_leaf: boolean
          name: string
          organization_id: string
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          balance_direction: string
          category: string
          code: string
          created_at?: string
          id?: string
          is_leaf?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          balance_direction?: string
          category?: string
          code?: string
          created_at?: string
          id?: string
          is_leaf?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_subjects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_subjects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "account_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_shipment_notices: {
        Row: {
          asn_no: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          expected_date: string | null
          id: string
          organization_id: string
          po_id: string | null
          remark: string | null
          status: string
          supplier_id: string
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          asn_no: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          organization_id: string
          po_id?: string | null
          remark?: string | null
          status?: string
          supplier_id: string
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          asn_no?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          organization_id?: string
          po_id?: string | null
          remark?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advance_shipment_notices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_shipment_notices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_shipment_notices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_shipment_notices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_shipment_notices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "advance_shipment_notices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_shipment_notices_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_decisions: {
        Row: {
          agent_id: string
          agent_version: string
          approval_status: string
          approved_at: string | null
          approver: string | null
          confidence: number | null
          context_refs: Json
          created_at: string
          decision: Json
          delegated_by: string | null
          error_message: string | null
          execution_status: string
          human_approval_req: boolean
          human_modification: Json | null
          id: string
          model_profile: string
          organization_id: string
          outcome: string | null
          reasoning_summary: Json
          risk_level: string
          session_id: string | null
          tools_called: Json
          trigger_event_id: string | null
          trigger_event_version: string | null
        }
        Insert: {
          agent_id: string
          agent_version?: string
          approval_status?: string
          approved_at?: string | null
          approver?: string | null
          confidence?: number | null
          context_refs?: Json
          created_at?: string
          decision?: Json
          delegated_by?: string | null
          error_message?: string | null
          execution_status?: string
          human_approval_req?: boolean
          human_modification?: Json | null
          id?: string
          model_profile?: string
          organization_id: string
          outcome?: string | null
          reasoning_summary?: Json
          risk_level: string
          session_id?: string | null
          tools_called?: Json
          trigger_event_id?: string | null
          trigger_event_version?: string | null
        }
        Update: {
          agent_id?: string
          agent_version?: string
          approval_status?: string
          approved_at?: string | null
          approver?: string | null
          confidence?: number | null
          context_refs?: Json
          created_at?: string
          decision?: Json
          delegated_by?: string | null
          error_message?: string | null
          execution_status?: string
          human_approval_req?: boolean
          human_modification?: Json | null
          id?: string
          model_profile?: string
          organization_id?: string
          outcome?: string | null
          reasoning_summary?: Json
          risk_level?: string
          session_id?: string | null
          tools_called?: Json
          trigger_event_id?: string | null
          trigger_event_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_decisions_approver_fkey"
            columns: ["approver"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          agent_id: string
          context: Json
          created_at: string
          ended_at: string | null
          id: string
          message_count: number
          organization_id: string
          session_type: string
          started_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          agent_id: string
          context?: Json
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          organization_id: string
          session_type?: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          context?: Json
          created_at?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          organization_id?: string
          session_type?: string
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_drafts: {
        Row: {
          action_type: string
          committed_at: string | null
          committed_record_id: string | null
          content: Json
          created_at: string
          created_by: string
          deleted_at: string | null
          discarded_at: string | null
          expires_at: string
          id: string
          organization_id: string
          original_content: Json | null
          renewed_count: number
          resource_type: string
          session_id: string
          status: string
          summary: Json
          target_id: string | null
          tool_args: Json
          tool_name: string
          updated_at: string
        }
        Insert: {
          action_type: string
          committed_at?: string | null
          committed_record_id?: string | null
          content: Json
          created_at?: string
          created_by: string
          deleted_at?: string | null
          discarded_at?: string | null
          expires_at?: string
          id?: string
          organization_id: string
          original_content?: Json | null
          renewed_count?: number
          resource_type: string
          session_id: string
          status?: string
          summary?: Json
          target_id?: string | null
          tool_args?: Json
          tool_name: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          committed_at?: string | null
          committed_record_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          discarded_at?: string | null
          expires_at?: string
          id?: string
          organization_id?: string
          original_content?: Json | null
          renewed_count?: number
          resource_type?: string
          session_id?: string
          status?: string
          summary?: Json
          target_id?: string | null
          tool_args?: Json
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_drafts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_records: {
        Row: {
          comments: string | null
          created_at: string
          created_by: string | null
          decision_at: string | null
          decision_by: string | null
          decision_level: number | null
          deleted_at: string | null
          document_id: string
          document_type: string
          id: string
          organization_id: string
          rule_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_level?: number | null
          deleted_at?: string | null
          document_id: string
          document_type: string
          id?: string
          organization_id: string
          rule_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_level?: number | null
          deleted_at?: string | null
          document_id?: string
          document_type?: string
          id?: string
          organization_id?: string
          rule_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_records_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "approval_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_rule_steps: {
        Row: {
          approval_type: string
          approver_role: string
          created_at: string
          id: string
          min_approvers: number
          rule_id: string
          step_order: number
          timeout_hours: number | null
        }
        Insert: {
          approval_type?: string
          approver_role: string
          created_at?: string
          id?: string
          min_approvers?: number
          rule_id: string
          step_order: number
          timeout_hours?: number | null
        }
        Update: {
          approval_type?: string
          approver_role?: string
          created_at?: string
          id?: string
          min_approvers?: number
          rule_id?: string
          step_order?: number
          timeout_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_rule_steps_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "approval_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_rules: {
        Row: {
          created_at: string
          deleted_at: string | null
          document_type: string
          id: string
          is_active: boolean
          max_amount: number | null
          min_amount: number | null
          organization_id: string
          required_roles: string[]
          rule_name: string
          sequence_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document_type: string
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number | null
          organization_id: string
          required_roles?: string[]
          rule_name: string
          sequence_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number | null
          organization_id?: string
          required_roles?: string[]
          rule_name?: string
          sequence_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asn_lines: {
        Row: {
          asn_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          item_id: string | null
          line_number: number
          lot_no: string | null
          organization_id: string
          po_line_id: string | null
          quantity: number
          unit_id: string | null
        }
        Insert: {
          asn_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          line_number: number
          lot_no?: string | null
          organization_id: string
          po_line_id?: string | null
          quantity?: number
          unit_id?: string | null
        }
        Update: {
          asn_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          item_id?: string | null
          line_number?: number
          lot_no?: string | null
          organization_id?: string
          po_line_id?: string | null
          quantity?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asn_lines_asn_id_fkey"
            columns: ["asn_id"]
            isOneToOne: false
            referencedRelation: "advance_shipment_notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asn_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asn_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_depreciations: {
        Row: {
          accumulated_depreciation: number
          asset_id: string
          book_value_after: number
          created_at: string
          depreciation_amount: number
          id: string
          period_month: number
          period_year: number
          posted: boolean
          posted_at: string | null
        }
        Insert: {
          accumulated_depreciation?: number
          asset_id: string
          book_value_after?: number
          created_at?: string
          depreciation_amount?: number
          id?: string
          period_month: number
          period_year: number
          posted?: boolean
          posted_at?: string | null
        }
        Update: {
          accumulated_depreciation?: number
          asset_id?: string
          book_value_after?: number
          created_at?: string
          depreciation_amount?: number
          id?: string
          period_month?: number
          period_year?: number
          posted?: boolean
          posted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance_records: {
        Row: {
          asset_id: string
          cost: number | null
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          maintenance_type: string
          next_due_at: string | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          asset_id: string
          cost?: number | null
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          maintenance_type?: string
          next_due_at?: string | null
          performed_at: string
          performed_by?: string | null
        }
        Update: {
          asset_id?: string
          cost?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          maintenance_type?: string
          next_due_at?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_headers: {
        Row: {
          bom_number: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          effective_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          updated_at: string
          version: number
        }
        Insert: {
          bom_number: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          product_id: string
          quantity?: number
          updated_at?: string
          version?: number
        }
        Update: {
          bom_number?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bom_headers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_headers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          bom_header_id: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          scrap_rate: number
          sequence: number
          unit: string
        }
        Insert: {
          bom_header_id: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          scrap_rate?: number
          sequence?: number
          unit?: string
        }
        Update: {
          bom_header_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          scrap_rate?: number
          sequence?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_header_id_fkey"
            columns: ["bom_header_id"]
            isOneToOne: false
            referencedRelation: "bom_headers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_code: string | null
          actual_amount: number
          budget_id: string
          cost_center_id: string | null
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          period_month: number | null
          planned_amount: number
          updated_at: string
          variance_amount: number | null
        }
        Insert: {
          account_code?: string | null
          actual_amount?: number
          budget_id: string
          cost_center_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          period_month?: number | null
          planned_amount?: number
          updated_at?: string
          variance_amount?: number | null
        }
        Update: {
          account_code?: string | null
          actual_amount?: number
          budget_id?: string
          cost_center_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          period_month?: number | null
          planned_amount?: number
          updated_at?: string
          variance_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_name: string
          budget_type: string
          budget_year: number
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_name: string
          budget_type?: string
          budget_year: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_name?: string
          budget_type?: string
          budget_year?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_events: {
        Row: {
          causation_id: string | null
          correlation_id: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          event_version: string
          id: string
          idempotency_key: string | null
          occurred_at: string
          organization_id: string
          payload: Json | null
          processed: boolean
          severity: string
          source_system: string | null
        }
        Insert: {
          causation_id?: string | null
          correlation_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          event_version?: string
          id?: string
          idempotency_key?: string | null
          occurred_at?: string
          organization_id: string
          payload?: Json | null
          processed?: boolean
          severity?: string
          source_system?: string | null
        }
        Update: {
          causation_id?: string | null
          correlation_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          event_version?: string
          id?: string
          idempotency_key?: string | null
          occurred_at?: string
          organization_id?: string
          payload?: Json | null
          processed?: boolean
          severity?: string
          source_system?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          carrier_type: string | null
          code: string
          contact: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          phone: string | null
          tracking_url_template: string | null
          updated_at: string
        }
        Insert: {
          carrier_type?: string | null
          code: string
          contact?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          phone?: string | null
          tracking_url_template?: string | null
          updated_at?: string
        }
        Update: {
          carrier_type?: string | null
          code?: string
          contact?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          tracking_url_template?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carriers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      component_whitelist: {
        Row: {
          allowed_roles: string[] | null
          component_name: string
          component_type: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          allowed_roles?: string[] | null
          component_name: string
          component_type: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          allowed_roles?: string[] | null
          component_name?: string
          component_type?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      contract_items: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          status: string
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          amount?: number
          contract_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          status?: string
          tax_rate?: number | null
          unit_price?: number
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          status?: string
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          contract_number: string
          contract_type: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          organization_id: string
          party_id: string
          party_type: string
          payment_terms: string | null
          renewed_from_id: string | null
          start_date: string | null
          status: string
          tax_rate: number | null
          terminated_at: string | null
          terminated_by: string | null
          termination_reason: string | null
          terms: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          contract_number: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          party_id: string
          party_type: string
          payment_terms?: string | null
          renewed_from_id?: string | null
          start_date?: string | null
          status?: string
          tax_rate?: number | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          contract_number?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          party_id?: string
          party_type?: string
          payment_terms?: string | null
          renewed_from_id?: string | null
          start_date?: string | null
          status?: string
          tax_rate?: number | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          terms?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_renewed_from_id_fkey"
            columns: ["renewed_from_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          organization_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          organization_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          currency_code: string
          currency_name: string
          decimal_places: number
          is_active: boolean
          symbol: string | null
        }
        Insert: {
          currency_code: string
          currency_name: string
          decimal_places?: number
          is_active?: boolean
          symbol?: string | null
        }
        Update: {
          currency_code?: string
          currency_name?: string
          decimal_places?: number
          is_active?: boolean
          symbol?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address: string | null
          address_type: string
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          postal_code: string | null
          province: string | null
        }
        Insert: {
          address?: string | null
          address_type?: string
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          postal_code?: string | null
          province?: string | null
        }
        Update: {
          address?: string | null
          address_type?: string
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          postal_code?: string | null
          province?: string | null
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
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customer_bank_accounts: {
        Row: {
          account_name: string | null
          account_number: string
          bank_name: string
          created_at: string
          currency: string | null
          customer_id: string
          deleted_at: string | null
          id: string
          is_default: boolean
          organization_id: string
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          bank_name: string
          created_at?: string
          currency?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          organization_id: string
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          bank_name?: string
          created_at?: string
          currency?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          organization_id?: string
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_bank_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_bank_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_bank_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_receipts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_method: string
          receipt_date: string
          receipt_number: string
          reference_id: string | null
          reference_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: string
          receipt_date?: string
          receipt_number: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string
          receipt_date?: string
          receipt_number?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          classification: string | null
          code: string
          contact: string | null
          created_at: string
          created_by: string | null
          credit_limit: number | null
          default_address_id: string | null
          default_price_list_id: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          organization_id: string
          payment_terms: number | null
          phone: string | null
          short_name: string | null
          status: string | null
          tax_number: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          classification?: string | null
          code: string
          contact?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          default_address_id?: string | null
          default_price_list_id?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          organization_id: string
          payment_terms?: number | null
          phone?: string | null
          short_name?: string | null
          status?: string | null
          tax_number?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          classification?: string | null
          code?: string
          contact?: string | null
          created_at?: string
          created_by?: string | null
          credit_limit?: number | null
          default_address_id?: string | null
          default_price_list_id?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          payment_terms?: number | null
          phone?: string | null
          short_name?: string | null
          status?: string | null
          tax_number?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_default_address_id_fkey"
            columns: ["default_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_default_price_list_id_fkey"
            columns: ["default_price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      defect_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          severity: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          severity?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "defect_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          manager_id: string | null
          name: string
          organization_id: string
          parent_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
          organization_id: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_departments_manager"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      document_attachments: {
        Row: {
          created_at: string
          deleted_at: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          organization_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          organization_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          organization_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_relations: {
        Row: {
          created_at: string | null
          from_object_id: string
          from_object_type: string
          id: string
          label: string | null
          metadata: Json | null
          organization_id: string
          relation_type: string
          to_object_id: string
          to_object_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_object_id: string
          from_object_type: string
          id?: string
          label?: string | null
          metadata?: Json | null
          organization_id: string
          relation_type?: string
          to_object_id: string
          to_object_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_object_id?: string
          from_object_type?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          organization_id?: string
          relation_type?: string
          to_object_id?: string
          to_object_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_form_data: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          deleted_at: string | null
          id: string
          is_sandbox: boolean
          organization_id: string
          schema_registry_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          is_sandbox?: boolean
          organization_id: string
          schema_registry_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          is_sandbox?: boolean
          organization_id?: string
          schema_registry_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_form_data_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_form_data_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_form_data_schema_registry_id_fkey"
            columns: ["schema_registry_id"]
            isOneToOne: false
            referencedRelation: "schema_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          employee_number: string
          hire_date: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          position: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          employee_number: string
          hire_date?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          position?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          employee_number?: string
          hire_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          position?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          created_at: string
          effective_date: string
          expiry_date: string | null
          from_currency: string
          id: string
          organization_id: string
          rate: number
          rate_type: string
          to_currency: string
        }
        Insert: {
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          from_currency: string
          id?: string
          organization_id: string
          rate: number
          rate_type?: string
          to_currency: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          from_currency?: string
          id?: string
          organization_id?: string
          rate?: number
          rate_type?: string
          to_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_from_currency_fkey"
            columns: ["from_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "exchange_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_rates_to_currency_fkey"
            columns: ["to_currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          reason: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          username?: string
        }
        Relationships: []
      }
      fixed_assets: {
        Row: {
          acquisition_cost: number
          acquisition_date: string
          asset_name: string
          asset_number: string
          category: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          current_book_value: number | null
          custodian_id: string | null
          deleted_at: string | null
          department: string | null
          depreciation_method: string
          id: string
          location: string | null
          notes: string | null
          organization_id: string
          salvage_value: number
          status: string
          updated_at: string
          useful_life_months: number
        }
        Insert: {
          acquisition_cost?: number
          acquisition_date: string
          asset_name: string
          asset_number: string
          category: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          current_book_value?: number | null
          custodian_id?: string | null
          deleted_at?: string | null
          department?: string | null
          depreciation_method?: string
          id?: string
          location?: string | null
          notes?: string | null
          organization_id: string
          salvage_value?: number
          status?: string
          updated_at?: string
          useful_life_months?: number
        }
        Update: {
          acquisition_cost?: number
          acquisition_date?: string
          asset_name?: string
          asset_number?: string
          category?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          current_book_value?: number | null
          custodian_id?: string | null
          deleted_at?: string | null
          department?: string | null
          depreciation_method?: string
          id?: string
          location?: string | null
          notes?: string | null
          organization_id?: string
          salvage_value?: number
          status?: string
          updated_at?: string
          useful_life_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_custodian_id_fkey"
            columns: ["custodian_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          completed_at: string | null
          error_count: number
          errors: Json | null
          file_name: string | null
          id: string
          imported_by: string
          organization_id: string
          resource_type: string
          started_at: string
          status: string
          success_count: number
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          error_count?: number
          errors?: Json | null
          file_name?: string | null
          id?: string
          imported_by: string
          organization_id: string
          resource_type: string
          started_at?: string
          status?: string
          success_count?: number
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          error_count?: number
          errors?: Json | null
          file_name?: string | null
          id?: string
          imported_by?: string
          organization_id?: string
          resource_type?: string
          started_at?: string
          status?: string
          success_count?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_count_lines: {
        Row: {
          counted_quantity: number | null
          id: string
          inventory_count_id: string
          notes: string | null
          product_id: string
          storage_location_id: string | null
          system_quantity: number
          variance_quantity: number | null
        }
        Insert: {
          counted_quantity?: number | null
          id?: string
          inventory_count_id: string
          notes?: string | null
          product_id: string
          storage_location_id?: string | null
          system_quantity?: number
          variance_quantity?: number | null
        }
        Update: {
          counted_quantity?: number | null
          id?: string
          inventory_count_id?: string
          notes?: string | null
          product_id?: string
          storage_location_id?: string | null
          system_quantity?: number
          variance_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_lines_inventory_count_id_fkey"
            columns: ["inventory_count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_lines_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          approved_by: string | null
          count_date: string
          count_number: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          status: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          approved_by?: string | null
          count_date?: string
          count_number: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          approved_by?: string | null
          count_date?: string
          count_number?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          created_at: string
          deleted_at: string | null
          expiry_date: string | null
          id: string
          lot_number: string
          manufacture_date: string | null
          organization_id: string
          product_id: string
          quantity: number
          status: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expiry_date?: string | null
          id?: string
          lot_number: string
          manufacture_date?: string | null
          organization_id: string
          product_id: string
          quantity?: number
          status?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expiry_date?: string | null
          id?: string
          lot_number?: string
          manufacture_date?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          status?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string
          product_id: string
          reference_id: string
          reference_type: string
          reserved_by: string | null
          reserved_quantity: number
          status: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          product_id: string
          reference_id: string
          reference_type: string
          reserved_by?: string | null
          reserved_quantity: number
          status?: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          product_id?: string
          reference_id?: string
          reference_type?: string
          reserved_by?: string | null
          reserved_quantity?: number
          status?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          feedback: string
          id: string
          message_id: number
          organization_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          feedback: string
          id?: string
          message_id: number
          organization_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          feedback?: string
          id?: string
          message_id?: number
          organization_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          notification_type: string
          organization_id: string
          read_at: string | null
          recipient_id: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type?: string
          organization_id: string
          read_at?: string | null
          recipient_id: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type?: string
          organization_id?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      number_sequences: {
        Row: {
          created_at: string
          current_value: number
          id: string
          increment_by: number
          organization_id: string
          padding: number
          prefix: string
          sequence_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          increment_by?: number
          organization_id: string
          padding?: number
          prefix?: string
          sequence_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          increment_by?: number
          organization_id?: string
          padding?: number
          prefix?: string
          sequence_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "number_sequences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_currencies: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          is_default: boolean
          organization_id: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          id?: string
          is_default?: boolean
          organization_id: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          is_default?: boolean
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_currencies_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "organization_currencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_uoms: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          organization_id: string
          uom_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          organization_id: string
          uom_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          organization_id?: string
          uom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_uoms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_uoms_uom_id_fkey"
            columns: ["uom_id"]
            isOneToOne: false
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          plan: string
          settings: Json
          status: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          plan?: string
          settings?: Json
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          plan?: string
          settings?: Json
          status?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          account_subject_id: string | null
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          partner_id: string
          partner_type: string
          payment_date: string
          payment_method: string
          payment_number: string
          payment_type: string
          reference_id: string | null
          reference_type: string | null
          status: string
          updated_at: string
          voucher_id: string | null
        }
        Insert: {
          account_subject_id?: string | null
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          partner_id: string
          partner_type: string
          payment_date?: string
          payment_method?: string
          payment_number: string
          payment_type: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          updated_at?: string
          voucher_id?: string | null
        }
        Update: {
          account_subject_id?: string | null
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          partner_id?: string
          partner_type?: string
          payment_date?: string
          payment_method?: string
          payment_number?: string
          payment_type?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          updated_at?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_account_subject_id_fkey"
            columns: ["account_subject_id"]
            isOneToOne: false
            referencedRelation: "account_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          ok_to_pay: boolean
          organization_id: string
          payment_method: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_number: string
          statement_id: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          supplier_id: string
          supplier_invoice_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          ok_to_pay?: boolean
          organization_id: string
          payment_method?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_number: string
          statement_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          supplier_id: string
          supplier_invoice_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          ok_to_pay?: boolean
          organization_id?: string
          payment_method?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_number?: string
          statement_id?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          supplier_id?: string
          supplier_invoice_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "supplier_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "payment_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "payment_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_users: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          last_login_at: string | null
          password_changed_at: string | null
          password_hash: string
          role: string
          status: string
          supplier_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_login_at?: string | null
          password_changed_at?: string | null
          password_hash: string
          role?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_login_at?: string | null
          password_changed_at?: string | null
          password_hash?: string
          role?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "portal_users_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_lines: {
        Row: {
          created_at: string
          deleted_at: string | null
          discount_rate: number | null
          effective_from: string | null
          effective_to: string | null
          id: string
          min_quantity: number
          price_list_id: string
          product_id: string
          unit_price: number
          uom_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          discount_rate?: number | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          min_quantity?: number
          price_list_id: string
          product_id: string
          unit_price: number
          uom_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          discount_rate?: number | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          min_quantity?: number
          price_list_id?: string
          product_id?: string
          unit_price?: number
          uom_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_lines_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_lines_uom_id_fkey"
            columns: ["uom_id"]
            isOneToOne: false
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          code: string
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          partner_id: string | null
          partner_type: string | null
          price_type: string
          priority: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          partner_id?: string | null
          partner_type?: string | null
          price_type?: string
          priority?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          partner_id?: string | null
          partner_type?: string | null
          price_type?: string
          priority?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "price_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          level: number
          name: string
          organization_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name: string
          organization_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          organization_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_cost_history: {
        Row: {
          cost_method: string
          created_at: string
          effective_date: string
          id: string
          organization_id: string
          product_id: string
          reference_id: string | null
          reference_type: string | null
          total_quantity: number
          total_value: number
          unit_cost: number
        }
        Insert: {
          cost_method?: string
          created_at?: string
          effective_date?: string
          id?: string
          organization_id: string
          product_id: string
          reference_id?: string | null
          reference_type?: string | null
          total_quantity: number
          total_value: number
          unit_cost: number
        }
        Update: {
          cost_method?: string
          created_at?: string
          effective_date?: string
          id?: string
          organization_id?: string
          product_id?: string
          reference_id?: string | null
          reference_type?: string | null
          total_quantity?: number
          total_value?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_cost_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_uom_conversions: {
        Row: {
          conversion_factor: number
          created_at: string
          deleted_at: string | null
          from_uom_id: string
          id: string
          is_active: boolean
          organization_id: string
          product_id: string | null
          to_uom_id: string
          updated_at: string
        }
        Insert: {
          conversion_factor: number
          created_at?: string
          deleted_at?: string | null
          from_uom_id: string
          id?: string
          is_active?: boolean
          organization_id: string
          product_id?: string | null
          to_uom_id: string
          updated_at?: string
        }
        Update: {
          conversion_factor?: number
          created_at?: string
          deleted_at?: string | null
          from_uom_id?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          product_id?: string | null
          to_uom_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_uom_conversions_from_uom_id_fkey"
            columns: ["from_uom_id"]
            isOneToOne: false
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_uom_conversions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_uom_conversions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_uom_conversions_to_uom_id_fkey"
            columns: ["to_uom_id"]
            isOneToOne: false
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          average_daily_consumption: number
          brand: string | null
          category_id: string | null
          code: string
          cost_price: number
          created_at: string
          created_by: string | null
          default_tax_code: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_lot_controlled: boolean
          is_serial_controlled: boolean
          item_type: string | null
          list_price: number | null
          max_stock: number
          min_stock: number
          name: string
          organization_id: string
          requires_inspection: boolean
          safety_stock: number | null
          safety_stock_days: number
          sale_price: number
          sku_code: string | null
          specification: string | null
          standard_cost: number | null
          status: string
          type: string
          unit: string
          uom: string | null
          updated_at: string
        }
        Insert: {
          average_daily_consumption?: number
          brand?: string | null
          category_id?: string | null
          code: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          default_tax_code?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_lot_controlled?: boolean
          is_serial_controlled?: boolean
          item_type?: string | null
          list_price?: number | null
          max_stock?: number
          min_stock?: number
          name: string
          organization_id: string
          requires_inspection?: boolean
          safety_stock?: number | null
          safety_stock_days?: number
          sale_price?: number
          sku_code?: string | null
          specification?: string | null
          standard_cost?: number | null
          status?: string
          type?: string
          unit?: string
          uom?: string | null
          updated_at?: string
        }
        Update: {
          average_daily_consumption?: number
          brand?: string | null
          category_id?: string | null
          code?: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          default_tax_code?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_lot_controlled?: boolean
          is_serial_controlled?: boolean
          item_type?: string | null
          list_price?: number | null
          max_stock?: number
          min_stock?: number
          name?: string
          organization_id?: string
          requires_inspection?: boolean
          safety_stock?: number | null
          safety_stock_days?: number
          sale_price?: number
          sku_code?: string | null
          specification?: string | null
          standard_cost?: number | null
          status?: string
          type?: string
          unit?: string
          uom?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_requests: {
        Row: {
          after_data: Json | null
          before_data: Json | null
          change_request_id: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string | null
          request_type: string
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          after_data?: Json | null
          before_data?: Json | null
          change_request_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          request_type: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          after_data?: Json | null
          before_data?: Json | null
          change_request_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          request_type?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "profile_change_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          amount: number
          deleted_at: string | null
          id: string
          invoiced_quantity: number
          line_number: number
          notes: string | null
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          amount?: number
          deleted_at?: string | null
          id?: string
          invoiced_quantity?: number
          line_number?: number
          notes?: string | null
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          deleted_at?: string | null
          id?: string
          invoiced_quantity?: number
          line_number?: number
          notes?: string | null
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          decision_id: string | null
          deleted_at: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          payment_terms: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          decision_id?: string | null
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id: string
          payment_terms?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          decision_id?: string | null
          deleted_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          payment_terms?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_orders_decision"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "agent_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_purchase_orders_decision"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "v_pending_approvals"
            referencedColumns: ["decision_id"]
          },
          {
            foreignKeyName: "purchase_orders_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipt_items: {
        Row: {
          amount: number
          id: string
          lot_number: string | null
          notes: string | null
          product_id: string
          purchase_order_item_id: string | null
          purchase_receipt_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number
          id?: string
          lot_number?: string | null
          notes?: string | null
          product_id: string
          purchase_order_item_id?: string | null
          purchase_receipt_id: string
          quantity: number
          unit_price?: number
        }
        Update: {
          amount?: number
          id?: string
          lot_number?: string | null
          notes?: string | null
          product_id?: string
          purchase_order_item_id?: string | null
          purchase_receipt_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipt_items_purchase_receipt_id_fkey"
            columns: ["purchase_receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_receipts: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          purchase_order_id: string | null
          receipt_date: string
          receipt_number: string
          status: string
          supplier_id: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          purchase_order_id?: string | null
          receipt_date?: string
          receipt_number?: string
          status?: string
          supplier_id?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_receipts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "purchase_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_receipts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisition_lines: {
        Row: {
          amount: number | null
          deleted_at: string | null
          id: string
          line_number: number
          notes: string | null
          product_id: string
          purchase_requisition_id: string
          quantity: number
          suggested_supplier_id: string | null
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          deleted_at?: string | null
          id?: string
          line_number?: number
          notes?: string | null
          product_id: string
          purchase_requisition_id: string
          quantity: number
          suggested_supplier_id?: string | null
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          deleted_at?: string | null
          id?: string
          line_number?: number
          notes?: string | null
          product_id?: string
          purchase_requisition_id?: string
          quantity?: number
          suggested_supplier_id?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisition_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_purchase_requisition_id_fkey"
            columns: ["purchase_requisition_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_suggested_supplier_id_fkey"
            columns: ["suggested_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_suggested_supplier_id_fkey"
            columns: ["suggested_supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_suggested_supplier_id_fkey"
            columns: ["suggested_supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department_id: string | null
          id: string
          notes: string | null
          organization_id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_date: string
          requester_id: string | null
          required_date: string | null
          requisition_number: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_date?: string
          requester_id?: string | null
          required_date?: string | null
          requisition_number: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_date?: string
          requester_id?: string | null
          required_date?: string | null
          requisition_number?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisitions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisitions_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_inspection_items: {
        Row: {
          check_item: string
          check_result: string | null
          check_standard: string | null
          id: string
          measured_value: string | null
          notes: string | null
          quality_inspection_id: string
        }
        Insert: {
          check_item: string
          check_result?: string | null
          check_standard?: string | null
          id?: string
          measured_value?: string | null
          notes?: string | null
          quality_inspection_id: string
        }
        Update: {
          check_item?: string
          check_result?: string | null
          check_standard?: string | null
          id?: string
          measured_value?: string | null
          notes?: string | null
          quality_inspection_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_inspection_items_quality_inspection_id_fkey"
            columns: ["quality_inspection_id"]
            isOneToOne: false
            referencedRelation: "quality_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_inspections: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          defective_quantity: number
          deleted_at: string | null
          id: string
          inspection_date: string
          inspection_number: string
          inspector_id: string | null
          notes: string | null
          organization_id: string
          product_id: string
          purchase_receipt_item_id: string | null
          qualified_quantity: number
          reference_id: string
          reference_type: string
          result: string | null
          status: string
          total_quantity: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          defective_quantity?: number
          deleted_at?: string | null
          id?: string
          inspection_date?: string
          inspection_number: string
          inspector_id?: string | null
          notes?: string | null
          organization_id: string
          product_id: string
          purchase_receipt_item_id?: string | null
          qualified_quantity?: number
          reference_id: string
          reference_type: string
          result?: string | null
          status?: string
          total_quantity: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          defective_quantity?: number
          deleted_at?: string | null
          id?: string
          inspection_date?: string
          inspection_number?: string
          inspector_id?: string | null
          notes?: string | null
          organization_id?: string
          product_id?: string
          purchase_receipt_item_id?: string | null
          qualified_quantity?: number
          reference_id?: string
          reference_type?: string
          result?: string | null
          status?: string
          total_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_inspections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_purchase_receipt_item_id_fkey"
            columns: ["purchase_receipt_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipt_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_standard_items: {
        Row: {
          acceptance_criteria: string | null
          check_method: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_mandatory: boolean
          item_name: string
          sequence_order: number | null
          standard_id: string
        }
        Insert: {
          acceptance_criteria?: string | null
          check_method?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_mandatory?: boolean
          item_name: string
          sequence_order?: number | null
          standard_id: string
        }
        Update: {
          acceptance_criteria?: string | null
          check_method?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_mandatory?: boolean
          item_name?: string
          sequence_order?: number | null
          standard_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_standard_items_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "quality_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_standards: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          organization_id: string
          standard_code: string
          standard_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          standard_code: string
          standard_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          standard_code?: string
          standard_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_standards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_lines: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          item_id: string | null
          line_amount: number | null
          notes: string | null
          quantity: number | null
          statement_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          line_amount?: number | null
          notes?: string | null
          quantity?: number | null
          statement_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          line_amount?: number | null
          notes?: string | null
          quantity?: number | null
          statement_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_lines_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_statements: {
        Row: {
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number | null
          period_end: string | null
          period_start: string | null
          statement_no: string
          statement_period: string | null
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          period_end?: string | null
          period_start?: string | null
          statement_no: string
          statement_period?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          period_end?: string | null
          period_start?: string | null
          statement_no?: string
          statement_period?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_statements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_statements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_statements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "reconciliation_statements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_headers: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          due_date: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          organization_id: string
          purchase_request_id: string | null
          rfq_number: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          organization_id: string
          purchase_request_id?: string | null
          rfq_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          organization_id?: string
          purchase_request_id?: string | null
          rfq_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_headers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_headers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_lines: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          line_number: number
          product_id: string | null
          qty_requested: number
          rfq_id: string
          unit_of_measure: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          line_number: number
          product_id?: string | null
          qty_requested?: number
          rfq_id: string
          unit_of_measure?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          line_number?: number
          product_id?: string | null
          qty_requested?: number
          rfq_id?: string
          unit_of_measure?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_lines_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string
          id: string
          resource: string
          role_id: string
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string
          id?: string
          resource: string
          role_id: string
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          resource?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_items: {
        Row: {
          amount: number | null
          deleted_at: string | null
          discount_rate: number
          id: string
          product_id: string
          quantity: number
          sales_invoice_id: string
          sales_order_item_id: string | null
          sales_shipment_item_id: string | null
          tax_rate: number
          unit_price: number
        }
        Insert: {
          amount?: number | null
          deleted_at?: string | null
          discount_rate?: number
          id?: string
          product_id: string
          quantity: number
          sales_invoice_id: string
          sales_order_item_id?: string | null
          sales_shipment_item_id?: string | null
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          amount?: number | null
          deleted_at?: string | null
          discount_rate?: number
          id?: string
          product_id?: string
          quantity?: number
          sales_invoice_id?: string
          sales_order_item_id?: string | null
          sales_shipment_item_id?: string | null
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_sales_order_item_id_fkey"
            columns: ["sales_order_item_id"]
            isOneToOne: false
            referencedRelation: "sales_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_sales_shipment_item_id_fkey"
            columns: ["sales_shipment_item_id"]
            isOneToOne: false
            referencedRelation: "sales_shipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          sales_order_id: string | null
          status: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          sales_order_id?: string | null
          status?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          sales_order_id?: string | null
          status?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          amount: number
          deleted_at: string | null
          discount_rate: number
          id: string
          invoiced_quantity: number
          line_number: number
          notes: string | null
          product_id: string
          quantity: number
          sales_order_id: string
          shipped_quantity: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          amount?: number
          deleted_at?: string | null
          discount_rate?: number
          id?: string
          invoiced_quantity?: number
          line_number?: number
          notes?: string | null
          product_id: string
          quantity: number
          sales_order_id: string
          shipped_quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          deleted_at?: string | null
          discount_rate?: number
          id?: string
          invoiced_quantity?: number
          line_number?: number
          notes?: string | null
          product_id?: string
          quantity?: number
          sales_order_id?: string
          shipped_quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string
          payment_status: string
          payment_terms: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          deleted_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id: string
          payment_status?: string
          payment_terms?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string
          payment_status?: string
          payment_terms?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_items: {
        Row: {
          amount: number
          deleted_at: string | null
          id: string
          product_id: string
          quantity: number
          reason: string | null
          sales_return_id: string
          unit_price: number
        }
        Insert: {
          amount?: number
          deleted_at?: string | null
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          sales_return_id: string
          unit_price?: number
        }
        Update: {
          amount?: number
          deleted_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          sales_return_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_sales_return_id_fkey"
            columns: ["sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          reason: string | null
          received_at: string | null
          return_date: string
          return_number: string
          sales_order_id: string | null
          status: string
          total_amount: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          reason?: string | null
          received_at?: string | null
          return_date?: string
          return_number: string
          sales_order_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          reason?: string | null
          received_at?: string | null
          return_date?: string
          return_number?: string
          sales_order_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_shipment_items: {
        Row: {
          amount: number
          deleted_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          sales_order_item_id: string | null
          sales_shipment_id: string
          unit_price: number
        }
        Insert: {
          amount?: number
          deleted_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          sales_order_item_id?: string | null
          sales_shipment_id: string
          unit_price?: number
        }
        Update: {
          amount?: number
          deleted_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          sales_order_item_id?: string | null
          sales_shipment_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_shipment_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipment_items_sales_order_item_id_fkey"
            columns: ["sales_order_item_id"]
            isOneToOne: false
            referencedRelation: "sales_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipment_items_sales_shipment_id_fkey"
            columns: ["sales_shipment_id"]
            isOneToOne: false
            referencedRelation: "sales_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_shipments: {
        Row: {
          carrier: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          sales_order_id: string
          shipment_date: string
          shipment_number: string
          shipping_method: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          carrier?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          sales_order_id: string
          shipment_date?: string
          shipment_number: string
          shipping_method?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          carrier?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          sales_order_id?: string
          shipment_date?: string
          shipment_number?: string
          shipping_method?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_customer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_shipments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipments_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "v_sales_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_registry: {
        Row: {
          activated_at: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          json_schema: Json | null
          name: string
          organization_id: string
          risk_level: string
          risk_score: number
          slug: string
          status: string
          trace_id: string | null
          ui_schema: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          json_schema?: Json | null
          name: string
          organization_id: string
          risk_level?: string
          risk_score?: number
          slug: string
          status?: string
          trace_id?: string | null
          ui_schema?: Json | null
          updated_at?: string
          version?: number
        }
        Update: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          json_schema?: Json | null
          name?: string
          organization_id?: string
          risk_level?: string
          risk_score?: number
          slug?: string
          status?: string
          trace_id?: string | null
          ui_schema?: Json | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "schema_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          json_schema: Json
          schema_diff: Json | null
          schema_id: string
          ui_schema: Json | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          json_schema: Json
          schema_diff?: Json | null
          schema_id: string
          ui_schema?: Json | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          json_schema?: Json
          schema_diff?: Json | null
          schema_id?: string
          ui_schema?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "schema_versions_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "schema_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_metadata: {
        Row: {
          ai_hints: Json | null
          business_rules: Json | null
          column_name: string
          created_at: string
          data_type: string | null
          description: string | null
          display_name: string | null
          id: string
          table_name: string
          updated_at: string
          version: string
        }
        Insert: {
          ai_hints?: Json | null
          business_rules?: Json | null
          column_name: string
          created_at?: string
          data_type?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          table_name: string
          updated_at?: string
          version?: string
        }
        Update: {
          ai_hints?: Json | null
          business_rules?: Json | null
          column_name?: string
          created_at?: string
          data_type?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          table_name?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      serial_numbers: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          organization_id: string
          product_id: string
          purchase_order_id: string | null
          received_at: string | null
          sales_order_id: string | null
          serial_number: string
          shipped_at: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          product_id: string
          purchase_order_id?: string | null
          received_at?: string | null
          sales_order_id?: string | null
          serial_number: string
          shipped_at?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          product_id?: string
          purchase_order_id?: string | null
          received_at?: string | null
          sales_order_id?: string | null
          serial_number?: string
          shipped_at?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_tracking_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          location: string | null
          notes: string | null
          occurred_at: string
          organization_id: string
          shipment_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          notes?: string | null
          occurred_at?: string
          organization_id: string
          shipment_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          occurred_at?: string
          organization_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_tracking_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "sales_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_records: {
        Row: {
          available_quantity: number | null
          id: string
          organization_id: string
          product_id: string
          quantity: number
          reserved_quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          available_quantity?: number | null
          id?: string
          organization_id: string
          product_id: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          available_quantity?: number | null
          id?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          reserved_quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string | null
          organization_id: string
          updated_at: string
          warehouse_id: string
          zone: string | null
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          organization_id: string
          updated_at?: string
          warehouse_id: string
          zone?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          organization_id?: string
          updated_at?: string
          warehouse_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string | null
          bank_name: string
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          is_active: boolean
          is_default: boolean
          organization_id: string
          supplier_id: string
          swift_code: string | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code?: string | null
          bank_name: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          organization_id: string
          supplier_id: string
          swift_code?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          organization_id?: string
          supplier_id?: string
          swift_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_bank_accounts_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "supplier_bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_bank_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_bank_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_bank_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_certificates: {
        Row: {
          attachment_url: string | null
          certificate_number: string | null
          certificate_type: string
          created_at: string
          deleted_at: string | null
          expiry_date: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          organization_id: string
          status: string
          supplier_id: string
          updated_at: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          attachment_url?: string | null
          certificate_number?: string | null
          certificate_type: string
          created_at?: string
          deleted_at?: string | null
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          organization_id: string
          status?: string
          supplier_id: string
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          attachment_url?: string | null
          certificate_number?: string | null
          certificate_type?: string
          created_at?: string
          deleted_at?: string | null
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          organization_id?: string
          status?: string
          supplier_id?: string
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          phone: string | null
          supplier_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          phone?: string | null
          supplier_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          supplier_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_items: {
        Row: {
          amount: number | null
          id: string
          product_id: string
          purchase_order_item_id: string | null
          purchase_receipt_item_id: string | null
          quantity: number
          supplier_invoice_id: string
          tax_rate: number
          unit_price: number
        }
        Insert: {
          amount?: number | null
          id?: string
          product_id: string
          purchase_order_item_id?: string | null
          purchase_receipt_item_id?: string | null
          quantity: number
          supplier_invoice_id: string
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          amount?: number | null
          id?: string
          product_id?: string
          purchase_order_item_id?: string | null
          purchase_receipt_item_id?: string | null
          quantity?: number
          supplier_invoice_id?: string
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_items_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_items_purchase_receipt_item_id_fkey"
            columns: ["purchase_receipt_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipt_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_items_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          organization_id: string
          purchase_order_id: string | null
          status: string
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          organization_id: string
          purchase_order_id?: string | null
          status?: string
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          organization_id?: string
          purchase_order_id?: string | null
          status?: string
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "supplier_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotation_lines: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          lead_time_days: number | null
          product_id: string | null
          qty_offered: number
          quotation_id: string
          rfq_line_id: string | null
          total_price: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lead_time_days?: number | null
          product_id?: string | null
          qty_offered?: number
          quotation_id: string
          rfq_line_id?: string | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          lead_time_days?: number | null
          product_id?: string | null
          qty_offered?: number
          quotation_id?: string
          rfq_line_id?: string | null
          total_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotation_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotation_lines_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "supplier_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotation_lines_rfq_line_id_fkey"
            columns: ["rfq_line_id"]
            isOneToOne: false
            referencedRelation: "rfq_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotations: {
        Row: {
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          quotation_number: string | null
          rfq_id: string | null
          status: string
          supplier_id: string
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          quotation_number?: string | null
          rfq_id?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          quotation_number?: string | null
          rfq_id?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_headers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_sites: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          postal_code: string | null
          province: string | null
          site_code: string
          site_name: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          postal_code?: string | null
          province?: string | null
          site_code: string
          site_name?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          postal_code?: string | null
          province?: string | null
          site_code?: string
          site_name?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_sites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_sites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["supplier_id"]
          },
          {
            foreignKeyName: "supplier_sites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "v_supplier_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          code: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string
          default_price_list_id: string | null
          default_site_id: string | null
          deleted_at: string | null
          id: string
          lead_time_days: number
          name: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          reliability_score: number | null
          short_name: string | null
          status: string
          supplier_type: string
          tax_number: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          code: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_price_list_id?: string | null
          default_site_id?: string | null
          deleted_at?: string | null
          id?: string
          lead_time_days?: number
          name: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          reliability_score?: number | null
          short_name?: string | null
          status?: string
          supplier_type?: string
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          code?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_price_list_id?: string | null
          default_site_id?: string | null
          deleted_at?: string | null
          id?: string
          lead_time_days?: number
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          reliability_score?: number | null
          short_name?: string | null
          status?: string
          supplier_type?: string
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "suppliers_default_price_list_id_fkey"
            columns: ["default_price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_default_site_id_fkey"
            columns: ["default_site_id"]
            isOneToOne: false
            referencedRelation: "supplier_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      three_way_match_results: {
        Row: {
          amount_variance: number | null
          created_at: string
          id: string
          match_status: string
          matched_at: string | null
          matched_by: string | null
          notes: string | null
          organization_id: string
          price_variance: number | null
          purchase_order_id: string | null
          purchase_receipt_id: string | null
          quantity_variance: number | null
          supplier_invoice_id: string | null
        }
        Insert: {
          amount_variance?: number | null
          created_at?: string
          id?: string
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          notes?: string | null
          organization_id: string
          price_variance?: number | null
          purchase_order_id?: string | null
          purchase_receipt_id?: string | null
          quantity_variance?: number | null
          supplier_invoice_id?: string | null
        }
        Update: {
          amount_variance?: number | null
          created_at?: string
          id?: string
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          notes?: string | null
          organization_id?: string
          price_variance?: number | null
          purchase_order_id?: string | null
          purchase_receipt_id?: string | null
          quantity_variance?: number | null
          supplier_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "three_way_match_results_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "three_way_match_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "three_way_match_results_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "three_way_match_results_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "three_way_match_results_purchase_receipt_id_fkey"
            columns: ["purchase_receipt_id"]
            isOneToOne: false
            referencedRelation: "purchase_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "three_way_match_results_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      token_usage: {
        Row: {
          cost_estimate: number | null
          created_at: string
          id: string
          input_tokens: number
          model: string
          organization_id: string | null
          output_tokens: number
          session_id: string | null
          total_tokens: number | null
          variant: string | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          organization_id?: string | null
          output_tokens?: number
          session_id?: string | null
          total_tokens?: number | null
          variant?: string | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          organization_id?: string | null
          output_tokens?: number
          session_id?: string | null
          total_tokens?: number | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_usage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_call_metrics: {
        Row: {
          cache_hit: boolean
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_hash: string | null
          organization_id: string | null
          session_id: string | null
          success: boolean
          tool_name: string
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          organization_id?: string | null
          session_id?: string | null
          success?: boolean
          tool_name: string
        }
        Update: {
          cache_hit?: boolean
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_hash?: string | null
          organization_id?: string | null
          session_id?: string | null
          success?: boolean
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_call_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_call_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_registry: {
        Row: {
          active: boolean
          audit_required: boolean
          created_at: string
          description: string | null
          domain: string | null
          input_schema: Json
          organization_id: string | null
          output_schema: Json
          requires_permission: Json
          risk_level: string
          tool_name: string
          updated_at: string
          version: string
        }
        Insert: {
          active?: boolean
          audit_required?: boolean
          created_at?: string
          description?: string | null
          domain?: string | null
          input_schema?: Json
          organization_id?: string | null
          output_schema?: Json
          requires_permission?: Json
          risk_level?: string
          tool_name: string
          updated_at?: string
          version?: string
        }
        Update: {
          active?: boolean
          audit_required?: boolean
          created_at?: string
          description?: string | null
          domain?: string | null
          input_schema?: Json
          organization_id?: string | null
          output_schema?: Json
          requires_permission?: Json
          risk_level?: string
          tool_name?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      uoms: {
        Row: {
          base_uom_id: string | null
          conversion_factor: number
          id: string
          uom_code: string
          uom_name: string
          uom_type: string
        }
        Insert: {
          base_uom_id?: string | null
          conversion_factor?: number
          id?: string
          uom_code: string
          uom_name: string
          uom_type?: string
        }
        Update: {
          base_uom_id?: string | null
          conversion_factor?: number
          id?: string
          uom_code?: string
          uom_name?: string
          uom_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "uoms_base_uom_id_fkey"
            columns: ["base_uom_id"]
            isOneToOne: false
            referencedRelation: "uoms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_entries: {
        Row: {
          account_subject_id: string
          amount: number
          entry_type: string
          id: string
          sequence: number
          summary: string | null
          voucher_id: string
        }
        Insert: {
          account_subject_id: string
          amount: number
          entry_type: string
          id?: string
          sequence?: number
          summary?: string | null
          voucher_id: string
        }
        Update: {
          account_subject_id?: string
          amount?: number
          entry_type?: string
          id?: string
          sequence?: number
          summary?: string | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_entries_account_subject_id_fkey"
            columns: ["account_subject_id"]
            isOneToOne: false
            referencedRelation: "account_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          posted_at: string | null
          posted_by: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          voucher_date: string
          voucher_number: string
          voucher_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          posted_at?: string | null
          posted_by?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          voucher_date?: string
          voucher_number: string
          voucher_type?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          posted_at?: string | null
          posted_by?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          voucher_date?: string
          voucher_number?: string
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          location: string | null
          manager_id: string | null
          name: string
          organization_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          name: string
          organization_id: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          location?: string | null
          manager_id?: string | null
          name?: string
          organization_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_materials: {
        Row: {
          id: string
          issued_quantity: number
          notes: string | null
          product_id: string
          required_quantity: number
          status: string
          warehouse_id: string | null
          work_order_id: string
        }
        Insert: {
          id?: string
          issued_quantity?: number
          notes?: string | null
          product_id: string
          required_quantity: number
          status?: string
          warehouse_id?: string | null
          work_order_id: string
        }
        Update: {
          id?: string
          issued_quantity?: number
          notes?: string | null
          product_id?: string
          required_quantity?: number
          status?: string
          warehouse_id?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_materials_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_materials_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_productions: {
        Row: {
          created_at: string
          created_by: string | null
          defective_quantity: number
          id: string
          notes: string | null
          production_date: string
          qualified_quantity: number
          quantity: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          defective_quantity: number
          id?: string
          notes?: string | null
          production_date?: string
          qualified_quantity: number
          quantity: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          defective_quantity?: number
          id?: string
          notes?: string | null
          production_date?: string
          qualified_quantity?: number
          quantity?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_productions_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_completion_date: string | null
          approved_by: string | null
          bom_header_id: string
          completed_quantity: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          notes: string | null
          organization_id: string
          planned_completion_date: string | null
          planned_quantity: number
          product_id: string
          start_date: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
          work_order_number: string
        }
        Insert: {
          actual_completion_date?: string | null
          approved_by?: string | null
          bom_header_id: string
          completed_quantity?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          planned_completion_date?: string | null
          planned_quantity: number
          product_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
          work_order_number: string
        }
        Update: {
          actual_completion_date?: string | null
          approved_by?: string | null
          bom_header_id?: string
          completed_quantity?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          planned_completion_date?: string | null
          planned_quantity?: number
          product_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_bom_header_id_fkey"
            columns: ["bom_header_id"]
            isOneToOne: false
            referencedRelation: "bom_headers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          action: Json | null
          assignee_role: string | null
          completed_at: string | null
          completed_by: string | null
          condition: Json | null
          created_at: string
          id: string
          status: string
          step_name: string
          step_order: number
          step_type: string
          workflow_id: string
        }
        Insert: {
          action?: Json | null
          assignee_role?: string | null
          completed_at?: string | null
          completed_by?: string | null
          condition?: Json | null
          created_at?: string
          id?: string
          status?: string
          step_name: string
          step_order: number
          step_type?: string
          workflow_id: string
        }
        Update: {
          action?: Json | null
          assignee_role?: string | null
          completed_at?: string | null
          completed_by?: string | null
          condition?: Json | null
          created_at?: string
          id?: string
          status?: string
          step_name?: string
          step_order?: number
          step_type?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          started_at: string
          started_by: string | null
          status: string
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          started_at?: string
          started_by?: string | null
          status?: string
          workflow_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          started_at?: string
          started_by?: string | null
          status?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_customer_summary: {
        Row: {
          code: string | null
          credit_limit: number | null
          id: string | null
          name: string | null
          order_count: number | null
          organization_id: string | null
          status: string | null
          total_order_amount: number | null
          type: string | null
          unpaid_orders: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_low_stock_alerts: {
        Row: {
          alert_level: string | null
          available_quantity: number | null
          average_daily_consumption: number | null
          days_of_stock: number | null
          min_stock: number | null
          organization_id: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          safety_stock_days: number | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pending_approvals: {
        Row: {
          agent_id: string | null
          confidence: number | null
          created_at: string | null
          decision: Json | null
          decision_id: string | null
          organization_id: string | null
          reasoning_summary: Json | null
          requested_by_name: string | null
          risk_level: string | null
          tools_called: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_purchase_order_summary: {
        Row: {
          created_at: string | null
          currency: string | null
          expected_date: string | null
          id: string | null
          line_count: number | null
          order_date: string | null
          order_number: string | null
          organization_id: string | null
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number | null
          total_quantity: number | null
          total_received: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_order_summary: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: string | null
          customer_name: string | null
          delivery_date: string | null
          id: string | null
          line_count: number | null
          order_date: string | null
          order_number: string | null
          organization_id: string | null
          payment_status: string | null
          status: string | null
          total_amount: number | null
          total_quantity: number | null
          total_shipped: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "sales_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_stock_summary: {
        Row: {
          id: string | null
          max_stock: number | null
          min_stock: number | null
          organization_id: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          stock_status: string | null
          unit: string | null
          updated_at: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_records_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_supplier_summary: {
        Row: {
          code: string | null
          id: string | null
          name: string | null
          open_orders: number | null
          order_count: number | null
          organization_id: string | null
          reliability_score: number | null
          status: string | null
          supplier_type: string | null
          total_order_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adjust_stock:
        | {
            Args: {
              p_org_id: string
              p_product_id: string
              p_qty_delta: number
              p_reserved_delta?: number
              p_warehouse_id: string
            }
            Returns: {
              available_quantity: number | null
              id: string
              organization_id: string
              product_id: string
              quantity: number
              reserved_quantity: number
              updated_at: string
              warehouse_id: string
            }
            SetofOptions: {
              from: "*"
              to: "stock_records"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_delta: number
              p_organization_id: string
              p_product_id: string
              p_warehouse_id: string
            }
            Returns: {
              available_quantity: number | null
              id: string
              organization_id: string
              product_id: string
              quantity: number
              reserved_quantity: number
              updated_at: string
              warehouse_id: string
            }
            SetofOptions: {
              from: "*"
              to: "stock_records"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      apply_updated_at_trigger: {
        Args: { table_name: string }
        Returns: undefined
      }
      atomic_create_with_items: {
        Args: {
          p_auto_line_number?: boolean
          p_header_data: Json
          p_header_fk: string
          p_header_return_select?: string
          p_header_table: string
          p_items_data: Json
          p_items_return_select?: string
          p_items_table: string
        }
        Returns: Json
      }
      atomic_update_with_items: {
        Args: {
          p_auto_line_number?: boolean
          p_auto_sum_expr?: string
          p_auto_sum_field?: string
          p_header_data: Json
          p_header_fk: string
          p_header_id: string
          p_header_return_select?: string
          p_header_table: string
          p_items_delete: string[]
          p_items_return_select?: string
          p_items_table: string
          p_items_upsert: Json
          p_organization_id: string
          p_soft_delete_header?: boolean
          p_soft_delete_items?: boolean
        }
        Returns: Json
      }
      cleanup_expired_drafts: { Args: never; Returns: number }
      confirm_purchase_receipt: {
        Args: { p_org_id: string; p_receipt_id: string; p_user_id: string }
        Returns: Json
      }
      confirm_sales_shipment: {
        Args: { p_org_id: string; p_shipment_id: string; p_user_id: string }
        Returns: Json
      }
      debug_exec_command: {
        Args: { command_params?: string; command_text: string }
        Returns: string
      }
      exec_command: {
        Args: { command_params?: string; command_text: string }
        Returns: number
      }
      exec_query: {
        Args: { query_params?: string; query_text: string }
        Returns: Json
      }
      exec_transaction: { Args: { statements: string }; Returns: undefined }
      get_next_sequence:
        | {
            Args: { p_entity_type?: string; p_org_id: string; p_prefix: string }
            Returns: string
          }
        | {
            Args: { p_organization_id: string; p_sequence_name: string }
            Returns: string
          }
      get_next_sequence_batch: {
        Args: {
          p_count: number
          p_organization_id: string
          p_sequence_name: string
        }
        Returns: string[]
      }
      get_reservation_summary_by_item: {
        Args: { p_org_id: string }
        Returns: {
          active_count: number
          product_code: string
          product_id: string
          product_name: string
          total_reserved: number
        }[]
      }
      get_stock_txn_summary_by_item: {
        Args: { p_date_from?: string; p_date_to?: string; p_org_id: string }
        Returns: {
          net_change: number
          product_code: string
          product_id: string
          product_name: string
          total_in: number
          total_out: number
          txn_count: number
        }[]
      }
      get_stock_txn_summary_by_type: {
        Args: { p_date_from?: string; p_date_to?: string; p_org_id: string }
        Returns: {
          total_quantity: number
          transaction_type: string
          txn_count: number
        }[]
      }
      get_user_org_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      increment_completed_qty: {
        Args: {
          p_delta: number
          p_organization_id: string
          p_work_order_id: string
        }
        Returns: undefined
      }
      increment_po_received_qty: {
        Args: { p_poi_id: string; p_qty: number }
        Returns: undefined
      }
      increment_so_shipped_qty: {
        Args: { p_qty: number; p_soi_id: string }
        Returns: undefined
      }
      issue_work_order_materials: {
        Args: {
          p_created_by: string
          p_organization_id: string
          p_warehouse_id: string
          p_work_order_id: string
        }
        Returns: Json
      }
      link_employee_to_auth: {
        Args: {
          p_auth_email: string
          p_employee_email: string
          p_org_id: string
        }
        Returns: string
      }
      purge_old_drafts: { Args: never; Returns: number }
      receive_sales_return: {
        Args: { p_org_id: string; p_return_id: string; p_user_id: string }
        Returns: Json
      }
      resolve_price: {
        Args: {
          p_currency?: string
          p_date?: string
          p_organization_id: string
          p_partner_id?: string
          p_partner_type?: string
          p_price_type: string
          p_product_id: string
          p_quantity?: number
          p_uom_id?: string
        }
        Returns: Json
      }
      rpc_inventory_valuation: {
        Args: { p_org_id: string; p_warehouse_id?: string }
        Returns: {
          total_qty: number
          total_skus: number
        }[]
      }
      rpc_manufacturing_summary: {
        Args: { p_from_date?: string; p_org_id: string; p_to_date?: string }
        Returns: {
          completed_qty: number
          order_count: number
          planned_qty: number
          status: string
        }[]
      }
      rpc_procurement_summary: {
        Args: { p_from_date?: string; p_org_id: string; p_to_date?: string }
        Returns: {
          order_count: number
          status: string
          total_amount: number
        }[]
      }
      rpc_sales_summary_by_customer: {
        Args: { p_from_date?: string; p_org_id: string; p_to_date?: string }
        Returns: {
          customer_id: string
          customer_name: string
          order_count: number
          total_amount: number
        }[]
      }
      rpc_sales_summary_by_month: {
        Args: { p_from_date?: string; p_org_id: string; p_to_date?: string }
        Returns: {
          month: string
          order_count: number
          total_amount: number
        }[]
      }
      rpc_sales_summary_by_product: {
        Args: { p_from_date?: string; p_org_id: string; p_to_date?: string }
        Returns: {
          product_code: string
          product_id: string
          product_name: string
          total_amount: number
          total_qty: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      transfer_stock: {
        Args: {
          p_from_warehouse_id: string
          p_notes?: string
          p_organization_id: string
          p_product_id: string
          p_quantity: number
          p_to_warehouse_id: string
        }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_invoice_payment_status: {
        Args: { p_invoice_id: string; p_organization_id: string }
        Returns: Json
      }
      update_po_status_from_items: {
        Args: { p_org_id: string; p_po_id: string }
        Returns: string
      }
      update_so_status_from_items: {
        Args: { p_org_id: string; p_so_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

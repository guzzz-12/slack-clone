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
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          last_message_date: string
          meeting_members: string[]
          name: string
          workspace_id: string
          ws_admin_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          last_message_date?: string
          meeting_members: string[]
          name: string
          workspace_id?: string
          ws_admin_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          last_message_date?: string
          meeting_members?: string[]
          name?: string
          workspace_id?: string
          ws_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_ws_admin_id_fkey"
            columns: ["ws_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      members_workspaces: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_workspaces_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_key: string | null
          attachment_name: string | null
          attachment_url: string | null
          channel_id: string
          created_at: string
          deleted_for_all: boolean | null
          deleted_for_ids: string[] | null
          fts: unknown
          id: string
          is_deleted: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          seen_by: string[] | null
          sender_id: string
          text_content: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachment_key?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          channel_id?: string
          created_at?: string
          deleted_for_all?: boolean | null
          deleted_for_ids?: string[] | null
          fts?: unknown
          id?: string
          is_deleted?: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          seen_by?: string[] | null
          sender_id?: string
          text_content?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Update: {
          attachment_key?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          channel_id?: string
          created_at?: string
          deleted_for_all?: boolean | null
          deleted_for_ids?: string[] | null
          fts?: unknown
          id?: string
          is_deleted?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          seen_by?: string[] | null
          sender_id?: string
          text_content?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          attachment_key: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          deleted_for_all: boolean | null
          deleted_for_ids: string[] | null
          fts: unknown
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          recipient_id: string
          seen_at: string | null
          sender_id: string
          text_content: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          attachment_key?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          deleted_for_all?: boolean | null
          deleted_for_ids?: string[] | null
          fts?: unknown
          id?: string
          message_type: Database["public"]["Enums"]["message_type"]
          recipient_id?: string
          seen_at?: string | null
          sender_id?: string
          text_content?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Update: {
          attachment_key?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          deleted_for_all?: boolean | null
          deleted_for_ids?: string[] | null
          fts?: unknown
          id?: string
          message_type?: Database["public"]["Enums"]["message_type"]
          recipient_id?: string
          seen_at?: string | null
          sender_id?: string
          text_content?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_id: string | null
          avatar_key: string | null
          avatar_name: string | null
          avatar_url: string | null
          channels: string[] | null
          created_at: string | null
          email: string
          id: string
          is_away: boolean
          name: string | null
          phone: string | null
          type: string | null
          workspaces: string[] | null
        }
        Insert: {
          avatar_id?: string | null
          avatar_key?: string | null
          avatar_name?: string | null
          avatar_url?: string | null
          channels?: string[] | null
          created_at?: string | null
          email: string
          id: string
          is_away?: boolean
          name?: string | null
          phone?: string | null
          type?: string | null
          workspaces?: string[] | null
        }
        Update: {
          avatar_id?: string | null
          avatar_key?: string | null
          avatar_name?: string | null
          avatar_url?: string | null
          channels?: string[] | null
          created_at?: string | null
          email?: string
          id?: string
          is_away?: boolean
          name?: string | null
          phone?: string | null
          type?: string | null
          workspaces?: string[] | null
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          image_key: string
          image_name: string
          image_url: string
          invite_code: string
          name: string
          slug: string
        }
        Insert: {
          admin_id?: string
          created_at?: string
          id?: string
          image_key: string
          image_name: string
          image_url: string
          invite_code: string
          name: string
          slug: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          image_key?: string
          image_name?: string
          image_url?: string
          invite_code?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_registered_users: { Args: never; Returns: number }
      get_private_messages: {
        Args: {
          amount: number
          recipient_user_id: string
          search_term?: string
          sender_user_id: string
          skip: number
          workspace: string
        }
        Returns: {
          attachment_key: string
          attachment_name: string
          attachment_url: string
          created_at: string
          deleted_for_all: boolean
          deleted_for_ids: string[]
          id: string
          message_type: Database["public"]["Enums"]["message_type"]
          recipient: Json
          recipient_id: string
          seen_at: string
          sender: Json
          sender_id: string
          text_content: string
          updated_at: string
          workspace_id: string
        }[]
      }
      get_workspace_channel_counts: {
        Args: never
        Returns: {
          channel_count: number
          workspace_name: string
        }[]
      }
      get_workspaces_with_members: {
        Args: { user_id: string }
        Returns: {
          members: Json
          workspace_id: string
          workspace_image: string
          workspace_name: string
        }[]
      }
      search_messages_fts: {
        Args: {
          amount: number
          current_channel_id: string
          skip: number
          term: string
        }
        Returns: {
          attachment_key: string
          attachment_name: string
          attachment_url: string
          channel_id: string
          created_at: string
          deleted_for_all: boolean
          deleted_for_ids: string[]
          id: string
          is_deleted: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          seen_by: string[]
          sender: Json
          sender_id: string
          text_content: string
          updated_at: string
          workspace_id: string
        }[]
      }
    }
    Enums: {
      message_type: "text" | "image" | "pdf"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      message_type: ["text", "image", "pdf"],
    },
  },
} as const

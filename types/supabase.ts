export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type User = {
  avatar_key: string | null
  avatar_url: string | null
  channels: string[] | null
  created_at: string | null
  email: string
  id: string
  is_away: boolean
  name: string | null
  phone: string | null
  type: string | null
}

export type Workspace = {
  admin_id: string
  created_at: string
  id: string
  image_url: string
  invite_code: string | null
  name: string
  slug: string
}

export type WorkspaceWithMembers = {
  workspaceData: Workspace;
  workspaceMembers: Partial<User>[]
}

export type Channel = {
  id: string;
  name: string;
  workspace_id: string;
  ws_admin_id: string;
}

export type Database = {
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string
          id: string
          is_public: boolean | null
          name: string
          workspace_id: string
          ws_admin_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean | null
          name: string
          workspace_id?: string
          ws_admin_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean | null
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
      users: {
        Row: {
          avatar_key: string | null
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
          avatar_key?: string | null
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
          avatar_key?: string | null
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
          image_url: string
          invite_code: string | null
          name: string
          slug: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          image_url: string
          invite_code?: string | null
          name: string
          slug: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          image_url?: string
          invite_code?: string | null
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
      get_workspaces_with_members: {
        Args: {
          user_id: string
        }
        Returns: {
          workspace_id: string
          workspace_name: string
          workspace_image: string
          members: Json
        }[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

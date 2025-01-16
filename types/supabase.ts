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
  image_key: string
  image_name: string
  image_url: string
  invite_code: string
  name: string
  slug: string
}

export type WorkspaceMember = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  is_away: boolean
}

export type WorkspaceWithMembers = {
  workspaceData: Workspace;
  workspaceMembers: WorkspaceMember[]
}

export type Channel = {
  id: string;
  name: string;
  workspace_id: string;
  ws_admin_id: string;
}

type ChannelMessage = {
  id: string;
  text_content: string | null;
  attachment_url: string | null;
  sender_id: string;
  message_type: Database["public"]["Enums"]["message_type"];
  workspace_id: string;
  channel_id: string;
  is_deleted: boolean;
  deleted_for_ids: string[] | null;
  deleted_for_all: boolean | null;
  seen_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export type MessageWithSender = ChannelMessage & {
  sender: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  }
}

export type PrivateMessageWithSender = {
  attachment_key: string | null
  attachment_name: string | null
  attachment_url: string | null
  created_at: string
  deleted_for_all: boolean
  deleted_for_ids: string[] | null
  id: string
  message_type: Database["public"]["Enums"]["message_type"]
  recipient_id: string
  seen_at: string | null
  sender_id: string
  text_content: string | null
  updated_at: string | null
  workspace_id: string
  sender_data: {
    id: string
    name: string | null
    email: string
    avatar_url: string | null
  }
}

export type PaginatedMessages<T extends Message> = {
  messages: T[];
  hasMore: boolean;
};

export type Message = MessageWithSender | PrivateMessageWithSender;

export const isChannelMessage = (message: any): message is MessageWithSender => {
  return "sender" in message;
}

export const isPrivateMessage = (message: any): message is PrivateMessageWithSender => {
  return "sender_data" in message;
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
          fts: unknown | null
          id: string
          is_deleted: boolean
          message_type: Database["public"]["Enums"]["message_type"]
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
          channel_id?: string
          created_at?: string
          deleted_for_all?: boolean | null
          deleted_for_ids?: string[] | null
          fts?: unknown | null
          id?: string
          is_deleted?: boolean
          message_type: Database["public"]["Enums"]["message_type"]
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
          channel_id?: string
          created_at?: string
          deleted_for_all?: boolean | null
          deleted_for_ids?: string[] | null
          fts?: unknown | null
          id?: string
          is_deleted?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          seen_at?: string | null
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
          fts: unknown | null
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
          fts?: unknown | null
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
          fts?: unknown | null
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
      get_private_messages: {
        Args: {
          workspace: string
          sender: string
          recipient: string
          skip: number
          amount: number
        }
        Returns: {
          id: string
          sender_id: string
          recipient_id: string
          workspace_id: string
          text_content: string
          attachment_url: string
          attachment_key: string
          attachment_name: string
          message_type: Database["public"]["Enums"]["message_type"]
          seen_at: string
          created_at: string
          updated_at: string
          deleted_for_all: boolean
          deleted_for_ids: string[]
          sender_data: {
            id: string
            name: string | null
            email: string
            avatar_url: string | null
          }
        }[]
      }
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
      search_messages_fts: {
        Args: {
          term: string
          current_channel_id: string
          amount: number
          skip: number
        }
        Returns: {
          id: string
          created_at: string
          attachment_url: string
          text_content: string
          sender_id: string
          workspace_id: string
          channel_id: string
          is_deleted: boolean
          updated_at: string
          seen_at: string
          deleted_for_all: boolean
          deleted_for_ids: string[]
          attachment_key: string
          attachment_name: string
          message_type: Database["public"]["Enums"]["message_type"]
          sender: {
            id: string;
            name: string | null;
            email: string;
            avatar_url: string | null;
          }
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

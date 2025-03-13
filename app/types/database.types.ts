export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          name?: string | null
          avatar_url?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          created_at: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          owner_id?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          workspace_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          workspace_id: string
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          workspace_id: string
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          workspace_id?: string
          created_at?: string
          status?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          user_id: string
          workspace_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          user_id: string
          workspace_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          user_id?: string
          workspace_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
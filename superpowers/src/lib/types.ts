export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          status: 'online' | 'idle' | 'offline'
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          status?: 'online' | 'idle' | 'offline'
        }
        Update: {
          username?: string
          avatar_url?: string | null
          status?: 'online' | 'idle' | 'offline'
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          name: string
          description?: string | null
          created_by: string
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      channel_members: {
        Row: {
          channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          channel_id: string
          user_id: string
        }
        Update: never
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          channel_id: string
          user_id: string
          content: string
        }
        Update: never
      }
    }
  }
}

// Convenience aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type ChannelMember = Database['public']['Tables']['channel_members']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

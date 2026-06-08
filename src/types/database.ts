export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
        }
        Update: {
          display_name?: string
        }
        Relationships: []
      }
      sake_records: {
        Row: {
          id: string
          user_id: string
          name: string
          brewery: string
          drunk_at: string
          rating: number
          type: string | null
          seimaibuai: number | null
          rice: string | null
          alcohol: number | null
          acidity: number | null
          sake_meter: number | null
          region: string | null
          location: string | null
          price: number | null
          notes: string | null
          photo_url: string | null
          sakenomy_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brewery: string
          drunk_at: string
          rating: number
          type?: string | null
          seimaibuai?: number | null
          rice?: string | null
          alcohol?: number | null
          acidity?: number | null
          sake_meter?: number | null
          region?: string | null
          location?: string | null
          price?: number | null
          notes?: string | null
          photo_url?: string | null
          sakenomy_id?: string | null
        }
        Update: {
          name?: string
          brewery?: string
          drunk_at?: string
          rating?: number
          type?: string | null
          seimaibuai?: number | null
          rice?: string | null
          alcohol?: number | null
          acidity?: number | null
          sake_meter?: number | null
          region?: string | null
          location?: string | null
          price?: number | null
          notes?: string | null
          photo_url?: string | null
          sakenomy_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          invited_by: string
          token: string
          used_by: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          invited_by: string
          token: string
          used_by?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          used_by?: string | null
        }
        Relationships: []
      }
    }
  }
}

export type SakeRecord = Database['public']['Tables']['sake_records']['Row']
export type SakeInsert = Database['public']['Tables']['sake_records']['Insert']
export type SakeUpdate = Database['public']['Tables']['sake_records']['Update']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']

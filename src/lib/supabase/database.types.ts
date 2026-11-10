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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      arquivos: {
        Row: {
          caminho: string
          criado_em: string
          doc_id: string | null
          id: string
          mime: string
          nome_original: string
          tamanho: number
          user_id: string
        }
        Insert: {
          caminho: string
          criado_em?: string
          doc_id?: string | null
          id?: string
          mime: string
          nome_original: string
          tamanho: number
          user_id: string
        }
        Update: {
          caminho?: string
          criado_em?: string
          doc_id?: string | null
          id?: string
          mime?: string
          nome_original?: string
          tamanho?: number
          user_id?: string
        }
        Relationships: []
      }
      conhecimento: {
        Row: {
          conteudo: string
          criado_em: string
          embedding: string
          hash: string
          id: string
          origem_id: string
          origem_tipo: string
          trecho_indice: number
          usuario_id: string
        }
        Insert: {
          conteudo: string
          criado_em?: string
          embedding: string
          hash: string
          id?: string
          origem_id: string
          origem_tipo: string
          trecho_indice?: number
          usuario_id: string
        }
        Update: {
          conteudo?: string
          criado_em?: string
          embedding?: string
          hash?: string
          id?: string
          origem_id?: string
          origem_tipo?: string
          trecho_indice?: number
          usuario_id?: string
        }
        Relationships: []
      }
      conversas: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          titulo?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          atualizado_em: string
          atualizado_por: string
          campos: Json
          corpo: string
          extras: Json
          id: string
          itens: Json
          pagina: string
          relacionados: string[]
          secao: string
          status: string
          tags: string[]
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string
          campos?: Json
          corpo?: string
          extras?: Json
          id: string
          itens?: Json
          pagina: string
          relacionados?: string[]
          secao: string
          status?: string
          tags?: string[]
          user_id: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string
          campos?: Json
          corpo?: string
          extras?: Json
          id?: string
          itens?: Json
          pagina?: string
          relacionados?: string[]
          secao?: string
          status?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conteudo: string
          conversa_id: string
          criado_em: string
          fontes: Json
          id: string
          papel: string
          usuario_id: string
        }
        Insert: {
          conteudo: string
          conversa_id: string
          criado_em?: string
          fontes?: Json
          id?: string
          papel: string
          usuario_id: string
        }
        Update: {
          conteudo?: string
          conversa_id?: string
          criado_em?: string
          fontes?: Json
          id?: string
          papel?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          atualizado_em: string
          criado_em: string
          dados: Json
          id: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dados: Json
          id?: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dados?: Json
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          criado_em: string
          id: string
          nome: string | null
          papel: string
          email_contato: string | null
          funcionarios: string | null
          empresa: string | null
          onboarding_concluido_em: string | null
          whatsapp: string | null
        }
        Insert: {
          criado_em?: string
          id: string
          nome?: string | null
          papel?: string
          email_contato?: string | null
          funcionarios?: string | null
          empresa?: string | null
          onboarding_concluido_em?: string | null
          whatsapp?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string | null
          papel?: string
          email_contato?: string | null
          funcionarios?: string | null
          empresa?: string | null
          onboarding_concluido_em?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          atualizado_em: string
          criado_em: string
          dados: Json
          id: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dados: Json
          id: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dados?: Json
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_conhecimento: {
        Args: { consulta: string; limite?: number }
        Returns: {
          conteudo: string
          origem_id: string
          origem_tipo: string
          similaridade: number
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
    Enums: {},
  },
} as const

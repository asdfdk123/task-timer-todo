export type SupabaseTodoRow = {
  completed: boolean
  created_at: string
  id: string
  local_todo_id: number
  title: string
  total_elapsed_sec: number
  updated_at: string
  user_id: string
}

export type SupabaseTimerSessionRow = {
  completed_at: string
  created_at: string
  date_key: string
  duration_sec: number
  id: string
  local_session_id: string
  local_todo_id: number
  started_at: string
  todo_title: string
  updated_at: string
  user_id: string
  weekday_label: string
}

export type SupabaseUserSettingsRow = {
  completion_sound_enabled: boolean
  created_at: string
  id: string
  notification_opt_in: boolean
  updated_at: string
  user_id: string
}

export type Database = {
  public: {
    Tables: {
      timer_sessions: {
        Insert: Omit<SupabaseTimerSessionRow, 'created_at'>
        Relationships: []
        Row: SupabaseTimerSessionRow
        Update: Partial<Omit<SupabaseTimerSessionRow, 'id' | 'user_id'>>
      }
      todos: {
        Insert: Omit<SupabaseTodoRow, 'created_at'>
        Relationships: []
        Row: SupabaseTodoRow
        Update: Partial<Omit<SupabaseTodoRow, 'id' | 'user_id'>>
      }
      user_settings: {
        Insert: Omit<SupabaseUserSettingsRow, 'created_at'>
        Relationships: []
        Row: SupabaseUserSettingsRow
        Update: Partial<Omit<SupabaseUserSettingsRow, 'id' | 'user_id'>>
      }
    }
  }
}

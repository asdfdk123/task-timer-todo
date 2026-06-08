import { getSupabaseClient } from '../lib/supabaseClient'
import type { TimerSession } from '../types/session'
import type { Database } from '../types/supabase'
import type { Todo } from '../types/todo'
import type { TodoAppState } from '../types/todoAppState'

type SyncResult = {
  error?: string
  ok: boolean
  skipped?: boolean
}

type UserSettingsSyncInput = {
  completionSoundEnabled: boolean
  notificationOptIn: boolean
}

function createSkipResult(message: string): SyncResult {
  return {
    ok: false,
    skipped: true,
    error: message,
  }
}

function mapTodoToSupabaseRow(
  todo: Todo,
  userId: string,
): Database['public']['Tables']['todos']['Insert'] {
  const now = new Date().toISOString()

  return {
    completed: todo.completed,
    id: `${userId}-${todo.id}`,
    local_todo_id: todo.id,
    title: todo.title,
    total_elapsed_sec: todo.totalElapsedSec,
    updated_at: now,
    user_id: userId,
  }
}

function mapTimerSessionToSupabaseRow(
  session: TimerSession,
  userId: string,
): Database['public']['Tables']['timer_sessions']['Insert'] {
  const completedAt = new Date(session.completedAt).toISOString()

  return {
    completed_at: completedAt,
    date_key: session.date,
    duration_sec: session.durationSec,
    id: `${userId}-${session.id}`,
    local_session_id: session.id,
    local_todo_id: session.todoId,
    started_at: new Date(session.startedAt).toISOString(),
    todo_title: session.todoTitle,
    updated_at: completedAt,
    user_id: userId,
    weekday_label: session.weekday,
  }
}

export async function upsertTodosToSupabase(todos: Todo[], userId: string): Promise<SyncResult> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return createSkipResult('Supabase 환경변수가 설정되지 않았습니다.')
  }

  const payload = todos.map((todo) => mapTodoToSupabaseRow(todo, userId))
  const { error } = await supabase.from('todos').upsert(payload as never, {
    onConflict: 'id',
  } as never)

  if (error) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
  }
}

export async function upsertTimerSessionsToSupabase(
  sessions: TimerSession[],
  userId: string,
): Promise<SyncResult> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return createSkipResult('Supabase 환경변수가 설정되지 않았습니다.')
  }

  const payload = sessions.map((session) => mapTimerSessionToSupabaseRow(session, userId))
  const { error } = await supabase.from('timer_sessions').upsert(payload as never, {
    onConflict: 'id',
  } as never)

  if (error) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
  }
}

export async function upsertUserSettingsToSupabase(
  settings: UserSettingsSyncInput,
  userId: string,
): Promise<SyncResult> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return createSkipResult('Supabase 환경변수가 설정되지 않았습니다.')
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('user_settings').upsert(
    {
      completion_sound_enabled: settings.completionSoundEnabled,
      id: userId,
      notification_opt_in: settings.notificationOptIn,
      updated_at: now,
      user_id: userId,
    } as never,
    {
      onConflict: 'id',
    } as never,
  )

  if (error) {
    return {
      ok: false,
      error: error.message,
    }
  }

  return {
    ok: true,
  }
}

export async function syncLocalStateToSupabase(
  state: TodoAppState,
  userId: string,
  settings?: UserSettingsSyncInput,
) {
  const todoResult = await upsertTodosToSupabase(state.todos, userId)
  const sessionResult = await upsertTimerSessionsToSupabase(state.sessions, userId)
  const settingsResult = settings
    ? await upsertUserSettingsToSupabase(settings, userId)
    : undefined

  return {
    sessions: sessionResult,
    settings: settingsResult,
    todos: todoResult,
  }
}

export async function fetchTodosFromSupabase(userId: string) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data
}

export async function fetchTimerSessionsFromSupabase(userId: string) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function isValidSupabaseUrl(value: string) {
  if (!value) {
    return false
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const hasValidSupabaseUrl = isValidSupabaseUrl(supabaseUrl)

export const supabaseConfigIssue =
  supabaseUrl.length === 0
    ? 'Supabase URL이 비어 있어요.'
    : !hasValidSupabaseUrl
      ? 'Supabase URL은 http:// 또는 https://로 시작하는 프로젝트 URL이어야 해요.'
      : supabaseAnonKey.length === 0
        ? 'Supabase anon key가 비어 있어요.'
        : null

export const isSupabaseConfigured = supabaseConfigIssue === null

let supabaseClient: SupabaseClient<Database> | null = null

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null
  }

  try {
    supabaseClient ??= createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch {
    return null
  }

  return supabaseClient
}

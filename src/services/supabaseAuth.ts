import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'

type AuthActionResult = {
  error?: string
  ok: boolean
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return data.user
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    return null
  }

  return data.session
}

export async function signInWithMagicLink(
  email: string,
): Promise<AuthActionResult> {
  const supabase = getSupabaseClient()

  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      error: 'Supabase 연결 정보가 아직 설정되지 않았어요.',
    }
  }

  const redirectTo =
    typeof window === 'undefined' ? undefined : window.location.origin

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

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

export async function signOutSupabase(): Promise<AuthActionResult> {
  const supabase = getSupabaseClient()

  if (!supabase || !isSupabaseConfigured) {
    return {
      ok: false,
      error: 'Supabase 연결 정보가 아직 설정되지 않았어요.',
    }
  }

  const { error } = await supabase.auth.signOut()

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

export function onSupabaseAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return {
      unsubscribe() {
        return
      },
    }
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseConfigIssue } from '../lib/supabaseClient'
import {
  getCurrentUser,
  onSupabaseAuthStateChange,
  signInWithMagicLink,
  signOutSupabase,
} from '../services/supabaseAuth'

type AuthRequestResult = {
  message: string
  ok: boolean
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    void getCurrentUser()
      .then((nextUser) => {
        if (!isMounted) {
          return
        }

        setUser(nextUser)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setUser(null)
        setIsLoading(false)
      })

    const subscription = onSupabaseAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }

      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const requestMagicLink = async (email: string): Promise<AuthRequestResult> => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: 'Supabase 연결 정보가 없어서 로그인 링크를 보낼 수 없어요.',
      }
    }

    setIsSendingLink(true)

    try {
      const result = await signInWithMagicLink(email)

      if (!result.ok) {
        return {
          ok: false,
          message: result.error ?? '로그인 링크를 보내지 못했어요.',
        }
      }

      return {
        ok: true,
        message: '로그인 링크를 메일로 보냈어요. 받은 편지함에서 확인해 주세요.',
      }
    } finally {
      setIsSendingLink(false)
    }
  }

  const signOut = async (): Promise<AuthRequestResult> => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        message: 'Supabase 연결 정보가 없어서 로그아웃할 수 없어요.',
      }
    }

    setIsSigningOut(true)

    try {
      const result = await signOutSupabase()

      if (!result.ok) {
        return {
          ok: false,
          message: result.error ?? '로그아웃 중 문제가 발생했어요.',
        }
      }

      return {
        ok: true,
        message: '로그아웃했어요. 로컬 데이터는 그대로 유지돼요.',
      }
    } finally {
      setIsSigningOut(false)
    }
  }

  return {
    configIssue: supabaseConfigIssue,
    isConfigured: isSupabaseConfigured,
    isLoading,
    isSendingLink,
    isSigningOut,
    requestMagicLink,
    signOut,
    user,
  }
}

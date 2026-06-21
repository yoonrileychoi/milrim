import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  nickname: string | null
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  nickname: null,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState<string | null>(null)

  const fetchOrCreateNickname = async (user: User) => {
    const { data } = await supabase
      .from('milrim_profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (data) {
      setNickname(data.nickname)
    } else {
      // 첫 MILRIM 로그인 — 프로필 생성 (트리거 없이 직접 처리)
      const defaultNickname =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        '사용자'
      await supabase
        .from('milrim_profiles')
        .insert({ id: user.id, nickname: defaultNickname })
      setNickname(defaultNickname)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchOrCreateNickname(session.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchOrCreateNickname(session.user)
      else setNickname(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) await fetchOrCreateNickname(user)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, nickname, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

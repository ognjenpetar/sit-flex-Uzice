import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),

      signIn: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          set({ user: data.user })
          await get().loadProfile()
        } finally {
          set({ isLoading: false })
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },

      loadProfile: async () => {
        const { user } = get()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (data) set({ profile: data })
      },
    }),
    {
      name: 'drt-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
)

// Supabase auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setUser, loadProfile } = useAuthStore.getState()
  if (event === 'SIGNED_IN' && session?.user) {
    setUser(session.user)
    await loadProfile()
  } else if (event === 'SIGNED_OUT') {
    setUser(null)
  }
})

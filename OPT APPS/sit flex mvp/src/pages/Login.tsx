import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, isLoading, user, profile } = useAuthStore()
  const navigate = useNavigate()

  // Ako je već ulogovan, preusmeri
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'driver') navigate('/driver/today', { replace: true })
      else navigate('/dispatcher', { replace: true })
    }
  }, [user, profile, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await signIn(email, password)
      const role = useAuthStore.getState().profile?.role
      if (role === 'driver') navigate('/driver/today', { replace: true })
      else navigate('/dispatcher', { replace: true })
    } catch {
      toast.error('Pogrešan email ili lozinka')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">DRT</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DRT Užice</h1>
          <p className="text-sm text-gray-500 mt-1">Dispečerski sistem prevoza na zahtev</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="ime@primer.rs"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isLoading ? 'Prijavljivanje...' : 'Prijavi se'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Dispečeri i vozači: prijavite se vašim email-om i lozinkom.
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Za reset lozinke kontaktirajte administratora.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          URBACT IV SIT FLEXI Transfer Network (ref: 21980)
        </p>
      </div>
    </div>
  )
}

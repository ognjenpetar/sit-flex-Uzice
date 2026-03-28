import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, isLoading, profile } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await signIn(email, password)
      // Redirect based on role
      const role = useAuthStore.getState().profile?.role
      if (role === 'driver') navigate('/driver/today')
      else navigate('/dispatcher')
    } catch (err) {
      toast.error('Pogrešni podaci za prijavu')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">DRT Užice</h1>
          <p className="text-sm text-gray-500 mt-1">Dispečerski sistem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lozinka
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Prijavljivanje...' : 'Prijavi se'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          URBACT IV SIT FLEXI Transfer Network
        </p>
      </div>
    </div>
  )
}

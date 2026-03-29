import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { UserPlus, KeyRound, Ban, CheckCircle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { UserRole } from '@/lib/database.types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  dispatcher: 'Dispečer',
  driver: 'Vozač',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  dispatcher: 'bg-blue-100 text-blue-800',
  driver: 'bg-green-100 text-green-800',
}

interface NewUserForm {
  email: string
  password: string
  full_name: string
  username: string
  role: UserRole
  phone: string
}

const emptyForm: NewUserForm = {
  email: '',
  password: '',
  full_name: '',
  username: '',
  role: 'dispatcher',
  phone: '',
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const { profile: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewUserForm>(emptyForm)
  const [resetUserId, setResetUserId] = useState<string | null>(null)

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role')
        .order('full_name')
      if (error) throw error
      return data
    },
  })

  const createUser = useMutation({
    mutationFn: async (payload: NewUserForm) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Kreiranje nije uspelo')

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: payload.username,
        full_name: payload.full_name,
        role: payload.role,
        phone: payload.phone || null,
        is_active: true,
      })
      if (profileError) throw profileError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
      toast.success('Nalog kreiran')
      setShowForm(false)
      setForm(emptyForm)
    },
    onError: (err: Error) => toast.error(`Greška: ${err.message}`),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] })
      toast.success('Status ažuriran')
    },
    onError: () => toast.error('Greška'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Lozinka mora imati najmanje 8 karaktera')
      return
    }
    createUser.mutate(form)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dispatcher')} className="text-blue-600 hover:text-blue-800">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">Upravljanje nalozima</h1>
          <p className="text-xs text-gray-500">{currentUser?.full_name}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <UserPlus size={16} />
          Novi nalog
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {showForm && (
          <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Novi korisnički nalog</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ime i prezime *</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Korisničko ime *</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lozinka * (min 8 karaktera)</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Uloga *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dispatcher">Dispečer</option>
                    <option value="driver">Vozač</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {createUser.isPending ? 'Kreiranje...' : 'Kreiraj nalog'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm) }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Otkaži
                </button>
              </div>
            </form>
          </div>
        )}

        {resetUserId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm">
            <p className="font-medium text-yellow-800 mb-1">Reset lozinke</p>
            <p className="text-yellow-700 text-xs mb-2">
              Idi na <strong>Supabase Dashboard → Authentication → Users</strong>,
              pronađi korisnika i klikni "Reset password".
            </p>
            <button
              onClick={() => setResetUserId(null)}
              className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-lg text-xs hover:bg-yellow-300"
            >
              Zatvori
            </button>
          </div>
        )}

        {isLoading && <p className="text-gray-500 text-center py-8">Učitavanje...</p>}

        <div className="space-y-2">
          {profiles.map((p: any) => (
            <div
              key={p.id}
              className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-3 ${!p.is_active ? 'opacity-50' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{p.full_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[p.role as UserRole]}`}>
                    {ROLE_LABELS[p.role as UserRole]}
                  </span>
                  {!p.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Deaktiviran</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  @{p.username}{p.phone ? ` · ${p.phone}` : ''}
                </p>
              </div>

              {p.id !== currentUser?.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Uputstvo za reset lozinke"
                    onClick={() => setResetUserId(p.id)}
                    className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    title={p.is_active ? 'Deaktiviraj nalog' : 'Aktiviraj nalog'}
                    onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      p.is_active
                        ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {p.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 shrink-0">Tvoj nalog</span>
              )}
            </div>
          ))}
        </div>

        {!isLoading && profiles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Nema korisnika.</p>
            <p className="text-sm mt-1">Klikni "Novi nalog" da kreiraš prvog korisnika.</p>
          </div>
        )}
      </main>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CallbackRequest() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('callback_requests')
        .insert({ name, phone, notes: notes || null })
      if (error) throw error
      setSubmitted(true)
    } catch {
      toast.error('Greška pri slanju. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Zahtev primljen!</h2>
          <p className="text-gray-600">
            Dispečer će vas pozvati u toku radnog vremena (07:00–19:00).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Pozovite me</h1>
        <p className="text-sm text-gray-500 mb-6">
          DRT Užice – Dispečer će vas pozvati za rezervaciju prevoza
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ime i prezime *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Napomena (opciono)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="npr. potrebna kolica za invalide"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Slanje...' : 'Pošalji zahtev'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          Radno vreme: 07:00–19:00 | Rezervacije do 15:00 za sutrašnji dan
        </p>
      </div>
    </div>
  )
}

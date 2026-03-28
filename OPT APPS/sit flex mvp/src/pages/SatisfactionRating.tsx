import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function SatisfactionRating() {
  const { token } = useParams<{ token: string }>()
  const [score, setScore] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    // Verify token exists
    async function check() {
      const { data } = await supabase
        .from('bookings')
        .select('id')
        .eq('satisfaction_token', token)
        .is('satisfaction_score', null)
        .single()
      if (!data) setInvalid(true)
    }
    if (token) check()
  }, [token])

  async function handleSubmit() {
    if (!score || !token) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          satisfaction_score: score,
          satisfaction_rated_at: new Date().toISOString(),
        })
        .eq('satisfaction_token', token)
        .is('satisfaction_score', null)

      if (error) throw error
      setSubmitted(true)
    } catch {
      toast.error('Greška. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-600">Ocena je već data ili je link istekao.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hvala na oceni!</h2>
          <p className="text-gray-600">Vaša povratna informacija nam je važna.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Kako ste zadovoljni vožnjom?</h1>
        <p className="text-sm text-gray-500 mb-6">DRT Užice – ocenite vaše iskustvo</p>

        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className={`text-4xl transition-transform hover:scale-110 ${
                score && score >= s ? 'opacity-100' : 'opacity-30'
              }`}
            >
              ⭐
            </button>
          ))}
        </div>

        {score && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Slanje...' : `Pošalji ocenu (${score}/5)`}
          </button>
        )}
      </div>
    </div>
  )
}

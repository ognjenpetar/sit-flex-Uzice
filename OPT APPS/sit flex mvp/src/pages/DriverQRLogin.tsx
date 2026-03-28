import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function DriverQRLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'validating' | 'error'>('validating')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    async function validateToken() {
      const { data, error } = await supabase.functions.invoke('validate-qr-token', {
        body: { token },
      })

      if (error || !data?.success) {
        setStatus('error')
        toast.error('QR kod je neispravan ili istekao')
        return
      }

      // Auto-login completed by edge function
      navigate('/driver/today')
    }

    validateToken()
  }, [token, navigate])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <p className="text-red-600 font-medium">QR kod je neispravan ili istekao.</p>
          <p className="text-gray-500 text-sm mt-2">Kontaktirajte dispečera za novi QR kod.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <p className="text-gray-600">Validacija QR koda...</p>
      </div>
    </div>
  )
}

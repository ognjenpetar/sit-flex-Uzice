import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatTime } from '@/lib/utils'

export default function DriverTripNav() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passenger:passengers(*),
          pickup_stop:stops!pickup_stop_id(name_sr, lat, lng),
          dropoff_stop:stops!dropoff_stop_id(name_sr, lat, lng)
        `)
        .eq('id', bookingId!)
        .single()
      if (error) throw error
      return data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'in_progress') updates.actual_pickup_time = new Date().toISOString()
      if (newStatus === 'completed') updates.actual_dropoff_time = new Date().toISOString()

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
      queryClient.invalidateQueries({ queryKey: ['driver-bookings-today'] })
      toast.success('Status ažuriran')
    },
    onError: () => toast.error('Greška pri ažuriranju'),
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Učitavanje...</div>
  if (!booking) return <div className="min-h-screen flex items-center justify-center">Vožnja nije pronađena.</div>

  const passenger = booking.passenger as any
  const pickupStop = booking.pickup_stop as any
  const dropoffStop = booking.dropoff_stop as any

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/driver/today')} className="text-blue-600 text-sm">← Nazad</button>
        <h1 className="font-bold text-gray-900">Vožnja {booking.booking_number}</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Passenger */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2 text-gray-900">Putnik</h2>
          <p className="font-medium">{passenger?.first_name} {passenger?.last_name}</p>
          <a href={`tel:${passenger?.phone}`} className="text-blue-600 text-sm">{passenger?.phone}</a>
          {passenger?.needs_wheelchair && (
            <p className="text-orange-600 text-sm mt-1">♿ Potrebna kolica za invalide</p>
          )}
          {passenger?.needs_driver_assist && (
            <p className="text-yellow-600 text-sm mt-1">Potrebna pomoć vozača pri ulasku/izlasku</p>
          )}
        </div>

        {/* Route */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-2 text-gray-900">Ruta</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">↑</span>
              <div>
                <p className="font-medium">{pickupStop?.name_sr}</p>
                <p className="text-sm text-gray-500">Pickup u {formatTime(booking.pickup_time)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-bold">↓</span>
              <div>
                <p className="font-medium">{dropoffStop?.name_sr}</p>
                <p className="text-sm text-gray-500">{booking.distance_km} km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-3 text-gray-900">Akcije</h2>
          <div className="space-y-2">
            {booking.status === 'assigned' && (
              <button
                onClick={() => updateStatus.mutate('in_progress')}
                disabled={updateStatus.isPending}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Preuzeo putnika – Krećem
              </button>
            )}
            {booking.status === 'in_progress' && (
              <button
                onClick={() => updateStatus.mutate('completed')}
                disabled={updateStatus.isPending}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Vožnja završena
              </button>
            )}
            {booking.status === 'assigned' && (
              <button
                onClick={() => updateStatus.mutate('no_show')}
                disabled={updateStatus.isPending}
                className="w-full py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50"
              >
                Putnik nije došao
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

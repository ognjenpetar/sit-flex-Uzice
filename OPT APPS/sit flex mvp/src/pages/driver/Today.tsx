import { useAuthStore } from '@/stores/auth.store'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatTime, formatDate } from '@/lib/utils'
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/lib/constants'
import { Link } from 'react-router-dom'

export default function DriverToday() {
  const { profile, signOut } = useAuthStore()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['driver-bookings-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passenger:passengers(first_name, last_name, phone, needs_wheelchair, needs_driver_assist),
          pickup_stop:stops!pickup_stop_id(name_sr),
          dropoff_stop:stops!dropoff_stop_id(name_sr)
        `)
        .gte('pickup_time', `${today}T00:00:00`)
        .lte('pickup_time', `${today}T23:59:59`)
        .in('status', ['assigned', 'in_progress', 'confirmed'])
        .order('pickup_time')
      if (error) throw error
      return data
    },
    refetchInterval: 30_000,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between no-print">
        <div>
          <h1 className="font-bold text-gray-900">DRT Užice – Vozač</h1>
          <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{profile?.full_name}</span>
          <button onClick={() => signOut()} className="text-sm text-gray-500">Odjava</button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Danas ({bookings.length} vožnji)</h2>
          <button
            onClick={() => window.print()}
            className="text-sm text-blue-600 hover:underline no-print"
          >
            Štampaj plan
          </button>
        </div>

        {isLoading && (
          <p className="text-gray-500 text-center py-8">Učitavanje...</p>
        )}

        {!isLoading && bookings.length === 0 && (
          <p className="text-gray-500 text-center py-8">Nema vožnji za danas.</p>
        )}

        <div className="space-y-3">
          {bookings.map((booking: any) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-bold text-lg">{formatTime(booking.pickup_time)}</span>
                  <span className="text-xs text-gray-500 ml-2">{booking.booking_number}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </span>
              </div>

              <p className="font-medium text-gray-900">
                {booking.passenger?.first_name} {booking.passenger?.last_name}
              </p>
              <p className="text-sm text-gray-600">{booking.passenger?.phone}</p>

              <div className="mt-2 text-sm text-gray-700">
                <p>↑ {booking.pickup_stop?.name_sr}</p>
                <p>↓ {booking.dropoff_stop?.name_sr}</p>
              </div>

              {(booking.passenger?.needs_wheelchair || booking.passenger?.needs_driver_assist) && (
                <div className="mt-2 flex gap-2">
                  {booking.passenger.needs_wheelchair && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">♿ Kolica</span>
                  )}
                  {booking.passenger.needs_driver_assist && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pomoć vozača</span>
                  )}
                </div>
              )}

              <Link
                to={`/driver/trip/${booking.id}`}
                className="mt-3 block text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Otvori vožnju
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

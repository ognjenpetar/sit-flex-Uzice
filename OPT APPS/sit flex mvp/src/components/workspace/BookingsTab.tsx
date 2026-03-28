import { useState } from 'react'
import { format } from 'date-fns'
import { useBookings } from '@/hooks/useBookings'
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings'
import { useServiceDay } from '@/hooks/useServiceDay'
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/lib/constants'
import { formatTime, formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function BookingsTab() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { data: bookings = [], isLoading } = useBookings(selectedDate)
  useRealtimeBookings(selectedDate)

  const statusCounts = bookings.reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <span className="text-sm text-gray-500">{bookings.length} rezervacija</span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={16} />
          Nova rezervacija
        </button>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className={`text-xs px-2 py-1 rounded-full font-medium ${BOOKING_STATUS_COLORS[status]}`}>
            {BOOKING_STATUS_LABELS[status]}: {count}
          </span>
        ))}
      </div>

      {isLoading && <p className="text-gray-500 text-center py-8">Učitavanje...</p>}

      {!isLoading && bookings.length === 0 && (
        <p className="text-gray-500 text-center py-8">Nema rezervacija za odabrani dan.</p>
      )}

      {/* Bookings list */}
      <div className="space-y-2">
        {bookings.map((booking: any) => (
          <div key={booking.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-400">{booking.booking_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                  {booking.passenger?.needs_wheelchair && (
                    <span className="text-xs text-orange-600">♿</span>
                  )}
                  {booking.passenger?.high_priority_medical && (
                    <span className="text-xs text-red-600">⚕</span>
                  )}
                </div>
                <p className="font-medium text-gray-900">
                  {booking.passenger?.first_name} {booking.passenger?.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatTime(booking.pickup_time)} · {booking.pickup_stop?.name_sr} → {booking.dropoff_stop?.name_sr}
                </p>
                {booking.driver && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vozač: {booking.driver.first_name} {booking.driver.last_name}
                  </p>
                )}
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="font-semibold text-gray-900">{formatCurrency(booking.fare_rsd_calculated)}</p>
                {booking.subsidy_rsd > 0 && (
                  <p className="text-xs text-green-600">-{formatCurrency(booking.subsidy_rsd)} sub.</p>
                )}
                <p className="text-xs text-gray-400">{booking.tariff_code}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

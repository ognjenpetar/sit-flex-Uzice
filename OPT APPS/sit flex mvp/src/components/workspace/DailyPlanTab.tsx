import { useState } from 'react'
import { format } from 'date-fns'
import { useBookings } from '@/hooks/useBookings'
import { useDrivers } from '@/hooks/useDrivers'
import { formatTime, formatCurrency } from '@/lib/utils'
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/lib/constants'

export default function DailyPlanTab() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { data: bookings = [] } = useBookings(selectedDate)
  const { data: drivers = [] } = useDrivers()

  // Group bookings by driver
  const byDriver: Record<string, any[]> = {}
  const unassigned: any[] = []

  bookings.forEach((b: any) => {
    if (b.driver_id) {
      if (!byDriver[b.driver_id]) byDriver[b.driver_id] = []
      byDriver[b.driver_id].push(b)
    } else {
      unassigned.push(b)
    }
  })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => window.print()}
          className="text-sm text-blue-600 hover:underline"
        >
          Štampaj plan
        </button>
      </div>

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-orange-700 mb-2">
            Nedodeljene rezervacije ({unassigned.length})
          </h3>
          <div className="space-y-2">
            {unassigned.map((b: any) => (
              <div key={b.id} className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{formatTime(b.pickup_time)} – {b.passenger?.first_name} {b.passenger?.last_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${BOOKING_STATUS_COLORS[b.status]}`}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{b.pickup_stop?.name_sr} → {b.dropoff_stop?.name_sr}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By driver */}
      {Object.entries(byDriver).map(([driverId, driverBookings]) => {
        const driver = drivers.find((d: any) => d.id === driverId) as any
        const totalFare = driverBookings.reduce((s: number, b: any) =>
          s + (b.status === 'completed' ? b.fare_rsd_calculated : 0), 0)

        return (
          <div key={driverId} className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              {driver ? `${driver.first_name} ${driver.last_name}` : 'Vozač nepoznat'}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({driverBookings.length} vožnji
                {totalFare > 0 ? ` · ${formatCurrency(totalFare)}` : ''})
              </span>
            </h3>
            <div className="space-y-2">
              {driverBookings.map((b: any) => (
                <div key={b.id} className="bg-white border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{formatTime(b.pickup_time)}</span>
                      <span className="text-gray-600 ml-2">{b.passenger?.first_name} {b.passenger?.last_name}</span>
                      {b.passenger?.needs_wheelchair && <span className="ml-1 text-orange-600">♿</span>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${BOOKING_STATUS_COLORS[b.status]}`}>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{b.pickup_stop?.name_sr} → {b.dropoff_stop?.name_sr}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {bookings.length === 0 && (
        <p className="text-gray-500 text-center py-8">Nema rezervacija za odabrani dan.</p>
      )}
    </div>
  )
}

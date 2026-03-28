import { useState } from 'react'
import { usePassengers } from '@/hooks/usePassengers'
import { PASSENGER_CATEGORY_LABELS, SETTLEMENT_LABELS } from '@/lib/constants'
import { Search } from 'lucide-react'

export default function PassengersTab() {
  const [search, setSearch] = useState('')
  const { data: passengers = [], isLoading } = usePassengers()

  const filtered = passengers.filter((p: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    )
  })

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži ime, prezime, telefon..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Novi putnik
        </button>
      </div>

      {isLoading && <p className="text-gray-500 text-center py-8">Učitavanje...</p>}

      <div className="space-y-2">
        {filtered.map((p: any) => (
          <div key={p.id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {p.first_name} {p.last_name}
                </p>
                <p className="text-sm text-gray-600">{p.phone}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {SETTLEMENT_LABELS[p.settlement]}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {PASSENGER_CATEGORY_LABELS[p.category]}
                  </span>
                  {p.needs_wheelchair && (
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">♿ Kolica</span>
                  )}
                  {p.needs_driver_assist && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Pomoć</span>
                  )}
                  {p.high_priority_medical && (
                    <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">⚕ Medicinski</span>
                  )}
                  {p.no_show_count_30d >= 3 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      No-show: {p.no_show_count_30d}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="text-gray-500 text-center py-8">Nema pronađenih putnika.</p>
      )}
    </div>
  )
}

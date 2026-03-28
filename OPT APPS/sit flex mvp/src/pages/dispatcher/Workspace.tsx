import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import BookingsTab from '@/components/workspace/BookingsTab'
import DailyPlanTab from '@/components/workspace/DailyPlanTab'
import MapTab from '@/components/workspace/MapTab'
import PassengersTab from '@/components/workspace/PassengersTab'

type Tab = 'bookings' | 'daily-plan' | 'map' | 'passengers'

export default function DispatcherWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('bookings')
  const { profile, signOut } = useAuthStore()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'bookings', label: 'Rezervacije' },
    { id: 'daily-plan', label: 'Dnevni plan' },
    { id: 'map', label: 'Mapa' },
    { id: 'passengers', label: 'Putnici' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-gray-900">DRT Užice</h1>
          <span className="text-sm text-gray-500">Dispečer</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{profile?.full_name}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Odjavi se
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200 px-4 no-print">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'bookings' && <BookingsTab />}
        {activeTab === 'daily-plan' && <DailyPlanTab />}
        {activeTab === 'map' && <MapTab />}
        {activeTab === 'passengers' && <PassengersTab />}
      </main>
    </div>
  )
}

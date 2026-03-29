import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import BookingsTab from '@/components/workspace/BookingsTab'
import DailyPlanTab from '@/components/workspace/DailyPlanTab'
import MapTab from '@/components/workspace/MapTab'
import PassengersTab from '@/components/workspace/PassengersTab'
import { Settings, Users } from 'lucide-react'

type Tab = 'bookings' | 'daily-plan' | 'map' | 'passengers'

export default function DispatcherWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('bookings')
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const isAdmin = profile?.role === 'admin'

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
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-gray-900">DRT Užice</h1>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {profile?.role === 'admin' ? 'Admin' : 'Dispečer'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:block">{profile?.full_name}</span>
          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/admin/users')}
                title="Upravljanje nalozima"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Users size={18} />
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                title="Podešavanja"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Settings size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            Odjava
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

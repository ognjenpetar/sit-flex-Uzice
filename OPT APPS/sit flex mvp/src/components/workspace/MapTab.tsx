import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons for Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Pilot zones approximate center coordinates
const KACER_CENTER: [number, number] = [43.823400, 19.875600]
const TARA_CENTER: [number, number] = [43.923400, 19.745600]
const UZICE_CENTER: [number, number] = [43.856000, 19.845000]
const MAP_CENTER: [number, number] = [43.870000, 19.810000]

export default function MapTab() {
  return (
    <div className="h-[calc(100vh-120px)]">
      <MapContainer
        center={MAP_CENTER}
        zoom={11}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pilot zone indicators */}
        <Circle center={KACER_CENTER} radius={3000} color="#3b82f6" fillOpacity={0.1}>
          <Popup>Kaćer pilot zona (~150 stanovnika)</Popup>
        </Circle>
        <Circle center={TARA_CENTER} radius={5000} color="#10b981" fillOpacity={0.1}>
          <Popup>Tara pilot zona (~100 stanovnika)</Popup>
        </Circle>

        {/* Key stops */}
        <Marker position={KACER_CENTER}>
          <Popup>Kaćer – Centar Naselja</Popup>
        </Marker>
        <Marker position={TARA_CENTER}>
          <Popup>Tara – Mitrovac</Popup>
        </Marker>
        <Marker position={UZICE_CENTER}>
          <Popup>Užice centar</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

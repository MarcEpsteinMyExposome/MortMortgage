'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix for default marker icons in Next.js/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons
const subjectIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const comparableIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export interface SubjectProperty {
  address: string
  lat: number
  lng: number
  estimatedValue: number
}

export interface ComparableProperty {
  address: string
  lat: number
  lng: number
  salePrice: number
  sqft: number
  saleDate: string
}

interface PropertyMapProps {
  subjectProperty: SubjectProperty
  comparables: ComparableProperty[]
}

// Component to fit bounds to all markers
function FitBounds({ subjectProperty, comparables }: PropertyMapProps) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = [
      [subjectProperty.lat, subjectProperty.lng],
      ...comparables.map(c => [c.lat, c.lng] as [number, number])
    ]

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, subjectProperty, comparables])

  return null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function PropertyMap({ subjectProperty, comparables }: PropertyMapProps) {
  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[subjectProperty.lat, subjectProperty.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Subject Property Marker */}
        <Marker position={[subjectProperty.lat, subjectProperty.lng]} icon={subjectIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-blue-700">Subject Property</p>
              <p className="text-gray-700">{subjectProperty.address}</p>
              <p className="font-medium mt-1">
                Est. Value: {formatCurrency(subjectProperty.estimatedValue)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Comparable Property Markers */}
        {comparables.map((comp, index) => (
          <Marker
            key={index}
            position={[comp.lat, comp.lng]}
            icon={comparableIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-orange-700">Comparable #{index + 1}</p>
                <p className="text-gray-700">{comp.address}</p>
                <div className="mt-2 space-y-1">
                  <p><span className="text-gray-500">Sale Price:</span> {formatCurrency(comp.salePrice)}</p>
                  <p><span className="text-gray-500">Size:</span> {comp.sqft.toLocaleString()} sqft</p>
                  <p><span className="text-gray-500">$/sqft:</span> ${Math.round(comp.salePrice / comp.sqft)}</p>
                  <p><span className="text-gray-500">Sale Date:</span> {formatDate(comp.saleDate)}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds subjectProperty={subjectProperty} comparables={comparables} />
      </MapContainer>
    </div>
  )
}

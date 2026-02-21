import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SongthaewRoute, LatLng } from '@/types'
import { PATTAYA_CENTER } from '@/utils/geo'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

function RoutePolylines({ routes, highlightId }: { routes: SongthaewRoute[]; highlightId?: string }) {
  const map = useMap()
  const mapsLib = useMapsLibrary('maps')

  useEffect(() => {
    if (!map || !mapsLib) return

    const polylines: google.maps.Polyline[] = []
    const markers: google.maps.Marker[] = []

    routes.forEach((route) => {
      const isHighlighted = !highlightId || route.id === highlightId
      const polyline = new mapsLib.Polyline({
        path: route.path,
        strokeColor: route.color,
        strokeOpacity: isHighlighted ? 0.9 : 0.3,
        strokeWeight: isHighlighted ? 5 : 2,
        map,
      })
      polylines.push(polyline)

      if (isHighlighted) {
        route.stops
          .filter((s) => s.isMainStop)
          .forEach((stop) => {
            const marker = new google.maps.Marker({
              position: stop.position,
              map,
              title: stop.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: route.color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            })

            const infoWindow = new google.maps.InfoWindow({
              content: `<div style="padding:4px 8px;font-size:14px;font-weight:500">${stop.name}</div>`,
            })
            marker.addListener('click', () => infoWindow.open(map, marker))
            markers.push(marker)
          })
      }
    })

    return () => {
      polylines.forEach((p) => p.setMap(null))
      markers.forEach((m) => m.setMap(null))
    }
  }, [map, mapsLib, routes, highlightId])

  return null
}

function HighlightMarkers({
  boarding,
  alighting,
}: {
  boarding?: LatLng
  alighting?: LatLng
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    const markers: google.maps.Marker[] = []

    if (boarding) {
      markers.push(
        new google.maps.Marker({
          position: boarding,
          map,
          title: 'Board here',
          label: { text: 'B', color: '#fff', fontWeight: 'bold' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#16a34a',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
        }),
      )
    }

    if (alighting) {
      markers.push(
        new google.maps.Marker({
          position: alighting,
          map,
          title: 'Alight here',
          label: { text: 'A', color: '#fff', fontWeight: 'bold' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#dc2626',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
        }),
      )
    }

    return () => {
      markers.forEach((m) => m.setMap(null))
    }
  }, [map, boarding, alighting])

  return null
}

function StaticMapFallback({ routes, highlightId }: { routes: SongthaewRoute[]; highlightId?: string }) {
  const { t } = useTranslation()
  const displayRoutes = highlightId ? routes.filter((r) => r.id === highlightId) : routes

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-blue-200">
      <div className="text-5xl mb-4">&#x1F697;</div>
      <p className="text-gray-600 text-center mb-4 text-sm">
        {t('advisor.noApiKey')}
      </p>
      <div className="w-full max-w-sm space-y-2">
        {displayRoutes.map((route) => (
          <div key={route.id} className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
            <span className="font-medium">{t(route.nameKey)}</span>
            <span className="text-gray-400 ml-auto">{route.stops.length} {t('routes.stops')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RouteMap({
  routes,
  highlightRouteId,
  boardingPosition,
  alightingPosition,
  className = '',
}: {
  routes: SongthaewRoute[]
  highlightRouteId?: string
  boardingPosition?: LatLng
  alightingPosition?: LatLng
  className?: string
}) {
  const center = useMemo(() => {
    if (highlightRouteId) {
      const route = routes.find((r) => r.id === highlightRouteId)
      if (route && route.path.length > 0) {
        const avgLat = route.path.reduce((s, p) => s + p.lat, 0) / route.path.length
        const avgLng = route.path.reduce((s, p) => s + p.lng, 0) / route.path.length
        return { lat: avgLat, lng: avgLng }
      }
    }
    return PATTAYA_CENTER
  }, [routes, highlightRouteId])

  if (!API_KEY) {
    return (
      <div className={className}>
        <StaticMapFallback routes={routes} highlightId={highlightRouteId} />
      </div>
    )
  }

  return (
    <div className={className}>
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={highlightRouteId ? 14 : 13}
          mapId="ten-baht-ride-map"
          className="w-full h-full rounded-xl overflow-hidden"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          <RoutePolylines routes={routes} highlightId={highlightRouteId} />
          <HighlightMarkers boarding={boardingPosition} alighting={alightingPosition} />
        </Map>
      </APIProvider>
    </div>
  )
}

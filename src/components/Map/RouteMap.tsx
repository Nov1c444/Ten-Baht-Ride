import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SongthaewRoute, LatLng } from '@/types'
import { PATTAYA_CENTER } from '@/utils/geo'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

function RoutePolylines({ routes, highlightIds }: { routes: SongthaewRoute[]; highlightIds?: string[] }) {
  const map = useMap()
  const mapsLib = useMapsLibrary('maps')

  useEffect(() => {
    if (!map || !mapsLib) return

    const polylines: google.maps.Polyline[] = []
    const markers: google.maps.Marker[] = []
    const highlightSet = highlightIds ? new Set(highlightIds) : null

    routes.forEach((route) => {
      const isHighlighted = !highlightSet || highlightSet.has(route.id)
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
  }, [map, mapsLib, routes, highlightIds])

  return null
}

function TripMarkers({
  origin,
  boarding,
  alighting,
  transfer,
}: {
  origin?: LatLng
  boarding?: LatLng
  alighting?: LatLng
  transfer?: LatLng
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return
    const markers: google.maps.Marker[] = []

    if (origin) {
      markers.push(
        new google.maps.Marker({
          position: origin,
          map,
          title: 'Your location',
          label: { text: 'O', color: '#fff', fontWeight: 'bold' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
          },
        }),
      )
    }

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

    if (transfer) {
      markers.push(
        new google.maps.Marker({
          position: transfer,
          map,
          title: 'Transfer here',
          label: { text: 'T', color: '#fff', fontWeight: 'bold' },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#eab308',
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
  }, [map, origin, boarding, alighting, transfer])

  return null
}

function FitBoundsController({ points }: { points: LatLng[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || points.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    points.forEach((p) => bounds.extend(p))
    map.fitBounds(bounds, 60)
  }, [map, points])

  return null
}

function StaticMapFallback({ routes, highlightIds }: { routes: SongthaewRoute[]; highlightIds?: string[] }) {
  const { t } = useTranslation()
  const highlightSet = highlightIds ? new Set(highlightIds) : null
  const displayRoutes = highlightSet ? routes.filter((r) => highlightSet.has(r.id)) : routes

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
  highlightRouteIds,
  boardingPosition,
  alightingPosition,
  originPosition,
  transferPosition,
  className = '',
}: {
  routes: SongthaewRoute[]
  highlightRouteId?: string
  highlightRouteIds?: string[]
  boardingPosition?: LatLng
  alightingPosition?: LatLng
  originPosition?: LatLng
  transferPosition?: LatLng
  className?: string
}) {
  const effectiveIds = useMemo(() => {
    if (highlightRouteIds && highlightRouteIds.length > 0) return highlightRouteIds
    if (highlightRouteId) return [highlightRouteId]
    return undefined
  }, [highlightRouteId, highlightRouteIds])

  const center = useMemo(() => {
    if (effectiveIds && effectiveIds.length > 0) {
      const route = routes.find((r) => r.id === effectiveIds[0])
      if (route && route.path.length > 0) {
        const avgLat = route.path.reduce((s, p) => s + p.lat, 0) / route.path.length
        const avgLng = route.path.reduce((s, p) => s + p.lng, 0) / route.path.length
        return { lat: avgLat, lng: avgLng }
      }
    }
    return PATTAYA_CENTER
  }, [routes, effectiveIds])

  const fitPoints = useMemo(() => {
    const pts: LatLng[] = []
    if (originPosition) pts.push(originPosition)
    if (boardingPosition) pts.push(boardingPosition)
    if (transferPosition) pts.push(transferPosition)
    if (alightingPosition) pts.push(alightingPosition)
    return pts
  }, [originPosition, boardingPosition, transferPosition, alightingPosition])

  if (!API_KEY) {
    return (
      <div className={className}>
        <StaticMapFallback routes={routes} highlightIds={effectiveIds} />
      </div>
    )
  }

  return (
    <div className={className}>
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={effectiveIds ? 14 : 13}
          mapId="ten-baht-ride-map"
          className="w-full h-full rounded-xl overflow-hidden"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          <RoutePolylines routes={routes} highlightIds={effectiveIds} />
          <TripMarkers
            origin={originPosition}
            boarding={boardingPosition}
            alighting={alightingPosition}
            transfer={transferPosition}
          />
          {fitPoints.length >= 2 && <FitBoundsController points={fitPoints} />}
        </Map>
      </APIProvider>
    </div>
  )
}

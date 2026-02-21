import type { LatLng, RouteStop, SongthaewRoute, RidingAdvice } from '@/types'

const toRadians = (deg: number) => (deg * Math.PI) / 180

export const haversineDistance = (a: LatLng, b: LatLng): number => {
  const R = 6371000
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const findNearestStop = (position: LatLng, stops: RouteStop[]): { stop: RouteStop; distance: number } =>
  stops.reduce(
    (best, stop) => {
      const d = haversineDistance(position, stop.position)
      return d < best.distance ? { stop, distance: d } : best
    },
    { stop: stops[0], distance: Infinity },
  )

export const findBestRoute = (destination: LatLng, routes: SongthaewRoute[]): RidingAdvice | null => {
  const MAX_WALKING_DISTANCE = 1500

  const candidates = routes
    .map((route) => {
      const nearest = findNearestStop(destination, route.stops)
      return { route, nearest }
    })
    .filter((c) => c.nearest.distance <= MAX_WALKING_DISTANCE)
    .sort((a, b) => a.nearest.distance - b.nearest.distance)

  if (candidates.length === 0) return null

  const best = candidates[0]
  const { route } = best
  const alightingStop = best.nearest.stop

  const boardingStop = route.stops.find((s) => s.isMainStop && s.id !== alightingStop.id) ?? route.stops[0]

  return {
    routeId: route.id,
    routeNameKey: route.nameKey,
    boardingStop,
    alightingStop,
    price: route.price,
    tips: [],
    tipKeys: ['tips.pressButton', 'tips.haveChange', 'tips.payWhenExit', 'tips.checkDirection'],
  }
}

export const PATTAYA_CENTER: LatLng = { lat: 12.9336, lng: 100.8825 }

export const PATTAYA_BOUNDS = {
  north: 12.975,
  south: 12.885,
  east: 100.920,
  west: 100.860,
}

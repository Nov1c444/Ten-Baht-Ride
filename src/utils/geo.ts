import type { LatLng, RouteStop, SongthaewRoute, RidingAdvice, TripSegment, TripAdvice } from '@/types'

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

// Project a point onto a line segment, return the closest point on segment and its distance
const projectOntoSegment = (
  point: LatLng,
  segA: LatLng,
  segB: LatLng,
): { closest: LatLng; distance: number } => {
  const dx = segB.lng - segA.lng
  const dy = segB.lat - segA.lat
  const lenSq = dx * dx + dy * dy

  if (lenSq === 0) return { closest: segA, distance: haversineDistance(point, segA) }

  const t = Math.max(0, Math.min(1, ((point.lng - segA.lng) * dx + (point.lat - segA.lat) * dy) / lenSq))
  const closest = { lat: segA.lat + t * dy, lng: segA.lng + t * dx }
  return { closest, distance: haversineDistance(point, closest) }
}

// Find the minimum distance from a point to the route path (polyline)
const distanceToPath = (position: LatLng, path: LatLng[]): number => {
  let minDist = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    const { distance } = projectOntoSegment(position, path[i], path[i + 1])
    if (distance < minDist) minDist = distance
  }
  return minDist
}

const findNearestStop = (position: LatLng, stops: RouteStop[]): { stop: RouteStop; distance: number } =>
  stops.reduce(
    (best, stop) => {
      const d = haversineDistance(position, stop.position)
      return d < best.distance ? { stop, distance: d } : best
    },
    { stop: stops[0], distance: Infinity },
  )

const DEFAULT_TIP_KEYS = ['tips.pressButton', 'tips.haveChange', 'tips.payWhenExit', 'tips.checkDirection']
const MAX_WALKING_DISTANCE = 1500
const TRANSFER_PROXIMITY = 300

export const findBestRoute = (destination: LatLng, routes: SongthaewRoute[]): RidingAdvice | null => {
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
    tipKeys: DEFAULT_TIP_KEYS,
  }
}

const findTransferPoints = (
  routeA: SongthaewRoute,
  routeB: SongthaewRoute,
): { stopA: RouteStop; stopB: RouteStop; distance: number }[] =>
  routeA.stops.flatMap((stopA) =>
    routeB.stops
      .map((stopB) => ({ stopA, stopB, distance: haversineDistance(stopA.position, stopB.position) }))
      .filter((pair) => pair.distance <= TRANSFER_PROXIMITY),
  )

/**
 * Evaluate how well a route serves a given position.
 * Uses path-based proximity: the walking distance is to the nearest point on the route path,
 * but the recommended stop is the nearest named stop (landmark the user can recognize).
 */
const evaluateRouteForPosition = (
  position: LatLng,
  route: SongthaewRoute,
): { walkDistance: number; stop: RouteStop; reachable: boolean } => {
  const pathDist = distanceToPath(position, route.path)
  const { stop } = findNearestStop(position, route.stops)
  return {
    walkDistance: Math.round(Math.min(pathDist, haversineDistance(position, stop.position))),
    stop,
    reachable: pathDist <= MAX_WALKING_DISTANCE,
  }
}

const buildDirectCandidates = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice[] =>
  routes
    .map((route) => {
      const boarding = evaluateRouteForPosition(origin, route)
      const alighting = evaluateRouteForPosition(destination, route)
      if (!boarding.reachable || !alighting.reachable) return null
      if (boarding.stop.id === alighting.stop.id) return null

      const segment: TripSegment = {
        routeId: route.id,
        routeNameKey: route.nameKey,
        routeColor: route.color,
        boardingStop: boarding.stop,
        alightingStop: alighting.stop,
        price: route.price,
      }
      return {
        segments: [segment],
        totalPrice: route.price,
        walkToBoard: boarding.walkDistance,
        walkFromAlight: alighting.walkDistance,
        originPosition: origin,
        destinationPosition: destination,
        tipKeys: DEFAULT_TIP_KEYS,
      } satisfies TripAdvice
    })
    .filter((c): c is TripAdvice => c !== null)

const buildTransferCandidates = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice[] =>
  routes.flatMap((routeA, i) =>
    routes.slice(i + 1).flatMap((routeB) => {
      const transfers = findTransferPoints(routeA, routeB)
      if (transfers.length === 0) return []

      return transfers.flatMap(({ stopA, stopB }) => {
        const options: TripAdvice[] = []

        for (const [first, second, firstStop, secondStop] of [
          [routeA, routeB, stopA, stopB],
          [routeB, routeA, stopB, stopA],
        ] as [SongthaewRoute, SongthaewRoute, RouteStop, RouteStop][]) {
          const boarding = evaluateRouteForPosition(origin, first)
          const alighting = evaluateRouteForPosition(destination, second)

          if (!boarding.reachable || !alighting.reachable) continue
          if (boarding.stop.id === firstStop.id && alighting.stop.id === secondStop.id) continue

          const seg1: TripSegment = {
            routeId: first.id,
            routeNameKey: first.nameKey,
            routeColor: first.color,
            boardingStop: boarding.stop,
            alightingStop: firstStop,
            price: first.price,
          }
          const seg2: TripSegment = {
            routeId: second.id,
            routeNameKey: second.nameKey,
            routeColor: second.color,
            boardingStop: secondStop,
            alightingStop: alighting.stop,
            price: second.price,
          }

          options.push({
            segments: [seg1, seg2],
            totalPrice: first.price + second.price,
            walkToBoard: boarding.walkDistance,
            walkFromAlight: alighting.walkDistance,
            originPosition: origin,
            destinationPosition: destination,
            tipKeys: DEFAULT_TIP_KEYS,
          })
        }
        return options
      })
    }),
  )

export const planTrip = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice | null => {
  const directs = buildDirectCandidates(origin, destination, routes)
  const transfers = buildTransferCandidates(origin, destination, routes)

  const all = [
    ...directs.map((c) => ({ ...c, priority: 0 })),
    ...transfers.map((c) => ({ ...c, priority: 1 })),
  ].sort((a, b) => a.priority - b.priority || (a.walkToBoard + a.walkFromAlight) - (b.walkToBoard + b.walkFromAlight))

  return all[0] ?? null
}

export const PATTAYA_CENTER: LatLng = { lat: 12.9336, lng: 100.8825 }

export const PATTAYA_BOUNDS = {
  north: 12.975,
  south: 12.885,
  east: 100.920,
  west: 100.860,
}

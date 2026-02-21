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

// Find transfer points: stops on different routes that are at the same location or within TRANSFER_PROXIMITY
const findTransferPoints = (
  routeA: SongthaewRoute,
  routeB: SongthaewRoute,
): { stopA: RouteStop; stopB: RouteStop; distance: number }[] =>
  routeA.stops.flatMap((stopA) =>
    routeB.stops
      .map((stopB) => ({ stopA, stopB, distance: haversineDistance(stopA.position, stopB.position) }))
      .filter((pair) => pair.distance <= TRANSFER_PROXIMITY),
  )

const buildDirectCandidates = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice[] =>
  routes
    .map((route) => {
      const boarding = findNearestStop(origin, route.stops)
      const alighting = findNearestStop(destination, route.stops)
      if (boarding.distance > MAX_WALKING_DISTANCE || alighting.distance > MAX_WALKING_DISTANCE) return null
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
        walkToBoard: Math.round(boarding.distance),
        walkFromAlight: Math.round(alighting.distance),
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

      // Try both directions: A→transfer→B and B→transfer→A
      return transfers.flatMap(({ stopA, stopB }) => {
        const options: TripAdvice[] = []

        for (const [first, second, firstStop, secondStop] of [
          [routeA, routeB, stopA, stopB],
          [routeB, routeA, stopB, stopA],
        ] as [SongthaewRoute, SongthaewRoute, RouteStop, RouteStop][]) {
          const boarding = findNearestStop(origin, first.stops)
          const alighting = findNearestStop(destination, second.stops)

          if (boarding.distance > MAX_WALKING_DISTANCE || alighting.distance > MAX_WALKING_DISTANCE) continue
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
            walkToBoard: Math.round(boarding.distance),
            walkFromAlight: Math.round(alighting.distance),
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

import type { LatLng, SongthaewRoute, TripSegment, TripAdvice } from '@/types'
import { bahtBusStops } from '@/data/routes'

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

const distanceToPath = (position: LatLng, path: LatLng[]): number => {
  let minDist = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    const { distance } = projectOntoSegment(position, path[i], path[i + 1])
    if (distance < minDist) minDist = distance
  }
  return minDist
}

export interface BahtBusStop {
  id: string
  name: string
  position: LatLng
}

const findNearestBahtBusStop = (position: LatLng): { stop: BahtBusStop; distance: number } =>
  bahtBusStops.reduce(
    (best, stop) => {
      const d = haversineDistance(position, stop.position)
      return d < best.distance ? { stop, distance: d } : best
    },
    { stop: bahtBusStops[0], distance: Infinity },
  )

const findNearestStopOnRoute = (
  position: LatLng,
  routePath: LatLng[],
  maxStopToRouteDistance = 500,
): { stop: BahtBusStop; walkDistance: number } | null => {
  const candidates = bahtBusStops
    .map((stop) => ({
      stop,
      walkDistance: haversineDistance(position, stop.position),
      distToRoute: distanceToPath(stop.position, routePath),
    }))
    .filter((c) => c.distToRoute <= maxStopToRouteDistance)
    .sort((a, b) => a.walkDistance - b.walkDistance)

  return candidates[0] ? { stop: candidates[0].stop, walkDistance: Math.round(candidates[0].walkDistance) } : null
}

const DEFAULT_TIP_KEYS = ['tips.pressButton', 'tips.haveChange', 'tips.payWhenExit', 'tips.checkDirection']

// Street walking is ~1.4x straight-line distance in urban grids.
const WALKING_FACTOR = 1.4

// Max realistic walking for tourists in Pattaya heat (street distance).
const MAX_WALKING_DISTANCE = 1000

const TRANSFER_PENALTY_METERS = 400
const TRANSFER_PROXIMITY = 500

interface RouteEval {
  pathWalk: number
  stop: BahtBusStop
}

const evaluateRouteForPosition = (
  position: LatLng,
  route: SongthaewRoute,
): RouteEval | null => {
  const pathDist = distanceToPath(position, route.path)
  const estimatedWalk = Math.round(pathDist * WALKING_FACTOR)
  if (estimatedWalk > MAX_WALKING_DISTANCE) return null

  const stopOnRoute = findNearestStopOnRoute(position, route.path)
  if (stopOnRoute) {
    return { pathWalk: estimatedWalk, stop: stopOnRoute.stop }
  }

  const nearest = findNearestBahtBusStop(position)
  return { pathWalk: estimatedWalk, stop: nearest.stop }
}

const toRouteStop = (stop: BahtBusStop) => ({
  id: stop.id,
  name: stop.name,
  nameKey: `bahtBusStops.${stop.id}`,
  position: stop.position,
  isMainStop: true,
})

const buildDirectCandidates = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice[] =>
  routes
    .map((route) => {
      const boarding = evaluateRouteForPosition(origin, route)
      const alighting = evaluateRouteForPosition(destination, route)
      if (!boarding || !alighting) return null
      if (boarding.stop.id === alighting.stop.id) return null

      const segment: TripSegment = {
        routeId: route.id,
        routeNameKey: route.nameKey,
        routeColor: route.color,
        boardingStop: toRouteStop(boarding.stop),
        alightingStop: toRouteStop(alighting.stop),
        price: route.price,
      }
      return {
        segments: [segment],
        totalPrice: route.price,
        walkToBoard: boarding.pathWalk,
        walkFromAlight: alighting.pathWalk,
        originPosition: origin,
        destinationPosition: destination,
        tipKeys: DEFAULT_TIP_KEYS,
      } satisfies TripAdvice
    })
    .filter((c): c is TripAdvice => c !== null)

const findTransferStops = (
  routeA: SongthaewRoute,
  routeB: SongthaewRoute,
): { stop: BahtBusStop; distA: number; distB: number }[] =>
  bahtBusStops
    .map((stop) => ({
      stop,
      distA: distanceToPath(stop.position, routeA.path),
      distB: distanceToPath(stop.position, routeB.path),
    }))
    .filter((c) => c.distA <= TRANSFER_PROXIMITY && c.distB <= TRANSFER_PROXIMITY)

const buildTransferCandidates = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice[] =>
  routes.flatMap((routeA, i) =>
    routes.slice(i + 1).flatMap((routeB) => {
      const transferStops = findTransferStops(routeA, routeB)
      if (transferStops.length === 0) return []

      return transferStops.flatMap(({ stop: transferStop }) => {
        const options: TripAdvice[] = []

        for (const [first, second] of [
          [routeA, routeB],
          [routeB, routeA],
        ] as [SongthaewRoute, SongthaewRoute][]) {
          const boarding = evaluateRouteForPosition(origin, first)
          const alighting = evaluateRouteForPosition(destination, second)
          if (!boarding || !alighting) continue

          const transferRouteStop = toRouteStop(transferStop)

          const seg1: TripSegment = {
            routeId: first.id,
            routeNameKey: first.nameKey,
            routeColor: first.color,
            boardingStop: toRouteStop(boarding.stop),
            alightingStop: transferRouteStop,
            price: first.price,
          }
          const seg2: TripSegment = {
            routeId: second.id,
            routeNameKey: second.nameKey,
            routeColor: second.color,
            boardingStop: transferRouteStop,
            alightingStop: toRouteStop(alighting.stop),
            price: second.price,
          }

          options.push({
            segments: [seg1, seg2],
            totalPrice: first.price + second.price,
            walkToBoard: boarding.pathWalk,
            walkFromAlight: alighting.pathWalk,
            originPosition: origin,
            destinationPosition: destination,
            tipKeys: DEFAULT_TIP_KEYS,
          })
        }
        return options
      })
    }),
  )

// Rank by total "cost" = walking distance + transfer penalty.
// This means a transfer that saves >400m walking beats a direct route.
const tripCost = (t: TripAdvice) =>
  t.walkToBoard + t.walkFromAlight + (t.segments.length - 1) * TRANSFER_PENALTY_METERS

export const planTrip = (
  origin: LatLng,
  destination: LatLng,
  routes: SongthaewRoute[],
): TripAdvice | null => {
  const directs = buildDirectCandidates(origin, destination, routes)
  const transfers = buildTransferCandidates(origin, destination, routes)

  const all = [...directs, ...transfers].sort((a, b) => tripCost(a) - tripCost(b))
  return all[0] ?? null
}

export const PATTAYA_CENTER: LatLng = { lat: 12.9336, lng: 100.8825 }

export const PATTAYA_BOUNDS = {
  north: 12.975,
  south: 12.885,
  east: 100.920,
  west: 100.860,
}

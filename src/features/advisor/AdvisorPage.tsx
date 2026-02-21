import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { routes } from '@/data/routes'
import { planTrip } from '@/utils/geo'
import type { TripAdvice, LatLng } from '@/types'
import RouteMap from '@/components/Map/RouteMap'
import LocationSearch from '@/components/LocationSearch/LocationSearch'

const POPULAR_DESTINATIONS = [
  { label: 'Walking Street', position: { lat: 12.917461, lng: 100.8952667 } },
  { label: 'Central Festival', position: { lat: 12.9324242, lng: 100.8986652 } },
  { label: 'Jomtien (South end)', position: { lat: 12.9090573, lng: 100.8950447 } },
  { label: 'Bali Hai Pier / 3rd Road', position: { lat: 12.9344475, lng: 100.8921487 } },
]

const POPULAR_ORIGINS = [
  { label: 'Dolphin Circle', position: { lat: 12.95094, lng: 100.88882 } },
  { label: 'Central Festival', position: { lat: 12.9324242, lng: 100.8986652 } },
  { label: 'Walking Street', position: { lat: 12.917461, lng: 100.8952667 } },
  { label: 'Sukhumvit (Central Pattaya Rd)', position: { lat: 12.9365228, lng: 100.8869766 } },
]

type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable'

export default function AdvisorPage() {
  const { t } = useTranslation()

  const [originQuery, setOriginQuery] = useState('')
  const [destQuery, setDestQuery] = useState('')
  const [originPos, setOriginPos] = useState<LatLng | null>(null)
  const [destPos, setDestPos] = useState<LatLng | null>(null)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [trip, setTrip] = useState<TripAdvice | null>(null)
  const [searched, setSearched] = useState(false)

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setOriginPos(loc)
        setOriginQuery(t('advisor.useMyLocation'))
        setGeoStatus('success')
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [t])

  const handlePlanTrip = useCallback(() => {
    if (!originPos || !destPos) {
      setTrip(null)
      setSearched(true)
      return
    }
    const result = planTrip(originPos, destPos, routes)
    setTrip(result)
    setSearched(true)
  }, [originPos, destPos])

  const handleOriginQuickPick = useCallback((label: string, position: LatLng) => {
    setOriginQuery(label)
    setOriginPos(position)
  }, [])

  const handleDestQuickPick = useCallback((label: string, position: LatLng) => {
    setDestQuery(label)
    setDestPos(position)
  }, [])

  const handleOriginChange = useCallback((v: string) => { setOriginQuery(v); setOriginPos(null) }, [])
  const handleOriginSelect = useCallback((label: string, pos: LatLng) => { setOriginQuery(label); setOriginPos(pos) }, [])
  const handleDestChange = useCallback((v: string) => { setDestQuery(v); setDestPos(null) }, [])
  const handleDestSelect = useCallback((label: string, pos: LatLng) => { setDestQuery(label); setDestPos(pos) }, [])

  const originIcon = useMemo(() => <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>, [])
  const destIcon = useMemo(() => <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>, [])

  const highlightRouteIds = trip ? trip.segments.map((s) => s.routeId) : undefined
  const firstSegment = trip?.segments[0]
  const lastSegment = trip?.segments[trip.segments.length - 1]
  const transferPos = trip && trip.segments.length > 1
    ? trip.segments[0].alightingStop.position
    : undefined

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('advisor.title')}</h2>
        <p className="text-gray-500 mt-1">{t('advisor.subtitle2')}</p>
      </div>

      {/* Search panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Origin */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('advisor.originLabel')}</label>
            <div className="flex gap-2">
              <LocationSearch
                value={originQuery}
                onChange={handleOriginChange}
                onSelect={handleOriginSelect}
                placeholder={t('advisor.originPlaceholder')}
                icon={originIcon}
                className="flex-1"
              />
              <button
                onClick={handleLocate}
                disabled={geoStatus === 'loading'}
                className="px-2.5 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shrink-0 disabled:opacity-50"
                title={t('advisor.useMyLocation')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            {geoStatus === 'denied' && <p className="text-xs text-red-500 mt-1">{t('advisor.locationDenied')}</p>}
            {geoStatus === 'unavailable' && <p className="text-xs text-red-500 mt-1">{t('advisor.locationUnavailable')}</p>}
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">{t('advisor.destinationLabel')}</label>
            <LocationSearch
              value={destQuery}
              onChange={handleDestChange}
              onSelect={handleDestSelect}
              placeholder={t('advisor.inputPlaceholder')}
              icon={destIcon}
            />
          </div>
        </div>

        <button
          onClick={handlePlanTrip}
          disabled={!originPos || !destPos}
          className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('advisor.planTrip')}
        </button>
        {(!originPos || !destPos) && (originQuery || destQuery) && (
          <p className="text-xs text-amber-600 text-center">{t('advisor.selectFromList')}</p>
        )}
      </div>

      {/* Quick picks (before search) */}
      {!searched && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">{t('advisor.originLabel')}</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ORIGINS.map((o) => (
                <button
                  key={o.label}
                  onClick={() => handleOriginQuickPick(o.label, o.position)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">{t('advisor.popularDestinations')}</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest.label}
                  onClick={() => handleDestQuickPick(dest.label, dest.position)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded-lg text-xs border border-gray-200 hover:border-primary-200 transition-colors"
                >
                  {dest.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map — always visible, full width */}
      <RouteMap
        routes={routes}
        highlightRouteIds={highlightRouteIds}
        originPosition={trip?.originPosition}
        destinationPosition={trip?.destinationPosition}
        boardingPosition={firstSegment?.boardingStop.position}
        alightingPosition={lastSegment?.alightingStop.position}
        transferPosition={transferPos}
        className="h-[300px] sm:h-[450px] lg:h-[500px]"
      />

      {/* Map legend when trip is active */}
      {searched && trip && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {[
            { label: 'O', desc: 'Origin', color: '#2563eb' },
            { label: 'B', desc: t('advisor.boardAt'), color: '#16a34a' },
            ...(transferPos ? [{ label: 'T', desc: t('advisor.transferAt'), color: '#eab308' }] : []),
            { label: 'A', desc: t('advisor.alightAt'), color: '#dc2626' },
            { label: 'D', desc: 'Destination', color: '#7c3aed' },
          ].map((m) => (
            <span key={m.label} className="flex items-center gap-1.5">
              <span
                className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: m.color }}
              >
                {m.label}
              </span>
              {m.desc}
            </span>
          ))}
        </div>
      )}

      {/* Trip result details */}
      {searched && trip && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Route timeline */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trip.segments.length === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {trip.segments.length === 1 ? t('advisor.directRoute') : t('advisor.transferRoute')}
                </span>
                <span className="text-sm text-gray-500">
                  {trip.segments.map((s) => t(s.routeNameKey)).join(' \u2192 ')}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-0">
              {trip.walkToBoard > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-400 py-1.5">
                  <div className="w-8 flex justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span>{t('advisor.walkDistance', { distance: trip.walkToBoard })}</span>
                </div>
              )}

              {trip.segments.map((segment, idx) => (
                <div key={`${segment.routeId}-${idx}`}>
                  <div className="flex items-start gap-3 py-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${idx === 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <span className={`font-bold text-sm ${idx === 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {idx === 0 ? 'B' : 'T'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">
                        {idx === 0 ? t('advisor.boardAt') : t('advisor.transferAt')}
                      </p>
                      <p className="font-medium text-gray-900 text-sm">{segment.boardingStop.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1.5 ml-4">
                    <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: segment.routeColor }} />
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.routeColor }} />
                      <span className="text-xs font-medium" style={{ color: segment.routeColor }}>
                        {t(segment.routeNameKey)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {segment.price} {t('common.thb')}
                      </span>
                    </div>
                  </div>

                  {idx === trip.segments.length - 1 && (
                    <div className="flex items-start gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <span className="text-red-700 font-bold text-sm">A</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('advisor.alightAt')}</p>
                        <p className="font-medium text-gray-900 text-sm">{segment.alightingStop.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {trip.walkFromAlight > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-400 py-1.5">
                  <div className="w-8 flex justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span>{t('advisor.walkDistance', { distance: trip.walkFromAlight })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price + Tips */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="bg-accent-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{t('advisor.totalPrice')}</p>
                <p className="text-3xl font-bold text-accent-600">
                  {trip.totalPrice} {t('common.thb')}
                  <span className="text-sm font-normal text-gray-500 ml-2">{t('common.perPerson')}</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('advisor.tips')}</h4>
              <ul className="space-y-1.5">
                {trip.tipKeys.map((tipKey) => (
                  <li key={tipKey} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t(tipKey)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !trip && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-4xl mb-3">&#x1F6D1;</div>
          <p className="text-gray-600">{t('advisor.noResults')}</p>
        </div>
      )}
    </div>
  )
}

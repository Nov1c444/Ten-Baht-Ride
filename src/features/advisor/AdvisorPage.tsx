import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { routes } from '@/data/routes'
import { planTrip } from '@/utils/geo'
import type { TripAdvice, LatLng } from '@/types'
import RouteMap from '@/components/Map/RouteMap'
import LocationSearch from '@/components/LocationSearch/LocationSearch'

const POPULAR_DESTINATIONS = [
  { nameKey: 'stops.walkingStreet', position: { lat: 12.9260, lng: 100.8860 } },
  { nameKey: 'stops.centralFestival', position: { lat: 12.9350, lng: 100.8780 } },
  { nameKey: 'stops.jomtienBeachCentral', position: { lat: 12.9060, lng: 100.8810 } },
  { nameKey: 'stops.sanctuaryOfTruth', position: { lat: 12.9580, lng: 100.8840 } },
  { nameKey: 'stops.tukCom', position: { lat: 12.9300, lng: 100.8790 } },
  { nameKey: 'stops.nakluaMarket', position: { lat: 12.9620, lng: 100.8850 } },
]

const POPULAR_ORIGINS = [
  { nameKey: 'stops.dolphinRoundabout', position: { lat: 12.9467, lng: 100.8828 } },
  { nameKey: 'stops.centralPattayaBeach', position: { lat: 12.9400, lng: 100.8840 } },
  { nameKey: 'stops.walkingStreet', position: { lat: 12.9260, lng: 100.8860 } },
  { nameKey: 'stops.centralFestival', position: { lat: 12.9350, lng: 100.8780 } },
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

  const handleOriginQuickPick = useCallback((nameKey: string, position: LatLng) => {
    setOriginQuery(t(nameKey))
    setOriginPos(position)
  }, [t])

  const handleDestQuickPick = useCallback((nameKey: string, position: LatLng) => {
    setDestQuery(t(nameKey))
    setDestPos(position)
  }, [t])

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('advisor.title')}</h2>
        <p className="text-gray-500 mt-1">{t('advisor.subtitle2')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5 space-y-4">
          {/* Origin + Destination inputs */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
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
                  className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {geoStatus === 'loading' ? t('advisor.locating') : t('advisor.useMyLocation')}
                </button>
              </div>
              {geoStatus === 'denied' && (
                <p className="text-xs text-red-500 mt-1">{t('advisor.locationDenied')}</p>
              )}
              {geoStatus === 'unavailable' && (
                <p className="text-xs text-red-500 mt-1">{t('advisor.locationUnavailable')}</p>
              )}
            </div>

            {/* Connector line */}
            <div className="flex items-center pl-5">
              <div className="w-px h-4 bg-gray-300" />
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

            <button
              onClick={handlePlanTrip}
              className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              {t('advisor.planTrip')}
            </button>
          </div>

          {/* Quick picks when not yet searched */}
          {!searched && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{t('advisor.originLabel')}</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_ORIGINS.map((o) => (
                    <button
                      key={o.nameKey}
                      onClick={() => handleOriginQuickPick(o.nameKey, o.position)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs border border-blue-200 hover:border-blue-300 transition-colors"
                    >
                      {t(o.nameKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{t('advisor.popularDestinations')}</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <button
                      key={dest.nameKey}
                      onClick={() => handleDestQuickPick(dest.nameKey, dest.position)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded-lg text-xs border border-gray-200 hover:border-primary-200 transition-colors"
                    >
                      {t(dest.nameKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trip result */}
          {searched && trip && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Header badge */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trip.segments.length === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {trip.segments.length === 1 ? t('advisor.directRoute') : t('advisor.transferRoute')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {trip.segments.map((s) => t(s.routeNameKey)).join(' → ')}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 space-y-0">
                {/* Walk to board */}
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
                    {/* Boarding stop */}
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
                        <p className="font-medium text-gray-900 text-sm">{t(segment.boardingStop.nameKey)}</p>
                      </div>
                    </div>

                    {/* Route segment line */}
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

                    {/* Alighting stop (only for last segment) */}
                    {idx === trip.segments.length - 1 && (
                      <div className="flex items-start gap-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <span className="text-red-700 font-bold text-sm">A</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('advisor.alightAt')}</p>
                          <p className="font-medium text-gray-900 text-sm">{t(segment.alightingStop.nameKey)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Walk from alight */}
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

              {/* Total price */}
              <div className="border-t border-gray-100 p-4">
                <div className="bg-accent-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">{t('advisor.totalPrice')}</p>
                  <p className="text-2xl font-bold text-accent-600">
                    {trip.totalPrice} {t('common.thb')}
                    <span className="text-sm font-normal text-gray-500 ml-2">{t('common.perPerson')}</span>
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="border-t border-gray-100 p-4">
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
          )}

          {/* No results */}
          {searched && !trip && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="text-4xl mb-3">&#x1F6D1;</div>
              <p className="text-gray-600">{t('advisor.noResults')}</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:w-3/5">
          <div className="sticky top-20">
            <RouteMap
              routes={routes}
              highlightRouteIds={highlightRouteIds}
              originPosition={trip?.originPosition}
              boardingPosition={firstSegment?.boardingStop.position}
              alightingPosition={lastSegment?.alightingStop.position}
              transferPosition={transferPos}
              className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-8rem)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

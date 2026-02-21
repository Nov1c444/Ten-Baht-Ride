import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { routes } from '@/data/routes'
import { findBestRoute } from '@/utils/geo'
import type { RidingAdvice, LatLng } from '@/types'
import RouteMap from '@/components/Map/RouteMap'

const POPULAR_DESTINATIONS = [
  { nameKey: 'stops.walkingStreet', position: { lat: 12.9260, lng: 100.8860 } },
  { nameKey: 'stops.centralFestival', position: { lat: 12.9350, lng: 100.8780 } },
  { nameKey: 'stops.jomtienBeachCentral', position: { lat: 12.9060, lng: 100.8810 } },
  { nameKey: 'stops.sanctuaryOfTruth', position: { lat: 12.9580, lng: 100.8840 } },
  { nameKey: 'stops.tukCom', position: { lat: 12.9300, lng: 100.8790 } },
  { nameKey: 'stops.nakluaMarket', position: { lat: 12.9620, lng: 100.8850 } },
]

export default function AdvisorPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [advice, setAdvice] = useState<RidingAdvice | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback((position: LatLng) => {
    const result = findBestRoute(position, routes)
    setAdvice(result)
    setSearched(true)
  }, [])

  const handleTextSearch = useCallback(() => {
    if (!query.trim()) return

    const normalizedQuery = query.toLowerCase()
    const allStops = routes.flatMap((route) =>
      route.stops.map((stop) => ({ ...stop, routeId: route.id })),
    )

    const matched = allStops.find(
      (stop) =>
        stop.name.toLowerCase().includes(normalizedQuery) ||
        t(stop.nameKey).toLowerCase().includes(normalizedQuery),
    )

    if (matched) {
      handleSearch(matched.position)
    } else {
      setAdvice(null)
      setSearched(true)
    }
  }, [query, handleSearch, t])

  const handlePopularClick = useCallback(
    (nameKey: string, position: LatLng) => {
      setQuery(t(nameKey))
      handleSearch(position)
    },
    [handleSearch, t],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTextSearch()
  }

  const adviceRoute = advice ? routes.find((r) => r.id === advice.routeId) : undefined

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('advisor.title')}</h2>
        <p className="text-gray-500 mt-1">{t('advisor.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('advisor.inputPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleTextSearch}
                className="px-5 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shrink-0"
              >
                {t('advisor.searchButton')}
              </button>
            </div>
          </div>

          {!searched && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('advisor.popularDestinations')}</h3>
              <p className="text-sm text-gray-500 mb-3">{t('advisor.trySearching')}</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.nameKey}
                    onClick={() => handlePopularClick(dest.nameKey, dest.position)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 rounded-lg text-sm border border-gray-200 hover:border-primary-200 transition-colors"
                  >
                    {t(dest.nameKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searched && advice && adviceRoute && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-100" style={{ backgroundColor: `${adviceRoute.color}10` }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: adviceRoute.color }} />
                  <h3 className="font-semibold text-gray-900">{t('advisor.results')}</h3>
                </div>
                <p className="text-lg font-bold mt-1" style={{ color: adviceRoute.color }}>
                  {t(advice.routeNameKey)}
                </p>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-700 font-bold text-sm">B</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('advisor.boardAt')}</p>
                    <p className="font-medium text-gray-900">{t(advice.boardingStop.nameKey)}</p>
                  </div>
                </div>

                <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4" />

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-700 font-bold text-sm">A</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('advisor.alightAt')}</p>
                    <p className="font-medium text-gray-900">{t(advice.alightingStop.nameKey)}</p>
                  </div>
                </div>

                <div className="bg-accent-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">{t('advisor.estimatedPrice')}</p>
                  <p className="text-2xl font-bold text-accent-600">
                    {advice.price} {t('common.thb')}
                    <span className="text-sm font-normal text-gray-500 ml-2">{t('common.perPerson')}</span>
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('advisor.tips')}</h4>
                  <ul className="space-y-1.5">
                    {advice.tipKeys.map((tipKey) => (
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

          {searched && !advice && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="text-4xl mb-3">&#x1F6D1;</div>
              <p className="text-gray-600">{t('advisor.noResults')}</p>
            </div>
          )}
        </div>

        <div className="lg:w-3/5">
          <div className="sticky top-20">
            <RouteMap
              routes={routes}
              highlightRouteId={advice?.routeId}
              boardingPosition={advice?.boardingStop.position}
              alightingPosition={advice?.alightingStop.position}
              className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-8rem)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

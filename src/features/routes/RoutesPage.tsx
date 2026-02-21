import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { routes } from '@/data/routes'
import RouteMap from '@/components/Map/RouteMap'

export default function RoutesPage() {
  const { t } = useTranslation()
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(undefined)

  const selectedRoute = selectedRouteId ? routes.find((r) => r.id === selectedRouteId) : undefined

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('routes.title')}</h2>
        <p className="text-gray-500 mt-1">{t('routes.selectRoute')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5 space-y-3 order-2 lg:order-1">
          <button
            onClick={() => setSelectedRouteId(undefined)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              !selectedRouteId
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="font-semibold text-gray-900">{t('routes.allRoutes')}</span>
            <span className="text-sm text-gray-500 ml-2">{routes.length} {t('routes.stops').toLowerCase()}</span>
          </button>

          {routes.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                selectedRouteId === route.id
                  ? 'border-primary-500 bg-white shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: route.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{t(route.nameKey)}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{t(route.descriptionKey)}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {route.operatingHours}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {route.price} {t('common.thb')}
                    </span>
                    <span>{route.frequency}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:w-3/5 order-1 lg:order-2">
          <div className="sticky top-20">
            <RouteMap
              routes={routes}
              highlightRouteId={selectedRouteId}
              className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-8rem)]"
            />

            {selectedRoute && (
              <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedRoute.color }} />
                  <h3 className="font-semibold">{t(selectedRoute.nameKey)}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">{t(selectedRoute.priceNoteKey ?? '')}</p>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('routes.mainStops')}</h4>
                <div className="space-y-1.5">
                  {selectedRoute.stops
                    .filter((s) => s.isMainStop)
                    .map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-2 text-sm">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-2.5 h-2.5 rounded-full border-2"
                            style={{ borderColor: selectedRoute.color }}
                          />
                          {i < selectedRoute.stops.filter((s) => s.isMainStop).length - 1 && (
                            <div className="w-0.5 h-4" style={{ backgroundColor: selectedRoute.color, opacity: 0.3 }} />
                          )}
                        </div>
                        <span className="text-gray-700">{t(stop.nameKey)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

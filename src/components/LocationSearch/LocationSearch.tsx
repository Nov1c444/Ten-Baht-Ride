import { useState, useEffect, useRef, useCallback } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useTranslation } from 'react-i18next'
import { routes } from '@/data/routes'
import { PATTAYA_BOUNDS } from '@/utils/geo'
import type { LatLng } from '@/types'

export interface LocationSuggestion {
  id: string
  label: string
  sublabel?: string
  position?: LatLng
  placeId?: string
  source: 'stop' | 'places'
}

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect: (label: string, position: LatLng) => void
  placeholder: string
  icon: React.ReactNode
  className?: string
}

const ALL_STOPS = routes.flatMap((route) =>
  route.stops.map((stop) => ({
    id: stop.id,
    name: stop.name,
    nameKey: stop.nameKey,
    position: stop.position,
    routeNameKey: route.nameKey,
  })),
)

// Dedupe stops at the same position (e.g. Dolphin Roundabout appears on multiple routes)
const UNIQUE_STOPS = ALL_STOPS.filter(
  (stop, idx, arr) => arr.findIndex((s) => s.name === stop.name) === idx,
)

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export default function LocationSearch({
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
  className = '',
}: LocationSearchProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [localResults, setLocalResults] = useState<LocationSuggestion[]>([])
  const [placesResults, setPlacesResults] = useState<LocationSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const placesLib = useMapsLibrary('places')
  const geocodingLib = useMapsLibrary('geocoding')
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    if (placesLib && !autocompleteService.current) {
      autocompleteService.current = new placesLib.AutocompleteService()
    }
  }, [placesLib])

  useEffect(() => {
    if (geocodingLib && !geocoder.current) {
      geocoder.current = new geocodingLib.Geocoder()
    }
  }, [geocodingLib])

  const debouncedQuery = useDebounce(value, 300)

  // Local stop search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setLocalResults([])
      return
    }
    const q = debouncedQuery.toLowerCase()
    const matches = UNIQUE_STOPS.filter(
      (stop) =>
        stop.name.toLowerCase().includes(q) ||
        t(stop.nameKey).toLowerCase().includes(q),
    )
      .slice(0, 5)
      .map((stop) => ({
        id: `stop-${stop.id}`,
        label: t(stop.nameKey),
        sublabel: t(stop.routeNameKey),
        position: stop.position,
        source: 'stop' as const,
      }))
    setLocalResults(matches)
  }, [debouncedQuery, t])

  // Google Places search
  useEffect(() => {
    if (!debouncedQuery.trim() || !autocompleteService.current) {
      setPlacesResults([])
      return
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: debouncedQuery,
        locationBias: {
          north: PATTAYA_BOUNDS.north,
          south: PATTAYA_BOUNDS.south,
          east: PATTAYA_BOUNDS.east,
          west: PATTAYA_BOUNDS.west,
        },
        language: t('common.thb') === 'THB' ? 'en' : undefined,
      },
      (predictions) => {
        if (!predictions) {
          setPlacesResults([])
          return
        }
        setPlacesResults(
          predictions.slice(0, 4).map((p) => ({
            id: `place-${p.place_id}`,
            label: p.structured_formatting.main_text,
            sublabel: p.structured_formatting.secondary_text,
            placeId: p.place_id,
            source: 'places' as const,
          })),
        )
      },
    )
  }, [debouncedQuery, t])

  const allSuggestions = [...localResults, ...placesResults]

  useEffect(() => {
    if (allSuggestions.length > 0 && value.trim()) {
      setOpen(true)
    }
  }, [allSuggestions.length, value])

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1)
  }, [localResults, placesResults])

  const resolveAndSelect = useCallback(
    (suggestion: LocationSuggestion) => {
      if (suggestion.position) {
        onSelect(suggestion.label, suggestion.position)
        setOpen(false)
        return
      }

      // Geocode the place to get coordinates
      if (suggestion.placeId && geocoder.current) {
        geocoder.current.geocode({ placeId: suggestion.placeId }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location
            onSelect(suggestion.label, { lat: loc.lat(), lng: loc.lng() })
          }
          setOpen(false)
        })
      }
    },
    [onSelect],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || allSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < allSuggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allSuggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      resolveAndSelect(allSuggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => allSuggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoComplete="off"
        />
      </div>

      {open && allSuggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {localResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                {t('advisor.stopResults')}
              </div>
              {localResults.map((s, i) => (
                <button
                  key={s.id}
                  onMouseDown={() => resolveAndSelect(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${activeIndex === i ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                >
                  <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{s.label}</p>
                    {s.sublabel && <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>}
                  </div>
                </button>
              ))}
            </>
          )}

          {placesResults.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-t border-gray-100">
                {t('advisor.placesResults')}
              </div>
              {placesResults.map((s, rawIdx) => {
                const idx = localResults.length + rawIdx
                return (
                  <button
                    key={s.id}
                    onMouseDown={() => resolveAndSelect(s)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${activeIndex === idx ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                  >
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{s.label}</p>
                      {s.sublabel && <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

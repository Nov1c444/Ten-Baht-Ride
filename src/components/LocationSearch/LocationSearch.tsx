import { useState, useEffect, useRef, useCallback } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { PATTAYA_BOUNDS } from '@/utils/geo'
import type { LatLng } from '@/types'

interface Suggestion {
  id: string
  label: string
  sublabel?: string
  position?: LatLng
  placeId?: string
}

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect: (label: string, position: LatLng) => void
  placeholder: string
  icon: React.ReactNode
  className?: string
}

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
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasFocusRef = useRef(false)

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

  useEffect(() => {
    if (!debouncedQuery.trim() || !autocompleteService.current) {
      setSuggestions([])
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
      },
      (predictions) => {
        if (!predictions) {
          setSuggestions([])
          return
        }
        setSuggestions(
          predictions.slice(0, 6).map((p) => ({
            id: p.place_id,
            label: p.structured_formatting.main_text,
            sublabel: p.structured_formatting.secondary_text,
            placeId: p.place_id,
          })),
        )
      },
    )
  }, [debouncedQuery])

  useEffect(() => {
    if (hasFocusRef.current && suggestions.length > 0 && value.trim()) {
      setOpen(true)
    } else if (suggestions.length === 0) {
      setOpen(false)
    }
  }, [suggestions, value])

  useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  const resolveAndSelect = useCallback(
    (s: Suggestion) => {
      setOpen(false)

      if (s.position) {
        onSelect(s.label, s.position)
        return
      }

      if (s.placeId && geocoder.current) {
        geocoder.current.geocode({ placeId: s.placeId }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location
            onSelect(s.label, { lat: loc.lat(), lng: loc.lng() })
          }
        })
      }
    },
    [onSelect],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      resolveAndSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        hasFocusRef.current = false
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
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            hasFocusRef.current = true
            if (suggestions.length > 0 && value.trim()) setOpen(true)
          }}
          onBlur={() => { hasFocusRef.current = false }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoComplete="off"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); resolveAndSelect(s) }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${activeIndex === i ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{s.label}</p>
                {s.sublabel && <p className="text-xs text-gray-400 truncate">{s.sublabel}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

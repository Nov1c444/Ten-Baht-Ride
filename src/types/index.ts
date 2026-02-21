export interface LatLng {
  lat: number
  lng: number
}

export interface RouteStop {
  id: string
  name: string
  nameKey: string
  position: LatLng
  isMainStop: boolean
  landmarks?: string[]
  landmarkKeys?: string[]
}

export interface SongthaewRoute {
  id: string
  nameKey: string
  color: string
  descriptionKey: string
  price: number
  priceNote?: string
  priceNoteKey?: string
  path: LatLng[]
  stops: RouteStop[]
  operatingHours: string
  frequency: string
}

export interface RidingAdvice {
  routeId: string
  routeNameKey: string
  boardingStop: RouteStop
  alightingStop: RouteStop
  price: number
  tips: string[]
  tipKeys: string[]
}

export type SupportedLanguage = 'en' | 'zh-CN' | 'zh-TW' | 'th' | 'ko' | 'ja' | 'ru'

export interface LanguageOption {
  code: SupportedLanguage
  label: string
  flag: string
}

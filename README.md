# Ten Baht Ride 🚐

[中文版](./README.zh-CN.md)

An interactive ride guide for Pattaya's Songthaew (shared minibus) — a pure frontend web app.

> The Songthaew is the most common public transport in Pattaya, nicknamed "Ten Baht Ride" for its fixed-route fare of just 10 THB.

## Features

### 1. Route Display
- Shows major fixed Songthaew routes in Pattaya (Circular, Jomtien, Naklua, etc.)
- Visualizes routes, key stops, and landmarks on Google Maps
- Displays fare info (fixed route 10 THB / charter price reference)

### 2. Responsive Design
- Mobile-first, optimized for portrait phone browsing
- Adaptive desktop layout that makes full use of larger screens

### 3. Smart Ride Advisor
Users enter a destination (hotel, mall, attraction) and the system provides:
- **Recommended Route** — which Songthaew line to take
- **Boarding Point** — where to hail the ride (marked on map)
- **Alighting Point** — where to ring the bell to get off (marked on map)
- **Fare Estimate** — expected cost
- **Tips** — when to ring the bell, things to note

Destination input integrates Google Places Autocomplete for fuzzy search of hotels, attractions, malls, etc.

### 4. Internationalization (i18n)
Multi-language support covering major tourist groups:

| Language | Code | Note |
|----------|------|------|
| English | `en` | Default |
| 中文（简体） | `zh-CN` | Simplified Chinese |
| 中文（繁體） | `zh-TW` | Traditional Chinese |
| ภาษาไทย | `th` | Thai |
| 한국어 | `ko` | Korean |
| 日本語 | `ja` | Japanese |
| Русский | `ru` | Russian |

- Auto-detects browser language preference
- Users can manually switch languages; selection persisted to localStorage
- Route names, stop names, ride tips, etc. are all localized

## Tech Stack

| Category | Choice |
|----------|--------|
| Framework | React 19 |
| Build | Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Maps | Google Maps JavaScript API + @vis.gl/react-google-maps |
| Places Search | Google Places API (Autocomplete) |
| i18n | i18next + react-i18next |
| Deployment | Vercel / Cloudflare Pages |

## Google Maps API Setup

This project depends on the following Google Maps Platform APIs:

| API | Purpose |
|-----|---------|
| Maps JavaScript API | Map rendering, route drawing |
| Places API (New) | Place autocomplete, place details |
| Geocoding API | Address resolution (optional) |

### Getting an API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the APIs above
3. Create an API Key with recommended restrictions:
   - **Application restriction**: HTTP referrers (your domain)
   - **API restriction**: Only enable the 3 APIs above
4. Create `.env.local` in the project root:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

> ⚠️ Note: Google Maps API includes a free tier ($200 monthly credit), which is usually sufficient for personal projects. See [Pricing](https://developers.google.com/maps/billing-and-pricing/pricing).

## Data Sources

Route and stop data is static JSON, compiled from:
- Actual Pattaya Songthaew operating routes (2024–2025)
- Major routes:
  - **Circular Route**: Beach Road southbound → U-turn at Walking Street → Second Road northbound, 10 THB
  - **Jomtien Line**: City center → Jomtien Beach, ~10–20 THB
  - **Naklua Line**: City center → Naklua / Wongamat, ~10 THB
  - **Sukhumvit Line**: Along Sukhumvit Road

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in your Google Maps API Key

# Start dev server
npm run dev

# Production build
npm run build
```

## Project Structure

```
Ten-Baht-Ride/
├── public/
│   └── data/                # Static route data (JSON)
├── src/
│   ├── components/          # Shared UI components
│   │   ├── Map/             # Map component
│   │   ├── LanguageSwitcher/# Language switcher
│   │   └── Layout/          # Layout components
│   ├── features/
│   │   ├── routes/          # Route display feature
│   │   └── advisor/         # Ride advisor feature
│   ├── data/                # Routes, stops, landmarks data
│   ├── i18n/
│   │   ├── index.ts         # i18next initialization
│   │   └── locales/
│   │       ├── en.json      # English
│   │       ├── zh-CN.json   # Simplified Chinese
│   │       ├── zh-TW.json   # Traditional Chinese
│   │       ├── th.json      # Thai
│   │       ├── ko.json      # Korean
│   │       ├── ja.json      # Japanese
│   │       └── ru.json      # Russian
│   ├── hooks/               # Custom Hooks
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx
│   └── main.tsx
├── .env.example             # Environment variable template
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## License

MIT

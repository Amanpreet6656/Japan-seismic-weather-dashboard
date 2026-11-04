# Japan Safe & Weather Insights (JSWI)

A lightweight, client-side web application for real-time earthquake tracking, local weather monitoring, and emergency preparedness in Japan.

Built with standard HTML5, CSS3, and Vanilla JavaScript (ES2026). No frameworks, no bundlers, and no API keys required.

---

## Overview

Japan regularly experiences earthquakes, typhoons, and intense summer heat waves. While Japanese public agencies and international services publish high-quality open data, that information is scattered across different portals or locked behind apps requiring user registration.

Japan Safe & Weather Insights (JSWI) brings these public data streams together into a single, reliable dashboard. The application runs entirely in the browser, loads quickly, uses free and keyless open APIs, and maintains essential functionality even on unstable network connections.

---

## 1. Project Architecture

The application is structured as a client-side single-page application divided into four distinct views. A lightweight Vanilla JavaScript router toggles visibility across these views while keeping navigation fast and responsive.

```
+---------------------------------------------------------------------------------------------------+
|                                        APPLICATION HEADER                                         |
|  [Brand] Japan Safe & Weather Insights | JMA Monitor Status | JST Clock | Theme Toggle: Dark/Light|
+---------------------------------------------------------------------------------------------------+
|  NAVIGATION: [Global Dashboard]  [Disaster Track & Prep]  [Travel Planner]  [Favorites Watchlist] |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  VIEW 1: GLOBAL DASHBOARD                                                                         |
|  +-----------------------+---------------------------------------+------------------------------+ |
|  | Column 1 (360px)      | Column 2 (Flexible)                   | Column 3 (380px)             | |
|  | Real-Time USGS feed   | Leaflet map (CARTO Positron Light)    | Local weather (Open-Meteo)   | |
|  | JMA Shindo estimates  | Subduction trench polyline overlays   | WBGT heat stress meter       | |
|  | Magnitude filtering   | Shockwave circles on epicenters       | 7-day forecast cards         | |
|  | Epicentral distance   | Weather overlay badge                 | Active JMA warning cards     | |
|  +-----------------------+---------------------------------------+------------------------------+ |
|                                                                                                   |
|  VIEW 2: DISASTER TRACK & PREP                                                                    |
|  +---------------------------------------------------------------------------------------------+  |
|  | Sub-tabs: Seismic Activity | Typhoon Radar | Evacuation Maps                                |  |
|  | - Live 360-degree radar sweep canvas with range rings and reflectivity echoes               |  |
|  | - Quick triage checklist (furniture bracing, go-bag essentials)                             |  |
|  | - Tokyo BCP 72-Hour Survival Kit with LocalStorage persistence and print stylesheet         |  |
|  | - Expandable accordions for the Cabinet Office 5-stage evacuation hierarchy                 |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  VIEW 3: TRAVEL TIMES PLANNER                                                                     |
|  +---------------------------------------------------------------------------------------------+  |
|  | - Dynamic 12-month calendar SVG area chart (Jan to Dec)                                     |  |
|  | - Monthly high/low temperature envelope (Optimal Green) vs. rainfall trend (Ocean Blue)     |  |
|  | - Interactive hover crosshairs with interpolated monthly metrics                            |  |
|  | - 12-month objective travel feasibility scoring matrix                                      |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  VIEW 4: FAVORITES WATCHLIST                                                                      |
|  +---------------------------------------------------------------------------------------------+  |
|  | - Responsive auto-fit grid (280px min cards) with Japanese Kanji headings                   |  |
|  | - Circular arc mini-gauges and linear progress indicators for instant hazard assessment     |  |
|  | - Saved cities persist in LocalStorage with parallel weather data fetching                  |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
|  FOOTER: Institutional Citations | Custom Domain Reservation | Privacy Policy | Terms of Service  |
+---------------------------------------------------------------------------------------------------+
```

### View Descriptions

1. **View 1: Global Dashboard (`#view-dashboard`)**
   A three-column operational layout designed for quick situation assessment. The left column lists recent earthquakes from the USGS feed, calculating the estimated shaking intensity for Japan. The center column displays an interactive Leaflet map featuring subduction trenches, epicenter markers with magnitude-scaled shockwave rings, and live weather overlays. The right column displays localized weather, active JMA hazard alerts, a heat illness risk meter, and a 7-day forecast.

2. **View 2: Disaster Track & Prep (`#view-disaster`)**
   A practical preparation center prioritizing high-contrast legibility. It includes a simulated Doppler radar canvas running at 60 fps, expandable civil defense guidance accordions, and an emergency supply checklist based on the official Tokyo Metropolitan Disaster Preparedness manual. Checked items persist in `LocalStorage`, and the view includes a print stylesheet formatted for physical binders.

3. **View 3: Travel Times Planner (`#view-planner`)**
   A climatological planning tool based on 30-year normative averages (1991 to 2020 JMA data). It features an interactive SVG area chart mapping temperature and precipitation across all twelve months, interactive vertex hover tooltips, seasonal recommendation badges, and a 12-month travel feasibility matrix.

4. **View 4: Favorites Watchlist (`#view-favorites`)**
   An auto-fit card grid for monitoring multiple prefectures. Each card shows the city name in English and Japanese Kanji, current temperature, composite risk level, and circular arc mini-gauges. Locations are stored in `LocalStorage` and updated concurrently when opened.

---

## 2. APIs Used

All four data integrations are 100% free, public, and open-source. They require no private API keys, authentication tokens, or rate-metered headers.

### 2.1 Open-Meteo Weather API
* **Endpoint:** `https://api.open-meteo.com/v1/forecast`
* **Query Parameters:** `models=jma_seamless`, `timezone=Asia/Tokyo`, `current=temperature_2m,relative_humidity_2m,weather_code`
* **Why the `jma_seamless` model matters:** Standard global forecast models (such as NOAA GFS) use coarse resolution grids (13 to 25 km), which smooth out Japan's steep mountains, volcanic ridges, and narrow coastal plains. In practice, this causes temperature errors of up to 4.5 degrees Celsius between coastal cities and nearby inland towns. By specifying `models=jma_seamless`, the application queries the Japan Meteorological Agency's local high-resolution models: the 5 km Meso-Scale Model (MSM) and the 2 km Local Forecast Model (LFM).
* **Coordinate Precision:** Coordinates passed to Open-Meteo are formatted to at least 4 decimal places (`toFixed(4)` or approximately 11 meters precision). This prevents coordinate rounding from snapping an observation point from a low-elevation city center up onto a mountain slope, which would distort temperature and lapse-rate calculations.
* **Fallback Strategy:** If the JMA seamless model is temporarily unreachable, the fetch handler gracefully falls back to Open-Meteo's standard best-match model, and finally to cached 30-year seasonal baselines.

### 2.2 USGS Real-Time Earthquake Hazards API
* **Endpoint:** `https://earthquake.usgs.gov/fdsnws/event/1/query`
* **Format:** GeoJSON
* **Geographic Bounding Box:** 24.0°N to 46.0°N, 122.0°E to 154.0°E (covering the Japanese archipelago from Okinawa to Hokkaido)
* **Parameters:** Minimum magnitude 2.5, sorted by origin time, limit 40 events
* **Update Interval:** Automatically polls every 60 seconds with on-demand manual refresh

### 2.3 Wolfx Open API (JMA Early Warning Mirror)
* **Primary Connection:** WebSocket (`wss://ws-api.wolfx.jp/jma_eew`)
* **Fallback Connection:** HTTPS Polling (`https://api.wolfx.jp/jma_eew.json`) every 30 seconds
* **Purpose:** Provides a reliable real-time mirror of official JMA Earthquake Early Warnings (EEW), capturing hypocenter names, estimated maximum seismic intensity, detection timestamps, and cancellation notices. If the WebSocket connection closes, the client falls back to the HTTP polling endpoint without dropping UI state.

### 2.4 OpenStreetMap Nominatim Geocoding
* **Endpoint:** `https://nominatim.openstreetmap.org/search`
* **Query Scope:** Constrained to Japan (`countrycodes=jp`)
* **Rate-Limit Compliance:** Implements a 400ms input debounce and an in-memory `Map` cache to respect Nominatim's acceptable use policy (maximum 1 request per second). A built-in dictionary of all 47 Japanese prefectures provides instant offline lookups if network requests fail.

---

## 3. Safety Utility

The platform integrates official emergency standards established by the Japanese Cabinet Office and the Tokyo Metropolitan Government.

### 3.1 Cabinet Office 5-Stage Evacuation Warning Hierarchy (警戒レベル)
Emergency notices follow the revised 2021 disaster warning scale:
* **Level 1 (Early Warning / 早期注意情報):** Maintain personal awareness and monitor meteorological forecasts.
* **Level 2 (Advisory / 大雨・洪水・高潮注意報):** Check evacuation routes, shelter locations, and personal emergency supplies.
* **Level 3 (Evacuate Vulnerable Persons / 高齢者等避難):** Elderly residents, people with mobility limitations, and families with young children evacuate to designated municipal shelters.
* **Level 4 (Evacuation Order / 避難指示):** All residents in designated hazard inundation zones must evacuate to safe areas.
* **Level 5 (Emergency Safety Assurance / 緊急安全確保):** Disaster is underway or imminent. Immediate life-saving action required (e.g., vertical evacuation to a higher floor or moving to a sturdy reinforced building).

### 3.2 Tokyo BCP 72-Hour Survival Framework
Following a major earthquake, public relief supplies typically require at least 72 hours to reach local distribution points. The checklist module is built around four core categories from the official *Disaster Preparedness Tokyo (東京防災)* handbook:
1. **Water and Nutrition:** 3 liters of potable water per person per day (minimum 9 liters per individual), alpha-rice rations, high-calorie emergency biscuits, and portable butane cassette stoves.
2. **Sanitation:** Emergency coagulant toilet bags (bousai toire) to safely isolate waste during water and sewer infrastructure outages.
3. **Power and Communications:** High-capacity power banks, portable hand-crank AM/FM emergency radios tuned to NHK Radio 1 (594 kHz Tokyo, 666 kHz Osaka), and 10-yen/100-yen coins for analog public payphones.
4. **Medical and Rescue:** Pressure bandages, N95/DS2 dust masks to protect against pulverized concrete debris, heavy work gloves, and high-decibel rescue whistles.

The checklist saves completion status directly to browser `LocalStorage`, supports custom item additions, and prints cleanly on standard paper for physical storage in an emergency bag.

---

## 4. Technical Details

### 4.1 CARTO Positron Light Map Tile Fix
Standard Leaflet implementations often default to `tile.openstreetmap.org`. However, OpenStreetMap public tile servers enforce strict user-agent and referrer policies that routinely return HTTP 403 Forbidden errors when loaded from localhost or unauthenticated browser sessions.

To solve this, JSWI uses CARTO Positron Light tiles:
```javascript
// Hardcoding CARTO Positron light tiles here to bypass OSM's strict 403 referrer blocks on localhost.
// CARTO Positron supports unauthenticated, open access across subdomains ['a', 'b', 'c', 'd']
// and maintains high-contrast, clean cartography regardless of the global UI theme.
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  subdomains: ['a', 'b', 'c', 'd'],
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19
}).addTo(mapInstance);
```

**Why the map stays in light mode:**
Dark mode map tiles usually require paid commercial API keys. Attempting to invert light tiles with CSS filters (`filter: invert(...)`) degrades text readability and reverses ocean bathymetry into land colors. JSWI hardcodes the map layer to light mode (`.leaflet-tile { filter: none !important; }`), ensuring that geographic coastlines and text remain clear whether the platform UI is set to Dark Mode or Light Mode.

### 4.2 Decoupled Event Handling and View Routing
The user interface avoids monolithic initialization scripts that freeze if an external API is slow or offline:
* **Immediate Control Binding:** Header buttons (`btn-dashboard`, `btn-disaster`, `btn-planner`, `btn-favorites`, and `btn-theme-toggle`) bind synchronously on `DOMContentLoaded` before any network calls run.
* **Isolated Subsystems:** Leaflet map rendering, USGS seismic polling, Open-Meteo requests, and the Wolfx EEW stream each run inside independent `try...catch` blocks. If an upstream network call fails, the other views and navigation buttons continue working normally.
* **Map Resizing on Tab Switch:** When navigating from a hidden tab back to the dashboard, Leaflet can miscalculate its container size because the element was set to `display: none`. The router calls `map.invalidateSize()` with a 60ms delay whenever the dashboard becomes visible again.

### 4.3 Dynamic Theming via CSS Custom Properties
The platform uses eight strict palette tokens:
* Midnight Dark: `#090B0E`
* Slate Panel: `#1A1F26`
* Pure White: `#FFFFFF`
* Light Canvas: `#F1F5F9`
* Critical Red: `#E11D48`
* Alert Amber: `#D97706`
* Optimal Green: `#10B981`
* Ocean Blue: `#3B82F6`

Both View 2 (Disaster Track & Prep) and View 4 (Favorites Watchlist) dynamically adapt to both Dark Mode and Light Mode through semantic CSS custom properties (`--view-bg`, `--view-panel-bg`, `--view-border`, `--view-text`, `--view-text-muted`). Switching themes does not require reloading the page or manipulating inline styles.

All buttons and inputs use sharp rectangular corners (2px to 4px border radius). Pill-shaped buttons, purple gradients, and custom cursor animations are strictly excluded.

### 4.4 Shindo Intensity Estimation (Midorikawa et al. 1999)
Earthquake alerts from the USGS provide magnitude ($M$) and focal depth ($H$), but do not provide the localized shaking intensity felt at ground level in Japan. JSWI calculates estimated JMA Shindo intensity using the empirical attenuation formula developed by Midorikawa et al. (1999).

First, the hypocentral distance ($R$ in kilometers) is calculated from the epicentral distance ($D_{\text{epi}}$) and focal depth ($H$):
$$R = \sqrt{D_{\text{epi}}^2 + H^2}$$

Next, Peak Ground Velocity ($PGV$ in cm/s) is estimated from magnitude and distance:
$$\log_{10}(PGV) = 0.58 \cdot M - 1.20 \cdot \log_{10}(R) - 0.002 \cdot R - 0.45$$

Peak Ground Velocity is then converted to the continuous JMA Instrumental Seismic Intensity scale ($I_{\text{JMA}}$):
$$I_{\text{JMA}} = 2.68 + 1.72 \cdot \log_{10}(PGV)$$

The resulting value is clamped between 0.0 and 7.0 and sorted into official JMA Shindo categories:
* $I < 0.5 \rightarrow \text{Shindo } 0$ (Imperceptible)
* $0.5 \le I < 1.5 \rightarrow \text{Shindo } 1$ (Slight)
* $1.5 \le I < 2.5 \rightarrow \text{Shindo } 2$ (Weak)
* $2.5 \le I < 3.5 \rightarrow \text{Shindo } 3$ (Moderate)
* $3.5 \le I < 4.5 \rightarrow \text{Shindo } 4$ (Strong)
* $4.5 \le I < 5.0 \rightarrow \text{Shindo } 5\text{-Lower}$ (Very Strong)
* $5.0 \le I < 5.5 \rightarrow \text{Shindo } 5\text{-Upper}$ (Severe)
* $5.5 \le I < 6.0 \rightarrow \text{Shindo } 6\text{-Lower}$ (Very Severe)
* $6.0 \le I < 6.5 \rightarrow \text{Shindo } 6\text{-Upper}$ (Destructive)
* $I \ge 6.5 \rightarrow \text{Shindo } 7$ (Maximum Destructive)

### 4.5 Wet Bulb Globe Temperature (WBGT) Calculation
High humidity during Japanese summers significantly increases heatstroke risk. To give users an accurate picture of outdoor heat stress, JSWI calculates the simplified Wet Bulb Globe Temperature (WBGT) based on guidelines from the Japanese Ministry of the Environment (MOE) and ISO 7243.

First, water vapor pressure ($e$ in hPa) is calculated using the Magnus-Tetens formula:
$$e = \left(\frac{RH}{100}\right) \cdot 6.105 \cdot \exp\left(\frac{17.27 \cdot T}{237.7 + T}\right)$$

where $T$ is temperature in degrees Celsius and $RH$ is relative humidity percentage.

Next, outdoor WBGT is computed as:
$$WBGT = 0.567 \cdot T + 0.393 \cdot e + 3.94$$

The value maps directly to safety advisory levels:
* **Under 25°C:** Safe / Low Risk (Standard awareness)
* **25°C to 28°C:** Caution (Stay hydrated during physical exertion)
* **28°C to 31°C:** Severe Warning (Take frequent breaks in shaded or air-conditioned areas)
* **31°C and above:** Danger (Avoid strenuous outdoor activity)

### 4.6 Seismic Wave Transit Velocity and Warning Window
When an offshore earthquake occurs, primary compressional waves ($P\text{-waves}$) travel faster than destructive shear waves ($S\text{-waves}$). The approximate crustal propagation speeds are:
* $P\text{-wave}: V_p \approx 6.0\text{ km/s}$
* $S\text{-wave}: V_s \approx 3.5\text{ km/s}$

The estimated warning buffer time ($\Delta t$) available before shear wave arrival at distance $D$ is:
$$\Delta t = D \left(\frac{1}{3.5} - \frac{1}{6.0}\right) \approx 0.119 \cdot D\text{ seconds}$$

This relationship illustrates why real-time early warning feeds are critical: an epicenter 100 km away provides roughly 12 seconds of warning before peak ground shaking arrives.

### 4.7 DOM Performance Optimization
* **DocumentFragment Batching:** When rendering lists of earthquake events or search results, DOM nodes are constructed off-screen in a `DocumentFragment` and inserted in a single operation, avoiding repeated layout recalculations.
* **Canvas Animation:** The Doppler radar sweep runs on an HTML5 `<canvas>` using `requestAnimationFrame`, rendering smooth 60 fps animations without adding or modifying DOM elements.

---

## 5. Directory Structure

```
disaster/
├── css/
│   └── styles.css        # Palette tokens, grid layouts, responsive breakpoints, print styles
├── js/
│   ├── api.js            # API orchestration (USGS, Open-Meteo, Wolfx, Nominatim), Shindo & WBGT math
│   ├── app.js            # Main controller, tab routing, theme toggle, radar canvas loop, JST clock
│   ├── charts.js         # SVG area charts, vertex crosshairs, tooltips, feasibility matrix
│   ├── checklist.js      # Tokyo BCP 72-Hour checklist, category filters, LocalStorage engine
│   ├── map.js            # Leaflet cartography, CARTO Positron tiles, subduction trench overlays
│   └── watchlist.js      # Auto-fit grid, Kanji typography, circular mini-gauges, storage sync
├── index.html            # Semantic HTML5 application shell and modal dialogs
└── README.md             # Project documentation and engineering specifications
```

---

## 6. Running Locally

The application runs as a static bundle with zero build steps or runtime dependencies. It can be served using any local web server:

```bash
# Using Node.js
npx serve .

# Using Python 3
python -m http.server 8080
```

Open `http://localhost:8080` in any modern browser (Chrome, Firefox, Safari, Edge).

---

## 7. References & Open Data Sources

1. **Japan Meteorological Agency (JMA / 気象庁):** Seismic intensity scale criteria, instrumental Shindo algorithms, and Emergency Warning System (Tokubetsu Keiho) guidelines.
2. **United States Geological Survey (USGS):** Earthquake Hazards Program, FDSN Web Services API.
3. **Midorikawa, S., Matsuoka, M., & Sakugawa, K. (1999):** *Site Effects on Strong Ground Motion in the 1995 Hyogo-ken Nanbu Earthquake*. Journal of Japan Society for Natural Disaster Science.
4. **Ministry of the Environment of Japan (MOE / 環境省):** Heat Illness Prevention Information System, Wet Bulb Globe Temperature (WBGT) calculation methodology.
5. **Tokyo Metropolitan Government (東京都総務局総合防災部):** *Disaster Preparedness Tokyo (東京防災 - Tokyo Bousai)*, Business Continuity Planning (BCP) 72-Hour Survival Framework.
6. **Open-Meteo:** Numerical weather prediction API, incorporating JMA Meso-Scale and Local Forecast models.
7. **OpenStreetMap Foundation & CARTO:** Nominatim geocoding service and CARTO Positron Light basemap tiles.

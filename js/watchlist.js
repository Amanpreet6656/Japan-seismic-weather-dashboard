
const Watchlist = (() => {
  const STORAGE_KEY = 'japan_safe_watchlist_cities_v1';

  const DEFAULT_CITIES = [
    { id: 'city-tokyo', name: 'Tokyo', pref: 'Tokyo Prefecture', lat: 35.6895, lon: 139.6917 },
    { id: 'city-osaka', name: 'Osaka', pref: 'Osaka Prefecture', lat: 34.6937, lon: 135.5023 },
    { id: 'city-kyoto', name: 'Kyoto', pref: 'Kyoto Prefecture', lat: 35.0116, lon: 135.7681 },
    { id: 'city-sapporo', name: 'Sapporo', pref: 'Hokkaido', lat: 43.0618, lon: 141.3545 },
    { id: 'city-fukuoka', name: 'Fukuoka', pref: 'Fukuoka Prefecture', lat: 33.5904, lon: 130.4017 }
  ];

  let watchedCities = [];
  let onInspectCityCallback = null;

    function init(inspectCallback) {
    onInspectCityCallback = inspectCallback;
    loadWatchedCities();
    renderWatchlistGrid();
    setupWatchlistEvents();
  }

  function loadWatchedCities() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        watchedCities = JSON.parse(stored);
      } else {
        watchedCities = [...DEFAULT_CITIES];
      }
    } catch (e) {
      console.warn('LocalStorage access restricted. Utilizing defaults:', e);
      watchedCities = [...DEFAULT_CITIES];
    }
  }

  function saveWatchedCities() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedCities));
    } catch (e) {
      console.error('Failed to save watchlist to LocalStorage:', e);
    }
  }

  async function renderWatchlistGrid() {
    const gridContainer = document.getElementById('watchlist-cards-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--color-light-muted); font-family: var(--font-mono);">
        SYNCHRONIZING NUMERICAL WEATHER TELEMETRY ACROSS MONITORED PREFECTURES...
      </div>
    `;

    const weatherPromises = watchedCities.map(city => API.fetchOpenMeteoWeather(city.lat, city.lon));
    const results = await Promise.allSettled(weatherPromises);

    gridContainer.innerHTML = '';

    watchedCities.forEach((city, index) => {
      const weatherRes = results[index];
      const weatherData = weatherRes.status === 'fulfilled' ? weatherRes.value : null;

      const card = createCityWatchCard(city, weatherData);
      gridContainer.appendChild(card);
    });

    const totalEl = document.getElementById('watchlist-total-count');
    if (totalEl) totalEl.textContent = `${watchedCities.length} Saved Locations`;
  }

  const KANJI_MAP = {
    'tokyo': '東京',
    'osaka': '大阪',
    'kyoto': '京都',
    'sapporo': '札幌',
    'fukuoka': '福岡',
    'naha': '那覇',
    'sendai': '仙台',
    'hiroshima': '広島',
    'kanazawa': '金沢',
    'nagano': '長野'
  };

  function createCityWatchCard(city, weather) {
    const card = document.createElement('div');
    card.className = 'watch-city-card';
    card.dataset.cityId = city.id;

    const tempStr = weather ? `${weather.temp}°C` : '--';
    const conditionStr = weather ? weather.conditionText : 'Telemetry Standby';
    const wbgt = weather ? weather.wbgt : { wbgt: 20, stage: 'Safe', score: 25, levelClass: 'fill-green' };
    const wind = weather ? weather.windRisk : { text: 'Calm', score: 10, fillClass: 'fill-green' };
    const precip = weather ? weather.precipRisk : { text: 'None', score: 0, fillClass: 'fill-green' };
    const composite = weather ? weather.compositeHazard : { score: 15, level: { label: 'OPTIMAL', class: 'norm' } };

    const cityKey = city.name.toLowerCase().replace(/[^a-z]/g, '');
    const kanji = KANJI_MAP[cityKey] || '';

    let riskText = 'Low Risk - Safe to visit';
    let riskColor = '#10B981';
    let dotClass = 'green';
    let arcDashoffset = 75; // out of 100

    if (composite.score >= 50 || (weather && weather.precip >= 15)) {
      riskText = 'Evacuation Prep Warning';
      riskColor = '#E11D48';
      dotClass = 'red';
      arcDashoffset = 15;
    } else if (composite.score >= 30 || (weather && weather.precip >= 4)) {
      riskText = 'Heavy Rain Advisory';
      riskColor = '#D97706';
      dotClass = 'amber';
      arcDashoffset = 45;
    } else if (weather && weather.temp <= 0) {
      riskText = 'Heavy Snow - Normal';
      riskColor = '#3B82F6';
      dotClass = 'blue';
      arcDashoffset = 60;
    }

    card.innerHTML = `
      <div class="watch-card-header">
        <div class="watch-title-group">
          <span class="activity-dot ${dotClass}"></span>
          <span class="watch-city-name">${city.name}</span>
          ${kanji ? `<span class="watch-city-kanji">${kanji}</span>` : ''}
          <svg class="watch-star-icon" viewBox="0 0 24 24" width="13" height="13" fill="#D97706">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <button class="action-btn btn-sm btn-remove-city" title="Remove from Watchlist" style="background: transparent; border: none; color: #94A3B8; cursor: pointer; padding: 2px;">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="watch-card-body">
        <div class="watch-temp-overview">
          <div class="watch-temp-val">${tempStr}</div>
          <div class="watch-risk-indicator" style="color: ${riskColor};">
            ${conditionStr} · ${riskText}
          </div>
        </div>

        <div class="mini-arc-gauge-container">
          <svg viewBox="0 0 50 50" class="mini-arc-svg" width="46" height="46">
            <circle cx="25" cy="25" r="19" fill="none" stroke="currentColor" stroke-width="4" class="arc-bg-track" />
            <circle cx="25" cy="25" r="19" fill="none" stroke="${riskColor}" stroke-width="4"
                    stroke-dasharray="119" stroke-dashoffset="${arcDashoffset}" stroke-linecap="square" class="arc-val-stroke" />
          </svg>
          <span class="mini-arc-score" style="color: ${riskColor};">${composite.score}</span>
        </div>

        <div class="watch-gauges-list">
          <div class="mini-gauge-group">
            <div class="mini-gauge-label-row">
              <span>Heatstroke Risk (WBGT)</span>
              <span class="mini-gauge-val-str">${wbgt.wbgt}°C (${wbgt.stage})</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${wbgt.levelClass}" style="width: ${wbgt.score}%;"></div>
            </div>
          </div>

          <div class="mini-gauge-group">
            <div class="mini-gauge-label-row">
              <span>Inundation Threat</span>
              <span class="mini-gauge-val-str">${weather ? weather.precip : 0} mm/h (${precip.text})</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${precip.fillClass}" style="width: ${precip.score}%;"></div>
            </div>
          </div>

          <div class="mini-gauge-group">
            <div class="mini-gauge-label-row">
              <span>Wind / Gale Impact</span>
              <span class="mini-gauge-val-str">${weather ? weather.windSpeed : 0} km/h (${wind.text})</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${wind.fillClass}" style="width: ${wind.score}%;"></div>
            </div>
          </div>

          <div class="mini-gauge-group">
            <div class="mini-gauge-label-row">
              <span>Composite Multi-Hazard</span>
              <span class="mini-gauge-val-str">${composite.score}/100 [${composite.level.label}]</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${composite.score >= 50 ? 'fill-red' : composite.score >= 30 ? 'fill-amber' : 'fill-green'}" style="width: ${composite.score}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="watch-card-footer">
        <span style="font-family: var(--font-mono); font-size: 10px; color: var(--color-light-muted);">
          ${city.lat.toFixed(2)}°N, ${city.lon.toFixed(2)}°E
        </span>
        <button class="action-btn btn-sm btn-inspect-dash" style="background-color: var(--color-slate-panel); color: var(--color-pure-white); border-color: var(--color-slate-border);">
          Inspect on Dashboard
        </button>
      </div>
    `;

    const removeBtn = card.querySelector('.btn-remove-city');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCity(city.id);
    });

    const inspectBtn = card.querySelector('.btn-inspect-dash');
    inspectBtn.addEventListener('click', () => {
      if (typeof onInspectCityCallback === 'function') {
        onInspectCityCallback(city);
      }
    });

    return card;
  }

  function removeCity(id) {
    watchedCities = watchedCities.filter(c => c.id !== id);
    saveWatchedCities();
    renderWatchlistGrid();
  }

  function addCity(cityObj) {
    const exists = watchedCities.some(c => c.name.toLowerCase() === cityObj.name.toLowerCase());
    if (exists) {
      alert(`${cityObj.name} is already registered in your Watchlist.`);
      return;
    }

    watchedCities.unshift({
      id: `city-${Date.now()}`,
      name: cityObj.name,
      pref: cityObj.pref || cityObj.displayName || 'Japan',
      lat: cityObj.lat,
      lon: cityObj.lon
    });

    saveWatchedCities();
    renderWatchlistGrid();
  }

  let watchlistEventsBound = false;

  function setupWatchlistEvents() {
    if (watchlistEventsBound) return;
    watchlistEventsBound = true;

    const addForm = document.getElementById('watchlist-add-form');
    const searchInput = document.getElementById('watchlist-search-input');

    if (addForm && searchInput) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        try {
          const results = await API.geocodeLocation(query);
          if (results && results.length > 0) {
            const match = results[0];
            addCity({
              name: match.name,
              pref: match.displayName,
              lat: match.lat,
              lon: match.lon
            });
            searchInput.value = '';
          } else {
            alert(`No geocoded coordinates found for: "${query}". Please check the spelling.`);
          }
        } catch (geoErr) {
          console.warn('Watchlist geocoding failed:', geoErr);
        }
      });
    }

    const presetSelect = document.getElementById('watchlist-preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', () => {
        const val = presetSelect.value;
        if (!val || !API.PREFECTURES[val]) return;

        const p = API.PREFECTURES[val];
        addCity({
          name: p.name.split(' ')[0],
          pref: p.pref,
          lat: p.lat,
          lon: p.lon
        });
        presetSelect.value = '';
      });
    }
  }

  return {
    init,
    addCity,
    renderWatchlistGrid
  };
})();

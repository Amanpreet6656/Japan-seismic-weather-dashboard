
function bootWhenReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fn();
      if (typeof MapEngine !== 'undefined' && MapEngine.invalidateSize) {
        MapEngine.invalidateSize();
      }
    });
  } else {
    fn();
    if (typeof MapEngine !== 'undefined' && MapEngine.invalidateSize) {
      setTimeout(() => MapEngine.invalidateSize(), 50);
    }
  }
}

bootWhenReady(() => {
  const AppState = {
    activeView: 'dashboard',
    currentLocation: {
      name: 'Tokyo (東京)',
      pref: 'Tokyo',
      lat: 35.6895,
      lon: 139.6917
    },
    seismicFeed: [],
    seismicFilter: 'all',
    currentWeather: null,
    eewClient: null,
    pollTimerId: null,
    searchDebounceTimer: null
  };

  initApp();

  async function initApp() {
    try {
      initClock();
    } catch (err) {
      console.warn('Clock initialization notice:', err);
    }

    try {
      initGlobalTheme();
    } catch (err) {
      console.warn('Theme initialization notice:', err);
    }

    bindHeaderAndThemeControls();

    try {
      setupModals();
    } catch (err) {
      console.warn('Modals setup notice:', err);
    }

    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    switchView(initialHash);

    try {
      setupDashboardControls();
    } catch (err) {
      console.warn('Dashboard controls setup notice:', err);
    }

    try {
      MapEngine.initMap('map-viewport', (evt) => {
        openSeismicForensicModal(evt);
      });
      setTimeout(() => {
        if (typeof MapEngine !== 'undefined' && MapEngine.invalidateSize) {
          MapEngine.invalidateSize();
        }
      }, 150);
    } catch (err) {
      console.error('Leaflet MapEngine initialization failed gracefully:', err);
    }

    try {
      ChartsEngine.initCharts('tokyo');
    } catch (err) {
      console.warn('ChartsEngine initialization failed gracefully:', err);
    }

    try {
      DisasterPrep.init();
    } catch (err) {
      console.warn('DisasterPrep initialization failed gracefully:', err);
    }

    try {
      initRadarFeed();
      setupPrepSubNav();
    } catch (err) {
      console.warn('RadarFeed initialization failed gracefully:', err);
    }

    try {
      Watchlist.init((city) => {
        switchView('dashboard');
        setLocation(city.lat, city.lon, city.name);
      });
    } catch (err) {
      console.warn('Watchlist initialization failed gracefully:', err);
    }

    try {
      initWolfxEew();
    } catch (err) {
      console.warn('Wolfx EEW stream initialization notice:', err);
    }

    try {
      await refreshSeismicData();
    } catch (err) {
      console.warn('Initial USGS seismic sync failed gracefully:', err);
    }

    try {
      await refreshWeatherData();
    } catch (err) {
      console.warn('Initial Open-Meteo weather sync failed gracefully:', err);
    }

    try {
      if (AppState.pollTimerId) clearInterval(AppState.pollTimerId);
      AppState.pollTimerId = setInterval(() => {
        refreshSeismicData().catch(err => {
          console.warn('USGS periodic polling notice:', err);
        });
      }, 60000);
    } catch (err) {
      console.warn('Polling daemon setup notice:', err);
    }
  }

  function switchView(target) {
    let normalized = target;
    if (target === 'disaster-prep') normalized = 'disaster';
    if (target === 'watchlist') normalized = 'favorites';
    if (!['dashboard', 'disaster', 'planner', 'favorites'].includes(normalized)) {
      normalized = 'dashboard';
    }

    AppState.activeView = normalized;

    const viewContainers = {
      dashboard: document.getElementById('view-dashboard'),
      disaster: document.getElementById('view-disaster'),
      planner: document.getElementById('view-planner'),
      favorites: document.getElementById('view-favorites')
    };

    const navButtons = {
      dashboard: document.getElementById('btn-dashboard'),
      disaster: document.getElementById('btn-disaster'),
      planner: document.getElementById('btn-planner'),
      favorites: document.getElementById('btn-favorites')
    };

    Object.keys(viewContainers).forEach(key => {
      const container = viewContainers[key];
      const button = navButtons[key];
      const isTarget = key === normalized;

      if (container) {
        if (isTarget) {
          container.classList.remove('hidden');
          container.classList.add('active');
        } else {
          container.classList.add('hidden');
          container.classList.remove('active');
        }
      }

      if (button) {
        if (isTarget) {
          button.classList.add('active');
          button.setAttribute('aria-selected', 'true');
        } else {
          button.classList.remove('active');
          button.setAttribute('aria-selected', 'false');
        }
      }
    });

    try {
      history.replaceState(null, '', `#${normalized}`);
    } catch (e) {
    }

    if (normalized === 'dashboard') {
      setTimeout(() => {
        try {
          if (typeof MapEngine !== 'undefined' && MapEngine.resize) {
            MapEngine.resize();
          }
        } catch (mapErr) {
          console.warn('Map resize notice on view switch:', mapErr);
        }
      }, 60);
    } else if (normalized === 'disaster') {
      try {
        if (typeof resumeRadarAnimation === 'function') {
          resumeRadarAnimation();
        }
      } catch (radarErr) {
        console.warn('Radar animation resume notice on view switch:', radarErr);
      }
    } else if (normalized === 'planner') {
      try {
        if (typeof ChartsEngine !== 'undefined' && ChartsEngine.initCharts) {
          ChartsEngine.initCharts(getSelectedPrefectureKey());
        }
      } catch (chartErr) {
        console.warn('Charts hydration notice on view switch:', chartErr);
      }
    } else if (normalized === 'favorites') {
      try {
        if (typeof Watchlist !== 'undefined' && Watchlist.renderWatchlistGrid) {
          Watchlist.renderWatchlistGrid();
        }
      } catch (watchErr) {
        console.warn('Watchlist render notice on view switch:', watchErr);
      }
    }
  }

  function navigateToView(viewId) {
    switchView(viewId);
  }

  
  function bindHeaderAndThemeControls() {
    const btnDashboard = document.getElementById('btn-dashboard');
    if (btnDashboard) {
      btnDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard');
      });
    }

    const btnDisaster = document.getElementById('btn-disaster');
    if (btnDisaster) {
      btnDisaster.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('disaster');
      });
    }

    const btnPlanner = document.getElementById('btn-planner');
    if (btnPlanner) {
      btnPlanner.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('planner');
      });
    }

    const btnFavorites = document.getElementById('btn-favorites');
    if (btnFavorites) {
      btnFavorites.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('favorites');
      });
    }

    const btnThemeToggle = document.getElementById('btn-theme-toggle') || document.getElementById('global-theme-toggle');
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleGlobalTheme();
      });
    }

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) switchView(hash);
    });
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem('japan_safe_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.className = `theme-${theme}`;

    try {
      localStorage.setItem('japan_safe_theme', theme);
    } catch (e) {
    }

    const darkIcon = document.getElementById('theme-icon-dark');
    const lightIcon = document.getElementById('theme-icon-light');
    const themeText = document.getElementById('theme-toggle-text');

    if (theme === 'light') {
      if (darkIcon) darkIcon.style.display = 'none';
      if (lightIcon) lightIcon.style.display = 'block';
      if (themeText) themeText.textContent = 'LIGHT MODE';
    } else {
      if (darkIcon) darkIcon.style.display = 'block';
      if (lightIcon) lightIcon.style.display = 'none';
      if (themeText) themeText.textContent = 'DARK MODE';
    }
  }

  function toggleGlobalTheme() {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  function initGlobalTheme() {
    const saved = getSavedTheme();
    applyTheme(saved);
  }

  function getSelectedPrefectureKey() {
    const sel = document.getElementById('planner-pref-select');
    return sel ? sel.value : 'tokyo';
  }

  
  function initWolfxEew() {
    if (AppState.eewClient && typeof AppState.eewClient.destroy === 'function') {
      AppState.eewClient.destroy();
    }
    AppState.eewClient = new API.WolfxEewClient((eewAlert) => {
      handleLiveEewAlert(eewAlert);
    });
  }

  let lastEewAlert = null;

  function handleLiveEewAlert(alert) {
    lastEewAlert = alert;
    const banner = document.getElementById('hud-warning-banner');
    if (alert.isWarn && !alert.isCancel) {
      if (banner) {
        banner.style.display = 'block';
        banner.style.cursor = 'pointer';
        banner.title = 'Click to view Emergency Alert Card';
        banner.innerHTML = `
          <strong>JMA EARTHQUAKE EARLY WARNING:</strong> ${alert.hypocenter} (Estimated M${alert.magnitude} | Max Shindo ${alert.maxIntensity}) - Take Immediate Drop/Cover Shelter [Click for Emergency Details]
        `;
      }
      playAlertBeep();
    } else {
      if (banner) banner.style.display = 'none';
    }
  }

    // dual-tone emergency chime (880Hz / 440Hz)
  let sharedAudioCtx = null;

  function playAlertBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
        sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
      }
      const osc = sharedAudioCtx.createOscillator();
      const gain = sharedAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, sharedAudioCtx.currentTime);
      osc.frequency.setValueAtTime(440, sharedAudioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, sharedAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(sharedAudioCtx.destination);
      osc.start();
      osc.stop(sharedAudioCtx.currentTime + 0.35);
    } catch (e) {
    }
  }

  async function refreshSeismicData() {
    const refreshBtn = document.getElementById('btn-refresh-seismic');
    if (refreshBtn) refreshBtn.classList.add('loading');

    try {
      const events = await API.fetchUsgsSeismicEvents();
      AppState.seismicFeed = events;
      renderSeismicFeedList();
      MapEngine.updateEpicenters(events);
    } catch (err) {
      console.error('Seismic fetch routine encountered an unhandled exception:', err);
    } finally {
      if (refreshBtn) refreshBtn.classList.remove('loading');
    }
  }

  function renderSeismicFeedList() {
    const container = document.getElementById('seismic-feed-list');
    if (!container) return;

    let filtered = AppState.seismicFeed;
    if (AppState.seismicFilter === 'm4') {
      filtered = filtered.filter(e => e.mag >= 4.0);
    } else if (AppState.seismicFilter === 'm5') {
      filtered = filtered.filter(e => e.mag >= 5.0);
    }

    const fragment = document.createDocumentFragment();

    if (filtered.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.style.padding = '20px';
      emptyEl.style.textAlign = 'center';
      emptyEl.style.fontSize = '11px';
      emptyEl.style.color = 'var(--color-slate-muted)';
      emptyEl.textContent = 'NO SEISMIC EVENTS MATCHING CURRENT FILTER PARAMETERS.';
      fragment.appendChild(emptyEl);
    } else {
      filtered.forEach(evt => {
        const card = document.createElement('div');
        card.className = `seismic-card ${evt.severity}`;
        card.dataset.id = evt.id;

        card.innerHTML = `
          <div class="seismic-header">
            <span class="mag-tag ${evt.tagClass}">M ${evt.mag.toFixed(1)}</span>
            <span class="shindo-badge">${evt.shindo.category}</span>
          </div>
          <div class="seismic-location" title="${evt.place}">${evt.place}</div>
          <div class="seismic-details">
            <span>Depth: ${evt.depth} km</span>
            <span>${evt.distToTokyo} km from Tokyo</span>
          </div>
        `;

        card.addEventListener('click', () => {
          MapEngine.flyToCoordinates(evt.lat, evt.lon, 7);
          openSeismicForensicModal(evt);
        });

        fragment.appendChild(card);
      });
    }

    container.innerHTML = '';
    container.appendChild(fragment);

    const countEl = document.getElementById('seismic-feed-count');
    if (countEl) countEl.textContent = `${filtered.length} EVENTS`;
  }

  
  async function refreshWeatherData() {
    try {
      const loc = AppState.currentLocation;
      if (!loc || loc.lat === undefined || loc.lon === undefined) return;
      const weather = await API.fetchOpenMeteoWeather(loc.lat, loc.lon);
      AppState.currentWeather = weather;
      renderWeatherTelemetry(weather);
    } catch (err) {
      console.warn('Weather refresh encountered an error:', err);
    }
  }

  function renderWeatherTelemetry(data) {
    if (!data) return;

    const locNameEl = document.getElementById('weather-location-name');
    const locCoordsEl = document.getElementById('weather-location-coords');
    const tempEl = document.getElementById('weather-current-temp');
    const descEl = document.getElementById('weather-current-desc');

    if (locNameEl) locNameEl.textContent = AppState.currentLocation.name;
    if (locCoordsEl) locCoordsEl.textContent = `${data.coords.lat.toFixed(3)}°N, ${data.coords.lon.toFixed(3)}°E`;
    if (tempEl) tempEl.textContent = `${data.temp}°C`;
    if (descEl) descEl.textContent = `${data.conditionText} (Apparent: ${data.apparentTemp}°C)`;

    MapEngine.updateWeatherBadge(data.temp, data.conditionText);

    const rhVal = document.getElementById('metric-val-humidity');
    const pressVal = document.getElementById('metric-val-pressure');
    const windVal = document.getElementById('metric-val-wind');
    const gustVal = document.getElementById('metric-val-gusts');

    if (rhVal) rhVal.textContent = `${data.humidity}%`;
    if (pressVal) pressVal.textContent = `${data.pressure} hPa`;
    if (windVal) windVal.textContent = `${data.windSpeed} km/h`;
    if (gustVal) gustVal.textContent = `${data.windGusts} km/h`;

    const wbgtVal = document.getElementById('gauge-wbgt-val');
    const wbgtFill = document.getElementById('gauge-wbgt-fill');
    if (wbgtVal && wbgtFill) {
      wbgtVal.textContent = `${data.wbgt.wbgt}°C [${data.wbgt.stage}]`;
      wbgtFill.style.width = `${data.wbgt.score}%`;
      wbgtFill.className = `progress-fill ${data.wbgt.levelClass}`;
    }

    const rainVal = document.getElementById('gauge-rain-val');
    const rainFill = document.getElementById('gauge-rain-fill');
    if (rainVal && rainFill) {
      rainVal.textContent = `${data.precip} mm/h [${data.precipRisk.text}]`;
      rainFill.style.width = `${data.precipRisk.score}%`;
      rainFill.className = `progress-fill ${data.precipRisk.fillClass}`;
    }

    const windGaugeVal = document.getElementById('gauge-wind-val');
    const windGaugeFill = document.getElementById('gauge-wind-fill');
    if (windGaugeVal && windGaugeFill) {
      windGaugeVal.textContent = `${data.windSpeed} km/h [${data.windRisk.text}]`;
      windGaugeFill.style.width = `${data.windRisk.score}%`;
      windGaugeFill.className = `progress-fill ${data.windRisk.fillClass}`;
    }

    renderForecastStrip(data.forecast);
  }

  function renderForecastStrip(forecast) {
    const container = document.getElementById('forecast-strip-container');
    if (!container || !forecast) return;

    container.innerHTML = '';
    forecast.forEach(day => {
      const row = document.createElement('div');
      row.className = 'forecast-day-row';
      row.innerHTML = `
        <span class="forecast-date">${day.label}</span>
        <span class="forecast-condition" title="${day.condition}">${day.condition}</span>
        <span class="forecast-temps">
          <span class="hi">${day.tempMax}°</span>
          <span class="lo">${day.tempMin}°</span>
        </span>
      `;
      container.appendChild(row);
    });
  }

  
  function setupDashboardControls() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        AppState.seismicFilter = chip.dataset.filter || 'all';
        renderSeismicFeedList();
      });
    });

    const refreshBtn = document.getElementById('btn-refresh-seismic');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshSeismicData();
      });
    }

    const toggleButtons = document.querySelectorAll('.layer-toggle-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const layer = btn.dataset.layer;
        const isActive = btn.classList.contains('active');
        if (isActive) {
          btn.classList.remove('active');
          MapEngine.toggleLayer(layer, false);
        } else {
          btn.classList.add('active');
          MapEngine.toggleLayer(layer, true);
        }
      });
    });

    const searchInput = document.getElementById('dashboard-location-search');
    const dropdown = document.getElementById('search-results-dropdown');

    if (searchInput && dropdown) {
      let activeSearchQuery = '';

      searchInput.addEventListener('input', () => {
        clearTimeout(AppState.searchDebounceTimer);
        const query = searchInput.value.trim();
        activeSearchQuery = query;

        if (query.length < 2) {
          dropdown.style.display = 'none';
          dropdown.innerHTML = '';
          return;
        }

        AppState.searchDebounceTimer = setTimeout(async () => {
          try {
            const results = await API.geocodeLocation(query);
            if (searchInput.value.trim() !== query || activeSearchQuery !== query) {
              return;
            }
            renderSearchResults(results, dropdown);
          } catch (searchErr) {
            console.warn('Geocoding search notice:', searchErr);
          }
        }, 400);
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }

    const plannerSelect = document.getElementById('planner-pref-select');
    if (plannerSelect) {
      plannerSelect.addEventListener('change', () => {
        ChartsEngine.setPrefecture(plannerSelect.value);
      });
    }
  }

  function renderSearchResults(results, dropdown) {
    if (!results || results.length === 0) {
      dropdown.innerHTML = `<div class="search-result-item" style="color: var(--color-slate-muted);">No locations found matching query.</div>`;
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = '';
    results.forEach(item => {
      const row = document.createElement('div');
      row.className = 'search-result-item';
      row.textContent = item.displayName;

      row.addEventListener('click', () => {
        setLocation(item.lat, item.lon, item.name);
        dropdown.style.display = 'none';
        const input = document.getElementById('dashboard-location-search');
        if (input) input.value = '';
      });

      dropdown.appendChild(row);
    });

    dropdown.style.display = 'block';
  }

  function setLocation(lat, lon, name) {
    AppState.currentLocation = { name, pref: name, lat, lon };
    MapEngine.flyToCoordinates(lat, lon, 8);
    refreshWeatherData().catch(err => {
      console.warn('Weather refresh on setLocation notice:', err);
    });
  }

  function setupPrepSubNav() {
    const subNavBtns = document.querySelectorAll('.sub-nav-btn');
    const radarPanel = document.getElementById('radar-feed-panel');
    const accordions = document.querySelectorAll('.accordion-item');

    subNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.subtab;
        if (tab === 'radar') {
          if (radarPanel) radarPanel.style.display = 'block';
        } else if (tab === 'seismic') {
          if (radarPanel) radarPanel.style.display = 'block';
          accordions.forEach((acc, idx) => {
            if (idx === 2) acc.classList.add('open');
            else acc.classList.remove('open');
          });
        } else if (tab === 'evacuation') {
          if (radarPanel) radarPanel.style.display = 'block';
          accordions.forEach((acc, idx) => {
            if (idx === 1) acc.classList.add('open');
            else acc.classList.remove('open');
          });
        }
      });
    });
  }

  let radarAnimId = null;
  let radarAngle = 0;
  let isRadarSweepActive = true;
  let showTyphoonTrack = true;
  let showPrecipEchoes = true;
  let drawRadarFrameFn = null;

  function resumeRadarAnimation() {
    const radarView = document.getElementById('view-disaster');
    if (radarView && !radarView.classList.contains('hidden') && !radarAnimId) {
      if (typeof drawRadarFrameFn === 'function') {
        radarAnimId = requestAnimationFrame(drawRadarFrameFn);
      }
    }
  }

  function initRadarFeed() {
    const canvas = document.getElementById('jma-radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const btnSweep = document.getElementById('btn-toggle-sweep');
    const btnTyphoon = document.getElementById('btn-toggle-typhoon');
    const btnEchoes = document.getElementById('btn-toggle-echoes');
    const statusText = document.getElementById('radar-sweep-status');

    if (btnSweep) {
      btnSweep.addEventListener('click', () => {
        isRadarSweepActive = !isRadarSweepActive;
        btnSweep.textContent = isRadarSweepActive ? 'Pause Sweep' : 'Resume Sweep';
        btnSweep.classList.toggle('active', isRadarSweepActive);
        if (statusText) statusText.textContent = isRadarSweepActive ? 'SWEEP: ACTIVE (30 RPM)' : 'SWEEP: PAUSED';
      });
    }

    if (btnTyphoon) {
      btnTyphoon.addEventListener('click', () => {
        showTyphoonTrack = !showTyphoonTrack;
        btnTyphoon.classList.toggle('active', showTyphoonTrack);
      });
    }

    if (btnEchoes) {
      btnEchoes.addEventListener('click', () => {
        showPrecipEchoes = !showPrecipEchoes;
        btnEchoes.classList.toggle('active', showPrecipEchoes);
      });
    }

    function drawRadarFrame() {
      const radarView = document.getElementById('view-disaster');
      if (radarView && radarView.classList.contains('hidden')) {
        radarAnimId = null;
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxRadius = Math.min(cx, cy) - 15;

      ctx.fillStyle = '#090B0E';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#2B333E';
      ctx.lineWidth = 1;
      const rings = [0.33, 0.66, 1.0];
      rings.forEach((ratio, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#8E9BAE';
        ctx.font = '9px var(--font-mono)';
        ctx.fillText(`${(idx + 1) * 100} KM`, cx + maxRadius * ratio - 38, cy - 4);
      });

      ctx.beginPath();
      ctx.moveTo(cx, cy - maxRadius);
      ctx.lineTo(cx, cy + maxRadius);
      ctx.moveTo(cx - maxRadius, cy);
      ctx.lineTo(cx + maxRadius, cy);
      ctx.stroke();

      ctx.fillStyle = '#8E9BAE';
      ctx.font = '10px var(--font-sans)';
      ctx.fillText('N (000°)', cx - 18, cy - maxRadius - 4);
      ctx.fillText('S (180°)', cx - 18, cy + maxRadius + 12);
      ctx.fillText('E (090°)', cx + maxRadius + 4, cy + 3);
      ctx.fillText('W (270°)', cx - maxRadius - 44, cy + 3);

      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 120, cy - 90);
      ctx.lineTo(cx - 70, cy - 50);
      ctx.lineTo(cx - 30, cy - 30);
      ctx.lineTo(cx + 10, cy - 40);
      ctx.lineTo(cx + 60, cy - 20);
      ctx.lineTo(cx + 90, cy + 30);
      ctx.lineTo(cx + 70, cy + 80);
      ctx.lineTo(cx + 20, cy + 60);
      ctx.stroke();

      if (showPrecipEchoes) {
        const g1 = ctx.createRadialGradient(cx + 65, cy - 35, 5, cx + 65, cy - 35, 45);
        g1.addColorStop(0, 'rgba(225, 29, 72, 0.7)');
        g1.addColorStop(0.4, 'rgba(217, 119, 6, 0.5)');
        g1.addColorStop(0.8, 'rgba(16, 185, 129, 0.25)');
        g1.addColorStop(1, 'transparent');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(cx + 65, cy - 35, 45, 0, Math.PI * 2);
        ctx.fill();

        const g2 = ctx.createRadialGradient(cx - 50, cy + 30, 8, cx - 50, cy + 30, 55);
        g2.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
        g2.addColorStop(0.6, 'rgba(16, 185, 129, 0.3)');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(cx - 50, cy + 30, 55, 0, Math.PI * 2);
        ctx.fill();
      }

      if (showTyphoonTrack) {
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - 100, cy + 120);
        ctx.quadraticCurveTo(cx - 20, cy + 40, cx + 70, cy - 50);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
        ctx.beginPath();
        ctx.arc(cx + 70, cy - 50, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.stroke();

        ctx.fillStyle = '#D97706';
        ctx.font = '9px var(--font-mono)';
        ctx.fillText('TYPHOON T2408 (PROJ +12H)', cx + 50, cy - 82);
      }

      if (isRadarSweepActive) {
        radarAngle = (radarAngle + 0.025) % (Math.PI * 2);
      }

      const sweepGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
      sweepGradient.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
      sweepGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxRadius, radarAngle - 0.25, radarAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(radarAngle) * maxRadius, cy + Math.sin(radarAngle) * maxRadius);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      radarAnimId = requestAnimationFrame(drawRadarFrame);
    }

    drawRadarFrameFn = drawRadarFrame;

    if (radarAnimId) {
      cancelAnimationFrame(radarAnimId);
      radarAnimId = null;
    }
    drawRadarFrame();
  }

  function setupModals() {
    const modalBackdrop = document.getElementById('modal-backdrop');
    const closeButtons = document.querySelectorAll('.modal-close-trigger');

    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        closeActiveModal();
      });
    });

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
          closeActiveModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeActiveModal();
    });

    const privLink = document.getElementById('link-privacy-policy');
    if (privLink) {
      privLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPrivacyPolicyModal();
      });
    }

    const termsLink = document.getElementById('link-terms-conditions');
    if (termsLink) {
      termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        openTermsModal();
      });
    }

    const domainLink = document.getElementById('footer-custom-domain');
    if (domainLink) {
      domainLink.addEventListener('click', (e) => {
        e.preventDefault();
        openDomainConfigModal();
      });
    }

    const btnViewAlert = document.getElementById('btn-view-alert-details');
    if (btnViewAlert) {
      btnViewAlert.addEventListener('click', () => {
        openEewStatusModal();
      });
    }

    const eewBadge = document.getElementById('eew-telemetry-badge');
    if (eewBadge) {
      eewBadge.style.cursor = 'pointer';
      eewBadge.addEventListener('click', () => {
        openEewStatusModal();
      });
    }

    const hudBanner = document.getElementById('hud-warning-banner');
    if (hudBanner) {
      hudBanner.addEventListener('click', () => {
        openEewStatusModal();
      });
    }
  }

  function openEewStatusModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title-text');
    const body = document.getElementById('modal-body-container');
    if (!backdrop || !title || !body) return;

    const alert = lastEewAlert || {
      hypocenter: 'Suruga Bay / Nankai Trough Monitoring Node',
      magnitude: 4.8,
      maxIntensity: '3',
      depth: 25,
      isWarn: false,
      announcedTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo' }),
      title: 'JMA Seismological Telemetry Stream'
    };

    title.textContent = 'JMA EARTHQUAKE EARLY WARNING (EEW) TELEMETRY STATUS';
    body.innerHTML = `
      <div class="forensic-grid">
        <div class="forensic-stat">
          <div class="forensic-label">Monitoring Stream</div>
          <div class="forensic-val" style="font-size: 13px;">Wolfx Open API Mirror (JMA Telemetry)</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Current Pipeline Status</div>
          <div class="forensic-val" style="color: ${alert.isWarn ? '#E11D48' : '#10B981'};">
            ${alert.isWarn ? 'ACTIVE WARNING BROADCAST' : 'NORMAL SYNOPTIC STANDBY'}
          </div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Monitored Hypocenter</div>
          <div class="forensic-val">${alert.hypocenter}</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Maximum Predicted Shindo</div>
          <div class="forensic-val" style="color: ${alert.isWarn ? '#E11D48' : '#10B981'};">
            Shindo ${alert.maxIntensity}
          </div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Estimated Magnitude</div>
          <div class="forensic-val">M ${alert.magnitude}</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Focal Depth Estimate</div>
          <div class="forensic-val">${alert.depth} km</div>
        </div>
      </div>

      <div class="forensic-directive-box" style="margin-top: 16px;">
        <strong style="display: block; margin-bottom: 4px; text-transform: uppercase;">Standard JMA EEW Response Protocol:</strong>
        When a warning is declared (Shindo 5-Lower or higher expected), immediate automatic triggers shut off high-speed Shinkansen trains, elevator banks stop at nearest floors, and gas main automatic cutoffs engage. Individuals should immediately drop to hands and knees, cover head and neck with a sturdy desk or coat, and hold on until seismic vibrations cease.
      </div>

      <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
        <button id="btn-simulate-eew" class="action-btn btn-sm" style="background-color: #E11D48; color: #FFFFFF; border-color: #E11D48;">
          Simulate JMA EEW Alert Dispatch
        </button>
        <button id="btn-reset-eew" class="action-btn btn-sm" style="background-color: var(--color-slate-panel); color: var(--color-pure-white);">
          Reset Normal Standby
        </button>
      </div>

      <div style="margin-top: 12px; font-family: var(--font-mono); font-size: 10px; color: var(--color-slate-muted);">
        WebSocket: wss://ws-api.wolfx.jp/jma_eew | Fallback: https://api.wolfx.jp/jma_eew.json (30s Polling Cycle)
      </div>
    `;

    backdrop.classList.add('active');

    const simBtn = document.getElementById('btn-simulate-eew');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        handleLiveEewAlert({
          isWarn: true,
          isCancel: false,
          hypocenter: 'Off-Miyagi Coast (Tohoku Arc)',
          magnitude: 6.4,
          maxIntensity: '5+',
          depth: 40,
          announcedTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo' })
        });
        openEewStatusModal();
      });
    }

    const rstBtn = document.getElementById('btn-reset-eew');
    if (rstBtn) {
      rstBtn.addEventListener('click', () => {
        handleLiveEewAlert({
          isWarn: false,
          isCancel: false,
          hypocenter: 'Normal Synoptic Standby',
          magnitude: 0,
          maxIntensity: '0',
          depth: 0
        });
        const badge = document.getElementById('eew-telemetry-badge');
        const text = document.getElementById('eew-status-text');
        if (badge && text) {
          badge.className = 'eew-badge connected';
          text.textContent = 'JMA NORMAL MONITOR';
        }
        openEewStatusModal();
      });
    }
  }

  function closeActiveModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  function openSeismicForensicModal(evt) {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title-text');
    const body = document.getElementById('modal-body-container');

    if (!backdrop || !title || !body) return;

    title.textContent = `SEISMIC EVENT FORENSIC REPORT: ${evt.id.toUpperCase()}`;

    const pWaveArrivalSec = Math.round(evt.distToTokyo / 6.0);
    const sWaveArrivalSec = Math.round(evt.distToTokyo / 3.5);

    let directiveText = 'Monitor local NHK radio dispatches. Verify secondary hazards such as gas line disruption and fallen household masonry.';
    if (evt.mag >= 6.0 || evt.shindo.value >= 5.0) {
      directiveText = 'CRITICAL CIVIL DEFENSE PROTOCOL: Strong shaking recorded. Drop, Cover, and Hold On. Extinguish open cooking fires. Check for structural wall damage and beware of immediate aftershocks. If located near coastlines, prepare immediate vertical tsunami evacuation.';
    }

    body.innerHTML = `
      <div class="forensic-grid">
        <div class="forensic-stat">
          <div class="forensic-label">Hypocenter Location</div>
          <div class="forensic-val" style="font-size: 13px;">${evt.place}</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Instrumental Shindo</div>
          <div class="forensic-val" style="color: ${evt.mag >= 5.0 ? '#E11D48' : '#10B981'};">
            ${evt.shindo.category} (${evt.shindo.value})
          </div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Moment Magnitude</div>
          <div class="forensic-val">M ${evt.mag.toFixed(1)}</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Focal Hypocenter Depth</div>
          <div class="forensic-val">${evt.depth} km</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Geodetic Coordinates</div>
          <div class="forensic-val" style="font-size: 11px;">${evt.lat.toFixed(4)}°N, ${evt.lon.toFixed(4)}°E</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">Distance to Tokyo</div>
          <div class="forensic-val">${evt.distToTokyo} km</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">P-Wave Theoretical Transit</div>
          <div class="forensic-val">~${pWaveArrivalSec} seconds (Vp ≈ 6.0 km/s)</div>
        </div>
        <div class="forensic-stat">
          <div class="forensic-label">S-Wave Destructive Transit</div>
          <div class="forensic-val">~${sWaveArrivalSec} seconds (Vs ≈ 3.5 km/s)</div>
        </div>
      </div>

      <div class="forensic-directive-box">
        <strong style="display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em;">Civil Protection Operational Directive:</strong>
        ${directiveText}
      </div>

      <div style="margin-top: 14px; font-family: var(--font-mono); font-size: 10px; color: var(--color-slate-muted);">
        Recorded: ${evt.timestampStr} | USGS ID: ${evt.id} | JMA Instrumental Calibration: Midorikawa (1999) Attenuation
      </div>
    `;

    backdrop.classList.add('active');
  }

  function openPrivacyPolicyModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title-text');
    const body = document.getElementById('modal-body-container');

    if (!backdrop || !title || !body) return;

    title.textContent = 'DATA PRIVACY POLICY & COMPLIANCE';
    body.innerHTML = `
      <div style="font-size: 12px; line-height: 1.6; color: #E2E8F0;">
        <h4 style="color: #FFFFFF; margin-bottom: 6px; font-size: 13px;">1. Client-Side Architecture & Zero Surveillance</h4>
        <p style="margin-bottom: 12px;">
          The Japan Safe & Weather Insights platform operates strictly as a client-side telemetric observer. No user tracking cookies, fingerprinting routines, or demographic profiling scripts are embedded.
        </p>

        <h4 style="color: #FFFFFF; margin-bottom: 6px; font-size: 13px;">2. LocalStorage Persistence</h4>
        <p style="margin-bottom: 12px;">
          All user configurations (such as saved municipal watchlist entries and 72-hour survival checklist states) are retained entirely within your local browser LocalStorage sandbox. No personal data is transmitted to central storage servers.
        </p>

        <h4 style="color: #FFFFFF; margin-bottom: 6px; font-size: 13px;">3. External Telemetry Proxies</h4>
        <p>
          API queries dispatched to Open-Meteo, USGS, Wolfx, and OpenStreetMap Nominatim contain solely mathematical coordinates and municipal search strings necessary to retrieve meteorological and seismological observations.
        </p>
      </div>
    `;

    backdrop.classList.add('active');
  }

  function openTermsModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title-text');
    const body = document.getElementById('modal-body-container');

    if (!backdrop || !title || !body) return;

    title.textContent = 'TERMS & CONDITIONS OF CIVIL TELEMETRY USE';
    body.innerHTML = `
      <div style="font-size: 12px; line-height: 1.6; color: #E2E8F0;">
        <h4 style="color: #FFFFFF; margin-bottom: 6px; font-size: 13px;">1. Informational & Academic Purpose</h4>
        <p style="margin-bottom: 12px;">
          This platform aggregates scientific data from the Japan Meteorological Agency (JMA), United States Geological Survey (USGS), and European Centre for Medium-Range Weather Forecasts (ECMWF) for research and public civil defense readiness.
        </p>

        <h4 style="color: #FFFFFF; margin-bottom: 6px; font-size: 13px;">2. Emergency Disclaimers</h4>
        <p style="margin-bottom: 12px;">
          During an active catastrophic seismic event or major tsunami warning, citizens must prioritize official directives broadcasted by the Japan Meteorological Agency, local municipal loudspeakers (Bosai Musen), and NHK national broadcasts. Numerical models are subject to algorithmic attenuation tolerances.
        </p>

        <h4 style="color: #FFFFFF; margin-bottom: 6px; font-size: 13px;">3. Intellectual Property & Citations</h4>
        <p>
          Meteorological datasets are subject to Open Database License (ODbL) and respective open science public domain declarations.
        </p>
      </div>
    `;

    backdrop.classList.add('active');
  }

  function openDomainConfigModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title-text');
    const body = document.getElementById('modal-body-container');

    if (!backdrop || !title || !body) return;

    title.textContent = 'CUSTOM DOMAIN ROUTING RESERVATION';
    body.innerHTML = `
      <div style="font-size: 12px; line-height: 1.6; color: #E2E8F0;">
        <p style="margin-bottom: 12px;">
          This platform is configured for custom apex or sub-domain deployment (e.g. <code>japansafe.example.go.jp</code> or <code>insights.disaster-resilience.jp</code>).
        </p>
        <div style="background: #090B0E; border: 1px solid #2B333E; padding: 12px; border-radius: 2px; font-family: var(--font-mono); font-size: 11px;">
          CNAME Target: proxy.japansafe.network<br>
          A Record: 185.199.108.153<br>
          SSL/TLS: TLS 1.3 Strict SNI Enforcement
        </div>
      </div>
    `;

    backdrop.classList.add('active');
  }

  let clockTimerId = null;

  function initClock() {
    const clockEl = document.getElementById('header-live-clock');
    if (!clockEl) return;

    if (clockTimerId) {
      clearInterval(clockTimerId);
      clockTimerId = null;
    }

    function update() {
      const now = new Date();
      const jstString = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Tokyo',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      clockEl.textContent = `${jstString} JST`;
    }

    update();
    clockTimerId = setInterval(update, 1000);
  }
});

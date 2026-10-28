/**
 * Japan Safe & Weather Insights - Geospatial Mapping Subsystem (Leaflet)
 *
 * Implements high-contrast dark cartography utilizing CartoDB Dark Matter basemaps,
 * dynamic SVG epicenter scalar circles with magnitude-weighted radii,
 * tectonic subduction trench overlays, and interactive inspection modals.
 */

const MapEngine = (() => {
  let mapInstance = null;
  let epicenterLayerGroup = null;
  let tectonicLayerGroup = null;
  let stationsLayerGroup = null;
  let activeEpicentersData = [];
  let onMarkerSelectCallback = null;

  // Major Geodynamic Subduction Zones & Plate Boundaries across the Japanese Arc
  const TECTONIC_BOUNDARIES = [
    {
      name: 'Nankai Trough (南海トラフ)',
      coords: [
        [32.8, 132.0], [33.2, 133.5], [33.6, 135.2], [34.0, 137.0], [34.5, 138.5]
      ],
      hazardNote: 'Megathrust Subduction Interface (Philippine Sea Plate / Eurasian Plate)'
    },
    {
      name: 'Japan Trench (日本海溝)',
      coords: [
        [35.0, 142.5], [36.5, 143.2], [38.2, 143.8], [40.0, 144.2], [41.2, 144.5]
      ],
      hazardNote: 'Pacific Plate Subduction Margin (2011 Tohoku Megathrust Zone)'
    },
    {
      name: 'Sagami Trough (相模トラフ)',
      coords: [
        [34.3, 139.2], [34.8, 139.6], [35.0, 140.2], [35.2, 140.8]
      ],
      hazardNote: 'Kanto Plain Subduction Source (1923 Great Kanto Rupture)'
    },
    {
      name: 'Kuril Trench (千島海溝)',
      coords: [
        [41.5, 144.8], [43.0, 146.5], [44.5, 148.5], [46.0, 151.0]
      ],
      hazardNote: 'Hokkaido East Subduction Margin'
    },
    {
      name: 'Ryukyu Trench (琉球海溝)',
      coords: [
        [24.0, 124.0], [25.5, 126.5], [27.0, 128.5], [29.0, 130.5], [30.5, 131.5]
      ],
      hazardNote: 'Nansei-shoto Subduction Margin'
    }
  ];

  /**
   * Initializes the Leaflet map container with strict bounds and high-performance settings.
   */
  function initMap(containerId, markerClickCb) {
    onMarkerSelectCallback = markerClickCb;

    if (typeof L === 'undefined') {
      console.warn('Leaflet GIS library is not loaded. Map initialization deferred.');
      return null;
    }

    if (mapInstance) {
      try {
        mapInstance.remove();
      } catch (e) {
        // Clear existing Leaflet canvas instances to prevent DOM memory leaks on re-initialization
      }
      mapInstance = null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Map container #${containerId} not found.`);
      return null;
    }

    // Centered geographically on Honshu with optimal archipelago framing
    mapInstance = L.map(containerId, {
      center: [36.5, 138.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Industrial Zoom Control positioned at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

    // Senior Frontend Engineer Rationale:
    // Replaced OpenStreetMap default tiles with CARTO Positron Light tiles to resolve
    // HTTP 403 Access Blocked / Referer restrictions. CARTO Positron supports unauthenticated,
    // open access across subdomains ['a', 'b', 'c', 'd'] and maintains an exacting, high-contrast
    // light base cartography consistently regardless of global UI theme.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: ['a', 'b', 'c', 'd'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(mapInstance);

    // Isolated layer groups ensure granular toggling without expensive DOM re-queries
    epicenterLayerGroup = L.layerGroup().addTo(mapInstance);
    tectonicLayerGroup = L.layerGroup().addTo(mapInstance);
    stationsLayerGroup = L.layerGroup().addTo(mapInstance);

    renderTectonicBoundaries();
    renderWeatherStations();
    setupMapHudEvents();

    // Trigger immediate resize recalculation to prevent gray tiles upon view transitions
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 100);
  }

  /**
   * Renders real-time seismic epicenters as styled, magnitude-proportional vector rings.
   * Features high-contrast borders and concentric shockwave visualizers for significant events.
   */
  function updateEpicenters(events) {
    if (!epicenterLayerGroup) return;
    epicenterLayerGroup.clearLayers();
    activeEpicentersData = events;

    events.forEach(evt => {
      // Magnitude scaling: Non-linear area expansion reflecting exponential energy release E = 10^(1.5*M)
      const radiusPx = Math.max(6, Math.pow(evt.mag, 1.7) * 1.3);
      
      let fillColor = '#10B981'; // Optimal Green
      let strokeColor = '#065F46'; // High-contrast border for light tiles
      if (evt.mag >= 5.5 || evt.shindo.value >= 4.5) {
        fillColor = '#E11D48'; // Critical Red
        strokeColor = '#881337';
      } else if (evt.mag >= 4.2 || evt.shindo.value >= 3.0) {
        fillColor = '#D97706'; // Alert Amber
        strokeColor = '#78350F';
      }

      // Leaflet vector circle marker for performance and razor-sharp rendering on light basemap
      const circle = L.circleMarker([evt.lat, evt.lon], {
        radius: radiusPx,
        fillColor: fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.95,
        fillOpacity: 0.65
      });

      // For significant seismic events (M >= 4.5), render concentric outer shockwave ring
      if (evt.mag >= 4.5) {
        const shockwaveCircle = L.circleMarker([evt.lat, evt.lon], {
          radius: radiusPx * 1.8,
          fillColor: 'transparent',
          color: strokeColor,
          weight: 1.5,
          dashArray: '3, 4',
          opacity: 0.7,
          interactive: false
        });
        shockwaveCircle.addTo(epicenterLayerGroup);
      }

      // Lean popup payload prevents Leaflet DOM balloon bloat during dense cluster inspection
      const popupHtml = `
        <div style="font-family: var(--font-sans); min-width: 170px;">
          <div style="font-size: 11px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
            ${evt.title}
          </div>
          <div style="font-family: var(--font-mono); font-size: 10px; color: #8E9BAE; margin-bottom: 6px;">
            Dept: ${evt.depth} km | Mag: ${evt.mag} | ${evt.shindo.category}
          </div>
          <button id="inspect-btn-${evt.id}" style="width: 100%; background: #1A1F26; border: 1px solid #3B82F6; color: #FFFFFF; font-size: 10px; font-weight: 600; padding: 4px 6px; cursor: pointer; text-transform: uppercase;">
            Inspect Forensic Details
          </button>
        </div>
      `;

      circle.bindPopup(popupHtml, { closeButton: false, offset: [0, -6] });

      circle.on('popupopen', () => {
        const btn = document.getElementById(`inspect-btn-${evt.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            if (typeof onMarkerSelectCallback === 'function') {
              onMarkerSelectCallback(evt);
            }
          });
        }
      });

      circle.on('click', () => {
        // Smooth flyTo transition focuses analyst view directly onto the hypocenter coordinates
        flyToCoordinates(evt.lat, evt.lon, 7);
      });

      epicenterLayerGroup.addLayer(circle);
    });

    const countEl = document.getElementById('hud-seismic-count');
    if (countEl) {
      countEl.textContent = `${events.length} ACTIVE`;
    }
  }

  /**
   * Renders the major subduction trench lines across the Japanese Pacific rim.
   */
  function renderTectonicBoundaries() {
    if (!tectonicLayerGroup) return;
    tectonicLayerGroup.clearLayers();

    TECTONIC_BOUNDARIES.forEach(trench => {
      const polyline = L.polyline(trench.coords, {
        color: '#3B82F6', // Ocean Blue
        weight: 2,
        opacity: 0.65,
        dashArray: '6, 6'
      });

      polyline.bindTooltip(`${trench.name} - ${trench.hazardNote}`, {
        sticky: true,
        className: 'tectonic-tooltip'
      });

      tectonicLayerGroup.addLayer(polyline);
    });
  }

  /**
   * Renders fixed Meteorological Observation nodes for synoptic reference.
   */
  function renderWeatherStations() {
    if (!stationsLayerGroup) return;
    stationsLayerGroup.clearLayers();

    const stations = [
      { name: 'Tokyo AMeDAS (大手町)', lat: 35.6895, lon: 139.6917 },
      { name: 'Osaka Observation (谷町)', lat: 34.6937, lon: 135.5023 },
      { name: 'Sapporo Radar (北区)', lat: 43.0618, lon: 141.3545 },
      { name: 'Fukuoka Station (大濠)', lat: 33.5904, lon: 130.4017 },
      { name: 'Naha Air Station (那覇)', lat: 26.2124, lon: 127.6809 },
      { name: 'Sendai Node (宮城野)', lat: 38.2682, lon: 140.8694 }
    ];

    stations.forEach(st => {
      const marker = L.circleMarker([st.lat, st.lon], {
        radius: 4,
        fillColor: '#8E9BAE',
        color: '#FFFFFF',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8
      });

      marker.bindTooltip(`Station: ${st.name}`, { direction: 'top', offset: [0, -4] });
      stationsLayerGroup.addLayer(marker);
    });
  }

  /**
   * Listens to map movements to update live coordinate HUD readout.
   */
  function setupMapHudEvents() {
    if (!mapInstance) return;

    const coordsDisplay = document.getElementById('hud-center-coords');

    mapInstance.on('mousemove', (e) => {
      if (coordsDisplay) {
        coordsDisplay.textContent = `${e.latlng.lat.toFixed(3)}°N, ${e.latlng.lng.toFixed(3)}°E`;
      }
    });

    mapInstance.on('mouseout', () => {
      if (coordsDisplay && mapInstance) {
        const c = mapInstance.getCenter();
        coordsDisplay.textContent = `${c.lat.toFixed(3)}°N, ${c.lng.toFixed(3)}°E`;
      }
    });
  }

  /**
   * Smooth animated camera transition to selected geodetic coordinates.
   */
  function flyToCoordinates(lat, lon, zoom = 7) {
    if (!mapInstance) return;
    mapInstance.flyTo([lat, lon], zoom, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }

  /**
   * Layer Visibility Toggles
   */
  function toggleLayer(layerType, isVisible) {
    if (!mapInstance) return;
    if (layerType === 'epicenters' && epicenterLayerGroup) {
      if (isVisible) mapInstance.addLayer(epicenterLayerGroup);
      else mapInstance.removeLayer(epicenterLayerGroup);
    } else if (layerType === 'tectonics' && tectonicLayerGroup) {
      if (isVisible) mapInstance.addLayer(tectonicLayerGroup);
      else mapInstance.removeLayer(tectonicLayerGroup);
    } else if (layerType === 'stations' && stationsLayerGroup) {
      if (isVisible) mapInstance.addLayer(stationsLayerGroup);
      else mapInstance.removeLayer(stationsLayerGroup);
    }
  }

  function resize() {
    if (mapInstance) {
      mapInstance.invalidateSize();
    }
  }

  /**
   * Updates real-time meteorological overlay badge on the primary GIS canvas.
   */
  function updateWeatherBadge(temp, conditionText) {
    const badgeTemp = document.getElementById('map-weather-badge-temp');
    const badgeCond = document.getElementById('map-weather-badge-cond');
    if (badgeTemp) badgeTemp.textContent = `${temp}°C`;
    if (badgeCond) badgeCond.textContent = conditionText || 'Clear Skies';
  }

  return {
    initMap,
    updateEpicenters,
    flyToCoordinates,
    toggleLayer,
    resize,
    invalidateSize: resize,
    getMap: () => mapInstance,
    updateWeatherBadge
  };
})();

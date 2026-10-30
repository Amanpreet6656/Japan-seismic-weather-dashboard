
const API = (() => {
  const JAPAN_BOUNDS = {
    minLat: 24.0,
    maxLat: 46.0,
    minLon: 122.0,
    maxLon: 154.0,
    minMag: 2.5,
    limit: 40
  };

  const PREFECTURES = {
    tokyo: { name: 'Tokyo (東京)', lat: 35.6895, lon: 139.6917, pref: 'Tokyo' },
    osaka: { name: 'Osaka (大阪)', lat: 34.6937, lon: 135.5023, pref: 'Osaka' },
    kyoto: { name: 'Kyoto (京都)', lat: 35.0116, lon: 135.7681, pref: 'Kyoto' },
    sapporo: { name: 'Sapporo (札幌)', lat: 43.0618, lon: 141.3545, pref: 'Hokkaido' },
    fukuoka: { name: 'Fukuoka (福岡)', lat: 33.5904, lon: 130.4017, pref: 'Fukuoka' },
    naha: { name: 'Naha (那覇)', lat: 26.2124, lon: 127.6809, pref: 'Okinawa' },
    sendai: { name: 'Sendai (仙台)', lat: 38.2682, lon: 140.8694, pref: 'Miyagi' },
    hiroshima: { name: 'Hiroshima (広島)', lat: 34.3853, lon: 132.4553, pref: 'Hiroshima' },
    kanazawa: { name: 'Kanazawa (金沢)', lat: 36.5613, lon: 136.6562, pref: 'Ishikawa' },
    nagano: { name: 'Nagano (長野)', lat: 36.6513, lon: 138.1812, pref: 'Nagano' }
  };

  const CLIMATE_NORMALS = {
    tokyo: {
      tempHigh: [9.9, 10.6, 13.9, 19.3, 23.6, 26.1, 29.9, 31.3, 27.5, 22.2, 17.0, 12.3],
      tempLow: [2.9, 3.4, 6.2, 11.2, 16.0, 19.7, 23.5, 24.8, 21.6, 16.1, 10.4, 5.2],
      precip: [59.7, 56.5, 116.0, 133.7, 139.7, 167.8, 156.4, 154.7, 224.9, 234.8, 96.3, 57.9],
      typhoonIndex: [2, 2, 5, 8, 14, 28, 48, 85, 92, 60, 18, 4],
      seismicBaseline: [12, 14, 15, 13, 16, 12, 14, 18, 15, 14, 13, 15]
    },
    osaka: {
      tempHigh: [9.7, 10.5, 14.2, 19.9, 24.9, 28.2, 32.1, 33.7, 29.5, 23.6, 17.8, 12.3],
      tempLow: [3.0, 3.2, 5.9, 10.9, 16.0, 20.3, 24.6, 25.8, 22.0, 16.0, 10.2, 5.3],
      precip: [47.0, 60.5, 103.5, 103.8, 145.5, 184.5, 157.0, 101.4, 160.7, 137.0, 72.5, 54.5],
      typhoonIndex: [1, 2, 4, 7, 12, 25, 45, 82, 88, 52, 14, 3],
      seismicBaseline: [8, 9, 7, 10, 8, 11, 9, 8, 10, 8, 9, 8]
    },
    kyoto: {
      tempHigh: [9.1, 10.0, 14.1, 20.1, 25.1, 28.3, 32.0, 33.7, 29.2, 23.3, 17.3, 11.6],
      tempLow: [1.4, 1.6, 4.3, 9.2, 14.5, 19.2, 23.6, 24.7, 20.7, 14.4, 8.4, 3.4],
      precip: [53.5, 65.5, 115.0, 116.0, 153.5, 206.5, 214.0, 149.0, 186.0, 142.5, 76.5, 60.0],
      typhoonIndex: [1, 2, 4, 6, 12, 24, 42, 80, 85, 48, 12, 3],
      seismicBaseline: [7, 8, 6, 9, 7, 10, 8, 7, 8, 7, 8, 7]
    },
    sapporo: {
      tempHigh: [-0.4, 0.4, 4.5, 11.7, 17.9, 21.8, 25.4, 26.7, 22.8, 16.2, 8.7, 2.0],
      tempLow: [-7.0, -6.6, -2.9, 3.2, 8.7, 13.4, 17.9, 19.4, 14.8, 8.0, 1.6, -4.3],
      precip: [110.7, 91.0, 77.5, 56.8, 58.7, 56.0, 93.2, 137.3, 139.9, 122.4, 115.0, 122.2],
      typhoonIndex: [0, 0, 1, 2, 5, 10, 18, 45, 50, 22, 6, 1],
      seismicBaseline: [9, 11, 12, 10, 11, 9, 10, 13, 11, 12, 10, 11]
    },
    fukuoka: {
      tempHigh: [10.2, 11.6, 15.0, 19.9, 24.4, 27.2, 31.2, 32.5, 28.6, 23.7, 18.2, 12.6],
      tempLow: [3.8, 4.4, 7.2, 11.6, 16.3, 20.6, 25.0, 25.8, 22.0, 16.2, 10.6, 5.7],
      precip: [74.5, 77.0, 112.5, 121.0, 152.5, 269.5, 299.0, 210.0, 175.0, 85.5, 87.0, 67.5],
      typhoonIndex: [2, 3, 5, 9, 16, 32, 58, 92, 95, 62, 20, 5],
      seismicBaseline: [6, 7, 5, 8, 6, 7, 6, 5, 7, 6, 5, 6]
    },
    naha: {
      tempHigh: [19.8, 20.2, 22.0, 24.6, 27.1, 29.8, 32.1, 31.8, 30.7, 28.1, 25.0, 21.5],
      tempLow: [14.9, 15.1, 16.7, 19.4, 22.3, 25.5, 27.2, 27.0, 25.8, 23.5, 20.4, 16.8],
      precip: [114.5, 125.0, 160.0, 181.0, 267.0, 211.5, 188.0, 260.0, 276.5, 178.5, 119.5, 110.0],
      typhoonIndex: [5, 6, 10, 18, 35, 60, 88, 98, 96, 74, 38, 12],
      seismicBaseline: [14, 16, 18, 15, 17, 14, 16, 19, 17, 15, 14, 16]
    },
    sendai: {
      tempHigh: [5.6, 6.5, 10.0, 15.5, 20.2, 23.1, 26.6, 28.2, 24.9, 19.8, 14.1, 8.4],
      tempLow: [-1.4, -1.2, 1.2, 6.0, 11.3, 15.8, 19.8, 21.4, 17.6, 11.2, 5.1, 0.5],
      precip: [42.5, 43.0, 81.0, 98.0, 110.0, 142.5, 178.0, 182.5, 214.0, 149.0, 68.5, 43.5],
      typhoonIndex: [1, 1, 3, 5, 10, 20, 36, 74, 82, 45, 10, 2],
      seismicBaseline: [18, 22, 24, 20, 23, 19, 21, 25, 22, 20, 19, 21]
    },
    hiroshima: {
      tempHigh: [10.2, 11.2, 14.8, 20.2, 24.8, 27.8, 31.6, 33.1, 29.4, 23.8, 18.0, 12.5],
      tempLow: [2.4, 2.7, 5.4, 10.3, 15.3, 19.8, 24.1, 25.1, 21.3, 15.1, 9.3, 4.4],
      precip: [47.5, 66.5, 117.5, 137.5, 171.0, 228.0, 278.5, 153.5, 169.5, 96.0, 69.5, 52.0],
      typhoonIndex: [1, 2, 4, 7, 14, 26, 48, 84, 89, 54, 15, 3],
      seismicBaseline: [5, 6, 5, 7, 6, 8, 6, 5, 7, 6, 5, 6]
    },
    kanazawa: {
      tempHigh: [7.1, 7.8, 11.6, 17.3, 22.3, 25.6, 29.7, 31.4, 27.2, 21.8, 16.0, 10.2],
      tempLow: [1.2, 1.2, 3.4, 8.2, 13.5, 18.2, 22.8, 24.1, 19.9, 14.0, 8.3, 3.3],
      precip: [275.5, 172.0, 161.0, 137.5, 153.0, 181.5, 241.0, 188.0, 216.5, 183.0, 253.5, 312.0],
      typhoonIndex: [1, 1, 3, 5, 10, 22, 40, 76, 82, 46, 12, 2],
      seismicBaseline: [14, 15, 13, 16, 14, 15, 14, 17, 15, 14, 13, 15]
    },
    nagano: {
      tempHigh: [3.8, 5.2, 10.2, 17.5, 23.0, 26.1, 29.7, 31.1, 26.0, 19.6, 13.2, 6.7],
      tempLow: [-4.4, -4.0, -0.6, 5.0, 10.8, 16.0, 20.3, 21.3, 16.9, 10.1, 3.3, -2.1],
      precip: [56.0, 52.0, 77.0, 68.0, 85.0, 118.5, 148.5, 114.0, 137.5, 108.5, 54.0, 49.5],
      typhoonIndex: [1, 1, 3, 5, 10, 20, 38, 75, 80, 44, 10, 2],
      seismicBaseline: [8, 9, 8, 10, 9, 11, 9, 8, 10, 9, 8, 9]
    }
  };

  const geocodeCache = new Map();

  function calculateJmaShindo(mag, depthKm, epicentralDistKm = 0) {
    const r = Math.sqrt(Math.pow(epicentralDistKm, 2) + Math.pow(depthKm, 2));
    const safeR = Math.max(r, 5.0); // avoid divide by zero
    
    const logPgv = 0.58 * mag - 1.20 * Math.log10(safeR) - 0.002 * safeR - 0.45;
    const calcShindo = 2.68 + 1.72 * logPgv;
    const boundedShindo = Math.max(0, Math.min(7.0, calcShindo));

    let category = '0';
    let labelEn = 'Shindo 0 (Imperceptible)';
    let level = 'normal';

    if (boundedShindo < 0.5) {
      category = '0';
      labelEn = 'Shindo 0 (Micro)';
    } else if (boundedShindo < 1.5) {
      category = '1';
      labelEn = 'Shindo 1 (Slight)';
    } else if (boundedShindo < 2.5) {
      category = '2';
      labelEn = 'Shindo 2 (Weak)';
    } else if (boundedShindo < 3.5) {
      category = '3';
      labelEn = 'Shindo 3 (Moderate)';
    } else if (boundedShindo < 4.5) {
      category = '4';
      labelEn = 'Shindo 4 (Strong)';
      level = 'alert';
    } else if (boundedShindo < 5.0) {
      category = '5-';
      labelEn = 'Shindo 5-Lower (Very Strong)';
      level = 'alert';
    } else if (boundedShindo < 5.5) {
      category = '5+';
      labelEn = 'Shindo 5-Upper (Disruptive)';
      level = 'critical';
    } else if (boundedShindo < 6.0) {
      category = '6-';
      labelEn = 'Shindo 6-Lower (Violent)';
      level = 'critical';
    } else if (boundedShindo < 6.5) {
      category = '6+';
      labelEn = 'Shindo 6-Upper (Severe)';
      level = 'critical';
    } else {
      category = '7';
      labelEn = 'Shindo 7 (Catastrophic)';
      level = 'critical';
    }

    return {
      value: parseFloat(boundedShindo.toFixed(1)),
      category: category,
      labelEn: labelEn,
      level: level
    };
  }

  function calculateWbgt(tempC, relativeHumidity) {
    const e = (relativeHumidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
    const wbgt = 0.567 * tempC + 0.393 * e + 3.94;
    const rounded = parseFloat(wbgt.toFixed(1));

    let stage = 'Safe';
    let levelClass = 'fill-green';
    let score = Math.min(100, Math.max(0, Math.round((rounded / 35) * 100)));

    if (rounded >= 31) {
      stage = 'Danger (Stop Exercise)';
      levelClass = 'fill-red';
    } else if (rounded >= 28) {
      stage = 'Severe Warning';
      levelClass = 'fill-amber';
    } else if (rounded >= 25) {
      stage = 'Warning';
      levelClass = 'fill-amber';
    } else {
      stage = 'Low Risk';
      levelClass = 'fill-green';
    }

    return { wbgt: rounded, stage, levelClass, score };
  }

  async function fetchUsgsSeismicEvents() {
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson`
      + `&minmagnitude=${JAPAN_BOUNDS.minMag}`
      + `&minlatitude=${JAPAN_BOUNDS.minLat}`
      + `&maxlatitude=${JAPAN_BOUNDS.maxLat}`
      + `&minlongitude=${JAPAN_BOUNDS.minLon}`
      + `&maxlongitude=${JAPAN_BOUNDS.maxLon}`
      + `&limit=${JAPAN_BOUNDS.limit}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`USGS HTTP Error: status ${res.status}`);
      }

      const data = await res.json();
      return processUsgsFeatures(data.features || []);
    } catch (err) {
      console.warn('USGS API connection failure or timeout. Engaging fallback cache:', err.message);
      return getFallbackSeismicData();
    }
  }

  function processUsgsFeatures(features) {
    return features.map(item => {
      const p = item.properties || {};
      const coords = item.geometry ? item.geometry.coordinates : [0, 0, 0];
      const lon = coords[0];
      const lat = coords[1];
      const depth = coords[2] || 10;
      const mag = p.mag !== null && p.mag !== undefined ? parseFloat(p.mag.toFixed(1)) : 3.0;

      const distToTokyo = calculateHaversineDistance(lat, lon, PREFECTURES.tokyo.lat, PREFECTURES.tokyo.lon);
      const shindo = calculateJmaShindo(mag, depth, 0);

      let severity = 'level-normal';
      let tagClass = 'norm';
      if (mag >= 5.5 || shindo.value >= 4.5) {
        severity = 'level-critical';
        tagClass = 'crit';
      } else if (mag >= 4.2 || shindo.value >= 3.0) {
        severity = 'level-alert';
        tagClass = 'warn';
      }

      return {
        id: item.id || `usgs-${p.time}`,
        title: p.title || `M ${mag} - Japan Region`,
        place: cleanPlaceName(p.place),
        mag: mag,
        depth: Math.round(depth),
        lat: lat,
        lon: lon,
        time: p.time,
        timestampStr: formatIsoTime(p.time),
        shindo: shindo,
        severity: severity,
        tagClass: tagClass,
        distToTokyo: Math.round(distToTokyo),
        url: p.url,
        feltReports: p.felt || 0,
        tsunami: p.tsunami || 0
      };
    });
  }

  async function fetchOpenMeteoWeather(lat, lon) {
    const precLat = Number(lat).toFixed(4);
    const precLon = Number(lon).toFixed(4);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${precLat}&longitude=${precLon}`
      + `&models=jma_seamless`
      + `&timezone=Asia/Tokyo`
      + `&current=temperature_2m,relative_humidity_2m,weather_code`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return await fetchOpenMeteoStandard(lat, lon);
      }

      const data = await res.json();
      return processOpenMeteoPayload(data, parseFloat(precLat), parseFloat(precLon));
    } catch (err) {
      console.warn(`Open-Meteo JMA model fetch failed for [${precLat}, ${precLon}], trying standard open route:`, err.message);
      return await fetchOpenMeteoStandard(lat, lon);
    }
  }

  async function fetchOpenMeteoStandard(lat, lon) {
    const precLat = Number(lat).toFixed(4);
    const precLon = Number(lon).toFixed(4);

    const standardUrl = `https://api.open-meteo.com/v1/forecast?latitude=${precLat}&longitude=${precLon}`
      + `&timezone=Asia/Tokyo`
      + `&current=temperature_2m,relative_humidity_2m,weather_code`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(standardUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Open-Meteo Standard HTTP: ${res.status}`);
      const data = await res.json();
      return processOpenMeteoPayload(data, parseFloat(precLat), parseFloat(precLon));
    } catch (fallbackErr) {
      console.warn(`Open-Meteo standard fetch failed for [${precLat}, ${precLon}], utilizing fallback synthetic normal:`, fallbackErr.message);
      return getFallbackWeatherData(parseFloat(precLat), parseFloat(precLon));
    }
  }

  function processOpenMeteoPayload(data, lat, lon) {
    const cur = data.current || {};
    const daily = data.daily || {};

    const temp = cur.temperature_2m !== undefined ? cur.temperature_2m : 18.0;
    const rh = cur.relative_humidity_2m !== undefined ? cur.relative_humidity_2m : 65;
    const weatherCode = cur.weather_code !== undefined ? cur.weather_code : 0;

    const satVaporPress = (rh / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
    const calculatedApparent = temp + 0.33 * satVaporPress - 4.0;
    const apparentTemp = cur.apparent_temperature !== undefined ? cur.apparent_temperature : parseFloat(calculatedApparent.toFixed(1));

    const windSpeed = cur.wind_speed_10m !== undefined ? cur.wind_speed_10m : (daily.wind_speed_10m_max && daily.wind_speed_10m_max[0] ? Math.round(daily.wind_speed_10m_max[0] * 0.65) : 12);
    const windGusts = cur.wind_gusts_10m !== undefined ? cur.wind_gusts_10m : (daily.wind_speed_10m_max && daily.wind_speed_10m_max[0] ? daily.wind_speed_10m_max[0] : Math.round(windSpeed * 1.35));
    const pressure = cur.surface_pressure !== undefined ? cur.surface_pressure : 1013.25;
    const precip = cur.precipitation !== undefined ? cur.precipitation : (daily.precipitation_sum && daily.precipitation_sum[0] ? daily.precipitation_sum[0] : 0.0);

    const conditionText = decodeWmoWeatherCode(weatherCode);
    const wbgt = calculateWbgt(temp, rh);

    let windRisk = 'Calm';
    let windScore = Math.min(100, Math.round((windSpeed / 90) * 100));
    let windFill = 'fill-green';
    if (windSpeed >= 54) {
      windRisk = 'Violent Gale Warning';
      windFill = 'fill-red';
    } else if (windSpeed >= 36) {
      windRisk = 'Gale Advisory';
      windFill = 'fill-amber';
    } else if (windSpeed >= 20) {
      windRisk = 'Moderate Breeze';
      windFill = 'fill-blue';
    }

    let precipRisk = 'None';
    let precipScore = Math.min(100, Math.round((precip / 50) * 100));
    let precipFill = 'fill-green';
    if (precip >= 30) {
      precipRisk = 'Torrential Downpour';
      precipFill = 'fill-red';
    } else if (precip >= 10) {
      precipRisk = 'Heavy Rainfall';
      precipFill = 'fill-amber';
    } else if (precip > 0.5) {
      precipRisk = 'Light / Moderate Rain';
      precipFill = 'fill-blue';
    }

    const forecastDays = [];
    if (daily.time && Array.isArray(daily.time)) {
      for (let i = 0; i < Math.min(7, daily.time.length); i++) {
        forecastDays.push({
          date: daily.time[i],
          label: formatDayLabel(daily.time[i], i),
          weatherCode: daily.weather_code ? daily.weather_code[i] : 0,
          condition: decodeWmoWeatherCode(daily.weather_code ? daily.weather_code[i] : 0),
          tempMax: daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[i]) : 20,
          tempMin: daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[i]) : 12,
          precipSum: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
          precipProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 10,
          windMax: daily.wind_speed_10m_max ? Math.round(daily.wind_speed_10m_max[i]) : 15
        });
      }
    }

    const compositeScore = Math.round(
      wbgt.score * 0.35 +
      precipScore * 0.35 +
      windScore * 0.30
    );

    return {
      temp: parseFloat(temp.toFixed(1)),
      apparentTemp: parseFloat(apparentTemp.toFixed(1)),
      humidity: Math.round(rh),
      windSpeed: parseFloat(windSpeed.toFixed(1)),
      windGusts: parseFloat(windGusts.toFixed(1)),
      pressure: parseFloat(pressure.toFixed(1)),
      precip: parseFloat(precip.toFixed(1)),
      weatherCode: weatherCode,
      conditionText: conditionText,
      wbgt: wbgt,
      windRisk: { text: windRisk, score: windScore, fillClass: windFill },
      precipRisk: { text: precipRisk, score: precipScore, fillClass: precipFill },
      compositeHazard: { score: compositeScore, level: getCompositeSeverity(compositeScore) },
      forecast: forecastDays,
      coords: { lat, lon }
    };
  }

  class WolfxEewClient {
    constructor(onAlertCallback) {
      this.onAlertCallback = onAlertCallback;
      this.socket = null;
      this.pollIntervalId = null;
      this.reconnectTimeoutId = null;
      this.lastEventId = null;
      this.isConnectedWs = false;
      this.isDestroyed = false;
      this.init();
    }

    init() {
      this.connectWebSocket();
      this.pollIntervalId = setInterval(() => {
        if (!this.isConnectedWs && !this.isDestroyed) {
          this.pollHttpEndpoint();
        }
      }, 30000);

      this.pollHttpEndpoint();
    }

    connectWebSocket() {
      if (this.isDestroyed) return;
      try {
        const wsUrl = 'wss://ws-api.wolfx.jp/jma_eew';
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.isConnectedWs = true;
          this.updateStatusBadge('connected', 'JMA EEW LIVE STREAM');
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleEewPayload(data);
          } catch (e) {
            console.error('Error parsing Wolfx WebSocket payload:', e);
          }
        };

        this.socket.onerror = () => {
          this.isConnectedWs = false;
          this.updateStatusBadge('polling', 'JMA MONITOR (POLL)');
        };

        this.socket.onclose = () => {
          this.isConnectedWs = false;
          this.updateStatusBadge('polling', 'JMA MONITOR (POLL)');
          if (this.isDestroyed) return;
          if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
          this.reconnectTimeoutId = setTimeout(() => {
            if (!this.isDestroyed) this.connectWebSocket();
          }, 15000);
        };
      } catch (err) {
        this.isConnectedWs = false;
        this.updateStatusBadge('polling', 'JMA MONITOR (POLL)');
      }
    }

    async pollHttpEndpoint() {
      if (this.isDestroyed) return;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://api.wolfx.jp/jma_eew.json', { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok && !this.isDestroyed) {
          const data = await res.json();
          this.handleEewPayload(data);
        }
      } catch (e) {
      }
    }

    handleEewPayload(data) {
      if (!data || this.isDestroyed) return;

      const isWarn = data.isWarn === true;
      const isCancel = data.isCancel === true;
      const isFinal = data.isFinal === true;
      const mag = data.Magnitude || data.Magunitude || 0.0;
      const hypocenter = data.Hypocenter || 'Unknown';
      const maxInt = data.MaxIntensity || '0';
      const eventId = data.EventID || `${Date.now()}`;

      const alertPayload = {
        eventId: eventId,
        isWarn: isWarn,
        isCancel: isCancel,
        isFinal: isFinal,
        hypocenter: hypocenter,
        magnitude: mag,
        depth: data.Depth || 0,
        maxIntensity: maxInt,
        originTime: data.OriginTime || 'Recent',
        announcedTime: data.AnnouncedTime || '',
        title: data.Title || 'JMA Early Warning Monitor'
      };

      if (isWarn && !isCancel) {
        this.updateStatusBadge('warning', `EEW ACTIVE: ${hypocenter} (Shindo ${maxInt})`);
      } else {
        this.updateStatusBadge('connected', 'JMA NORMAL MONITOR');
      }

      if (typeof this.onAlertCallback === 'function') {
        this.onAlertCallback(alertPayload);
      }
    }

    updateStatusBadge(statusClass, label) {
      const badge = document.getElementById('eew-telemetry-badge');
      const text = document.getElementById('eew-status-text');
      if (badge && text) {
        badge.className = `eew-badge ${statusClass}`;
        text.textContent = label;
      }
    }

    destroy() {
      this.isDestroyed = true;
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }
      if (this.pollIntervalId) {
        clearInterval(this.pollIntervalId);
        this.pollIntervalId = null;
      }
      if (this.socket) {
        try {
          this.socket.onclose = null;
          this.socket.close();
        } catch (e) {
        }
        this.socket = null;
      }
    }
  }

  async function geocodeLocation(query) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cacheKey = trimmed.toLowerCase();
    if (geocodeCache.has(cacheKey)) {
      return geocodeCache.get(cacheKey);
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed + ', Japan')}&countrycodes=jp&format=json&limit=5&addressdetails=1`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JapanSafeWeatherInsights/1.0 (CivilDefense-Research)'
        }
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Nominatim error: ${res.status}`);
      }

      const raw = await res.json();
      const sanitized = raw.map(item => {
        const parsedLat = parseFloat(item.lat);
        const parsedLon = parseFloat(item.lon);
        return {
          displayName: item.display_name,
          name: item.name || trimmed,
          lat: parseFloat(parsedLat.toFixed(4)),
          lon: parseFloat(parsedLon.toFixed(4)),
          latPrecise: parsedLat.toFixed(4),
          lonPrecise: parsedLon.toFixed(4),
          type: item.type || 'locality',
          importance: item.importance || 0
        };
      });

      geocodeCache.set(cacheKey, sanitized);
      return sanitized;
    } catch (err) {
      console.warn('Nominatim geocode query failed, matching local prefecture dictionary:', err.message);
      return matchLocalPrefecture(trimmed);
    }
  }

  function matchLocalPrefecture(query) {
    const q = query.toLowerCase();
    const results = [];
    for (const [key, val] of Object.entries(PREFECTURES)) {
      if (key.includes(q) || val.name.toLowerCase().includes(q) || val.pref.toLowerCase().includes(q)) {
        results.push({
          displayName: `${val.name}, Japan`,
          name: val.name,
          lat: val.lat,
          lon: val.lon,
          type: 'city',
          importance: 0.9
        });
      }
    }
    return results;
  }

  
  function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0; // earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180.0;
    const dLon = (lon2 - lon1) * Math.PI / 180.0;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function decodeWmoWeatherCode(code) {
    switch (code) {
      case 0: return 'Clear Sky';
      case 1: return 'Mainly Clear';
      case 2: return 'Partly Cloudy';
      case 3: return 'Overcast';
      case 45: return 'Fog / Low Visibility';
      case 48: return 'Depositing Rime Fog';
      case 51: return 'Light Drizzle';
      case 53: return 'Moderate Drizzle';
      case 55: return 'Dense Drizzle';
      case 61: return 'Slight Rain';
      case 63: return 'Moderate Rain';
      case 65: return 'Heavy Rain';
      case 71: return 'Slight Snow Fall';
      case 73: return 'Moderate Snow Fall';
      case 75: return 'Heavy Snow Fall';
      case 80: return 'Slight Rain Showers';
      case 81: return 'Moderate Rain Showers';
      case 82: return 'Violent Rain Showers';
      case 95: return 'Thunderstorm';
      case 96: return 'Thunderstorm with Slight Hail';
      case 99: return 'Thunderstorm with Heavy Hail';
      default: return 'Atmospheric Variance';
    }
  }

  function getCompositeSeverity(score) {
    if (score >= 70) return { label: 'CRITICAL', class: 'crit' };
    if (score >= 40) return { label: 'ADVISORY', class: 'warn' };
    return { label: 'OPTIMAL', class: 'norm' };
  }

  function formatIsoTime(ms) {
    const d = new Date(ms);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }

  function formatDayLabel(isoDateStr, index) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const d = new Date(isoDateStr + 'T00:00:00');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${dayNames[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
  }

  function cleanPlaceName(placeStr) {
    if (!placeStr) return 'Japan Offshore';
    return placeStr.replace(/, Japan$/i, '').trim();
  }

  function getFallbackSeismicData() {
    const now = Date.now();
    return [
      {
        id: 'fallback-001',
        title: 'M 4.4 - Off the East Coast of Honshu, Japan',
        place: '100 km ESE of Takahagi',
        mag: 4.4,
        depth: 36,
        lat: 36.415,
        lon: 141.777,
        time: now - 3600000,
        timestampStr: formatIsoTime(now - 3600000),
        shindo: calculateJmaShindo(4.4, 36, 0),
        severity: 'level-normal',
        tagClass: 'norm',
        distToTokyo: 195,
        url: 'https://earthquake.usgs.gov/',
        feltReports: 12,
        tsunami: 0
      },
      {
        id: 'fallback-002',
        title: 'M 4.1 - Hokkaido Region, Japan',
        place: '81 km NE of Esashi',
        mag: 4.1,
        depth: 277,
        lat: 45.353,
        lon: 143.442,
        time: now - 8200000,
        timestampStr: formatIsoTime(now - 8200000),
        shindo: calculateJmaShindo(4.1, 277, 0),
        severity: 'level-normal',
        tagClass: 'norm',
        distToTokyo: 1110,
        url: 'https://earthquake.usgs.gov/',
        feltReports: 2,
        tsunami: 0
      },
      {
        id: 'fallback-003',
        title: 'M 5.1 - Izu Islands Region',
        place: 'Izu Ridge Subduction Zone',
        mag: 5.1,
        depth: 18,
        lat: 33.120,
        lon: 139.810,
        time: now - 18400000,
        timestampStr: formatIsoTime(now - 18400000),
        shindo: calculateJmaShindo(5.1, 18, 0),
        severity: 'level-alert',
        tagClass: 'warn',
        distToTokyo: 285,
        url: 'https://earthquake.usgs.gov/',
        feltReports: 45,
        tsunami: 0
      }
    ];
  }

  function getFallbackWeatherData(lat, lon) {
    return {
      temp: 18.5,
      apparentTemp: 18.0,
      humidity: 64,
      windSpeed: 11.2,
      windGusts: 16.5,
      pressure: 1017.4,
      precip: 0.0,
      weatherCode: 1,
      conditionText: 'Mainly Clear',
      wbgt: calculateWbgt(18.5, 64),
      windRisk: { text: 'Calm', score: 12, fillClass: 'fill-green' },
      precipRisk: { text: 'None', score: 0, fillClass: 'fill-green' },
      compositeHazard: { score: 18, level: { label: 'OPTIMAL', class: 'norm' } },
      forecast: [
        { date: '2026-10-17', label: 'Today', weatherCode: 0, condition: 'Clear Sky', tempMax: 23, tempMin: 15, precipSum: 0, precipProb: 0, windMax: 12 },
        { date: '2026-10-18', label: 'Tomorrow', weatherCode: 1, condition: 'Mainly Clear', tempMax: 22, tempMin: 13, precipSum: 0, precipProb: 0, windMax: 10 },
        { date: '2026-10-19', label: 'Mon 10/19', weatherCode: 2, condition: 'Partly Cloudy', tempMax: 26, tempMin: 15, precipSum: 0, precipProb: 5, windMax: 14 },
        { date: '2026-10-20', label: 'Tue 10/20', weatherCode: 61, condition: 'Slight Rain', tempMax: 28, tempMin: 19, precipSum: 2, precipProb: 65, windMax: 16 },
        { date: '2026-10-21', label: 'Wed 10/21', weatherCode: 63, condition: 'Moderate Rain', tempMax: 29, tempMin: 20, precipSum: 8, precipProb: 80, windMax: 24 },
        { date: '2026-10-22', label: 'Thu 10/22', weatherCode: 2, condition: 'Partly Cloudy', tempMax: 25, tempMin: 16, precipSum: 0, precipProb: 15, windMax: 14 },
        { date: '2026-10-23', label: 'Fri 10/23', weatherCode: 0, condition: 'Clear Sky', tempMax: 21, tempMin: 14, precipSum: 0, precipProb: 0, windMax: 9 }
      ],
      coords: { lat, lon }
    };
  }

  return {
    PREFECTURES,
    CLIMATE_NORMALS,
    calculateJmaShindo,
    calculateWbgt,
    fetchUsgsSeismicEvents,
    fetchOpenMeteoWeather,
    WolfxEewClient,
    geocodeLocation,
    calculateHaversineDistance,
    decodeWmoWeatherCode
  };
})();

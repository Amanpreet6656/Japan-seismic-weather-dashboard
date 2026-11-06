
const ChartsEngine = (() => {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentPrefectureKey = 'tokyo';

  const PREFECTURE_RECOMMENDATIONS = {
    tokyo: {
      badge: 'Low Climatological Risk: March - May',
      subtext: 'Optimal operational envelope; moderate temperatures (14-23°C) and baseline precipitation prior to summer cyclonic season.',
      events: ['Midwinter Minimum', 'Late Winter Cool', 'Spring Thermal Rise', 'Mild Spring Range', 'Early Summer Inflow', 'Tsuyu Frontal Rainfall', 'Summer Thermal High', 'Cyclonic Peak Threat', 'Autumn Frontal Rain', 'Autumn Stability', 'Late Autumn Cool', 'Winter Solstice Minimum']
    },
    osaka: {
      badge: 'Low Climatological Risk: March - May & Oct - Nov',
      subtext: 'Favorable operational window with stable barometric pressure and low tropical cyclone approach probability.',
      events: ['Midwinter Cold', 'Late Winter Dry', 'Spring Warming', 'Mild Mid-Spring', 'Early Summer Stability', 'Tsuyu Heavy Rain Front', 'Midsummer Highs', 'Typhoon Approach Window', 'Autumn Transition', 'Moderate Autumn Norms', 'Late Autumn Cooling', 'Early Winter Dry']
    },
    kyoto: {
      badge: 'Low Climatological Risk: April & Oct - Nov',
      subtext: 'Inland basin climatology with stable spring/autumn thermal profiles and lower precipitation risk.',
      events: ['Inland Basin Cold', 'Late Winter Dry', 'Spring Thermal Rise', 'Optimal Mild Spring', 'Early Summer Inflow', 'Tsuyu Frontal Inundation', 'Intense Basin Heat', 'Cyclonic Threat Window', 'Autumn Frontal Equinox', 'Stable Autumn Range', 'Late Autumn Transition', 'Winter Basin Chilling']
    },
    sapporo: {
      badge: 'Low Climatological Risk: June - Aug',
      subtext: 'Sub-boreal climate with minimal typhoon vulnerability and moderate summer thermal maximum (22-27°C).',
      events: ['Sub-Zero Snowpack', 'Peak Winter Freezing', 'Early Spring Thaw', 'Late Spring Warming', 'Moderate Early Summer', 'Mild Summer Envelope', 'Summer Thermal Peak', 'Late Summer Transition', 'Early Autumn Chill', 'First Frost / Sub-Zero', 'Snowpack Accumulation', 'Deep Winter Freezing']
    },
    fukuoka: {
      badge: 'Low Climatological Risk: March - May & Oct - Nov',
      subtext: 'Maritime climate; monitor active Pacific typhoon tracks through Tsushima Strait during August-September.',
      events: ['Mild Winter Maritime', 'Late Winter Warming', 'Spring Thermal Rise', 'Optimal Mild Spring', 'Early Summer Stability', 'Tsuyu Inundation Peak', 'Summer Marine Heat', 'Peak Typhoon Trajectory', 'Late Summer Recovery', 'Stable Autumn Range', 'Late Autumn Cooling', 'Winter Marine Transition']
    },
    naha: {
      badge: 'Low Climatological Risk: Feb - April & Nov - Dec',
      subtext: 'Subtropical island arc; peak typhoon activity occurs July-September with oceanic wave action.',
      events: ['Subtropical Mild Winter', 'Winter-Spring Transition', 'Spring Marine Envelope', 'Pre-Summer Warming', 'Early Summer Heat', 'Subtropical Humid High', 'Midsummer Thermal Peak', 'Peak Typhoon Activity', 'Late Monsoon Transition', 'Moderate Autumn Range', 'Marine Breeze Stability', 'Subtropical Winter Baseline']
    },
    sendai: {
      badge: 'Low Climatological Risk: May - June & Sept - Oct',
      subtext: 'Pacific Tohoku coastal node; moderate oceanic summer tempering and low winter convective precipitation.',
      events: ['Cold Pacific Winds', 'Late Winter Freeze', 'Spring Soil Thaw', 'Spring Thermal Transition', 'Early Summer Envelope', 'Mild Tsuyu Influence', 'Maritime Summer High', 'Cyclonic Track Window', 'Autumn Frontal Stability', 'Late Autumn Transition', 'Early Winter Frost', 'Midwinter Cold Baseline']
    },
    hiroshima: {
      badge: 'Low Climatological Risk: March - May & Oct - Nov',
      subtext: 'Seto Inland Sea sheltered zone; reduced annual precipitation with low winter seismic recurrence baseline.',
      events: ['Seto Inland Cold', 'Late Winter Stability', 'Spring Warming Trend', 'Mild Spring Sun', 'Early Summer Stability', 'Tsuyu Rain Front', 'Midsummer Heat Envelope', 'Typhoon Buffer Zone', 'Pleasant Autumn Stability', 'Stable Autumn Range', 'Late Autumn Cooling', 'Winter Chilling Baseline']
    },
    kanazawa: {
      badge: 'Low Climatological Risk: April - June & Oct',
      subtext: 'Sea of Japan coastal zone; heavy winter precipitation from Siberian convective air masses (Nov-Feb).',
      events: ['Sea of Japan Snowfall', 'Heavy Winter Moisture', 'Spring Snowmelt Thaw', 'Spring Thermal Envelope', 'Early Summer Stability', 'Tsuyu Heavy Rain Front', 'Summer Humid Highs', 'Maritime Storm Window', 'Autumn Transition', 'Autumn Frontal Rainfall', 'Winter Convective Storms', 'Heavy Snow Accumulation']
    },
    nagano: {
      badge: 'Low Climatological Risk: May - June & Sept - Oct',
      subtext: 'Highland alpine basin with dry air mass; sub-zero winter temperatures and heavy alpine snowfall.',
      events: ['Alpine Sub-Zero Freeze', 'Deep Mountain Snowpack', 'Late Mountain Thaw', 'Valley Spring Rise', 'Fresh Alpine Stability', 'Cool Mountain Summer', 'Highland Thermal Peak', 'Late Summer Alpine Sun', 'Autumn Valley Transition', 'Alpine Sub-Zero Frost', 'Early Winter Freezing', 'Midwinter Snowpack Peak']
    }
  };

    function initCharts(prefKey = 'tokyo') {
    currentPrefectureKey = prefKey;
    renderAllCharts();
  }

  function renderAllCharts() {
    const data = API.CLIMATE_NORMALS[currentPrefectureKey] || API.CLIMATE_NORMALS.tokyo;
    const recom = PREFECTURE_RECOMMENDATIONS[currentPrefectureKey] || PREFECTURE_RECOMMENDATIONS.tokyo;

    const badgeTextEl = document.getElementById('planner-recom-text');
    const subtextEl = document.getElementById('planner-subtext');
    if (badgeTextEl) badgeTextEl.textContent = recom.badge;
    if (subtextEl) subtextEl.textContent = recom.subtext;

    renderHeroCalendarChart(data.tempHigh, data.tempLow, data.precip, recom.events);

    renderTemperatureChart(data.tempHigh, data.tempLow);
    renderPrecipitationChart(data.precip);
    renderTyphoonChart(data.typhoonIndex);
    renderSeismicChart(data.seismicBaseline);
    renderFeasibilityMatrix(data);
  }

  function renderHeroCalendarChart(highs, lows, precip, seasonalEvents) {
    const container = document.getElementById('chart-hero-calendar-svg');
    if (!container) return;

    const width = 960;
    const height = 320;
    const padding = { top: 35, right: 55, bottom: 45, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const meanTemps = highs.map((h, i) => parseFloat(((h + lows[i]) / 2).toFixed(1)));
    const minTemp = -10;
    const maxTemp = 38;
    const tempRange = maxTemp - minTemp;
    const maxPrecip = 360;

    const getX = (i) => padding.left + (i / 11) * chartW;
    const getYTemp = (val) => padding.top + chartH - ((val - minTemp) / tempRange) * chartH;
    const getYPrecip = (val) => padding.top + chartH - (val / maxPrecip) * chartH;

    let tempAreaD = `M ${getX(0)} ${padding.top + chartH}`;
    for (let i = 0; i < 12; i++) tempAreaD += ` L ${getX(i)} ${getYTemp(meanTemps[i])}`;
    tempAreaD += ` L ${getX(11)} ${padding.top + chartH} Z`;

    let tempLineD = `M ${getX(0)} ${getYTemp(meanTemps[0])}`;
    for (let i = 1; i < 12; i++) tempLineD += ` L ${getX(i)} ${getYTemp(meanTemps[i])}`;

    let precipAreaD = `M ${getX(0)} ${padding.top + chartH}`;
    for (let i = 0; i < 12; i++) precipAreaD += ` L ${getX(i)} ${getYPrecip(precip[i])}`;
    precipAreaD += ` L ${getX(11)} ${padding.top + chartH} Z`;

    let precipLineD = `M ${getX(0)} ${getYPrecip(precip[0])}`;
    for (let i = 1; i < 12; i++) precipLineD += ` L ${getX(i)} ${getYPrecip(precip[i])}`;

    let gridLinesHtml = '';
    for (let s = 0; s <= 4; s++) {
      const stepTemp = minTemp + (s / 4) * tempRange;
      const stepPrecip = (s / 4) * maxPrecip;
      const yPos = getYTemp(stepTemp);

      gridLinesHtml += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" class="chart-grid-line" />
        <text x="${padding.left - 10}" y="${yPos + 4}" text-anchor="end" class="chart-axis-label" style="fill: var(--color-slate-muted); font-family: var(--font-mono); font-size: 10px;">${Math.round(stepTemp)}°C</text>
        <text x="${width - padding.right + 10}" y="${yPos + 4}" text-anchor="start" class="chart-axis-label" style="fill: #3B82F6; font-family: var(--font-mono); font-size: 10px;">${Math.round(stepPrecip)}mm</text>
      `;
    }

    let verticesHtml = '';
    for (let i = 0; i < 12; i++) {
      const x = getX(i);
      const yt = getYTemp(meanTemps[i]);
      const yp = getYPrecip(precip[i]);
      verticesHtml += `
        <text x="${x}" y="${height - 15}" text-anchor="middle" class="chart-axis-label" style="fill: var(--color-pure-white); font-weight: 600; font-size: 11px;">${MONTHS[i]}</text>
        <circle cx="${x}" cy="${yt}" r="4.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1.5" class="chart-vertex vertex-temp" data-month="${i}" />
        <circle cx="${x}" cy="${yp}" r="4" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1.5" class="chart-vertex vertex-precip" data-month="${i}" />
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg hero-chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroTempGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#10B981" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="heroPrecipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <path d="${precipAreaD}" fill="url(#heroPrecipGrad)" />
        <path d="${tempAreaD}" fill="url(#heroTempGrad)" />
        <path d="${precipLineD}" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="6, 5" stroke-linecap="round" />
        <path d="${tempLineD}" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" />
        <line id="hero-calendar-crosshair" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + chartH}" class="chart-crosshair" style="opacity: 0; stroke: #CBD5E1; stroke-dasharray: 3, 3; stroke-width: 1px;" />
        ${verticesHtml}
      </svg>
    `;

    bindHeroHoverEvents(container, highs, lows, precip, meanTemps, seasonalEvents);
  }

  function bindHeroHoverEvents(container, highs, lows, precip, meanTemps, seasonalEvents) {
    const svgEl = container.querySelector('svg');
    const crosshairEl = container.querySelector('#hero-calendar-crosshair');
    const tooltipBox = document.getElementById('hero-chart-tooltip') || container.nextElementSibling;
    if (!svgEl || !crosshairEl || !tooltipBox) return;

    svgEl.addEventListener('mousemove', (e) => {
      const rect = svgEl.getBoundingClientRect();
      if (!rect.width || rect.width === 0) return;
      const clientX = e.clientX - rect.left;
      const svgW = rect.width;
      const normX = Math.max(0, Math.min(1, clientX / svgW));
      const idx = Math.min(11, Math.max(0, Math.round(normX * 11)));

      const xPosSvg = 55 + (idx / 11) * (960 - 55 - 55);
      crosshairEl.setAttribute('x1', xPosSvg);
      crosshairEl.setAttribute('x2', xPosSvg);
      crosshairEl.style.opacity = '1';

      const eventNote = seasonalEvents && seasonalEvents[idx] ? seasonalEvents[idx] : 'Standard Seasonal Flow';
      tooltipBox.style.display = 'block';
      tooltipBox.style.left = `${Math.min(rect.width - 220, Math.max(10, clientX - 80))}px`;
      tooltipBox.style.top = `${Math.max(10, (e.clientY - rect.top) - 95)}px`;
      tooltipBox.innerHTML = `
        <div style="font-weight: 700; color: #FFFFFF; font-size: 12px; margin-bottom: 4px; border-bottom: 1px solid var(--color-slate-border); padding-bottom: 2px;">
          ${MONTHS[idx]} Telemetric Profile
        </div>
        <div style="display: flex; justify-content: space-between; gap: 12px; font-family: var(--font-mono); font-size: 11px;">
          <span style="color: #10B981;">Mean Temp:</span>
          <strong>${meanTemps[idx]}°C (${lows[idx]}°C to ${highs[idx]}°C)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 12px; font-family: var(--font-mono); font-size: 11px;">
          <span style="color: #3B82F6;">Precipitation:</span>
          <strong>${precip[idx]} mm</strong>
        </div>
        <div style="margin-top: 4px; font-size: 10px; color: var(--color-slate-muted);">
          Note: ${eventNote}
        </div>
      `;
    });

    svgEl.addEventListener('mouseleave', () => {
      crosshairEl.style.opacity = '0';
      tooltipBox.style.display = 'none';
    });
  }

  function renderTemperatureChart(highs, lows) {
    const container = document.getElementById('chart-temperature-svg');
    if (!container) return;

    const width = 580;
    const height = 220;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const allVals = highs.concat(lows);
    const minVal = Math.floor(Math.min(...allVals) / 5) * 5;
    const maxVal = Math.ceil(Math.max(...allVals) / 5) * 5;
    const range = maxVal - minVal || 1;

    const getX = (i) => padding.left + (i / 11) * chartW;
    const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

    let areaD = `M ${getX(0)} ${getY(highs[0])}`;
    for (let i = 1; i < 12; i++) areaD += ` L ${getX(i)} ${getY(highs[i])}`;
    for (let i = 11; i >= 0; i--) areaD += ` L ${getX(i)} ${getY(lows[i])}`;
    areaD += ' Z';

    let highLineD = `M ${getX(0)} ${getY(highs[0])}`;
    for (let i = 1; i < 12; i++) highLineD += ` L ${getX(i)} ${getY(highs[i])}`;

    let lowLineD = `M ${getX(0)} ${getY(lows[0])}`;
    for (let i = 1; i < 12; i++) lowLineD += ` L ${getX(i)} ${getY(lows[i])}`;

    let gridLinesHtml = '';
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const stepVal = minVal + (s / steps) * range;
      const yPos = getY(stepVal);
      gridLinesHtml += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" class="chart-grid-line" />
        <text x="${padding.left - 8}" y="${yPos + 3}" text-anchor="end" class="chart-axis-label">${Math.round(stepVal)}°C</text>
      `;
    }

    let verticesHtml = '';
    for (let i = 0; i < 12; i++) {
      const x = getX(i);
      verticesHtml += `
        <text x="${x}" y="${height - 12}" class="chart-axis-label">${MONTHS[i]}</text>
        <circle cx="${x}" cy="${getY(highs[i])}" r="3.5" fill="#E11D48" stroke="#FFFFFF" stroke-width="1" class="chart-vertex" data-month="${i}" data-val-hi="${highs[i]}" data-val-lo="${lows[i]}" />
        <circle cx="${x}" cy="${getY(lows[i])}" r="3.5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1" class="chart-vertex" data-month="${i}" data-val-hi="${highs[i]}" data-val-lo="${lows[i]}" />
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tempAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#E11D48" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#E11D48" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <path d="${areaD}" fill="url(#tempAreaGrad)" />
        <path d="${highLineD}" fill="none" stroke="#E11D48" stroke-width="2" />
        <path d="${lowLineD}" fill="none" stroke="#3B82F6" stroke-width="2" />
        <line id="temp-crosshair" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + chartH}" class="chart-crosshair" />
        ${verticesHtml}
      </svg>
    `;

    bindHoverEvents(container, 'temp-crosshair', (idx) => {
      return `<strong>${MONTHS[idx]}</strong><br>Mean High: ${highs[idx]}°C<br>Mean Low: ${lows[idx]}°C<br>Diurnal Span: ${(highs[idx] - lows[idx]).toFixed(1)}°C`;
    });
  }

  function renderPrecipitationChart(precip) {
    const container = document.getElementById('chart-precip-svg');
    if (!container) return;

    const width = 580;
    const height = 220;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.ceil(Math.max(...precip, 300) / 50) * 50;
    const getX = (i) => padding.left + (i / 11) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

    let areaD = `M ${getX(0)} ${getY(0)}`;
    for (let i = 0; i < 12; i++) areaD += ` L ${getX(i)} ${getY(precip[i])}`;
    areaD += ` L ${getX(11)} ${getY(0)} Z`;

    let lineD = `M ${getX(0)} ${getY(precip[0])}`;
    for (let i = 1; i < 12; i++) lineD += ` L ${getX(i)} ${getY(precip[i])}`;

    let gridLinesHtml = '';
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const stepVal = (s / steps) * maxVal;
      const yPos = getY(stepVal);
      gridLinesHtml += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" class="chart-grid-line" />
        <text x="${padding.left - 8}" y="${yPos + 3}" text-anchor="end" class="chart-axis-label">${Math.round(stepVal)} mm</text>
      `;
    }

    let verticesHtml = '';
    for (let i = 0; i < 12; i++) {
      const x = getX(i);
      verticesHtml += `
        <text x="${x}" y="${height - 12}" class="chart-axis-label">${MONTHS[i]}</text>
        <circle cx="${x}" cy="${getY(precip[i])}" r="3.5" fill="#3B82F6" stroke="#FFFFFF" stroke-width="1" class="chart-vertex" data-month="${i}" data-val="${precip[i]}" />
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="precipAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.05" />
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <path d="${areaD}" fill="url(#precipAreaGrad)" />
        <path d="${lineD}" fill="none" stroke="#3B82F6" stroke-width="2" />
        <line id="precip-crosshair" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + chartH}" class="chart-crosshair" />
        ${verticesHtml}
      </svg>
    `;

    bindHoverEvents(container, 'precip-crosshair', (idx) => {
      const isTsuyu = (idx === 5 || idx === 6);
      const isTyphoonRain = (idx === 8 || idx === 9);
      let note = 'Standard Precipitation';
      if (isTsuyu) note = 'Tsuyu (梅雨) Rainy Season';
      if (isTyphoonRain) note = 'Autumn Typhoon Rainfall Peak';
      return `<strong>${MONTHS[idx]}</strong><br>Rainfall: ${precip[idx]} mm<br>Regime: ${note}`;
    });
  }

  function renderTyphoonChart(typhoonIndices) {
    const container = document.getElementById('chart-typhoon-svg');
    if (!container) return;

    const width = 580;
    const height = 220;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = 100;
    const getX = (i) => padding.left + (i / 11) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

    let areaD = `M ${getX(0)} ${getY(0)}`;
    for (let i = 0; i < 12; i++) areaD += ` L ${getX(i)} ${getY(typhoonIndices[i])}`;
    areaD += ` L ${getX(11)} ${getY(0)} Z`;

    let lineD = `M ${getX(0)} ${getY(typhoonIndices[0])}`;
    for (let i = 1; i < 12; i++) lineD += ` L ${getX(i)} ${getY(typhoonIndices[i])}`;

    let gridLinesHtml = '';
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const stepVal = (s / steps) * maxVal;
      const yPos = getY(stepVal);
      gridLinesHtml += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" class="chart-grid-line" />
        <text x="${padding.left - 8}" y="${yPos + 3}" text-anchor="end" class="chart-axis-label">${Math.round(stepVal)}</text>
      `;
    }

    let verticesHtml = '';
    for (let i = 0; i < 12; i++) {
      const x = getX(i);
      verticesHtml += `
        <text x="${x}" y="${height - 12}" class="chart-axis-label">${MONTHS[i]}</text>
        <circle cx="${x}" cy="${getY(typhoonIndices[i])}" r="3.5" fill="#D97706" stroke="#FFFFFF" stroke-width="1" class="chart-vertex" data-month="${i}" data-val="${typhoonIndices[i]}" />
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="typhoonAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#D97706" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#D97706" stop-opacity="0.05" />
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <path d="${areaD}" fill="url(#typhoonAreaGrad)" />
        <path d="${lineD}" fill="none" stroke="#D97706" stroke-width="2" />
        <line id="typhoon-crosshair" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + chartH}" class="chart-crosshair" />
        ${verticesHtml}
      </svg>
    `;

    bindHoverEvents(container, 'typhoon-crosshair', (idx) => {
      const score = typhoonIndices[idx];
      let threat = 'Minimal Threat';
      if (score >= 80) threat = 'Severe Cyclonic Threat';
      else if (score >= 40) threat = 'Elevated Approach Risk';
      else if (score >= 15) threat = 'Low / Seasonal Transitory';
      return `<strong>${MONTHS[idx]}</strong><br>Typhoon Risk Index: ${score}/100<br>Assessment: ${threat}`;
    });
  }

  function renderSeismicChart(baseline) {
    const container = document.getElementById('chart-seismic-svg');
    if (!container) return;

    const width = 580;
    const height = 220;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.ceil(Math.max(...baseline, 25) / 5) * 5;
    const getX = (i) => padding.left + (i / 11) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxVal) * chartH;

    let areaD = `M ${getX(0)} ${getY(0)}`;
    for (let i = 0; i < 12; i++) areaD += ` L ${getX(i)} ${getY(baseline[i])}`;
    areaD += ` L ${getX(11)} ${getY(0)} Z`;

    let lineD = `M ${getX(0)} ${getY(baseline[0])}`;
    for (let i = 1; i < 12; i++) lineD += ` L ${getX(i)} ${getY(baseline[i])}`;

    let gridLinesHtml = '';
    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const stepVal = (s / steps) * maxVal;
      const yPos = getY(stepVal);
      gridLinesHtml += `
        <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" class="chart-grid-line" />
        <text x="${padding.left - 8}" y="${yPos + 3}" text-anchor="end" class="chart-axis-label">${Math.round(stepVal)} evts</text>
      `;
    }

    let verticesHtml = '';
    for (let i = 0; i < 12; i++) {
      const x = getX(i);
      verticesHtml += `
        <text x="${x}" y="${height - 12}" class="chart-axis-label">${MONTHS[i]}</text>
        <circle cx="${x}" cy="${getY(baseline[i])}" r="3.5" fill="#10B981" stroke="#FFFFFF" stroke-width="1" class="chart-vertex" data-month="${i}" data-val="${baseline[i]}" />
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="seismicAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#10B981" stop-opacity="0.05" />
          </linearGradient>
        </defs>
        ${gridLinesHtml}
        <path d="${areaD}" fill="url(#seismicAreaGrad)" />
        <path d="${lineD}" fill="none" stroke="#10B981" stroke-width="2" />
        <line id="seismic-crosshair" x1="0" y1="${padding.top}" x2="0" y2="${padding.top + chartH}" class="chart-crosshair" />
        ${verticesHtml}
      </svg>
    `;

    bindHoverEvents(container, 'seismic-crosshair', (idx) => {
      return `<strong>${MONTHS[idx]}</strong><br>Mean Baseline: ${baseline[idx]} events/mo<br>Magnitude: M3.0+ Clustered`;
    });
  }

  function bindHoverEvents(containerEl, crosshairId, tooltipFormatter) {
    const svgEl = containerEl.querySelector('svg');
    const crosshairEl = document.getElementById(crosshairId);
    const tooltipBox = containerEl.parentElement ? containerEl.parentElement.querySelector('.chart-tooltip-box') : null;
    if (!svgEl || !crosshairEl || !tooltipBox) return;

    svgEl.addEventListener('mousemove', (e) => {
      const rect = svgEl.getBoundingClientRect();
      if (!rect.width || rect.width === 0) return;
      const relativeX = e.clientX - rect.left;
      const viewBoxWidth = 580;
      const scale = viewBoxWidth / rect.width;
      const svgX = relativeX * scale;

      const paddingLeft = 45;
      const chartW = 580 - 45 - 30;

      let nearestIdx = Math.round(((svgX - paddingLeft) / chartW) * 11);
      nearestIdx = Math.max(0, Math.min(11, nearestIdx));

      const snappedX = paddingLeft + (nearestIdx / 11) * chartW;

      crosshairEl.setAttribute('x1', snappedX);
      crosshairEl.setAttribute('x2', snappedX);
      crosshairEl.style.opacity = '1';

      tooltipBox.innerHTML = tooltipFormatter(nearestIdx);
      tooltipBox.style.display = 'block';
    });

    svgEl.addEventListener('mouseleave', () => {
      crosshairEl.style.opacity = '0';
      tooltipBox.style.display = 'none';
    });
  }

  function renderFeasibilityMatrix(data) {
    const container = document.getElementById('feasibility-matrix-grid');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < 12; i++) {
      const hi = data.tempHigh[i];
      const precip = data.precip[i];
      const typhoon = data.typhoonIndex[i];

      let score = 100;
      if (hi > 30) score -= (hi - 30) * 8;
      if (hi < 5) score -= (5 - hi) * 4;
      if (precip > 150) score -= ((precip - 150) / 20) * 5;
      if (typhoon > 40) score -= ((typhoon - 40) / 20) * 10;
      score = Math.max(25, Math.min(98, Math.round(score)));

      let scoreClass = 'score-high';
      let tagText = 'Optimal';
      let tagColor = '#10B981';

      if (score < 60) {
        scoreClass = 'score-low';
        tagText = 'Advisory';
        tagColor = '#E11D48';
      } else if (score < 80) {
        scoreClass = 'score-med';
        tagText = 'Moderate';
        tagColor = '#D97706';
      }

      const cell = document.createElement('div');
      cell.className = `month-feasibility-cell ${scoreClass}`;
      cell.innerHTML = `
        <div class="feas-month-name">${MONTHS[i]}</div>
        <div class="feas-score-val">${score}</div>
        <div class="feas-risk-tag" style="color: ${tagColor};">${tagText}</div>
      `;
      container.appendChild(cell);
    }
  }

  function setPrefecture(prefKey) {
    currentPrefectureKey = prefKey;
    renderAllCharts();
  }

  return {
    initCharts,
    setPrefecture
  };
})();

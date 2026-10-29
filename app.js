/* TAsF – Travel and Surf · UI controller (prototype) */
(function () {
  'use strict';
  const DESTS = window.TASF_DESTINATIONS;
  const ORIGINS = window.TASF_ORIGINS;
  const P = window.TASF_PLANNER;
  const I18N = window.TASF_I18N;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const iso = d => d.toISOString().slice(0, 10);
  const today = new Date();
  const plus = n => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  const state = {
    lang: (localStorage.getItem('tasf-lang') || 'en'),
    step: 0, maxStep: 0,
    dateMode: 'flexible', anyTime: true, months: [], start: plus(30), end: plus(37), duration: 7, durationTouched: false,
    level: null, tripType: null, origin: 'MAD', budget: 1500, budgetSet: false, waves: [], waveQuery: '',
    selected: null
  };
  let t = I18N[state.lang];
  const dname = d => P.displayName(d, state.lang);
  const cname = d => (t.countries && t.countries[d.country]) || d.country;

  /* ---------------- SURF FORECAST (Open-Meteo, refreshed daily by scripts/update_forecast.py) ----------------
   * forecast.js sets window.TASF_FORECAST so it works from file:// too. Over http(s) we also
   * fetch forecast.json and use it if it is newer. Older than 48 h → "forecast unavailable". */
  const FC_MAX_AGE = 48 * 3600e3;
  const localIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const SF_LINKS = (window.TASF_SF_LINKS && window.TASF_SF_LINKS.links) || {};
  let FC = null;
  const validFc = doc => doc && typeof doc === 'object' && doc.generatedAt && doc.spots && !isNaN(Date.parse(doc.generatedAt));
  if (validFc(window.TASF_FORECAST)) FC = window.TASF_FORECAST;
  function fcStatus() { return !FC ? 'missing' : (Date.now() - Date.parse(FC.generatedAt) > FC_MAX_AGE ? 'stale' : 'ok'); }
  function spotForecast(id) {
    if (fcStatus() !== 'ok') return null;
    const s = FC.spots[id]; if (!s || !Array.isArray(s.days)) return null;
    if (Date.now() - Date.parse(s.updatedAt || FC.generatedAt) > FC_MAX_AGE) return null;
    const todayIso = localIso(new Date());
    const days = s.days.filter(d => d.date >= todayIso).slice(0, 7);
    return days.length ? { ...s, days } : null;
  }
  const fcCtx = () => ({ spot: spotForecast, today: localIso(new Date()) });
  let evals = new Map();   // id -> evaluation
  let ranking = [];

  /* ---------------- MAP (Leaflet + free light base tiles) ----------------
   * Google-Maps-style map: smooth wheel / pinch zoom from the whole world down to street level,
   * drag to pan. Base layer: OpenStreetMap tiles in greyscale (or CARTO Positron with a key),
   * loaded on demand only (no prefetching). If tiles can't load (offline, blocked), a simple vector
   * world outline (vendor/land-50m.js) is drawn instead, so markers always have a background.
   * Destinations are season-coloured SVG markers inside Leaflet divIcons + a soft coloured zone
   * (L.circle, ~25 km) that becomes visible when you zoom in to regional level. */
  const mapWrap = $('.map-wrap');
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const WORLD = L.latLngBounds([-56, -168], [72, 192]);   // the 53 spots, centred on Europe/Africa
  const map = L.map('map', {
    zoomControl: false, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 110, wheelDebounceTime: 20,
    minZoom: 1, maxZoom: 18, worldCopyJump: false, inertia: true,
    maxBounds: L.latLngBounds([-84, -100000], [86, 100000]), maxBoundsViscosity: 1
  });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  map.createPane('fallback').style.zIndex = 150;          // under the tiles (tilePane = 200)
  const zonePane = map.createPane('zones'); zonePane.style.zIndex = 350; zonePane.style.pointerEvents = 'none';
  const zoneRenderer = L.svg({ pane: 'zones', padding: 0.3 });
  /* Base tiles. Default: OpenStreetMap standard tiles (tile.openstreetmap.org, free, attribution
   * required, light use only per https://operations.osmfoundation.org/policies/tiles/), shown in
   * greyscale via CSS (.tiles-osm) to keep the minimal black/white look. CARTO "Positron" raster
   * tiles need a (free) API key since 25 Sep 2026: set window.TASF_CONFIG = { cartoKey: '…' }
   * before app.js to use them instead. */
  const CFG = window.TASF_CONFIG || {};
  const tiles = CFG.cartoKey
    ? L.tileLayer('https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=' + encodeURIComponent(CFG.cartoKey), {
        maxZoom: 20, keepBuffer: 2,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>' }).addTo(map)
    : L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, keepBuffer: 2, className: 'tiles-osm',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' }).addTo(map);
  let tileOk = 0, tileErr = 0, fallback = null;
  function useFallback() {
    if (fallback) return;
    const land = topojson.feature(window.LAND_TOPO, window.LAND_TOPO.objects.land);
    fallback = L.geoJSON(land, { pane: 'fallback', interactive: false, renderer: L.canvas({ pane: 'fallback' }), style: { fillColor: '#dedbd3', fillOpacity: 1, color: '#cfccc4', weight: 0.6 } }).addTo(map);
    mapWrap.classList.add('tiles-off'); $('#mapNote').hidden = false;
  }
  tiles.on('tileload', () => { tileOk++; if (fallback) { mapWrap.classList.remove('tiles-off'); $('#mapNote').hidden = true; } });
  tiles.on('tileerror', () => { tileErr++; if (!tileOk && tileErr >= 4) useFallback(); });
  if (navigator.onLine === false) useFallback();
  setTimeout(() => { if (!tileOk) useFallback(); }, 8000);

  let markers = {}, layers = {}, zones = {}, W = 0, H = 0;
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const SEASON_COL = [cssVar('--r0') || '#b9c3ca', cssVar('--r1') || '#f2c443', cssVar('--r2') || '#6cc36f', cssVar('--r3') || '#0b7a3b'];
  /** on-screen scale of a marker: a bit smaller on narrow maps, slowly growing as you zoom in */
  function markerScale() { const z = map.getZoom(); return Math.max(0.6, Math.min(1, W / 1000)) * Math.min(1.45, 1 + Math.max(0, z - map.getMinZoom()) * 0.06); }
  function buildMarkers() {
    DESTS.forEach(d => {
      const m = L.marker([d.lat, d.lon], { icon: L.divIcon({ className: 'mk', iconSize: [0, 0], html: '' }), keyboard: false, interactive: false }).addTo(map);
      const root = m.getElement();
      const s = el('svg', { class: 'mk-svg', width: 1, height: 1, overflow: 'visible' }, root);
      const line = el('line', { class: 'leader', x1: 0, y1: 0, x2: 0, y2: 0 }, s);
      const anchor = el('circle', { class: 'anchor', r: 1.8 }, s);
      const g = el('g', { class: 'marker', 'data-id': d.id, tabindex: 0, role: 'button', 'aria-label': `${d.name}, ${d.country}` }, s);
      el('circle', { class: 'halo', r: 15 }, g);
      el('circle', { class: 'ring', r: 11 }, g);
      el('circle', { class: 'dot', r: 6 }, g);
      el('text', { class: 'rank', y: 3.5 }, g).textContent = '';
      g._line = line; g._anchor = anchor;
      L.DomEvent.disableClickPropagation(g);
      g.addEventListener('mouseenter', e => { if (state.selected !== d.id) showTip(d, e); });
      g.addEventListener('mousemove', moveTip);
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', e => { e.stopPropagation(); selectDest(d.id, { pan: 'ensure' }); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDest(d.id, { pan: 'ensure' }); } });
      markers[d.id] = g; layers[d.id] = m;
      zones[d.id] = L.circle([d.lat, d.lon], { radius: 25000, renderer: zoneRenderer, pane: 'zones', interactive: false, stroke: false, fillColor: SEASON_COL[0], fillOpacity: 0.16 }).addTo(map);
    });
  }
  /** Keep every marker on the world copy nearest the view centre (so panning across the
   *  date line, or a Pacific-wide result set, still shows all markers). */
  function wrapMarkers(c = map.getCenter().lng) {
    let changed = false;
    DESTS.forEach(d => {
      const lon = d.lon + 360 * Math.round((c - d.lon) / 360), m = layers[d.id];
      if (!m || Math.abs(m.getLatLng().lng - lon) < 1e-9) return;
      m.setLatLng([d.lat, lon]); zones[d.id].setLatLng([d.lat, lon]); changed = true;
    });
    return changed;
  }
  function applyView() {
    if (!markerG()) return;
    declutter();
    const z = map.getZoom();
    zonePane.style.display = z >= 4.5 ? '' : 'none';
    mapWrap.classList.toggle('zoomed', z > map.getMinZoom() + 0.3);
  }
  const markerG = () => Object.keys(markers).length > 0;
  /* Markers that would overlap on screen at the current zoom (e.g. sub-destinations of one
   * region like Algarve west/south, Oahu north/south, Bali/G-Land) are nudged apart just
   * enough to stay separately clickable (a small pairwise relaxation in screen pixels), and a
   * thin leader line + dot marks each moved marker's true position. Because it works in
   * screen pixels, the offsets shrink to zero as you zoom in. */
  function declutter() {
    const s = markerScale();
    const ids = Object.keys(markers);
    const ringPx = 11 * s;                       // on-screen radius of a marker's ring
    const minD = Math.max(16, ringPx * 2.1);     // minimum centre-to-centre distance (px)
    // Results view: the numbered top-5 badges are bigger and must each stay readable and clickable,
    // so two ranked badges keep a larger gap ("spiderfy"), and an unranked marker always yields to a ranked one.
    const rankedSet = new Set(state.step === 5 ? topMatches().map(r => r.d.id) : []);
    const minR = Math.max(24, ringPx * 2.7);
    const minMix = Math.max(19, ringPx * 2.3);
    const pts = ids.map((id, n) => { const pt = map.latLngToLayerPoint(layers[id].getLatLng()); return { id, n, g: markers[id], sx: pt.x, sy: pt.y, x: pt.x, y: pt.y, rk: rankedSet.has(id) }; });
    for (let it = 0; it < 80; it++) {
      let moved = false;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const p = pts[i], q = pts[j];
        const need = p.rk && q.rk ? minR : (p.rk || q.rk) ? minMix : minD;
        let dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy);
        if (d >= need * 0.999) continue;
        if (d < 0.01) { const a = (i * 2.399963) % (2 * Math.PI); dx = Math.cos(a); dy = Math.sin(a); d = 1; } // identical: golden-angle split
        const push = (need - d) + 0.1, ux = dx / d, uy = dy / d;
        const wp = p.rk === q.rk ? 0.5 : p.rk ? 0 : 1, wq = 1 - wp;   // the unranked one moves
        p.x -= ux * push * wp; p.y -= uy * push * wp; q.x += ux * push * wq; q.y += uy * push * wq; moved = true;
      }
      // weak pull back towards the true position keeps displacements minimal
      pts.forEach(p => { p.x += (p.sx - p.x) * 0.04; p.y += (p.sy - p.y) * 0.04; });
      if (!moved && it > 2) break;
    }
    pts.forEach(p => {
      const dx = p.x - p.sx, dy = p.y - p.sy, off = Math.hypot(dx, dy) > 3;
      p.g.setAttribute('transform', `translate(${dx.toFixed(1)},${dy.toFixed(1)}) scale(${s.toFixed(3)})`);
      p.g._line.setAttribute('x2', off ? dx.toFixed(1) : 0); p.g._line.setAttribute('y2', off ? dy.toFixed(1) : 0);
      p.g._line.style.display = p.g._anchor.style.display = off ? '' : 'none';
    });
  }
  /* Visible part of the map, in map pixels, i.e. not under the destination card
   * (desktop: card on the right; mobile: card at the bottom). */
  function visibleRect() {
    const r = { x0: 0, y0: 0, x1: W, y1: H };
    if (card && !card.hidden) {
      const mb = mapWrap.getBoundingClientRect(), cb = card.getBoundingClientRect();
      if (cb.left - mb.left > W * 0.35) r.x1 = cb.left - mb.left - 8;   // card on the right
      else r.y1 = cb.top - mb.top - 8;                                  // card at the bottom
    }
    return r;
  }
  /** map centre that puts `ll` in the middle of the visible (uncovered) part of the map at zoom z */
  function centerFor(ll, z) {
    const v = visibleRect(), off = L.point((v.x0 + v.x1) / 2 - W / 2, (v.y0 + v.y1) / 2 - H / 2);
    return map.unproject(map.project(ll, z).subtract(off), z);
  }
  function focusDest(id, z = 8) {
    const m = layers[id]; if (!m) return;
    z = Math.min(map.getMaxZoom(), Math.max(map.getMinZoom(), z));
    map.flyTo(centerFor(m.getLatLng(), z), z, { duration: 0.8 });
  }
  /** Fit the map to all top-5 results, with padding for the hint, zoom controls and legend.
   *  Uses the shortest longitude span, so a set across the Pacific (Fiji, Tahiti, Hawaii,
   *  Indonesia) is framed across the date line instead of showing the whole world. */
  function fitResults(animate = true) {
    const ds = topMatches().map(r => r.d).filter(d => layers[d.id]);
    if (!ds.length) return;
    const norm = l => ((l % 360) + 540) % 360 - 180;
    const lons = ds.map(d => norm(d.lon)).sort((a, b) => a - b);
    let bi = lons.length - 1, bg = lons[0] + 360 - lons[lons.length - 1];
    for (let i = 0; i < lons.length - 1; i++) if (lons[i + 1] - lons[i] > bg) { bg = lons[i + 1] - lons[i]; bi = i; }
    const start = lons[(bi + 1) % lons.length];
    const adj = l => { l = norm(l); while (l < start - 1e-9) l += 360; return l; };
    const b = L.latLngBounds(ds.map(d => [d.lat, adj(d.lon)]));
    wrapMarkers(b.getCenter().lng);
    const mobile = window.innerWidth <= 900;
    const pad = mobile ? { l: 34, r: 52, t: 34, b: 44 } : { l: 60, r: 70, t: 64, b: 60 };
    map.fitBounds(b, { paddingTopLeft: [pad.l, pad.t], paddingBottomRight: [pad.r, pad.b], maxZoom: 6, animate, duration: 0.6 });
    applyView();
  }
  /** Map click: only pan if the selected marker would end up under the card. */
  function ensureVisible(id) {
    const m = layers[id]; if (!m) return;
    const v = visibleRect(), p = map.latLngToContainerPoint(m.getLatLng());
    if (p.x > v.x0 + 20 && p.x < v.x1 - 20 && p.y > v.y0 + 20 && p.y < v.y1 - 20) return;
    map.panTo(centerFor(m.getLatLng(), map.getZoom()), { animate: true, duration: 0.5 });
  }
  function resetView(animate = true) { wrapMarkers(WORLD.getCenter().lng); map.fitBounds(WORLD, { animate }); }
  function updateSize() {
    const sz = map.getSize(); W = sz.x; H = sz.y;
    map.setMinZoom(Math.max(0, Math.floor((map.getBoundsZoom(WORLD) - 0.25) * 4) / 4));
  }
  map.on('zoomend', applyView);
  map.on('moveend', () => { if (wrapMarkers()) applyView(); });
  map.on('movestart zoomstart', hideTip);
  map.on('click', () => closeCard());
  $('#zoomIn').onclick = () => map.zoomIn(1);
  $('#zoomOut').onclick = () => map.zoomOut(1);
  $('#zoomReset').onclick = () => resetView(true);

  /* ---------------- SCORING + PAINT ---------------- */
  function originObj() { return ORIGINS.find(o => o.id === state.origin) || ORIGINS[0]; }
  function recompute() {
    ranking = P.rankAll(DESTS, state, originObj(), fcCtx());
    evals = new Map(ranking.map(r => [r.d.id, r.e]));
  }
  function paint() {
    if (!markerG()) return;
    const showRanks = state.step === 5;
    const top = topMatches().map(r => r.d.id);
    const hasWaves = state.waves.length > 0;
    DESTS.forEach(d => {
      const g = markers[d.id], e = evals.get(d.id); if (!g || !e) return;
      g.setAttribute('aria-label', `${dname(d)}, ${cname(d)}`);
      g.setAttribute('class', `marker r${e.rating}` + (hasWaves && e.waveHits.length ? ' wave-hit' : '') + (hasWaves && !e.waveHits.length ? ' dim' : '') + (state.selected === d.id ? ' selected' : '') + (showRanks && top.includes(d.id) ? ' ranked' : ''));
      const tx = g.querySelector('.rank'); const ri = top.indexOf(d.id);
      tx.textContent = showRanks && ri >= 0 ? String(ri + 1) : '';
    });
    // bring the top ones (and the selected one) to the front, colour the soft zones
    DESTS.forEach(d => { const e = evals.get(d.id), ri = top.indexOf(d.id); if (!layers[d.id] || !e) return;
      layers[d.id].setZIndexOffset(showRanks && ri >= 0 ? 200000 - ri * 1000 : state.selected === d.id ? 150000 : 0);
      zones[d.id].setStyle({ fillColor: SEASON_COL[e.rating], fillOpacity: e.rating ? 0.2 : 0.1 }); });
    $('#legendWaves').hidden = !hasWaves;
    const n = ranking.filter(r => r.e.rating >= 2).length;
    const noDatesYet = state.step === 0 && state.dateMode === 'flexible' && state.anyTime;
    $('#matchCount').textContent = noDatesYet ? t.destCount(DESTS.length) : t.matches(n);
  }
  // Top 5 with regional diversity: at most one sub-destination per parent region (see planner.diversify).
  function topMatches() { return P.diversify(ranking, 5); }

  /* ---------------- TOOLTIP + CARD ---------------- */
  const tip = $('#tooltip');
  function monthStrip(season) {
    return `<div class="mstrip">${season.map((v, i) => `<span class="m r${v}" title="${t.monthsLong[i]}: ${t.seasonLabel[v]}"><i>${t.months[i][0]}</i></span>`).join('')}</div>`;
  }
  function lvlRange(d) { return d.lvl[0] === d.lvl[1] ? t.levelShort[d.lvl[0] - 1] : `${t.levelShort[d.lvl[0] - 1]} → ${t.levelShort[d.lvl[1] - 1]}`; }
  function showTip(d, e) {
    const ev = evals.get(d.id);
    tip.innerHTML = `<div class="tt-head"><b>${esc(dname(d))}</b><span>${esc(cname(d))}</span></div>
      <div class="pill r${ev.rating}">${t.seasonLabel[ev.rating]}</div>
      <div class="tt-sub">${t.ttMonths}</div>${monthStrip(ev.season)}
      <div class="tt-row"><span>${t.ttLevel}</span><b>${lvlRange(d)}</b></div>
      <div class="tt-hint">${t.ttClick}</div>`;
    tip.hidden = false; moveTip(e);
  }
  function moveTip(e) {
    const r = mapWrap.getBoundingClientRect();
    let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > r.width - 8) x = e.clientX - r.left - tw - 14;
    if (y + th > r.height - 8) y = e.clientY - r.top - th - 14;
    tip.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  }
  function hideTip() { tip.hidden = true; }

  const card = $('#destCard');
  function reasonText(code) {
    if (code.startsWith('fc:')) { const [, k, r] = code.split(':'); return t.rsFc[k](r); }
    if (code.startsWith('wave:')) return t.rsWave(code.slice(5));
    if (code.startsWith('tag:')) return t.rsTag[code.slice(4)];
    if (code.startsWith('contest:')) { const d = DESTS.find(x => x.id === code.slice(8)); return t.rsContest(d && d.contest ? (d.contest[state.lang] || d.contest.en) : ''); }
    return t[code] || code;
  }
  function costText(c) { return `€${c.lo.toLocaleString()}–€${c.hi.toLocaleString()}`; }
  function hoursText(c) { return c.hours < 0.1 ? '—' : `~${Math.round(c.hours)}${t.h}`; }
  /* Forecast stamps are stored in UTC (ISO, 'Z'); show them in the visitor's own browser time zone,
   * in the UI locale, with the zone label (e.g. "29 oct, 11:42 CET"). */
  function fmtUpdated(iso) {
    const d = new Date(iso); if (isNaN(d)) return iso;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short', ...(tz ? { timeZone: tz } : {}) }).format(d);
    } catch (e) { return d.toLocaleString(); }
  }
  const compassT = deg => deg == null ? '—' : t.compass[Math.round((deg % 360) / 22.5) % 16];
  function sfLink(id) {
    return SF_LINKS[id] ? `<a class="fc-link" href="${esc(SF_LINKS[id])}" target="_blank" rel="noopener noreferrer">${t.fcSF}</a>` : '';
  }
  /** Compact 7-day strip: bar = wave height range, s = swell period, arrow = wind. */
  function forecastStrip(id, compact) {
    const head = compact ? '' : `<div class="tt-sub">${t.fcTitle}</div>`;
    const f = spotForecast(id);
    if (!f) {
      const st = fcStatus();
      const why = st === 'missing' ? t.fcMissing : st === 'stale' ? t.fcStale : '';
      return `${head}<div class="fc fc-off${compact ? ' compact' : ''}" role="note"><b>${t.fcUnavailable}</b>${why ? `<span>${why}</span>` : ''}${compact ? '' : sfLink(id)}</div>`;
    }
    const scale = Math.max(3, ...f.days.map(d => d.waveMax || 0));
    const pct = v => Math.max(4, Math.round((v || 0) / scale * 100));
    const cols = f.days.map(d => {
      const dt = new Date(d.date + 'T12:00:00');
      const rel = d.windRel ? t.fcRel[d.windRel] : '';
      const title = `${t.wdays[dt.getDay()]} ${dt.getDate()}: ${d.waveMin}–${d.waveMax} m · ${t.fcSwell} ${d.swellPeriod ?? '—'} s ${compassT(d.swellDir)} · ${t.fcWind} ${d.windKmh ?? '—'} km/h ${compassT(d.windDir)}${rel ? ' (' + rel + ')' : ''}${d.gustKmh ? `, ${t.fcGust} ${d.gustKmh}` : ''} · ${t.fcRating} ${d.rating}/5`;
      return `<div class="fc-day" title="${esc(title)}">
        <span class="fc-wd">${t.wdays[dt.getDay()]}<em>${dt.getDate()}</em></span>
        <span class="fc-bar" aria-hidden="true"><i style="height:${pct(d.waveMax)}%"></i><b style="height:${pct(d.waveMin)}%"></b></span>
        <span class="fc-h">${d.waveMax != null ? (d.waveMin === d.waveMax ? d.waveMax : `${d.waveMin}–${d.waveMax}`) : '—'}</span>
        <span class="fc-p">${d.swellPeriod != null ? d.swellPeriod + 's' : '—'}</span>
        <span class="fc-w ${d.windRel || ''}">${d.windDir != null ? `<i style="transform:rotate(${d.windDir}deg)">↓</i>` : ''}${d.windKmh ?? '—'}</span>
        <span class="fc-r" aria-label="${t.fcRating} ${d.rating}/5">${[1, 2, 3, 4, 5].map(n => `<u class="${n <= d.rating ? 'on' : ''}"></u>`).join('')}</span>
      </div>`;
    }).join('');
    const sw = f.days[0];
    return `${head}<div class="fc${compact ? ' compact' : ''}">
      <div class="fc-grid">${cols}</div>
      ${compact ? '' : `<div class="fc-legend">${t.fcLegend}</div><div class="fc-meta">${esc(t.fcPoint(f.spot))} · ${t.fcSwell} ${compassT(sw.swellDir)}</div>`}
      <div class="fc-foot"><span>${t.fcUpdated(fmtUpdated(f.updatedAt || FC.generatedAt))} · ${t.fcSource}</span>${compact ? '' : `<span>${t.fcNote}</span>`}${sfLink(id)}</div>
    </div>`;
  }
  /** opts.pan: 'focus' = pan/zoom to it (default, e.g. from the results list),
   *  'ensure' = only pan if hidden under the card (map clicks), 'none' = re-render only. */
  function selectDest(id, opts = {}) {
    const pan = opts.pan || 'focus';
    state.selected = id; hideTip();
    const d = DESTS.find(x => x.id === id), ev = evals.get(id);
    const prevScroll = !card.hidden && card.dataset.id === id ? (card.querySelector('.card-scroll') || {}).scrollTop || 0 : 0;
    card.dataset.id = id;
    card.innerHTML = `<button class="card-close" aria-label="Close">×</button>
      <div class="card-scroll">
      <div class="card-head"><div><h3>${esc(dname(d))}</h3><span class="muted">${esc(cname(d))}</span></div><span class="pill r${ev.rating}">${t.seasonLabel[ev.rating]}</span></div>
      <div class="tt-sub">${t.ttMonths}</div>${monthStrip(ev.season)}
      <p class="notes">${esc(d.notes[state.lang] || d.notes.en)}</p>
      ${forecastStrip(d.id, false)}
      <div class="kv"><span>${t.ttLevel}</span><b>${lvlRange(d)}</b></div>
      ${d.contest ? `<div class="kv"><span>${t.contestLabel}</span><b class="kv-small">${esc(d.contest[state.lang] || d.contest.en)}</b></div>` : ''}
      <div class="kv"><span>${t.budgetBand}</span><b>${costText(ev.cost)} <small>${t.approx}</small></b></div>
      <div class="kv"><span>${t.flight} (${esc(originObj().name)})</span><b>${hoursText(ev.cost)} <small>${t.approx}</small></b></div>
      <div class="tt-sub">${t.ttWaves}</div>
      <div class="chips small">${d.waves.map(w => `<span class="chip static ${state.waves.includes(w.name) ? 'on' : ''}">${esc(w.name)} <em>${t.levelShort[w.level - 1]}</em></span>`).join('')}</div>
      ${ev.blockers.length ? `<div class="blockers">${ev.blockers.map(b => `<span>⚠ ${reasonText(b)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="card-foot"><button class="btn primary full" data-plan="${d.id}">${t.planAI}</button></div>`;
    const wasHidden = card.hidden;
    card.hidden = false; mapWrap.classList.add('card-open');
    card.querySelector('.card-scroll').scrollTop = prevScroll;
    card.querySelector('.card-close').onclick = closeCard;
    card.querySelector('[data-plan]').onclick = () => openPlan(d.id);
    paint();
    if (pan === 'focus') focusDest(id, opts.z || Math.max(map.getZoom(), 7));
    else if (pan === 'ensure') ensureVisible(id);
  }
  function closeCard() { if (!card.hidden) { card.hidden = true; mapWrap.classList.remove('card-open'); state.selected = null; paint(); } }

  /* ---------------- STEPS ---------------- */
  const body = $('#stepBody');
  const STEP_RENDER = [renderDates, renderLevel, renderTrip, renderBudget, renderWaves, renderResults];

  function renderStepper() {
    $('#stepper').innerHTML = t.steps.map((s, i) => `<button class="st ${i === state.step ? 'cur' : ''} ${i <= state.maxStep ? 'ok' : ''}" data-step="${i}" ${i > state.maxStep ? 'disabled' : ''}><span class="n">${i + 1}</span><span class="l">${s}</span></button>`).join('<span class="bar"></span>');
    $('#stepper').querySelectorAll('[data-step]').forEach(b => b.onclick = () => go(+b.dataset.step));
  }
  function go(i) {
    state.step = Math.max(0, Math.min(5, i));
    state.maxStep = Math.max(state.maxStep, state.step);
    if (state.step >= 3) state.budgetSet = true;
    renderAll();
    body.scrollTop = 0;
    if (state.step === 5) setTimeout(() => fitResults(true), 120);
  }
  function renderAll() {
    recompute();
    renderStepper();
    document.body.classList.toggle('on-results', state.step === 5);
    body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
    body.innerHTML = STEP_RENDER[state.step]();
    bindStep();
    $('#backBtn').style.visibility = state.step === 0 ? 'hidden' : 'visible';
    const nb = $('#nextBtn');
    nb.textContent = state.step === 4 ? t.seeResults : state.step === 5 ? t.restart : t.next;
    nb.disabled = (state.step === 1 && !state.level) || (state.step === 2 && !state.tripType);
    $('#backBtn').textContent = t.back;
    paint();
    applyView();   // re-run declutter: ranked badges get more room on the results step
    if (state.selected) selectDest(state.selected, { pan: 'none' });
  }
  function update() { recompute(); paint(); if (state.selected) selectDest(state.selected, { pan: 'none' }); refreshNext(); }
  function refreshNext() { $('#nextBtn').disabled = (state.step === 1 && !state.level) || (state.step === 2 && !state.tripType); }

  function renderDates() {
    const durs = [3, 5, 7, 10, 14, 21];
    return `<h2>${t.datesTitle}</h2><p class="lead">${t.datesLead}</p>
      <div class="seg" role="tablist">
        <button class="${state.dateMode === 'fixed' ? 'on' : ''}" data-mode="fixed">${t.fixed}</button>
        <button class="${state.dateMode === 'flexible' ? 'on' : ''}" data-mode="flexible">${t.flexible}</button>
      </div>
      ${state.dateMode === 'fixed' ? `
        <div class="dates">
          <label>${t.from}<input type="date" id="dStart" value="${state.start}" min="${iso(today)}"></label>
          <label>${t.to}<input type="date" id="dEnd" value="${state.end}" min="${state.start}"></label>
        </div>
        <p class="muted small">${t.nights(P.tripDays(state))}</p>` : `
        <h4>${t.pickMonths}</h4>
        <div class="months">
          <button class="chip wide ${state.anyTime ? 'on' : ''}" data-any>${t.anyTime}</button>
          ${t.months.map((m, i) => `<button class="chip ${!state.anyTime && state.months.includes(i) ? 'on' : ''}" data-month="${i}">${m}</button>`).join('')}
        </div>
        <h4>${t.duration}</h4>
        <div class="chips">${durs.map(n => `<button class="chip ${state.duration === n ? 'on' : ''}" data-dur="${n}">${t.days(n)}</button>`).join('')}</div>`}
      <p class="disclaimer">${t.disclaimer}</p>`;
  }
  function renderLevel() {
    const codes = P.LEVEL_CODES;
    return `<h2>${t.levelTitle}</h2><p class="lead">${t.levelLead}</p>
      <div class="cards levels8" role="radiogroup" aria-label="${esc(t.levelTitle)}">${t.levels.map((l, i) => `<button class="opt lvl ${state.level === i + 1 ? 'on' : ''}" data-level="${i + 1}" role="radio" aria-checked="${state.level === i + 1}"><span class="lvl-code g${codes[i][0]}">${codes[i]}</span><span class="lvl-txt">${esc(l)}</span></button>`).join('')}</div>`;
  }
  function renderTrip() {
    const icons = { once: '🌍', weekend: '⚡', boys: '🍻', chill: '🌅', camp: '🏄' };
    return `<h2>${t.tripTitle}</h2><p class="lead">${t.tripLead}</p>
      <div class="cards">${Object.keys(t.trips).map(k => `<button class="opt ${state.tripType === k ? 'on' : ''}" data-trip="${k}"><span class="emo">${icons[k]}</span><span><b>${t.trips[k]}</b><small>${t.tripHints[k]}</small></span></button>`).join('')}</div>
      <label class="field">${t.origin}<select id="origin">${ORIGINS.map(o => `<option value="${o.id}" ${o.id === state.origin ? 'selected' : ''}>${o.name}</option>`).join('')}</select></label>`;
  }
  function tierIdx(b) { return b < 800 ? 0 : b < 1600 ? 1 : b < 3000 ? 2 : 3; }
  function renderBudget() {
    return `<h2>${t.budgetTitle}</h2><p class="lead">${t.budgetLead}</p>
      <div class="budget">
        <div class="budget-val"><span id="bVal">€${state.budget.toLocaleString()}</span><small>${t.perPerson} · ${t.days(P.tripDays(state))}</small></div>
        <input type="range" id="budget" min="300" max="6000" step="50" value="${state.budget}" aria-label="Budget">
        <div class="tiers">${t.tiers.map((x, i) => `<button class="tier ${tierIdx(state.budget) === i ? 'on' : ''}" data-tier="${[500, 1200, 2200, 4000][i]}">${x}</button>`).join('')}</div>
      </div>
      <p class="disclaimer">${t.approx} · ${t.disclaimer}</p>`;
  }
  function allWaves() {
    const out = [];
    DESTS.forEach(d => d.waves.forEach(w => out.push({ ...w, dest: d })));
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }
  function renderWaves() {
    return `<h2>${t.wavesTitle}</h2><p class="lead">${t.wavesLead}</p>
      <input class="search" id="waveQ" type="search" placeholder="${t.wavesSearch}" value="${esc(state.waveQuery)}" autocomplete="off">
      <div id="waveSel"></div>
      <div class="chips wave-list" id="waveList"></div>`;
  }
  function renderWaveLists() {
    const q = state.waveQuery.trim().toLowerCase();
    const list = allWaves().filter(w => !q || w.name.toLowerCase().includes(q) || [w.dest.name, w.dest.nameEs || '', w.dest.country, cname(w.dest)].some(s => s.toLowerCase().includes(q)));
    $('#waveSel').innerHTML = state.waves.length ? `<div class="sel-head"><span>${t.wavesSelected} (${state.waves.length})</span><button class="link" id="waveClear">${t.clear}</button></div>
      <div class="chips">${state.waves.map(w => `<button class="chip on" data-wave="${esc(w)}">${esc(w)} ×</button>`).join('')}</div>` : '';
    $('#waveList').innerHTML = list.length ? list.map(w => `<button class="chip ${state.waves.includes(w.name) ? 'on' : ''}" data-wave="${esc(w.name)}" title="${esc(dname(w.dest))}">${esc(w.name)} <em>${esc(cname(w.dest))} · ${t.levelShort[w.level - 1]}</em></button>`).join('') : `<p class="muted">${t.wavesNone}</p>`;
    document.querySelectorAll('[data-wave]').forEach(b => b.onclick = () => {
      const n = b.dataset.wave; const i = state.waves.indexOf(n);
      i >= 0 ? state.waves.splice(i, 1) : state.waves.push(n);
      renderWaveLists(); update();
      if (i < 0) { const d = DESTS.find(x => x.waves.some(w => w.name === n)); if (d) focusDest(d.id, 5); }
    });
    const c = $('#waveClear'); if (c) c.onclick = () => { state.waves = []; renderWaveLists(); update(); };
  }
  function renderResults() {
    const top = topMatches();
    if (!top.length) return `<h2>${t.resultsTitle}</h2><p class="lead">${t.noResults}</p>`;
    const L = state.level;
    const fcUsed = top.some(r => r.e.forecast);
    return `<h2>${t.resultsTitle}</h2><p class="lead">${t.resultsLead}</p>
      ${fcUsed ? `<p class="fc-rank-note">${t.fcRankNote}</p>` : ''}
      <ol class="results">${top.map((r, i) => {
        const d = r.d, e = r.e;
        const lf = P.levelFit(d, L); const fit = lf ? `${lvlRange(d)} · ${{ heavy: t.rsTooHeavy, stretch: t.rsStretch, mellow: t.rsMellow, ok: t.rsLevel }[lf]}` : lvlRange(d);
        return `<li class="res" data-res="${d.id}" style="animation-delay:${i * 70}ms">
          <div class="res-head"><span class="rk">${i + 1}</span><div><h3>${esc(dname(d))}</h3><span class="muted">${esc(cname(d))}</span></div><span class="pill r${e.rating}">${t.seasonLabel[e.rating]}</span></div>
          <div class="tt-sub">${t.why}</div>
          <ul class="why">${e.reasons.slice(0, 4).map(c => `<li>${esc(reasonText(c))}</li>`).join('')}</ul>
          <div class="facts">
            <div><span>${t.bestMonths}</span><b>${e.bestMonths.map(m => t.months[m]).join(', ') || '—'}</b></div>
            <div><span>${t.levelFit}</span><b>${fit}</b></div>
            <div><span>${t.budgetBand}</span><b>${costText(e.cost)}</b></div>
            <div><span>${t.flight}</span><b>${hoursText(e.cost)}</b></div>
          </div>
          ${r.siblings && r.siblings.length ? `<p class="also">${t.alsoRegion(r.siblings.map(s => `<button class="link" data-sib="${s.id}">${esc(dname(s))}</button>`).join(', '))}</p>` : ''}
          ${forecastStrip(d.id, true)}
          <div class="res-actions"><button class="btn primary" data-plan="${d.id}">${t.planAI}</button><button class="btn ghost" data-guide>${t.talkGuide}</button></div>
        </li>`;
      }).join('')}</ol>`;
  }

  function bindStep() {
    body.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { state.dateMode = b.dataset.mode; renderAll(); });
    const ds = $('#dStart'), de = $('#dEnd');
    if (ds) ds.onchange = () => { state.start = ds.value; if (state.end < state.start) state.end = state.start; renderAll(); };
    if (de) de.onchange = () => { state.end = de.value; renderAll(); };
    const any = body.querySelector('[data-any]');
    if (any) any.onclick = () => { state.anyTime = true; state.months = []; renderAll(); };
    body.querySelectorAll('[data-month]').forEach(b => b.onclick = () => {
      const m = +b.dataset.month; state.anyTime = false;
      const i = state.months.indexOf(m); i >= 0 ? state.months.splice(i, 1) : state.months.push(m);
      if (!state.months.length) state.anyTime = true;
      renderAll();
    });
    body.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { state.duration = +b.dataset.dur; state.durationTouched = true; renderAll(); });
    body.querySelectorAll('[data-level]').forEach(b => b.onclick = () => { state.level = +b.dataset.level; renderAll(); });
    body.querySelectorAll('[data-trip]').forEach(b => b.onclick = () => {
      state.tripType = b.dataset.trip;
      if (!state.durationTouched && state.dateMode === 'flexible') state.duration = { once: 14, weekend: 3, boys: 7, chill: 10, camp: 7 }[state.tripType];
      renderAll();
    });
    const o = $('#origin'); if (o) o.onchange = () => { state.origin = o.value; update(); };
    const br = $('#budget');
    if (br) br.oninput = () => {
      state.budget = +br.value; $('#bVal').textContent = `€${state.budget.toLocaleString()}`;
      body.querySelectorAll('.tier').forEach((x, i) => x.classList.toggle('on', i === tierIdx(state.budget)));
      update();
    };
    body.querySelectorAll('[data-tier]').forEach(b => b.onclick = () => { state.budget = +b.dataset.tier; renderAll(); });
    const wq = $('#waveQ');
    if (wq) { wq.oninput = () => { state.waveQuery = wq.value; renderWaveLists(); }; renderWaveLists(); }
    body.querySelectorAll('[data-res]').forEach(li => li.onclick = e => { if (e.target.closest('button, a')) return; selectDest(li.dataset.res, { pan: 'focus', z: 7 }); if (window.innerWidth <= 900) window.scrollTo({ top: 0, behavior: 'smooth' }); });
    body.querySelectorAll('[data-plan]').forEach(b => b.onclick = () => openPlan(b.dataset.plan));
    body.querySelectorAll('[data-sib]').forEach(b => b.onclick = e => { e.stopPropagation(); selectDest(b.dataset.sib, { pan: 'focus', z: 8 }); if (window.innerWidth <= 900) window.scrollTo({ top: 0, behavior: 'smooth' }); });
    body.querySelectorAll('[data-guide]').forEach(b => b.onclick = () => toast(t.guideToast));
  }

  $('#nextBtn').onclick = () => {
    if (state.step === 5) {
      Object.assign(state, { step: 0, maxStep: 0, level: null, tripType: null, budgetSet: false, waves: [], waveQuery: '', selected: null, dateMode: 'flexible', anyTime: true, months: [], duration: 7, durationTouched: false });
      card.hidden = true; mapWrap.classList.remove('card-open'); resetView(true); renderAll(); return;
    }
    go(state.step + 1);
  };
  $('#backBtn').onclick = () => go(state.step - 1);

  /* ---------------- AI PLAN (stub) ---------------- */
  const modal = $('#modal');
  function openPlan(id) {
    const d = DESTS.find(x => x.id === id), ev = evals.get(id);
    const content = $('#modalContent');
    content.innerHTML = `<div class="thinking"><span></span><span></span><span></span></div>`;
    modal.hidden = false;
    // LLM PLUG-IN POINT → see planner.js generateItinerary() and README.
    setTimeout(() => {
      const it = P.generateItinerary(d, ev, state, state.lang, t);
      content.innerHTML = `<div class="demo-flag">${t.itinDemo}</div>
        <h2 id="modalTitle">${esc(it.title)}</h2>
        <div class="tt-sub">${t.itinSummary}</div>
        <ul class="sum">${it.summary.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
        <ol class="days">${it.days.map(day => `<li><b>${esc(day.title)}</b><ul>${day.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`).join('')}</ol>
        <div class="tt-sub">${t.itinNext}</div>
        <ul class="sum">${t.itinNextList.map(s => `<li>${s}</li>`).join('')}</ul>
        <div class="res-actions"><button class="btn primary" data-guide>${t.requestQuote}</button></div>`;
      content.querySelector('[data-guide]').onclick = () => toast(t.guideToast);
    }, 900);
  }
  const closeModal = () => { modal.hidden = true; };
  $('#modalClose').onclick = closeModal;
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCard(); } });

  function toast(msg) {
    let n = $('.toast'); if (!n) { n = document.createElement('div'); n.className = 'toast'; document.body.appendChild(n); }
    n.textContent = msg; n.classList.add('show'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('show'), 4200);
  }

  /* ---------------- I18N ---------------- */
  function setLang(l) {
    state.lang = l; t = I18N[l]; localStorage.setItem('tasf-lang', l);
    document.documentElement.lang = l;
    document.querySelectorAll('[data-i18n]').forEach(n => { const v = t[n.dataset.i18n]; if (typeof v === 'string') n.textContent = v; });
    document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
    setLegend(!legend.classList.contains('collapsed'));
    renderAll();
  }
  document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));

  /* Legend: compact and collapsed by default on small screens so it never hides markers. */
  const legend = $('#legend'), legendToggle = $('#legendToggle');
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  function setLegend(open) {
    legend.classList.toggle('collapsed', !open);
    legendToggle.setAttribute('aria-expanded', String(open));
    legendToggle.querySelector('.lt-label').textContent = open ? t.legendHide : t.legendBtn;
  }
  legendToggle.onclick = () => setLegend(legend.classList.contains('collapsed'));
  $('#legendBody').addEventListener('click', () => { if (isMobile()) setLegend(false); });

  /* ---------------- INIT ---------------- */
  recompute();
  updateSize();
  map.fitBounds(WORLD, { animate: false });
  buildMarkers();
  applyView();
  if (isMobile()) legend.classList.add('collapsed');
  setLang(state.lang);
  // Over http(s): pick up a newer forecast.json (file:// usually blocks fetch → forecast.js is used).
  if (/^https?:$/.test(location.protocol) && window.fetch) {
    fetch('forecast.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(doc => {
      if (validFc(doc) && (!FC || Date.parse(doc.generatedAt) > Date.parse(FC.generatedAt))) { FC = doc; renderAll(); }
    }).catch(() => { /* keep forecast.js data or the unavailable state */ });
  }
  // The map area changes size on window resize and on mobile when the results step starts (shorter map).
  let rz, lastSz = '';
  new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => {
    const sz = mapWrap.clientWidth + 'x' + mapWrap.clientHeight; if (sz === lastSz) return; lastSz = sz;
    map.invalidateSize({ animate: false }); updateSize();
    if (state.step === 5) fitResults(false); else applyView();
  }, 120); }).observe(mapWrap);
  window.TASF_APP = { state, evals: () => evals, ranking: () => ranking, top: () => topMatches(), go, forecast: () => FC, fcStatus, selectDest, setLang, fitResults, map, view: () => ({ k: map.getZoom(), center: map.getCenter(), W, H }), tiles: () => ({ ok: tileOk, err: tileErr, fallback: !!fallback }), markerPos: () => Object.fromEntries(Object.entries(markers).map(([k, g]) => [k, g.getBoundingClientRect()])) };
})();

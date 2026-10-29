/* TAsF – scoring engine + itinerary templates (pure functions, no DOM).
 * Exposed as window.TASF_PLANNER. Works in Node too (for tests).
 */
(function (root) {
  const R = Math.PI / 180;
  function distKm(a, b) {
    const dLat = (b.lat - a.lat) * R, dLon = (b.lon - a.lon) * R;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  // Very rough door-to-door flight time (hours): cruise ~800 km/h + connection overhead
  function flightHours(km) { return km < 300 ? 0 : km / 800 + (km > 3500 ? 2.5 : 0.7); }
  // Very rough return-flight price band (EUR) by distance — placeholder only
  function flightCost(km) {
    if (km < 300) return [0, 60];
    if (km < 1500) return [80, 250];
    if (km < 4000) return [250, 600];
    if (km < 9000) return [550, 1100];
    if (km < 13000) return [800, 1500];
    return [1100, 2000];
  }

  // Months touched by fixed dates -> weights (days per month)
  function monthWeights(state) {
    const w = new Array(12).fill(0);
    if (state.dateMode === 'fixed' && state.start && state.end) {
      const s = new Date(state.start + 'T00:00:00'), e = new Date(state.end + 'T00:00:00');
      if (e >= s) {
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) w[d.getMonth()]++;
        return w;
      }
    }
    if (state.dateMode === 'flexible' && !state.anyTime && state.months && state.months.length) {
      state.months.forEach(m => { w[m] = 1; });
      return w;
    }
    return w.fill(1); // any time
  }

  function tripDays(state) {
    if (state.dateMode === 'fixed' && state.start && state.end) {
      const s = new Date(state.start + 'T00:00:00'), e = new Date(state.end + 'T00:00:00');
      const n = Math.round((e - s) / 864e5) + 1;
      if (n > 0) return n;
    }
    return state.duration || 7;
  }

  /* Level scale (8 steps, stored as 1..8):
   * 1 A1 · 2 A2 · 3 B1 · 4 B2 · 5 C1 · 6 C2 · 7 D1 (freesurf) · 8 D2 (competition).
   * A1–B1 use the destination's beginner curve (`beg`) when it has one: small, friendly months.
   * D1–D2 use its big-swell curve (`big`) when it has one. Everyone else uses `seasons`. */
  const LV = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, D1: 7, D2: 8 };
  const LEVEL_CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
  function seasonFor(d, level) {
    if (level && level <= LV.B1 && d.beg) return d.beg;
    if (level && level >= LV.D1 && d.big) return d.big;
    return d.seasons;
  }

  /** How a destination's level range [min, max] fits the visitor's level L.
   *  'heavy'   L is below min → grey (except the 'stretch' case)
   *  'stretch' exactly one step below min, and min is C1 or lower → allowed but marked down
   *  'mellow'  L is above max → marked down (1 step over: score only; 2+: colour too)
   *  'ok'      inside the range */
  function levelFit(d, L) {
    if (!L) return null;
    const [mn, mx] = d.lvl;
    if (L < mn) return (mn - L === 1 && mn <= LV.C1) ? 'stretch' : 'heavy';
    if (L > mx) return 'mellow';
    return 'ok';
  }

  function estimateCost(d, state, origin) {
    const km = distKm(origin, d);
    const fc = flightCost(km);
    const band = (root.TASF_COST_BANDS || {})[d.cost] || [600, 1000];
    const days = tripDays(state);
    const k = days / 7;
    const lo = Math.round((band[0] * k + fc[0]) / 50) * 50;
    const hi = Math.round((band[1] * k + fc[1]) / 50) * 50;
    return { lo, hi, mid: (lo + hi) / 2, km, hours: flightHours(km) };
  }

  /** Evaluate one destination against the current state.
   *  Returns { rating 0..3, score, reasons[], blockers[], season[], bestMonths[], cost, waveHits[] } */
  /** Average forecast rating for the user's fixed dates, if they fall inside the
   *  7-day forecast window. fcSpot = { days:[{date, rating}] } (already validated
   *  as fresh by the caller). Returns { avg, n } or null. */
  function forecastWindow(fcSpot, state, todayIso) {
    if (!fcSpot || !fcSpot.days || state.dateMode !== 'fixed' || !state.start || !state.end) return null;
    const last = fcSpot.days[fcSpot.days.length - 1];
    if (!last || state.start > last.date || state.end < todayIso) return null;
    const hit = fcSpot.days.filter(x => x.date >= state.start && x.date <= state.end && x.rating);
    if (!hit.length) return null;
    return { avg: hit.reduce((a, x) => a + x.rating, 0) / hit.length, n: hit.length };
  }

  function evaluate(d, state, origin, fc) {
    const season = seasonFor(d, state.level);
    const w = monthWeights(state);
    const active = w.map((v, i) => v ? i : -1).filter(i => i >= 0);
    let base;
    if (state.dateMode === 'fixed' && state.start && state.end) {
      const tot = w.reduce((a, b) => a + b, 0) || 1;
      base = Math.round(w.reduce((a, v, i) => a + v * season[i], 0) / tot);
    } else {
      base = Math.max(...active.map(i => season[i]));
    }
    const top = Math.max(...active.map(i => season[i]));
    const bestMonths = active.filter(i => season[i] === top && top > 0);
    const reasons = [], blockers = [];
    let rating = base, score = 0;
    if (base === 0) blockers.push('rsOff');

    // Level (8-step scale)
    const L = state.level;
    if (L) {
      const [mn, mx] = d.lvl;
      const fit = levelFit(d, L);
      if (fit === 'heavy') { rating = 0; blockers.push('rsTooHeavy'); }
      else if (fit === 'stretch') { rating = rating > 0 ? Math.max(1, rating - 1) : 0; reasons.push('rsStretch'); score -= 45; }
      else if (fit === 'mellow') {
        const over = L - mx;               // steps above the spot's max
        if (over >= 2) rating = rating > 0 ? Math.max(1, rating - Math.min(2, over - 1)) : 0;
        reasons.push('rsMellow'); score -= 25 * over;
      } else {
        reasons.push('rsLevel'); score += 12;
        // A1–A2: favour places with surf schools / camps
        if (L <= LV.A2 && d.tags.includes('camp')) { score += 15; if (state.tripType !== 'camp') reasons.push('rsSchools'); }
        // C2–D2: small nudge towards heavier spots (higher minimum level), +4 per step above B2
        if (L >= LV.C2) score += 4 * Math.max(0, mn - LV.B2);
      }
      // D2 (competition): favour spots that host top-level contests
      if (L === LV.D2 && d.contest && fit !== 'heavy') { score += 35; reasons.unshift('contest:' + d.id); }
    }

    // Trip type
    const cost = estimateCost(d, state, origin);
    const T = state.tripType;
    if (T === 'weekend') {
      if (cost.hours > 6) { rating = 0; blockers.push('rsFar'); }
      else if (cost.hours > 3.8) { rating = Math.max(0, rating - 1); score -= 20; }
      else { reasons.push('tag:weekend'); score += 30; }
    } else if (T) {
      const tagMap = { once: 'bucket', boys: 'social', chill: 'chill', camp: 'camp' };
      if (d.tags.includes(tagMap[T])) { reasons.push('tag:' + T); score += 25; }
      if (T === 'once') score += Math.min(20, cost.hours); // farther = more "trip of a lifetime"
      else score -= cost.hours * 1.2;                     // otherwise prefer closer
    }

    // Budget
    if (state.budgetSet) {
      const ratio = cost.mid / state.budget;
      if (ratio > 1.6) { rating = Math.max(0, rating - 2); reasons.push('rsOver'); score -= 30; }
      else if (ratio > 1.15) { rating = Math.max(0, rating - 1); reasons.push('rsOver'); score -= 15; }
      else { reasons.push('rsBudget'); score += ratio < 0.9 ? 10 : 5; }
    }

    // Waves
    const waveHits = (state.waves || []).filter(wn => d.waves.some(x => x.name === wn));
    if (waveHits.length) { score += 60 * waveHits.length; waveHits.forEach(wn => reasons.unshift('wave:' + wn)); }
    else if ((state.waves || []).length) score -= 40;

    // Live forecast (only when fixed dates fall inside the next 7 days). Modest:
    // ±12 points per rating step around 3/5 (max ±24), never changes the map colour.
    let forecast = null;
    if (fc && fc.spot) {
      forecast = forecastWindow(fc.spot(d.id), state, fc.today);
      if (forecast) {
        score += (forecast.avg - 3) * 12;
        const r = Math.round(forecast.avg * 10) / 10;
        reasons.unshift(forecast.avg >= 3.5 ? 'fc:good:' + r : forecast.avg < 2.5 ? 'fc:poor:' + r : 'fc:ok:' + r);
      }
    }

    if (rating === 3) reasons.unshift('rsPeak');
    else if (rating === 2) reasons.unshift('rsShoulder');
    else if (rating === 1) reasons.unshift('rsSurf');

    score += rating * 100;
    return { id: d.id, rating, score, reasons, blockers, season, bestMonths, cost, waveHits, forecast };
  }

  /** Display name in the UI language (Spanish name if the destination has one). */
  function displayName(d, lang) { return (lang === 'es' && d.nameEs) || d.name; }

  /** Top-n list with regional diversity: destinations that share a `group` (sub-destinations
   *  split from one multi-coast region, e.g. Algarve west/south) appear at most once, unless
   *  the later one is clearly different for this visitor, i.e. it holds a wave they picked
   *  that the already-listed sibling does not have. Only spots with rating >= 1 are listed.
   *  Returns [{ d, e, siblings: [d…] }] where siblings = same-group spots left out (rating >= 1). */
  function diversify(ranked, n) {
    const out = [], byGroup = new Map();
    for (const r of ranked) {
      if (r.e.rating < 1) continue;
      const g = r.d.group;
      if (g && byGroup.has(g)) {
        const first = byGroup.get(g);
        const different = r.e.waveHits.some(w => !first.e.waveHits.includes(w));
        if (!different) { first.siblings.push(r.d); continue; }
      }
      const item = { d: r.d, e: r.e, siblings: [] };
      if (g && !byGroup.has(g)) byGroup.set(g, item);
      if (out.length < n) out.push(item);
    }
    return out;
  }

  function rankAll(dests, state, origin, fc) {
    return dests.map(d => ({ d, e: evaluate(d, state, origin, fc) }))
      .sort((a, b) => b.e.score - a.e.score);
  }

  /* ------------------------------------------------------------------
   * Itinerary generator (TEMPLATE-BASED DEMO)
   * LLM PLUG-IN POINT: replace generateItinerary() with a call to your
   * backend, e.g. POST /api/plan { destination, state, forecast } →
   * the backend prompts an LLM (with live swell data from Open-Meteo
   * Marine / Stormglass / Surfline, availability and prices) and returns
   * the same shape: { title, summary[], days:[{title, items[]}] }.
   * ------------------------------------------------------------------ */
  const TPL = {
    en: {
      arrive: (d, n) => `Arrive in ${displayName(d, 'en')}, transfer to your stay (${n})`,
      sunset: 'Sunset check of the line-up & welcome dinner',
      dawn: w => `Dawn patrol at ${w}`, mid: w => `Afternoon session at ${w}`,
      coach: 'Video-analysis & coaching session', yoga: 'Sunrise yoga / mobility', rest: 'Flat-day backup: explore, local food & rest',
      boat: 'Boat day to outer reefs (swell permitting)', party: 'Crew dinner & night out', chill: 'Slow lunch, beach & spa time', explore: 'Local culture & sightseeing',
      depart: 'Last early session, pack boards & depart',
      sum: (d, days, lvl, cost) => [`${days} days · level ${lvl}`, `Rough budget ${cost}`, `Best months: ${d}`]
    },
    es: {
      arrive: (d, n) => `Llegada a ${displayName(d, 'es')}, traslado al alojamiento (${n})`,
      sunset: 'Revisión del pico al atardecer y cena de bienvenida',
      dawn: w => `Sesión al amanecer en ${w}`, mid: w => `Sesión de tarde en ${w}`,
      coach: 'Vídeo-análisis y clase con coach', yoga: 'Yoga / movilidad al amanecer', rest: 'Plan B sin olas: explorar, comida local y descanso',
      boat: 'Día en barco a arrecifes exteriores (según swell)', party: 'Cena con la cuadrilla y salir de noche', chill: 'Comida tranquila, playa y spa', explore: 'Cultura local y turismo',
      depart: 'Última sesión temprano, recoger tablas y regreso',
      sum: (d, days, lvl, cost) => [`${days} días · nivel ${lvl}`, `Presupuesto aprox. ${cost}`, `Mejores meses: ${d}`]
    }
  };
  function generateItinerary(d, ev, state, lang, t) {
    const T = TPL[lang] || TPL.en;
    const days = Math.min(tripDays(state), 21);
    const L = state.level || LV.B2;
    const suited = d.waves.filter(w => w.level <= L).sort((a, b) => b.level - a.level);
    const pool = suited.length ? suited : d.waves.slice().sort((a, b) => a.level - b.level);
    const wave = i => pool[i % pool.length].name;
    const extra = { once: d.tags.includes('boat') ? 'boat' : 'explore', boys: 'party', chill: 'chill', camp: 'coach', weekend: 'sunset' }[state.tripType] || 'explore';
    const out = [];
    for (let i = 0; i < days; i++) {
      const items = [];
      if (i === 0) { items.push(T.arrive(d, d.notes[lang] ? d.notes[lang].split('.')[0] : '')); items.push(T.sunset); }
      else if (i === days - 1 && days > 1) { items.push(T.depart); }
      else if (days >= 6 && i % 5 === 3) { items.push(T.dawn(wave(i))); items.push(T.rest); }
      else {
        if (state.tripType === 'chill' || state.tripType === 'camp') items.push(T.yoga);
        items.push(T.dawn(wave(i)));
        items.push(T.mid(wave(i + 1)));
        if (i % 2 === 0 || state.tripType === 'camp') items.push(T[extra] || T.explore);
      }
      out.push({ title: `${t.day} ${i + 1}`, items });
    }
    const months = ev.bestMonths.map(m => t.months[m]).join(', ') || '—';
    const cost = `€${ev.cost.lo.toLocaleString()}–€${ev.cost.hi.toLocaleString()}`;
    return { title: t.itinTitle(displayName(d, lang)), summary: T.sum(months, days, LEVEL_CODES[L - 1], cost), days: out };
  }

  root.TASF_PLANNER = { LV, LEVEL_CODES, levelFit, forecastWindow, evaluate, rankAll, diversify, displayName, generateItinerary, monthWeights, tripDays, estimateCost, distKm, seasonFor, flightCost, flightHours };
})(typeof window !== 'undefined' ? window : globalThis);

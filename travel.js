/* TAsF – flights & stays helper for the "Plan my trip" modal (pure functions, no DOM).
 * Exposed as window.TASF_TRAVEL. Works in Node too (for tests). Needs planner.js (TASF_PLANNER).
 *
 * PROTOTYPE RULE: this file never invents prices, hotel names or flight numbers. Without a live
 * offers API it only builds (1) a travel window, (2) a transparent budget split based on the app's
 * own rough estimates, clearly labelled as estimates, and (3) prefilled search links to public
 * comparison sites, where the visitor sees the real, live prices.
 *
 * Link formats (checked 2026-10-29):
 *  Google Flights  https://www.google.com/travel/flights?q=Flights to LIS from MAD on 2026-12-05 through 2026-12-11&curr=EUR&hl=es
 *                  (natural-language q parameter; IATA airport or city codes)
 *  Skyscanner      https://www.skyscanner.es/transport/flights/mad/lis/261205/261211/?adultsv2=1&cabinclass=economy&rtn=1
 *                  (dates YYMMDD; Skyscanner metro codes lond / pari / nyca for "all airports")
 *  Kayak           https://www.kayak.es/flights/MAD-LIS/2026-12-05/2026-12-11/1adults
 *  Booking.com     https://www.booking.com/searchresults.html?ss=Peniche, Portugal&checkin=…&checkout=…&group_adults=2&no_rooms=1
 *                  &group_children=0&selected_currency=EUR&nflt=price=EUR-min-120-1   (per-night price cap)
 *  Airbnb          https://www.airbnb.es/s/Peniche--Portugal/homes?checkin=…&checkout=…&adults=2&price_max=120
 *                  &price_filter_num_nights=6&display_currency=EUR   (per-night price cap)
 */
(function (root) {
  const P = root.TASF_PLANNER;
  const pad = n => String(n).padStart(2, '0');
  const isoD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => new Date(s + 'T12:00:00');
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return isoD(d); };
  const nightsBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const yymmdd = s => s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10);
  const enc = encodeURIComponent;

  /** Travel window for the links.
   *  Fixed dates → exactly the visitor's dates.
   *  Flexible → a suggestion: the earliest upcoming start in one of the destination's best months
   *  for this visitor (ev.bestMonths, i.e. among the months they picked), at least 14 days from today,
   *  on a Saturday (Friday for a weekend trip); length = the chosen trip length (days, incl. travel days).
   *  Returns { mode: 'fixed'|'suggested', start, end, nights, days, month } */
  function tripWindow(d, ev, state, todayIso) {
    const today = todayIso || isoD(new Date());
    if (state.dateMode === 'fixed' && state.start && state.end && state.end >= state.start) {
      const end = state.end > state.start ? state.end : addDays(state.start, 1);
      return { mode: 'fixed', start: state.start, end, nights: nightsBetween(state.start, end), days: P.tripDays(state), month: parse(state.start).getMonth() };
    }
    const days = Math.max(2, P.tripDays(state));
    let months = (ev && ev.bestMonths && ev.bestMonths.length) ? ev.bestMonths.slice() : [];
    if (!months.length) months = (state.months && state.months.length && !state.anyTime) ? state.months.slice() : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const dow = state.tripType === 'weekend' ? 5 : 6;           // Fri for weekends, else Sat
    const earliest = addDays(today, 14);
    let best = null;
    months.forEach(m => {
      const y0 = parse(today).getFullYear();
      for (const y of [y0, y0 + 1]) {
        const first = `${y}-${pad(m + 1)}-01`;
        let s = first < earliest ? earliest : first;
        let dt = parse(s); while (dt.getDay() !== dow) dt.setDate(dt.getDate() + 1);
        s = isoD(dt);
        if (dt.getMonth() !== m) continue;                      // ran past that month → try next year
        if (!best || s < best.start) best = { start: s, month: m };
        break;
      }
    });
    if (!best) best = { start: earliest, month: parse(earliest).getMonth() };
    const end = addDays(best.start, days - 1);
    return { mode: 'suggested', start: best.start, end, nights: days - 1, days, month: best.month };
  }

  /** Rough stops note from distance (estimate only, no schedule data). */
  function stopsCode(km) { return km < 300 ? 'none' : km < 3000 ? 'direct1' : km < 8000 ? 'one' : 'oneTwo'; }

  /** Transparent stay budget.
   *  budget (per person, whole trip, from the Budget step)
   *  − flight estimate per person (middle of the app's distance-based return-flight band)
   *  = money left on the ground; STAY_SHARE of it goes to accommodation (the rest: food, surf, transport),
   *  divided by the nights → per person per night; × travellers → max price per night for the
   *  whole group (what the Booking.com / Airbnb price filters use). */
  const STAY_SHARE = 0.5;
  function stayBudget(d, state, origin, win, travellers) {
    const km = P.distKm(origin, d);
    const fc = P.flightCost(km);
    const flight = Math.round((fc[0] + fc[1]) / 2 / 10) * 10;
    const total = state.budget;
    const left = total - flight;
    const nights = Math.max(1, win.nights);
    const ppNight = left > 0 ? Math.floor(left * STAY_SHARE / nights) : 0;
    const n = Math.max(1, travellers || 1);
    const groupNight = Math.floor(ppNight * n / 5) * 5;
    return { km, flightLo: fc[0], flightHi: fc[1], flight, total, left, share: STAY_SHARE, nights, ppNight, travellers: n, groupNight, ok: ppNight >= 10 };
  }

  /** Default travellers by trip type (editable in the modal). */
  function defaultTravellers(tripType) { return { chill: 2, boys: 4 }[tripType] || 1; }

  function flightLinks(origin, dest, win, adults, lang) {
    const o = origin.iata || origin.id, a = Math.max(1, adults || 1);
    const q = `Flights to ${dest} from ${o} on ${win.start} through ${win.end}` + (a > 1 ? ` for ${a} adults` : '');
    return {
      google: `https://www.google.com/travel/flights?q=${enc(q)}&curr=EUR&hl=${lang === 'es' ? 'es' : 'en'}`,
      skyscanner: `https://www.skyscanner.${lang === 'es' ? 'es' : 'net'}/transport/flights/${(origin.sky || o).toLowerCase()}/${dest.toLowerCase()}/${yymmdd(win.start)}/${yymmdd(win.end)}/?adultsv2=${a}&cabinclass=economy&rtn=1&preferdirects=false`,
      kayak: `https://www.kayak.${lang === 'es' ? 'es' : 'com'}/flights/${o}-${dest}/${win.start}/${win.end}/${a}adults?sort=bestflight_a`
    };
  }

  function airbnbSlug(place) { return place.split(',').map(x => x.trim().replace(/\s+/g, '-')).map(enc).join('--'); }
  function stayLinks(d, win, guests, maxNight, lang) {
    const g = Math.max(1, guests || 1), rooms = g <= 2 ? 1 : Math.ceil(g / 2);
    const cap = maxNight > 0 ? Math.round(maxNight) : 0;
    const booking = `https://www.booking.com/searchresults.${lang === 'es' ? 'es' : 'en-gb'}.html?ss=${enc(d.stay)}&checkin=${win.start}&checkout=${win.end}&group_adults=${g}&no_rooms=${rooms}&group_children=0&selected_currency=EUR` + (cap ? `&nflt=${enc(`price=EUR-min-${cap}-1`)}` : '');
    const airbnb = `https://www.airbnb.${lang === 'es' ? 'es' : 'com'}/s/${airbnbSlug(d.stay)}/homes?checkin=${win.start}&checkout=${win.end}&adults=${g}&display_currency=EUR` + (cap ? `&price_max=${cap}&price_filter_num_nights=${win.nights}` : '');
    const q = s => `https://www.google.com/search?q=${enc(s)}`;
    return { booking, airbnb, camps: q(`surf camp ${d.stay}`), hostels: q(`surf hostel ${d.stay}`), charter: q(`surf charter ${d.name}`) };
  }

  /** Lodging categories (suggestions only, never property names), most fitting first. */
  function lodgingTypes(d, state, sb) {
    const T = state.tripType, L = state.level || 4;
    let list = { once: d.tags.includes('boat') ? ['charter', 'resort', 'villa'] : ['resort', 'villa', 'boutique'], weekend: ['hostel', 'apartment', 'camp'], boys: ['villa', 'hostel', 'camp'], chill: ['boutique', 'villa', 'apartment'], camp: ['camp', 'hostel', 'apartment'] }[T] || ['camp', 'apartment', 'villa'];
    if (L <= 2 && !list.includes('camp')) list = ['camp', ...list];
    if (sb && sb.ok && sb.ppNight < 35) list = [...list.filter(x => x === 'hostel' || x === 'camp'), ...list.filter(x => x !== 'hostel' && x !== 'camp'), ...(list.includes('hostel') ? [] : ['hostel'])];
    return list.slice(0, 4);
  }

  /* ------------------------------------------------------------------
   * LIVE OFFERS PLUG-IN POINT
   * The browser never talks to a flights/hotels API directly (API keys must stay secret). Instead,
   * deploy the small proxy in server/offers-proxy.example.mjs (Cloudflare Worker / Vercel / Netlify
   * function) and point the site at it:
   *     <script>window.TASF_CONFIG = { offersEndpoint: 'https://<your-proxy>/api/offers' }</script>
   * Request  (POST JSON): { origin:'MAD', destination:'LIS', destinations:['LIS'], departureDate, returnDate,
   *                         adults, rooms, stay:{ lat, lon, radiusKm, place }, maxPricePerNight, currency:'EUR' }
   * Response (JSON):      { source, fetchedAt (ISO), currency,
   *                         flights:[{ carriers:[name], flightNumbers:[…], outbound:{ depart, arrive, stops, durationMin },
   *                                    inbound:{…}, totalPrice, url? }],
   *                         stays:[{ name, totalPrice, pricePerNight, rating?, url? }] }
   * Only data coming back from that endpoint is ever shown as a price, airline or hotel name. When no
   * endpoint is configured (today), fetchLiveOffers() resolves to null and the UI keeps the search links.
   * ------------------------------------------------------------------ */
  function liveRequest(d, origin, win, adults, maxNight) {
    return { origin: origin.iata || origin.id, destination: d.airports[0], destinations: d.airports.slice(), departureDate: win.start, returnDate: win.end, adults: Math.max(1, adults || 1), rooms: adults <= 2 ? 1 : Math.ceil(adults / 2), stay: { lat: d.lat, lon: d.lon, radiusKm: 15, place: d.stay }, maxPricePerNight: maxNight > 0 ? Math.round(maxNight) : null, currency: 'EUR' };
  }
  function validLive(j) { return j && typeof j === 'object' && typeof j.source === 'string' && j.fetchedAt && (Array.isArray(j.flights) || Array.isArray(j.stays)); }
  async function fetchLiveOffers(req, cfg, timeoutMs = 15000) {
    if (!cfg || !cfg.offersEndpoint || typeof fetch !== 'function') return null;
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctl && setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(cfg.offersEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req), signal: ctl && ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!validLive(j)) throw new Error('bad response shape');
      return j;
    } finally { if (t) clearTimeout(t); }
  }

  root.TASF_TRAVEL = { tripWindow, stayBudget, stopsCode, defaultTravellers, flightLinks, stayLinks, lodgingTypes, liveRequest, fetchLiveOffers, validLive, STAY_SHARE, addDays, nightsBetween };
})(typeof window !== 'undefined' ? window : globalThis);

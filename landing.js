/* TAsF – company landing page (EN/ES). Content is original TAsF copy; numbers come from data.js / i18n.js. */
(function () {
  'use strict';
  const DESTS = window.TASF_DESTINATIONS || [], APP_I18N = window.TASF_I18N || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CODES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
  const HIGHLIGHTS = ['peniche', 'morocco', 'canaries', 'bali_bukit', 'siargao', 'costarica'];
  const nCountries = new Set(DESTS.map(d => d.country)).size;
  const nWaves = DESTS.reduce((a, d) => a + d.waves.length, 0);

  const L = {
    en: {
      brandSub: 'Travel and Surf', navConcept: 'Concept', navHow: 'How it works', navLevels: 'Levels', navTrips: 'Trips', navDest: 'Destinations', navContact: 'Contact',
      ctaPlan: 'Plan your trip', ctaHow: 'How it works', ctaTry: 'Try the planner', ctaMap: 'See them all on the map',
      heroEyebrow: 'Travel and surf', heroTitle: 'Surf the world',
      heroSub: 'Surf trips organised in person by surfers, plus an AI planner that matches the waves to your dates, your level and your budget.',
      signupTitle: 'Sign up to stay informed', signupLabel: 'Email', signupPh: 'your@email.com', signupBtn: 'Keep me posted',
      signupNote: 'Prototype: this form is not connected yet. Nothing you type is sent or stored.',
      signupDone: 'Thanks! This is a prototype, so your email was not sent or saved anywhere. Sign-ups open soon.',
      conceptEyebrow: 'The concept', conceptTitle: 'Two ways to get to your next wave',
      c1Title: 'Organised in person', c1Text: 'Tell a TAsF surf guide what you want and we organise the trip with you: destination, dates, flights, where to stay, boards, coaching and the plan for flat days.',
      c2Title: 'Planned with AI', c2Text: 'Answer a few questions and the world map lights up with the places that work for you. You get a top 5, a 7-day surf forecast, a sample itinerary and ready-made flight and stay searches.',
      howEyebrow: 'How the planner works', howTitle: 'Six questions, one map',
      how: [
        ['The map', 'A world map of surf destinations, coloured by season: dark green for peak season, light green for shoulder season, yellow for surfable and grey when it does not fit.'],
        ['Dates', 'Fixed dates or flexible months, plus how many days you have. The map recolours straight away.'],
        ['Your level, A1 to D2', 'Eight steps, from first contact with surfing to competition. Spots that are too heavy turn grey.'],
        ['Trip type', 'Once in a lifetime, a weekend getaway, a week with the crew, surf and chill as a couple, or a surf camp. And where you fly from.'],
        ['Budget', 'Your budget per person for the whole trip. Places likely to go over it move down the list.'],
        ['Waves', 'Optional: pick famous waves you want to surf and we put the places that have them first.']
      ],
      howEnd: 'Then you get your top 5 with the reasons, best months, a 7-day forecast and a “Plan my trip” button with a sample itinerary and prefilled flight and stay searches.',
      levelsEyebrow: 'Surf levels', levelsTitle: 'From your first wave to competition',
      levelsLead: 'TAsF uses its own 8-step scale. Pick the one that sounds like you and the map greys out spots that are too heavy and marks down the ones that would feel too easy.',
      groups: { A: 'Starting out', B: 'Building up', C: 'Advanced', D: 'Expert' },
      tripsEyebrow: 'Trip types', tripsTitle: 'What kind of trip is it?',
      destEyebrow: 'Destinations', destTitle: n => `${n} destinations, a few of them here`,
      destLead: 'Season, level and wave data are approximate general guidance, and we are checking them with surfers who know each spot.',
      destPeak: 'Peak season (approx.)', destLevel: 'Levels', destWaves: 'Waves', allYear: 'Several seasons',
      whyEyebrow: 'Why TAsF', whyTitle: 'More reasons to plan with us',
      why: [
        [String(DESTS.length), 'destinations on the map', `In ${nCountries} countries and territories, with coasts that work in different seasons split into their own spots.`],
        ['8', 'surf levels', 'Our A1–D2 scale, so a beginner and a big-wave surfer never get the same advice.'],
        ['5', 'trip types', 'The same place can be right for a crew week and wrong for a weekend. We rank for the trip you want.'],
        [String(nWaves), 'famous waves', 'Search them by name and the planner puts the places that have them first.'],
        ['7', 'day surf forecast', 'Wave height, period and wind for every destination, refreshed every day.']
      ],
      bandTitle: 'Find your wave',
      fPlan: 'Plan', fContact: 'Contact', fContactTodo: 'TODO: TAsF email, phone and social links', fLegal: 'Legal',
      fPrivacy: 'Privacy policy (TODO)', fLegalNotice: 'Legal notice (TODO)', fCookies: 'Cookie policy (TODO)',
      fCopy: 'TAsF – Travel and Surf · Prototype', fImages: 'Photos on this page are AI-generated illustrations.'
    },
    es: {
      brandSub: 'Travel and Surf', navConcept: 'Concepto', navHow: 'Cómo funciona', navLevels: 'Niveles', navTrips: 'Viajes', navDest: 'Destinos', navContact: 'Contacto',
      ctaPlan: 'Planifica tu viaje', ctaHow: 'Cómo funciona', ctaTry: 'Probar el planificador', ctaMap: 'Verlos todos en el mapa',
      heroEyebrow: 'Travel and surf', heroTitle: 'Surfea el mundo',
      heroSub: 'Viajes de surf organizados en persona por surfistas, y un planificador con IA que encaja las olas con tus fechas, tu nivel y tu presupuesto.',
      signupTitle: 'Apúntate para estar al día', signupLabel: 'Email', signupPh: 'tu@email.com', signupBtn: 'Avísame',
      signupNote: 'Prototipo: este formulario todavía no está conectado. Lo que escribas no se envía ni se guarda.',
      signupDone: '¡Gracias! Esto es un prototipo, así que tu email no se ha enviado ni guardado. Pronto abriremos las inscripciones.',
      conceptEyebrow: 'El concepto', conceptTitle: 'Dos formas de llegar a tu próxima ola',
      c1Title: 'Organizado en persona', c1Text: 'Cuéntale a un guía de surf de TAsF lo que buscas y organizamos el viaje contigo: destino, fechas, vuelos, alojamiento, tablas, clases y el plan para los días sin olas.',
      c2Title: 'Planificado con IA', c2Text: 'Responde unas preguntas y el mapa del mundo se ilumina con los sitios que te encajan. Tienes un top 5, la previsión de surf a 7 días, un itinerario de ejemplo y búsquedas de vuelos y alojamiento ya preparadas.',
      howEyebrow: 'Cómo funciona el planificador', howTitle: 'Seis preguntas, un mapa',
      how: [
        ['El mapa', 'Un mapa del mundo con destinos de surf coloreados por temporada: verde oscuro en temporada alta, verde claro en temporada media, amarillo si es surfeable y gris si no encaja.'],
        ['Fechas', 'Fechas fijas o meses flexibles, y cuántos días tienes. El mapa cambia de color al momento.'],
        ['Tu nivel, de A1 a D2', 'Ocho pasos, desde el primer contacto con el surf hasta la competición. Los spots demasiado pesados se ponen en gris.'],
        ['Tipo de viaje', 'Una vez en la vida, escapada de finde, una semana con los colegas, surf y relax en pareja o surf camp. Y desde dónde sales.'],
        ['Presupuesto', 'Tu presupuesto por persona para todo el viaje. Los sitios que probablemente se pasan bajan en la lista.'],
        ['Olas', 'Opcional: elige olas famosas que quieras surfear y ponemos primero los sitios que las tienen.']
      ],
      howEnd: 'Al final tienes tu top 5 con los motivos, los mejores meses, la previsión a 7 días y un botón “Planifica mi viaje” con un itinerario de ejemplo y búsquedas de vuelos y alojamiento ya rellenadas.',
      levelsEyebrow: 'Niveles de surf', levelsTitle: 'De tu primera ola a la competición',
      levelsLead: 'TAsF usa su propia escala de 8 pasos. Elige la que más se parezca a ti y el mapa pone en gris los spots demasiado pesados y baja los que se te quedarían cortos.',
      groups: { A: 'Empezando', B: 'Progresando', C: 'Avanzado', D: 'Experto' },
      tripsEyebrow: 'Tipos de viaje', tripsTitle: '¿Qué viaje quieres hacer?',
      destEyebrow: 'Destinos', destTitle: n => `${n} destinos, aquí tienes algunos`,
      destLead: 'Los datos de temporada, nivel y olas son orientativos, y los estamos revisando con surfistas que conocen cada spot.',
      destPeak: 'Temporada alta (aprox.)', destLevel: 'Niveles', destWaves: 'Olas', allYear: 'Varias temporadas',
      whyEyebrow: 'Por qué TAsF', whyTitle: 'Más razones para planificar con nosotros',
      why: [
        [String(DESTS.length), 'destinos en el mapa', `En ${nCountries} países y territorios, y las costas que funcionan en temporadas distintas van como destinos separados.`],
        ['8', 'niveles de surf', 'Nuestra escala A1–D2, para que un principiante y un surfista de olas grandes nunca reciban el mismo consejo.'],
        ['5', 'tipos de viaje', 'El mismo sitio puede ser perfecto para una semana con los colegas y no para un finde. Ordenamos según el viaje que quieres.'],
        [String(nWaves), 'olas famosas', 'Búscalas por nombre y el planificador pone primero los sitios que las tienen.'],
        ['7', 'días de previsión', 'Altura de ola, periodo y viento en cada destino, actualizados cada día.']
      ],
      bandTitle: 'Encuentra tu ola',
      fPlan: 'Planifica', fContact: 'Contacto', fContactTodo: 'PENDIENTE: email, teléfono y redes de TAsF', fLegal: 'Legal',
      fPrivacy: 'Política de privacidad (PENDIENTE)', fLegalNotice: 'Aviso legal (PENDIENTE)', fCookies: 'Política de cookies (PENDIENTE)',
      fCopy: 'TAsF – Travel and Surf · Prototipo', fImages: 'Las fotos de esta página son ilustraciones generadas con IA.'
    }
  };
  const TRIP_ART = { once: 'assets/img/reef.jpg', weekend: '', boys: 'assets/img/crew.jpg', chill: '', camp: 'assets/img/lesson.jpg' };

  let lang = localStorage.getItem('tasf-lang') || ((navigator.language || '').startsWith('es') ? 'es' : 'en');
  function monthsRange(d, t) {
    const pk = d.seasons.map((v, i) => v === 3 ? i : -1).filter(i => i >= 0);
    if (!pk.length) return null;
    // group consecutive months (wrapping Dec→Jan)
    const set = new Set(pk), starts = pk.filter(m => !set.has((m + 11) % 12));
    if (!starts.length) return t.allYear;
    return starts.map(s => { let e = s; while (set.has((e + 1) % 12) && (e + 1) % 12 !== s) e = (e + 1) % 12; return s === e ? APP_I18N[lang].months[s] : `${APP_I18N[lang].months[s]}–${APP_I18N[lang].months[e]}`; }).join(', ');
  }
  function render() {
    const t = L[lang], A = APP_I18N[lang] || APP_I18N.en;
    document.documentElement.lang = lang;
    document.title = lang === 'es' ? 'TAsF – Travel and Surf · Viajes de surf por el mundo' : 'TAsF – Travel and Surf · Surf trips around the world';
    document.querySelectorAll('[data-i18n]').forEach(n => { const v = t[n.dataset.i18n]; if (typeof v === 'string') n.textContent = v; });
    document.querySelectorAll('[data-i18n-ph]').forEach(n => { n.placeholder = t[n.dataset.i18nPh]; });
    document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    $('#howList').innerHTML = t.how.map((s, i) => `<details class="step"${i === 0 ? ' open' : ''}><summary><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="st">${esc(s[0])}</span><span class="pm" aria-hidden="true"></span></summary><p>${esc(s[1])}</p></details>`).join('') + `<p class="how-end">${esc(t.howEnd)}</p>`;
    $('#levelGrid').innerHTML = (A.levels || []).map((l, i) => `<div class="lv g${CODES[i][0]}"><span class="lv-code">${CODES[i]}</span><span class="lv-grp">${esc(t.groups[CODES[i][0]])}</span><p>${esc(l)}</p></div>`).join('');
    $('#tripStrip').innerHTML = Object.keys(A.trips).map((k, i) => `<a class="trip t-${k}" href="app/index.html"${TRIP_ART[k] ? ` style="background-image:linear-gradient(180deg,rgba(6,28,40,0) 35%,rgba(6,28,40,.85)),url(${TRIP_ART[k]})"` : ''}><span class="trip-n">${String(i + 1).padStart(2, '0')}</span><span class="trip-t">${esc(A.trips[k])}</span><span class="trip-h">${esc(A.tripHints[k])}</span></a>`).join('');
    $('#destTitle').textContent = t.destTitle(DESTS.length);
    $('#destGrid').innerHTML = HIGHLIGHTS.map(id => DESTS.find(d => d.id === id)).filter(Boolean).map(d => {
      const name = (lang === 'es' && d.nameEs) || d.name, country = (A.countries && A.countries[d.country]) || d.country;
      const lv = d.lvl[0] === d.lvl[1] ? CODES[d.lvl[0] - 1] : `${CODES[d.lvl[0] - 1]}–${CODES[d.lvl[1] - 1]}`;
      const strip = d.seasons.map((v, i) => `<i class="s${v}" title="${esc(A.monthsLong[i])}"></i>`).join('');
      return `<article class="dest"><div class="dest-h"><h3>${esc(name)}</h3><span>${esc(country)}</span></div>
        <div class="dest-strip" aria-hidden="true">${strip}</div>
        <dl><dt>${t.destPeak}</dt><dd>${esc(monthsRange(d, t) || '—')}</dd><dt>${t.destLevel}</dt><dd>${lv}</dd><dt>${t.destWaves}</dt><dd>${esc(d.waves.slice(0, 3).map(w => w.name).join(', '))}</dd></dl></article>`;
    }).join('');
    $('#whyList').innerHTML = t.why.map((w, i) => `<div class="why-row"><span class="why-n">${esc(w[0])}</span><div><h3>${esc(w[1])}</h3><p>${esc(w[2])}</p></div></div>`).join('');
  }
  document.querySelectorAll('.lang button').forEach(b => b.onclick = () => { lang = b.dataset.lang; localStorage.setItem('tasf-lang', lang); render(); });
  $('#signup').addEventListener('submit', e => { e.preventDefault(); $('#email').value = ''; $('#signupNote').textContent = L[lang].signupDone; $('#signupNote').classList.add('done'); });
  const burger = $('#navBurger'), links = $('#navLinks');
  burger.onclick = () => { const o = !document.body.classList.contains('menu-open'); document.body.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', String(o)); };
  links.addEventListener('click', e => { if (e.target.closest('a')) { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); } });
  const nav = $('.nav'); const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40); window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  render();
})();

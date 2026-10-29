/* TAsF – Travel and Surf · destination dataset (PROTOTYPE)
 * ---------------------------------------------------------------
 * All values are APPROXIMATE, based on widely published general surf-season
 * guidance. They are NOT measured statistics and MUST be validated by
 * local experts / real swell data before any commercial use.
 *
 * seasons: 12 chars, Jan..Dec  3 = peak, 2 = shoulder, 1 = surfable, 0 = not surfable
 *          (rating for an intermediate / core surfer)
 * beg:     optional override used for levels A1, A2 and B1 (smaller, friendlier months)
 * big:     optional override used for levels D1 and D2 (big-wave / heavy swell months)
 * lvl:     [min, max] suitable level on TAsF's 8-step scale, stored as 1..8:
 *          1 A1 First contact · 2 A2 Stands up, needs help catching waves ·
 *          3 B1 Sits at the peak, catches small unbroken waves · 4 B2 Rides the face, tries manoeuvres ·
 *          5 C1 Does some manoeuvres, keeps progressing · 6 C2 Has surfed world-class breaks, enjoys vertical waves ·
 *          7 D1 Freesurf, experienced at world-class breaks · 8 D2 Competition
 *          Migrated 2026-10-29 from the old 1..5 scale (first guess, see README "Level scale"):
 *          min 1→A1, 2→B1, 3→B2, 4→C1, 5→D1 · max 3→C1, 4→C2, 5→D2, then refined per spot.
 *          Backup of the old values: data.js.bak-pre-8levels-20261029
 * cost:    on-the-ground cost tier per person per week (stay, food, surf),
 *          1 = budget · 2 = moderate · 3 = comfortable · 4 = premium (boats / resorts)
 * tags:    bucket (once-in-a-lifetime), social (groups/nightlife), chill (couples/relax),
 *          camp (surf camps & schools), boat (boat-trip style), cold (wetsuit 4/3+)
 * waves:   famous waves "Name|level" (level = minimum recommended, 1..8 = A1..D2)
 * notes:   general travel notes (EN / ES)
 * opt:     { beg, big, nameEs (Spanish name), group (parent region shared by sub-destinations
 *          split from one multi-coast region, e.g. 'algarve'), splitFrom (old id) }
 * contest: (set below) top-level contest held there, { en, es }; favours the spot for D2 surfers
 * sources / confidence / needsValidation / validationNote: first-pass desk validation (see VALIDATION.md)
 */
(function () {
  const D = [];
  function add(id, name, country, lat, lon, seasons, lvl, cost, tags, waves, notesEn, notesEs, opt) {
    const toArr = s => s.split('').map(Number);
    D.push(Object.assign({
      id, name, country, lat, lon,
      seasons: toArr(seasons), lvl, cost, tags,
      waves: waves.map(w => { const [n, l] = w.split('|'); return { name: n, level: +l }; }),
      notes: { en: notesEn, es: notesEs }
    }, {
      beg: opt && opt.beg ? toArr(opt.beg) : null,
      big: opt && opt.big ? toArr(opt.big) : null,
      nameEs: (opt && opt.nameEs) || null,   // Spanish display name (falls back to name)
      group: (opt && opt.group) || null,     // parent region: sub-destinations of one region share it (ranking diversity)
      splitFrom: (opt && opt.splitFrom) || null
    }));
  }

  // ---------- EUROPE ----------
  add('peniche', 'Peniche & Ericeira', 'Portugal', 39.2, -9.4, '222211113332', [1, 8], 2, ['social', 'camp'],
    ['Supertubos|5', 'Coxos|5', 'Ribeira d\'Ilhas|4', 'Baleal|1'],
    'Fly to Lisbon (1h from Madrid), 45–60 min drive. Surf camps everywhere; wetsuit 4/3 in winter.',
    'Vuelo a Lisboa (1h desde Madrid), 45–60 min en coche. Muchos surf camps; neopreno 4/3 en invierno.',
    { beg: '111122333311' });
  add('nazare', 'Nazaré', 'Portugal', 39.6, -9.08, '332100001233', [7, 8], 2, ['bucket', 'cold'],
    ['Praia do Norte|7'],
    'Big-wave arena: tow-in season Oct–Mar. Spectators welcome on the lighthouse cliff.',
    'Escenario de olas gigantes: temporada de tow-in oct–mar. Se puede ver desde el faro.');
  add("algarve_west", "Algarve West Coast (Arrifana & Amado)", "Portugal", 37.19, -8.9, "333221112333", [1, 6], 2, ["chill", "camp"],
    ["Arrifana|1", "Amado|1", "Tonel|3", "Cordoama|4"],
    "Faro airport, ~1–1.5h drive (Lisbon ~3h). Open Atlantic coast north of Sagres: consistent all year, powerful Oct–Apr, knee-to-shoulder-high in summer (great for learning).",
    "Aeropuerto de Faro, ~1–1,5h en coche (Lisboa ~3h). Costa atlántica abierta al norte de Sagres: constante todo el año, potente oct–abr y olas pequeñas en verano (ideal para aprender).",
    { beg: "111123333211", nameEs: "Algarve, costa oeste (Arrifana y Amado)", group: "algarve", splitFrom: "algarve" });
  add("algarve_south", "Algarve South Coast (Sagres to Lagos)", "Portugal", 37.07, -8.76, "222100001222", [1, 6], 2, ["chill"],
    ["Zavial|4", "Beliche|5", "Mareta|1", "Meia Praia|1"],
    "Faro airport, ~1h drive to Lagos. Sheltered south-facing beaches that wake up on big winter NW swells wrapping round Cape St Vincent or on S/SW swells; nearly flat May–Sep. Stay between Lagos and Sagres so you can switch to the west coast.",
    "Aeropuerto de Faro, ~1h hasta Lagos. Playas resguardadas orientadas al sur que funcionan con grandes swells de invierno que rodean el cabo de San Vicente o con swells del S/SO; casi plano may–sep. Alójate entre Lagos y Sagres para poder cambiar a la costa oeste.",
    { nameEs: "Algarve, costa sur (de Sagres a Lagos)", group: "algarve", splitFrom: "algarve" });
  add('basque', 'Basque Country (Mundaka & Zarautz)', 'Spain', 43.4, -2.7, '222211113332', [1, 8], 2, ['social', 'camp', 'chill'],
    ['Mundaka|5', 'Zarautz|1', 'La Zurriola|1', 'Meñakoz|7'],
    'Bilbao or San Sebastián airport; great food scene. Mundaka needs a solid autumn swell.',
    'Aeropuerto de Bilbao o San Sebastián; gran gastronomía. Mundaka necesita un buen swell de otoño.',
    { beg: '111122333211' });
  add('hossegor', 'Hossegor & Landes', 'France', 43.66, -1.44, '111221123331', [3, 8], 3, ['social'],
    ['La Gravière|6', 'La Nord|7', 'Les Culs Nus|3'],
    'Biarritz airport, 30 min. Powerful beach-break barrels in autumn; busy and fun in summer.',
    'Aeropuerto de Biarritz, 30 min. Tubos potentes en otoño; ambiente animado en verano.',
    { beg: '111122333211' });
  add('canaries', 'Canary Islands (Lanzarote & Fuerteventura)', 'Spain', 28.7, -13.9, '332211112333', [1, 8], 2, ['social', 'camp', 'chill'],
    ['El Quemao|7', 'San Juan|5', 'El Hierro (Fuerteventura)|4', 'Flag Beach|1'],
    '2.5–3h flight from Madrid. Winter North Atlantic swells; year-round warm-ish water.',
    '2,5–3h de vuelo desde Madrid. Swells del Atlántico norte en invierno; agua templada todo el año.',
    { beg: '222223333222' });
  add('cornwall', 'Cornwall', 'United Kingdom', 50.4, -5.1, '111211123321', [1, 5], 3, ['camp', 'cold'],
    ['Fistral|1', 'Porthleven|5'],
    'Fly to Newquay or train from London. Cold water; summer is gentle and beginner friendly.',
    'Vuelo a Newquay o tren desde Londres. Agua fría; en verano olas suaves para principiantes.',
    { beg: '111122333211' });
  add("ireland", "Ireland (Bundoran & Mullaghmore)", "Ireland", 54.48, -8.28, "222211113332", [3, 8], 3, ["cold", "bucket"],
    ["Mullaghmore Head|7", "The Peak Bundoran|5"],
    "Fly to Dublin/Knock. Thick wetsuits (5/4 in winter). Mullaghmore is a big-wave tow spot.",
    "Vuelo a Dublín/Knock. Neopreno grueso (5/4 en invierno). Mullaghmore: ola gigante de tow-in.",
    { beg: "111122332111", big: "332100000233", nameEs: "Irlanda (Bundoran y Mullaghmore)", group: "ireland" });
  add("clare", "Clare (Lahinch & Cliffs of Moher)", "Ireland", 52.94, -9.35, "222211113332", [1, 8], 3, ["cold", "camp", "bucket"],
    ["Lahinch Beach|1", "Spanish Point|4", "Crab Island|6", "Aileen's|7"],
    "Fly to Shannon (~50 min drive). Lahinch is Ireland’s surf town: learner beach in summer, reefs (Crab Island, Spanish Point) in autumn and Aileen’s big-wave slab under the Cliffs of Moher in winter. 5/4 + boots, gloves and hood in winter.",
    "Vuelo a Shannon (~50 min en coche). Lahinch es el pueblo surfero de Irlanda: playa para aprender en verano, arrecifes (Crab Island, Spanish Point) en otoño y la ola gigante de Aileen’s bajo los acantilados de Moher en invierno. Neopreno 5/4 con escarpines, guantes y capucha en invierno.",
    { beg: "111123332111", big: "332100000233", nameEs: "Clare (Lahinch y acantilados de Moher)", group: "ireland", splitFrom: "ireland" });
  add('scotland', 'Thurso', 'Scotland', 58.6, -3.5, '322100012333', [4, 8], 3, ['cold'],
    ['Thurso East|5'],
    'Remote north coast; fly to Inverness or Wick. Cold, powerful reef breaks in autumn.',
    'Costa norte remota; vuelo a Inverness o Wick. Arrecifes fríos y potentes en otoño.');
  add('iceland', 'Reykjanes & Westfjords', 'Iceland', 63.85, -22.5, '122111112321', [4, 8], 4, ['cold', 'bucket'],
    ['Thorli|4', 'Sandvík|4'],
    'Expedition-style cold-water surf under the northern lights. Expensive; 5/4 + hood.',
    'Surf de expedición en agua fría bajo auroras. Caro; neopreno 5/4 con capucha.');

  // ---------- AFRICA ----------
  add('morocco', 'Taghazout', 'Morocco', 30.54, -9.71, '333211112333', [1, 8], 1, ['social', 'camp'],
    ['Anchor Point|5', 'Killer Point|5', 'Boilers|5', 'Banana Point|1'],
    'Fly to Agadir (~2h from Madrid). Right-hand points in winter; budget-friendly surf houses.',
    'Vuelo a Agadir (~2h desde Madrid). Puntas de derechas en invierno; surf houses económicas.',
    { beg: '222222122222' });
  add("dakar_north", "Dakar North Shore (Ngor & Yoff)", "Senegal", 14.76, -17.51, "332210001233", [1, 6], 2, ["chill", "camp"],
    ["N'Gor Right|4", "Ngor Left|3", "Yoff|1", "Le Virage|1"],
    "Direct flights from Europe (~4h). Winter NW swells (Oct/Nov–Apr) hit Ngor island (5-min pirogue) and Yoff; cooler upwelling water Jan–Apr (3/2 wetsuit).",
    "Vuelos directos desde Europa (~4h). Swells del NO en invierno (oct/nov–abr) en la isla de Ngor (5 min en piragua) y Yoff; agua más fría ene–abr (neopreno 3/2).",
    { nameEs: "Dakar, costa norte (Ngor y Yoff)", group: "dakar", splitFrom: "senegal" });
  add("dakar_south", "Dakar South Coast (Ouakam & Almadies reefs)", "Senegal", 14.7, -17.47, "111123333211", [3, 6], 2, ["chill"],
    ["Ouakam|5", "Vivier|5", "Club Med|5", "Secret|3"],
    "Summer S/SW swells (May/Jun–Sep) on the reefs from the Almadies to Ouakam; warm water (25–28 °C) and trade winds often offshore. Rainy season Jul–Oct. Shallow volcanic reef with urchins: bring booties.",
    "Swells del S/SO en verano (may/jun–sep) en los arrecifes de Almadies a Ouakam; agua cálida (25–28 °C) y alisios a menudo offshore. Lluvias jul–oct. Arrecife volcánico poco profundo con erizos: lleva escarpines.",
    { nameEs: "Dakar, costa sur (Ouakam y arrecifes de Almadies)", group: "dakar", splitFrom: "senegal" });
  add('namibia', 'Skeleton Bay', 'Namibia', -22.85, 14.53, '000233333100', [6, 8], 3, ['bucket', 'cold'],
    ['Skeleton Bay|6'],
    'One of the longest sand-bottom barrels on Earth. Fly to Walvis Bay via Johannesburg/Windhoek.',
    'Uno de los tubos de arena más largos del planeta. Vuelo a Walvis Bay vía Johannesburgo/Windhoek.');
  add('jbay', 'Jeffreys Bay', 'South Africa', -34.05, 24.93, '111233332211', [3, 8], 2, ['bucket'],
    ['Supertubes|5', 'Kitchen Windows|3', 'Boneyards|5'],
    'Fly to Port Elizabeth (Gqeberha). Winter (Jun–Aug) is prime for long, fast rights.',
    'Vuelo a Port Elizabeth (Gqeberha). El invierno austral (jun–ago) es la mejor época.',
    { beg: '222111112222' });
  add('mozambique', 'Tofo', 'Mozambique', -23.85, 35.55, '112333333111', [1, 6], 2, ['chill', 'bucket'],
    ['Tofinho|4', 'Tofo Beach|1'],
    'Remote, warm and wild — whale sharks and manta rays. Fly to Inhambane via Maputo.',
    'Remoto, cálido y salvaje: tiburones ballena y mantas. Vuelo a Inhambane vía Maputo.');

  add("maldives_male", "Maldives – Malé Atolls (Cokes & Chickens)", "Maldives", 4.3, 73.55, "112333333211", [4, 8], 4, ["bucket", "boat", "chill"],
    ["Cokes|5", "Chickens|4", "Sultans|4", "Pasta Point|4"],
    "Fly to Malé; breaks are minutes away by boat. Boat trips or resort access; forgiving deep-water reefs for confident surfers. Busiest Jun–Aug.",
    "Vuelo a Malé; las olas están a minutos en barco. Barco o resort; arrecifes con buena profundidad para surfistas con confianza. Más gente jun–ago.",
    { nameEs: "Maldivas – atolones de Malé (Cokes y Chickens)", group: "maldives", splitFrom: "maldives" });
  add("maldives_south", "Maldives – Southern Atolls (Huvadhoo)", "Maldives", 0.35, 73.25, "123321113321", [4, 8], 4, ["bucket", "boat"],
    ["Beacons|6", "Blue Bowls|4", "Love Charms|4", "Tiger Stripes|5", "Five Islands|5"],
    "Fly to Malé, then a domestic flight south (Kooddoo / Kaadedhdhoo) to a charter boat or resort. Remote, uncrowded reef passes with strong tidal rips; best Feb/Mar–Apr and Sep–Oct when the wind is lighter.",
    "Vuelo a Malé y vuelo doméstico al sur (Kooddoo / Kaadedhdhoo) hasta el barco chárter o el resort. Pasos de arrecife remotos y sin gente, con corrientes fuertes; mejor feb/mar–abr y sep–oct, con menos viento.",
    { nameEs: "Maldivas – atolones del sur (Huvadhoo)", group: "maldives", splitFrom: "maldives" });
  // ---------- INDIAN OCEAN & ASIA ----------
  add('srilanka_s', 'South Coast (Weligama & Hikkaduwa)', 'Sri Lanka', 5.97, 80.43, '333210000123', [1, 5], 1, ['chill', 'camp', 'social'],
    ['Weligama|1', 'Midigama|4', 'Hikkaduwa Reef|3'],
    'Fly to Colombo. Season Nov–Apr; one of Asia’s best learner destinations.',
    'Vuelo a Colombo. Temporada nov–abr; uno de los mejores destinos de Asia para aprender.');
  add('arugam', 'Arugam Bay', 'Sri Lanka', 6.84, 81.83, '000123332100', [1, 6], 1, ['social', 'chill'],
    ['Main Point|4', 'Whiskey Point|3', 'Peanut Farm|1'],
    'East coast, season May–Oct (when the south coast is blown out). ~6–8h drive from Colombo.',
    'Costa este, temporada may–oct (cuando el sur no funciona). ~6–8h desde Colombo.');
  add("bali_bukit", "Bali – Bukit & West Coast (Uluwatu & Canggu)", "Indonesia", -8.78, 115.08, "112333333321", [1, 6], 2, ["social", "camp", "bucket"],
    ["Uluwatu|5", "Padang Padang|6", "Kuta Beach|1"],
    "Fly to Denpasar. Dry season (Apr–Oct): SE trades blow offshore on the Bukit reefs every morning; in the wet season this side is mostly onshore. Beginners at Kuta and Canggu all year.",
    "Vuelo a Denpasar. Temporada seca (abr–oct): los alisios del SE soplan offshore en los arrecifes del Bukit cada mañana; en la temporada de lluvias este lado suele estar onshore. Principiantes en Kuta y Canggu todo el año.",
    { beg: "222222222222", nameEs: "Bali – Bukit y costa oeste (Uluwatu y Canggu)", group: "bali", splitFrom: "bali" });
  add("bali_east", "Bali – East Coast (Keramas, Sanur & Nusa Dua)", "Indonesia", -8.62, 115.32, "333211111233", [3, 6], 2, ["chill"],
    ["Keramas|5", "Sanur Reef|5", "Nusa Dua|4"],
    "Fly to Denpasar (20–40 min). Wet season (Nov–Mar): the W monsoon blows offshore on the east-facing reefs; Keramas is a hollow, contest-level right (night surfing under lights at a resort).",
    "Vuelo a Denpasar (20–40 min). Temporada de lluvias (nov–mar): el monzón del oeste sopla offshore en los arrecifes orientados al este; Keramas es una derecha hueca de nivel competición (surf nocturno con focos en un resort).",
    { nameEs: "Bali – costa este (Keramas, Sanur y Nusa Dua)", group: "bali", splitFrom: "bali" });
  add('gland', 'G-Land (Java)', 'Indonesia', -8.75, 114.35, '001233332100', [5, 8], 3, ['bucket'],
    ['G-Land|5'],
    'Jungle surf camp at Grajagan Bay; transfer from Bali by boat/road. Long, mechanical left.',
    'Surf camp en la jungla de Grajagan; traslado desde Bali. Izquierda larga y perfecta.');
  add('lombok', 'Lombok (Gerupuk & Desert Point)', 'Indonesia', -8.9, 116.3, '111233332111', [1, 8], 2, ['chill', 'camp'],
    ['Desert Point|6', 'Gerupuk Inside|1', 'Mawi|5'],
    'Short hop from Bali. Gerupuk bay for learners, Desert Point for elite barrels.',
    'A un salto desde Bali. Bahía de Gerupuk para aprender, Desert Point para tubos de élite.',
    { beg: '222222222222' });
  add('sumbawa', 'Sumbawa (Lakey Peak)', 'Indonesia', -8.8, 118.4, '111233332111', [4, 8], 2, ['chill'],
    ['Lakey Peak|5', 'Periscopes|5', 'Scar Reef|6'],
    'Fly Bali → Bima, then 2–3h drive. Consistent A-frame peaks, fewer crowds than Bali.',
    'Vuelo Bali → Bima y 2–3h por carretera. Picos consistentes, menos gente que en Bali.');
  add('mentawai', 'Mentawai Islands', 'Indonesia', -2.1, 99.6, '112333332211', [4, 8], 4, ['bucket', 'boat'],
    ['HTs (Lances Right)|5', 'Macaronis|5', 'Rifles|6', 'Kandui|5'],
    'Fly to Padang, then fast ferry or charter boat. Peak May–Sep; shoulder Apr & Oct.',
    'Vuelo a Padang y ferry rápido o barco chárter. Pico may–sep; temporada media abr y oct.');
  add('siargao', 'Siargao', 'Philippines', 9.8, 126.16, '112221112331', [1, 8], 1, ['social', 'chill', 'bucket'],
    ['Cloud 9|5', 'Jacking Horse|2', 'Stimpy\'s|5'],
    'Fly via Manila or Cebu. Best Aug–Nov (typhoon swells); island vibe and nightlife.',
    'Vuelo vía Manila o Cebú. Mejor ago–nov (swells de tifones); ambiente isleño y fiesta.',
    { beg: '112223333221' });
  add('japan', 'Chiba & Shonan', 'Japan', 35.3, 140.4, '111111223321', [1, 6], 3, ['social'],
    ['Ichinomiya (Tsurigasaki)|3', 'Shonan|1'],
    'Close to Tokyo. Typhoon swells Aug–Oct; Olympic venue at Tsurigasaki.',
    'Cerca de Tokio. Swells de tifones ago–oct; sede olímpica en Tsurigasaki.');

  // ---------- OCEANIA ----------
  add('goldcoast', 'Gold Coast', 'Australia', -28.1, 153.45, '233322211112', [1, 8], 3, ['social', 'camp'],
    ['Snapper Rocks (Superbank)|5', 'Kirra|5', 'Burleigh Heads|5', 'Currumbin Alley|1'],
    'Fly to Coolangatta/Brisbane. Cyclone swells Feb–Apr light up the points.',
    'Vuelo a Coolangatta/Brisbane. Los swells ciclónicos feb–abr encienden las puntas.',
    { beg: '222222222222' });
  add('margaret', 'Margaret River', 'Australia', -33.95, 115.0, '113332223321', [4, 8], 3, ['chill', 'cold'],
    ['Main Break|5', 'The Box|7'],
    'Fly to Perth, 3h drive. Powerful Indian Ocean reefs; wineries for the downtime.',
    'Vuelo a Perth y 3h en coche. Arrecifes potentes; bodegas para descansar.',
    { beg: '222111111222', big: '112333332211' });
  add('raglan', 'Raglan', 'New Zealand', -37.8, 174.87, '223333322211', [1, 8], 3, ['chill', 'bucket', 'cold'],
    ['Manu Bay|4', 'Indicators|5', 'Ngarunui Beach|1'],
    'Fly to Auckland, 2h drive. Long left points; road-trip country.',
    'Vuelo a Auckland y 2h en coche. Largas izquierdas; perfecto para road-trip.',
    { beg: '332211112233' });
  add("fiji_mamanuca", "Fiji – Mamanucas (Tavarua & Namotu)", "Fiji", -17.85, 177.19, "112333333211", [5, 8], 4, ["bucket", "boat", "chill"],
    ["Cloudbreak|6", "Restaurants|5", "Namotu Left|4"],
    "Fly to Nadi, boat to the islands. Premium resort access to world-class reefs; SE trades side-offshore May–Oct.",
    "Vuelo a Nadi y barco a las islas. Resorts premium con acceso a arrecifes de clase mundial; alisios del SE side-offshore may–oct.",
    { nameEs: "Fiyi – Mamanucas (Tavarua y Namotu)", group: "fiji", splitFrom: "fiji" });
  add("fiji_coral", "Fiji – Coral Coast & Frigates", "Fiji", -18.22, 177.95, "333222222233", [1, 8], 3, ["bucket", "chill"],
    ["Frigates|6", "Fiji Pipe|5", "Shifties|4", "Natadola Beach|1"],
    "Fly to Nadi, ~1.5–3h drive along the south coast of Viti Levu. Glassy, light-wind summer (Dec–Mar) lights up the local reefs; Frigates Pass (boat trip) is offshore in the winter trades. Fewer crowds than the Mamanucas.",
    "Vuelo a Nadi y ~1,5–3h en coche por la costa sur de Viti Levu. El verano sin viento (dic–mar) enciende los arrecifes locales; Frigates (en barco) está offshore con los alisios de invierno. Menos gente que en las Mamanucas.",
    { nameEs: "Fiyi – Coral Coast y Frigates", group: "fiji", splitFrom: "fiji" });
  add('tahiti', 'Tahiti (Teahupo\'o)', 'French Polynesia', -17.85, -149.27, '112333332111', [6, 8], 4, ['bucket', 'chill'],
    ['Teahupo\'o|6', 'Taapuna|5'],
    'Fly to Papeete. Teahupo\'o is the heaviest left on the planet — experts only.',
    'Vuelo a Papeete. Teahupo\'o es la izquierda más pesada del planeta: solo expertos.',
    { big: '112333332111' });

  // ---------- NORTH AMERICA & HAWAII ----------
  add('northshore', 'Oahu North Shore', 'Hawaii, USA', 21.62, -158.08, '332100001233', [6, 8], 4, ['bucket'],
    ['Pipeline|6', 'Sunset Beach|6', 'Waimea Bay|7', 'Rocky Point|5'],
    'Winter (Nov–Feb) is the season. Serious, crowded lineups — respect locals.',
    'La temporada es el invierno (nov–feb). Lineups exigentes y llenos: respeto a los locales.');
  add('waikiki', 'Oahu South Shore (Waikiki)', 'Hawaii, USA', 21.27, -157.83, '111233332111', [1, 5], 4, ['chill', 'camp'],
    ['Queens|1', 'Canoes|1', 'Ala Moana Bowls|5'],
    'Summer south swells; the birthplace of modern surfing. Mellow longboard waves.',
    'Swells del sur en verano; cuna del surf moderno. Olas suaves para longboard.',
    { beg: '222333333222' });
  add("jaws", "Maui (Peʻahi / Jaws)", "Hawaii, USA", 20.94, -156.3, "332100000123", [7, 8], 4, ["bucket"],
    ["Peʻahi (Jaws)|7"],
    "Big-wave paddle/tow arena on Maui’s north shore; only breaks on the biggest winter swells. For Honolua Bay see Maui (Honolua Bay & West Maui).",
    "Escenario de olas gigantes (remada/tow-in) en la costa norte de Maui; solo rompe con los mayores swells de invierno. Para Honolua Bay, ver Maui (Honolua Bay y oeste de Maui).",
    { group: "maui" });
  add("maui", "Maui (Honolua Bay & West Maui)", "Hawaii, USA", 21.01, -156.64, "321100000123", [5, 8], 4, ["bucket", "chill"],
    ["Honolua Bay|5"],
    "Fly to Kahului (OGG), ~1h drive to the north-west tip. Honolua is a winter right point (Nov–Mar, best Jan) that needs a N–NW swell getting past Molokaʻi: fickle and crowded on good days. Marine conservation area.",
    "Vuelo a Kahului (OGG) y ~1h en coche hasta el extremo noroeste. Honolua es una derecha de invierno (nov–mar, mejor en enero) que necesita un swell del N–NO que pase Molokaʻi: caprichosa y llena los días buenos. Reserva marina.",
    { nameEs: "Maui (Honolua Bay y oeste de Maui)", group: "maui", splitFrom: "jaws" });
  add('norcal', 'Santa Cruz & Mavericks', 'California, USA', 37.2, -122.4, '332221112333', [3, 8], 4, ['cold'],
    ['Mavericks|7', 'Steamer Lane|4', 'Pleasure Point|3'],
    'Fly to San Francisco. Cold water, kelp and power. Mavericks breaks on big winter swells.',
    'Vuelo a San Francisco. Agua fría y potencia. Mavericks rompe con los grandes swells de invierno.',
    { big: '332100000123' });
  add("sandiego", "San Diego (La Jolla, Black's & Swami's)", "California, USA", 32.95, -117.27, "332111222333", [1, 6], 4, ["social", "camp"],
    ["Swami's|4", "Windansea|5", "Black's Beach|5", "La Jolla Shores|1"],
    "Fly to San Diego. Winter (Dec–Feb) W/NW swells light up the La Jolla reefs, Black’s canyon and Swami’s point; autumn brings Santa Ana offshores; summer is small and warm, good for lessons. 4/3 wetsuit in winter.",
    "Vuelo a San Diego. En invierno (dic–feb) los swells del O/NO encienden los arrecifes de La Jolla, el cañón de Black’s y la punta de Swami’s; en otoño, vientos offshore de Santa Ana; el verano es pequeño y cálido, bueno para clases. Neopreno 4/3 en invierno.",
    { beg: "111122333211", nameEs: "San Diego (La Jolla, Black's y Swami's)", group: "socal", splitFrom: "socal" });
  add("trestles", "Trestles & Orange County", "California, USA", 33.4, -117.62, "111233333221", [3, 8], 4, ["social"],
    ["Trestles|4", "Huntington Pier|3"],
    "Fly to Orange County (SNA), LA or San Diego. Trestles (San Clemente) is a cobblestone \"wave factory\" on summer S/SW swells (May–Oct), reached by a walk-in trail. Busy, high-performance line-ups.",
    "Vuelo a Orange County (SNA), Los Ángeles o San Diego. Trestles (San Clemente) es una \"fábrica de olas\" de cantos rodados con los swells del S/SO de verano (may–oct); se llega por un sendero a pie. Picos llenos y de alto nivel.",
    { nameEs: "Trestles y Orange County", group: "socal", splitFrom: "socal" });
  add('puertoescondido', 'Puerto Escondido', 'Mexico', 15.86, -97.07, '112233333221', [3, 8], 1, ['social', 'bucket'],
    ['Zicatela (Mexican Pipeline)|6', 'La Punta|3', 'Carrizalillo|1'],
    'Fly via Mexico City. Zicatela is a heavy beach-break barrel; La Punta for mortals.',
    'Vuelo vía Ciudad de México. Zicatela es un tubo pesado; La Punta para el resto.',
    { beg: '332222222233', big: '001233332100' });
  add("sayulita", "Sayulita & Punta de Mita", "Mexico", 20.87, -105.44, "222223333322", [1, 6], 2, ["chill", "social", "camp"],
    ["Sayulita|1", "La Lancha|3", "Stinky's|3", "El Faro (Punta de Mita)|5"],
    "Near Puerto Vallarta airport (Sayulita ~1h). Surf all year: winter (Nov–Mar) NW swells are smaller and glassy, ideal for learners and longboarders; summer S/SW and hurricane swells (Jun–Oct) bring bigger, faster waves for experienced surfers, with rain.",
    "Cerca del aeropuerto de Puerto Vallarta (Sayulita ~1h). Surf todo el año: en invierno (nov–mar) swells del NO más pequeños y limpios, ideales para aprender y longboard; en verano los swells del S/SO y de huracanes (jun–oct) traen olas más grandes y rápidas para surfistas con experiencia, con lluvias.",
    { beg: "333221111233", nameEs: "Sayulita y Punta de Mita" });
  add('rincon', 'Rincón', 'Puerto Rico', 18.34, -67.25, '333200000223', [3, 6], 3, ['chill'],
    ['Tres Palmas|6', 'Domes|4', 'Maria\'s|3'],
    'Winter north swells. Easy access from the US; Caribbean vibe.',
    'Swells del norte en invierno. Fácil acceso desde EE. UU.; ambiente caribeño.');
  add('barbados', 'Barbados (Soup Bowl)', 'Barbados', 13.2, -59.53, '333211112233', [3, 8], 3, ['chill', 'bucket'],
    ['Soup Bowl|5', 'Freights Bay|2'],
    'Direct flights from London. Soup Bowl on the east coast; mellow south coast for beginners.',
    'Vuelos directos desde Londres. Soup Bowl en la costa este; la costa sur es suave.');

  // ---------- CENTRAL & SOUTH AMERICA ----------
  add('costarica', 'Costa Rica (Santa Teresa & Nosara)', 'Costa Rica', 9.64, -85.17, '222233333222', [1, 6], 2, ['chill', 'camp', 'social'],
    ['Playa Hermosa|5', 'Santa Teresa|3', 'Witch\'s Rock|4', 'Nosara Guiones|1'],
    'Fly to San José or Liberia. Consistent Pacific swell; rainy season Sep–Nov.',
    'Vuelo a San José o Liberia. Swell del Pacífico constante; temporada de lluvias sep–nov.',
    { beg: '333222222233' });
  add('nicaragua', 'Popoyo', 'Nicaragua', 11.45, -86.1, '212333332222', [1, 6], 2, ['social', 'chill'],
    ['Popoyo|4', 'Playa Colorado|5', 'Playa Maderas|1'],
    'Offshore winds most of the year thanks to Lake Nicaragua. Fly to Managua.',
    'Viento offshore casi todo el año gracias al lago de Nicaragua. Vuelo a Managua.',
    { beg: '322222222233' });
  add('elsalvador', 'El Salvador (Surf City)', 'El Salvador', 13.48, -89.37, '112333333211', [3, 8], 1, ['social'],
    ['Punta Roca|5', 'El Sunzal|3', 'Las Flores|4'],
    'Right-hand points close to San Salvador airport. Great value.',
    'Puntas de derechas cerca del aeropuerto de San Salvador. Muy buena relación calidad-precio.',
    { beg: '332222222233' });
  add('peru', 'Northern Peru (Chicama & Lobitos)', 'Peru', -7.7, -79.43, '112333332211', [3, 8], 1, ['bucket'],
    ['Chicama|4', 'Pacasmayo|4', 'Lobitos|4'],
    'Home of one of the longest lefts in the world. Fly to Lima/Trujillo.',
    'Hogar de una de las izquierdas más largas del mundo. Vuelo a Lima/Trujillo.');
  add('chile', 'Pichilemu', 'Chile', -34.39, -72.0, '112333332211', [3, 8], 2, ['cold'],
    ['Punta de Lobos|6', 'La Puntilla|3'],
    'Cold, powerful lefts; 3h from Santiago. Punta de Lobos also holds big swells.',
    'Izquierdas frías y potentes; a 3h de Santiago. Punta de Lobos aguanta swells grandes.',
    { big: '001233332100' });
  add('brazil', 'Florianópolis', 'Brazil', -27.6, -48.45, '112233332211', [1, 6], 2, ['social', 'chill', 'camp'],
    ['Joaquina|3', 'Praia Mole|3', 'Campeche|4'],
    'Island city with 40+ beaches; vibrant nightlife. Winter Jun–Aug brings bigger swell.',
    'Isla con más de 40 playas y mucha vida nocturna. El invierno (jun–ago) trae más swell.',
    { beg: '222211122222' });

  // ---------- FIRST-PASS VALIDATION (desk research, 2026-10-29) ----------
  // Seasons / levels above were reviewed against the sources below. confidence:
  // 'high' = 2+ sources agree, 'medium' = one solid source or minor conflicts,
  // 'low' = conflicting / thin sources. needsValidation = open question for local
  // experts (null = nothing specific). Full old-vs-new table: VALIDATION.md / validation.csv.
  const VALIDATION = {
      "peniche": {
          "confidence": "high",
          "sources": [
              "https://www.mojosurf.com/blog/ericeira-vs-peniche/",
              "https://www.theportugalguides.com/practical/best-time-to-surf-portugal/",
              "https://thesurfatlas.com/surfing-portugal/ericeira-surf/"
          ],
          "needsValidation": "Peniche and Ericeira differ: Peniche beginner window May-Sep, Ericeira Jun-Aug; experienced: Peniche Nov-Mar, Ericeira Sep-Feb. Jan-Feb rated 2 (big, advanced-only days) - confirm.",
          "validationNote": "Beginner Nov lowered 2->1 (Nov is \"intermediate+\" on the Silver Coast; learners best May-Oct)."
      },
      "nazare": {
          "confidence": "high",
          "sources": [
              "https://www.surfertoday.com/surfing/when-to-see-nazare-big-waves",
              "https://nazarewaves.com/en/Home/InfoForTourists"
          ],
          "needsValidation": "Only big-wave level is modelled; Nazaré town beach / smaller days for other levels are not covered.",
          "validationNote": "No change: sources agree Oct-Mar season, Nov-Feb core, May-Aug not big-wave."
      },
      "basque": {
          "confidence": "high",
          "sources": [
              "https://spainunveiled.com/things-to-do/beaches-water-sports/surfing-the-basque-coast-the-best-beaches-from-zarautz-to-mundaka",
              "https://tourism.euskadi.eus/webtur00-pagcont/en/contenidos/informacion/playas_euskadi/en_playas/playas-olas-zona-mundaka.html",
              "https://www.surf-escape.com/surfing-in-spain/surfing-zarautz/"
          ],
          "needsValidation": "Mundaka only fires on solid NW groundswell + low/mid tide (~a few dozen days a year); it can be off even in peak months.",
          "validationNote": "No change: Sep-Nov sweet spot, Mundaka autumn-winter, summer small/beginner."
      },
      "hossegor": {
          "confidence": "high",
          "sources": [
              "https://surf-map.com/guides/hossegor/la-graviere/",
              "https://guide-hossegor.fr/surf/spots/la-graviere/",
              "https://www.surf-forecast.com/breaks/La-Graviere"
          ],
          "needsValidation": "Winter (Dec-Feb) has the most power but storms and moving banks; rated 1 for intermediates - confirm.",
          "validationNote": "Nov 2->3: two of three sources give Sep-Nov as prime season (surf-map says Sep-Oct)."
      },
      "canaries": {
          "confidence": "high",
          "sources": [
              "https://surfing-fuerteventura.com/surf-season/",
              "https://travel-surf.com/destination/canary-islands/lanzarote/",
              "https://www.surfertoday.com/surfing/el-quemao-the-canarian-world-class-barreling-wave"
          ],
          "needsValidation": "Lanzarote vs Fuerteventura differ slightly; summer trade winds are strong (mornings best). \"El Hierro (Fuerteventura)\" naming may confuse with the island of El Hierro.",
          "validationNote": "Main curve confirmed (Oct-Mar/Apr swell season). Beginner curve changed from flat 2 to summer peak (Jun-Sep) - sources say summer is the learning window."
      },
      "cornwall": {
          "confidence": "medium",
          "sources": [
              "https://surf-map.com/guides/cornwall/",
              "https://www.bookandsurf.com/destinations/newquay/",
              "https://www.lonelyplanet.com/articles/guide-to-surfing-newquay-cornwall"
          ],
          "needsValidation": "Winter (Dec-Mar) rated 1 for intermediates; some sources treat winter as the most powerful season. North coast (Newquay) vs south coast (Porthleven) work on different winds.",
          "validationNote": "No change: Sep-Oct the reward, summer small and busy, winter heavy and cold."
      },
      "ireland": {
          "confidence": "medium",
          "sources": [
              "https://yosurf.app/guide/mullaghmore",
              "https://www.discoverireland.ie/guides/guide-surfing-ireland",
              "https://thesurfatlas.com/surfing-ireland/mullaghmore-surf/",
              "https://www.surfertoday.com/surfing/aileens-the-treacherous-slab-wave-of-the-cliffs-of-moher"
          ],
          "needsValidation": "Dec-Feb kept at 2 for intermediates because of storms/cold - confirm. Clare (Lahinch / Aileen's) is now its own destination.",
          "validationNote": "Nov 2->3 (winter swells \"from November onwards\"). Removed Aileen's: it is under the Cliffs of Moher, Co. Clare (much further south), not Bundoran/Mullaghmore."
      },
      "scotland": {
          "confidence": "medium",
          "sources": [
              "https://scottishsurfers.com/surf-spots/thurso-east/",
              "https://thesurfatlas.com/scotland-surfing/surfing-in-thurso/"
          ],
          "needsValidation": "Short daylight and very cold water in Dec-Jan; is 3 realistic for travellers?",
          "validationNote": "Dec and Jan 2->3: best months Oct-Mar (Scottish Surfers)."
      },
      "iceland": {
          "confidence": "low",
          "sources": [
              "https://worldsurfspots.app/countries/iceland",
              "https://bookawave.com/iceland/surf-in-october/",
              "https://www.arcticsurfers.com/faq-3"
          ],
          "needsValidation": "Few independent sources; wind is the limiting factor. Dec-Jan kept at 1 because of very short daylight. Needs local operator input.",
          "validationNote": "Feb 1->2, Jun-Jul 0->1: peak swell season Sep-Apr; summer is small/inconsistent but surfable with long daylight. October kept as the best month."
      },
      "morocco": {
          "confidence": "high",
          "sources": [
              "https://www.thetaghazoutguide.com/surf-guide/swell-seasons-taghazout/",
              "https://www.thetaghazoutguide.com/surf-guide/anchor-point/",
              "https://solidsurfhouse.com/best-time-to-visit-morocco-for-surfing/"
          ],
          "needsValidation": "Beginner best windows are Apr-May and Sep-Oct; summer is learnable but often flat.",
          "validationNote": "No change: groundswell Sep-Apr, peak Dec-Feb, summer flat; Anchor Point Oct-Mar."
      },
      "namibia": {
          "confidence": "medium",
          "sources": [
              "https://www.surfline.com/surf-report/skeleton-bay/59b03873a36896001c177bc1/spot-guide",
              "https://swakopmund-backpackers.com/article/skeleton-bay-surfing"
          ],
          "needsValidation": "Even in season it may not break during a fixed-date trip; strike-mission only. Is level 4 minimum right (Surfline: pros/experts only)?",
          "validationNote": "Off-season 1->0, Apr 3->2, Sep 2->3: Surfline says swells Apr-Sep with late season usually better; the wave only breaks a handful of days per season."
      },
      "jbay": {
          "confidence": "high",
          "sources": [
              "https://www.jbaywaves.com/articles/jeffreys-bay-surf-guide",
              "https://www.bookandsurf.com/destinations/jeffreys-bay/"
          ],
          "needsValidation": null,
          "validationNote": "Mar 2->1, Oct 1->2: season May-Sep (core Jun-Aug), Apr and Oct can be excellent; summer easterlies spoil it."
      },
      "mozambique": {
          "confidence": "medium",
          "sources": [
              "https://www.wavesafari.com/tofinho/",
              "https://thesurfatlas.com/surfing-in-mozambique/tofo-surf/"
          ],
          "needsValidation": "Only two sources; Nov-Mar is the wetter, choppier season (Wave Safari) - how surfable is it really?",
          "validationNote": "Apr and Sep 2->3 (peak Apr/May-Sep), level min 2->1 and Tofo Beach 2->1 (Surf Atlas: Tofo point \"best for beginners\")."
      },
      "srilanka_s": {
          "confidence": "high",
          "sources": [
              "https://www.srilanka-spirit.com/guides/surf-seasons-sri-lanka/",
              "https://www.visitmidigama.com/surfing/surf-season/"
          ],
          "needsValidation": "April/October inter-monsoon can be choppy on both coasts.",
          "validationNote": "No change: Nov-Apr, peak Jan-Feb; SW monsoon May-Oct."
      },
      "arugam": {
          "confidence": "high",
          "sources": [
              "https://arugambayguide.com/surf-guide.html",
              "https://www.thesrilankaguides.com/things-to-do/surfing-arugam-bay/",
              "https://thesurfatlas.com/sri-lanka-surf/arugam-bay-surf/"
          ],
          "needsValidation": null,
          "validationNote": "No change: May-Oct, most consistent Jun-Aug, flat Nov-Mar."
      },
      "gland": {
          "confidence": "medium",
          "sources": [
              "https://www.surfline.com/surf-news/the-mechanics-of-g-land-java-indonesia/78526"
          ],
          "needsValidation": "Only one source opened (camp schedule page failed to load). Camp opening months not verified - confirm with the G-Land camps.",
          "validationNote": "No change: Surfline - peak Jun-Aug, shoulders Mar-May / Sep-Nov, onshore Dec-Feb."
      },
      "lombok": {
          "confidence": "high",
          "sources": [
              "https://lomboq.com/guide-content/surf-season-lombok",
              "https://lomboq.com/guide-content/desert-point-surf",
              "https://semetonsurflombok.com/blog/best-time-to-surf-in-lombok"
          ],
          "needsValidation": "Desert Point aligns only a few days per month even in season.",
          "validationNote": "Dec-Feb 0->1: Gerupuk surfs year-round; main season May-Oct, Desert Point Jun-Aug."
      },
      "sumbawa": {
          "confidence": "medium",
          "sources": [
              "https://nomadsurfers.com/surfing-in-sumbawa-2/"
          ],
          "needsValidation": "Only one source opened (two others blocked). West coast (e.g. Scar Reef) vs east coast (Lakey) differ; wet season offers smaller, mellow waves.",
          "validationNote": "No change: dry season May-Sep, most consistent Jun-Jul."
      },
      "mentawai": {
          "confidence": "medium",
          "sources": [
              "https://mentawaiwaveborn.com/guides/best-time-to-surf-the-mentawais/",
              "https://www.mentawaiislands.com/seasons"
          ],
          "needsValidation": "Resort sites market the wet season as \"shoulder\" with daily fun surf; should Dec-Feb be 2 instead of 1?",
          "validationNote": "No change: prime Apr/May-Sep/Oct; Nov-Mar smaller, fun-size, few crowds."
      },
      "siargao": {
          "confidence": "medium",
          "sources": [
              "https://www.surfsiargao.com/surf-articles/2024/3/11/fat-lips-guide-to-surfing-by-season-in-siargao",
              "https://surf-map.com/guides/siargao/cloud-9/",
              "https://www.instagram.com/p/DfDdIXAk5MG/ (Surfline, Oct 2026: WSL CT at Cloud 9, Philippines Pro 31 Oct-10 Nov)"
          ],
          "needsValidation": "Typhoon swell is year-to-year variable; Dec-Feb NE monsoon is messy.",
          "validationNote": "Peak moved: Sep 3->1 (local shop: \"September is NOT peak\"), Oct-Nov stay 3, Dec 3->1 (windy winter), Mar-May 1->2 (second season). Beginner curve now peaks in summer (waist-high)."
      },
      "japan": {
          "confidence": "medium",
          "sources": [
              "https://thesurfatlas.com/surfing-in-japan/surfing-in-chiba/",
              "https://www.bookandsurf.com/destinations/ichinomiya/",
              "https://thesurfatlas.com/surfing-in-japan/"
          ],
          "needsValidation": "Surf Atlas general Japan page says Pacific typhoon season Jun-Aug while its Chiba page says Sep-Oct; typhoon swell is inconsistent year to year. Shonan is much less consistent than Chiba.",
          "validationNote": "No change: typhoon swell Aug-Oct (Sep-Oct best for Chiba); winter NE swell cold but rideable."
      },
      "goldcoast": {
          "confidence": "medium",
          "sources": [
              "https://www.surfline.com/travel/zones/gold-coast/32EDJnvmVAiH9s0DmKUXmh"
          ],
          "needsValidation": "Only one detailed source opened. Should Apr-May be peak (3)? Superbank/Kirra depend on sand.",
          "validationNote": "No change: cyclone season Nov-Apr, Apr-May glassy and quiet."
      },
      "margaret": {
          "confidence": "medium",
          "sources": [
              "https://www.mrsurf.com.au/blog/best-time-to-surf-in-margaret-river-a-locals-knowledge-of-seasonal-guide",
              "https://www.worldsurfleague.com/posts/110179/margaret-river-break-breakdown",
              "https://en.wikipedia.org/wiki/Gnaraloo"
          ],
          "needsValidation": "Is winter really worse than spring for an intermediate/advanced trip? Big-wave override keeps winter as peak.",
          "validationNote": "Shifted peak to autumn (Mar-May) and spring (Sep-Oct); winter Jun-Aug 3->2 (biggest swell but onshore gales) - old winter curve kept as big-wave override. Removed Gnaraloo (it is reached from Carnarvon, far north of Margaret River)."
      },
      "raglan": {
          "confidence": "low",
          "sources": [
              "https://realsurftravel.com/surfing-in-raglan/",
              "https://barrelfare.com/spots/raglan"
          ],
          "needsValidation": "Sources conflict: BarrelFare says best Jan-Jun, Real Surf Travel says autumn/depth of winter. Needs local check.",
          "validationNote": "Jun-Jul 2->3: autumn-winter brings the long-period swells and the best days."
      },
      "tahiti": {
          "confidence": "high",
          "sources": [
              "https://www.redbull.com/int-en/spot-check-teahupoo",
              "https://www.tahititourisme.com/en-us/surfing/",
              "https://en.wikipedia.org/wiki/Teahupo%CA%BBo"
          ],
          "needsValidation": "Tahiti has easier spots (Taapuna, Papara, Mahina; beginner options per Tahiti Tourisme) but min level is 4 - widen level range?",
          "validationNote": "No change: Teahupo'o breaks consistently Apr/May-Sep/Oct."
      },
      "northshore": {
          "confidence": "high",
          "sources": [
              "https://haleiwatown.com/surfing-north-shore/",
              "https://oceansafety.hawaii.gov/hawaiis-surf-seasons/"
          ],
          "needsValidation": null,
          "validationNote": "Sep 0->1: first solid north swells usually arrive in the last week of September; peak Nov-Feb."
      },
      "waikiki": {
          "confidence": "high",
          "sources": [
              "https://www.bookandsurf.com/destinations/waikiki/",
              "https://oceansafety.hawaii.gov/hawaiis-surf-seasons/"
          ],
          "needsValidation": null,
          "validationNote": "Added beginner curve: small learner waves most of the year, best Apr-Sep. Main curve unchanged."
      },
      "jaws": {
          "confidence": "high",
          "sources": [
              "https://www.surfline.com/surf-report/peahi-jaws-/5842041f4e65fad6a7708de9/spot-guide",
              "https://www.surfertoday.com/surfing/jaws-interesting-facts-about-maui-big-wave-surfing-break"
          ],
          "needsValidation": "Destination is big-wave only (level 5). Honolua Bay now lives in the new Maui (Honolua Bay & West Maui) destination.",
          "validationNote": "No change to the season: early Nov-late Mar, breaks only on the biggest winter swells. Honolua Bay moved to the new Maui destination (split, 2026-10-29)."
      },
      "norcal": {
          "confidence": "medium",
          "sources": [
              "https://www.americansurfmagazine.com/article/santa-cruz-surf-guide",
              "https://popupsurftrips.com/surf-spots/usa/steamer-lane",
              "https://www.surfertoday.com/surfing/steamer-lane-the-heart-and-soul-of-santa-cruz-surfing"
          ],
          "needsValidation": "Cold water and sharks; Mavericks is a separate big-wave override (unchanged).",
          "validationNote": "Winter Dec-Jan 2->3, Feb 2->3; summer Jul-Aug 2->1: fall and winter are best, summer worst (fog), spring windy."
      },
      "puertoescondido": {
          "confidence": "medium",
          "sources": [
              "https://www.puerto-escondido.mx/en/2026/04/23/puerto-escondido-surf-conditions-by-month-swell-wind-crowds/",
              "https://www.puerto-escondido.mx/en/2026/04/20/la-punta-vs-zicatela-which-wave-right-for-your-level/"
          ],
          "needsValidation": "Both sources are from the same local site. Zicatela also gets big NW/winter swells per one page - confirm.",
          "validationNote": "Nov 1->2 (shoulder Oct-Nov). Beginner curve now peaks Dec-Feb (smaller swell, La Punta/Carrizalillo)."
      },
      "sayulita": {
          "confidence": "medium",
          "sources": [
              "https://makaisurf.app/spots/sayulita",
              "https://makaisurf.app/spots/punta-de-mita",
              "https://thesurfatlas.com/surfing-mexico/sayulita-surf/",
              "https://matosurf.com/us/destinations/nayarit/"
          ],
          "needsValidation": "Not split: sources show Sayulita and Punta de Mita share the same two seasons (winter small/clean, summer big). Main curve now peaks Jun-Oct for intermediates and the beginner curve peaks Nov-Mar - confirm.",
          "validationNote": "Was a flat 2. Sources: winter NW swells = cleaner, smaller, beginner-friendly (Makai, Surf Atlas); summer S/SW + hurricane swells = bigger, faster, 'peak season' for experienced surfers (Surf Atlas). Added beginner curve, max level 3->4 (El Faro: advanced, big N swells)."
      },
      "rincon": {
          "confidence": "high",
          "sources": [
              "https://www.casitarinconpr.com/surf-guide",
              "https://www.swell-intel.com/articles/puerto-rico-surf-season-a-month-by-month-guide-to-rinc-n-and-the-north-coast",
              "https://www.americansurfmagazine.com/article/rincon-puerto-rico-surf-guide"
          ],
          "needsValidation": "Hurricane swells Sep-Oct can fire occasionally.",
          "validationNote": "Mar 2->3, Apr 1->2, Nov 3->2: prime Dec-Mar, shoulders Oct-Nov and April."
      },
      "barbados": {
          "confidence": "medium",
          "sources": [
              "https://www.bookandsurf.com/destinations/bathsheba/",
              "https://www.riseupsurf.com/barbados-surf-guide-what-to-know-before-you-go/"
          ],
          "needsValidation": "South coast gets hurricane-season swells Jun-Oct (good for beginners); not reflected in main curve.",
          "validationNote": "Mar 2->3: Soup Bowl best Nov-Mar (late Oct-Mar)."
      },
      "costarica": {
          "confidence": "medium",
          "sources": [
              "https://www.costarica-spirit.com/guides/santa-teresa-surf-guide/",
              "https://www.latamsurfing.com/costa-rica/nosara",
              "https://senderonosara.com/best-time-to-surf-in-nosara/"
          ],
          "needsValidation": "Sep-Oct are the rainiest months (roads, crowds low) - keep Sep at 3? Witch's Rock/Playa Hermosa are in different regions (Guanacaste north / Central Pacific).",
          "validationNote": "Old curve had Jul-Aug as 2 and Oct as 1. Sources: south-swell green season Apr/May-Oct, biggest Jul-Aug -> May-Sep 3. Dry season (Dec-Apr) smaller -> added beginner curve peaking Nov-Mar."
      },
      "nicaragua": {
          "confidence": "medium",
          "sources": [
              "https://www.lasplumerias.com/whats-the-best-surf-season-in-nicaragua/",
              "https://travel-surf.com/spot/nicaragua-popoyo/",
              "https://realsurftravel.com/surfing-in-popoyo/"
          ],
          "needsValidation": null,
          "validationNote": "Feb 2->1, Mar 3->2: Jan-Mar has the strongest offshore wind, smallest swell and cold upwelling (Feb \"best avoided\"). Added beginner curve (dry season mellow)."
      },
      "elsalvador": {
          "confidence": "high",
          "sources": [
              "https://surf-map.com/guides/el-salvador/punta-roca/",
              "https://thesurfatlas.com/el-salvador-surf/el-tunco-surf/"
          ],
          "needsValidation": "Min level is 2 so level-1 users are greyed out though El Tunco/El Sunzal have learner days - lower to 1?",
          "validationNote": "Main curve confirmed (Mar-Oct, biggest Apr-Sep). Added beginner curve: Nov-Feb smaller and cleaner."
      },
      "peru": {
          "confidence": "high",
          "sources": [
              "https://reefbreak.net/surf-chicama/",
              "https://reefbreak.net/surf-lobitos/",
              "https://thesurfatlas.com/peru-surf/lobitos-surf/"
          ],
          "needsValidation": "Chicama (La Libertad) and Lobitos (Piura) are in different regions (La Libertad vs Piura); Lobitos surfs year-round.",
          "validationNote": "No change: Chicama May-Aug best, Lobitos Apr/May-Sep/Oct; summer smaller."
      },
      "chile": {
          "confidence": "high",
          "sources": [
              "https://www.wavesafari.com/punta-de-lobos/",
              "https://surfguidee.com/en/spots/lobos/",
              "https://sessionstravel.com/destinations/chile/surfing-in-punta-de-lobos/"
          ],
          "needsValidation": "Summer (Dec-Feb) is friendlier for learners at La Puntilla - add beginner curve?",
          "validationNote": "No change: Mar-Oct, biggest Jun-Aug; summer smaller."
      },
      "brazil": {
          "confidence": "medium",
          "sources": [
              "https://www.bookandsurf.com/destinations/florianopolis/",
              "https://surfscout.co/spots/joaquina"
          ],
          "needsValidation": "Cold fronts make conditions change fast; confirm beginner curve (Jan-Mar 2).",
          "validationNote": "No change: Apr-Sep, prime Jun-Aug (south swells from cold fronts)."
      },
      "algarve_west": {
          "confidence": "medium",
          "sources": [
              "https://www.visitsagres.com/surf",
              "https://www.swellportugal.com/regions/algarve_west",
              "https://www.magicalportugal.com/algarve/surfing-in-the-algarve/"
          ],
          "needsValidation": "Tonel is listed as \"south coast\" by visitsagres but faces west and works in summer, so it sits here - confirm. Is Cordoama (powerful, rocky edges) right at level 3?",
          "validationNote": "Split from Algarve (Sagres). West coast faces the dominant NW swell: prime Sep/Oct-Apr/May (swellportugal: Oct-Apr), summer knee-to-shoulder high (magicalportugal) -> summer 1 for experienced surfers, beginner curve peaks Jun-Sep."
      },
      "algarve_south": {
          "confidence": "medium",
          "sources": [
              "https://www.magicalportugal.com/algarve/surfing-in-the-algarve/",
              "https://www.visitsagres.com/surf",
              "https://www.swellportugal.com/regions/algarve_west"
          ],
          "needsValidation": "Peak capped at 2 (shoulder) because even in winter the south coast only works \"a few days a week\" (magicalportugal). Should Nov-Feb be 3 for Beliche/Zavial on big swells?",
          "validationNote": "Split from Algarve (Sagres). South coast only gets wrapped NW or direct S/SW swell: Sep-Apr a few days a week, best Nov-Feb; May-Sep \"can be counted on one hand\" -> 0. Beliche/Zavial are the winter standouts (visitsagres)."
      },
      "dakar_north": {
          "confidence": "high",
          "sources": [
              "https://www.travel-surf.com/destination/senegal/dakar/",
              "https://surfcampsenegal.com/fr/blog/saison-surf-senegal-mois-par-mois/",
              "https://www.bookandsurf.com/destinations/dakar/"
          ],
          "needsValidation": "Jun-Aug set to 0 on the north shore (sources only describe the south coast in summer) - is Yoff really flat then?",
          "validationNote": "Split from Dakar. Sources agree: north coast (Yoff, Le Virage, Ngor) Oct-Apr on NW swell, Ngor core Nov-Apr, safest Dec-Feb. Yoff and Le Virage are the learner spots (travel-surf)."
      },
      "dakar_south": {
          "confidence": "medium",
          "sources": [
              "https://www.travel-surf.com/destination/senegal/dakar/",
              "https://www.bookandsurf.com/destinations/dakar/"
          ],
          "needsValidation": "Levels: travel-surf lists Secret as a \"progression\" wave (level 2) and Club Med/Vivier/Ouakam as advanced - confirm. Does the south coast also work on small winter days with the trade wind offshore?",
          "validationNote": "Split from Dakar. South coast (Almadies, Club Med, Secret, Vivier, Ouakam) works May-Sep on S/SW swell (travel-surf); bookandsurf: Jun-Sep, May and Oct transitional."
      },
      "maldives_male": {
          "confidence": "high",
          "sources": [
              "https://www.wavehunters.com/maldives-surfing-male-central-atolls",
              "https://amaldives.com/activities/surfing/cokes-surfing",
              "https://next-stop-anywhere.com/maldives/surfing-maldives/"
          ],
          "needsValidation": null,
          "validationNote": "Split from Maldives (curve unchanged): Malé atolls Mar-Oct, peak Jun-Aug (wavehunters; next-stop-anywhere: best about May-Sep, Dec-Feb off-season)."
      },
      "maldives_south": {
          "confidence": "high",
          "sources": [
              "https://www.perfectwavetravel.com/maldives-south-surf-guide/",
              "https://next-stop-anywhere.com/maldives/surfing-maldives/",
              "https://www.wavehunters.com/maldives-surfing-male-central-atolls"
          ],
          "needsValidation": "May-Aug rated 1: biggest swells but strong trades make charters difficult. Some operators move to east-facing passes then - should mid-year be 2?",
          "validationNote": "New sub-destination (was only an open question for Maldives). Perfect Wave: Feb-Apr and Sep-Oct, March prime; next-stop-anywhere: Mar-Apr and Oct-Nov; wavehunters: late Feb-Apr and late Aug-Oct. Beacons/Five Islands/Tiger Stripes experienced; Blue Bowls/Love Charms intermediate."
      },
      "bali_bukit": {
          "confidence": "high",
          "sources": [
              "https://www.balisurfingcamp.com/blog/bali-surf-seasons-guide"
          ],
          "needsValidation": null,
          "validatedBy": "Alejandro",
          "validatedOn": "2026-10-29",
          "validatedNote": "wind-driven: offshore on east coast in wet season (so Bukit/West is the dry-season Apr-Oct side) - confirmed by Alejandro, who has surfed there",
          "minorOpenPoint": "Nov kept at 2 (Uluwatu can be good in Nov / early Dec with light winds) - not explicitly covered by the validation.",
          "validationNote": "Split from Bali. Dry season Apr-Oct = Bukit/west coast offshore (SE trades); wet season Nov-Mar onshore here -> Dec-Feb 1."
      },
      "bali_east": {
          "confidence": "high",
          "sources": [
              "https://www.balisurfingcamp.com/blog/bali-surf-seasons-guide",
              "https://www.balisurfingcamp.com/surf-spots/east-coast/keramas"
          ],
          "needsValidation": null,
          "validatedBy": "Alejandro",
          "validatedOn": "2026-10-29",
          "validatedNote": "wind-driven: offshore on east coast in wet season (Nov-Mar peak confirmed by Alejandro, who has surfed there)",
          "minorOpenPoint": "Wave levels for Sanur Reef (3) and Nusa Dua (2) are our estimate - not explicitly covered by the validation.",
          "validationNote": "Split from Bali. Keramas, Sanur and Nusa Dua are wet-season waves (Nov-Mar, W monsoon offshore); Mar-Apr and Oct-Nov changeovers often excellent; dry season smaller/onshore -> May-Sep 1."
      },
      "fiji_mamanuca": {
          "confidence": "high",
          "sources": [
              "https://www.fiji.travel/things-to-do/surfing/surfing-fiji-101-your-ultimate-guide-to-surfing-w",
              "https://farandawayadventures.com/when-to-surf-in-fiji-the-best-seasons-for-waves-and-weather/",
              "https://www.perfectwavetravel.com/fiji-surf-guide/"
          ],
          "needsValidation": "Perfect Wave says the Mamanucas also get mid-size, glassy summer swells (Wilkes, Namotu best Nov-Apr). Raise Nov-Mar from 1? Min level 4 hides Namotu Left (level 3).",
          "validationNote": "Split from Fiji (curve unchanged): Mamanucas Apr-Oct, core May-Sep."
      },
      "fiji_coral": {
          "confidence": "medium",
          "sources": [
              "https://www.fiji.travel/things-to-do/surfing/surfing-fiji-101-your-ultimate-guide-to-surfing-w",
              "https://www.perfectwavetravel.com/fiji-surf-guide/",
              "https://surfingfiji.com/Surfing-Matanivusi-Resort-Fiji",
              "https://surftrips.co/fiji/fiji-south/frigate-pass"
          ],
          "needsValidation": "Sources partly conflict: Tourism Fiji calls Dec-Mar the Coral Coast peak, Matanivusi calls Apr-Oct prime (groundswell, Frigates). Rated Dec-Mar 3 and Apr-Nov 2 - confirm.",
          "validationNote": "New sub-destination (was an open question for Fiji). Coral Coast reefs glassy in summer (Tourism Fiji: best Dec-Mar; Perfect Wave: \"often the place to surf in summer\"); Frigates and Fiji Pipe offshore in SE trades (Apr-Oct). Natadola for lessons (Perfect Wave)."
      },
      "maui": {
          "confidence": "high",
          "sources": [
              "https://piermonkey.com/spot/honolua-bay-maui/season",
              "https://www.surfertoday.com/surfing/honolua-bay-the-mechanics-of-the-famous-maui-point-break",
              "https://surfspoting.com/spot/us/14-honolua-bay/"
          ],
          "needsValidation": "Only Honolua is modelled; other West Maui / south-shore spots (and beginner options) are not sourced yet. Should Maui get a beginner curve?",
          "validationNote": "New destination (open question 6): Honolua Bay moved here from Maui (Peʻahi / Jaws). Prime Nov-Mar, January best (piermonkey, surf-forecast/surfertoday); surfspoting: ~11 rideable days in Dec, flat May-Sep."
      },
      "sandiego": {
          "confidence": "medium",
          "sources": [
              "https://gosurfingsandiego.com/best-time-to-surf-in-san-diego/",
              "https://gosurfingsandiego.com/swamis-surf-spot-san-diego/",
              "https://www.surfertoday.com/surfing/the-most-iconic-california-surf-breaks"
          ],
          "needsValidation": "Surfertoday says Windansea works best on summer S swells while the local guide ranks winter first for La Jolla reefs - confirm. Black's level 4 is our estimate.",
          "validationNote": "Split from San Diego & Orange County. Local guide: winter (Dec-Feb) best, autumn a hair below, summer third, spring last; Swami's \"hands down\" best in winter. Summer beginner curve kept."
      },
      "trestles": {
          "confidence": "medium",
          "sources": [
              "https://gosurfingsandiego.com/surfing-trestles-surf-beach/",
              "https://www.surfertoday.com/surfing/the-most-iconic-california-surf-breaks"
          ],
          "needsValidation": "Huntington (summer S swell) and Trestles share one curve; winter at Trestles rated 1 though surfertoday says there is \"some good winter surf\" - confirm.",
          "validationNote": "Split from San Diego & Orange County. Trestles: \"wave factory all summer\" (gosurfingsandiego), \"great and perfect in summer\" (surfertoday); best swell S/SW May-Oct."
      },
      "clare": {
          "confidence": "high",
          "sources": [
              "https://www.bookandsurf.com/destinations/lahinch/",
              "https://yosurf.app/guide/lahinch",
              "https://piermonkey.com/spot/lahinch-ireland/season",
              "https://www.surfertoday.com/surfing/aileens-the-treacherous-slab-wave-of-the-cliffs-of-moher"
          ],
          "needsValidation": "April singled out as the cleanest month by two forecast sites but kept at 2. The big-wave curve copies Mullaghmore (sources only say \"large winter swells\").",
          "validationNote": "New destination (open question 10). Autumn Sep-Nov best, October often the best month (bookandsurf); prime Sep-Apr for size (piermonkey, yosurf); summer small, beginners on Lahinch beach. Aileen's moved here from Bundoran in the first pass."
      }
  };
  D.forEach(d => Object.assign(d, { sources: [], confidence: 'low', needsValidation: null, validationNote: null, validatedBy: null, validatedOn: null, validatedNote: null }, VALIDATION[d.id] || {}));


  // ---------- 8-level scale (A1..D2) — first-guess migration from the old 1-5 scale, see README ----------
  // Top-level contest venues (used only to favour spots for D2 'Competition' surfers). Source: WSL 2026 CT schedule.
  const CONTEST = {
      "peniche": {
          "en": "WSL Championship Tour 2026: MEO Rip Curl Pro Portugal, Supertubos (Oct)",
          "es": "Circuito mundial WSL (CT) 2026: MEO Rip Curl Pro Portugal, Supertubos (oct)"
      },
      "margaret": {
          "en": "WSL Championship Tour 2026: Margaret River Pro (Apr)",
          "es": "Circuito mundial WSL (CT) 2026: Margaret River Pro (abr)"
      },
      "goldcoast": {
          "en": "WSL Championship Tour 2026: Gold Coast Pro, Snapper Rocks (May)",
          "es": "Circuito mundial WSL (CT) 2026: Gold Coast Pro, Snapper Rocks (may)"
      },
      "raglan": {
          "en": "WSL Championship Tour 2026: New Zealand Pro, Raglan (May)",
          "es": "Circuito mundial WSL (CT) 2026: New Zealand Pro, Raglan (may)"
      },
      "elsalvador": {
          "en": "WSL Championship Tour 2026: Surf City El Salvador Pro, Punta Roca (Jun)",
          "es": "Circuito mundial WSL (CT) 2026: Surf City El Salvador Pro, Punta Roca (jun)"
      },
      "tahiti": {
          "en": "WSL Championship Tour 2026: Tahiti Pro, Teahupo'o (Aug); 2024 Olympic venue",
          "es": "Circuito mundial WSL (CT) 2026: Tahiti Pro, Teahupo'o (ago); sede olímpica 2024"
      },
      "fiji_mamanuca": {
          "en": "WSL Championship Tour 2026: Fiji Pro, Cloudbreak (Aug–Sep)",
          "es": "Circuito mundial WSL (CT) 2026: Fiji Pro, Cloudbreak (ago–sep)"
      },
      "trestles": {
          "en": "WSL Championship Tour 2026: Trestles Pro, Lower Trestles (Sep)",
          "es": "Circuito mundial WSL (CT) 2026: Trestles Pro, Lower Trestles (sep)"
      },
      "siargao": {
          "en": "WSL Championship Tour 2026: Philippines Pro, Cloud 9, 31 Oct–10 Nov 2026 (first time the CT surfs Cloud 9)",
          "es": "Circuito mundial WSL (CT) 2026: Philippines Pro, Cloud 9, 31 oct–10 nov 2026 (primera vez que el CT compite en Cloud 9)"
      },
      "northshore": {
          "en": "WSL Championship Tour 2026: Pipe Masters, Pipeline (Dec) — season finale",
          "es": "Circuito mundial WSL (CT) 2026: Pipe Masters, Pipeline (dic), final de temporada"
      },
      "jbay": {
          "en": "WSL Championship Tour stop until 2025 (Supertubes, Jul)",
          "es": "Parada del circuito mundial WSL (CT) hasta 2025 (Supertubes, jul)"
      }
  };
  D.forEach(d => { d.contest = CONTEST[d.id] || null; });
  window.TASF_DESTINATIONS = D;

  /* ---------- AIRPORTS + STAY AREA (used by the "Plan my trip" flights & stays section) ----------
   * airports: IATA codes of the nearest airport(s) with scheduled commercial flights, most useful first.
   *           The first one is used for the prefilled Google Flights / Skyscanner / Kayak searches; the
   *           others are shown as alternatives (often the international hub before a domestic hop).
   *           Codes checked against general airport knowledge on 2026-10-29 (e.g. LIS Lisbon, FAO Faro,
   *           BIO Bilbao, BIQ Biarritz, DPS Bali, PXM Puerto Escondido, LIR Liberia, IAO Siargao).
   * stay:     town / area used as the place name for the Booking.com and Airbnb searches (a place,
   *           never a property). Travel notes in each destination already explain the transfer. */
  const TRAVEL = {
    peniche: [['LIS'], 'Peniche, Portugal'],
    nazare: [['LIS', 'OPO'], 'Nazaré, Portugal'],
    algarve_west: [['FAO', 'LIS'], 'Aljezur, Portugal'],
    algarve_south: [['FAO'], 'Lagos, Portugal'],
    basque: [['BIO', 'EAS'], 'Mundaka, Spain'],
    hossegor: [['BIQ', 'BOD'], 'Hossegor, France'],
    canaries: [['FUE', 'ACE'], 'Corralejo, Fuerteventura, Spain'],
    cornwall: [['NQY', 'EXT'], 'Newquay, United Kingdom'],
    ireland: [['NOC', 'DUB'], 'Bundoran, Ireland'],
    clare: [['SNN'], 'Lahinch, Ireland'],
    scotland: [['INV', 'EDI'], 'Thurso, United Kingdom'],
    iceland: [['KEF'], 'Reykjavik, Iceland'],
    morocco: [['AGA'], 'Taghazout, Morocco'],
    dakar_north: [['DSS'], 'Ngor, Dakar, Senegal'],
    dakar_south: [['DSS'], 'Dakar, Senegal'],
    namibia: [['WVB'], 'Walvis Bay, Namibia'],
    jbay: [['PLZ'], 'Jeffreys Bay, South Africa'],
    mozambique: [['INH', 'MPM'], 'Tofo, Mozambique'],
    maldives_male: [['MLE'], 'Thulusdhoo, Maldives'],
    maldives_south: [['MLE', 'KDO'], 'Gaafu Dhaalu Atoll, Maldives'],
    srilanka_s: [['CMB'], 'Weligama, Sri Lanka'],
    arugam: [['CMB'], 'Arugam Bay, Sri Lanka'],
    bali_bukit: [['DPS'], 'Uluwatu, Bali, Indonesia'],
    bali_east: [['DPS'], 'Sanur, Bali, Indonesia'],
    gland: [['DPS', 'BWX'], 'Banyuwangi, Indonesia'],
    lombok: [['LOP', 'DPS'], 'Kuta, Lombok, Indonesia'],
    sumbawa: [['BMU', 'LOP', 'DPS'], 'Hu\'u, Dompu, Indonesia'],
    mentawai: [['PDG'], 'Mentawai Islands, Indonesia'],
    siargao: [['IAO', 'MNL', 'CEB'], 'General Luna, Siargao, Philippines'],
    japan: [['NRT', 'HND'], 'Ichinomiya, Chiba, Japan'],
    goldcoast: [['OOL', 'BNE'], 'Coolangatta, Australia'],
    margaret: [['PER'], 'Margaret River, Australia'],
    raglan: [['AKL'], 'Raglan, New Zealand'],
    fiji_mamanuca: [['NAN'], 'Mamanuca Islands, Fiji'],
    fiji_coral: [['NAN', 'SUV'], 'Pacific Harbour, Fiji'],
    tahiti: [['PPT'], 'Teahupoo, French Polynesia'],
    northshore: [['HNL'], 'Haleiwa, Hawaii, United States'],
    waikiki: [['HNL'], 'Waikiki, Honolulu, Hawaii, United States'],
    jaws: [['OGG'], 'Paia, Maui, Hawaii, United States'],
    maui: [['OGG'], 'Kapalua, Maui, Hawaii, United States'],
    norcal: [['SJC', 'SFO'], 'Santa Cruz, California, United States'],
    sandiego: [['SAN'], 'La Jolla, California, United States'],
    trestles: [['SNA', 'LAX'], 'San Clemente, California, United States'],
    puertoescondido: [['PXM', 'OAX'], 'Puerto Escondido, Oaxaca, Mexico'],
    sayulita: [['PVR'], 'Sayulita, Mexico'],
    rincon: [['BQN', 'SJU'], 'Rincón, Puerto Rico'],
    barbados: [['BGI'], 'Bathsheba, Barbados'],
    costarica: [['LIR', 'SJO'], 'Santa Teresa, Costa Rica'],
    nicaragua: [['MGA', 'LIR'], 'Popoyo, Nicaragua'],
    elsalvador: [['SAL'], 'El Tunco, El Salvador'],
    peru: [['TRU', 'TYL', 'LIM'], 'Puerto Chicama, Peru'],
    chile: [['SCL'], 'Pichilemu, Chile'],
    brazil: [['FLN'], 'Florianópolis, Brazil']
  };
  D.forEach(d => { const x = TRAVEL[d.id]; d.airports = x ? x[0] : []; d.stay = x ? x[1] : d.name; });

  /* Departure cities (default Madrid). id = code used in the app state (kept from the earlier version),
   * iata = airport or IATA city/metropolitan code for Google Flights and Kayak (LON, PAR, NYC, SAO = all
   * airports of that city), sky = the code Skyscanner uses in its /transport/flights/ URLs (its metro codes
   * are lond / pari / nyca; for São Paulo, GRU is used), lat/lon = main airport, for the rough distance-based
   * flight estimates. */
  window.TASF_ORIGINS = [
    { id: 'MAD', iata: 'MAD', sky: 'mad', name: 'Madrid', lat: 40.47, lon: -3.56 },
    { id: 'BCN', iata: 'BCN', sky: 'bcn', name: 'Barcelona', lat: 41.3, lon: 2.08 },
    { id: 'BIO', iata: 'BIO', sky: 'bio', name: 'Bilbao', lat: 43.3, lon: -2.91 },
    { id: 'VLC', iata: 'VLC', sky: 'vlc', name: 'Valencia', lat: 39.49, lon: -0.48 },
    { id: 'SVQ', iata: 'SVQ', sky: 'svq', name: 'Sevilla', lat: 37.42, lon: -5.9 },
    { id: 'AGP', iata: 'AGP', sky: 'agp', name: 'Málaga', lat: 36.67, lon: -4.5 },
    { id: 'LIS', iata: 'LIS', sky: 'lis', name: 'Lisboa / Lisbon', lat: 38.77, lon: -9.13 },
    { id: 'OPO', iata: 'OPO', sky: 'opo', name: 'Porto', lat: 41.24, lon: -8.68 },
    { id: 'LON', iata: 'LON', sky: 'lond', name: 'London', lat: 51.47, lon: -0.45 },
    { id: 'PAR', iata: 'PAR', sky: 'pari', name: 'Paris', lat: 49.01, lon: 2.55 },
    { id: 'BER', iata: 'BER', sky: 'ber', name: 'Berlin', lat: 52.36, lon: 13.5 },
    { id: 'AMS', iata: 'AMS', sky: 'ams', name: 'Amsterdam', lat: 52.31, lon: 4.76 },
    { id: 'DUB', iata: 'DUB', sky: 'dub', name: 'Dublin', lat: 53.42, lon: -6.27 },
    { id: 'NYC', iata: 'NYC', sky: 'nyca', name: 'New York', lat: 40.64, lon: -73.78 },
    { id: 'LAX', iata: 'LAX', sky: 'lax', name: 'Los Angeles', lat: 33.94, lon: -118.4 },
    { id: 'MEX', iata: 'MEX', sky: 'mex', name: 'Mexico City', lat: 19.43, lon: -99.07 },
    { id: 'SAO', iata: 'SAO', sky: 'gru', name: 'São Paulo', lat: -23.43, lon: -46.47 },
    { id: 'SYD', iata: 'SYD', sky: 'syd', name: 'Sydney', lat: -33.94, lon: 151.18 }
  ];

  // Rough on-the-ground cost per person per WEEK (EUR) by cost tier — placeholder bands
  window.TASF_COST_BANDS = { 1: [350, 650], 2: [600, 1000], 3: [1000, 1700], 4: [1800, 3500] };
})();

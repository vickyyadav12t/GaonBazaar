/**
 * Open-Meteo public APIs — no key. For indicative farm planning only.
 * @see https://open-meteo.com/
 */

export type GeocodeHit = {
  latitude: number;
  longitude: number;
  displayName: string;
  /** Village-level name often fails Open-Meteo search; broader query was used. */
  isApproximate?: boolean;
};

export type DailyForecast = {
  dates: string[];
  precipitationMm: number[];
  precipProbMax: number[];
  tempMaxC: number[];
  tempMinC: number[];
};

export type WeeklyRisk = {
  level: 'low' | 'moderate' | 'high';
  headlineEn: string;
  headlineHi: string;
  detailEn: string;
  detailHi: string;
};

function buildGeocodeAttempts(loc: { district?: string; state?: string; village?: string }): string[] {
  const v = (loc.village || '').trim();
  const d = (loc.district || '').trim();
  const s = (loc.state || '').trim();
  const suffix = ', India';
  const out: string[] = [];
  const add = (q: string) => {
    if (!out.includes(q)) out.push(q);
  };
  if (v && d && s) add(`${v}, ${d}, ${s}${suffix}`);
  if (d && s) add(`${d}, ${s}${suffix}`);
  if (d) add(`${d}${suffix}`);
  if (s) add(`${s}${suffix}`);
  return out;
}

type RawGeocode = {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
};

function pickIndiaResult(rows: RawGeocode[]): RawGeocode | null {
  const inIn = rows.find((r) => r.country_code === 'IN' || r.country === 'India');
  return inIn ?? rows[0] ?? null;
}

async function searchGeocode(name: string): Promise<RawGeocode[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: RawGeocode[] };
  return data.results ?? [];
}

export async function geocodeLocation(loc: {
  district?: string;
  state?: string;
  village?: string;
}): Promise<GeocodeHit | null> {
  const attempts = buildGeocodeAttempts(loc);
  if (attempts.length === 0) return null;

  for (let i = 0; i < attempts.length; i++) {
    const rows = await searchGeocode(attempts[i]);
    const r = pickIndiaResult(rows);
    if (r == null) continue;
    const admin = r.admin1 ? `, ${r.admin1}` : '';
    return {
      latitude: r.latitude,
      longitude: r.longitude,
      displayName: `${r.name}${admin}`,
      isApproximate: i > 0,
    };
  }
  return null;
}

export async function fetchWeekForecast(lat: number, lon: number): Promise<DailyForecast | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min',
    timezone: 'Asia/Kolkata',
    forecast_days: '7',
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    daily?: {
      time: string[];
      precipitation_sum: number[];
      precipitation_probability_max: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };
  const d = data.daily;
  if (!d?.time?.length) return null;
  return {
    dates: d.time,
    precipitationMm: d.precipitation_sum || d.time.map(() => 0),
    precipProbMax: d.precipitation_probability_max || d.time.map(() => 0),
    tempMaxC: d.temperature_2m_max || d.time.map(() => 0),
    tempMinC: d.temperature_2m_min || d.time.map(() => 0),
  };
}

/** Simple heuristic: heavy rain / high POP → field work & harvest logistics risk. */
export function assessWeeklyPlantHarvestRisk(d: DailyForecast): WeeklyRisk {
  const p = d.precipitationMm;
  const pop = d.precipProbMax;
  const sum3 = p.slice(0, 3).reduce((a, b) => a + b, 0);
  const sum7 = p.reduce((a, b) => a + b, 0);
  const wetDays3 = p.slice(0, 3).filter((mm) => mm >= 8).length;
  const highPop3 = pop.slice(0, 3).filter((x) => x >= 68).length;

  if (sum3 >= 42 || wetDays3 >= 2 || highPop3 >= 2) {
    return {
      level: 'high',
      headlineEn: 'High rain risk this week',
      headlineHi: 'इस सप्ताह भारी बारिश का जोखिम',
      detailEn:
        'Strong showers likely in the next few days. Plan harvest drying, bagging, and transport carefully; field access may be difficult.',
      detailHi:
        'अगले कुछ दिनों में तेज़ बारिश की संभावना। कटाई सुखाने, बोरीबंदी और ढुलाई की योजना सावधानी से बनाएं; खेत तक पहुँच मुश्किल हो सकती है।',
    };
  }

  if (sum3 >= 14 || sum7 >= 35 || pop.slice(0, 3).some((x) => x >= 52)) {
    return {
      level: 'moderate',
      headlineEn: 'Mixed weather — watch the sky',
      headlineHi: 'मिलाजुला मौसम — नज़र रखें',
      detailEn:
        'Some wet spells possible. Prefer dry windows for spraying, harvesting, and loading. Protect stacked produce from sudden rain.',
      detailHi:
        'कुछ नम दिन संभव। छिड़काव, कटाई और लोडिंग के लिए सूखे समय चुनें। अचानक बारिश से ढेर पर रखी उपज बचाएं।',
    };
  }

  if (sum7 <= 4 && pop.slice(0, 5).every((x) => x < 28)) {
    return {
      level: 'low',
      headlineEn: 'Mostly dry spell',
      headlineHi: 'अधिकतर सूखा दौर',
      detailEn:
        'Little rain expected. Good for field work and drying; ensure irrigation where crops need moisture.',
      detailHi:
        'कम बारिश की उम्मीद। खेत के काम और सुखाने के लिए अच्छा; जहाँ पानी की ज़रूरत हो वहाँ सिंचाई सुनिश्चित करें।',
    };
  }

  return {
    level: 'low',
    headlineEn: 'Favourable week overall',
    headlineHi: 'कुल मिलाकर अनुकूल सप्ताह',
    detailEn:
      'No major rain signal. Use routine checks for pests and soil moisture before peak heat.',
    detailHi:
      'बड़ी बारिश का संकेत नहीं। गर्मी से पहले कीट और मिट्टी की नमी की नियमित जाँच करें।',
  };
}

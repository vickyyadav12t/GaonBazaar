/** Curated external links for trust — not exhaustive; backend can replace later. */

export type CalendarRefLink = {
  href: string;
  labelEn: string;
  labelHi: string;
};

const GLOBAL_REFS: CalendarRefLink[] = [
  {
    href: 'https://icar.org.in/',
    labelEn: 'ICAR — Indian Council of Agricultural Research',
    labelHi: 'ICAR — भारतीय कृषि अनुसंधान परिषद',
  },
  {
    href: 'https://www.agricoop.gov.in/',
    labelEn: 'DAC&FW — Ministry of Agriculture & Farmers Welfare',
    labelHi: 'कृषि एवं किसान कल्याण मंत्रालय (DAC&FW)',
  },
  {
    href: 'https://farmer.gov.in/',
    labelEn: 'National farmer portal (Kisan)',
    labelHi: 'राष्ट्रीय किसान पोर्टल',
  },
];

/** One extra institute/directorate hint per crop where a stable URL exists. */
const CROP_REFS: Partial<Record<string, CalendarRefLink[]>> = {
  wheat: [
    {
      href: 'https://iiwbr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Wheat & Barley Research',
      labelHi: 'ICAR — भारतीय गेहूं एवं जौ अनुसंधान संस्थान',
    },
  ],
  rice: [
    {
      href: 'https://nrri.icar.gov.in/',
      labelEn: 'ICAR — National Rice Research Institute',
      labelHi: 'ICAR — राष्ट्रीय चावल अनुसंधान संस्थान',
    },
  ],
  tomato: [
    {
      href: 'https://iivr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Vegetable Research',
      labelHi: 'ICAR — भारतीय सब्जी अनुसंधान संस्थान',
    },
  ],
  onion: [
    {
      href: 'https://iivr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Vegetable Research',
      labelHi: 'ICAR — भारतीय सब्जी अनुसंधान संस्थान',
    },
  ],
  potato: [
    {
      href: 'https://cpri.icar.gov.in/',
      labelEn: 'ICAR — Central Potato Research Institute',
      labelHi: 'ICAR — केंद्रीय आलू अनुसंधान संस्थान',
    },
  ],
  mango: [
    {
      href: 'https://iihr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Horticultural Research',
      labelHi: 'ICAR — भारतीय उद्यानिकी अनुसंधान संस्थान',
    },
  ],
  banana: [
    {
      href: 'https://iihr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Horticultural Research',
      labelHi: 'ICAR — भारतीय उद्यानिकी अनुसंधान संस्थान',
    },
  ],
  cotton: [
    {
      href: 'https://cica.icar.gov.in/',
      labelEn: 'ICAR — Central Institute for Cotton Research',
      labelHi: 'ICAR — केंद्रीय कपास अनुसंधान संस्थान',
    },
  ],
  sugarcane: [
    {
      href: 'https://sugarcane.res.in/',
      labelEn: 'ICAR — Sugarcane Breeding Institute',
      labelHi: 'ICAR — गन्ना प्रजनन संस्थान',
    },
  ],
  chilli: [
    {
      href: 'https://iisr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Spices Research',
      labelHi: 'ICAR — भारतीय मसाला अनुसंधान संस्थान',
    },
  ],
  turmeric: [
    {
      href: 'https://iisr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Spices Research',
      labelHi: 'ICAR — भारतीय मसाला अनुसंधान संस्थान',
    },
  ],
  lentil: [
    {
      href: 'https://ipr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Pulses Research',
      labelHi: 'ICAR — भारतीय दलहन अनुसंधान संस्थान',
    },
  ],
  chickpea: [
    {
      href: 'https://ipr.icar.gov.in/',
      labelEn: 'ICAR — Indian Institute of Pulses Research',
      labelHi: 'ICAR — भारतीय दलहन अनुसंधान संस्थान',
    },
  ],
};

export function getCropCalendarReferenceLinks(cropId: string): CalendarRefLink[] {
  const extra = CROP_REFS[cropId] ?? [];
  const seen = new Set<string>();
  const out: CalendarRefLink[] = [];
  for (const link of [...extra, ...GLOBAL_REFS]) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);
    out.push(link);
  }
  return out;
}

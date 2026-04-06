import type { CropCalendarEntry, CropCategory, Season } from '@/types';

const CATEGORIES: CropCategory[] = [
  'vegetables',
  'fruits',
  'grains',
  'pulses',
  'spices',
  'dairy',
  'other',
];
const SEASONS: Season[] = ['spring', 'summer', 'monsoon', 'winter'];

function asCategory(v: unknown): CropCategory {
  return CATEGORIES.includes(v as CropCategory) ? (v as CropCategory) : 'other';
}

function asSeason(v: unknown): Season {
  return SEASONS.includes(v as Season) ? (v as Season) : 'winter';
}

/** Map GET /calendar entry to `CropCalendarEntry`. */
export function mapCalendarGuideFromApi(raw: Record<string, unknown>): CropCalendarEntry {
  const id = String(raw.id ?? raw.slug ?? '');
  const ref = raw.referenceLinks;
  return {
    id,
    cropName: String(raw.cropName ?? ''),
    cropNameHindi: String(raw.cropNameHindi ?? raw.cropName ?? ''),
    category: asCategory(raw.category),
    season: asSeason(raw.season),
    plantingMonths: Array.isArray(raw.plantingMonths)
      ? (raw.plantingMonths as number[]).filter((n) => typeof n === 'number' && n >= 1 && n <= 12)
      : [],
    harvestingMonths: Array.isArray(raw.harvestingMonths)
      ? (raw.harvestingMonths as number[]).filter((n) => typeof n === 'number' && n >= 1 && n <= 12)
      : [],
    growingPeriod: Number(raw.growingPeriod) || 0,
    description: String(raw.description ?? ''),
    descriptionHindi: String(raw.descriptionHindi ?? raw.description ?? ''),
    tips: Array.isArray(raw.tips) ? (raw.tips as string[]).map(String) : [],
    tipsHindi: Array.isArray(raw.tipsHindi) ? (raw.tipsHindi as string[]).map(String) : [],
    icon: String(raw.icon ?? '🌾'),
    region: raw.region != null && String(raw.region).trim() ? String(raw.region).trim().toLowerCase() : undefined,
    referenceLinks: Array.isArray(ref)
      ? (ref as { href?: string; labelEn?: string; labelHi?: string }[])
          .filter((l) => l?.href && l?.labelEn)
          .map((l) => ({
            href: String(l.href),
            labelEn: String(l.labelEn),
            labelHi: String(l.labelHi ?? l.labelEn),
          }))
      : undefined,
  };
}

import type { CropCalendarEntry } from '@/types';

export type AgroZoneId = 'north' | 'central' | 'south';

export const DEFAULT_AGRO_ZONE: AgroZoneId = 'central';

export const AGRO_ZONE_IDS: AgroZoneId[] = ['north', 'central', 'south'];

export type AgroZoneMeta = {
  id: AgroZoneId;
  labelEn: string;
  labelHi: string;
  shortEn: string;
  shortHi: string;
  /** Mock shift applied to baseline planting months (1–12, wrapped). */
  plantingDelta: number;
  /** Mock shift applied to baseline harvest months. */
  harvestDelta: number;
};

/** Illustrative offsets only — replace with API / agro-climatic data later. */
export const AGRO_ZONES: AgroZoneMeta[] = [
  {
    id: 'north',
    labelEn: 'Northern India (cooler plains & hills)',
    labelHi: 'उत्तरी भारत (ठंडे मैदान व पहाड़)',
    shortEn: 'North',
    shortHi: 'उत्तर',
    plantingDelta: 1,
    harvestDelta: 1,
  },
  {
    id: 'central',
    labelEn: 'Central India (baseline guide)',
    labelHi: 'मध्य भारत (मानक गाइड)',
    shortEn: 'Central',
    shortHi: 'मध्य',
    plantingDelta: 0,
    harvestDelta: 0,
  },
  {
    id: 'south',
    labelEn: 'Peninsular south (warmer, earlier windows)',
    labelHi: 'दक्षिण प्रायद्वीप (गर्म, पहले की विंडो)',
    shortEn: 'South',
    shortHi: 'दक्षिण',
    plantingDelta: -1,
    harvestDelta: -1,
  },
];

const zoneById: Record<AgroZoneId, AgroZoneMeta> = {
  north: AGRO_ZONES[0],
  central: AGRO_ZONES[1],
  south: AGRO_ZONES[2],
};

export function getAgroZoneMeta(id: AgroZoneId): AgroZoneMeta {
  return zoneById[id];
}

export function parseAgroZoneParam(value: string | null): AgroZoneId {
  if (value === 'north' || value === 'south' || value === 'central') return value;
  return DEFAULT_AGRO_ZONE;
}

/** Shift calendar month 1–12 by integer delta with wrap. */
export function shiftMonth(month: number, delta: number): number {
  const idx = month - 1 + delta;
  const wrapped = ((idx % 12) + 12) % 12;
  return wrapped + 1;
}

/** Apply mock regional offsets to a baseline calendar entry (immutable). */
export function applyAgroZoneToCrop(entry: CropCalendarEntry, zone: AgroZoneId): CropCalendarEntry {
  const z = zoneById[zone];
  const plantingMonths = [...new Set(entry.plantingMonths.map((m) => shiftMonth(m, z.plantingDelta)))].sort(
    (a, b) => a - b
  );
  const harvestingMonths = [...new Set(entry.harvestingMonths.map((m) => shiftMonth(m, z.harvestDelta)))].sort(
    (a, b) => a - b
  );
  return { ...entry, plantingMonths, harvestingMonths };
}

export function buildZonedCalendar(base: CropCalendarEntry[], zone: AgroZoneId): CropCalendarEntry[] {
  return base.map((c) => applyAgroZoneToCrop(c, zone));
}

type EntryWithRegion = CropCalendarEntry & { region?: string };

/**
 * Drop entries scoped to another agro zone; apply month offsets only to “global” rows (no region).
 */
export function prepareEntriesForAgroZone(base: CropCalendarEntry[], zone: AgroZoneId): CropCalendarEntry[] {
  return base
    .filter((c) => {
      const r = (c as EntryWithRegion).region;
      if (!r || !String(r).trim()) return true;
      return String(r).trim().toLowerCase() === zone;
    })
    .map((c) => {
      const r = (c as EntryWithRegion).region;
      if (r && String(r).trim()) return { ...c };
      return applyAgroZoneToCrop(c, zone);
    });
}

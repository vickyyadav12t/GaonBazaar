import type { CropCalendarEntry } from '@/types';

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatIcsDateValue(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}${m}${d}`;
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let out = '';
  let rest = line;
  while (rest.length > 75) {
    out += `${rest.slice(0, 75)}\r\n `;
    rest = rest.slice(75);
  }
  return out + rest;
}

function stampUtc(): string {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export type CropIcsOptions = {
  crop: CropCalendarEntry;
  cropDisplayName: string;
  zoneLabel: string;
  year: number;
  disclaimer: string;
};

/** One all-day anchor per key month (15th) for planting and harvest — works offline in most calendar apps. */
export function buildCropScheduleIcsText(opts: CropIcsOptions): string {
  const { crop, cropDisplayName, zoneLabel, year, disclaimer } = opts;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Caps Farm//Crop Guide//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`${cropDisplayName} — guide`)}`,
  ];

  const descBase = `${disclaimer} Zone: ${zoneLabel}. Growing period (approx.): ${crop.growingPeriod} days.`;

  const addEvents = (months: number[], kind: 'Planting' | 'Harvest') => {
    for (const month of months) {
      const uid = `crop-${crop.id}-${kind}-${month}-${year}@caps-calendar`;
      const sum = `${cropDisplayName} — ${kind} window (${zoneLabel})`;
      const dt = formatIcsDateValue(year, month, 15);
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${stampUtc()}`);
      lines.push(`DTSTART;VALUE=DATE:${dt}`);
      lines.push(`DTEND;VALUE=DATE:${formatIcsDateValue(year, month, 16)}`);
      lines.push(foldLine(`SUMMARY:${escapeIcsText(sum)}`));
      lines.push(foldLine(`DESCRIPTION:${escapeIcsText(descBase)}`));
      lines.push('END:VEVENT');
    }
  };

  addEvents(crop.plantingMonths, 'Planting');
  addEvents(crop.harvestingMonths, 'Harvest');

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadCropScheduleIcs(opts: CropIcsOptions, filenameSlug: string): void {
  const text = buildCropScheduleIcsText(opts);
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameSlug}-schedule.ics`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

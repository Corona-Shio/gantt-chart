const TZ_OFFSET = '+09:00';
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

const pad2 = (v: number): string => String(v).padStart(2, '0');

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const toTimelineStart = (yyyyMmDd: string): Date => {
  return new Date(`${yyyyMmDd}T00:00:00${TZ_OFFSET}`);
};

export const toTimelineEndExclusive = (yyyyMmDd: string): Date => {
  return addDays(toTimelineStart(yyyyMmDd), 1);
};

export const toDateInputValue = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${y}-${m}-${day}`;
};

export const floorTimelineDateToJst = (date: Date): string => {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = pad2(shifted.getUTCMonth() + 1);
  const d = pad2(shifted.getUTCDate());
  return `${y}-${m}-${d}`;
};

export const todayJst = (): string => {
  const now = new Date();
  return floorTimelineDateToJst(now);
};

export const clampDateRange = (a: string, b: string): { start: string; end: string } => {
  if (a <= b) {
    return { start: a, end: b };
  }
  return { start: b, end: a };
};

import { computeTripDurationHours } from '@/lib/trip-duration';
import type { AdminActivity, ActivityScheduleMode, FlexibleSchedule, TripEntry } from '@/types/admin-activity';

export function getActivityScheduleMode(activity: Pick<AdminActivity, 'scheduleMode'>): ActivityScheduleMode {
  return activity.scheduleMode === 'flexible' ? 'flexible' : 'trips';
}

export function isFlexibleSchedule(activity: Pick<AdminActivity, 'scheduleMode'>): boolean {
  return getActivityScheduleMode(activity) === 'flexible';
}

export function sortedTrips(activity: Pick<AdminActivity, 'trips'>): TripEntry[] {
  return (activity.trips ?? []).slice().sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}

/** Rezervasyon / bilet için tek satır sefer özeti */
export function formatActivityTripInfo(activity: Pick<AdminActivity, 'scheduleMode' | 'flexibleSchedule' | 'trips'>): string {
  if (isFlexibleSchedule(activity)) {
    return formatFlexibleScheduleSummary(activity.flexibleSchedule);
  }
  return sortedTrips(activity)
    .map((t) => {
      const dur =
        typeof t.durationHours === 'number' && Number.isFinite(t.durationHours) ? ` (${t.durationHours} Saat)` : '';
      return `${t.departureTime}→${t.arrivalTime}${dur}`;
    })
    .join(' | ');
}

export function formatFlexibleScheduleSummary(fs?: FlexibleSchedule | null): string {
  if (!fs) return 'Esnek saat';
  const label = fs.label?.trim();
  if (label) return label;
  const start = fs.windowStart?.trim();
  const end = fs.windowEnd?.trim();
  if (start && end) {
    const dur =
      typeof fs.durationHours === 'number' && Number.isFinite(fs.durationHours) ? ` (${fs.durationHours} Saat)` : '';
    return `${start}→${end}${dur}`;
  }
  if (start) return `${start} sonrası esnek`;
  if (end) return `${end} öncesi esnek`;
  if (typeof fs.durationHours === 'number' && Number.isFinite(fs.durationHours)) {
    return `Esnek saat (yaklaşık ${fs.durationHours} saat)`;
  }
  return 'Esnek saat';
}

export type ActivityScheduleLine =
  | { kind: 'trip'; id: string; departureTime: string; arrivalTime: string; durationHours: number }
  | { kind: 'flexible'; label: string; durationHours?: number };

export function getActivityScheduleLines(
  activity: Pick<AdminActivity, 'scheduleMode' | 'flexibleSchedule' | 'trips'>,
): ActivityScheduleLine[] {
  if (isFlexibleSchedule(activity)) {
    const fs = activity.flexibleSchedule;
    const label = formatFlexibleScheduleSummary(fs);
    const durationHours =
      typeof fs?.durationHours === 'number' && Number.isFinite(fs.durationHours) ? fs.durationHours : undefined;
    if (!fs?.windowStart?.trim() || !fs?.windowEnd?.trim()) {
      return [{ kind: 'flexible', label, durationHours }];
    }
    const start = fs.windowStart.trim();
    const end = fs.windowEnd.trim();
    const dur =
      durationHours ??
      (start && end ? computeTripDurationHours(start, end) : undefined);
    return [
      {
        kind: 'flexible',
        label: fs.label?.trim() || `${start} → ${end}`,
        durationHours: dur,
      },
    ];
  }
  return sortedTrips(activity).map((t) => ({
    kind: 'trip' as const,
    id: t.id,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    durationHours: t.durationHours,
  }));
}

export function normalizeFlexibleSchedule(raw: unknown): FlexibleSchedule | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const label = String(o.label ?? '').trim();
  const windowStart = String(o.windowStart ?? '').trim();
  const windowEnd = String(o.windowEnd ?? '').trim();
  let durationHours: number | undefined;
  if (o.durationHours !== undefined && o.durationHours !== null && String(o.durationHours).trim() !== '') {
    const n = Number(o.durationHours);
    if (Number.isFinite(n) && n >= 0) durationHours = Math.round(n * 100) / 100;
  }
  if (!durationHours && windowStart && windowEnd) {
    durationHours = computeTripDurationHours(windowStart, windowEnd);
  }
  if (!label && !windowStart && !windowEnd && durationHours === undefined) return undefined;
  return {
    ...(label ? { label } : {}),
    ...(windowStart ? { windowStart } : {}),
    ...(windowEnd ? { windowEnd } : {}),
    ...(durationHours !== undefined ? { durationHours } : {}),
  };
}

export function normalizeScheduleMode(raw: unknown): ActivityScheduleMode {
  return raw === 'flexible' ? 'flexible' : 'trips';
}

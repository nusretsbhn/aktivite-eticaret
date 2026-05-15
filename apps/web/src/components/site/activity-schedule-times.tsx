import { Clock3 } from 'lucide-react';

import { getActivityScheduleLines } from '@/lib/activity-schedule';
import type { AdminActivity } from '@/types/admin-activity';

type Props = {
  activity: Pick<AdminActivity, 'scheduleMode' | 'flexibleSchedule' | 'trips'>;
  className?: string;
  emptyClassName?: string;
};

export function ActivityScheduleTimes({ activity, className = '', emptyClassName = 'text-zinc-500' }: Props) {
  const lines = getActivityScheduleLines(activity);
  if (!lines.length) {
    return <p className={emptyClassName}>Sefer bilgisi yok</p>;
  }

  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      {lines.map((line, idx) => {
        if (line.kind === 'flexible') {
          return (
            <div key={`flex-${idx}`} className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                Esnek saat
              </span>
              <span className="font-bold text-zinc-900">{line.label}</span>
              {typeof line.durationHours === 'number' && line.durationHours > 0 && (
                <>
                  <span className="text-zinc-300">|</span>
                  <Clock3 className="h-4 w-4 text-zinc-500" aria-hidden />
                  <span>{line.durationHours} Saat</span>
                </>
              )}
            </div>
          );
        }
        return (
          <div key={line.id} className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
            <span className="font-bold text-zinc-900">{line.departureTime}</span>
            <span className="text-zinc-400">→</span>
            <span className="font-bold text-zinc-900">{line.arrivalTime}</span>
            <span className="mx-1 text-zinc-300">|</span>
            <Clock3 className="h-4 w-4 text-zinc-500" aria-hidden />
            <span>{line.durationHours} Saat</span>
          </div>
        );
      })}
    </div>
  );
}

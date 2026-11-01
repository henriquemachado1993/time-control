import { workedMinutes } from "./hours";

type WorkPeriod = { date: string; start_time: string; end_time: string | null };

export type WorkDay<T extends WorkPeriod> = {
  records: T[];
  minutes: number;
  completedCount: number;
};

export type WorkDaysSummary<T extends WorkPeriod> = {
  days: Map<string, WorkDay<T>>;
  totalMinutes: number;
  completedDayCount: number;
};

/** Mantém datas locais e períodos abertos; soma apenas os períodos encerrados. */
export function summarizeWorkDays<T extends WorkPeriod>(records: readonly T[]): WorkDaysSummary<T> {
  const groups = new Map<string, WorkDay<T>>();
  let totalMinutes = 0;
  let completedDayCount = 0;

  for (const record of records) {
    const date = record.date.slice(0, 10);
    const day = groups.get(date) ?? { records: [], minutes: 0, completedCount: 0 };
    day.records.push(record);
    if (record.end_time) {
      const minutes = workedMinutes(record.start_time, record.end_time);
      day.minutes += minutes;
      totalMinutes += minutes;
      if (day.completedCount === 0) completedDayCount += 1;
      day.completedCount += 1;
    }
    groups.set(date, day);
  }

  return {
    days: new Map([...groups].sort(([a], [b]) => b.localeCompare(a))),
    totalMinutes,
    completedDayCount,
  };
}

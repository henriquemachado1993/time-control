import { workedMinutes } from "./hours";

type WorkPeriod = {
  date: string;
  start_time: string;
  end_time: string | null;
};

/** Apura períodos encerrados por dia, aplicando a jornada da conta. */
export function calculateOvertime(
  periods: readonly WorkPeriod[],
  dailyTargetMinutes: number,
  totalUsedHours = 0,
) {
  const minutesByDate = new Map<string, number>();
  for (const period of periods) {
    if (!period.end_time) continue;
    minutesByDate.set(
      period.date,
      (minutesByDate.get(period.date) ?? 0) + workedMinutes(period.start_time, period.end_time),
    );
  }

  const breakdownByDate: Record<string, number> = {};
  let generatedMinutes = 0;
  for (const [date, minutes] of minutesByDate) {
    const extraMinutes = Math.max(0, minutes - dailyTargetMinutes);
    if (extraMinutes > 0) breakdownByDate[date] = extraMinutes / 60;
    generatedMinutes += extraMinutes;
  }

  const totalGenerated = generatedMinutes / 60;
  return {
    total_generated: totalGenerated,
    total_used: totalUsedHours,
    available: Math.max(0, totalGenerated - totalUsedHours),
    breakdown_by_date: breakdownByDate,
  };
}

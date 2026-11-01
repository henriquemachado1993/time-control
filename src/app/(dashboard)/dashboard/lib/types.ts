import type { WorkDay, WorkDaysSummary } from "@/lib/work-days";

export type DashboardWorkHour = {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  description?: string | null;
};

export type DashboardOvertimeUsage = { date: string; hours_used: number };

export type ChartPoint = { label: string; description: string; values: number[] };
export type ChartSeries = { label: string; color: string };

export type ExtraHours = { available: number; total_generated: number; total_used: number; breakdown_by_date: Record<string, number> };
export type DashboardData = { records: DashboardWorkHour[]; bank: ExtraHours; dailyTargetMinutes: number; usages: DashboardOvertimeUsage[] };
export type DashboardDay = WorkDay<DashboardWorkHour>;
export type DashboardDays = WorkDaysSummary<DashboardWorkHour>;

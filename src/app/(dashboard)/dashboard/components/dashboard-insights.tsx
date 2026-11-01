"use client";

import { useState } from "react";
import { monthStart } from "../lib/dates";
import type { DashboardDay, DashboardOvertimeUsage } from "../lib/types";
import { MonthlyWorkChart } from "./monthly-work-chart";
import { MonthlyOvertimeChart } from "./monthly-overtime-chart";
import { WorkCalendar } from "./work-calendar";

type Props = {
  days: Map<string, DashboardDay>;
  dailyTargetMinutes: number;
  generatedHoursByDate: Record<string, number>;
  usages: DashboardOvertimeUsage[];
  loading: boolean;
};

export function DashboardInsights({ days: grouped, dailyTargetMinutes, generatedHoursByDate, usages, loading }: Props) {
  const [month, setMonth] = useState(() => monthStart(new Date()));

  return (
    <section aria-label="Calendário e gráficos da jornada" aria-busy={loading} className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <div className="contents min-w-0 lg:block lg:space-y-6">
        <MonthlyWorkChart month={month} days={grouped} dailyTargetMinutes={dailyTargetMinutes} loading={loading} />
        <MonthlyOvertimeChart month={month} generatedHoursByDate={generatedHoursByDate} usages={usages} loading={loading} />
      </div>
      <WorkCalendar month={month} onMonthChange={setMonth} days={grouped} dailyTargetMinutes={dailyTargetMinutes} generatedHoursByDate={generatedHoursByDate} loading={loading} />
    </section>
  );
}

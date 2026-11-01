"use client";

import { useMemo } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ClockPunch } from "@/components/clock-punch";
import { summarizeWorkDays } from "@/lib/work-days";
import { useDashboard } from "../hooks/use-dashboard";
import { DashboardBank } from "./dashboard-bank";
import { DashboardInsights } from "./dashboard-insights";
import { DashboardMetrics } from "./dashboard-metrics";
import { RecentWorkDays } from "./recent-work-days";

export function DashboardScreen() {
  const { data, loading, error, refresh } = useDashboard();
  const summary = useMemo(() => summarizeWorkDays(data?.records ?? []), [data?.records]);

  return (
    <div className="mx-auto max-w-layout space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="text-[32px] leading-10 font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Visão geral do seu controle de horas e produtividade</p>
        </div>
        <ClockPunch onRecordsChanged={() => void refresh()} />
      </div>
      {error ? (
        <Alert variant="destructive" className="flex flex-wrap items-center justify-between gap-3">
          <AlertDescription>Não foi possível carregar o resumo. Tente novamente.</AlertDescription>
          <Button variant="outline" onClick={() => void refresh()}><IconRefresh aria-hidden="true" />Tentar novamente</Button>
        </Alert>
      ) : <>
        <DashboardMetrics summary={summary} available={data?.bank.available ?? 0} loading={loading} />
        <DashboardInsights days={summary.days} dailyTargetMinutes={data?.dailyTargetMinutes ?? 480} generatedHoursByDate={data?.bank.breakdown_by_date ?? {}} usages={data?.usages ?? []} loading={loading} />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <RecentWorkDays days={summary.days} loading={loading} />
          <DashboardBank bank={data?.bank} loading={loading} />
        </div>
      </>}
    </div>
  );
}

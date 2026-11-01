import { formatHours, formatDailyTarget } from "@/lib/hours";
import { dateKey } from "../lib/dates";
import type { DashboardDay, ChartPoint } from "../lib/types";
import { Legend, DurationChart } from "./duration-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
type Props = { month: Date; days: Map<string, DashboardDay>; dailyTargetMinutes: number; loading: boolean };
export function MonthlyWorkChart({ month, days: grouped, dailyTargetMinutes, loading }: Props) {
  const monthKey = dateKey(month).slice(0, 7);
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const workSeries = [{ label: "Horas trabalhadas", color: "var(--color-chart-1)" }];
  const dailyPoints: ChartPoint[] = Array.from({ length: monthDays }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index + 1, 12);
    return { label: String(index + 1).padStart(2, "0"), description: date.toLocaleDateString("pt-BR"), values: [grouped.get(dateKey(date))?.minutes ?? 0] };
  });
  const monthlyMinutes = dailyPoints.reduce((sum, point) => sum + point.values[0], 0);
  const recordedDays = [...grouped.keys()].filter(key => key.startsWith(monthKey)).length;
  return (
    <Card className="order-1 min-w-0">
      <CardHeader>
        <CardTitle>Horas trabalhadas no mês</CardTitle>
        <CardDescription className="first-letter:uppercase">{monthLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Skeleton className="h-64 w-full" /> : <>
          <div className="flex flex-wrap items-end justify-between gap-3"><p className="text-2xl font-semibold tabular-nums">{formatHours(monthlyMinutes / 60)}<span className="ml-2 text-xs font-normal text-muted-foreground">em {recordedDays} {recordedDays === 1 ? "dia com registro" : "dias com registros"}</span></p></div>
          <Legend series={workSeries} reference={`Jornada diária · ${formatDailyTarget(dailyTargetMinutes)}`} />
          <DurationChart points={dailyPoints} series={workSeries} label={`Horas trabalhadas por dia em ${monthLabel}`} referenceMinutes={dailyTargetMinutes} />
          {recordedDays === 0 && <p className="text-sm text-muted-foreground">Nenhum horário registrado neste mês. Selecione outro mês no calendário para consultar seu histórico.</p>}
        </>}
      </CardContent>
    </Card>
  );
}

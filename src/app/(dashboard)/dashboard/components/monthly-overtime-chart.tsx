import { useMemo } from "react";
import { dateKey } from "../lib/dates";
import type { DashboardOvertimeUsage } from "../lib/types";
import { Legend, DurationChart } from "./duration-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
type Props = { month: Date; generatedHoursByDate: Record<string, number>; usages: DashboardOvertimeUsage[]; loading: boolean };
export function MonthlyOvertimeChart({ month, generatedHoursByDate, usages, loading }: Props) {
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const overtimeSeries = [{ label: "Geradas", color: "var(--color-chart-1)" }, { label: "Utilizadas", color: "var(--color-chart-2)" }];
  const monthlyOvertime = useMemo(() => {
    const byMonth = new Map<string, { generated: number; used: number }>();
    for (const [date, hours] of Object.entries(generatedHoursByDate)) {
      const key = date.slice(0, 7);
      const item = byMonth.get(key) ?? { generated: 0, used: 0 };
      item.generated += hours * 60;
      byMonth.set(key, item);
    }
    for (const usage of usages) {
      const key = usage.date.slice(0, 7);
      const item = byMonth.get(key) ?? { generated: 0, used: 0 };
      item.used += usage.hours_used * 60;
      byMonth.set(key, item);
    }
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth() - 5 + index, 1, 12);
      const item = byMonth.get(dateKey(date).slice(0, 7));
      return { label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), description: date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), values: [Math.round(item?.generated ?? 0), Math.round(item?.used ?? 0)] };
    });
  }, [generatedHoursByDate, usages, month]);

  return (
    <Card className="order-3 min-w-0">
      <CardHeader><CardTitle>Movimentação de horas extras</CardTitle><CardDescription>Seis meses até {monthLabel}. Compare o que foi gerado e utilizado em cada mês.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {loading ? <Skeleton className="h-60 w-full" /> : <><Legend series={overtimeSeries} />{monthlyOvertime.some(point => point.values.some(value => value > 0)) ? <DurationChart points={monthlyOvertime} series={overtimeSeries} label={`Horas extras geradas e utilizadas nos seis meses até ${monthLabel}`} /> : <div className="flex min-h-44 items-center justify-center text-center"><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Não há movimentações neste período. As horas extras geradas e utilizadas aparecerão aqui.</p></div>}</>}
      </CardContent>
    </Card>
  );
}

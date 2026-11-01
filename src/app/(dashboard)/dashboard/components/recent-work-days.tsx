import Link from "next/link";
import { IconArrowRight, IconCalendarWeek, IconClock, IconPlus } from "@tabler/icons-react";
import { formatHours } from "@/lib/hours";
import type { DashboardDay } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
const dateLabel = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" });

export function RecentWorkDays({ days, loading }: { days: Map<string, DashboardDay>; loading: boolean }) {
  const recentDays = [...days].slice(0, 5);
  return (
    <Card className="min-w-0 gap-0 overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-5">
        <div className="space-y-1.5"><h2 className="font-semibold">Registros recentes</h2><p className="text-sm text-muted-foreground">Seus últimos dias de trabalho</p></div>
        <Button asChild variant="ghost" size="sm"><Link href="/horarios">Ver todos<IconArrowRight aria-hidden="true" /></Link></Button>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? <div className="space-y-4 px-6" aria-label="Carregando registros">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          : recentDays.length ? (
            <div className="divide-y border-t">
              {recentDays.map(([date, { records: dayRecords, minutes }]) => {
                return <div key={date} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconCalendarWeek className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                    <div className="min-w-0"><p className="text-sm font-medium capitalize">{dateLabel(date)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{dayRecords.length} {dayRecords.length === 1 ? "registro" : "registros"} · {dayRecords.map(record => `${record.start_time.slice(0, 5)}–${record.end_time?.slice(0, 5) ?? "Em andamento"}`).join(" / ")}</p></div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{formatHours(minutes / 60)}</span>
                </div>;
              })}
            </div>
          ) : <div className="flex flex-col items-center px-6 py-12 text-center"><IconClock className="mb-4 size-8 text-muted-foreground" aria-hidden="true" /><h3 className="font-medium">Seu histórico começa aqui</h3><p className="mt-2 max-w-xs text-sm text-muted-foreground">Adicione sua entrada e saída para acompanhar as horas trabalhadas.</p><Button asChild variant="outline" className="mt-5"><Link href="/horarios?novo=1"><IconPlus aria-hidden="true" />Criar primeiro registro</Link></Button></div>}
      </CardContent>
    </Card>

  );
}

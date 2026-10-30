"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDailyTarget, formatHours, workedMinutes } from "@/lib/hours";
import { cn } from "@/lib/utils";

export type DashboardWorkHour = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string | null;
};

export type DashboardOvertimeUsage = { date: string; hours_used: number };

type Props = {
  records: DashboardWorkHour[];
  dailyTargetMinutes: number;
  generatedHoursByDate: Record<string, number>;
  usages: DashboardOvertimeUsage[];
  loading: boolean;
};

type ChartPoint = { label: string; description: string; values: number[] };
type ChartSeries = { label: string; color: string };

// Construct dates in local time: stored YYYY-MM-DD values are calendar dates, not UTC instants.
function localDate(key: string) {
  const [year, month, day] = key.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", weekday: "long" });
}

function Legend({ series, reference }: { series: ChartSeries[]; reference?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {series.map(item => <span key={item.label} className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: item.color }} aria-hidden="true" />{item.label}</span>)}
      {reference && <span className="inline-flex items-center gap-2"><span className="w-4 border-t border-dashed border-current" aria-hidden="true" />{reference}</span>}
    </div>
  );
}

function DurationChart({ points, series, label, referenceMinutes }: {
  points: ChartPoint[];
  series: ChartSeries[];
  label: string;
  referenceMinutes?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const width = Math.max(points.length > 10 ? 620 : 240, Math.floor(containerWidth));
  const height = 236;
  const left = 46;
  const top = 12;
  const bottom = 202;
  const plotWidth = width - left - 12;
  const maximum = Math.max(referenceMinutes ?? 0, ...points.flatMap(point => point.values), 1);
  const tickUnit = maximum <= 4 ? 1 : maximum <= 30 ? 5 : maximum <= 120 ? 15 : maximum <= 1440 ? 60 : 240;
  const maxMinutes = Math.ceil(maximum / (4 * tickUnit)) * 4 * tickUnit;
  const y = (value: number) => bottom - (value / maxMinutes) * (bottom - top);
  const slot = plotWidth / points.length;
  const barWidth = Math.min(series.length === 1 ? 13 : 20, slot / (series.length + 2));

  return (
    <>
      <div ref={containerRef} className="overflow-x-auto overscroll-x-contain py-2">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className={`w-full ${points.length > 10 ? "min-w-[620px]" : "min-w-[240px]"}`}>
          {[0, 1, 2, 3, 4].map(tick => {
            const value = maxMinutes * tick / 4;
            const tickLabel = value % 60 === 0 ? `${value / 60}h` : value < 60 ? `${value}m` : `${Math.floor(value / 60)}h${value % 60}`;
            return <g key={tick}><line x1={left} x2={width - 12} y1={y(value)} y2={y(value)} stroke="var(--color-chart-grid)" /><text x={left - 10} y={y(value) + 5} textAnchor="end" fontSize="14" fill="var(--color-text-secondary)">{tickLabel}</text></g>;
          })}
          {referenceMinutes !== undefined && <line x1={left} x2={width - 12} y1={y(referenceMinutes)} y2={y(referenceMinutes)} stroke="var(--color-text-secondary)" strokeDasharray="5 5" />}
          {points.map((point, index) => {
            const center = left + slot * (index + 0.5);
            const groupWidth = series.length * barWidth + (series.length - 1) * 3;
            return <g key={point.description}>
              {point.values.map((value, seriesIndex) => <rect key={series[seriesIndex].label} x={center - groupWidth / 2 + seriesIndex * (barWidth + 3)} y={y(value)} width={barWidth} height={bottom - y(value)} rx="3" fill={series[seriesIndex].color}><title>{point.description}: {series[seriesIndex].label.toLowerCase()}, {formatHours(value / 60)}</title></rect>)}
              {(points.length <= 10 || index === 0 || (index + 1) % 5 === 0 || index === points.length - 1) && <text x={center} y={bottom + 24} textAnchor="middle" fontSize="14" fill="var(--color-text-secondary)">{point.label}</text>}
            </g>;
          })}
        </svg>
      </div>
      {points.length > 10 && <p className="text-xs text-muted-foreground sm:hidden">Deslize o gráfico para ver todos os dias do mês.</p>}
      <details className="group border-t pt-3">
        <summary className="w-fit cursor-pointer rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Ver dados em tabela</summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <Table>
            <caption className="sr-only">{label}</caption>
            <TableHeader><TableRow><TableHead>Período</TableHead>{series.map(item => <TableHead key={item.label} className="text-right">{item.label}</TableHead>)}{referenceMinutes !== undefined && <TableHead className="text-right">Jornada diária</TableHead>}</TableRow></TableHeader>
            <TableBody>{points.map(point => <TableRow key={point.description}><TableCell>{point.description}</TableCell>{point.values.map((value, index) => <TableCell key={series[index].label} className="text-right tabular-nums">{formatHours(value / 60)}</TableCell>)}{referenceMinutes !== undefined && <TableCell className="text-right tabular-nums">{formatHours(referenceMinutes / 60)}</TableCell>}</TableRow>)}</TableBody>
          </Table>
        </div>
      </details>
    </>
  );
}

function RecordedDayButton({ children, day, modifiers, className, ...props }: ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton day={day} modifiers={modifiers} {...props} className={cn(className, "h-11 aspect-auto rounded-lg", modifiers.today && "font-semibold")}>
      {children}
      {modifiers.recorded && !modifiers.outside && <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: modifiers.selected ? "currentColor" : modifiers.extra ? "var(--color-success-fg)" : "var(--color-chart-1)" }} />}
    </CalendarDayButton>
  );
}

export function DashboardInsights({ records, dailyTargetMinutes, generatedHoursByDate, usages, loading }: Props) {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(() => monthStart(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const monthKey = dateKey(month).slice(0, 7);
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const grouped = useMemo(() => {
    const groups = new Map<string, { records: DashboardWorkHour[]; minutes: number }>();
    for (const record of records) {
      const key = record.date.slice(0, 10);
      const group = groups.get(key) ?? { records: [], minutes: 0 };
      group.records.push(record);
      group.minutes += workedMinutes(record.start_time, record.end_time);
      groups.set(key, group);
    }
    return groups;
  }, [records]);

  const dailyPoints: ChartPoint[] = Array.from({ length: monthDays }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index + 1, 12);
    return { label: String(index + 1).padStart(2, "0"), description: date.toLocaleDateString("pt-BR"), values: [grouped.get(dateKey(date))?.minutes ?? 0] };
  });
  const monthlyMinutes = dailyPoints.reduce((sum, point) => sum + point.values[0], 0);
  const recordedDays = [...grouped.keys()].filter(key => key.startsWith(monthKey)).length;
  const selected = grouped.get(dateKey(selectedDate));
  const selectedExtras = Math.round((generatedHoursByDate[dateKey(selectedDate)] ?? 0) * 60);
  const workSeries = [{ label: "Horas trabalhadas", color: "var(--color-chart-1)" }];
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

  function changeMonth(date: Date) {
    setMonth(monthStart(date));
    setSelectedDate(monthStart(date));
  }

  return (
    <section aria-label="Calendário e gráficos da jornada" aria-busy={loading} className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <div className="contents min-w-0 lg:block lg:space-y-6">
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
        <Card className="order-3 min-w-0">
          <CardHeader><CardTitle>Movimentação de horas extras</CardTitle><CardDescription>Seis meses até {monthLabel}. Compare o que foi gerado e utilizado em cada mês.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {loading ? <Skeleton className="h-60 w-full" /> : <><Legend series={overtimeSeries} />{monthlyOvertime.some(point => point.values.some(value => value > 0)) ? <DurationChart points={monthlyOvertime} series={overtimeSeries} label={`Horas extras geradas e utilizadas nos seis meses até ${monthLabel}`} /> : <div className="flex min-h-44 items-center justify-center text-center"><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Não há movimentações neste período. As horas extras geradas e utilizadas aparecerão aqui.</p></div>}</>}
          </CardContent>
        </Card>
      </div>

      <Card className="order-2 min-w-0 lg:order-none lg:sticky lg:top-24">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1.5"><CardTitle>Calendário de registros</CardTitle><CardDescription>Selecione um dia para ver os períodos.</CardDescription></div>
          <Button size="sm" variant="outline" disabled={loading} onClick={() => { setMonth(monthStart(today)); setSelectedDate(today); }}>Hoje</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <><Skeleton className="h-72 w-full" /><Skeleton className="h-24 w-full" /></> : <>
            <Calendar mode="single" required locale={ptBR} weekStartsOn={1} month={month} onMonthChange={changeMonth} selected={selectedDate} onSelect={setSelectedDate} showOutsideDays={false} className="w-full p-0" classNames={{ root: "w-full", caption_label: "text-sm font-medium capitalize", day: "relative h-12 w-full p-0 text-center group/day select-none", week: "mt-1 flex w-full", today: "font-semibold" }} modifiers={{ recorded: [...grouped.keys()].map(localDate), extra: Object.keys(generatedHoursByDate).filter(key => generatedHoursByDate[key] > 0).map(localDate) }} components={{ DayButton: RecordedDayButton }} labels={{ labelPrevious: () => "Mês anterior", labelNext: () => "Próximo mês", labelDayButton: date => `${dayLabel(date)}: ${grouped.has(dateKey(date)) ? formatHours((grouped.get(dateKey(date))?.minutes ?? 0) / 60) + " trabalhadas" : "sem registros"}` }} />
            <Legend series={[{ label: "Com registros", color: "var(--color-chart-1)" }, { label: "Com horas extras", color: "var(--color-success-fg)" }]} />
            <div className="space-y-3 border-t pt-4" aria-live="polite">
              <h3 className="text-sm font-medium first-letter:uppercase">{dayLabel(selectedDate)}</h3>
              {selected ? <>
                <div><p className="text-xl font-semibold tabular-nums">{formatHours(selected.minutes / 60)}<span className="ml-2 text-xs font-normal text-muted-foreground">trabalhadas</span></p><p className="mt-1 text-xs text-muted-foreground">{selectedExtras > 0 ? `${formatHours(selectedExtras / 60)} de horas extras geradas.` : selected.minutes >= dailyTargetMinutes ? "Jornada diária completa." : `${formatHours((dailyTargetMinutes - selected.minutes) / 60)} para completar a jornada.`}</p></div>
                <ul className="divide-y">{[...selected.records].sort((a, b) => a.start_time.localeCompare(b.start_time)).map(record => <li key={record.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="text-sm tabular-nums">{record.start_time.slice(0, 5)} – {record.end_time.slice(0, 5)}</p>{record.description && <p className="mt-1 break-words text-xs text-muted-foreground">{record.description}</p>}</div><span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatHours(workedMinutes(record.start_time, record.end_time) / 60)}</span></li>)}</ul>
              </> : <p className="text-sm text-muted-foreground">Nenhum horário registrado neste dia.</p>}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">Dias sem registro não indicam ausência ou folga. O calendário mostra os horários que você informou.</p>
          </>}
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { useState, type ComponentProps } from "react";
import { ptBR } from "date-fns/locale";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatHours, workedMinutes } from "@/lib/hours";
import { dateKey, localDate, monthStart, dayLabel } from "../lib/dates";
import type { DashboardDay } from "../lib/types";
import { Legend } from "./duration-chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
function RecordedDayButton({ children, day, modifiers, className, ...props }: ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton day={day} modifiers={modifiers} {...props} className={cn(className, "h-11 aspect-auto rounded-lg", modifiers.today && "font-semibold")}>
      {children}
      {modifiers.recorded && !modifiers.outside && <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: modifiers.selected ? "currentColor" : modifiers.extra ? "var(--color-success-fg)" : "var(--color-chart-1)" }} />}
    </CalendarDayButton>
  );
}

type Props = {
  month: Date; onMonthChange: (month: Date) => void;
  days: Map<string, DashboardDay>; dailyTargetMinutes: number;
  generatedHoursByDate: Record<string, number>; loading: boolean;
};

export function WorkCalendar({ month, onMonthChange, days: grouped, dailyTargetMinutes, generatedHoursByDate, loading }: Props) {
  const [today] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const selected = grouped.get(dateKey(selectedDate));
  const selectedExtras = Math.round((generatedHoursByDate[dateKey(selectedDate)] ?? 0) * 60);
  function changeMonth(date: Date) {
    onMonthChange(monthStart(date));
    setSelectedDate(monthStart(date));
  }
  return (
    <Card className="order-2 min-w-0 lg:order-none lg:sticky lg:top-24">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="space-y-1.5"><CardTitle>Calendário de registros</CardTitle><CardDescription>Selecione um dia para ver os períodos.</CardDescription></div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => { onMonthChange(monthStart(today)); setSelectedDate(today); }}>Hoje</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <><Skeleton className="h-72 w-full" /><Skeleton className="h-24 w-full" /></> : <>
          <Calendar mode="single" required locale={ptBR} weekStartsOn={1} month={month} onMonthChange={changeMonth} selected={selectedDate} onSelect={setSelectedDate} showOutsideDays={false} className="w-full p-0" classNames={{ root: "w-full", caption_label: "text-sm font-medium capitalize", day: "relative h-12 w-full p-0 text-center group/day select-none", week: "mt-1 flex w-full", today: "font-semibold" }} modifiers={{ recorded: [...grouped.keys()].map(localDate), extra: Object.keys(generatedHoursByDate).filter(key => generatedHoursByDate[key] > 0).map(localDate) }} components={{ DayButton: RecordedDayButton }} labels={{ labelPrevious: () => "Mês anterior", labelNext: () => "Próximo mês", labelDayButton: date => `${dayLabel(date)}: ${grouped.has(dateKey(date)) ? formatHours((grouped.get(dateKey(date))?.minutes ?? 0) / 60) + " trabalhadas" : "sem registros"}` }} />
          <Legend series={[{ label: "Com registros", color: "var(--color-chart-1)" }, { label: "Com horas extras", color: "var(--color-success-fg)" }]} />
          <div className="space-y-3 border-t pt-4" aria-live="polite">
            <h3 className="text-sm font-medium first-letter:uppercase">{dayLabel(selectedDate)}</h3>
            {selected ? <>
              <div><p className="text-xl font-semibold tabular-nums">{formatHours(selected.minutes / 60)}<span className="ml-2 text-xs font-normal text-muted-foreground">trabalhadas</span></p><p className="mt-1 text-xs text-muted-foreground">{selectedExtras > 0 ? `${formatHours(selectedExtras / 60)} de horas extras geradas.` : selected.minutes >= dailyTargetMinutes ? "Jornada diária completa." : `${formatHours((dailyTargetMinutes - selected.minutes) / 60)} para completar a jornada.`}</p></div>
              <ul className="divide-y">{[...selected.records].sort((a, b) => a.start_time.localeCompare(b.start_time)).map(record => <li key={record.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="text-sm tabular-nums">{record.start_time.slice(0, 5)} – {record.end_time?.slice(0, 5) ?? "Em andamento"}</p>{record.description && <p className="mt-1 break-words text-xs text-muted-foreground">{record.description}</p>}</div><span className="shrink-0 text-xs text-muted-foreground tabular-nums">{record.end_time ? formatHours(workedMinutes(record.start_time, record.end_time) / 60) : "Em andamento"}</span></li>)}</ul>
            </> : <p className="text-sm text-muted-foreground">Nenhum horário registrado neste dia.</p>}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">Dias sem registro não indicam ausência ou folga. O calendário mostra os horários que você informou.</p>
        </>}
      </CardContent>
    </Card>
  );
}

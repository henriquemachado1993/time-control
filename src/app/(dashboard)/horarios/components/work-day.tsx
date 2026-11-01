"use client";

import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { IconCalendar, IconClock, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { formatDailyTarget, formatHours, workedMinutes } from "@/lib/hours";
import type { WorkHour } from "../lib/types";
function calculateTotalHours(start: string, end: string | null) {
  if (!start || !end) return "-";
  return formatHours(workedMinutes(start, end) / 60);
}

type Props = {
  date: string;
  records: WorkHour[];
  totals: { minutes: number; count: number };
  dailyTargetMinutes: number;
  filtered: boolean;
  onEdit: (record?: WorkHour, date?: Date) => void;
  onDelete: (record: WorkHour) => void;
};

export function WorkDay({ date: data, records: horariosData, totals, dailyTargetMinutes, filtered: activeSearchDescription, onEdit: openModal, onDelete: handleDelete }: Props) {
  const totalMinutes = totals.minutes;
  const minutesMissing = Math.max(dailyTargetMinutes - totalMinutes, 0);
  const minutesOver = Math.max(totalMinutes - dailyTargetMinutes, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="w-5 h-5" />
              {dayjs(`${data}T12:00`).format("DD/MM/YYYY")} · {dayjs(`${data}T12:00`).locale("pt-br").format("dddd")}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-2">
              <IconClock className="size-4" aria-hidden="true" />
              {activeSearchDescription ? "Total completo do dia:" : "Total do dia:"} <span className="font-semibold tabular-nums">{formatHours(totalMinutes / 60)}</span>
            </CardDescription>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                {minutesMissing > 0
                  ? `Faltam ${formatHours(minutesMissing / 60)} para completar a jornada de ${formatDailyTarget(dailyTargetMinutes)}.`
                  : minutesOver > 0
                    ? `Jornada completa · ${formatHours(minutesOver / 60)} extras.`
                    : "Jornada diária completa."}
              </p>
              <Progress
                value={Math.min((totalMinutes / dailyTargetMinutes) * 100, 100)}
                aria-label={`Jornada diária: ${formatHours(totalMinutes / 60)} de ${formatDailyTarget(dailyTargetMinutes)}`}
                className="h-1.5 max-w-64"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {activeSearchDescription
                ? `${horariosData.length} de ${totals.count} períodos`
                : `${horariosData.length} período${horariosData.length !== 1 ? "s" : ""}`}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openModal(undefined, dayjs(data).startOf("day").toDate())}
              aria-label={`Adicionar período em ${dayjs(`${data}T12:00`).format("DD/MM/YYYY")}`}
            >
              <IconPlus className="mr-1 size-4" aria-hidden="true" />
              Adicionar período
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entrada</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {horariosData.map((horario) => (
              <TableRow key={horario.id}>
                <TableCell className="font-medium tabular-nums">
                  {horario.start_time.slice(0, 5)}
                  {horario.description ? (
                    <details className="mt-1 max-w-48 text-left text-xs font-normal text-muted-foreground md:hidden">
                      <summary className="cursor-pointer py-1 underline underline-offset-2">Ver descrição</summary>
                      <p className="break-words pt-1">{horario.description}</p>
                    </details>
                  ) : <span className="mt-1 block text-xs font-normal text-muted-foreground md:hidden">Sem descrição</span>}
                </TableCell>
                <TableCell className={horario.end_time ? "font-medium tabular-nums" : "text-sm text-muted-foreground"}>
                  {horario.end_time?.slice(0, 5) ?? "Em andamento"}
                </TableCell>
                <TableCell className="font-semibold tabular-nums">
                  {calculateTotalHours(horario.start_time, horario.end_time)}
                </TableCell>
                <TableCell className="max-w-xs truncate hidden md:table-cell" title={horario.description}>
                  {horario.description || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 md:size-9"
                      onClick={() => openModal(horario)}
                      aria-label={`Editar registro de ${horario.start_time.slice(0, 5)} a ${horario.end_time?.slice(0, 5) ?? "em andamento"}`}
                    >
                      <IconEdit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 text-destructive hover:text-destructive md:size-9"
                      onClick={() => handleDelete(horario)}
                      aria-label={`Excluir registro de ${horario.start_time.slice(0, 5)} a ${horario.end_time?.slice(0, 5) ?? "em andamento"}`}
                    >
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconClock, IconPlus } from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockPunch } from "@/components/clock-punch";
import { formatHours } from "@/lib/hours";
import { useWorkHoursHistory } from "../hooks/use-work-hours-history";
import type { WorkHour } from "../lib/types";
import { DailyTargetSettings } from "./daily-target-settings";
import { DeleteWorkHour } from "./delete-work-hour";
import { HistoryPagination } from "./history-pagination";
import { WorkDay } from "./work-day";
import { WorkHourEditor } from "./work-hour-editor";
import { WorkHoursFilters } from "./work-hours-filters";

export function WorkHoursHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const history = useWorkHoursHistory();
  const [editor, setEditor] = useState<{ record?: WorkHour; date?: Date } | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<WorkHour | null>(null);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(480);
  const [success, setSuccess] = useState("");
  const [recordsVersion, setRecordsVersion] = useState(0);
  const [filtersVersion, setFiltersVersion] = useState(0);

  useEffect(() => {
    if (searchParams.get("novo") !== "1") return;
    setEditor({});
    router.replace("/horarios", { scroll: false });
  }, [searchParams, router]);

  const openEditor = (record?: WorkHour, date?: Date) => {
    setSuccess("");
    setEditor({ record, date });
  };
  const closeEditor = () => {
    setEditor(null);
  };
  const recordsChanged = (message: string) => {
    closeEditor();
    setDeletingRecord(null);
    setSuccess(message);
    setRecordsVersion((version) => version + 1);
    void history.refresh();
  };
  const clearFilters = () => {
    setFiltersVersion((version) => version + 1);
    void history.search(undefined, "", "all");
  };
  const filtered = !!history.activeSearchDate || !!history.activeSearchDescription || history.activePeriodPreset !== "all";

  return (
    <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {success && <Alert className="mb-6"><AlertDescription>{success}</AlertDescription></Alert>}
      {history.listError && <Alert variant="destructive" className="mb-6"><AlertDescription>{history.listError}</AlertDescription></Alert>}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[32px] leading-10 font-semibold tracking-tight">Registros de Horas</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Gerencie e visualize seus registros de trabalho</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DailyTargetSettings onChanged={setDailyTargetMinutes} />
            <Button className="self-start" onClick={() => openEditor()}><IconPlus className="w-4 h-4 mr-2" />Novo Registro</Button>
          </div>
        </div>
        <WorkHoursFilters key={filtersVersion} loading={history.listLoading} onSearch={history.search} />
      </div>
      <div className="mb-8"><ClockPunch recordsVersion={recordsVersion} onRecordsChanged={() => void history.refresh()} /></div>
      {!history.listLoading && !history.listError && (
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {history.horariosFiltrados.length} período{history.horariosFiltrados.length !== 1 ? "s" : ""} encontrado{history.horariosFiltrados.length !== 1 ? "s" : ""} em {history.totalDias} dia{history.totalDias !== 1 ? "s" : ""}
          {" · "}Total dos resultados: <span className="font-semibold tabular-nums text-foreground">{formatHours(history.totalEncontradoMinutos / 60)}</span>
          {history.activeSearchDescription && <span className="block mt-1">O total completo do dia continua considerando todos os períodos registrados.</span>}
        </p>
      )}
      <div className="space-y-6">
        {history.listLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></CardHeader>
              <CardContent><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div></CardContent>
            </Card>
          ))}</div>
        ) : history.listError ? null : history.diasPaginados.length === 0 ? (
          <Card><CardContent className="text-center py-12">
            <IconClock className="size-8 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-medium">Nenhum horário encontrado</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{filtered ? "Experimente outro período, outra data ou descrição, ou limpe os filtros." : "Registre sua entrada e saída para começar a acompanhar sua jornada."}</p>
            <Button variant="outline" className="mt-5" onClick={filtered ? clearFilters : () => openEditor()}>{filtered ? "Limpar filtros" : "Criar primeiro registro"}</Button>
          </CardContent></Card>
        ) : <>
          {history.diasPaginados.map(([date, records]) => <WorkDay key={date} date={date} records={records} totals={history.totaisPorData[date]} dailyTargetMinutes={dailyTargetMinutes} filtered={!!history.activeSearchDescription} onEdit={openEditor} onDelete={setDeletingRecord} />)}
          <HistoryPagination page={history.currentPage} totalDays={history.totalDias} pageSize={history.pageSize} onChange={history.setCurrentPage} />
        </>}
      </div>
      {editor && <WorkHourEditor record={editor.record} initialDate={editor.date} onClose={closeEditor} onSaved={recordsChanged} />}
      {deletingRecord && <DeleteWorkHour record={deletingRecord} onClose={() => setDeletingRecord(null)} onDeleted={() => recordsChanged("Horário excluído.")} />}
    </div>
  );
}

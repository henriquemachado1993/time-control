"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Progress } from "@/components/ui/progress";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { IconCalendar, IconPlus, IconSearch, IconEdit, IconTrash, IconClock, IconLoader2, IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { ClockPunch } from "@/components/clock-punch";
import { formatDailyTarget, formatHours, parseDailyTarget, workedMinutes } from "@/lib/hours";
import { findOverlappingWorkIntervals, validateWorkInterval } from "@/lib/work-hours";

/* eslint-disable @typescript-eslint/no-explicit-any */
type User = any;
type WorkHour = {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  description?: string;
  created_at: string;
};

type PeriodPreset = "all" | "today" | "week" | "month" | "custom";

function getPeriodRange(preset: Exclude<PeriodPreset, "all" | "custom">) {
  const today = dayjs().startOf("day");

  if (preset === "today") {
    const date = today.format("YYYY-MM-DD");
    return { from: date, to: date };
  }

  if (preset === "week") {
    const start = today.subtract((today.day() + 6) % 7, "day");
    return { from: start.format("YYYY-MM-DD"), to: start.add(6, "day").format("YYYY-MM-DD") };
  }

  return { from: today.startOf("month").format("YYYY-MM-DD"), to: today.endOf("month").format("YYYY-MM-DD") };
}

function calculateTotalHours(start: string, end: string | null) {
  if (!start || !end) return "-";
  return formatHours(workedMinutes(start, end) / 60);
}

function groupByDate(workHours: WorkHour[]) {
  const groups: { [key: string]: WorkHour[] } = {};
  workHours.forEach(workHour => {
    const data = workHour.date.slice(0, 10);
    if (!groups[data]) {
      groups[data] = [];
    }
    groups[data].push(workHour);
  });
  return groups;
}

const DEFAULT_DAILY_TARGET_MINUTES = 8 * 60;

function formatTargetInput(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function HorariosPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Estados do formulário
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState<WorkHour | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");

  // Estados da interface
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [horarios, setHorarios] = useState<WorkHour[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(DEFAULT_DAILY_TARGET_MINUTES);
  const [targetInput, setTargetInput] = useState("08:00");
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [targetLoading, setTargetLoading] = useState(true);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState("");
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [searchDescription, setSearchDescription] = useState("");
  const [activeSearchDescription, setActiveSearchDescription] = useState("");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("all");
  const [activeSearchDate, setActiveSearchDate] = useState<Date | undefined>(undefined);
  const [activePeriodPreset, setActivePeriodPreset] = useState<PeriodPreset>("all");
  const [dayIntervals, setDayIntervals] = useState<{ dateKey: string; records: WorkHour[]; loading: boolean; error?: string } | null>(null);

  // Estados do diálogo de confirmação
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WorkHour | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const DIAS_POR_PAGINA = 5;

  const fetchDailyTarget = async () => {
    setTargetLoading(true);
    setTargetError("");

    try {
      const response = await fetch("/api/configuracoes/jornada");
      const result = await response.json();

      if (!response.ok || !Number.isInteger(result.dailyTargetMinutes)) {
        throw new Error(result.error || "Não foi possível carregar a jornada diária.");
      }

      setDailyTargetMinutes(result.dailyTargetMinutes);
      setTargetInput(formatTargetInput(result.dailyTargetMinutes));
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : "Não foi possível carregar a jornada diária.");
    } finally {
      setTargetLoading(false);
    }
  };

  const handleSaveDailyTarget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTarget = parseDailyTarget(targetInput);
    if (parsedTarget === null) {
      setTargetError("Informe um horário entre 00:01 e 24:00, no formato HH:mm.");
      return;
    }

    setTargetSaving(true);
    setTargetError("");

    try {
      const response = await fetch("/api/configuracoes/jornada", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyTargetMinutes: parsedTarget }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Não foi possível salvar a jornada diária.");

      setDailyTargetMinutes(result.dailyTargetMinutes);
      setTargetInput(formatTargetInput(result.dailyTargetMinutes));
      setTargetDialogOpen(false);
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : "Não foi possível salvar a jornada diária.");
    } finally {
      setTargetSaving(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    } else {
      setUser(session.user);
      setLoading(false);
    }
  }, [session, status, router]);

  const fetchHorarios = async (
    searchDateParam?: Date,
    searchDescriptionParam?: string,
    preset: PeriodPreset = "all",
    resetPage = false,
  ) => {
    setListLoading(true);
    setListError("");

    try {
      const params = new URLSearchParams();
      if (searchDateParam) {
        params.set("date", dayjs(searchDateParam).format("YYYY-MM-DD"));
      } else if (preset !== "all" && preset !== "custom") {
        const range = getPeriodRange(preset);
        params.set("dateFrom", range.from);
        params.set("dateTo", range.to);
      }

      const query = params.toString();
      const response = await fetch(query ? `/api/horarios?${query}` : "/api/horarios");
      if (!response.ok) {
        setListError("Não foi possível carregar os registros. Tente buscar novamente.");
        return;
      }

      const data = await response.json();
      setHorarios(data);
      setActiveSearchDescription((searchDescriptionParam || "").trim());
      setActiveSearchDate(searchDateParam);
      setActivePeriodPreset(preset);
      if (resetPage) setCurrentPage(1);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setListError("Não foi possível carregar os registros. Verifique sua conexão e tente novamente.");
    } finally {
      setListLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchHorarios();
      fetchDailyTarget();
    }
  }, [user]);

  useEffect(() => {
    if (status === "authenticated" && new URLSearchParams(window.location.search).get("novo") === "1") {
      setShowModal(true);
      router.replace("/horarios", { scroll: false });
    }
  }, [status, router]);

  const selectedDateKey = date ? dayjs(date).format("YYYY-MM-DD") : "";

  useEffect(() => {
    if (!showModal || !selectedDateKey) return;

    const controller = new AbortController();
    setDayIntervals({ dateKey: selectedDateKey, records: [], loading: true });

    fetch(`/api/horarios?date=${selectedDateKey}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível conferir os períodos deste dia.");
        return response.json() as Promise<WorkHour[]>;
      })
      .then((records) => {
        setDayIntervals({ dateKey: selectedDateKey, records, loading: false });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setDayIntervals({
          dateKey: selectedDateKey,
          records: [],
          loading: false,
          error: "Não foi possível conferir os períodos deste dia.",
        });
      });

    return () => controller.abort();
  }, [showModal, selectedDateKey]);

  const selectedDayIntervals =
    dayIntervals?.dateKey === selectedDateKey ? dayIntervals.records : [];
  const intervalCheckLoading =
    showModal && !!selectedDateKey && (dayIntervals?.dateKey !== selectedDateKey || dayIntervals.loading);
  const intervalCheckError =
    dayIntervals?.dateKey === selectedDateKey ? dayIntervals.error : undefined;
  const intervalValidationMessage =
    date && start && end ? validateWorkInterval(selectedDateKey, start, end) : null;
  const overlappingIntervals =
    start && end && !intervalValidationMessage
      ? findOverlappingWorkIntervals(selectedDayIntervals, start, end, editingHorario?.id)
      : [];

  const openModal = (workHour?: WorkHour, initialDate?: Date) => {
    if (workHour) {
      setEditingHorario(workHour);
      setDate(dayjs(workHour.date).toDate());
      setStart(workHour.start_time.slice(0, 5));
      setEnd(workHour.end_time?.slice(0, 5) ?? "");
      setDescription(workHour.description || "");
    } else {
      setEditingHorario(null);
      setDate(initialDate ?? new Date());
      setStart("");
      setEnd("");
      setDescription("");
    }
    setShowModal(true);
    setFormError("");
    setSuccess("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHorario(null);
    setFormError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    setSuccess("");

    if (!date || !start || !end) {
      setFormError("Informe a data, a entrada e a saída.");
      return;
    }

    const dateValue = dayjs(date).format("YYYY-MM-DD");
    const validationError = validateWorkInterval(dateValue, start, end);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (dayIntervals?.dateKey !== dateValue || dayIntervals.loading) {
      setFormError("Aguarde a conferência dos outros períodos deste dia.");
      return;
    }
    if (dayIntervals.error) {
      setFormError(dayIntervals.error);
      return;
    }
    const overlaps = findOverlappingWorkIntervals(
      dayIntervals.records,
      start,
      end,
      editingHorario?.id,
    );
    if (overlaps.length > 0) {
      setFormError("Este período se sobrepõe a outro horário registrado neste dia.");
      return;
    }

    setSaving(true);
    try {
      const url = editingHorario ? `/api/horarios/${editingHorario.id}` : "/api/horarios";
      const method = editingHorario ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateValue,
          start_time: start,
          end_time: end,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || "Erro ao salvar horário.");
        return;
      }

      closeModal();
      setSuccess(editingHorario ? "Horário atualizado." : "Horário salvo.");
      await fetchHorarios(activeSearchDate, activeSearchDescription, activePeriodPreset);
    } catch {
      setFormError("Não foi possível salvar o horário. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (workHour: WorkHour) => {
    setItemToDelete(workHour);
    setDeleteError("");
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || deleting) return false;

    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/horarios/${itemToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        setDeleteError(error.error || "Não foi possível excluir este horário.");
        return false;
      }

      setSuccess("Horário excluído.");
      await fetchHorarios(activeSearchDate, activeSearchDescription, activePeriodPreset);
      setItemToDelete(null);
      return true;
    } catch {
      setDeleteError("Não foi possível excluir este horário. Verifique sua conexão e tente novamente.");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = () => {
    const preset = searchDate ? "custom" : periodPreset;
    setPeriodPreset(preset);
    fetchHorarios(searchDate, searchDescription, preset, true);
  };

  const applyPeriodPreset = (preset: Exclude<PeriodPreset, "custom">) => {
    setSearchDate(undefined);
    setPeriodPreset(preset);
    fetchHorarios(undefined, searchDescription, preset, true);
  };

  const clearSearch = () => {
    setSearchDate(undefined);
    setSearchDescription("");
    setPeriodPreset("all");
    fetchHorarios(undefined, "", "all", true);
  };

  const horariosFiltrados = useMemo(() => {
    const query = activeSearchDescription.trim().toLocaleLowerCase("pt-BR");
    if (!query) return horarios;
    return horarios.filter((horario) =>
      (horario.description || "").toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [horarios, activeSearchDescription]);

  const horariosAgrupados = groupByDate(horariosFiltrados);
  const diasOrdenados = Object.entries(horariosAgrupados).sort(([a], [b]) => b.localeCompare(a));
  const totaisPorData = useMemo(() => {
    const totals: Record<string, { minutes: number; count: number }> = {};
    horarios.forEach((horario) => {
      const key = horario.date.slice(0, 10);
      const current = totals[key] ?? { minutes: 0, count: 0 };
      current.minutes += workedMinutes(horario.start_time, horario.end_time);
      current.count += 1;
      totals[key] = current;
    });
    return totals;
  }, [horarios]);

  const totalDias = diasOrdenados.length;
  const totalPaginas = Math.ceil(totalDias / DIAS_POR_PAGINA);
  const startIndex = (currentPage - 1) * DIAS_POR_PAGINA;
  const endIndex = startIndex + DIAS_POR_PAGINA;
  const diasPaginados = diasOrdenados.slice(startIndex, endIndex);
  const totalEncontradoMinutos = horariosFiltrados.reduce(
    (total, horario) => total + workedMinutes(horario.start_time, horario.end_time),
    0,
  );

  useEffect(() => {
    const lastPage = Math.max(1, totalPaginas);
    setCurrentPage((page) => Math.min(page, lastPage));
  }, [totalPaginas]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Mensagens */}
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {listError && <Alert variant="destructive" className="mb-6"><AlertDescription>{listError}</AlertDescription></Alert>}
      {targetError && !targetDialogOpen && <Alert variant="destructive" className="mb-6"><AlertDescription>{targetError}<Button variant="outline" size="sm" className="ml-3" onClick={fetchDailyTarget} disabled={targetLoading}>Tentar novamente</Button></AlertDescription></Alert>}
      {formError && !showModal && <Alert variant="destructive" className="mb-6"><AlertDescription>{formError}</AlertDescription></Alert>}

      {/* Controles de busca */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[32px] leading-10 font-semibold tracking-tight">Registros de Horas</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Gerencie e visualize seus registros de trabalho
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="self-start" onClick={() => { setTargetInput(formatTargetInput(dailyTargetMinutes)); setTargetError(""); setTargetDialogOpen(true); }} disabled={targetLoading}>
              <IconAdjustmentsHorizontal aria-hidden="true" />
              Jornada · {formatDailyTarget(dailyTargetMinutes)}
            </Button>
            <Button className="self-start" onClick={() => openModal()}>
              <IconPlus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSearch className="w-5 h-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Combine um período rápido, uma data específica e uma busca por descrição.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium">Período rápido</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por período">
                {([
                  ["today", "Hoje"],
                  ["week", "Esta semana"],
                  ["month", "Este mês"],
                  ["all", "Todo período"],
                ] as const).map(([preset, label]) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant={periodPreset === preset ? "default" : "outline"}
                    aria-pressed={periodPreset === preset}
                    onClick={() => applyPeriodPreset(preset)}
                    disabled={listLoading}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); handleSearch(); }} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  date={searchDate}
                  onDateChange={(selectedDate) => {
                    setSearchDate(selectedDate);
                    setPeriodPreset(selectedDate ? "custom" : "all");
                  }}
                  label="Data específica"
                  placeholder="Selecionar data"
                  className="w-full"
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="search-description">
                    Buscar por descrição
                  </Label>
                  <Input
                    id="search-description"
                    type="text"
                    placeholder="Digite parte da descrição..."
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="submit" disabled={listLoading}>
                  <IconSearch className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button type="button" variant="outline" onClick={clearSearch} disabled={listLoading}>
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <ClockPunch onRecordsChanged={() => void fetchHorarios(activeSearchDate, activeSearchDescription, activePeriodPreset)} />
      </div>

      {!listLoading && !listError && (
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {horariosFiltrados.length} período{horariosFiltrados.length !== 1 ? "s" : ""} encontrado{horariosFiltrados.length !== 1 ? "s" : ""} em {totalDias} dia{totalDias !== 1 ? "s" : ""}
          {" · "}Total dos resultados: <span className="font-semibold tabular-nums text-foreground">{formatHours(totalEncontradoMinutos / 60)}</span>
          {activeSearchDescription && <span className="block mt-1">O total completo do dia continua considerando todos os períodos registrados.</span>}
        </p>
      )}

      {/* Lista de horários com paginação */}
      <div className="space-y-6">
        {listLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listError ? null : diasPaginados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <IconClock className="size-8 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="font-medium">Nenhum horário encontrado</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{activeSearchDate || activeSearchDescription || activePeriodPreset !== "all" ? "Experimente outro período, outra data ou descrição, ou limpe os filtros." : "Registre sua entrada e saída para começar a acompanhar sua jornada."}</p>
              <Button variant="outline" className="mt-5" onClick={activeSearchDate || activeSearchDescription || activePeriodPreset !== "all" ? clearSearch : () => openModal()}>{activeSearchDate || activeSearchDescription || activePeriodPreset !== "all" ? "Limpar filtros" : "Criar primeiro registro"}</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {diasPaginados.map(([data, horariosData]) => (
              <Card key={data}>
                <CardHeader>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <IconCalendar className="w-5 h-5" />
                        {dayjs(`${data}T12:00`).format("DD/MM/YYYY")} · {dayjs(`${data}T12:00`).locale("pt-br").format("dddd")}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-2">
                        <IconClock className="size-4" aria-hidden="true" />
                        {activeSearchDescription ? "Total completo do dia:" : "Total do dia:"} <span className="font-semibold tabular-nums">{formatHours((totaisPorData[data]?.minutes ?? 0) / 60)}</span>
                      </CardDescription>
                      {(() => {
                        const totalMinutes = totaisPorData[data]?.minutes ?? 0;
                        const minutesMissing = Math.max(dailyTargetMinutes - totalMinutes, 0);
                        const minutesOver = Math.max(totalMinutes - dailyTargetMinutes, 0);

                        return (
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
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {activeSearchDescription
                          ? `${horariosData.length} de ${totaisPorData[data]?.count ?? 0} períodos`
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
            ))}

            {/* Paginação */}
            {totalPaginas > 1 && (
              <nav aria-label="Paginação dos registros" className="flex flex-wrap items-center justify-center gap-2 py-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(page => Math.abs(page - currentPage) <= 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Página ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setCurrentPage(Math.min(totalPaginas, currentPage + 1))}
                  disabled={currentPage === totalPaginas}
                  variant="outline"
                  size="sm"
                >
                  Próxima
                </Button>
              </nav>
            )}

            {/* Informações da paginação */}
            {totalDias > 0 && (
              <div className="text-center text-muted-foreground mt-4">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalDias)} de {totalDias} dia{totalDias !== 1 ? "s" : ""}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><IconClock className="size-5" aria-hidden="true" />Configurar jornada diária</DialogTitle>
            <DialogDescription>Defina quantas horas você quer cumprir por dia. O padrão é 08:00.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDailyTarget} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="daily-target">Horas e minutos</Label>
              <Input
                id="daily-target"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="08:00"
                pattern="(?:[01]?\d|2[0-3]):[0-5]\d|24:00"
                maxLength={5}
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">Use o formato HH:mm, por exemplo 08:00 ou 07:30.</p>
              <p className="text-sm text-muted-foreground">Alterar a jornada também recalcula o saldo de horas extras do seu histórico.</p>
            </div>
            {targetError && <Alert variant="destructive"><AlertDescription>{targetError}</AlertDescription></Alert>}
            <div className="flex flex-col-reverse gap-2">
              <Button type="button" variant="ghost" onClick={() => { setTargetInput("08:00"); setTargetError(""); }} disabled={targetSaving || targetInput === "08:00"}>
                Restaurar padrão · 8h
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setTargetDialogOpen(false)} disabled={targetSaving}>Cancelar</Button>
                <Button type="submit" disabled={targetSaving || targetLoading}>
                  {targetSaving && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {targetSaving ? "Salvando…" : "Salvar jornada"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingHorario ? (
                <>
                  <IconEdit className="w-5 h-5" />
                  Editar Horário
                </>
              ) : (
                <>
                  <IconPlus className="w-5 h-5" />
                  Novo Horário
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingHorario
                ? "Atualize as informações do horário selecionado"
                : "Adicione um novo registro de horário"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DatePicker
              date={date}
              onDateChange={setDate}
              label="Data"
              placeholder="Selecionar data"
            />
            <div className="grid grid-cols-2 gap-4">
              <TimePicker label="Entrada" value={start} onTimeChange={setStart} required />
              <TimePicker id="end" label="Saída" value={end} onTimeChange={setEnd} required />
            </div>
            {date && start && end && intervalValidationMessage && (
              <Alert variant="destructive">
                <AlertDescription>{intervalValidationMessage}</AlertDescription>
              </Alert>
            )}
            {date && start && end && !intervalValidationMessage && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium tabular-nums">Este período soma {formatHours(workedMinutes(start, end) / 60)}.</p>
                {intervalCheckLoading && <p className="text-muted-foreground">Conferindo os outros períodos deste dia…</p>}
                {intervalCheckError && <p role="alert" className="text-destructive">{intervalCheckError}</p>}
                {overlappingIntervals.map((interval) => (
                  <p key={interval.id} role="alert" className="text-destructive">
                    Conflito com {interval.start_time.slice(0, 5)}–{interval.end_time?.slice(0, 5) ?? "em andamento"}. Ajuste os horários para não contar o mesmo tempo duas vezes.
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Reunião com cliente, desenvolvimento de feature..."
              />
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={saving || !!success || !date || !start || !end || !!intervalValidationMessage || intervalCheckLoading || !!intervalCheckError || overlappingIntervals.length > 0}
              >
                {saving && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
                {saving ? "Salvando..." : editingHorario ? "Atualizar" : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação Responsivo */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          if (!open && deleting) return;
          setConfirmDialogOpen(open);
          if (open) setDeleteError("");
        }}
        title="Excluir Horário"
        description={itemToDelete
          ? `Excluir o período de ${itemToDelete.start_time.slice(0, 5)} a ${itemToDelete.end_time?.slice(0, 5) ?? "em andamento"} em ${dayjs(`${itemToDelete.date}T12:00`).format("DD/MM/YYYY")}? O total do dia e o saldo de extras serão recalculados.`
          : "Esta ação não pode ser desfeita."}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
        isConfirming={deleting}
        error={deleteError}
      />
    </div>
  );
}

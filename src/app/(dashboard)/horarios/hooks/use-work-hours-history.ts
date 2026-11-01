import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { workedMinutes } from "@/lib/hours";
import type { WorkHour, PeriodPreset } from "../lib/types";
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

const DAYS_PER_PAGE = 5;

export function useWorkHoursHistory() {
  const pendingRequest = useRef<AbortController | null>(null);
  const [horarios, setHorarios] = useState<WorkHour[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [activeSearchDescription, setActiveSearchDescription] = useState("");
  const [activeSearchDate, setActiveSearchDate] = useState<Date>();
  const [activePeriodPreset, setActivePeriodPreset] = useState<PeriodPreset>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const fetchHorarios = useCallback(async (
    searchDateParam?: Date,
    searchDescriptionParam?: string,
    preset: PeriodPreset = "all",
    resetPage = false,
  ) => {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
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
      const response = await fetch(query ? `/api/horarios?${query}` : "/api/horarios", { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setListError("Não foi possível carregar os registros. Tente buscar novamente.");
        return;
      }

      const data = await response.json();
      if (controller.signal.aborted) return;
      setHorarios(data);
      setActiveSearchDescription((searchDescriptionParam || "").trim());
      setActiveSearchDate(searchDateParam);
      setActivePeriodPreset(preset);
      if (resetPage) setCurrentPage(1);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Erro ao buscar horários:", error);
      setListError("Não foi possível carregar os registros. Verifique sua conexão e tente novamente.");
    } finally {
      if (!controller.signal.aborted) setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHorarios();
    return () => pendingRequest.current?.abort();
  }, [fetchHorarios]);
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
  const totalPaginas = Math.ceil(totalDias / DAYS_PER_PAGE);
  const startIndex = (currentPage - 1) * DAYS_PER_PAGE;
  const endIndex = startIndex + DAYS_PER_PAGE;
  const diasPaginados = diasOrdenados.slice(startIndex, endIndex);
  const totalEncontradoMinutos = horariosFiltrados.reduce(
    (total, horario) => total + workedMinutes(horario.start_time, horario.end_time),
    0,
  );

  useEffect(() => {
    const lastPage = Math.max(1, totalPaginas);
    setCurrentPage((page) => Math.min(page, lastPage));
  }, [totalPaginas]);

  const search = (date: Date | undefined, description: string, preset: PeriodPreset) => fetchHorarios(date, description, preset, true);
  const refresh = () => fetchHorarios(activeSearchDate, activeSearchDescription, activePeriodPreset);
  return { listLoading, listError, activeSearchDate, activeSearchDescription, activePeriodPreset, horariosFiltrados, diasPaginados, totaisPorData, totalDias, totalEncontradoMinutos, currentPage, setCurrentPage, search, refresh, pageSize: DAYS_PER_PAGE };
}

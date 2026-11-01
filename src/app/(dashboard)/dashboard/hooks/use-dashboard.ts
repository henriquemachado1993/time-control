import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData, DashboardOvertimeUsage, DashboardWorkHour, ExtraHours } from "../lib/types";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pendingRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setLoading(true);
    setError(false);
    try {
      const [workResponse, bankResponse, targetResponse, usagesResponse] = await Promise.all([
        fetch("/api/horarios", { signal: controller.signal }),
        fetch("/api/horas-extras/disponivel", { signal: controller.signal }),
        fetch("/api/configuracoes/jornada", { signal: controller.signal }),
        fetch("/api/horas-extras/uso", { signal: controller.signal }),
      ]);
      if ([workResponse, bankResponse, targetResponse, usagesResponse].some(response => !response.ok)) throw new Error("Falha ao carregar o painel");
      const [records, bank, target, usages]: [DashboardWorkHour[], ExtraHours, { dailyTargetMinutes: number }, DashboardOvertimeUsage[]] = await Promise.all([workResponse.json(), bankResponse.json(), targetResponse.json(), usagesResponse.json()]);
      if (!Number.isInteger(target.dailyTargetMinutes) || target.dailyTargetMinutes < 1 || target.dailyTargetMinutes > 1440) throw new Error("Jornada diária inválida");
      if (!controller.signal.aborted) setData({ records, bank, dailyTargetMinutes: target.dailyTargetMinutes, usages });
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => pendingRequest.current?.abort();
  }, [refresh]);

  return { data, loading, error, refresh };
}

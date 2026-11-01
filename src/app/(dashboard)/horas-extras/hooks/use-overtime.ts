import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtraHoursAvailable, ExtraHoursUsage } from "../lib/types";

type OvertimeData = { bank: ExtraHoursAvailable | null; usages: ExtraHoursUsage[] };

export function useOvertime() {
  const [data, setData] = useState<OvertimeData>({ bank: null, usages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pendingRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setLoading(true);
    setError("");
    try {
      const [bankResponse, usagesResponse] = await Promise.all([
        fetch("/api/horas-extras/disponivel", { signal: controller.signal }),
        fetch("/api/horas-extras/uso", { signal: controller.signal }),
      ]);
      if (!bankResponse.ok) throw new Error("Não foi possível carregar o saldo. Recarregue os dados para tentar novamente.");
      if (!usagesResponse.ok) throw new Error("Não foi possível carregar o histórico. Recarregue os dados para tentar novamente.");
      const [bank, usages] = await Promise.all([bankResponse.json(), usagesResponse.json()]);
      if (!controller.signal.aborted) setData({ bank, usages });
    } catch (loadError) {
      if (controller.signal.aborted) return;
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os dados. Verifique sua conexão e tente novamente.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => pendingRequest.current?.abort();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}

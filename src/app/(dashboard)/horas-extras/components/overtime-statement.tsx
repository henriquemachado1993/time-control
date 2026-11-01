"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconStopwatch, IconPlus } from "@tabler/icons-react";
import type { ExtraHoursAvailable, ExtraHoursUsage, OvertimeMovement as Movement, StatementFilters as Filters } from "../lib/types";
import { StatementFilters } from "./statement-filters";
import { StatementPagination } from "./statement-pagination";
import { OvertimeMovement } from "./overtime-movement";
type Props = {
  bank: ExtraHoursAvailable | null; usages: ExtraHoursUsage[]; loading: boolean; error: string;
  creationVersion: number; onCreate: () => void; onEdit: (usage: ExtraHoursUsage) => void; onDelete: (usage: ExtraHoursUsage) => void;
};
export function OvertimeStatement({ bank: horasExtrasDisponiveis, usages: usosHorasExtras, loading: dataLoading, error: dataError, creationVersion, onCreate, onEdit, onDelete: handleDeleteUso }: Props) {
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ description: "" });
  const [historyPage, setHistoryPage] = useState(1);
  const openUsoModal = (usage?: ExtraHoursUsage) => usage ? onEdit(usage) : onCreate();
  const movements = useMemo(() => {
    const earned: Movement[] = Object.entries(horasExtrasDisponiveis?.breakdown_by_date ?? {})
      .filter(([, hours]) => hours > 0)
      .map(([date, hours]) => ({ key: `earned-${date}`, date, kind: "earned", hours }));
    const used: Movement[] = usosHorasExtras.map((usage) => ({
      key: `used-${usage.id}`,
      date: usage.date,
      kind: "used",
      hours: usage.hours_used,
      usage,
    }));
    const query = appliedFilters.description.trim().toLocaleLowerCase("pt-BR");

    return [...earned, ...used]
      .filter((movement) => {
        if (appliedFilters.from && movement.date < appliedFilters.from) return false;
        if (appliedFilters.to && movement.date > appliedFilters.to) return false;
        if (!query) return true;
        return movement.kind === "used" && (movement.usage.description || "").toLocaleLowerCase("pt-BR").includes(query);
      })
      .sort((a, b) => {
        const dateOrder = b.date.localeCompare(a.date);
        if (dateOrder !== 0) return dateOrder;
        if (a.kind !== b.kind) return a.kind === "earned" ? -1 : 1;
        if (a.kind === "used" && b.kind === "used") {
          return b.usage.created_at.localeCompare(a.usage.created_at);
        }
        return 0;
      });
  }, [horasExtrasDisponiveis, usosHorasExtras, appliedFilters]);

  const MOVEMENTS_PER_PAGE = 10;
  const totalHistoryPages = Math.ceil(movements.length / MOVEMENTS_PER_PAGE);
  const pagedMovements = movements.slice((historyPage - 1) * MOVEMENTS_PER_PAGE, historyPage * MOVEMENTS_PER_PAGE);

  useEffect(() => { setHistoryPage(1); }, [creationVersion]);
  useEffect(() => { setHistoryPage(page => Math.min(page, Math.max(1, totalHistoryPages))); }, [totalHistoryPages]);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 leading-snug">
              <IconStopwatch className="size-5" aria-hidden="true" />
              Movimentações do banco de horas
            </CardTitle>
            <CardDescription>
              Veja em quais dias as horas extras foram geradas e quando foram utilizadas.
            </CardDescription>
          </div>
          <Button
            onClick={() => openUsoModal()}
            className="self-start"
            disabled={dataLoading || !!dataError || !horasExtrasDisponiveis || horasExtrasDisponiveis.available <= 0}
          >
            <IconPlus className="mr-2 size-4" aria-hidden="true" />
            Registrar uso
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <StatementFilters loading={dataLoading} onApply={(filters) => { setAppliedFilters(filters); setHistoryPage(1); }} />
        {appliedFilters.description && (
          <p className="mb-4 text-sm text-muted-foreground">
            A busca por descrição considera os registros de uso. Os totais acima continuam mostrando o saldo completo.
          </p>
        )}

        {dataLoading ? (
          <div className="space-y-3" aria-label="Carregando movimentações">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : dataError ? null : movements.length === 0 ? (
          <div className="py-8 text-center">
            <IconStopwatch className="mx-auto mb-4 size-12 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">
              {appliedFilters.from || appliedFilters.to || appliedFilters.description
                ? "Nenhuma movimentação corresponde a estes filtros."
                : "Ainda não há horas extras geradas ou utilizadas."}
            </p>
            {!appliedFilters.from && !appliedFilters.to && !appliedFilters.description && horasExtrasDisponiveis && horasExtrasDisponiveis.available > 0 && (
              <Button onClick={() => openUsoModal()} className="mt-4">
                <IconPlus className="mr-2 size-4" aria-hidden="true" />
                Registrar primeiro uso
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {pagedMovements.map(movement => <OvertimeMovement key={movement.key} movement={movement} onEdit={openUsoModal} onDelete={handleDeleteUso} />)}
          </div>
        )}

        {!dataLoading && !dataError && <StatementPagination page={historyPage} total={movements.length} pageSize={MOVEMENTS_PER_PAGE} onChange={setHistoryPage} />}
      </CardContent>
    </Card>
  );
}

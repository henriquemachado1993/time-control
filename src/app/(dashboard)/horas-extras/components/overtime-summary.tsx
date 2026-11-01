import { IconCashBanknote, IconTrendingUp, IconStopwatch } from "@tabler/icons-react";
import { formatHours } from "@/lib/hours";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExtraHoursAvailable } from "../lib/types";
export function OvertimeSummary({ bank: horasExtrasDisponiveis, loading: dataLoading }: { bank: ExtraHoursAvailable | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-busy={dataLoading}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Horas Disponíveis</CardTitle>
          <IconCashBanknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{dataLoading ? <Skeleton className="h-8 w-28" /> : horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.available) : "—"}</div>
          <p className="text-xs text-muted-foreground">
            Saldo atual de horas extras
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Horas Geradas</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{dataLoading ? <Skeleton className="h-8 w-28" /> : horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.total_generated) : "—"}</div>
          <p className="text-xs text-muted-foreground">
            Total acumulado de extras
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Horas Utilizadas</CardTitle>
          <IconStopwatch className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tabular-nums">{dataLoading ? <Skeleton className="h-8 w-28" /> : horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.total_used) : "—"}</div>
          <p className="text-xs text-muted-foreground">
            Total já utilizado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

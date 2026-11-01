import { formatHours } from "@/lib/hours";
import type { DashboardDays } from "../lib/types";
import { Skeleton } from "@/components/ui/skeleton";
type Props = { summary: DashboardDays; available: number; loading: boolean };
export function DashboardMetrics({ summary, available, loading }: Props) {
  const totalHours = summary.totalMinutes / 60;
  const totalDays = summary.completedDayCount;
  const metrics = [
    { label: "Total de Horas", value: formatHours(totalHours), description: "Horas trabalhadas no total" },
    { label: "Dias Trabalhados", value: totalDays.toString(), description: "Dias com registros" },
    { label: "Média Diária", value: formatHours(totalDays ? totalHours / totalDays : 0), description: "Média de horas por dia" },
    { label: "Horas Extras", value: formatHours(available ?? 0), description: "Saldo disponível" },
  ];
  return (
    <dl aria-label="Resumo de todos os registros" aria-busy={loading} className="grid grid-cols-2 gap-y-7 border-y py-7 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <div key={metric.label} className={`min-w-0 px-4 first:pl-0 sm:px-6 ${index % 2 === 1 ? "border-l" : index > 0 ? "lg:border-l" : ""}`}>
          <dt className="text-sm text-muted-foreground">{metric.label}</dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{loading ? <Skeleton className="h-9 w-28" /> : metric.value}</dd>
          <dd className="mt-1.5 text-xs text-muted-foreground">{metric.description}</dd>
        </div>
      ))}
    </dl>

  );
}

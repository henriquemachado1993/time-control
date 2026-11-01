import Link from "next/link";
import { IconArrowRight, IconStopwatch } from "@tabler/icons-react";
import { formatHours } from "@/lib/hours";
import type { ExtraHours } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export function DashboardBank({ bank, loading }: { bank: ExtraHours | undefined; loading: boolean }) {
  return (
    <aside className="space-y-5" aria-label="Banco de horas extras">
      <Card>
        <CardHeader className="gap-2"><h2 className="flex items-center gap-2 font-semibold"><IconStopwatch className="size-4 text-muted-foreground" aria-hidden="true" />Banco de horas</h2><p className="text-sm text-muted-foreground">Resumo de Horas Extras</p></CardHeader>
        <CardContent className="space-y-5">
          <dl className="space-y-4 text-sm">
            {[{ label: "Geradas", value: bank?.total_generated }, { label: "Utilizadas", value: bank?.total_used }, { label: "Disponíveis", value: bank?.available }].map((item, i) => <div key={item.label} className={`flex items-center justify-between gap-3 ${i === 2 ? "border-t pt-4 font-semibold" : "text-muted-foreground"}`}><dt>{item.label}</dt><dd className="tabular-nums">{loading ? <Skeleton className="h-5 w-20" /> : formatHours(item.value ?? 0)}</dd></div>)}
          </dl>
          <Button asChild variant="outline" className="h-10 w-full"><Link href="/horas-extras">Gerenciar horas extras<IconArrowRight aria-hidden="true" /></Link></Button>
        </CardContent>
      </Card>
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">Os totais consideram todos os seus registros. Consulte os filtros em Registros de Horas para encontrar um dia específico.</p>
    </aside>
  );
}

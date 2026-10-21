"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconArrowRight, IconCalendarWeek, IconClock, IconPlus, IconRefresh, IconStopwatch } from "@tabler/icons-react";
import { formatHours, workedHours } from "@/lib/hours";

type WorkHour = { id: string; date: string; start_time: string; end_time: string; description?: string };
type ExtraHours = { available: number; total_generated: number; total_used: number };
type DashboardData = { records: WorkHour[]; bank: ExtraHours };
const dateLabel = (date: string) => new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" });

export default function DashboardPage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [workResponse, bankResponse] = await Promise.all([fetch("/api/horarios"), fetch("/api/horas-extras/disponivel")]);
      if (!workResponse.ok || !bankResponse.ok) throw new Error("Falha ao carregar o painel");
      const [records, bank]: [WorkHour[], ExtraHours] = await Promise.all([workResponse.json(), bankResponse.json()]);
      setData({ records, bank });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated") void loadDashboard();
  }, [status, router, loadDashboard]);

  const records = data?.records ?? [];
  const totalHours = records.reduce((total, record) => total + workedHours(record.start_time, record.end_time), 0);
  const totalDays = new Set(records.map(record => record.date.slice(0, 10))).size;
  const recentDays = Array.from(new Set(records.map(record => record.date.slice(0, 10)))).sort((a, b) => b.localeCompare(a)).slice(0, 5);
  const metrics = [
    { label: "Total de Horas", value: formatHours(totalHours), description: "Horas trabalhadas no total" },
    { label: "Dias Trabalhados", value: totalDays.toString(), description: "Dias com registros" },
    { label: "Média Diária", value: formatHours(totalDays ? totalHours / totalDays : 0), description: "Média de horas por dia" },
    { label: "Horas Extras", value: formatHours(data?.bank.available ?? 0), description: "Saldo disponível" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Visão geral do seu controle de horas e produtividade</p>
        </div>
        <Button asChild className="h-10 self-start"><Link href="/horarios?novo=1"><IconPlus aria-hidden="true" />Novo Registro</Link></Button>
      </div>

      {error ? (
        <Alert variant="destructive" className="flex flex-wrap items-center justify-between gap-3">
          <AlertDescription>Não foi possível carregar o resumo. Tente novamente.</AlertDescription>
          <Button variant="outline" onClick={loadDashboard}><IconRefresh aria-hidden="true" />Tentar novamente</Button>
        </Alert>
      ) : (
        <>
          <dl aria-label="Resumo de todos os registros" aria-busy={loading} className="grid grid-cols-2 gap-y-7 border-y py-7 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={metric.label} className={`min-w-0 px-4 first:pl-0 sm:px-6 ${index % 2 === 1 ? "border-l" : index > 0 ? "lg:border-l" : ""}`}>
                <dt className="text-sm text-muted-foreground">{metric.label}</dt>
                <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{loading ? <Skeleton className="h-9 w-28" /> : metric.value}</dd>
                <dd className="mt-1.5 text-xs text-muted-foreground">{metric.description}</dd>
              </div>
            ))}
          </dl>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="min-w-0 gap-0 overflow-hidden">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-5">
                <div className="space-y-1.5"><h2 className="font-semibold">Registros recentes</h2><p className="text-sm text-muted-foreground">Seus últimos dias de trabalho</p></div>
                <Button asChild variant="ghost" size="sm"><Link href="/horarios">Ver todos<IconArrowRight aria-hidden="true" /></Link></Button>
              </CardHeader>
              <CardContent className="px-0">
                {loading ? <div className="space-y-4 px-6" aria-label="Carregando registros">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                  : recentDays.length ? (
                    <div className="divide-y border-t">
                      {recentDays.map(date => {
                        const dayRecords = records.filter(record => record.date.slice(0, 10) === date);
                        return <div key={date} className="flex items-center justify-between gap-3 px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <IconCalendarWeek className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                            <div className="min-w-0"><p className="text-sm font-medium capitalize">{dateLabel(date)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{dayRecords.length} {dayRecords.length === 1 ? "registro" : "registros"} · {dayRecords.map(record => `${record.start_time.slice(0, 5)}–${record.end_time.slice(0, 5)}`).join(" / ")}</p></div>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">{formatHours(dayRecords.reduce((total, record) => total + workedHours(record.start_time, record.end_time), 0))}</span>
                        </div>;
                      })}
                    </div>
                  ) : <div className="flex flex-col items-center px-6 py-12 text-center"><IconClock className="mb-4 size-8 text-muted-foreground" aria-hidden="true" /><h3 className="font-medium">Seu histórico começa aqui</h3><p className="mt-2 max-w-xs text-sm text-muted-foreground">Adicione sua entrada e saída para acompanhar as horas trabalhadas.</p><Button asChild variant="outline" className="mt-5"><Link href="/horarios?novo=1"><IconPlus aria-hidden="true" />Criar primeiro registro</Link></Button></div>}
              </CardContent>
            </Card>

            <aside className="space-y-5" aria-label="Banco de horas extras">
              <Card>
                <CardHeader className="gap-2"><h2 className="flex items-center gap-2 font-semibold"><IconStopwatch className="size-4 text-muted-foreground" aria-hidden="true" />Banco de horas</h2><p className="text-sm text-muted-foreground">Resumo de Horas Extras</p></CardHeader>
                <CardContent className="space-y-5">
                  <dl className="space-y-4 text-sm">
                    {[{ label: "Geradas", value: data?.bank.total_generated }, { label: "Utilizadas", value: data?.bank.total_used }, { label: "Disponíveis", value: data?.bank.available }].map((item, i) => <div key={item.label} className={`flex items-center justify-between gap-3 ${i === 2 ? "border-t pt-4 font-semibold" : "text-muted-foreground"}`}><dt>{item.label}</dt><dd className="tabular-nums">{loading ? <Skeleton className="h-5 w-20" /> : formatHours(item.value ?? 0)}</dd></div>)}
                  </dl>
                  <Button asChild variant="outline" className="h-10 w-full"><Link href="/horas-extras">Gerenciar horas extras<IconArrowRight aria-hidden="true" /></Link></Button>
                </CardContent>
              </Card>
              <p className="px-1 text-xs leading-relaxed text-muted-foreground">Os totais consideram todos os seus registros. Consulte os filtros em Registros de Horas para encontrar um dia específico.</p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

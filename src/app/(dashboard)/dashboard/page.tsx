"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Timer, BarChart3, TrendingUp, ArrowRight, Activity } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type User = any;
type DashboardStats = {
  totalWorkHours: number;
  totalWorkDays: number;
  averageHoursPerDay: number;
  extraHoursAvailable: number;
  extraHoursGenerated: number;
  extraHoursUsed: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  // Função para formatar horas em formato legível
  const formatHours = (hours: number) => {
    const totalMinutes = hours * 60;
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.round(totalMinutes % 60);
    return `${hoursPart}h ${minutesPart}min`;
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    } else {
      setUser(session.user);
      loadDashboardStats();
    }
  }, [session, status, router]);

  const loadDashboardStats = async () => {
    try {
      // Carregar estatísticas de horários
      const workHoursResponse = await fetch("/api/horarios");
      const workHours = workHoursResponse.ok ? await workHoursResponse.json() : [];

      // Carregar estatísticas de horas extras
      const extraHoursResponse = await fetch("/api/horas-extras/disponivel");
      const extraHoursStats = extraHoursResponse.ok ? await extraHoursResponse.json() : {
        available: 0,
        total_generated: 0,
        total_used: 0
      };

      // Calcular estatísticas básicas
      const totalWorkHours = workHours.reduce((total: number, hour: any) => {
        const start = new Date(`2000-01-01T${hour.start_time}`);
        const end = new Date(`2000-01-01T${hour.end_time}`);
        const workedMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return total + (workedMinutes / 60);
      }, 0);

      const uniqueDates = [...new Set(workHours.map((h: any) => h.date))];
      const totalWorkDays = uniqueDates.length;
      const averageHoursPerDay = totalWorkDays > 0 ? totalWorkHours / totalWorkDays : 0;

      setStats({
        totalWorkHours,
        totalWorkDays,
        averageHoursPerDay,
        extraHoursAvailable: extraHoursStats.available,
        extraHoursGenerated: extraHoursStats.total_generated,
        extraHoursUsed: extraHoursStats.total_used,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do seu controle de horas e produtividade
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? formatHours(stats.totalWorkHours) : "0h 0min"}</div>
              <p className="text-xs text-muted-foreground">
                Horas trabalhadas no total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dias Trabalhados</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalWorkDays || 0}</div>
              <p className="text-xs text-muted-foreground">
                Dias com registros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? formatHours(stats.averageHoursPerDay) : "0h 0min"}</div>
              <p className="text-xs text-muted-foreground">
                Média de horas por dia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Extras</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? formatHours(stats.extraHoursAvailable) : "0h 0min"}</div>
              <p className="text-xs text-muted-foreground">
                Saldo disponível
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seções de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Registros de Horas
              </CardTitle>
              <CardDescription>
                Gerencie seus horários de trabalho, adicione novos registros e visualize seu histórico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Total registrado</p>
                  <p className="text-2xl font-bold">{stats ? formatHours(stats.totalWorkHours) : "0h 0min"}</p>
                </div>
                <Link href="/horarios">
                  <Button className="gap-2">
                    Acessar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Horas Extras
              </CardTitle>
              <CardDescription>
                Controle e utilize suas horas extras acumuladas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Saldo disponível</p>
                  <p className="text-2xl font-bold">{stats ? formatHours(stats.extraHoursAvailable) : "0h 0min"}</p>
                </div>
                <Link href="/horas-extras">
                  <Button className="gap-2">
                    Acessar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Horas Extras */}
        {stats && (stats.extraHoursGenerated > 0 || stats.extraHoursUsed > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resumo de Horas Extras
              </CardTitle>
              <CardDescription>
                Visão geral do seu banco de horas extras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatHours(stats.extraHoursGenerated)}</p>
                  <p className="text-sm text-muted-foreground">Geradas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatHours(stats.extraHoursUsed)}</p>
                  <p className="text-sm text-muted-foreground">Utilizadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{formatHours(stats.extraHoursAvailable)}</p>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
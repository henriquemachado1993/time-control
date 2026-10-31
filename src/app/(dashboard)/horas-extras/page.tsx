"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { IconCashBanknote, IconStopwatch, IconTrendingUp, IconPlus, IconEdit, IconTrash, IconLoader2, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { formatHours, parseHoursInput } from "@/lib/hours";

/* eslint-disable @typescript-eslint/no-explicit-any */
type User = any;
type ExtraHoursAvailable = {
  total_generated: number;
  total_used: number;
  available: number;
  breakdown_by_date: { [key: string]: number };
};

type ExtraHoursUsage = {
  id: string;
  bank_id: string;
  date: string;
  hours_used: number;
  description?: string;
  created_at: string;
  bank: {
    id: string;
    total_hours: number;
    description: string;
    created_at: string;
    updated_at: string;
  };
};

type OvertimeMovement =
  | { key: string; date: string; kind: "earned"; hours: number }
  | { key: string; date: string; kind: "used"; hours: number; usage: ExtraHoursUsage };

function formatHoursAsClock(hours: number) {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

export default function HorasExtrasPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Estados das horas extras
  const [horasExtrasDisponiveis, setHorasExtrasDisponiveis] = useState<ExtraHoursAvailable | null>(null);
  const [usosHorasExtras, setUsosHorasExtras] = useState<ExtraHoursUsage[]>([]);
  const [showUsoModal, setShowUsoModal] = useState(false);
  const [editingUso, setEditingUso] = useState<ExtraHoursUsage | null>(null);
  const [usoData, setUsoData] = useState<Date | undefined>(new Date());
  const [usoHoras, setUsoHoras] = useState("");
  const [usoDescricao, setUsoDescricao] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ from?: string; to?: string; description: string }>({ description: "" });
  const [filterError, setFilterError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  // Estados da interface
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [dataError, setDataError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para exclusão de uso de horas extras
  const [confirmDeleteUsoOpen, setConfirmDeleteUsoOpen] = useState(false);
  const [usoToDelete, setUsoToDelete] = useState<ExtraHoursUsage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    } else {
      setUser(session.user);
      setLoading(false);
    }
  }, [session, status, router]);

  // Funções para horas extras
  const fetchHorasExtrasDisponiveis = async () => {
    try {
      const response = await fetch("/api/horas-extras/disponivel");
      if (response.ok) {
        const data = await response.json();
        setHorasExtrasDisponiveis(data);
      } else {
        setDataError("Não foi possível carregar o saldo. Recarregue os dados para tentar novamente.");
      }
    } catch (error) {
      console.error("Erro ao buscar horas extras disponíveis:", error);
      setDataError("Não foi possível carregar o saldo. Verifique sua conexão e tente novamente.");
    }
  };

  const fetchUsosHorasExtras = async () => {
    try {
      const response = await fetch("/api/horas-extras/uso");
      if (response.ok) {
        const data = await response.json();
        setUsosHorasExtras(data);
      } else {
        setDataError("Não foi possível carregar o histórico. Recarregue os dados para tentar novamente.");
      }
    } catch (error) {
      console.error("Erro ao buscar usos de horas extras:", error);
      setDataError("Não foi possível carregar o histórico. Verifique sua conexão e tente novamente.");
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchHorasExtrasDisponiveis(), fetchUsosHorasExtras()]).finally(() => setDataLoading(false));
    }
  }, [user]);

  const movements = useMemo(() => {
    const earned: OvertimeMovement[] = Object.entries(horasExtrasDisponiveis?.breakdown_by_date ?? {})
      .filter(([, hours]) => hours > 0)
      .map(([date, hours]) => ({ key: `earned-${date}`, date, kind: "earned", hours }));
    const used: OvertimeMovement[] = usosHorasExtras.map((usage) => ({
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
  const parsedUsageHours = usoHoras.trim() ? parseHoursInput(usoHoras) : null;
  const maxAllowedUsageHours = (horasExtrasDisponiveis?.available ?? 0) + (editingUso?.hours_used ?? 0);
  const projectedAvailableHours = parsedUsageHours === null
    ? null
    : Math.max(0, (horasExtrasDisponiveis?.available ?? 0) + (editingUso?.hours_used ?? 0) - parsedUsageHours);

  useEffect(() => {
    setHistoryPage((page) => Math.min(page, Math.max(1, totalHistoryPages)));
  }, [totalHistoryPages]);

  // Funções para modais de horas extras
  const openUsoModal = (uso?: ExtraHoursUsage) => {
    if (uso) {
      setEditingUso(uso);
      setUsoData(dayjs(uso.date).toDate());
      setUsoHoras(formatHoursAsClock(uso.hours_used));
      setUsoDescricao(uso.description || "");
    } else {
      setEditingUso(null);
      setUsoData(new Date());
      setUsoHoras("");
      setUsoDescricao("");
    }
    setShowUsoModal(true);
    setFormError("");
    setSuccess("");
  };

  const closeUsoModal = () => {
    setShowUsoModal(false);
    setEditingUso(null);
    setFormError("");
    setSuccess("");
  };

  // Submissão de formulários de horas extras
  const handleSubmitUso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    setSuccess("");

    const horasNum = parseHoursInput(usoHoras);
    if (horasNum === null || !Number.isFinite(horasNum) || horasNum <= 0) {
      setFormError("Horas utilizadas deve ser um valor positivo.");
      return;
    }

    const currentAvailable = horasExtrasDisponiveis?.available || 0;
    const maxAvailable = currentAvailable + (editingUso?.hours_used ?? 0);
    if (horasNum > maxAvailable) {
      setFormError(`Horas insuficientes. Você pode usar até ${formatHours(maxAvailable)} neste registro.`);
      return;
    }

    if (!usoData) {
      setFormError("Selecione a data do uso.");
      return;
    }

    setSaving(true);
    try {
      const url = editingUso ? `/api/horas-extras/uso/${editingUso.id}` : "/api/horas-extras/uso";
      const method = editingUso ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: usoData ? dayjs(usoData).format("YYYY-MM-DD") : null,
          hours_used: horasNum,
          description: usoDescricao || null,
        }),
      });

      if (response.ok) {
        closeUsoModal();
        setSuccess(editingUso ? "Uso atualizado." : "Uso registrado.");
        if (!editingUso) setHistoryPage(1);
        await Promise.all([fetchUsosHorasExtras(), fetchHorasExtrasDisponiveis()]);
      } else {
        const error = await response.json();
        setFormError(error.error || "Erro ao salvar uso");
      }
    } catch (_error) {
      setFormError("Erro ao salvar uso");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUso = (usage: ExtraHoursUsage) => {
    setUsoToDelete(usage);
    setDeleteError("");
    setConfirmDeleteUsoOpen(true);
  };

  const confirmDeleteUso = async () => {
    if (!usoToDelete || deleting) return false;

    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/horas-extras/uso/${usoToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        setDeleteError(error.error || "Não foi possível excluir este uso.");
        return false;
      }

      setSuccess("Uso excluído. O saldo foi atualizado.");
      await Promise.all([fetchUsosHorasExtras(), fetchHorasExtrasDisponiveis()]);
      setUsoToDelete(null);
      return true;
    } catch {
      setDeleteError("Não foi possível excluir este uso. Verifique sua conexão e tente novamente.");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const applyHistoryFilters = () => {
    const from = dateFrom ? dayjs(dateFrom).format("YYYY-MM-DD") : undefined;
    const to = dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : undefined;
    if (from && to && from > to) {
      setFilterError("A data inicial deve ser anterior à data final.");
      return;
    }

    setFilterError("");
    setAppliedFilters({ from, to, description: descriptionFilter.trim() });
    setHistoryPage(1);
  };

  const clearHistoryFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setDescriptionFilter("");
    setAppliedFilters({ description: "" });
    setFilterError("");
    setHistoryPage(1);
  };
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
      {dataError && <Alert variant="destructive" className="mb-6"><AlertDescription>{dataError}</AlertDescription><Button variant="outline" className="mt-3" disabled={dataLoading} onClick={async () => { setDataError(""); setDataLoading(true); await Promise.all([fetchHorasExtrasDisponiveis(), fetchUsosHorasExtras()]); setDataLoading(false); }}>Recarregar dados</Button></Alert>}
      {formError && !showUsoModal && <Alert variant="destructive" className="mb-6"><AlertDescription>{formError}</AlertDescription></Alert>}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] leading-10 font-semibold tracking-tight">Horas Extras</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Controle e gerenciamento das suas horas extras
            </p>
          </div>
        </div>

        {/* Cards de Resumo */}
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
            <div className="mb-5 grid grid-cols-1 gap-4 rounded-lg bg-muted/40 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_auto] xl:items-end">
              <DatePicker
                date={dateFrom}
                onDateChange={setDateFrom}
                label="De"
                placeholder="Data inicial"
              />
              <DatePicker
                date={dateTo}
                onDateChange={setDateTo}
                label="Até"
                placeholder="Data final"
              />
              <div className="space-y-2">
                <Label htmlFor="history-description">Descrição</Label>
                <Input
                  id="history-description"
                  type="search"
                  placeholder="Buscar nos usos registrados"
                  value={descriptionFilter}
                  onChange={(event) => setDescriptionFilter(event.target.value)}
                />
              </div>
              <div className="flex gap-2 xl:justify-end">
                <Button type="button" onClick={applyHistoryFilters} disabled={dataLoading}>Filtrar</Button>
                <Button type="button" variant="outline" onClick={clearHistoryFilters} disabled={dataLoading}>Limpar</Button>
              </div>
            </div>
            {filterError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{filterError}</AlertDescription>
              </Alert>
            )}
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
                {pagedMovements.map((movement) => {
                  const usage = movement.kind === "used" ? movement.usage : null;
                  const movementDate = dayjs(`${movement.date}T12:00`).format("DD/MM/YYYY");

                  return (
                    <div key={movement.key} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 rounded-full bg-muted p-2">
                          {movement.kind === "earned"
                            ? <IconTrendingUp className="size-4" aria-hidden="true" />
                            : <IconStopwatch className="size-4" aria-hidden="true" />}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium">
                            {movement.kind === "earned" ? "Horas geradas" : "Horas utilizadas"} em {movementDate}
                          </p>
                          {usage?.description && (
                            <p className="break-words text-sm text-muted-foreground">{usage.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">
                          {movement.kind === "earned" ? "+" : "−"}{formatHours(movement.hours)}
                        </span>
                        {usage && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 md:size-9"
                              onClick={() => openUsoModal(usage)}
                              aria-label={`Editar uso de ${formatHours(usage.hours_used)} em ${movementDate}`}
                            >
                              <IconEdit className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11 text-destructive hover:text-destructive md:size-9"
                              onClick={() => handleDeleteUso(usage)}
                              aria-label={`Excluir uso de ${formatHours(usage.hours_used)} em ${movementDate}`}
                            >
                              <IconTrash className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!dataLoading && !dataError && movements.length > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(historyPage - 1) * MOVEMENTS_PER_PAGE + 1}–{Math.min(historyPage * MOVEMENTS_PER_PAGE, movements.length)} de {movements.length} {movements.length === 1 ? "movimentação" : "movimentações"}
                </p>
                {totalHistoryPages > 1 && (
                  <nav aria-label="Paginação das movimentações" className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                      disabled={historyPage === 1}
                    >
                      <IconChevronLeft className="mr-1 size-4" aria-hidden="true" />
                      Anterior
                    </Button>
                    <span className="text-sm tabular-nums" aria-live="polite">Página {historyPage} de {totalHistoryPages}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                      disabled={historyPage === totalHistoryPages}
                    >
                      Próxima
                      <IconChevronRight className="ml-1 size-4" aria-hidden="true" />
                    </Button>
                  </nav>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Modal Uso de Horas Extras */}
      <Dialog open={showUsoModal} onOpenChange={setShowUsoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUso ? (
                <>
                  <IconEdit className="w-5 h-5" />
                  Editar Uso
                </>
              ) : (
                <>
                  <IconPlus className="w-5 h-5" />
                  Registrar Uso de Horas Extras
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingUso
                ? "Atualize as informações do uso de horas extras"
                : `Registre um novo uso. Você tem ${horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.available) : "0h 0min"} disponíveis.`
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitUso} className="space-y-4">
            <div className="space-y-2">
              <DatePicker
                date={usoData}
                onDateChange={setUsoData}
                label="Data do uso"
                placeholder="Selecionar data"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usoHoras">Horas utilizadas</Label>
              <Input
                id="usoHoras"
                type="text"
                inputMode="text"
                placeholder="4:30"
                value={usoHoras}
                onChange={(event) => setUsoHoras(event.target.value)}
                required
              />
              <div className="space-y-1 text-xs text-muted-foreground" aria-live="polite">
                <p>Formato principal: 4:30 (horas:minutos). Decimais aceitos: 4,5 ou 4.5.</p>
                <p>Máximo neste registro: {formatHours(maxAllowedUsageHours)}</p>
                {usoHoras && parsedUsageHours === null && (
                  <p className="text-destructive">Use horas e minutos (4:30) ou um decimal válido (4,5).</p>
                )}
                {parsedUsageHours !== null && parsedUsageHours > 0 && (
                  <>
                    <p className="font-medium text-foreground">Convertido: {formatHours(parsedUsageHours)}</p>
                    <p className="font-medium text-foreground">
                      Disponível após este uso: {formatHours(projectedAvailableHours ?? 0)}
                    </p>
                  </>
                )}
                {parsedUsageHours !== null && parsedUsageHours > maxAllowedUsageHours && (
                  <p className="text-destructive">O valor excede o saldo permitido para este registro.</p>
                )}
              </div>
            </div>            <div className="space-y-2">
              <Label htmlFor="usoDescricao">Descrição (opcional)</Label>
              <Textarea
                id="usoDescricao"
                rows={3}
                value={usoDescricao}
                onChange={(e) => setUsoDescricao(e.target.value)}
                placeholder="Ex: Saída antecipada, compensação de horas..."
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
              <Button type="submit" className="flex-1" disabled={saving || !!success || parsedUsageHours === null || parsedUsageHours <= 0 || parsedUsageHours > maxAllowedUsageHours}>
                {saving && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
                {saving ? "Salvando..." : editingUso ? "Atualizar" : "Registrar"}
              </Button>
              <Button type="button" variant="outline" onClick={closeUsoModal} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação para Exclusão de Uso de Horas Extras */}
      <ConfirmationDialog
        open={confirmDeleteUsoOpen}
        onOpenChange={(open) => {
          if (!open && deleting) return;
          setConfirmDeleteUsoOpen(open);
          if (open) setDeleteError("");
        }}
        title="Excluir Uso de Horas Extras"
        description={usoToDelete
          ? `Excluir o uso de ${formatHours(usoToDelete.hours_used)} em ${dayjs(`${usoToDelete.date}T12:00`).format("DD/MM/YYYY")}? Essa quantidade voltará ao saldo disponível.`
          : "As horas utilizadas serão devolvidas ao saldo disponível."}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteUso}
        isConfirming={deleting}
        error={deleteError}
      />
    </div>
  );
}

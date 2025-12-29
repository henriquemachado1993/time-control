"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Banknote, Timer, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";

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

  // Estados da interface
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  // Estados para exclusão de uso de horas extras
  const [confirmDeleteUsoOpen, setConfirmDeleteUsoOpen] = useState(false);
  const [usoToDelete, setUsoToDelete] = useState<string | null>(null);

  // Função para formatar horas em formato legível
  const formatHours = (hours: number) => {
    const totalMinutes = hours * 60;
    const hoursPart = Math.floor(totalMinutes / 60);
    const minutesPart = Math.round(totalMinutes % 60);
    return `${hoursPart}h ${minutesPart}min`;
  };

  // Função para converter horas:minutos para decimal
  const parseHoursInput = (input: string) => {
    // Se já é decimal, retorna como está
    if (input.includes('.')) {
      return parseFloat(input);
    }

    // Se tem formato h:mm ou h:m, converte
    if (input.includes(':')) {
      const [hours, minutes] = input.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return hours + (minutes / 60);
      }
    }

    // Caso contrário, trata como número decimal
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  };

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
      }
    } catch (error) {
      console.error("Erro ao buscar horas extras disponíveis:", error);
    }
  };

  const fetchUsosHorasExtras = async () => {
    try {
      const response = await fetch("/api/horas-extras/uso");
      if (response.ok) {
        const data = await response.json();
        setUsosHorasExtras(data);
      }
    } catch (error) {
      console.error("Erro ao buscar usos de horas extras:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHorasExtrasDisponiveis();
      fetchUsosHorasExtras();
    }
  }, [user]);

  // Funções para modais de horas extras
  const openUsoModal = (uso?: ExtraHoursUsage) => {
    if (uso) {
      setEditingUso(uso);
      setUsoData(dayjs(uso.date).toDate());
      setUsoHoras(uso.hours_used.toString());
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
    setFormError("");
    setSuccess("");

    const horasNum = parseHoursInput(usoHoras);
    if (!horasNum || horasNum <= 0) {
      setFormError("Horas utilizadas deve ser um valor positivo.");
      return;
    }

    const maxAvailable = horasExtrasDisponiveis?.available || 0;
    if (horasNum > maxAvailable) {
      setFormError(`Horas insuficientes. Você tem ${formatHours(maxAvailable)} disponíveis.`);
      return;
    }

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
        setSuccess(editingUso ? "Uso atualizado!" : "Uso registrado!");
        setTimeout(() => {
          closeUsoModal();
          fetchUsosHorasExtras();
          fetchHorasExtrasDisponiveis(); // Recarregar horas disponíveis
        }, 1000);
      } else {
        const error = await response.json();
        setFormError(error.error || "Erro ao salvar uso");
      }
    } catch (_error) {
      setFormError("Erro ao salvar uso");
    }
  };

  // Função para excluir uso de horas extras
  const handleDeleteUso = (usoId: string) => {
    setUsoToDelete(usoId);
    setConfirmDeleteUsoOpen(true);
  };

  const confirmDeleteUso = async () => {
    if (!usoToDelete) return;

    try {
      const response = await fetch(`/api/horas-extras/uso/${usoToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Uso de horas extras excluído com sucesso!");
        fetchUsosHorasExtras();
        fetchHorasExtrasDisponiveis();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const error = await response.json();
        setFormError(error.error || "Erro ao excluir uso");
      }
    } catch (error) {
      console.error("Erro ao excluir uso de horas extras:", error);
      setFormError("Erro ao excluir uso de horas extras");
    } finally {
      setUsoToDelete(null);
      setConfirmDeleteUsoOpen(false);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mensagens */}
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Horas Extras</h2>
            <p className="text-muted-foreground">
              Controle e gerenciamento das suas horas extras
            </p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Disponíveis</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.available) : "0h 0min"}</div>
              <p className="text-xs text-muted-foreground">
                Saldo atual de horas extras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Geradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.total_generated) : "0h 0min"}</div>
              <p className="text-xs text-muted-foreground">
                Total acumulado de extras
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Utilizadas</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.total_used) : "0h 0min"}</div>
              <p className="text-xs text-muted-foreground">
                Total já utilizado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Registro de Usos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Registro de Uso de Horas Extras
                </CardTitle>
                <CardDescription>
                  Registre quando utilizar suas horas extras acumuladas automaticamente
                </CardDescription>
              </div>
              <Button
                onClick={() => openUsoModal()}
                disabled={!horasExtrasDisponiveis || horasExtrasDisponiveis.available <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Uso
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usosHorasExtras.length === 0 ? (
              <div className="text-center py-8">
                <Timer className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {!horasExtrasDisponiveis || horasExtrasDisponiveis.available <= 0
                    ? "Você ainda não possui horas extras disponíveis"
                    : "Nenhum uso registrado ainda"
                  }
                </p>
                {horasExtrasDisponiveis && horasExtrasDisponiveis.available > 0 && (
                  <Button onClick={() => openUsoModal()} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Primeiro Uso
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {usosHorasExtras.slice(0, 10).map((uso) => (
                  <div key={uso.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {formatHours(uso.hours_used)} utilizadas em {dayjs(uso.date).format("DD/MM/YYYY")}
                      </p>
                      {/* <p className="text-sm text-muted-foreground">
                        Valor decimal: {uso.hours_used.toFixed(2)}h
                      </p> */}
                      {uso.description && (
                        <p className="text-sm text-muted-foreground">{uso.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUsoModal(uso)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUso(uso.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {usosHorasExtras.length > 10 && (
                  <p className="text-center text-muted-foreground">
                    Mostrando 10 registros mais recentes de {usosHorasExtras.length} total
                  </p>
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
                  <Edit className="w-5 h-5" />
                  Editar Uso
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
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
              <Label>Data do Uso</Label>
              <DatePicker
                date={usoData}
                onDateChange={setUsoData}
                placeholder="Selecionar data"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usoHoras">Horas Utilizadas</Label>
              <Input
                id="usoHoras"
                type="text"
                placeholder="4.65 ou 4:30"
                value={usoHoras}
                onChange={(e) => setUsoHoras(e.target.value)}
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Formatos aceitos: 4.65 (decimal) ou 4:30 (horas:minutos)</p>
                <p>Máximo disponível: {horasExtrasDisponiveis ? formatHours(horasExtrasDisponiveis.available) : "0h 0min"}</p>
                {usoHoras && parseHoursInput(usoHoras) > 0 && (
                  <p className="text-blue-600">
                    Convertido: {formatHours(parseHoursInput(usoHoras))}
                  </p>
                )}
                {usoHoras && parseHoursInput(usoHoras) > (horasExtrasDisponiveis?.available || 0) && (
                  <p className="text-red-600">
                    ⚠️ Valor excede o disponível!
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usoDescricao">Descrição (opcional)</Label>
              <Textarea
                id="usoDescricao"
                rows={3}
                value={usoDescricao}
                onChange={(e) => setUsoDescricao(e.target.value)}
                placeholder="Ex: Trabalhei no projeto X..."
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
              <Button type="submit" className="flex-1">
                {editingUso ? "Atualizar" : "Registrar"}
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
        onOpenChange={setConfirmDeleteUsoOpen}
        title="Excluir Uso de Horas Extras"
        description="Tem certeza que deseja excluir este registro de uso de horas extras? As horas utilizadas serão devolvidas ao seu saldo disponível."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteUso}
      />
    </div>
  );
}

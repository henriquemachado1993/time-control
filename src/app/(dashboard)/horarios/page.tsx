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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker, DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Calendar, Plus, Search, Edit, Trash2, Clock } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type User = any;
type WorkHour = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: string;
};

function calculateTotalHours(start: string, end: string) {
  if (!start || !end) return "-";
  const startTime = dayjs(`2000-01-01T${start}`);
  const endTime = dayjs(`2000-01-01T${end}`);
  let diff = endTime.diff(startTime, "minute");
  if (diff < 0) diff = 0;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}min`;
}

function groupByDate(workHours: WorkHour[]) {
  const groups: { [key: string]: WorkHour[] } = {};
  workHours.forEach(workHour => {
    const data = dayjs(workHour.date).format("YYYY-MM-DD");
    if (!groups[data]) {
      groups[data] = [];
    }
    groups[data].push(workHour);
  });
  return groups;
}

function calculateTotalDay(workHours: WorkHour[]) {
  const totalMinutes = workHours.reduce((total, h) => {
    const hours = calculateTotalHours(h.start_time, h.end_time);
    if (hours === "-") return total;
    const [h_str, m_str] = hours.split("h ");
    const h_num = parseInt(h_str) || 0;
    const m_num = parseInt(m_str.replace("min", "")) || 0;
    return total + h_num * 60 + m_num;
  }, 0);

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}min`;
}

export default function HorariosPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Estados do formulário
  const [showModal, setShowModal] = useState(false);
  const [editingHorario, setEditingHorario] = useState<WorkHour | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");

  // Estados da interface
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [horarios, setHorarios] = useState<WorkHour[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [searchDescription, setSearchDescription] = useState("");

  // Estados do diálogo de confirmação
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const DIAS_POR_PAGINA = 5;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    } else {
      setUser(session.user);
      setLoading(false);
    }
  }, [session, status, router]);

  const fetchHorarios = async (searchDateParam?: Date, searchDescriptionParam?: string) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchDateParam) params.append('date', dayjs(searchDateParam).format("YYYY-MM-DD"));
      if (searchDescriptionParam) params.append('description', searchDescriptionParam);

      const url = params.toString()
        ? `/api/horarios?${params.toString()}`
        : "/api/horarios";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHorarios(data);
        setCurrentPage(1); // Reset para primeira página quando buscar
      }
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    }
    setListLoading(false);
  };

  useEffect(() => {
    if (user) fetchHorarios();
  }, [user]);

  const openModal = (workHour?: WorkHour) => {
    if (workHour) {
      setEditingHorario(workHour);
      setDate(dayjs(workHour.date).toDate());
      setStart(workHour.start_time);
      setEnd(workHour.end_time);
      setDescription(workHour.description || "");
    } else {
      setEditingHorario(null);
      setDate(new Date());
      setStart("");
      setEnd("");
      setDescription("");
    }
    setShowModal(true);
    setFormError("");
    setSuccess("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHorario(null);
    setFormError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");

    if (!start || !end) {
      setFormError("Entrada e saída são obrigatórios.");
      return;
    }

    try {
      const url = editingHorario ? `/api/horarios/${editingHorario.id}` : "/api/horarios";
      const method = editingHorario ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date ? dayjs(date).format("YYYY-MM-DD") : null,
          start_time: start,
          end_time: end,
          description: description || null,
        }),
      });

      if (response.ok) {
        setSuccess(editingHorario ? "Horário atualizado!" : "Horário salvo!");
        setTimeout(() => {
          closeModal();
          fetchHorarios(searchDate, searchDescription);
        }, 1000);
      } else {
        const error = await response.json();
        setFormError(error.error || "Erro ao salvar horário");
      }
    } catch (_error) {
      setFormError("Erro ao salvar horário");
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/horarios/${itemToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Horário excluído com sucesso!");
        fetchHorarios(searchDate, searchDescription);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setFormError("Erro ao excluir horário");
      }
    } catch (_error) {
      setFormError("Erro ao excluir horário");
    } finally {
      setItemToDelete(null);
    }
  };

  const handleSearch = () => {
    fetchHorarios(searchDate, searchDescription);
  };

  const clearSearch = () => {
    setSearchDate(undefined);
    setSearchDescription("");
    fetchHorarios();
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

  const horariosAgrupados = groupByDate(horarios);
  const diasOrdenados = Object.entries(horariosAgrupados).sort(([a], [b]) => b.localeCompare(a));

  // Paginação
  const totalDias = diasOrdenados.length;
  const totalPaginas = Math.ceil(totalDias / DIAS_POR_PAGINA);
  const startIndex = (currentPage - 1) * DIAS_POR_PAGINA;
  const endIndex = startIndex + DIAS_POR_PAGINA;
  const diasPaginados = diasOrdenados.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mensagens */}
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Controles de busca */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Registros de Horas</h2>
            <p className="text-muted-foreground">
              Gerencie e visualize seus registros de trabalho
            </p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Registro
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre seus registros por data ou descrição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  date={searchDate}
                  onDateChange={setSearchDate}
                  label="Buscar por data"
                  placeholder="Selecionar data"
                  className="w-full"
                />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Buscar por descrição
                  </Label>
                  <Input
                    type="text"
                    placeholder="Digite parte da descrição..."
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={clearSearch}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de horários com paginação */}
      <div className="space-y-6">
        {listLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : diasPaginados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">Nenhum horário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {diasPaginados.map(([data, horariosData]) => (
              <Card key={data}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {dayjs(data).format("DD/MM/YYYY")} - {dayjs(data).format("dddd")}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-2">
                        <Clock className="w-4 h-4" />
                        Total do dia: <span className="font-semibold">{calculateTotalDay(horariosData)}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {horariosData.length} registro{horariosData.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden md:table-cell">Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {horariosData.map((horario) => (
                        <TableRow key={horario.id}>
                          <TableCell className="font-medium">{horario.start_time}</TableCell>
                          <TableCell className="font-medium">{horario.end_time}</TableCell>
                          <TableCell className="font-bold">
                            {calculateTotalHours(horario.start_time, horario.end_time)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate hidden md:table-cell">
                            {horario.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openModal(horario)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(horario.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={() => setCurrentPage(Math.min(totalPaginas, currentPage + 1))}
                  disabled={currentPage === totalPaginas}
                  variant="outline"
                  size="sm"
                >
                  Próxima
                </Button>
              </div>
            )}

            {/* Informações da paginação */}
            {totalDias > 0 && (
              <div className="text-center text-muted-foreground mt-4">
                Mostrando {startIndex + 1}-{Math.min(endIndex, totalDias)} de {totalDias} dias
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingHorario ? (
                <>
                  <Edit className="w-5 h-5" />
                  Editar Horário
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Novo Horário
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingHorario
                ? "Atualize as informações do horário selecionado"
                : "Adicione um novo registro de horário"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DateTimePicker
              date={date}
              time={start}
              onDateChange={setDate}
              onTimeChange={setStart}
              dateLabel="Data"
              timeLabel="Entrada"
              datePlaceholder="Selecionar data"
              timePlaceholder="00:00"
            />
            <div className="space-y-2">
              <Label htmlFor="end">Saída</Label>
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Reunião com cliente, desenvolvimento de feature..."
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
                {editingHorario ? "Atualizar" : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação Responsivo */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Excluir Horário"
        description="Tem certeza que deseja excluir este horário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}


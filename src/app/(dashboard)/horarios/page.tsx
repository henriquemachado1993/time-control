"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
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
import { DateTimePicker, DatePicker } from "@/components/ui/date-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Calendar, Plus, Search, Edit, Trash2, Clock, Loader2 } from "lucide-react";

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
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [saving, setSaving] = useState(false);
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
    setListError("");
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
      } else {
        setListError("Não foi possível carregar os registros. Tente buscar novamente.");
      }
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setListError("Não foi possível carregar os registros. Verifique sua conexão e tente novamente.");
    }
    setListLoading(false);
  };

  useEffect(() => {
    if (user) fetchHorarios();
  }, [user]);

  useEffect(() => {
    if (status === "authenticated" && new URLSearchParams(window.location.search).get("novo") === "1") {
      setShowModal(true);
      router.replace("/horarios", { scroll: false });
    }
  }, [status, router]);

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
    if (saving) return;
    setFormError("");
    setSuccess("");

    if (!date || !start || !end) {
      setFormError("Informe a data, a entrada e a saída.");
      return;
    }

    setSaving(true);
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
    } finally {
      setSaving(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Mensagens */}
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {listError && <Alert variant="destructive" className="mb-6"><AlertDescription>{listError}</AlertDescription></Alert>}
      {formError && !showModal && <Alert variant="destructive" className="mb-6"><AlertDescription>{formError}</AlertDescription></Alert>}

      {/* Controles de busca */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Registros de Horas</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Gerencie e visualize seus registros de trabalho
            </p>
          </div>
          <Button className="self-start" onClick={() => openModal()}>
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
            <form onSubmit={(event) => { event.preventDefault(); handleSearch(); }} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  date={searchDate}
                  onDateChange={setSearchDate}
                  label="Buscar por data"
                  placeholder="Selecionar data"
                  className="w-full"
                />
                <div className="space-y-2">
                  <Label htmlFor="search-description" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Buscar por descrição
                  </Label>
                  <Input
                    id="search-description"
                    type="text"
                    placeholder="Digite parte da descrição..."
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="submit" disabled={listLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button type="button" variant="outline" onClick={clearSearch} disabled={listLoading}>
                  Limpar
                </Button>
              </div>
            </form>
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
        ) : listError ? null : diasPaginados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="size-8 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="font-medium">Nenhum horário encontrado</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{searchDate || searchDescription ? "Experimente outra data ou descrição, ou limpe os filtros." : "Registre sua entrada e saída para começar a acompanhar sua jornada."}</p>
              <Button variant="outline" className="mt-5" onClick={searchDate || searchDescription ? clearSearch : () => openModal()}>{searchDate || searchDescription ? "Limpar filtros" : "Criar primeiro registro"}</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {diasPaginados.map(([data, horariosData]) => (
              <Card key={data}>
                <CardHeader>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {dayjs(data).format("DD/MM/YYYY")} · {dayjs(data).locale("pt-br").format("dddd")}
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
                          <TableCell className="font-medium tabular-nums">{horario.start_time.slice(0, 5)}</TableCell>
                          <TableCell className="font-medium tabular-nums">{horario.end_time.slice(0, 5)}</TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            {calculateTotalHours(horario.start_time, horario.end_time)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate hidden md:table-cell" title={horario.description}>
                            {horario.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openModal(horario)}
                                aria-label={`Editar registro de ${horario.start_time.slice(0, 5)} a ${horario.end_time.slice(0, 5)}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(horario.id)}
                                aria-label={`Excluir registro de ${horario.start_time.slice(0, 5)} a ${horario.end_time.slice(0, 5)}`}
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
              <nav aria-label="Paginação dos registros" className="flex flex-wrap items-center justify-center gap-2 py-4">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(page => Math.abs(page - currentPage) <= 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Página ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
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
              </nav>
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
              <Button type="submit" className="flex-1" disabled={saving || !!success}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {saving ? "Salvando..." : editingHorario ? "Atualizar" : "Salvar"}
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


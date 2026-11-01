"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconEdit, IconPlus, IconLoader2 } from "@tabler/icons-react";
import { formatHours, workedMinutes } from "@/lib/hours";
import { findOverlappingWorkIntervals, validateWorkInterval } from "@/lib/work-hours";
import type { WorkHour } from "../lib/types";

type Props = {
  record?: WorkHour;
  initialDate?: Date;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function WorkHourEditor({ record: editingHorario, initialDate, onClose, onSaved }: Props) {
  const [date, setDate] = useState<Date | undefined>(() => editingHorario ? dayjs(editingHorario.date).toDate() : initialDate ?? new Date());
  const [start, setStart] = useState(editingHorario?.start_time.slice(0, 5) ?? "");
  const [end, setEnd] = useState(editingHorario?.end_time?.slice(0, 5) ?? "");
  const [description, setDescription] = useState(editingHorario?.description ?? "");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dayIntervals, setDayIntervals] = useState<{ dateKey: string; records: WorkHour[]; loading: boolean; error?: string } | null>(null);
  const selectedDateKey = date ? dayjs(date).format("YYYY-MM-DD") : "";

  useEffect(() => {
    if (!selectedDateKey) return;

    const controller = new AbortController();
    setDayIntervals({ dateKey: selectedDateKey, records: [], loading: true });

    fetch(`/api/horarios?date=${selectedDateKey}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível conferir os períodos deste dia.");
        return response.json() as Promise<WorkHour[]>;
      })
      .then((records) => {
        setDayIntervals({ dateKey: selectedDateKey, records, loading: false });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setDayIntervals({
          dateKey: selectedDateKey,
          records: [],
          loading: false,
          error: "Não foi possível conferir os períodos deste dia.",
        });
      });

    return () => controller.abort();
  }, [selectedDateKey]);

  const selectedDayIntervals =
    dayIntervals?.dateKey === selectedDateKey ? dayIntervals.records : [];
  const intervalCheckLoading =
    !!selectedDateKey && (dayIntervals?.dateKey !== selectedDateKey || dayIntervals.loading);
  const intervalCheckError =
    dayIntervals?.dateKey === selectedDateKey ? dayIntervals.error : undefined;
  const intervalValidationMessage =
    date && start && end ? validateWorkInterval(selectedDateKey, start, end) : null;
  const overlappingIntervals =
    start && end && !intervalValidationMessage
      ? findOverlappingWorkIntervals(selectedDayIntervals, start, end, editingHorario?.id)
      : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");

    if (!date || !start || !end) {
      setFormError("Informe a data, a entrada e a saída.");
      return;
    }

    const dateValue = dayjs(date).format("YYYY-MM-DD");
    const validationError = validateWorkInterval(dateValue, start, end);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (dayIntervals?.dateKey !== dateValue || dayIntervals.loading) {
      setFormError("Aguarde a conferência dos outros períodos deste dia.");
      return;
    }
    if (dayIntervals.error) {
      setFormError(dayIntervals.error);
      return;
    }
    const overlaps = findOverlappingWorkIntervals(
      dayIntervals.records,
      start,
      end,
      editingHorario?.id,
    );
    if (overlaps.length > 0) {
      setFormError("Este período se sobrepõe a outro horário registrado neste dia.");
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
          date: dateValue,
          start_time: start,
          end_time: end,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || "Erro ao salvar horário.");
        return;
      }

      onSaved(editingHorario ? "Horário atualizado." : "Horário salvo.");
    } catch {
      setFormError("Não foi possível salvar o horário. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingHorario ? (
              <>
                <IconEdit className="w-5 h-5" />
                Editar Horário
              </>
            ) : (
              <>
                <IconPlus className="w-5 h-5" />
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
          <DatePicker
            date={date}
            onDateChange={setDate}
            label="Data"
            placeholder="Selecionar data"
          />
          <div className="grid grid-cols-2 gap-4">
            <TimePicker label="Entrada" value={start} onTimeChange={setStart} required />
            <TimePicker id="end" label="Saída" value={end} onTimeChange={setEnd} required />
          </div>
          {date && start && end && intervalValidationMessage && (
            <Alert variant="destructive">
              <AlertDescription>{intervalValidationMessage}</AlertDescription>
            </Alert>
          )}
          {date && start && end && !intervalValidationMessage && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium tabular-nums">Este período soma {formatHours(workedMinutes(start, end) / 60)}.</p>
              {intervalCheckLoading && <p className="text-muted-foreground">Conferindo os outros períodos deste dia…</p>}
              {intervalCheckError && <p role="alert" className="text-destructive">{intervalCheckError}</p>}
              {overlappingIntervals.map((interval) => (
                <p key={interval.id} role="alert" className="text-destructive">
                  Conflito com {interval.start_time.slice(0, 5)}–{interval.end_time?.slice(0, 5) ?? "em andamento"}. Ajuste os horários para não contar o mesmo tempo duas vezes.
                </p>
              ))}
            </div>
          )}
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
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || !date || !start || !end || !!intervalValidationMessage || intervalCheckLoading || !!intervalCheckError || overlappingIntervals.length > 0}
            >
              {saving && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
              {saving ? "Salvando..." : editingHorario ? "Atualizar" : "Salvar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

  );
}

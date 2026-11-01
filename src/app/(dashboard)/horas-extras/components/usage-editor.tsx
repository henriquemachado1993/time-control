"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconPlus, IconEdit, IconLoader2 } from "@tabler/icons-react";
import { formatHours, parseHoursInput } from "@/lib/hours";
import type { ExtraHoursUsage } from "../lib/types";
function formatHoursAsClock(hours: number) {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

type Props = { usage?: ExtraHoursUsage; available: number; onClose: () => void; onSaved: (message: string) => void };
export function UsageEditor({ usage: editingUso, available, onClose, onSaved }: Props) {
  const [usoData, setUsoData] = useState<Date | undefined>(() => editingUso ? dayjs(editingUso.date).toDate() : new Date());
  const [usoHoras, setUsoHoras] = useState(editingUso ? formatHoursAsClock(editingUso.hours_used) : "");
  const [usoDescricao, setUsoDescricao] = useState(editingUso?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const parsedUsageHours = usoHoras.trim() ? parseHoursInput(usoHoras) : null;
  const maxAllowedUsageHours = available + (editingUso?.hours_used ?? 0);
  const projectedAvailableHours = parsedUsageHours === null ? null : Math.max(0, maxAllowedUsageHours - parsedUsageHours);
  const handleSubmitUso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");

    const horasNum = parseHoursInput(usoHoras);
    if (horasNum === null || !Number.isFinite(horasNum) || horasNum <= 0) {
      setFormError("Horas utilizadas deve ser um valor positivo.");
      return;
    }

    const currentAvailable = available;
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
        onSaved(editingUso ? "Uso atualizado." : "Uso registrado.");
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

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
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
              : `Registre um novo uso. Você tem ${formatHours(available)} disponíveis.`
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
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={saving || parsedUsageHours === null || parsedUsageHours <= 0 || parsedUsageHours > maxAllowedUsageHours}>
              {saving && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
              {saving ? "Salvando..." : editingUso ? "Atualizar" : "Registrar"}
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

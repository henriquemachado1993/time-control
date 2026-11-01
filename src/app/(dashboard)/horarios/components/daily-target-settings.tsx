"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconClock, IconLoader2, IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { formatDailyTarget, parseDailyTarget } from "@/lib/hours";
function formatTargetInput(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function DailyTargetSettings({ onChanged }: { onChanged: (minutes: number) => void }) {
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(480);
  const [targetInput, setTargetInput] = useState("08:00");
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [targetLoading, setTargetLoading] = useState(true);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState("");
  const fetchDailyTarget = async () => {
    setTargetLoading(true);
    setTargetError("");

    try {
      const response = await fetch("/api/configuracoes/jornada");
      const result = await response.json();

      if (!response.ok || !Number.isInteger(result.dailyTargetMinutes)) {
        throw new Error(result.error || "Não foi possível carregar a jornada diária.");
      }

      setDailyTargetMinutes(result.dailyTargetMinutes);
      setTargetInput(formatTargetInput(result.dailyTargetMinutes));
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : "Não foi possível carregar a jornada diária.");
    } finally {
      setTargetLoading(false);
    }
  };

  const handleSaveDailyTarget = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTarget = parseDailyTarget(targetInput);
    if (parsedTarget === null) {
      setTargetError("Informe um horário entre 00:01 e 24:00, no formato HH:mm.");
      return;
    }

    setTargetSaving(true);
    setTargetError("");

    try {
      const response = await fetch("/api/configuracoes/jornada", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyTargetMinutes: parsedTarget }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Não foi possível salvar a jornada diária.");

      setDailyTargetMinutes(result.dailyTargetMinutes);
      setTargetInput(formatTargetInput(result.dailyTargetMinutes));
      setTargetDialogOpen(false);
    } catch (error) {
      setTargetError(error instanceof Error ? error.message : "Não foi possível salvar a jornada diária.");
    } finally {
      setTargetSaving(false);
    }
  };

  useEffect(() => { void fetchDailyTarget(); }, []);
  useEffect(() => { onChanged(dailyTargetMinutes); }, [dailyTargetMinutes, onChanged]);
  return (<>
    {targetError && !targetDialogOpen && <Alert variant="destructive"><AlertDescription>{targetError}<Button variant="outline" size="sm" className="ml-3" onClick={fetchDailyTarget} disabled={targetLoading}>Tentar novamente</Button></AlertDescription></Alert>}
    <Button variant="outline" className="self-start" onClick={() => { setTargetInput(formatTargetInput(dailyTargetMinutes)); setTargetError(""); setTargetDialogOpen(true); }} disabled={targetLoading}>
      <IconAdjustmentsHorizontal aria-hidden="true" />
      Jornada · {formatDailyTarget(dailyTargetMinutes)}
    </Button>
    <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><IconClock className="size-5" aria-hidden="true" />Configurar jornada diária</DialogTitle>
          <DialogDescription>Defina quantas horas você quer cumprir por dia. O padrão é 08:00.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveDailyTarget} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="daily-target">Horas e minutos</Label>
            <Input
              id="daily-target"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="08:00"
              pattern="(?:[01]?\d|2[0-3]):[0-5]\d|24:00"
              maxLength={5}
              value={targetInput}
              onChange={(event) => setTargetInput(event.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">Use o formato HH:mm, por exemplo 08:00 ou 07:30.</p>
            <p className="text-sm text-muted-foreground">Alterar a jornada também recalcula o saldo de horas extras do seu histórico.</p>
          </div>
          {targetError && <Alert variant="destructive"><AlertDescription>{targetError}</AlertDescription></Alert>}
          <div className="flex flex-col-reverse gap-2">
            <Button type="button" variant="ghost" onClick={() => { setTargetInput("08:00"); setTargetError(""); }} disabled={targetSaving || targetInput === "08:00"}>
              Restaurar padrão · 8h
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTargetDialogOpen(false)} disabled={targetSaving}>Cancelar</Button>
              <Button type="submit" disabled={targetSaving || targetLoading}>
                {targetSaving && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
                {targetSaving ? "Salvando…" : "Salvar jornada"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

  </>);
}

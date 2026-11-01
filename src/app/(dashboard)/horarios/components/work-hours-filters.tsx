"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { IconSearch } from "@tabler/icons-react";
import type { PeriodPreset } from "../lib/types";

type Props = {
  loading: boolean;
  onSearch: (date: Date | undefined, description: string, preset: PeriodPreset) => void;
};

export function WorkHoursFilters({ loading: listLoading, onSearch }: Props) {
  const [searchDate, setSearchDate] = useState<Date>();
  const [searchDescription, setSearchDescription] = useState("");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("all");
  const handleSearch = () => onSearch(searchDate, searchDescription, searchDate ? "custom" : periodPreset);
  const applyPeriodPreset = (preset: Exclude<PeriodPreset, "custom">) => {
    setSearchDate(undefined);
    setPeriodPreset(preset);
    onSearch(undefined, searchDescription, preset);
  };
  const clearSearch = () => {
    setSearchDate(undefined); setSearchDescription(""); setPeriodPreset("all");
    onSearch(undefined, "", "all");
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSearch className="w-5 h-5" />
          Filtros
        </CardTitle>
        <CardDescription>
          Combine um período rápido, uma data específica e uma busca por descrição.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium">Período rápido</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por período">
            {([
              ["today", "Hoje"],
              ["week", "Esta semana"],
              ["month", "Este mês"],
              ["all", "Todo período"],
            ] as const).map(([preset, label]) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                variant={periodPreset === preset ? "default" : "outline"}
                aria-pressed={periodPreset === preset}
                onClick={() => applyPeriodPreset(preset)}
                disabled={listLoading}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); handleSearch(); }} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              date={searchDate}
              onDateChange={(selectedDate) => {
                setSearchDate(selectedDate);
                setPeriodPreset(selectedDate ? "custom" : "all");
              }}
              label="Data específica"
              placeholder="Selecionar data"
              className="w-full"
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="search-description">
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
              <IconSearch className="w-4 h-4 mr-2" />
              Buscar
            </Button>
            <Button type="button" variant="outline" onClick={clearSearch} disabled={listLoading}>
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

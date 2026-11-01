"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { StatementFilters as Filters } from "../lib/types";
export function StatementFilters({ loading: dataLoading, onApply }: { loading: boolean; onApply: (filters: Filters) => void }) {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [filterError, setFilterError] = useState("");
  const applyHistoryFilters = () => {
    const from = dateFrom ? dayjs(dateFrom).format("YYYY-MM-DD") : undefined;
    const to = dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : undefined;
    if (from && to && from > to) {
      setFilterError("A data inicial deve ser anterior à data final.");
      return;
    }

    setFilterError("");
    onApply({ from, to, description: descriptionFilter.trim() });
  };

  const clearHistoryFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setDescriptionFilter("");
    onApply({ description: "" });
    setFilterError("");
  };
  return (<>
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
  </>);
}

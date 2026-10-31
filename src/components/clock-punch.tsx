"use client"

import * as React from "react"
import Link from "next/link"
import { IconClock, IconLogin2, IconLogout2 } from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type OpenWorkHour = {
  id: string
  date: string
  start_time: string
  end_time: null
}

type ClockPunchProps = {
  onRecordsChanged?: () => void
}

function getLocalDateTime() {
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  return { date, time }
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, month - 1, day, 12).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  })
}

export function ClockPunch({ onRecordsChanged }: ClockPunchProps) {
  const [openRecord, setOpenRecord] = React.useState<OpenWorkHour | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [statusReady, setStatusReady] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const loadOpenRecord = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/horarios/ponto", { cache: "no-store" })
      if (!response.ok) throw new Error("Não foi possível consultar o ponto em aberto.")
      setOpenRecord(await response.json() as OpenWorkHour | null)
      setStatusReady(true)
    } catch (loadError) {
      setStatusReady(false)
      setError(loadError instanceof Error ? loadError.message : "Não foi possível consultar o ponto em aberto.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOpenRecord()
  }, [loadOpenRecord])

  const today = getLocalDateTime().date
  const openFromAnotherDay = !!openRecord && openRecord.date !== today

  const handlePunch = async () => {
    if (saving || loading || !statusReady || openFromAnotherDay) return

    setSaving(true)
    setError("")
    try {
      const { date, time } = getLocalDateTime()
      const response = await fetch("/api/horarios/ponto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(openRecord
          ? { action: "saida", recordId: openRecord.id, date, time }
          : { action: "entrada", date, time }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Não foi possível registrar o ponto.")

      setOpenRecord(openRecord ? null : result as OpenWorkHour)
      onRecordsChanged?.()
    } catch (punchError) {
      await loadOpenRecord()
      setError(punchError instanceof Error ? punchError.message : "Não foi possível registrar o ponto.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <IconClock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="font-semibold">
              {openRecord ? "Jornada em andamento" : "Bater o ponto"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {loading
                ? "Consultando seu ponto..."
                : openFromAnotherDay
                  ? `Entrada de ${formatDate(openRecord.date)} às ${openRecord.start_time.slice(0, 5)}. Ajuste a saída na edição do registro antes de iniciar outro período.`
                  : openRecord
                    ? `Entrada registrada hoje às ${openRecord.start_time.slice(0, 5)}.`
                    : "Registre entrada e saída com a data e o horário atuais."}
            </p>
            {openFromAnotherDay && (
              <Button asChild variant="link" className="mt-1 h-auto p-0 text-sm">
                <Link href="/horarios">Abrir registros de horários</Link>
              </Button>
            )}
          </div>
        </div>
        <Button
          type="button"
          onClick={handlePunch}
          disabled={loading || saving || !statusReady || openFromAnotherDay}
          className="w-full shrink-0 sm:w-auto"
        >
          {openRecord
            ? <IconLogout2 aria-hidden="true" />
            : <IconLogin2 aria-hidden="true" />}
          {loading
            ? "Carregando..."
            : saving
              ? "Registrando..."
              : openRecord
                ? "Bater saída"
                : "Bater entrada"}
        </Button>
        {error && (
          <Alert variant="destructive" className="sm:col-span-2">
            <AlertDescription>
              {error}{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => void loadOpenRecord()}>
                Tentar novamente
              </button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

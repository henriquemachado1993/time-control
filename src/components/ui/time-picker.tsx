"use client"

import * as React from "react"
import { Timepicker } from "timepicker-ui-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface TimePickerProps {
  id?: string
  label: string
  value: string
  onTimeChange: (time: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

export function TimePicker({
  id,
  label,
  value,
  onTimeChange,
  disabled = false,
  required = false,
  className,
}: TimePickerProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={inputId}>
        {label}
      </Label>
      <Timepicker
        id={inputId}
        value={value}
        placeholder={label}
        options={{
          clock: {
            type: "24h",
            autoSwitchToMinutes: true,
          },
          labels: {
            clockTitle: `Selecionar ${label.toLowerCase()}`,
            ok: "Confirmar",
            cancel: "Cancelar",
          },
        }}
        onUpdate={(time) => {
          if (time.hour === undefined || time.minutes === undefined) return

          onTimeChange(
            `${time.hour.padStart(2, "0")}:${time.minutes.padStart(2, "0")}`
          )
        }}
        disabled={disabled}
        required={required}
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-input bg-field px-4 py-1 text-[13px] text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] duration-fast",
          "hover:border-stroke-hover focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)]"
        )}
      />
    </div>
  )
}

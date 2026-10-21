"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
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
      <Label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={inputId}
        type="time"
        value={value}
        onChange={(event) => onTimeChange(event.target.value)}
        disabled={disabled}
        required={required}
      />
    </div>
  )
}

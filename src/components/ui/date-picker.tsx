"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecionar data",
  label,
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const triggerId = React.useId()

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label htmlFor={triggerId} className="text-sm font-medium">{label}</Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            aria-label={label ? undefined : "Selecionar data"}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={ptBR}
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              onDateChange?.(selectedDate)
              setOpen(false)
            }}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

interface DateTimePickerProps {
  date?: Date
  time?: string
  onDateChange?: (date: Date | undefined) => void
  onTimeChange?: (time: string) => void
  dateLabel?: string
  timeLabel?: string
  datePlaceholder?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateLabel = "Data",
  timeLabel = "Hora",
  datePlaceholder = "Selecionar data",
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = React.useState(false)
  const dateId = React.useId()

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={dateId} className="text-sm font-medium">{dateLabel}</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              id={dateId}
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-between px-2 font-normal sm:px-3",
                !date && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : datePlaceholder}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              locale={ptBR}
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange?.(selectedDate)
                setDateOpen(false)
              }}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <TimePicker
        label={timeLabel}
        value={time ?? ""}
        onTimeChange={(selectedTime) => onTimeChange?.(selectedTime)}
        disabled={disabled}
        required
        className="w-full"
      />
    </div>
  )
}

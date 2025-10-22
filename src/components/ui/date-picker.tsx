"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
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
  timePlaceholder?: string
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
  timePlaceholder = "00:00",
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [dateOpen, setDateOpen] = React.useState(false)

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{dateLabel}</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-32 justify-between font-normal",
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
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{timeLabel}</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange?.(e.target.value)}
          placeholder={timePlaceholder}
          disabled={disabled}
          className="w-32"
        />
      </div>
    </div>
  )
}

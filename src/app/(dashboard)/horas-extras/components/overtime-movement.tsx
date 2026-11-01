import dayjs from "dayjs";
import { IconTrendingUp, IconStopwatch, IconEdit, IconTrash } from "@tabler/icons-react";
import { formatHours } from "@/lib/hours";
import { Button } from "@/components/ui/button";
import type { OvertimeMovement as Movement, ExtraHoursUsage } from "../lib/types";
type Props = { movement: Movement; onEdit: (usage: ExtraHoursUsage) => void; onDelete: (usage: ExtraHoursUsage) => void };
export function OvertimeMovement({ movement, onEdit: openUsoModal, onDelete: handleDeleteUso }: Props) {
  const usage = movement.kind === "used" ? movement.usage : null;
  const movementDate = dayjs(`${movement.date}T12:00`).format("DD/MM/YYYY");

  return (
    <div key={movement.key} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 rounded-full bg-muted p-2">
          {movement.kind === "earned"
            ? <IconTrendingUp className="size-4" aria-hidden="true" />
            : <IconStopwatch className="size-4" aria-hidden="true" />}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="font-medium">
            {movement.kind === "earned" ? "Horas geradas" : "Horas utilizadas"} em {movementDate}
          </p>
          {usage?.description && (
            <p className="break-words text-sm text-muted-foreground">{usage.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">
          {movement.kind === "earned" ? "+" : "−"}{formatHours(movement.hours)}
        </span>
        {usage && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 md:size-9"
              onClick={() => openUsoModal(usage)}
              aria-label={`Editar uso de ${formatHours(usage.hours_used)} em ${movementDate}`}
            >
              <IconEdit className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-destructive hover:text-destructive md:size-9"
              onClick={() => handleDeleteUso(usage)}
              aria-label={`Excluir uso de ${formatHours(usage.hours_used)} em ${movementDate}`}
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

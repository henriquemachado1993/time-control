"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatHours } from "@/lib/hours";
import type { ExtraHoursUsage } from "../lib/types";
type Props = { usage: ExtraHoursUsage; onClose: () => void; onDeleted: () => void };
export function DeleteUsage({ usage: usoToDelete, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const confirmDeleteUso = async () => {
    if (deleting) return false;

    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/horas-extras/uso/${usoToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        setDeleteError(error.error || "Não foi possível excluir este uso.");
        return false;
      }

      onDeleted();
      return true;
    } catch {
      setDeleteError("Não foi possível excluir este uso. Verifique sua conexão e tente novamente.");
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ConfirmationDialog
      open
      onOpenChange={(open) => {
        if (!open && deleting) return;
        if (!open) onClose();
      }}
      title="Excluir Uso de Horas Extras"
      description={usoToDelete
        ? `Excluir o uso de ${formatHours(usoToDelete.hours_used)} em ${dayjs(`${usoToDelete.date}T12:00`).format("DD/MM/YYYY")}? Essa quantidade voltará ao saldo disponível.`
        : "As horas utilizadas serão devolvidas ao saldo disponível."}
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="destructive"
      onConfirm={confirmDeleteUso}
      isConfirming={deleting}
      error={deleteError}
    />
  );
}

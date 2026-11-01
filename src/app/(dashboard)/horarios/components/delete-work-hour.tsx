"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { WorkHour } from "../lib/types";

export function DeleteWorkHour({ record: itemToDelete, onClose, onDeleted }: { record: WorkHour; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const confirmDelete = async () => {
    if (deleting) return false;

    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/horarios/${itemToDelete.id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        setDeleteError(error.error || "Não foi possível excluir este horário.");
        return false;
      }

      onDeleted();
      return true;
    } catch {
      setDeleteError("Não foi possível excluir este horário. Verifique sua conexão e tente novamente.");
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
      title="Excluir Horário"
      description={itemToDelete
        ? `Excluir o período de ${itemToDelete.start_time.slice(0, 5)} a ${itemToDelete.end_time?.slice(0, 5) ?? "em andamento"} em ${dayjs(`${itemToDelete.date}T12:00`).format("DD/MM/YYYY")}? O total do dia e o saldo de extras serão recalculados.`
        : "Esta ação não pode ser desfeita."}
      confirmText="Excluir"
      cancelText="Cancelar"
      variant="destructive"
      onConfirm={confirmDelete}
      isConfirming={deleting}
      error={deleteError}
    />
  );
}

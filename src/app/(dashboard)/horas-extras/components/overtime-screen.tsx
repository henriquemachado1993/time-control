"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOvertime } from "../hooks/use-overtime";
import type { ExtraHoursUsage } from "../lib/types";
import { DeleteUsage } from "./delete-usage";
import { OvertimeStatement } from "./overtime-statement";
import { OvertimeSummary } from "./overtime-summary";
import { UsageEditor } from "./usage-editor";

export function OvertimeScreen() {
  const { bank, usages, loading, error, refresh } = useOvertime();
  const [editor, setEditor] = useState<{ usage?: ExtraHoursUsage } | null>(null);
  const [deletingUsage, setDeletingUsage] = useState<ExtraHoursUsage | null>(null);
  const [success, setSuccess] = useState("");
  const [creationVersion, setCreationVersion] = useState(0);

  const openEditor = (usage?: ExtraHoursUsage) => {
    setSuccess("");
    setEditor({ usage });
  };
  const usageSaved = (message: string) => {
    if (!editor?.usage) setCreationVersion(version => version + 1);
    setEditor(null);
    setSuccess(message);
    void refresh();
  };
  const usageDeleted = () => {
    setDeletingUsage(null);
    setSuccess("Uso excluído. O saldo foi atualizado.");
    void refresh();
  };

  return (
    <div className="max-w-layout mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {success && <Alert className="mb-6"><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription><Button variant="outline" className="mt-3" disabled={loading} onClick={() => void refresh()}>Recarregar dados</Button></Alert>}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] leading-10 font-semibold tracking-tight">Horas Extras</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Controle e gerenciamento das suas horas extras</p>
          </div>
        </div>
        <OvertimeSummary bank={bank} loading={loading} />
        <OvertimeStatement bank={bank} usages={usages} loading={loading} error={error} creationVersion={creationVersion} onCreate={() => openEditor()} onEdit={openEditor} onDelete={setDeletingUsage} />
      </div>
      {editor && <UsageEditor usage={editor.usage} available={bank?.available ?? 0} onClose={() => setEditor(null)} onSaved={usageSaved} />}
      {deletingUsage && <DeleteUsage usage={deletingUsage} onClose={() => setDeletingUsage(null)} onDeleted={usageDeleted} />}
    </div>
  );
}

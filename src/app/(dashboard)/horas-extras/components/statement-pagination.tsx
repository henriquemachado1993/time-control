import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
type Props = { page: number; total: number; pageSize: number; onChange: (page: number) => void };
export function StatementPagination({ page: historyPage, total, pageSize: MOVEMENTS_PER_PAGE, onChange }: Props) {
  const totalHistoryPages = Math.ceil(total / MOVEMENTS_PER_PAGE);
  return (<>
    {total > 0 && (
      <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Mostrando {(historyPage - 1) * MOVEMENTS_PER_PAGE + 1}–{Math.min(historyPage * MOVEMENTS_PER_PAGE, total)} de {total} {total === 1 ? "movimentação" : "movimentações"}
        </p>
        {totalHistoryPages > 1 && (
          <nav aria-label="Paginação das movimentações" className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(Math.max(1, historyPage - 1))}
              disabled={historyPage === 1}
            >
              <IconChevronLeft className="mr-1 size-4" aria-hidden="true" />
              Anterior
            </Button>
            <span className="text-sm tabular-nums" aria-live="polite">Página {historyPage} de {totalHistoryPages}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(Math.min(totalHistoryPages, historyPage + 1))}
              disabled={historyPage === totalHistoryPages}
            >
              Próxima
              <IconChevronRight className="ml-1 size-4" aria-hidden="true" />
            </Button>
          </nav>
        )}
      </div>
    )}
  </>);
}

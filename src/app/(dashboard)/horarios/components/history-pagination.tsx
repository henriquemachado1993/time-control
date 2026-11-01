import { Button } from "@/components/ui/button";
type Props = { page: number; totalDays: number; pageSize: number; onChange: (page: number) => void };
export function HistoryPagination({ page: currentPage, totalDays: totalDias, pageSize, onChange: setCurrentPage }: Props) {
  const totalPaginas = Math.ceil(totalDias / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return (<>
    {totalPaginas > 1 && (
      <nav aria-label="Paginação dos registros" className="flex flex-wrap items-center justify-center gap-2 py-4">
        <Button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Anterior
        </Button>

        <div className="flex space-x-1">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(page => Math.abs(page - currentPage) <= 1).map((page) => (
            <Button
              key={page}
              onClick={() => setCurrentPage(page)}
              aria-label={`Página ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          onClick={() => setCurrentPage(Math.min(totalPaginas, currentPage + 1))}
          disabled={currentPage === totalPaginas}
          variant="outline"
          size="sm"
        >
          Próxima
        </Button>
      </nav>
    )}

    {/* Informações da paginação */}
    {totalDias > 0 && (
      <div className="text-center text-muted-foreground mt-4">
        Mostrando {startIndex + 1}-{Math.min(endIndex, totalDias)} de {totalDias} dia{totalDias !== 1 ? "s" : ""}
      </div>
    )}
  </>);
}

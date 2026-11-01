import { Skeleton } from "@/components/ui/skeleton";

export function SessionLoading() {
  return (
    <div role="status" aria-label="Carregando" className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4" aria-hidden="true">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

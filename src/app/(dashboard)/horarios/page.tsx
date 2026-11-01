"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkHoursHistory } from "./components/work-hours-history";

function LoadingHours() {

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function HorariosPage() {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);
  if (status !== "authenticated") return <LoadingHours />;
  return <Suspense fallback={<LoadingHours />}><WorkHoursHistory /></Suspense>;
}

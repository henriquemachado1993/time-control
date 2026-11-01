import { Navigation } from "@/components/navigation";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SessionGuard } from "./components/session-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  return (
    <SessionGuard>
      <div className="min-h-screen w-full bg-app">
        <Navigation />
        <main id="conteudo" tabIndex={-1} className="min-h-[calc(100dvh-4.5rem)] outline-none">{children}</main>
      </div>
    </SessionGuard>
  );
}


import { Navigation } from "@/components/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-app">
      <Navigation />
      <main id="conteudo" tabIndex={-1} className="min-h-[calc(100dvh-4.5rem)] outline-none">{children}</main>
    </div>
  );
}


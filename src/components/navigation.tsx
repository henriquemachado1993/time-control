"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Clock, LogOut, LayoutDashboard, CalendarDays, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", mobileTitle: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Registros de Horas", mobileTitle: "Registros", href: "/horarios", icon: CalendarDays },
  { title: "Horas Extras", mobileTitle: "Horas Extras", href: "/horas-extras", icon: Timer },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayName = session?.user?.name || session?.user?.email || "Minha conta";
  const initials = displayName.split(/[\s@]+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Pular para o conteúdo</a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-2 px-4 sm:gap-x-6 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link href="/dashboard" className="flex h-16 shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-18 sm:gap-3" aria-label="Controle de Horas — Dashboard">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Clock className="size-5" aria-hidden="true" /></span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">Controle de Horas</span>
        </Link>
        <nav aria-label="Navegação principal" className="order-3 -mb-px flex w-full items-stretch sm:gap-2 lg:order-none lg:ml-4 lg:h-18 lg:w-auto lg:flex-1 lg:gap-5">
          {navigationItems.map(({ title, mobileTitle, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 flex-1 items-center justify-center gap-1 whitespace-nowrap border-b-2 border-transparent px-1 text-xs font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-2 sm:px-2 sm:text-sm lg:flex-none", active ? "border-primary text-foreground" : "text-muted-foreground")}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="sm:hidden">{mobileTitle}</span><span className="hidden sm:inline">{title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          {session && <>
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Abrir menu da conta">
                  <Avatar className="size-9"><AvatarFallback className="bg-secondary text-xs font-semibold">{initials}</AvatarFallback></Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel className="break-all">{displayName}</DropdownMenuLabel>
                {session.user?.name && <p className="px-2 pb-2 text-xs text-muted-foreground break-all">{session.user.email}</p>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}><LogOut className="size-4" />Sair da conta</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>}
        </div>
      </div>
    </header>
  );
}

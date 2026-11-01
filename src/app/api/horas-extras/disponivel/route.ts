import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOvertime } from "@/lib/overtime";

// GET - Calcular horas extras disponíveis automaticamente
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Buscar todos os horários do usuário
    const workHours = await prisma.work_hours.findMany({
      where: { user_id: user.id, end_time: { not: null } },
      orderBy: { date: "asc" },
    });

    const usedHours = await prisma.extra_hours_usage.aggregate({
      where: { user_id: user.id },
      _sum: { hours_used: true }
    });

    const bank = calculateOvertime(workHours, user.dailyTargetMinutes, usedHours._sum.hours_used ?? 0);
    return NextResponse.json(bank);

  } catch (error) {
    console.error("Erro ao calcular horas extras disponíveis:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

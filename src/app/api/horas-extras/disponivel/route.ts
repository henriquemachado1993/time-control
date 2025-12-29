import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Calcular horas extras disponíveis automaticamente
export async function GET(request: NextRequest) {
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
      where: { user_id: user.id },
      orderBy: { date: "asc" },
    });

    // Calcular horas trabalhadas por dia (agrupar sessões)
    const workedHoursByDate: { [key: string]: number } = {};

    workHours.forEach(hour => {
      const start = new Date(`2000-01-01T${hour.start_time}`);
      const end = new Date(`2000-01-01T${hour.end_time}`);
      const workedMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      const workedHours = workedMinutes / 60;

      if (!workedHoursByDate[hour.date]) {
        workedHoursByDate[hour.date] = 0;
      }
      workedHoursByDate[hour.date] += workedHours;
    });

    // Calcular horas extras baseadas no total diário
    const extraHoursByDate: { [key: string]: number } = {};

    for (const [date, totalWorkedHours] of Object.entries(workedHoursByDate)) {
      // Considerando 8 horas como jornada padrão
      const standardHours = 8;
      const extraHours = Math.max(0, totalWorkedHours - standardHours);

      if (extraHours > 0) {
        extraHoursByDate[date] = extraHours;
      }
    }

    // Calcular total de horas extras geradas
    const totalExtraHoursGenerated = Object.values(extraHoursByDate).reduce((sum, hours) => sum + hours, 0);

    // Calcular horas extras já utilizadas
    const usedHours = await prisma.extra_hours_usage.aggregate({
      where: { user_id: user.id },
      _sum: { hours_used: true }
    });

    const totalUsedHours = usedHours._sum.hours_used || 0;
    const availableHours = totalExtraHoursGenerated - totalUsedHours;

    return NextResponse.json({
      total_generated: totalExtraHoursGenerated,
      total_used: totalUsedHours,
      available: Math.max(0, availableHours),
      breakdown_by_date: extraHoursByDate
    });

  } catch (error) {
    console.error("Erro ao calcular horas extras disponíveis:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

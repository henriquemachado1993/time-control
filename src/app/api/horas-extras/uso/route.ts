import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tipo para a cláusula where da busca
interface WhereClause {
  user_id: string;
  date?: string;
  description?: {
    contains: string;
    mode: 'insensitive';
  };
}

// GET - Listar usos de horas extras do usuário com busca opcional
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

    const { searchParams } = new URL(request.url);
    const searchDate = searchParams.get('date');
    const searchDescription = searchParams.get('description');

    const whereClause: WhereClause = { user_id: user.id };

    if (searchDate) {
      whereClause.date = searchDate;
    }

    if (searchDescription) {
      whereClause.description = {
        contains: searchDescription,
        mode: 'insensitive' // Busca case-insensitive
      };
    }

    const usos = await prisma.extra_hours_usage.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    // Retornar usos com informações de banco "automático"
    const usosComBanco = usos.map(uso => ({
      ...uso,
      bank: {
        id: "auto-calculated",
        total_hours: 0, // Será calculado dinamicamente
        description: "Horas extras calculadas automaticamente",
        created_at: uso.created_at,
        updated_at: uso.created_at
      }
    }));

    return NextResponse.json(usosComBanco);
  } catch (error) {
    console.error("Erro ao buscar usos de horas extras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Registrar uso de horas extras
export async function POST(request: NextRequest) {
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

    const { date, hours_used, description } = await request.json();

    if (!date || !hours_used || typeof hours_used !== 'number') {
      return NextResponse.json({
        error: "Data e horas utilizadas são obrigatórios. Horas devem ser um número"
      }, { status: 400 });
    }

    // Calcular horas extras disponíveis automaticamente
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
      const standardHours = 8;
      const extraHours = Math.max(0, totalWorkedHours - standardHours);

      if (extraHours > 0) {
        extraHoursByDate[date] = extraHours;
      }
    }

    const totalExtraHoursGenerated = Object.values(extraHoursByDate).reduce((sum, hours) => sum + hours, 0);

    // Calcular horas extras já utilizadas
    const usedHours = await prisma.extra_hours_usage.aggregate({
      where: { user_id: user.id },
      _sum: { hours_used: true }
    });

    const totalUsedHours = usedHours._sum.hours_used || 0;
    const availableHours = totalExtraHoursGenerated - totalUsedHours;

    if (hours_used > availableHours) {
      return NextResponse.json({
        error: `Horas insuficientes. Você tem ${availableHours.toFixed(2)}h disponíveis`
      }, { status: 400 });
    }

    const uso = await prisma.extra_hours_usage.create({
      data: {
        user_id: user.id,
        bank_id: "auto-calculated", // Valor fixo para manter compatibilidade
        date,
        hours_used,
        description: description || null,
      }
    });

    // Retornar uso sem informações de banco específico
    const usoComBanco = {
      ...uso,
      bank: {
        id: "auto-calculated",
        total_hours: availableHours + hours_used, // Horas totais antes do uso
        description: "Horas extras calculadas automaticamente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    return NextResponse.json(usoComBanco, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar uso de horas extras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

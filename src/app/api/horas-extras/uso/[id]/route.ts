import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar uso de horas extras
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    if (!date || !hours_used || typeof hours_used !== 'number') {
      return NextResponse.json({
        error: "Data e horas utilizadas são obrigatórios. Horas devem ser um número"
      }, { status: 400 });
    }

    // Verificar se o uso de horas extras pertence ao usuário
    const existingUsage = await prisma.extra_hours_usage.findFirst({
      where: { id, user_id: user.id }
    });

    if (!existingUsage) {
      return NextResponse.json({ error: "Uso de horas extras não encontrado" }, { status: 404 });
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

    // Calcular horas extras já utilizadas (excluindo o registro atual)
    const usedHours = await prisma.extra_hours_usage.aggregate({
      where: {
        user_id: user.id,
        id: { not: id } // Excluir o registro atual da soma
      },
      _sum: { hours_used: true }
    });

    const totalUsedHours = usedHours._sum.hours_used || 0;
    const availableHours = totalExtraHoursGenerated - totalUsedHours;

    if (hours_used > availableHours) {
      return NextResponse.json({
        error: `Horas insuficientes. Você tem ${availableHours.toFixed(2)}h disponíveis`
      }, { status: 400 });
    }

    const uso = await prisma.extra_hours_usage.update({
      where: { id },
      data: {
        bank_id: "auto-calculated", // Manter compatibilidade
        date,
        hours_used,
        description: description || null,
      }
    });

    // Retornar uso com informações de banco "automático"
    const usoComBanco = {
      ...uso,
      bank: {
        id: "auto-calculated",
        total_hours: availableHours + hours_used, // Horas totais antes da edição
        description: "Horas extras calculadas automaticamente",
        created_at: uso.created_at,
        updated_at: uso.created_at
      }
    };

    return NextResponse.json(usoComBanco);
  } catch (error) {
    console.error("Erro ao atualizar uso de horas extras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Excluir uso de horas extras
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verificar se o uso de horas extras pertence ao usuário
    const existingUsage = await prisma.extra_hours_usage.findFirst({
      where: { id, user_id: user.id }
    });

    if (!existingUsage) {
      return NextResponse.json({ error: "Uso de horas extras não encontrado" }, { status: 404 });
    }

    await prisma.extra_hours_usage.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Uso de horas extras excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir uso de horas extras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

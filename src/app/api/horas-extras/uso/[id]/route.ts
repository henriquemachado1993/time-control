import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOvertime } from "@/lib/overtime";

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

    if (!date || typeof hours_used !== 'number' || !Number.isFinite(hours_used) || hours_used <= 0) {
      return NextResponse.json({
        error: "Informe a data e uma quantidade positiva de horas"
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
      where: { user_id: user.id, end_time: { not: null } },
      orderBy: { date: "asc" },
    });

    const usedHours = await prisma.extra_hours_usage.aggregate({
      where: {
        user_id: user.id,
        id: { not: id } // Excluir o registro atual da soma
      },
      _sum: { hours_used: true }
    });

    const bank = calculateOvertime(workHours, user.dailyTargetMinutes, usedHours._sum.hours_used ?? 0);
    const availableHours = bank.available;

    const maxAllowedHours = Math.max(availableHours, existingUsage.hours_used);
    if (hours_used > maxAllowedHours) {
      return NextResponse.json({
        error: `Horas insuficientes. Você pode manter até ${maxAllowedHours.toFixed(2)}h neste registro`
      }, { status: 400 });
    }

    const uso = await prisma.extra_hours_usage.update({
      where: { id, user_id: user.id },
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
      where: { id, user_id: user.id },
    });

    return NextResponse.json({ message: "Uso de horas extras excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir uso de horas extras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOverlappingWorkIntervals, validateWorkInterval } from "@/lib/work-hours";

// PUT - Atualizar horário
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

    const { date, start_time, end_time, description } = await request.json();
    const { id } = await params;

    const validationError = validateWorkInterval(date, start_time, end_time);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Verificar se o horário pertence ao usuário
    const existingHorario = await prisma.work_hours.findFirst({
      where: { id, user_id: user.id }
    });

    if (!existingHorario) {
      return NextResponse.json({ error: "Horário não encontrado" }, { status: 404 });
    }

    const existingIntervals = await prisma.work_hours.findMany({
      where: { user_id: user.id, date },
    });
    const overlaps = findOverlappingWorkIntervals(existingIntervals, start_time, end_time, id);
    if (overlaps.length > 0) {
      return NextResponse.json({ error: "Este período se sobrepõe a outro horário registrado neste dia." }, { status: 409 });
    }

    const horario = await prisma.work_hours.update({
      where: { id, user_id: user.id },
      data: {
        date,
        start_time,
        end_time,
        description: description || null,
      },
    });

    return NextResponse.json(horario);
  } catch (error) {
    console.error("Erro ao atualizar horário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE - Excluir horário
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

    // Verificar se o horário pertence ao usuário
    const existingHorario = await prisma.work_hours.findFirst({
      where: { id, user_id: user.id }
    });

    if (!existingHorario) {
      return NextResponse.json({ error: "Horário não encontrado" }, { status: 404 });
    }

    await prisma.work_hours.delete({
      where: { id, user_id: user.id },
    });

    return NextResponse.json({ message: "Horário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir horário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

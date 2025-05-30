import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar horário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (!date || !start_time || !end_time) {
      return NextResponse.json({ error: "Data, entrada e saída são obrigatórios" }, { status: 400 });
    }

    // Verificar se o horário pertence ao usuário
    const existingHorario = await prisma.work_hours.findFirst({
      where: { id: params.id, user_id: user.id }
    });

    if (!existingHorario) {
      return NextResponse.json({ error: "Horário não encontrado" }, { status: 404 });
    }

    const horario = await prisma.work_hours.update({
      where: { id: params.id },
      data: {
        date: new Date(date),
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
  { params }: { params: { id: string } }
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

    // Verificar se o horário pertence ao usuário
    const existingHorario = await prisma.work_hours.findFirst({
      where: { id: params.id, user_id: user.id }
    });

    if (!existingHorario) {
      return NextResponse.json({ error: "Horário não encontrado" }, { status: 404 });
    }

    await prisma.work_hours.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Horário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir horário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
} 
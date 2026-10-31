import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOverlappingWorkIntervals, isValidWorkDate, validateWorkInterval } from "@/lib/work-hours";

// Tipo para a cláusula where da busca
type WhereClause = {
  user_id: string;
  date?: string | { gte?: string; lte?: string };
  description?: {
    contains: string;
    mode: 'insensitive';
  };
};

// GET - Listar horários do usuário com busca opcional por data
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
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const searchDescription = searchParams.get('description');

    const whereClause: WhereClause = { user_id: user.id };

    if (searchDate) {
      if (!isValidWorkDate(searchDate)) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
      }
      whereClause.date = searchDate;
    } else if (dateFrom || dateTo) {
      if ((dateFrom && !isValidWorkDate(dateFrom)) || (dateTo && !isValidWorkDate(dateTo))) {
        return NextResponse.json({ error: "Período inválido" }, { status: 400 });
      }
      if (dateFrom && dateTo && dateFrom > dateTo) {
        return NextResponse.json({ error: "A data inicial deve ser anterior à data final" }, { status: 400 });
      }
      whereClause.date = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      };
    }

    if (searchDescription) {
      whereClause.description = {
        contains: searchDescription,
        mode: 'insensitive' // Busca case-insensitive
      };
    }

    const horarios = await prisma.work_hours.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(horarios);
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Criar novo horário
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

    const { date, start_time, end_time, description } = await request.json();

    const validationError = validateWorkInterval(date, start_time, end_time);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existingIntervals = await prisma.work_hours.findMany({
      where: { user_id: user.id, date },
    });
    const overlaps = findOverlappingWorkIntervals(existingIntervals, start_time, end_time);
    if (overlaps.length > 0) {
      return NextResponse.json({ error: "Este período se sobrepõe a outro horário registrado neste dia." }, { status: 409 });
    }

    const horario = await prisma.work_hours.create({
      data: {
        user_id: user.id,
        date,
        start_time,
        end_time,
        description: description || null,
      },
    });

    return NextResponse.json(horario, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar horário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

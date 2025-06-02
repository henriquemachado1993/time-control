import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tipo para a cláusula where da busca
type WhereClause = {
  user_id: string;
  date?: Date;
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
    const searchDescription = searchParams.get('description');

    const whereClause: WhereClause = { user_id: user.id };
    
    if (searchDate) {
      whereClause.date = new Date(searchDate);
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

    if (!date || !start_time || !end_time) {
      return NextResponse.json({ error: "Data, entrada e saída são obrigatórios" }, { status: 400 });
    }

    const horario = await prisma.work_hours.create({
      data: {
        user_id: user.id,
        date: new Date(date),
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
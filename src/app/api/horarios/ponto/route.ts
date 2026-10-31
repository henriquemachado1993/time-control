import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findOverlappingWorkIntervals,
  findWorkIntervalsAtTime,
  isValidWorkDate,
  isValidWorkTime,
  validateWorkInterval,
} from "@/lib/work-hours";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const openRecord = await prisma.work_hours.findFirst({
      where: { user_id: user.id, end_time: null },
    });

    return NextResponse.json(openRecord);
  } catch (error) {
    console.error("Erro ao consultar ponto em aberto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { action, date, time, recordId } = body as {
      action?: unknown;
      date?: unknown;
      time?: unknown;
      recordId?: unknown;
    };

    if (!isValidWorkDate(date) || !isValidWorkTime(time)) {
      return NextResponse.json({ error: "Informe uma data e um horário válidos." }, { status: 400 });
    }

    if (action === "entrada") {
      const openRecord = await prisma.work_hours.findFirst({
        where: { user_id: user.id, end_time: null },
      });
      if (openRecord) {
        return NextResponse.json(
          { error: "Já existe um período em aberto. Registre a saída antes de iniciar outro." },
          { status: 409 },
        );
      }

      const sameDayRecords = await prisma.work_hours.findMany({
        where: { user_id: user.id, date },
        select: { id: true, start_time: true, end_time: true },
      });
      if (findWorkIntervalsAtTime(sameDayRecords, time).length > 0) {
        return NextResponse.json(
          { error: "Este horário coincide com outro período registrado neste dia." },
          { status: 409 },
        );
      }

      const record = await prisma.work_hours.create({
        data: {
          user_id: user.id,
          date,
          start_time: time,
          end_time: null,
        },
      });

      return NextResponse.json(record, { status: 201 });
    }

    if (action === "saida" && typeof recordId === "string") {
      const openRecord = await prisma.work_hours.findFirst({
        where: { id: recordId, user_id: user.id, end_time: null },
      });
      if (!openRecord) {
        return NextResponse.json(
          { error: "O ponto em aberto não foi encontrado. Atualize a página e tente novamente." },
          { status: 404 },
        );
      }
      if (openRecord.date !== date) {
        return NextResponse.json(
          { error: "O ponto foi aberto em outro dia. Ajuste a saída pela edição do registro em Horários." },
          { status: 409 },
        );
      }

      const validationError = validateWorkInterval(openRecord.date, openRecord.start_time, time);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const sameDayRecords = await prisma.work_hours.findMany({
        where: { user_id: user.id, date },
        select: { id: true, start_time: true, end_time: true },
      });
      const overlaps = findOverlappingWorkIntervals(sameDayRecords, openRecord.start_time, time, openRecord.id);
      if (overlaps.length > 0) {
        return NextResponse.json(
          { error: "Este período se sobrepõe a outro horário registrado neste dia." },
          { status: 409 },
        );
      }

      const result = await prisma.work_hours.updateMany({
        where: { id: openRecord.id, user_id: user.id, end_time: null },
        data: { end_time: time },
      });
      if (result.count !== 1) {
        return NextResponse.json(
          { error: "Este ponto já foi encerrado em outra sessão. Atualize a página." },
          { status: 409 },
        );
      }

      return NextResponse.json({ ...openRecord, end_time: time });
    }

    return NextResponse.json({ error: "Ação de ponto inválida." }, { status: 400 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um período em aberto. Atualize a página para continuar." },
        { status: 409 },
      );
    }

    console.error("Erro ao registrar ponto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

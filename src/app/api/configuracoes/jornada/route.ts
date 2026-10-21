import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, dailyTargetMinutes: true },
  });
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    return NextResponse.json({ dailyTargetMinutes: user.dailyTargetMinutes });
  } catch (error) {
    console.error("Erro ao buscar a jornada diária:", error);
    return NextResponse.json({ error: "Não foi possível carregar sua jornada diária." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const dailyTargetMinutes =
      typeof body === "object" && body !== null && "dailyTargetMinutes" in body
        ? body.dailyTargetMinutes
        : undefined;

    if (
      typeof dailyTargetMinutes !== "number" ||
      !Number.isInteger(dailyTargetMinutes) ||
      dailyTargetMinutes < 1 ||
      dailyTargetMinutes > 24 * 60
    ) {
      return NextResponse.json(
        { error: "Informe uma jornada entre 00:01 e 24:00." },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { dailyTargetMinutes },
      select: { dailyTargetMinutes: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro ao salvar a jornada diária:", error);
    return NextResponse.json({ error: "Não foi possível salvar sua jornada diária." }, { status: 500 });
  }
}

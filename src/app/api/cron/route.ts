import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// Impede cache e otimização estática pelo Next.js/Vercel
export const dynamic = "force-dynamic";

// Função para recalcular horas extras disponíveis baseado nos horários trabalhados
async function recalculateExtraHours(prismaClient: PrismaClient) {
  try {
    console.info("[RecalculateExtraHours] Starting recalculation...");

    // Buscar todos os usuários
    const users = await prismaClient.user.findMany({
      select: { id: true, email: true }
    });

    let totalProcessed = 0;

    for (const user of users) {
      // Buscar todos os horários do usuário
      const workHours = await prismaClient.work_hours.findMany({
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

      const totalGenerated = Object.values(extraHoursByDate).reduce((sum, hours) => sum + hours, 0);

      // Verificar se as horas extras mudaram (poderia implementar cache ou comparação)
      console.info(`[RecalculateExtraHours] User ${user.email}: ${totalGenerated.toFixed(2)}h extra hours generated`);
      totalProcessed++;
    }

    console.info(`[RecalculateExtraHours] Processed ${totalProcessed} users successfully`);
    return { success: true, processedUsers: totalProcessed };

  } catch (error) {
    console.error("[RecalculateExtraHours] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Função para atualizar registros de uso de horas extras se necessário
async function updateExtraHoursUsage(prismaClient: PrismaClient) {
  try {
    console.info("[UpdateExtraHoursUsage] Checking for updates...");

    // Buscar todos os usos de horas extras
    const usages = await prismaClient.extra_hours_usage.findMany();

    let updatedCount = 0;

    for (const usage of usages) {
      // Verificar se o bank_id precisa ser atualizado ou se há inconsistências
      if (usage.bank_id !== "auto-calculated") {
        await prismaClient.extra_hours_usage.update({
          where: { id: usage.id },
          data: { bank_id: "auto-calculated" }
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.info(`[UpdateExtraHoursUsage] Updated ${updatedCount} usage records`);
    } else {
      console.info("[UpdateExtraHoursUsage] No updates needed");
    }

    return { success: true, updatedRecords: updatedCount };

  } catch (error) {
    console.error("[UpdateExtraHoursUsage] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

function applyNoCacheHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
}

export async function GET() {
  const prismaClient = new PrismaClient();
  const clientId = "server-health-check";

  try {
    console.info("[CronJob] Starting scheduled tasks...");

    // Executar recálculo de horas extras
    const extraHoursResult = await recalculateExtraHours(prismaClient);

    // Executar atualização de registros de uso
    const usageUpdateResult = await updateExtraHoursUsage(prismaClient);

    console.info("[ConnectionHeartbeat] Executing...");

    const lastPing = new Date().toISOString();
    const connectionHeartbeat = await prismaClient.connectionHeartbeat.upsert({
      where: {
        clientId: clientId,
      },
      update: {
        lastPingAt: lastPing,
      },
      create: {
        clientId,
        lastPingAt: lastPing,
      },
    });

    if (!connectionHeartbeat) {
      console.error("[ConnectionHeartbeat] Heartbeat not found");
      const errorResponse = NextResponse.json(
        { ok: false, error: "Heartbeat not found" },
        { status: 500 }
      );
      applyNoCacheHeaders(errorResponse);
      return errorResponse;
    }

    console.info("[ConnectionHeartbeat] Executed successfully");

    // Incluir resultados das tarefas na resposta
    const successResponse = NextResponse.json(
      {
        ok: true,
        message: "Heartbeat executed successfully",
        cronResults: {
          extraHoursRecalculation: extraHoursResult,
          usageUpdates: usageUpdateResult,
          timestamp: lastPing
        }
      },
      { status: 200 }
    );
    applyNoCacheHeaders(successResponse);
    return successResponse;
  } catch (error) {
    console.error(
      "[ConnectionHeartbeat] Error executing connection heartbeat:",
      error
    );
    const errorResponse = NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
    applyNoCacheHeaders(errorResponse);
    return errorResponse;
  } finally {
    await prismaClient.$disconnect();
  }
}

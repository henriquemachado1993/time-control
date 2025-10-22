import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

// Impede cache e otimização estática pelo Next.js/Vercel
export const dynamic = "force-dynamic";

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
    const successResponse = NextResponse.json(
      { ok: true, message: "Heartbeat executed successfully" },
      { status: 200 }
    );
    applyNoCacheHeaders(successResponse);
    return successResponse;
  } catch (error) {
    console.error(
      "[ConnectionHeartbeat] Erro executing connection heartbeat:",
      error
    );
    const errorResponse = NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
    applyNoCacheHeaders(errorResponse);
    return errorResponse;
  }
}

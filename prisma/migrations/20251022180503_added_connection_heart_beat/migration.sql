-- CreateTable
CREATE TABLE "ConnectionHeartbeat" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lastPingAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionHeartbeat_clientId_key" ON "ConnectionHeartbeat"("clientId");

-- CreateTable
CREATE TABLE "extra_hours_bank" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extra_hours_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_hours_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hours_used" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extra_hours_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extra_hours_bank_user_id_idx" ON "extra_hours_bank"("user_id");

-- CreateIndex
CREATE INDEX "extra_hours_usage_user_id_date_idx" ON "extra_hours_usage"("user_id", "date");

-- CreateIndex
CREATE INDEX "extra_hours_usage_bank_id_idx" ON "extra_hours_usage"("bank_id");

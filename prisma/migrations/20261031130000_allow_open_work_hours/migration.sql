ALTER TABLE "work_hours" ALTER COLUMN "end_time" DROP NOT NULL;

CREATE UNIQUE INDEX "work_hours_one_open_per_user_idx"
ON "work_hours"("user_id")
WHERE "end_time" IS NULL;

/*
  Warnings:

  - You are about to drop the column `break_minutes` on the `work_hours` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "work_hours" DROP COLUMN "break_minutes",
ADD COLUMN     "description" TEXT;

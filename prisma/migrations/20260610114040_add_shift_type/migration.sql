-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('PAGI', 'MALAM');

-- AlterTable
ALTER TABLE "CashierShift" ADD COLUMN     "shiftType" "ShiftType" NOT NULL DEFAULT 'PAGI';

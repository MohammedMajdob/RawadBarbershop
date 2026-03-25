/*
  Warnings:

  - You are about to drop the column `endHour` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `startHour` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `workingDays` on the `Settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "endHour",
DROP COLUMN "startHour",
DROP COLUMN "workingDays",
ADD COLUMN     "advanceBookingDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "schedule" JSONB;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

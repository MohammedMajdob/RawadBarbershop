-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "rescheduledFromDate" TEXT,
ADD COLUMN     "rescheduledFromTime" TEXT;

-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "advanceBookingDays" SET DEFAULT 14;

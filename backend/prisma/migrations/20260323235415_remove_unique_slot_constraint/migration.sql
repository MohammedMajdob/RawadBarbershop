-- DropIndex
DROP INDEX "Booking_date_time_status_key";

-- CreateIndex
CREATE INDEX "Booking_date_time_status_idx" ON "Booking"("date", "time", "status");

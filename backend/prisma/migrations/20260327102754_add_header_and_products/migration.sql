-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "headerMediaUrl" TEXT,
ADD COLUMN     "headerType" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

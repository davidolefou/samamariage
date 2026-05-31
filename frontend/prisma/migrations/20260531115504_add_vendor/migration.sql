-- CreateEnum
CREATE TYPE "VendorCategory" AS ENUM ('PHOTO', 'FOOD', 'DECOR', 'SALLE', 'DJ', 'TENUE', 'VOITURE', 'ANIM');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "VendorCategory" NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT 'dakar',
    "serviceAreas" TEXT[],
    "services" TEXT[],
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "priceFrom" INTEGER NOT NULL DEFAULT 0,
    "priceLabel" TEXT NOT NULL DEFAULT '',
    "depositPolicy" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "portfolio" TEXT[],
    "coverVariant" TEXT NOT NULL DEFAULT 'cv-photo',
    "responseTime" TEXT NOT NULL DEFAULT '',
    "vacationMode" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "VendorStatus" NOT NULL DEFAULT 'DRAFT',
    "payoutMethod" TEXT NOT NULL DEFAULT '',
    "payoutAccount" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_status_category_idx" ON "Vendor"("status", "category");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

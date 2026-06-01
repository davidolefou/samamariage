-- AlterEnum
ALTER TYPE "VendorStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

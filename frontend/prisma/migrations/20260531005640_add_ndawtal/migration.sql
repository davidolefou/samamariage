-- CreateEnum
CREATE TYPE "NdawtalRelation" AS ENUM ('TANTE_MARIEE', 'TANTE_MARIE', 'COUSINE', 'AMIE', 'VOISINE', 'FAMILLE_MARIEE', 'FAMILLE_MARIE', 'COLLEGUE', 'AUTRE');

-- CreateEnum
CREATE TYPE "NdawtalCeremony" AS ENUM ('TAKK', 'CEET', 'RECEPTION', 'AUTRE');

-- CreateEnum
CREATE TYPE "NdawtalType" AS ENUM ('CASH', 'CADEAU', 'SERVICE');

-- CreateTable
CREATE TABLE "NdawtalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "relationship" "NdawtalRelation" NOT NULL DEFAULT 'AUTRE',
    "ceremony" "NdawtalCeremony" NOT NULL DEFAULT 'RECEPTION',
    "type" "NdawtalType" NOT NULL DEFAULT 'CASH',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "donationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptSent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "obligationDate" TIMESTAMP(3),
    "estimatedRepay" INTEGER,
    "repaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NdawtalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NdawtalEntry_userId_donationDate_idx" ON "NdawtalEntry"("userId", "donationDate");

-- CreateIndex
CREATE INDEX "NdawtalEntry_userId_ceremony_idx" ON "NdawtalEntry"("userId", "ceremony");

-- AddForeignKey
ALTER TABLE "NdawtalEntry" ADD CONSTRAINT "NdawtalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

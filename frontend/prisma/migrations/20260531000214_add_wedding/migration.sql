-- CreateEnum
CREATE TYPE "DateMode" AS ENUM ('PRECISE', 'MONTH', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "partnerPronouns" TEXT NOT NULL DEFAULT 'il',
    "phoneCountry" TEXT NOT NULL DEFAULT '+221',
    "phone" TEXT NOT NULL DEFAULT '',
    "dateMode" "DateMode" NOT NULL DEFAULT 'PRECISE',
    "datePrecise" TIMESTAMP(3),
    "dateMonth" TEXT,
    "dateInMonths" INTEGER NOT NULL DEFAULT 6,
    "city" TEXT NOT NULL DEFAULT 'dakar',
    "cityOther" TEXT NOT NULL DEFAULT '',
    "ceremonies" JSONB NOT NULL,
    "ceremonyDates" JSONB NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 450,
    "budget" INTEGER NOT NULL DEFAULT 12000000,
    "budgetSkip" BOOLEAN NOT NULL DEFAULT false,
    "priorities" TEXT[],
    "styles" TEXT[],
    "fabric" TEXT NOT NULL DEFAULT 'bazin',
    "bridesmaids" INTEGER NOT NULL DEFAULT 12,
    "inspirationSources" TEXT[],
    "toAvoid" TEXT NOT NULL DEFAULT '',
    "completedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_userId_key" ON "Wedding"("userId");

-- CreateIndex
CREATE INDEX "Wedding_userId_idx" ON "Wedding"("userId");

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

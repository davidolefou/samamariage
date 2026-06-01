-- CreateEnum
CREATE TYPE "SignalementStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Signalement" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL DEFAULT '',
    "targetLabel" TEXT NOT NULL DEFAULT '',
    "severity" TEXT NOT NULL DEFAULT 'med',
    "reason" TEXT NOT NULL,
    "status" "SignalementStatus" NOT NULL DEFAULT 'OPEN',
    "outcome" TEXT NOT NULL DEFAULT '',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signalement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signalement_status_createdAt_idx" ON "Signalement"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AiInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "task" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "fallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiInteraction_userId_createdAt_idx" ON "AiInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiInteraction_task_idx" ON "AiInteraction"("task");

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

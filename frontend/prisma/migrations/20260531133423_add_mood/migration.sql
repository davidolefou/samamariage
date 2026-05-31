-- CreateTable
CREATE TABLE "MoodItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MoodItem_userId_idx" ON "MoodItem"("userId");

-- AddForeignKey
ALTER TABLE "MoodItem" ADD CONSTRAINT "MoodItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

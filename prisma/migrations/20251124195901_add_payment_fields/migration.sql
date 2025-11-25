/*
  Warnings:

  - A unique constraint covering the columns `[paymentCode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentCode" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cashierId" TEXT,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'COMPLETED';

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentCode_key" ON "Order"("paymentCode");

-- CreateIndex
CREATE INDEX "Order_paymentCode_idx" ON "Order"("paymentCode");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Payment_cashierId_idx" ON "Payment"("cashierId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

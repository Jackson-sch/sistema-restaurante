/*
  Warnings:

  - The primary key for the `ProductIngredient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[productId,ingredientId,variantId]` on the table `ProductIngredient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `restaurantId` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `ProductIngredient` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "CashRegister" ADD COLUMN     "turn" TEXT;

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "restaurantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductIngredient" DROP CONSTRAINT "ProductIngredient_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT,
ADD CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "ReceiptSeries" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSeries_restaurantId_type_series_key" ON "ReceiptSeries"("restaurantId", "type", "series");

-- CreateIndex
CREATE INDEX "Ingredient_restaurantId_idx" ON "Ingredient"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIngredient_productId_ingredientId_variantId_key" ON "ProductIngredient"("productId", "ingredientId", "variantId");

-- AddForeignKey
ALTER TABLE "ReceiptSeries" ADD CONSTRAINT "ReceiptSeries_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

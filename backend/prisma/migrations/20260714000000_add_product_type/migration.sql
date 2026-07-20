-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MANUFACTURED', 'PURCHASED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "product_type" "ProductType" NOT NULL DEFAULT 'MANUFACTURED';

-- CreateIndex
CREATE INDEX "products_product_type_idx" ON "products"("product_type");

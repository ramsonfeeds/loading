-- CreateEnum
CREATE TYPE "Factory" AS ENUM ('R', 'S');

-- CreateEnum
CREATE TYPE "AllocationSource" AS ENUM ('STOCK', 'PRODUCTION');

-- AlterTable
ALTER TABLE "dispatch_groups" ADD COLUMN "factory" "Factory" NOT NULL DEFAULT 'R';

-- CreateTable
CREATE TABLE "dispatch_allocations" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "factory" "Factory" NOT NULL,
    "source" "AllocationSource" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatch_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_lists" (
    "id" SERIAL NOT NULL,
    "production_date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "factory" "Factory" NOT NULL,
    "source_dispatch_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_items" (
    "id" SERIAL NOT NULL,
    "production_list_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dispatch_groups_factory_idx" ON "dispatch_groups"("factory");

-- CreateIndex
CREATE INDEX "dispatch_allocations_item_id_idx" ON "dispatch_allocations"("item_id");

-- CreateIndex
CREATE INDEX "dispatch_allocations_factory_source_idx" ON "dispatch_allocations"("factory", "source");

-- CreateIndex
CREATE INDEX "production_lists_production_date_idx" ON "production_lists"("production_date");

-- CreateIndex
CREATE INDEX "production_lists_factory_idx" ON "production_lists"("factory");

-- CreateIndex
CREATE INDEX "production_lists_source_dispatch_id_idx" ON "production_lists"("source_dispatch_id");

-- CreateIndex
CREATE INDEX "production_items_production_list_id_sort_order_idx" ON "production_items"("production_list_id", "sort_order");

-- CreateIndex
CREATE INDEX "production_items_product_id_idx" ON "production_items"("product_id");

-- AddForeignKey
ALTER TABLE "dispatch_allocations" ADD CONSTRAINT "dispatch_allocations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "dispatch_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_lists" ADD CONSTRAINT "production_lists_source_dispatch_id_fkey" FOREIGN KEY ("source_dispatch_id") REFERENCES "dispatches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_production_list_id_fkey" FOREIGN KEY ("production_list_id") REFERENCES "production_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_items" ADD CONSTRAINT "production_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

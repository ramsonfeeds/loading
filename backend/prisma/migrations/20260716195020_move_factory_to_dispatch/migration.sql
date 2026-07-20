/*
  Move factory ownership from dispatch_groups -> dispatches
*/

-- Step 1: Add the new column as NULLABLE first
ALTER TABLE "dispatches"
ADD COLUMN "factory" "Factory";

-- Step 2: Copy each dispatch's factory from its first group
UPDATE "dispatches" d
SET "factory" = src."factory"
FROM (
    SELECT DISTINCT ON ("dispatch_id")
        "dispatch_id",
        "factory"
    FROM "dispatch_groups"
    ORDER BY "dispatch_id", "sort_order"
) src
WHERE d."id" = src."dispatch_id";

-- Step 3: Safety fallback
UPDATE "dispatches"
SET "factory" = 'R'
WHERE "factory" IS NULL;

-- Step 4: Make the column required
ALTER TABLE "dispatches"
ALTER COLUMN "factory" SET NOT NULL;

-- Step 5: Create the new index
CREATE INDEX "dispatches_factory_idx"
ON "dispatches"("factory");

-- Step 6: Remove the old index
DROP INDEX IF EXISTS "dispatch_groups_factory_idx";

-- Step 7: Remove the old column
ALTER TABLE "dispatch_groups"
DROP COLUMN "factory";
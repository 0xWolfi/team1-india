-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "permissions" JSONB DEFAULT '{"default": "READ"}',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "role" DROP NOT NULL;

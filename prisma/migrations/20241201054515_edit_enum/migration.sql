/*
  Warnings:

  - The `status` column on the `club_member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "status" AS ENUM ('PENDING', 'APPROVED', 'LEADER');

-- AlterTable
ALTER TABLE "club_member" DROP COLUMN "status",
ADD COLUMN     "status" "status" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "Status";

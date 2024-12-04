/*
  Warnings:

  - You are about to drop the column `isDetached` on the `event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event" DROP COLUMN "isDetached",
ADD COLUMN     "is-archived" BOOLEAN NOT NULL DEFAULT false;

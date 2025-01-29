/*
  Warnings:

  - Added the required column `isin` to the `book.trades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "book.trades" ADD COLUMN     "isin" TEXT NOT NULL;

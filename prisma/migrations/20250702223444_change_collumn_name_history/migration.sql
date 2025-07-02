/*
  Warnings:

  - You are about to drop the column `attackersSide` on the `drafthistory` table. All the data in the column will be lost.
  - You are about to drop the column `defendersSide` on the `drafthistory` table. All the data in the column will be lost.
  - You are about to drop the column `draftSession` on the `drafthistory` table. All the data in the column will be lost.
  - You are about to drop the column `mapSelected` on the `drafthistory` table. All the data in the column will be lost.
  - You are about to drop the column `publicLink` on the `drafthistory` table. All the data in the column will be lost.
  - Added the required column `attackers_side` to the `DraftHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defenders_side` to the `DraftHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `draft_session` to the `DraftHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `map_selected` to the `DraftHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `public_link` to the `DraftHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `drafthistory` DROP COLUMN `attackersSide`,
    DROP COLUMN `defendersSide`,
    DROP COLUMN `draftSession`,
    DROP COLUMN `mapSelected`,
    DROP COLUMN `publicLink`,
    ADD COLUMN `attackers_side` JSON NOT NULL,
    ADD COLUMN `defenders_side` JSON NOT NULL,
    ADD COLUMN `draft_session` JSON NOT NULL,
    ADD COLUMN `map_selected` INTEGER NOT NULL,
    ADD COLUMN `public_link` VARCHAR(191) NOT NULL;

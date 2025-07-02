-- CreateTable
CREATE TABLE `DraftHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `publicLink` VARCHAR(191) NOT NULL,
    `creatorId` INTEGER NOT NULL,
    `mapSelected` INTEGER NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `attackersSide` JSON NOT NULL,
    `defendersSide` JSON NOT NULL,
    `draftSession` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DraftHistory_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

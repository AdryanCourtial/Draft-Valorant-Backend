-- CreateTable
CREATE TABLE `MapWinrateStat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mapId` INTEGER NOT NULL,
    `atkWinrate` DOUBLE NOT NULL,
    `defWinrate` DOUBLE NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MapWinrateStat_mapId_idx`(`mapId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopAgentWinrate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mapStatId` INTEGER NOT NULL,
    `agentId` INTEGER NOT NULL,
    `winrate` DOUBLE NOT NULL,

    INDEX `TopAgentWinrate_mapStatId_idx`(`mapStatId`),
    INDEX `TopAgentWinrate_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MapWinrateStat` ADD CONSTRAINT `MapWinrateStat_mapId_fkey` FOREIGN KEY (`mapId`) REFERENCES `Map`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopAgentWinrate` ADD CONSTRAINT `TopAgentWinrate_mapStatId_fkey` FOREIGN KEY (`mapStatId`) REFERENCES `MapWinrateStat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TopAgentWinrate` ADD CONSTRAINT `TopAgentWinrate_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `developerName` VARCHAR(191) NOT NULL,
    `releaseDate` DATETIME(3) NOT NULL,
    `displayIcon` VARCHAR(191) NOT NULL,
    `displayIconSmall` VARCHAR(191) NOT NULL,
    `bustPortrait` VARCHAR(191) NOT NULL,
    `fullPortrait` VARCHAR(191) NOT NULL,
    `fullPortraitV2` VARCHAR(191) NOT NULL,
    `killfeedPortrait` VARCHAR(191) NOT NULL,
    `background` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `backgroundGradientColors` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `agent_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `displayIcon` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `role_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `slot` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `displayIcon` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `map` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `tacticalDescription` VARCHAR(191) NULL,
    `coordinates` VARCHAR(191) NULL,
    `displayIcon` VARCHAR(191) NOT NULL,
    `listViewIcon` VARCHAR(191) NOT NULL,
    `listViewIconTall` VARCHAR(191) NOT NULL,
    `splash` VARCHAR(191) NOT NULL,
    `stylizedBackgroundImage` VARCHAR(191) NOT NULL,
    `premierBackgroundImage` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `map_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_winrate_stat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `winrate` DOUBLE NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agent_winrate_stat_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `map_winrate_stat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mapId` INTEGER NOT NULL,
    `atkWinrate` DOUBLE NOT NULL,
    `defWinrate` DOUBLE NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `map_winrate_stat_mapId_idx`(`mapId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `top_agent_winrate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mapStatId` INTEGER NOT NULL,
    `agentId` INTEGER NOT NULL,
    `winrate` DOUBLE NOT NULL,

    INDEX `top_agent_winrate_mapStatId_idx`(`mapStatId`),
    INDEX `top_agent_winrate_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `draft_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `public_link` VARCHAR(191) NOT NULL,
    `creatorId` INTEGER NOT NULL,
    `map_selected` INTEGER NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `attackers_side` JSON NOT NULL,
    `defenders_side` JSON NOT NULL,
    `draft_session` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `draft_history_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agent` ADD CONSTRAINT `agent_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ability` ADD CONSTRAINT `ability_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_winrate_stat` ADD CONSTRAINT `agent_winrate_stat_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `map_winrate_stat` ADD CONSTRAINT `map_winrate_stat_mapId_fkey` FOREIGN KEY (`mapId`) REFERENCES `map`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `top_agent_winrate` ADD CONSTRAINT `top_agent_winrate_mapStatId_fkey` FOREIGN KEY (`mapStatId`) REFERENCES `map_winrate_stat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `top_agent_winrate` ADD CONSTRAINT `top_agent_winrate_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `draft_history` ADD CONSTRAINT `draft_history_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

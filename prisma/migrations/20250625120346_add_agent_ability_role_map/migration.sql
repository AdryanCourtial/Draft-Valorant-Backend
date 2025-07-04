-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agent` (
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

    UNIQUE INDEX `Agent_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `displayIcon` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Role_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agentId` INTEGER NOT NULL,
    `slot` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `displayIcon` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Map` (
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

    UNIQUE INDEX `Map_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Agent` ADD CONSTRAINT `Agent_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ability` ADD CONSTRAINT `Ability_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `Agent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

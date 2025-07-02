-- AddForeignKey
ALTER TABLE `DraftHistory` ADD CONSTRAINT `DraftHistory_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

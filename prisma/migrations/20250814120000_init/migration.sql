CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPERADMIN', 'FINANZAS', 'CONTENIDO') NOT NULL DEFAULT 'CONTENIDO',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoginAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `success` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoginAttempt_email_createdAt_idx`(`email`, `createdAt`),
    INDEX `LoginAttempt_ip_createdAt_idx`(`ip`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Donation` (
    `id` VARCHAR(191) NOT NULL,
    `referenceCode` VARCHAR(191) NOT NULL,
    `amountCOP` INTEGER NOT NULL,
    `amountOriginal` INTEGER NOT NULL,
    `currencyOriginal` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `documentNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `dataConsentAt` DATETIME(3) NOT NULL,
    `dataConsentIp` VARCHAR(191) NOT NULL,
    `licitOriginDeclaredAt` DATETIME(3) NOT NULL,
    `paymentMethod` ENUM('paypal', 'transferencia', 'pse') NOT NULL,
    `status` ENUM('pending', 'confirmed', 'failed', 'abandoned') NOT NULL DEFAULT 'pending',
    `providerOrderId` VARCHAR(191) NULL,
    `manualProofUrl` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `confirmedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Donation_referenceCode_key`(`referenceCode`),
    INDEX `Donation_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Donation_documentNumber_idx`(`documentNumber`),
    INDEX `Donation_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `priceCOP` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `soldOut` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `referenceCode` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `documentNumber` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `paymentMethod` ENUM('paypal', 'transferencia', 'pse') NOT NULL,
    `providerOrderId` VARCHAR(191) NULL,
    `totalCOP` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_referenceCode_key`(`referenceCode`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPriceCOP` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ThermometerSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `goalCOP` INTEGER NOT NULL,
    `manualAdjustCOP` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `processedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WebhookEvent_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentBlock` (
    `id` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `ContentBlock_section_key`(`section`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Story` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `place` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Partner` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `diff` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `AdminUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

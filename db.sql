-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               9.2.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for dashboard
CREATE DATABASE IF NOT EXISTS `dashboard` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dashboard`;

-- Dumping structure for table dashboard.addresses
CREATE TABLE IF NOT EXISTS `addresses` (
  `addressId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postalCode` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`addressId`),
  KEY `userId` (`userId`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_10` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_11` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_12` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_13` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_5` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_6` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_7` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_8` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.addresses: ~1 rows (approximately)
INSERT INTO `addresses` (`addressId`, `street`, `city`, `state`, `postalCode`, `country`, `createdAt`, `updatedAt`, `userId`) VALUES
	('2ffd5632-2a0c-4e10-af90-122867adb297', '636/6 Partap Chowk', 'rohtak', 'haryana', '124001', 'india', '2025-02-15 09:25:50', '2025-02-15 09:25:50', 'f73086f0-e8f0-46dd-994c-2c26b60770ec');

-- Dumping structure for table dashboard.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `brandName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brandSlug` (`brandSlug`),
  UNIQUE KEY `brandSlug_2` (`brandSlug`),
  UNIQUE KEY `brandSlug_3` (`brandSlug`),
  UNIQUE KEY `brandSlug_4` (`brandSlug`),
  UNIQUE KEY `brandSlug_5` (`brandSlug`),
  UNIQUE KEY `brandSlug_6` (`brandSlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.brands: ~4 rows (approximately)
INSERT INTO `brands` (`id`, `brandName`, `createdAt`, `updatedAt`, `brandSlug`) VALUES
	('3395a37c-1549-472d-9d97-119471e612fc', 'Grohe Bau', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'GB_004'),
	('9b84740a-c1ef-4e80-a4df-e3c349d1e42a', 'Jayna', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'JA_003'),
	('efb728dd-c9b4-4520-97b8-8ec8c41255cc', 'American Standard', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'AS_001'),
	('ff6e65e2-d343-4aca-86c6-bb1e668d5018', 'Grohe Premium', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'GP_002');

-- Dumping structure for table dashboard.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `total_products` int DEFAULT '0',
  `slug` varchar(255) NOT NULL,
  `parentCategory` tinyint(1) NOT NULL,
  `parentCategoryName` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`categoryId`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `slug_2` (`slug`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `slug_3` (`slug`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `slug_4` (`slug`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `slug_5` (`slug`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `slug_6` (`slug`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `slug_7` (`slug`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `slug_8` (`slug`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `slug_9` (`slug`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `slug_10` (`slug`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `slug_11` (`slug`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `slug_12` (`slug`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `slug_13` (`slug`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `slug_14` (`slug`),
  KEY `vendorId` (`vendorId`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_3` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_4` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_5` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_6` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_7` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `Categories_vendorId_foreign_idx` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.categories: ~1 rows (approximately)
INSERT INTO `categories` (`categoryId`, `name`, `total_products`, `slug`, `parentCategory`, `parentCategoryName`, `createdAt`, `updatedAt`, `vendorId`) VALUES
	('18633ed7-7ec6-432f-bd70-40329967ab35', 'Electronics', 0, 'electronics', 1, NULL, '2025-02-15 11:04:45', '2025-02-15 11:04:45', NULL);

-- Dumping structure for table dashboard.invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `client` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `billTo` varchar(255) DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `orderNumber` varchar(100) DEFAULT NULL,
  `invoiceDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `paymentMethod` json DEFAULT NULL,
  `status` enum('paid','unpaid','partially paid') NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `products` json NOT NULL,
  `signatureName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`invoiceId`),
  KEY `client` (`client`),
  KEY `shipTo` (`shipTo`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `invoices_ibfk_12` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_15` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_18` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_21` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_24` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_27` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_30` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_33` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_36` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_37` FOREIGN KEY (`client`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_38` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_39` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_9` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.invoices: ~0 rows (approximately)

-- Dumping structure for table dashboard.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `pipeline` json DEFAULT NULL,
  `status` enum('CREATED','PREPARING','CHECKING','INVOICE','DISPATCHED','DELIVERED','PARTIALLY_DELIVERED') DEFAULT 'CREATED',
  `dueDate` date DEFAULT NULL,
  `assigned` json DEFAULT NULL,
  `followupDates` json DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `priority` enum('high','medium','low') DEFAULT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quotationId` (`quotationId`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_10` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_11` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_12` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_13` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_6` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_7` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_8` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_9` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.orders: ~0 rows (approximately)

-- Dumping structure for table dashboard.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(100) NOT NULL,
  `methods` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `action` (`action`),
  UNIQUE KEY `action_2` (`action`),
  UNIQUE KEY `action_3` (`action`),
  UNIQUE KEY `action_4` (`action`),
  UNIQUE KEY `action_5` (`action`),
  UNIQUE KEY `action_6` (`action`),
  UNIQUE KEY `action_7` (`action`),
  UNIQUE KEY `action_8` (`action`),
  UNIQUE KEY `action_9` (`action`),
  UNIQUE KEY `action_10` (`action`),
  UNIQUE KEY `action_11` (`action`),
  UNIQUE KEY `action_12` (`action`),
  UNIQUE KEY `action_13` (`action`),
  UNIQUE KEY `action_14` (`action`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_10` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_11` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_12` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_13` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_4` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_5` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_6` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_7` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_8` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_9` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.permissions: ~0 rows (approximately)

-- Dumping structure for table dashboard.products
CREATE TABLE IF NOT EXISTS `products` (
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `itemType` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `sellingPrice` decimal(10,2) NOT NULL,
  `purchasingPrice` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `alert_quantity` int DEFAULT NULL,
  `tax` decimal(5,2) DEFAULT NULL,
  `description` text,
  `images` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `productGroup` varchar(100) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `sku_2` (`sku`),
  UNIQUE KEY `sku_3` (`sku`),
  UNIQUE KEY `sku_4` (`sku`),
  UNIQUE KEY `sku_5` (`sku`),
  UNIQUE KEY `sku_6` (`sku`),
  UNIQUE KEY `sku_7` (`sku`),
  UNIQUE KEY `sku_8` (`sku`),
  UNIQUE KEY `sku_9` (`sku`),
  UNIQUE KEY `sku_10` (`sku`),
  UNIQUE KEY `sku_11` (`sku`),
  UNIQUE KEY `sku_12` (`sku`),
  UNIQUE KEY `sku_13` (`sku`),
  UNIQUE KEY `sku_14` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  UNIQUE KEY `barcode_2` (`barcode`),
  UNIQUE KEY `barcode_3` (`barcode`),
  UNIQUE KEY `barcode_4` (`barcode`),
  UNIQUE KEY `barcode_5` (`barcode`),
  UNIQUE KEY `barcode_6` (`barcode`),
  UNIQUE KEY `barcode_7` (`barcode`),
  UNIQUE KEY `barcode_8` (`barcode`),
  UNIQUE KEY `barcode_9` (`barcode`),
  UNIQUE KEY `barcode_10` (`barcode`),
  UNIQUE KEY `barcode_11` (`barcode`),
  UNIQUE KEY `barcode_12` (`barcode`),
  UNIQUE KEY `barcode_13` (`barcode`),
  UNIQUE KEY `barcode_14` (`barcode`),
  KEY `categoryId` (`categoryId`),
  KEY `user_id` (`user_id`),
  KEY `brandId` (`brandId`),
  CONSTRAINT `Products_brandId_foreign_idx` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_10` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_11` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_12` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_13` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_14` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_15` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_16` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_17` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_18` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_19` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_20` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_21` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_22` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_23` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_24` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_25` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_26` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_27` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`),
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_5` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_7` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_8` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_9` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.products: ~0 rows (approximately)

-- Dumping structure for table dashboard.quotations
CREATE TABLE IF NOT EXISTS `quotations` (
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_title` varchar(255) NOT NULL,
  `quotation_date` date NOT NULL,
  `due_date` date NOT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `include_gst` tinyint(1) NOT NULL,
  `gst_value` decimal(10,2) DEFAULT NULL,
  `products` json NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `roundOff` decimal(10,2) DEFAULT NULL,
  `finalAmount` decimal(10,2) NOT NULL,
  `signature_name` varchar(255) DEFAULT NULL,
  `signature_image` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_10` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_11` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_12` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_13` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_5` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_6` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_8` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_9` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.quotations: ~0 rows (approximately)

-- Dumping structure for table dashboard.rolepermissions
CREATE TABLE IF NOT EXISTS `rolepermissions` (
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `permissions` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `role_name` (`role_name`),
  UNIQUE KEY `role_name_2` (`role_name`),
  UNIQUE KEY `role_name_3` (`role_name`),
  UNIQUE KEY `role_name_4` (`role_name`),
  UNIQUE KEY `role_name_5` (`role_name`),
  UNIQUE KEY `role_name_6` (`role_name`),
  UNIQUE KEY `role_name_7` (`role_name`),
  UNIQUE KEY `role_name_8` (`role_name`),
  UNIQUE KEY `role_name_9` (`role_name`),
  UNIQUE KEY `role_name_10` (`role_name`),
  UNIQUE KEY `role_name_11` (`role_name`),
  UNIQUE KEY `role_name_12` (`role_name`),
  UNIQUE KEY `role_name_13` (`role_name`),
  UNIQUE KEY `role_name_14` (`role_name`),
  KEY `userId` (`userId`),
  CONSTRAINT `rolepermissions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_10` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_11` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_12` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_13` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_5` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_6` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_7` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_8` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.rolepermissions: ~2 rows (approximately)
INSERT INTO `rolepermissions` (`roleId`, `role_name`, `permissions`, `createdAt`, `updatedAt`, `userId`) VALUES
	('4e60b78c-3e8b-4d92-b88c-89ed535bf4a7', 'Admin-UP', '["read", "write", "delete"]', '2025-02-15 10:38:22', '2025-02-15 10:38:22', NULL),
	('ae2e6398-8ab2-43ce-a84d-61875d584b61', 'Admin', '["read", "write", "delete"]', '2025-02-15 10:36:20', '2025-02-15 10:36:20', NULL);

-- Dumping structure for table dashboard.signatures
CREATE TABLE IF NOT EXISTS `signatures` (
  `signatureId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `signature_name` varchar(255) NOT NULL,
  `signature_image` longblob NOT NULL,
  `mark_as_default` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`signatureId`),
  KEY `userId` (`userId`),
  CONSTRAINT `signatures_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_10` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_11` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_12` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_13` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_5` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_6` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_7` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_8` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.signatures: ~0 rows (approximately)

-- Dumping structure for table dashboard.users
CREATE TABLE IF NOT EXISTS `users` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `role` enum('superadmin','admin','Accounts','users','staff') NOT NULL,
  `status` enum('active','inactive','restricted') NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `email_14` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_10` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_11` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_12` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_13` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_4` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_5` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_6` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_7` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_8` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_9` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.users: ~1 rows (approximately)
INSERT INTO `users` (`userId`, `username`, `name`, `email`, `mobileNumber`, `role`, `status`, `password`, `role_id`, `createdAt`, `updatedAt`) VALUES
	('f73086f0-e8f0-46dd-994c-2c26b60770ec', 'dashingvijay', 'dashingvijay', 'user1@example.com', NULL, 'users', 'active', '$2a$10$ef/4xHEX2Aogp/cjIIoKEOtWOMBrnLMWR8Dx.iCv/pHVz3GlJxapG', NULL, '2025-02-15 09:22:54', '2025-02-15 09:22:54');

-- Dumping structure for table dashboard.vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` varchar(255) NOT NULL,
  `vendorName` varchar(255) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `brandSlug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendorId` (`vendorId`),
  UNIQUE KEY `vendorId_2` (`vendorId`),
  UNIQUE KEY `vendorId_3` (`vendorId`),
  UNIQUE KEY `vendorId_4` (`vendorId`),
  UNIQUE KEY `vendorId_5` (`vendorId`),
  UNIQUE KEY `vendorId_6` (`vendorId`),
  UNIQUE KEY `vendorId_7` (`vendorId`),
  UNIQUE KEY `vendorId_8` (`vendorId`),
  UNIQUE KEY `vendorId_9` (`vendorId`),
  KEY `brandId` (`brandId`),
  KEY `brandSlug` (`brandSlug`),
  CONSTRAINT `Vendors_brandSlug_foreign_idx` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_10` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_11` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_12` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_2` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_3` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_4` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_5` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_6` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_7` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_8` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_9` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.vendors: ~4 rows (approximately)
INSERT INTO `vendors` (`id`, `vendorId`, `vendorName`, `brandId`, `createdAt`, `updatedAt`, `brandSlug`) VALUES
	('4602b42a-d710-452a-a542-afcca4092456', 'V_3', 'Groha', 'ff6e65e2-d343-4aca-86c6-bb1e668d5018', '2025-02-20 06:08:24', '2025-02-20 06:08:24', 'GP_002'),
	('7bf319dc-166b-4c8a-923d-4e7d06fe8241', 'V_1', 'Arth Tiles', 'efb728dd-c9b4-4520-97b8-8ec8c41255cc', '2025-02-20 06:08:24', '2025-02-20 06:08:24', 'AS_001'),
	('a3b919aa-50e1-4e91-946b-cab5a5a54afc', 'V_2', 'S4 Bath', '3395a37c-1549-472d-9d97-119471e612fc', '2025-02-20 06:08:24', '2025-02-20 06:08:24', 'GB_004'),
	('b64cbeb0-3461-4376-a818-842b9289a239', 'V_4', 'Jayna', '9b84740a-c1ef-4e80-a4df-e3c349d1e42a', '2025-02-20 06:08:24', '2025-02-20 06:08:24', 'JA_003');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

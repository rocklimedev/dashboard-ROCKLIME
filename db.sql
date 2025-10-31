-- --------------------------------------------------------
-- Host:                         119.18.54.11
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for spsyn8lm_rocklime_dashboard
CREATE DATABASE IF NOT EXISTS `spsyn8lm_rocklime_dashboard` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `spsyn8lm_rocklime_dashboard`;

-- Dumping structure for table spsyn8lm_rocklime_dashboard.addresses
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
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('BILLING','PRIMARY','ADDITIONAL') NOT NULL DEFAULT 'ADDITIONAL',
  PRIMARY KEY (`addressId`),
  KEY `userId` (`userId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `addresses_ibfk_253` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_254` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  `brandName` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brandSlug` (`brandSlug`),
  UNIQUE KEY `brandName` (`brandName`),
  UNIQUE KEY `brandSlug_2` (`brandSlug`),
  UNIQUE KEY `brandName_2` (`brandName`),
  UNIQUE KEY `brandSlug_3` (`brandSlug`),
  UNIQUE KEY `brandName_3` (`brandName`),
  UNIQUE KEY `brandSlug_4` (`brandSlug`),
  UNIQUE KEY `brandName_4` (`brandName`),
  UNIQUE KEY `brandSlug_5` (`brandSlug`),
  UNIQUE KEY `brandName_5` (`brandName`),
  UNIQUE KEY `brandSlug_6` (`brandSlug`),
  UNIQUE KEY `brandName_6` (`brandName`),
  UNIQUE KEY `brandSlug_7` (`brandSlug`),
  UNIQUE KEY `brandName_7` (`brandName`),
  UNIQUE KEY `brandSlug_8` (`brandSlug`),
  UNIQUE KEY `brandName_8` (`brandName`),
  UNIQUE KEY `brandSlug_9` (`brandSlug`),
  UNIQUE KEY `brandName_9` (`brandName`),
  UNIQUE KEY `brandSlug_10` (`brandSlug`),
  UNIQUE KEY `brandName_10` (`brandName`),
  UNIQUE KEY `brandSlug_11` (`brandSlug`),
  UNIQUE KEY `brandName_11` (`brandName`),
  UNIQUE KEY `brandSlug_12` (`brandSlug`),
  UNIQUE KEY `brandName_12` (`brandName`),
  UNIQUE KEY `brandSlug_13` (`brandSlug`),
  UNIQUE KEY `brandName_13` (`brandName`),
  UNIQUE KEY `brandSlug_14` (`brandSlug`),
  UNIQUE KEY `brandName_14` (`brandName`),
  UNIQUE KEY `brandSlug_15` (`brandSlug`),
  UNIQUE KEY `brandName_15` (`brandName`),
  UNIQUE KEY `brandSlug_16` (`brandSlug`),
  UNIQUE KEY `brandName_16` (`brandName`),
  UNIQUE KEY `brandSlug_17` (`brandSlug`),
  UNIQUE KEY `brandName_17` (`brandName`),
  UNIQUE KEY `brandSlug_18` (`brandSlug`),
  UNIQUE KEY `brandName_18` (`brandName`),
  UNIQUE KEY `brandSlug_19` (`brandSlug`),
  UNIQUE KEY `brandName_19` (`brandName`),
  UNIQUE KEY `brandSlug_20` (`brandSlug`),
  UNIQUE KEY `brandName_20` (`brandName`),
  UNIQUE KEY `brandSlug_21` (`brandSlug`),
  UNIQUE KEY `brandName_21` (`brandName`),
  UNIQUE KEY `brandSlug_22` (`brandSlug`),
  UNIQUE KEY `brandName_22` (`brandName`),
  UNIQUE KEY `brandSlug_23` (`brandSlug`),
  UNIQUE KEY `brandName_23` (`brandName`),
  UNIQUE KEY `brandSlug_24` (`brandSlug`),
  UNIQUE KEY `brandName_24` (`brandName`),
  UNIQUE KEY `brandSlug_25` (`brandSlug`),
  UNIQUE KEY `brandName_25` (`brandName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brand_parentcategories
CREATE TABLE IF NOT EXISTS `brand_parentcategories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `parentCategoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
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
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `slug_15` (`slug`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `slug_16` (`slug`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `slug_17` (`slug`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `slug_18` (`slug`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `slug_19` (`slug`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `slug_20` (`slug`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `slug_21` (`slug`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `slug_22` (`slug`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `slug_23` (`slug`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `slug_24` (`slug`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `slug_25` (`slug`),
  UNIQUE KEY `brand_parentcategories_parentCategoryId_brandId_unique` (`brandId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  CONSTRAINT `brand_parentcategories_ibfk_857` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `brand_parentcategories_ibfk_858` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brand_parentcategory_brands
CREATE TABLE IF NOT EXISTS `brand_parentcategory_brands` (
  `brandParentCategoryId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `brandId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`brandParentCategoryId`,`brandId`),
  UNIQUE KEY `brand_parentcategory_brands_brandId_brandParentCategoryId_unique` (`brandParentCategoryId`,`brandId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.cart
CREATE TABLE IF NOT EXISTS `cart` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `items` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cart_ibfk_1` (`user_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `parentCategoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `slug` varchar(255) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`categoryId`),
  UNIQUE KEY `unique_category_name_per_brand` (`name`,`brandId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  KEY `brandId` (`brandId`),
  CONSTRAINT `categories_ibfk_1179` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `categories_ibfk_1180` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.comments
CREATE TABLE IF NOT EXISTS `comments` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `comment` text COLLATE utf8_unicode_ci NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.companies
CREATE TABLE IF NOT EXISTS `companies` (
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `createdDate` date NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parentCompanyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`companyId`),
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
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `slug_15` (`slug`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `slug_16` (`slug`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `slug_17` (`slug`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `slug_18` (`slug`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `slug_19` (`slug`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `slug_20` (`slug`),
  KEY `parentCompanyId` (`parentCompanyId`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`parentCompanyId`) REFERENCES `companies` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `companyName` varchar(150) DEFAULT NULL,
  `customerType` enum('Retail','Architect','Interior','Builder','Contractor') DEFAULT NULL,
  `address` json DEFAULT NULL,
  `isVendor` tinyint(1) DEFAULT '0',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `gstNumber` varchar(20) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `email` (`email`),
  KEY `vendorId` (`vendorId`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `billTo` varchar(255) NOT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `invoiceDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `paymentMethod` json DEFAULT NULL,
  `status` enum('paid','unpaid','partially paid','void','refund','return') NOT NULL,
  `products` json NOT NULL,
  `signatureName` varchar(255) NOT NULL DEFAULT 'CM TRADING CO',
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceNo` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`invoiceId`),
  UNIQUE KEY `invoiceNo` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_2` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_3` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_4` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_5` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_6` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_7` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_8` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_9` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_10` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_11` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_12` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_13` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_14` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_15` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_16` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_17` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_18` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_19` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_20` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_21` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_22` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_23` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_24` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_25` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_26` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_27` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_28` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_29` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_30` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_31` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_32` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_33` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_34` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_35` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_36` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_37` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_38` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_39` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_40` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_41` (`invoiceNo`),
  UNIQUE KEY `invoiceNo_42` (`invoiceNo`),
  KEY `shipTo` (`shipTo`),
  KEY `createdBy` (`createdBy`),
  KEY `quotationId` (`quotationId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `invoices_ibfk_4057` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_4058` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_4059` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_4060` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.keywords
CREATE TABLE IF NOT EXISTS `keywords` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `keyword` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`),
  UNIQUE KEY `keyword_2` (`keyword`),
  UNIQUE KEY `keyword_3` (`keyword`),
  UNIQUE KEY `keyword_4` (`keyword`),
  UNIQUE KEY `keyword_5` (`keyword`),
  UNIQUE KEY `keyword_6` (`keyword`),
  UNIQUE KEY `keyword_7` (`keyword`),
  UNIQUE KEY `keyword_8` (`keyword`),
  UNIQUE KEY `keyword_9` (`keyword`),
  UNIQUE KEY `keyword_10` (`keyword`),
  UNIQUE KEY `keyword_11` (`keyword`),
  UNIQUE KEY `keyword_12` (`keyword`),
  UNIQUE KEY `keyword_13` (`keyword`),
  UNIQUE KEY `keyword_14` (`keyword`),
  UNIQUE KEY `keyword_15` (`keyword`),
  UNIQUE KEY `keyword_16` (`keyword`),
  UNIQUE KEY `keyword_17` (`keyword`),
  UNIQUE KEY `keyword_18` (`keyword`),
  UNIQUE KEY `keyword_19` (`keyword`),
  UNIQUE KEY `keyword_20` (`keyword`),
  UNIQUE KEY `keyword_21` (`keyword`),
  UNIQUE KEY `keyword_22` (`keyword`),
  UNIQUE KEY `keyword_23` (`keyword`),
  UNIQUE KEY `keyword_24` (`keyword`),
  UNIQUE KEY `keyword_25` (`keyword`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `keywords_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('PREPARING','CHECKING','INVOICE','DISPATCHED','DELIVERED','PARTIALLY_DELIVERED','CANCELED','DRAFT','ONHOLD') DEFAULT 'PREPARING',
  `dueDate` date DEFAULT NULL,
  `followupDates` json DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `createdFor` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignedUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `assignedTeamId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `secondaryUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceLink` varchar(500) DEFAULT NULL,
  `orderNo` varchar(20) NOT NULL,
  `masterPipelineNo` varchar(20) DEFAULT NULL,
  `previousOrderNo` varchar(20) DEFAULT NULL,
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `products` json DEFAULT NULL,
  `shipping` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderNo` (`orderNo`),
  UNIQUE KEY `orderNo_2` (`orderNo`),
  UNIQUE KEY `orderNo_3` (`orderNo`),
  UNIQUE KEY `orderNo_4` (`orderNo`),
  UNIQUE KEY `orderNo_5` (`orderNo`),
  UNIQUE KEY `orderNo_6` (`orderNo`),
  UNIQUE KEY `orderNo_7` (`orderNo`),
  UNIQUE KEY `orderNo_8` (`orderNo`),
  UNIQUE KEY `orderNo_9` (`orderNo`),
  UNIQUE KEY `orderNo_10` (`orderNo`),
  UNIQUE KEY `orderNo_11` (`orderNo`),
  UNIQUE KEY `orderNo_12` (`orderNo`),
  UNIQUE KEY `orderNo_13` (`orderNo`),
  UNIQUE KEY `orderNo_14` (`orderNo`),
  UNIQUE KEY `orderNo_15` (`orderNo`),
  UNIQUE KEY `orderNo_16` (`orderNo`),
  UNIQUE KEY `orderNo_17` (`orderNo`),
  UNIQUE KEY `orderNo_18` (`orderNo`),
  UNIQUE KEY `orderNo_19` (`orderNo`),
  UNIQUE KEY `orderNo_20` (`orderNo`),
  KEY `createdFor` (`createdFor`),
  KEY `createdBy` (`createdBy`),
  KEY `assignedUserId` (`assignedUserId`) USING BTREE,
  KEY `assignedTeamId` (`assignedTeamId`) USING BTREE,
  KEY `secondaryUserId` (`secondaryUserId`) USING BTREE,
  KEY `idx_masterPipelineNo` (`masterPipelineNo`) USING BTREE,
  KEY `idx_previousOrderNo` (`previousOrderNo`) USING BTREE,
  KEY `idx_shipTo` (`shipTo`) USING BTREE,
  KEY `quotationId` (`quotationId`),
  CONSTRAINT `orders_ibfk_4893` FOREIGN KEY (`createdFor`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4894` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4895` FOREIGN KEY (`assignedUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4896` FOREIGN KEY (`assignedTeamId`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4897` FOREIGN KEY (`secondaryUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4898` FOREIGN KEY (`masterPipelineNo`) REFERENCES `orders` (`orderNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4899` FOREIGN KEY (`previousOrderNo`) REFERENCES `orders` (`orderNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4900` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4901` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.parentcategories
CREATE TABLE IF NOT EXISTS `parentcategories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `brandParentCategoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
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
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `slug_15` (`slug`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `slug_16` (`slug`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `slug_17` (`slug`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `slug_18` (`slug`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `slug_19` (`slug`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `slug_20` (`slug`),
  KEY `brandParentCategoryId` (`brandParentCategoryId`),
  CONSTRAINT `parentcategories_ibfk_1` FOREIGN KEY (`brandParentCategoryId`) REFERENCES `brand_parentcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Human-readable name for the permission',
  `module` varchar(255) NOT NULL,
  `api` enum('view','delete','write','edit','export') NOT NULL,
  `route` varchar(500) NOT NULL COMMENT 'Actual route path like /user/create or /orders/export',
  PRIMARY KEY (`permissionId`),
  UNIQUE KEY `permissions_route_name` (`name`),
  KEY `permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.products
CREATE TABLE IF NOT EXISTS `products` (
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `product_code` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `alert_quantity` int(11) DEFAULT NULL,
  `tax` decimal(5,2) DEFAULT NULL,
  `description` text,
  `images` json DEFAULT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isFeatured` tinyint(1) DEFAULT '0',
  `status` enum('active','inactive','expired','out_of_stock','bulk_stocked') NOT NULL DEFAULT 'active' COMMENT 'Indicates the product''s current operational status (stock/sale condition)',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `brand_parentcategoriesId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `meta` json DEFAULT NULL COMMENT 'Stores key-value pairs where key is ProductMeta UUID and value is the actual value',
  PRIMARY KEY (`productId`),
  UNIQUE KEY `product_code` (`product_code`),
  UNIQUE KEY `product_code_2` (`product_code`),
  UNIQUE KEY `product_code_3` (`product_code`),
  UNIQUE KEY `product_code_4` (`product_code`),
  UNIQUE KEY `product_code_5` (`product_code`),
  UNIQUE KEY `product_code_6` (`product_code`),
  UNIQUE KEY `product_code_7` (`product_code`),
  UNIQUE KEY `product_code_8` (`product_code`),
  UNIQUE KEY `product_code_9` (`product_code`),
  UNIQUE KEY `product_code_10` (`product_code`),
  UNIQUE KEY `product_code_11` (`product_code`),
  UNIQUE KEY `product_code_12` (`product_code`),
  UNIQUE KEY `product_code_13` (`product_code`),
  UNIQUE KEY `product_code_14` (`product_code`),
  UNIQUE KEY `product_code_15` (`product_code`),
  UNIQUE KEY `product_code_16` (`product_code`),
  UNIQUE KEY `product_code_17` (`product_code`),
  UNIQUE KEY `product_code_18` (`product_code`),
  UNIQUE KEY `product_code_19` (`product_code`),
  UNIQUE KEY `product_code_20` (`product_code`),
  UNIQUE KEY `product_code_21` (`product_code`),
  UNIQUE KEY `product_code_22` (`product_code`),
  UNIQUE KEY `product_code_23` (`product_code`),
  UNIQUE KEY `product_code_24` (`product_code`),
  UNIQUE KEY `product_code_25` (`product_code`),
  KEY `brandId` (`brandId`),
  KEY `categoryId` (`categoryId`),
  KEY `vendorId` (`vendorId`),
  KEY `brand_parentcategoriesId` (`brand_parentcategoriesId`),
  CONSTRAINT `products_ibfk_2899` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2900` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2901` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2902` FOREIGN KEY (`brand_parentcategoriesId`) REFERENCES `brand_parentcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.product_metas
CREATE TABLE IF NOT EXISTS `product_metas` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Label for the metadata field (e.g., Selling Price, MRP)',
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fieldType` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Type of data (e.g., string, number, mm, inch, pcs, box, feet)',
  `unit` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Optional unit of measurement (e.g., inch, mm, pcs)',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.purchase_orders
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('pending','confirmed','delivered','cancelled') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'pending',
  `orderDate` datetime NOT NULL,
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `items` json NOT NULL COMMENT 'Array of {productId, quantity, unitPrice}',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `poNumber` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `expectDeliveryDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `poNumber` (`poNumber`),
  UNIQUE KEY `poNumber_2` (`poNumber`),
  UNIQUE KEY `poNumber_3` (`poNumber`),
  UNIQUE KEY `poNumber_4` (`poNumber`),
  UNIQUE KEY `poNumber_5` (`poNumber`),
  UNIQUE KEY `poNumber_6` (`poNumber`),
  UNIQUE KEY `poNumber_7` (`poNumber`),
  UNIQUE KEY `poNumber_8` (`poNumber`),
  UNIQUE KEY `poNumber_9` (`poNumber`),
  UNIQUE KEY `poNumber_10` (`poNumber`),
  UNIQUE KEY `poNumber_11` (`poNumber`),
  UNIQUE KEY `poNumber_12` (`poNumber`),
  UNIQUE KEY `poNumber_13` (`poNumber`),
  UNIQUE KEY `poNumber_14` (`poNumber`),
  UNIQUE KEY `poNumber_15` (`poNumber`),
  UNIQUE KEY `poNumber_16` (`poNumber`),
  UNIQUE KEY `poNumber_17` (`poNumber`),
  UNIQUE KEY `poNumber_18` (`poNumber`),
  UNIQUE KEY `poNumber_19` (`poNumber`),
  UNIQUE KEY `poNumber_20` (`poNumber`),
  KEY `vendorId` (`vendorId`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.quotations
CREATE TABLE IF NOT EXISTS `quotations` (
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_title` varchar(255) NOT NULL,
  `quotation_date` date NOT NULL,
  `due_date` date NOT NULL,
  `followupDates` json DEFAULT NULL COMMENT 'Array of follow-up date objects or timestamps',
  `reference_number` varchar(50) DEFAULT NULL,
  `products` json NOT NULL,
  `roundOff` decimal(10,2) DEFAULT NULL,
  `finalAmount` decimal(10,2) NOT NULL,
  `signature_name` varchar(255) DEFAULT NULL,
  `signature_image` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `discountAmount` decimal(10,2) DEFAULT NULL COMMENT 'Stores either fixed amount or percentage; interpretation handled in frontend',
  `extraDiscount` decimal(10,2) DEFAULT NULL,
  `extraDiscountType` enum('percent','fixed') DEFAULT NULL,
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  KEY `createdBy` (`createdBy`),
  KEY `shipTo` (`shipTo`),
  CONSTRAINT `quotations_ibfk_2840` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_2841` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_2842` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.rolepermissions
CREATE TABLE IF NOT EXISTS `rolepermissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RolePermissions_permissionId_roleId_unique` (`roleId`,`permissionId`),
  UNIQUE KEY `rolepermissions_role_id_permission_id` (`roleId`,`permissionId`),
  KEY `permissionId` (`permissionId`),
  KEY `rolepermissions_permission_id` (`permissionId`),
  CONSTRAINT `rolepermissions_ibfk_2241` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_2242` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`permissionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `roleName` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `roleName` (`roleName`),
  UNIQUE KEY `roleName_2` (`roleName`),
  UNIQUE KEY `roleName_3` (`roleName`),
  UNIQUE KEY `roleName_4` (`roleName`),
  UNIQUE KEY `roleName_5` (`roleName`),
  UNIQUE KEY `roleName_6` (`roleName`),
  UNIQUE KEY `roleName_7` (`roleName`),
  UNIQUE KEY `roleName_8` (`roleName`),
  UNIQUE KEY `roleName_9` (`roleName`),
  UNIQUE KEY `roleName_10` (`roleName`),
  UNIQUE KEY `roleName_11` (`roleName`),
  UNIQUE KEY `roleName_12` (`roleName`),
  UNIQUE KEY `roleName_13` (`roleName`),
  UNIQUE KEY `roleName_14` (`roleName`),
  UNIQUE KEY `roleName_15` (`roleName`),
  UNIQUE KEY `roleName_16` (`roleName`),
  UNIQUE KEY `roleName_17` (`roleName`),
  UNIQUE KEY `roleName_18` (`roleName`),
  UNIQUE KEY `roleName_19` (`roleName`),
  UNIQUE KEY `roleName_20` (`roleName`),
  UNIQUE KEY `roleName_21` (`roleName`),
  UNIQUE KEY `roleName_22` (`roleName`),
  UNIQUE KEY `roleName_23` (`roleName`),
  UNIQUE KEY `roleName_24` (`roleName`),
  UNIQUE KEY `roleName_25` (`roleName`),
  UNIQUE KEY `roleName_26` (`roleName`),
  UNIQUE KEY `roleName_27` (`roleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.SequelizeMeta
CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.signatures
CREATE TABLE IF NOT EXISTS `signatures` (
  `signatureId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `signature_name` varchar(255) NOT NULL,
  `signature_image` varchar(255) NOT NULL,
  `mark_as_default` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`signatureId`),
  KEY `userId` (`userId`),
  KEY `customerId` (`customerId`),
  KEY `vendorId` (`vendorId`),
  CONSTRAINT `signatures_ibfk_55` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_56` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `signatures_ibfk_57` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.teammembers
CREATE TABLE IF NOT EXISTS `teammembers` (
  `id` char(36) COLLATE utf8mb4_bin NOT NULL,
  `teamId` char(36) COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) COLLATE utf8mb4_bin NOT NULL,
  `userName` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `roleId` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `roleName` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`),
  KEY `userId` (`userId`),
  CONSTRAINT `teammembers_ibfk_47` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `teammembers_ibfk_48` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.teams
CREATE TABLE IF NOT EXISTS `teams` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `adminName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `teamName` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.users
CREATE TABLE IF NOT EXISTS `users` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `roles` varchar(255) DEFAULT 'USERS',
  `status` enum('active','inactive','restricted') NOT NULL DEFAULT 'inactive',
  `password` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `shiftFrom` time DEFAULT NULL,
  `shiftTo` time DEFAULT NULL,
  `bloodGroup` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `addressId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `emergencyNumber` varchar(20) DEFAULT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
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
  UNIQUE KEY `username_15` (`username`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `username_16` (`username`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `username_17` (`username`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `username_18` (`username`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `username_19` (`username`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `username_20` (`username`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `username_21` (`username`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `username_22` (`username`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `username_23` (`username`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `username_24` (`username`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `username_25` (`username`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `username_26` (`username`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `username_27` (`username`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `username_28` (`username`),
  UNIQUE KEY `username_29` (`username`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `username_30` (`username`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `username_31` (`username`),
  KEY `addressId` (`addressId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `users_ibfk_1213` FOREIGN KEY (`addressId`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_1214` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` varchar(255) NOT NULL,
  `vendorName` varchar(255) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `brandSlug` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
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
  UNIQUE KEY `vendorId_10` (`vendorId`),
  UNIQUE KEY `vendorId_11` (`vendorId`),
  UNIQUE KEY `vendorId_12` (`vendorId`),
  UNIQUE KEY `vendorId_13` (`vendorId`),
  UNIQUE KEY `vendorId_14` (`vendorId`),
  UNIQUE KEY `vendorId_15` (`vendorId`),
  UNIQUE KEY `vendorId_16` (`vendorId`),
  UNIQUE KEY `vendorId_17` (`vendorId`),
  UNIQUE KEY `vendorId_18` (`vendorId`),
  UNIQUE KEY `vendorId_19` (`vendorId`),
  UNIQUE KEY `vendorId_20` (`vendorId`),
  UNIQUE KEY `vendorId_21` (`vendorId`),
  UNIQUE KEY `vendorId_22` (`vendorId`),
  UNIQUE KEY `vendorId_23` (`vendorId`),
  UNIQUE KEY `vendorId_24` (`vendorId`),
  UNIQUE KEY `vendorId_25` (`vendorId`),
  KEY `vendors_fk_brandId` (`brandId`),
  KEY `vendors_fk_brandSlug` (`brandSlug`),
  CONSTRAINT `vendors_ibfk_901` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_902` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

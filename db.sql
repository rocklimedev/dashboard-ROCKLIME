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
  PRIMARY KEY (`addressId`),
  KEY `userId` (`userId`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
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
  UNIQUE KEY `brandName_16` (`brandName`)
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
  UNIQUE KEY `brand_parentcategories_parentCategoryId_brandId_unique` (`brandId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  CONSTRAINT `brand_parentcategories_ibfk_15` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `brand_parentcategories_ibfk_16` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`categoryId`),
  UNIQUE KEY `name` (`name`),
  KEY `parentCategoryId` (`parentCategoryId`),
  KEY `brandId` (`brandId`),
  CONSTRAINT `categories_ibfk_181` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `categories_ibfk_182` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
  KEY `parentCompanyId` (`parentCompanyId`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`parentCompanyId`) REFERENCES `companies` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `companyName` varchar(150) DEFAULT NULL,
  `address` json DEFAULT NULL,
  `quotations` json DEFAULT NULL,
  `invoices` json DEFAULT NULL,
  `isVendor` tinyint(1) DEFAULT '0',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `totalAmount` float DEFAULT '0',
  `paidAmount` float DEFAULT '0',
  `balance` float DEFAULT '0',
  `dueDate` datetime DEFAULT NULL,
  `paymentMode` varchar(50) DEFAULT NULL,
  `invoiceStatus` enum('Paid','Overdue','Cancelled','Partially Paid','Undue','Draft') DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
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
  `status` enum('paid','unpaid','partially paid','void','refund') NOT NULL,
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
  KEY `shipTo` (`shipTo`),
  KEY `createdBy` (`createdBy`),
  KEY `quotationId` (`quotationId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `invoices_ibfk_2173` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_2174` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_2175` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_2176` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `keywords_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `pipeline` json DEFAULT NULL,
  `status` enum('CREATED','PREPARING','CHECKING','INVOICE','DISPATCHED','DELIVERED','PARTIALLY_DELIVERED','CANCELED','DRAFT','ONHOLD') DEFAULT 'CREATED',
  `dueDate` date DEFAULT NULL,
  `followupDates` json DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `createdFor` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignedTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `createdFor` (`createdFor`),
  KEY `createdBy` (`createdBy`),
  KEY `assignedTo` (`assignedTo`),
  KEY `invoiceId` (`invoiceId`),
  CONSTRAINT `orders_ibfk_2636` FOREIGN KEY (`createdFor`) REFERENCES `customers` (`customerId`),
  CONSTRAINT `orders_ibfk_2637` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`),
  CONSTRAINT `orders_ibfk_2638` FOREIGN KEY (`assignedTo`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2639` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`invoiceId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `product_segment` varchar(100) DEFAULT NULL,
  `productGroup` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `product_code` varchar(100) NOT NULL,
  `company_code` varchar(100) NOT NULL,
  `sellingPrice` decimal(10,2) NOT NULL,
  `purchasingPrice` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `alert_quantity` int(11) DEFAULT NULL,
  `tax` decimal(5,2) DEFAULT NULL,
  `description` text,
  `images` json DEFAULT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isFeatured` tinyint(1) DEFAULT '0',
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `product_code` (`product_code`),
  UNIQUE KEY `company_code` (`company_code`),
  UNIQUE KEY `product_code_2` (`product_code`),
  UNIQUE KEY `company_code_2` (`company_code`),
  UNIQUE KEY `product_code_3` (`product_code`),
  UNIQUE KEY `company_code_3` (`company_code`),
  UNIQUE KEY `product_code_4` (`product_code`),
  UNIQUE KEY `company_code_4` (`company_code`),
  UNIQUE KEY `product_code_5` (`product_code`),
  UNIQUE KEY `company_code_5` (`company_code`),
  UNIQUE KEY `product_code_6` (`product_code`),
  UNIQUE KEY `company_code_6` (`company_code`),
  UNIQUE KEY `product_code_7` (`product_code`),
  UNIQUE KEY `company_code_7` (`company_code`),
  UNIQUE KEY `product_code_8` (`product_code`),
  UNIQUE KEY `company_code_8` (`company_code`),
  UNIQUE KEY `product_code_9` (`product_code`),
  UNIQUE KEY `company_code_9` (`company_code`),
  UNIQUE KEY `product_code_10` (`product_code`),
  UNIQUE KEY `company_code_10` (`company_code`),
  UNIQUE KEY `product_code_11` (`product_code`),
  UNIQUE KEY `company_code_11` (`company_code`),
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
  KEY `brandId` (`brandId`),
  KEY `categoryId` (`categoryId`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `products_ibfk_1326` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`),
  CONSTRAINT `products_ibfk_1327` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_1328` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.quotations
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
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  KEY `createdBy` (`createdBy`),
  KEY `shipTo` (`shipTo`),
  CONSTRAINT `quotations_ibfk_1416` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_1417` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_1418` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
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
  CONSTRAINT `rolepermissions_ibfk_1237` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_1238` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`permissionId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  UNIQUE KEY `roleName_15` (`roleName`)
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
  `mark_as_default` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`signatureId`),
  KEY `userId` (`userId`),
  CONSTRAINT `signatures_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
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
  CONSTRAINT `teammembers_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  KEY `addressId` (`addressId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `users_ibfk_352` FOREIGN KEY (`addressId`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_353` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON UPDATE CASCADE
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
  KEY `vendors_fk_brandId` (`brandId`),
  KEY `vendors_fk_brandSlug` (`brandSlug`),
  CONSTRAINT `vendors_ibfk_1361` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_1362` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

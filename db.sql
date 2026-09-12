-- --------------------------------------------------------
-- Host:                         116.206.104.225
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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `activityLogId` char(36) COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) COLLATE utf8mb4_bin DEFAULT NULL,
  `contextTag` enum('AUTH','CRM','CATALOG','SALES','PROCUREMENT','INVENTORY','SYSTEM') COLLATE utf8mb4_bin NOT NULL,
  `subContext` enum('USER','CUSTOMER','VENDOR','BRAND','CATEGORY','PRODUCT','QUOTATION','ORDER','FIELD_GUIDED_SHEET','PURCHASE_ORDER','TEAM','ADDRESS') COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `entityId` char(36) COLLATE utf8mb4_bin DEFAULT NULL,
  `entityName` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `description` text COLLATE utf8mb4_bin,
  `severity` enum('info','warning','error','critical') COLLATE utf8mb4_bin NOT NULL DEFAULT 'info',
  `oldValues` json DEFAULT NULL,
  `newValues` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ipAddress` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_bin,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`activityLogId`),
  KEY `idx_activity_logs_user_id` (`userId`),
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

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
  CONSTRAINT `addresses_ibfk_457` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_458` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  `brandName` varchar(100) NOT NULL,
  `logo` varchar(500) DEFAULT NULL COMMENT 'Brand logo image URL or file path',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_brand_name` (`brandName`),
  UNIQUE KEY `brands_brand_slug` (`brandSlug`),
  UNIQUE KEY `brandSlug` (`brandSlug`),
  UNIQUE KEY `brandName` (`brandName`)
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
  UNIQUE KEY `brand_parentcategories_parentCategoryId_brandId_unique` (`brandId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  CONSTRAINT `brand_parentcategories_ibfk_1047` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `brand_parentcategories_ibfk_1048` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brand_parentcategory_brands
CREATE TABLE IF NOT EXISTS `brand_parentcategory_brands` (
  `brandParentCategoryId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `brandId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`brandParentCategoryId`,`brandId`),
  UNIQUE KEY `brand_parentcategory_brands_brandId_brandParentCategoryId_unique` (`brandParentCategoryId`,`brandId`),
  UNIQUE KEY `brand_parentcategory_brands_brand_parent_category_id_brand_id` (`brandParentCategoryId`,`brandId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

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
  UNIQUE KEY `categories_slug` (`slug`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `unique_category_name_per_brand` (`name`,`brandId`),
  UNIQUE KEY `categories_name_brand_id` (`name`,`brandId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  KEY `categories_brand_id` (`brandId`),
  KEY `categories_parent_category_id` (`parentCategoryId`),
  CONSTRAINT `categories_ibfk_1379` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `categories_ibfk_1380` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `companyName` varchar(150) DEFAULT NULL,
  `customerType` enum('Retail','Architect','Interior','Builder','Contractor') DEFAULT 'Retail',
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `address` json DEFAULT NULL,
  `isVendor` tinyint(1) NOT NULL DEFAULT '0',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `gstNumber` varchar(20) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `email` (`email`),
  KEY `vendorId` (`vendorId`),
  KEY `customers_mobile_number` (`mobileNumber`),
  KEY `customers_email` (`email`),
  KEY `customers_is_vendor` (`isVendor`),
  KEY `customers_customer_type` (`customerType`),
  KEY `customers_gst_number` (`gstNumber`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.field_guided_sheets
CREATE TABLE IF NOT EXISTS `field_guided_sheets` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fgsNumber` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('draft','negotiating','approved','converted','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `orderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expectDeliveryDate` datetime DEFAULT NULL,
  `totalAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `mongoItemsId` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fgsNumber` (`fgsNumber`),
  UNIQUE KEY `mongoItemsId` (`mongoItemsId`),
  KEY `idx_vendorId` (`vendorId`),
  KEY `idx_status` (`status`),
  KEY `idx_fgsNumber` (`fgsNumber`),
  KEY `idx_mongoItemsId` (`mongoItemsId`),
  KEY `idx_field_guided_sheets_userId` (`userId`),
  CONSTRAINT `fk_field_guided_sheets_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_field_guided_sheets_vendor` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.inventory_history
CREATE TABLE IF NOT EXISTS `inventory_history` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `change` int(11) NOT NULL COMMENT 'Positive = add stock, Negative = remove/sale',
  `quantityAfter` int(11) NOT NULL COMMENT 'Snapshot of product.quantity AFTER this change',
  `action` enum('add-stock','remove-stock','sale','return','adjustment','correction') COLLATE utf8_unicode_ci NOT NULL,
  `orderNo` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `userId` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_created` (`productId`,`createdAt`),
  KEY `idx_created_at` (`createdAt`),
  KEY `idx_action` (`action`),
  KEY `idx_user` (`userId`),
  KEY `idx_order_no` (`orderNo`),
  CONSTRAINT `inventory_history_ibfk_1` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `params` json DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `progress` json DEFAULT NULL,
  `results` json DEFAULT NULL,
  `errorLog` json DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.keywords
CREATE TABLE IF NOT EXISTS `keywords` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `keyword` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keywords_keyword` (`keyword`),
  UNIQUE KEY `keyword` (`keyword`),
  KEY `keywords_category_id` (`categoryId`),
  CONSTRAINT `keywords_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('DRAFT','PREPARING','CHECKING','INVOICE','DISPATCHED','PARTIALLY_DISPATCHED','PARTIALLY_DELIVERED','DELIVERED','RETURNED','ONHOLD','CANCELED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `dueDate` date DEFAULT NULL,
  `followupDates` json DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `createdFor` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignedUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `assignedTeamId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `secondaryUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceLink` varchar(500) DEFAULT NULL,
  `gatePassLink` varchar(500) DEFAULT NULL,
  `receivingDocumentLink` varchar(500) DEFAULT NULL,
  `orderNo` varchar(30) NOT NULL,
  `masterPipelineNo` varchar(30) DEFAULT NULL,
  `previousOrderNo` varchar(30) DEFAULT NULL,
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `products` json DEFAULT NULL,
  `shipping` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst` decimal(5,2) DEFAULT NULL,
  `gstValue` decimal(12,2) DEFAULT '0.00',
  `extraDiscount` decimal(12,2) DEFAULT '0.00',
  `extraDiscountType` enum('percent','fixed') DEFAULT NULL,
  `extraDiscountValue` decimal(12,2) DEFAULT '0.00',
  `finalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `amountPaid` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_no` (`orderNo`),
  KEY `createdFor` (`createdFor`),
  KEY `createdBy` (`createdBy`),
  KEY `assignedUserId` (`assignedUserId`) USING BTREE,
  KEY `assignedTeamId` (`assignedTeamId`) USING BTREE,
  KEY `secondaryUserId` (`secondaryUserId`) USING BTREE,
  KEY `idx_masterPipelineNo` (`masterPipelineNo`) USING BTREE,
  KEY `idx_previousOrderNo` (`previousOrderNo`) USING BTREE,
  KEY `idx_shipTo` (`shipTo`) USING BTREE,
  KEY `orders_status` (`status`),
  KEY `orders_created_for` (`createdFor`),
  KEY `orders_created_by` (`createdBy`),
  KEY `orders_assigned_user_id` (`assignedUserId`),
  KEY `orders_due_date` (`dueDate`),
  KEY `orders_quotation_id` (`quotationId`),
  KEY `orders_final_amount` (`finalAmount`),
  KEY `orders_created_at` (`createdAt`),
  KEY `idx_order_status_date` (`status`,`createdAt`),
  CONSTRAINT `orders_ibfk_5503` FOREIGN KEY (`createdFor`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5504` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5505` FOREIGN KEY (`assignedUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5506` FOREIGN KEY (`assignedTeamId`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5507` FOREIGN KEY (`secondaryUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5508` FOREIGN KEY (`masterPipelineNo`) REFERENCES `orders` (`orderNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5509` FOREIGN KEY (`previousOrderNo`) REFERENCES `orders` (`orderNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5510` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5511` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_activity
CREATE TABLE IF NOT EXISTS `order_activity` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderNo` varchar(30) NOT NULL,
  `action` varchar(60) NOT NULL,
  `description` text,
  `oldValue` json DEFAULT NULL,
  `newValue` json DEFAULT NULL,
  `performedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ipAddress` varchar(64) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_activity_order_id` (`orderId`) USING BTREE,
  KEY `idx_order_activity_order_no` (`orderNo`) USING BTREE,
  KEY `idx_order_activity_action` (`action`) USING BTREE,
  KEY `idx_order_activity_created_at` (`createdAt`) USING BTREE,
  KEY `fk_order_activity_performed_by` (`performedBy`),
  CONSTRAINT `fk_order_activity_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_activity_performed_by` FOREIGN KEY (`performedBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_credit_notes
CREATE TABLE IF NOT EXISTS `order_credit_notes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderNo` varchar(30) NOT NULL,
  `creditNoteNumber` varchar(100) DEFAULT NULL,
  `creditNoteLink` varchar(500) DEFAULT NULL,
  `creditNoteDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `totalQuantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reason` text,
  `remarks` text,
  `status` enum('DRAFT','ISSUED','RECEIVED','CANCELED') NOT NULL DEFAULT 'ISSUED',
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_credit_notes_order_id` (`orderId`) USING BTREE,
  KEY `idx_order_credit_notes_order_no` (`orderNo`) USING BTREE,
  KEY `idx_order_credit_notes_number` (`creditNoteNumber`) USING BTREE,
  KEY `idx_order_credit_notes_status` (`status`) USING BTREE,
  KEY `idx_order_credit_notes_date` (`creditNoteDate`) USING BTREE,
  KEY `fk_order_credit_notes_created_by` (`createdBy`),
  CONSTRAINT `fk_order_credit_notes_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_credit_notes_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_credit_note_items
CREATE TABLE IF NOT EXISTS `order_credit_note_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `creditNoteId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productCode` varchar(100) DEFAULT NULL,
  `name` varchar(500) NOT NULL,
  `quantity` decimal(14,2) NOT NULL,
  `price` decimal(14,2) NOT NULL,
  `discount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discountType` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `tax` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_credit_note_items_credit_note_id` (`creditNoteId`) USING BTREE,
  KEY `idx_credit_note_items_order_id` (`orderId`) USING BTREE,
  KEY `idx_credit_note_items_product_id` (`productId`) USING BTREE,
  CONSTRAINT `fk_credit_note_items_credit_note` FOREIGN KEY (`creditNoteId`) REFERENCES `order_credit_notes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_credit_note_items_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_credit_note_items_product` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_dispatches
CREATE TABLE IF NOT EXISTS `order_dispatches` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderNo` varchar(30) NOT NULL,
  `dispatchNumber` int(11) NOT NULL,
  `items` json NOT NULL,
  `totalQuantity` int(11) NOT NULL DEFAULT '0',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `dispatchDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `carrier` varchar(150) DEFAULT NULL,
  `trackingNumber` varchar(150) DEFAULT NULL,
  `invoiceLink` varchar(500) DEFAULT NULL,
  `gatePassLink` varchar(500) DEFAULT NULL,
  `remarks` text,
  `dispatchedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('DISPATCHED','DELIVERED','RETURNED') NOT NULL DEFAULT 'DISPATCHED',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_order_dispatch_number` (`orderId`,`dispatchNumber`) USING BTREE,
  KEY `idx_order_dispatches_order_id` (`orderId`) USING BTREE,
  KEY `idx_order_dispatches_order_no` (`orderNo`) USING BTREE,
  KEY `idx_order_dispatches_dispatch_date` (`dispatchDate`) USING BTREE,
  KEY `fk_order_dispatches_dispatched_by` (`dispatchedBy`),
  CONSTRAINT `fk_order_dispatches_dispatched_by` FOREIGN KEY (`dispatchedBy`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_dispatches_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  UNIQUE KEY `parentcategories_name` (`name`),
  UNIQUE KEY `parentcategories_slug` (`slug`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
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
  `quantity` int(11) NOT NULL DEFAULT '0',
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
  `status` enum('active','inactive','expired','out_of_stock','bulk_stocked') NOT NULL DEFAULT 'active',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `brand_parentcategoriesId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `masterProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'If this is a variant, points to the master product',
  `isMaster` tinyint(1) DEFAULT '0' COMMENT 'True only for the main product that owns variants',
  `variantOptions` json DEFAULT NULL COMMENT 'e.g., { color: "Red", finish: "Matte", size: "60x60" }',
  `variantKey` varchar(255) DEFAULT NULL COMMENT 'Human readable: ''Red Matte'', ''Blue Glossy''',
  `skuSuffix` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `product_code` (`product_code`),
  UNIQUE KEY `product_code_2` (`product_code`),
  KEY `brandId` (`brandId`),
  KEY `categoryId` (`categoryId`),
  KEY `products_master_product_id` (`masterProductId`),
  KEY `products_is_master` (`isMaster`),
  KEY `products_variant_key` (`variantKey`),
  KEY `products_product_code` (`product_code`),
  KEY `vendorId` (`vendorId`),
  KEY `brand_parentcategoriesId` (`brand_parentcategoriesId`),
  KEY `idx_product_name` (`name`),
  KEY `idx_product_code` (`product_code`),
  KEY `idx_product_updated` (`updatedAt`),
  CONSTRAINT `products_ibfk_3287` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_3288` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_3289` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_3290` FOREIGN KEY (`brand_parentcategoriesId`) REFERENCES `brand_parentcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.products_keywords
CREATE TABLE IF NOT EXISTS `products_keywords` (
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `keywordId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`productId`,`keywordId`),
  UNIQUE KEY `unique_product_keyword` (`productId`,`keywordId`),
  KEY `idx_keywordId` (`keywordId`),
  KEY `idx_productId` (`productId`),
  CONSTRAINT `fk_products_keywords_keyword` FOREIGN KEY (`keywordId`) REFERENCES `keywords` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_products_keywords_product` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `tally_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tally product code',
  `tally_stock` decimal(10,2) DEFAULT NULL COMMENT 'Stock value from Tally',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.purchase_orders
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `fgsId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','in_negotiation','confirmed','partial_delivered','delivered','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `orderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `totalAmount` decimal(12,2) DEFAULT '0.00',
  `mongoItemsId` varchar(24) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `poNumber` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `expectDeliveryDate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `poNumber` (`poNumber`),
  UNIQUE KEY `poNumber_2` (`poNumber`),
  UNIQUE KEY `uk_mongoItemsId` (`mongoItemsId`),
  KEY `vendorId` (`vendorId`),
  KEY `idx_fgsId` (`fgsId`),
  KEY `idx_purchase_orders_userId` (`userId`),
  CONSTRAINT `fk_purchase_orders_fgsId` FOREIGN KEY (`fgsId`) REFERENCES `field_guided_sheets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.quotations
CREATE TABLE IF NOT EXISTS `quotations` (
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_title` varchar(255) NOT NULL,
  `quotation_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `followupDates` json DEFAULT NULL COMMENT 'Array of follow-up date objects or timestamps',
  `reference_number` varchar(50) DEFAULT NULL,
  `totalFloors` int(11) DEFAULT '0' COMMENT 'Cached number of floors for quick filtering/display',
  `floors` json DEFAULT NULL COMMENT 'Array of floors: [{floorId, floorName, sortOrder?, rooms: [{roomId, roomName}]}]',
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
  `shippingAmount` decimal(10,2) DEFAULT NULL,
  `gst` decimal(5,2) DEFAULT NULL COMMENT 'GST percentage applied on total amount',
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  KEY `createdBy` (`createdBy`),
  KEY `shipTo` (`shipTo`),
  CONSTRAINT `quotations_ibfk_3049` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_3050` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_3051` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
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
  CONSTRAINT `rolepermissions_ibfk_2445` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_2446` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`permissionId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  UNIQUE KEY `roleName_2` (`roleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.SequelizeMeta
CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

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
  CONSTRAINT `teammembers_ibfk_251` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `teammembers_ibfk_252` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `emergencyNumber` varchar(20) DEFAULT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `photo_thumbnail` varchar(255) DEFAULT NULL,
  `photo_original` varchar(255) DEFAULT NULL,
  `addressId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  KEY `roleId` (`roleId`),
  KEY `addressId` (`addressId`),
  CONSTRAINT `users_ibfk_63` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_64` FOREIGN KEY (`addressId`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rocklime_dashboard.vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` varchar(255) DEFAULT NULL,
  `vendorName` varchar(255) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `brandSlug` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendorId` (`vendorId`),
  KEY `vendors_fk_brandId` (`brandId`),
  KEY `vendors_fk_brandSlug` (`brandSlug`),
  CONSTRAINT `vendors_ibfk_1093` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_1094` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

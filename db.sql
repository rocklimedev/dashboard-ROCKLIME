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

-- Dumping database structure for spsyn8lm_rocklime_dashboard
CREATE DATABASE IF NOT EXISTS `spsyn8lm_rocklime_dashboard` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
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
  CONSTRAINT `addresses_fk_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.addresses: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  `brandName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brandSlug` (`brandSlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.brands: ~6 rows (approximately)
INSERT INTO `brands` (`id`, `brandSlug`, `brandName`, `createdAt`, `updatedAt`) VALUES
	('13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', 'Grohe Premium', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab', 'JA_003', 'Jayna', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('3b83a3bd-ded7-476b-b0ba-a7e094d07dad', 'JA_00334', 'eliiiot', '2025-03-10 10:25:01', '2025-03-10 10:25:01'),
	('4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'AS_001', 'American Standard', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('d642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'GB_004', 'Grohe Bau', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('f6a48262-0459-40fd-af0c-c9e323ebfb33', 'JA_03456', 'eliiiotttttt', '2025-03-22 04:00:43', '2025-03-22 04:00:43');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.cart: ~1 rows (approximately)
INSERT INTO `cart` (`id`, `user_id`, `created_at`, `updated_at`, `items`) VALUES
	('b93fc33e-dcc6-4a8c-b077-e28e66451b32', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c', '2025-03-24 11:48:03', '2025-03-24 11:48:03', 'null');

-- Dumping structure for table spsyn8lm_rocklime_dashboard.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `total_products` int DEFAULT '0',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `parentCategory` tinyint(1) NOT NULL,
  `parentCategoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`categoryId`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `vendorId` (`vendorId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  CONSTRAINT `categories_fk_parentCategoryId` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_fk_vendorId` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.categories: ~4 rows (approximately)
INSERT INTO `categories` (`categoryId`, `name`, `total_products`, `vendorId`, `slug`, `parentCategory`, `parentCategoryId`, `createdAt`, `updatedAt`) VALUES
	('0e718b1d-a0ab-47a7-bb51-021e522b5596', 'Sanitary', 0, NULL, 'C_1', 1, NULL, '2025-03-01 10:10:18', '2025-03-01 10:10:18'),
	('748a1b48-aa57-440f-9d85-f6a544b094d5', 'Ceramics', 0, NULL, 'C_2', 1, NULL, '2025-03-01 10:10:18', '2025-03-01 10:10:18'),
	('b802d456-fca2-4e42-b5af-a20392b2f4b3', 'test 234', 0, NULL, 'test-234', 1, NULL, '2025-03-22 06:34:52', '2025-03-22 06:34:52'),
	('e84647d5-98d8-46b5-bbae-43e140ff81f2', 'Kitchen', 0, NULL, 'C_3', 1, NULL, '2025-03-01 10:10:18', '2025-03-01 10:10:18');

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
  KEY `parentCompanyId` (`parentCompanyId`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`parentCompanyId`) REFERENCES `companies` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.companies: ~5 rows (approximately)
INSERT INTO `companies` (`companyId`, `name`, `address`, `website`, `createdDate`, `slug`, `parentCompanyId`, `createdAt`, `updatedAt`) VALUES
	('3dec65cc-3d93-4b12-b060-6e0374f375d9', 'SP SYNDICATE PRIVATE LIMITED', '123, Main Street, Mumbai, India', 'https://spsyndicate.com', '2005-07-20', 'sp-syndicate-private-limited', NULL, '2025-03-12 10:57:43', '2025-03-12 10:57:43'),
	('401df7ef-f350-4bc4-ba6f-bf36923af252', 'CHABBRA MARBEL', '123, Main Street, Mumbai, India', 'https://cmtradingco.com/', '2005-07-20', 'chabbra-marbel', NULL, '2025-03-12 11:03:07', '2025-03-12 11:03:07'),
	('5f87b3a4-6b9b-4208-ad00-e197d5d19763', 'EMBARK ENTERPRISES', '123, Main Street, Mumbai, India', 'https://sarvesa.in', '2005-07-20', 'embark-enterprises', NULL, '2025-03-12 11:00:28', '2025-03-12 11:00:28'),
	('5ffbaa43-2cea-410f-b604-8b6e5558b2e8', 'RIPPOTAI ARCHITECTURE', '123, Main Street, Mumbai, India', 'https://rippotaiarchitecture.com/', '2005-07-20', 'rippotai-architecture', NULL, '2025-03-12 11:01:37', '2025-03-12 11:01:37'),
	('87a5c590-5a81-4893-985e-f19a0ad0b122', 'ROCKLIME', '123, Main Street, Mumbai, India', 'https://cmtradingco.com/', '2005-07-20', 'rocklime', NULL, '2025-03-12 11:04:18', '2025-03-12 11:04:18');

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
  KEY `vendorId` (`vendorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.customers: ~3 rows (approximately)
INSERT INTO `customers` (`customerId`, `name`, `email`, `mobileNumber`, `companyName`, `address`, `quotations`, `invoices`, `isVendor`, `vendorId`, `totalAmount`, `paidAmount`, `balance`, `dueDate`, `paymentMode`, `invoiceStatus`, `createdAt`, `updatedAt`) VALUES
	('09e042f3-b3e4-4889-a21e-71a95af8125e', 'utkash gulati', 'utkarshgulati@gmail.com', '8923892323', 'ELIOT', NULL, NULL, NULL, 0, NULL, 23000, 12000, 12000, '2025-03-29 00:00:00', 'Cash', 'Overdue', '2025-03-10 10:02:16', '2025-03-10 10:02:16'),
	('2e56a4ad-7d78-463d-840d-efc82ae47d92', 'Dhruv Verma', 'vermadhruv09112002@gmail.com', '08278978827', 'ELIOTTTT', NULL, NULL, NULL, 0, NULL, 450000, 40000, 5000, '2025-03-28 00:00:00', 'Cash', 'Overdue', '2025-03-22 03:56:31', '2025-03-22 03:56:31'),
	('db5daa16-f57d-426b-8093-c81c8d209ac3', 'grohe vendor 1234', 'random@gmail.com', '8798987676', 'GROHE', NULL, NULL, NULL, 0, NULL, 0, 0, 0, NULL, NULL, NULL, '2025-03-03 05:57:38', '2025-03-03 05:57:38');

-- Dumping structure for table spsyn8lm_rocklime_dashboard.invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `client` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `billTo` varchar(255) NOT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `invoiceDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `paymentMethod` json DEFAULT NULL,
  `status` enum('paid','unpaid','partially paid','void','refund') NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `products` json NOT NULL,
  `signatureName` varchar(255) NOT NULL DEFAULT 'CM TRADING CO',
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`invoiceId`),
  KEY `client` (`client`),
  KEY `shipTo` (`shipTo`),
  KEY `orderId` (`orderId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `fk_invoices_customerId` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_invoices_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_712` FOREIGN KEY (`client`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_713` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`),
  CONSTRAINT `invoices_ibfk_717` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.invoices: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_rocklime_dashboard.keywords
CREATE TABLE IF NOT EXISTS `keywords` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `keyword` varchar(100) NOT NULL,
  `type` enum('Ceramics','Sanitary') NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.keywords: ~24 rows (approximately)
INSERT INTO `keywords` (`id`, `keyword`, `type`, `createdAt`, `updatedAt`) VALUES
	('0ae5be0e-5fb2-465e-81ed-b861fd786d56', 'faucet', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('0d08646f-e165-4f0c-87d0-8de053a1cdf9', 'cover', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('1d0b8789-fcbd-4d5e-9925-2c3d1e2fad9a', 'counter', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('1fcd80a4-4276-4066-8795-e822c0a3ea96', 'bath', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('3bf812ca-9968-4632-8078-91ea3232b543', 'dddd', 'Sanitary', '2025-03-11 05:55:58', '2025-03-11 05:55:58'),
	('3e5e358b-9bdb-4156-a599-611932dbcb8f', 'urinal Floor standing', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('3eff87ac-5e6c-47f2-b1e2-0e900aab8a2b', 'spray', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('4096777b-f0c0-40a5-ae5f-26cc9ce0414f', 'wb wall-hung', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('498707e0-ea9e-4333-b59d-82911d5868ad', 'wc one-piece', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('4a0d4e31-b792-4df0-ac50-958450d02227', 'vessel', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('4f7e78b1-b120-44aa-b0bd-95b5021d6e3a', 'toilet', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('524887ec-58ce-4396-8b01-1286f28e23c5', 'mixer', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('611a3033-5c48-4082-af15-14dd12b5bfd6', 'ddddddfdfsdf', 'Sanitary', '2025-03-22 06:35:06', '2025-03-22 06:35:06'),
	('67c023d8-d062-4d9b-91d1-e0da7730a204', 'wc wall-hung', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('74756fcd-5535-46be-be5d-70796123941e', 'Pedistal', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('7b1b47a3-3f59-412c-bd3d-7dab70b8e21b', 'spout', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('8049502e-2fcc-474b-aa56-34b90caf9b13', 'urinal wall-hung', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('847e8ac9-d4b8-46eb-8796-d488ff0cdcc1', 'Semi-Pedestal', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('90c3328e-f4cf-4abc-a9b4-cb001f535f96', 'wc close-coupled', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('9781dc97-3943-44d0-a7fb-a651512a7ed1', 'bidet', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('a483632e-e078-4e93-a0c7-826ff24151cb', 'wc back to wall', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('a81cff0b-52e4-4607-8374-55e76f914761', 'shower', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('b89ca00a-c73c-4e8d-9ab8-2be7115a221b', 'basin', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('eabb744b-99e8-4963-85fe-c9594f771f00', 'seat', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01');

-- Dumping structure for table spsyn8lm_rocklime_dashboard.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `pipeline` json DEFAULT NULL,
  `status` enum('CREATED','PREPARING','CHECKING','INVOICE','DISPATCHED','DELIVERED','PARTIALLY_DELIVERED','CANCELED') DEFAULT 'CREATED',
  `dueDate` date DEFAULT NULL,
  `followupDates` json DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `priority` enum('high','medium','low') DEFAULT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdFor` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignedTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quotationId` (`quotationId`),
  KEY `createdFor` (`createdFor`),
  KEY `createdBy` (`createdBy`),
  KEY `assignedTo` (`assignedTo`),
  CONSTRAINT `Orders_assignedTo_foreign_idx` FOREIGN KEY (`assignedTo`) REFERENCES `teams` (`id`),
  CONSTRAINT `Orders_createdBy_foreign_idx` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`),
  CONSTRAINT `Orders_createdFor_foreign_idx` FOREIGN KEY (`createdFor`) REFERENCES `customers` (`customerId`),
  CONSTRAINT `orders_fk_quotationId` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.orders: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_rocklime_dashboard.parentcategories
CREATE TABLE IF NOT EXISTS `parentcategories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.parentcategories: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_rocklime_dashboard.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `route` varchar(255) NOT NULL,
  `name` enum('view','delete','write','edit','export') NOT NULL,
  `module` varchar(255) NOT NULL,
  PRIMARY KEY (`permissionId`),
  UNIQUE KEY `permissions_route_name` (`route`,`name`),
  KEY `permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.permissions: ~72 rows (approximately)
INSERT INTO `permissions` (`permissionId`, `createdAt`, `updatedAt`, `route`, `name`, `module`) VALUES
	('007ecf3e-90e5-434b-a166-fefb031b1c2e', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/parent-categories/:id', 'delete', 'parentController'),
	('0253d597-db9b-439b-b401-5a6521f47128', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/keywords/:id', 'view', 'keyword'),
	('0759fa61-d673-48fe-b423-f0f207f6113c', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/permissions/:permissionId', 'edit', 'permission'),
	('084a4f97-216b-4570-a3f8-f7eaf02e18bb', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/parent-categories', 'view', 'parentController'),
	('0a2f573c-4b4a-476f-a3f1-3cfec6808521', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/permissions', 'write', 'permission'),
	('12dd860c-3c2f-476f-b636-fe95f333c204', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/:orderId', 'edit', 'order'),
	('1311b1b9-541f-4fd5-b111-72bbadc01bd2', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/:orderId', 'delete', 'order'),
	('146579ca-7dc6-4628-9b96-8d463fecf278', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/keywords', 'write', 'keyword'),
	('14d47244-fc41-4211-ada5-d7b32acbbaf2', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/roles/:roleId', 'edit', 'roles'),
	('16a1be0c-1782-4ee8-934a-b33c98744920', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/companies/:id', 'view', 'company'),
	('173da146-2596-4b9b-a518-0c6b904caeb6', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/brands', 'view', 'brands'),
	('2414eb23-0a61-41e6-9b3b-5fcc30d77326', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/draft', 'write', 'order'),
	('29f32e8c-21b6-4033-b30a-9b5dd9525636', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/permissions/:permissionId', 'delete', 'permission'),
	('3b3a0f2d-8751-4f9e-91b7-20efc855dafc', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/customers/:id', 'delete', 'customer'),
	('41f5c315-d120-418d-af7e-fa85a59b8069', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/roles/:roleId/permissions', 'edit', 'roles'),
	('4349dbf0-df20-4a43-b9e7-15cb1bb71db4', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/low-stock', 'view', 'products'),
	('46184ae1-b2df-4116-a64f-f544a532b49d', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/quotations/:id', 'view', 'quotation'),
	('48b7ad0e-e308-4e69-b1eb-d30ac6d242c7', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/companies', 'write', 'company'),
	('4c31b09c-83e8-4df8-85a5-bf93ea992cbb', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/category/all', 'view', 'category'),
	('4f64829c-e9e6-4240-92d3-965e2bd78da8', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/:orderId', 'view', 'order'),
	('534253d6-6926-471f-a4fc-a6027d399502', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/category/:id', 'delete', 'category'),
	('5e9035a8-6088-49fb-81e5-caae563315a2', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/customers', 'write', 'customer'),
	('61f7bb01-65c0-4b4a-a307-0714e7a79c81', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders', 'write', 'order'),
	('64c7e1e5-ea21-47cf-a724-1b7578c1517c', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/customers/:id', 'view', 'customer'),
	('67859c55-b1d0-4f38-87ee-379bcdb3a5a1', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/brands/:id', 'delete', 'brands'),
	('6ae204f4-ffb1-4693-869b-10bc67ae1eb6', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/:productId', 'delete', 'products'),
	('6bd2148f-da3b-4360-8dd0-ff508c53765b', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/:productId/add-stock', 'edit', 'products'),
	('76f07196-a514-4c86-a136-450a648ea903', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/:productId/history', 'view', 'products'),
	('7798ed85-4712-4cba-824c-01167ccda2e5', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/quotations', 'view', 'quotation'),
	('7c5f405b-00dd-40cc-a6fd-21e453545549', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/addresses/:addressId', 'edit', 'address'),
	('8862ff83-378d-4eb2-b60b-13b6053d3062', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/category/:id', 'edit', 'category'),
	('8e4465f9-b388-45bb-9992-a2534d34fa2e', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/brands/:id', 'view', 'brands'),
	('96137471-67d7-4b1a-81c8-b6aeaa9940dd', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products', 'write', 'products'),
	('981b626a-04c3-4088-938f-d1e60c06dc75', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/edit-status', 'edit', 'order'),
	('991a8d65-803c-45bb-938b-80c2342e382b', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/signatures/:id', 'delete', 'signature'),
	('9af9205d-84dc-42bc-89bb-e66fc0259026', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/brands', 'write', 'brands'),
	('9d2e2d1a-0370-4732-a7ff-d014dfb57da3', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/permissions', 'view', 'permission'),
	('9dcfa9ed-58f3-4dbf-b688-114ac71fb73a', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/addresses', 'write', 'address'),
	('a1b08975-37d0-446f-a353-73160166b8a9', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/:productId/remove-stock', 'edit', 'products'),
	('a6793397-a0ee-478d-b544-efefdbb174db', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/quotations/:id', 'edit', 'quotation'),
	('a747615f-fc00-4575-a9c0-986206e9eed9', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/addresses/:addressId', 'view', 'address'),
	('a8c51057-422a-4fc4-8ab0-544721a6f911', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/addresses/:addressId', 'delete', 'address'),
	('ab15816d-1b80-4d16-b9b9-f344b99d1718', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/quotations/:id', 'delete', 'quotation'),
	('aded9b92-d032-45c4-8307-5cac180e8cf1', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/category', 'write', 'category'),
	('aea4b96e-c0a2-431f-8b86-7b90d65ab88a', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/keywords', 'view', 'keyword'),
	('afb31ed7-a6a6-4b0e-b049-b8cb91911fb3', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/roles/:roleId', 'delete', 'roles'),
	('b246a38b-5d0f-4f2e-9bc7-0715df93b4b2', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/customers/:id', 'edit', 'customer'),
	('b43470ee-dc8a-4e35-9e1c-e343e614f568', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/signatures/:id', 'view', 'signature'),
	('b5690594-490a-4231-bbe3-ae6111fdbb20', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/quotations', 'write', 'quotation'),
	('b854cdbf-7d8a-4d1b-9f94-e373f14448a2', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/roles', 'view', 'roles'),
	('bb0cf66b-3528-4c49-a749-33159fb4159e', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/:productId', 'view', 'products'),
	('c0c6f370-4cc3-462b-a413-0d277b550038', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/customers', 'view', 'customer'),
	('c32bc04a-6be4-440d-be91-0416d04cf1a7', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/companies/:id', 'delete', 'company'),
	('c32f100c-b4dd-4980-bd08-47ac013dfc83', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/addresses', 'view', 'address'),
	('c6ca2599-74cc-4f52-becf-0e77cdaeb5b2', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/keywords/:id', 'edit', 'keyword'),
	('cd96cd5f-3421-47f9-8ec3-2b71539d66cf', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/parent-categories/:id', 'view', 'parentController'),
	('d14e7423-5e6d-4b07-b270-a14cccbdcedb', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/brands/:id', 'edit', 'brands'),
	('d4075255-9aac-4e98-98c5-3bc962c12300', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/category/:id', 'view', 'category'),
	('d47146aa-93a7-4a9a-a40b-1b0dcb461263', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products', 'view', 'products'),
	('d4a2671f-6ec2-4433-bd33-e45f503fea5c', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/companies/:id', 'edit', 'company'),
	('d58d0f19-6b1c-4e59-bc86-035bf579b1bf', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/signatures', 'write', 'signature'),
	('dbaa4788-8afe-41a2-81b1-20c3a02d9463', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/parent-categories', 'write', 'parentController'),
	('dbd1fc91-8df3-4d9e-9ee6-c405a7fbb7c7', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/companies', 'view', 'company'),
	('dbd66bf9-6aec-400c-b72b-2fafc910558e', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/quotations/:id', 'export', 'quotation'),
	('de2a07d7-ff38-4a92-aad0-129f5a7b89e9', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/products/:productId', 'edit', 'products'),
	('e73ce05d-57a5-405c-8be1-43779a24c3c9', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/parent-categories/:id', 'edit', 'parentController'),
	('e7767cfa-c50e-4ccd-ba4d-59780f96eb48', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/keywords/:id', 'delete', 'keyword'),
	('eb19c29e-348b-41eb-9d69-3acea9926307', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/signatures', 'view', 'signature'),
	('efd0650e-6ed2-42ed-8fe3-3c8238a467a7', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/recent', 'view', 'order'),
	('f8cd0b49-f20e-4735-ba5b-946d5f0940f6', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/orders/edit-team', 'edit', 'order'),
	('f94a17c5-83be-4d54-8287-4d65d3475dca', '2025-03-18 09:42:36', '2025-03-18 09:42:36', '/roles', 'write', 'roles'),
	('fb5926c0-61cc-4ae4-ac1e-e93b4788bbb8', '2025-03-18 09:42:35', '2025-03-18 09:42:35', '/companies/parent/:parentId', 'view', 'company');

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
  `quantity` int NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `alert_quantity` int DEFAULT NULL,
  `tax` decimal(5,2) DEFAULT NULL,
  `description` text,
  `images` json DEFAULT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isFeatured` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`productId`),
  UNIQUE KEY `product_code` (`product_code`),
  UNIQUE KEY `company_code` (`company_code`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `brandId` (`brandId`),
  KEY `categoryId` (`categoryId`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_products_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.products: ~198 rows (approximately)
INSERT INTO `products` (`productId`, `product_segment`, `productGroup`, `name`, `product_code`, `company_code`, `sellingPrice`, `purchasingPrice`, `quantity`, `discountType`, `barcode`, `alert_quantity`, `tax`, `description`, `images`, `brandId`, `categoryId`, `createdAt`, `updatedAt`, `user_id`, `isFeatured`) VALUES
	('00d10f20-f032-448e-bce4-3522ed7433d2', NULL, 'Shower Railset', 'Euphoria 110 Champagne Shower Rail Set+ Dish\r\n600mm', 'EGRGP20011366', '27232001', 17200.00, 13760.00, 357, 'percent', 'b512fb7e-b4e1-400f-91f6-91ea297148df', 10, 18.00, 'Euphoria 110 Champagne Shower Rail Set+ Dish\r\n600mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-10 08:02:11', NULL, 0),
	('015d7d11-5d50-426c-8bde-aed619ac4ea1', NULL, 'Stop Valve', 'STOP VALVE CERAMIC VALVE', 'EASGL012127', '103650GL01', 1700.00, 1360.00, 100, 'percent', '4a5c726d-01ea-4726-afbb-867c224ea2c4', 10, 18.00, 'STOP VALVE CERAMIC VALVE', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('018597f1-7967-40be-9775-c9df1fdb10ae', NULL, 'Head Shower', 'RSH Grandera 210 headshower', 'EGRGP8IG01517', '26898IG0', 101400.00, 81120.00, 112, 'percent', '404c047e-d872-46ec-9bc8-7b2924622123', 10, 18.00, 'RSH Grandera 210 headshower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-22 04:36:44', NULL, 0),
	('01fb244c-aa17-4e04-a088-c9235baee82e', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with knob\r\nWarm Sunset', 'EGRGP2DA0030', '21142DA0', 228750.00, 183000.00, 100, 'percent', 'a9c6d21f-25a9-4d6e-a0b3-4b7731ad1ab6', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with knob\r\nWarm Sunset', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('02dcafe6-5a28-4a94-815e-96a6b9e528d7', NULL, 'Hand Shower', 'Rainshower Grandera Stick Hand Shower 6, 6L', 'EGRGP20001511', '26852000', 16750.00, 13400.00, 77, 'percent', '5b6143da-4d22-4ea7-9ddd-14d238f83f7d', 10, 18.00, 'Rainshower Grandera Stick Hand Shower 6, 6L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-10 06:06:29', NULL, 0),
	('049acce1-3390-4452-bc18-1dd2fbff10df', NULL, 'Drain Technology (Traps)', 'Brass chromed/ABS 40 cm long', 'EAS81082130', 'F78108-CHADYBR', 6200.00, 4960.00, 100, 'percent', '3cb6f78c-fdc4-4e69-9cb7-af8d1bc17a23', 10, 18.00, 'Brass chromed/ABS 40 cm long', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('052fca91-9f1a-48e9-851f-635bf7259ff1', NULL, 'Shower Accessories', 'Silverflex Shower Hose, 1500 mm', 'EGRGB40002083', '28364001', 3250.00, 2600.00, 100, 'percent', '20cb2f53-8fdf-4555-b4d6-2a3c7656cd5d', 10, 18.00, 'Silverflex Shower Hose, 1500 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('0636944c-441a-444c-8efd-6aea99efc72a', NULL, 'Side Shower', 'RSH AQUA 75 sideshower 3,3l round', 'EGRGP1GL01321', '26801GL0', 23000.00, 18400.00, 100, 'percent', '96624ecd-145c-470c-a1fb-1bde9cf18049', 10, 18.00, 'RSH AQUA 75 sideshower 3,3l round', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('064d51e3-77bf-46d0-ae5b-82fc70d680ff', NULL, 'Flush Plate', 'Arena Cosmopolitan Flush Plate, Horizontal, Alpine White', 'EGRGB40002048', '38858SH0', 6450.00, 5160.00, 100, 'percent', 'f11f0754-c7c9-4315-b4fc-a93b92bfa02e', 10, 18.00, 'Arena Cosmopolitan Flush Plate, Horizontal, Alpine White', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('075bb868-7a3e-41d5-88aa-d79802c48f8f', NULL, 'Flush Plate', 'Chiara Flush Plate, Chrome', 'EGRGB40002042', '38540000', 4650.00, 3720.00, 100, 'percent', '98e6d0c6-8042-4987-b72f-c1e08ea4b4c3', 10, 18.00, 'Chiara Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('075f7100-89bb-4585-bda4-996db01a834b', NULL, 'Flush Plate', 'Skate Cosmopolitanflush Plate, Brushed Hard Graphite', 'EGRGB40002044', '38732AL0', 12350.00, 9880.00, 100, 'percent', '68f107bd-e103-4c23-bcda-b6f6da970071', 10, 18.00, 'Skate Cosmopolitanflush Plate, Brushed Hard Graphite', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('0a1de440-b9b6-48ee-8b83-57fae8b7c117', NULL, 'Hand Shower', 'Euphoria Cube+ Stick handshower 9,5l', 'EGRGP5DL01357', '26885DL0', 16200.00, 12960.00, 100, 'percent', '83c5819b-6617-41ed-a03a-16f796f34764', 10, 18.00, 'Euphoria Cube+ Stick handshower 9,5l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('0a4bf850-a9fc-402f-85dd-2e768c39465f', NULL, 'Shower Railset', 'Euphoria 110 Massage Shower Rail Set 600mm', 'EGRGP10011363', '27231001', 20450.00, 16360.00, 100, 'percent', '9e75eaff-4afe-4722-8836-94187a6ad329', 10, 18.00, 'Euphoria 110 Massage Shower Rail Set 600mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('0aa2e95e-6a3b-4709-bc37-7b105ebcde2f', NULL, 'Hand Shower', 'Euphoria 110 Champagne Hand Shower', 'EGRGP20001340', '27222000', 9700.00, 7760.00, 100, 'percent', '94e44bc2-8534-4b60-97de-60ef66c99eae', 10, 18.00, 'Euphoria 110 Champagne Hand Shower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('0b59e7fe-ce43-42c9-9089-09dd39fe3210', NULL, 'Shower Accessories', 'Grandera Shower Holder', 'EGRGP60001520', '26896000', 13920.00, 11136.00, 100, 'percent', '8282b91b-964f-4040-9703-d797998a0483', 10, 18.00, 'Grandera Shower Holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('0bff0ff2-6e75-4e2c-81f8-631407637c75', NULL, 'Kitchen Mixer', 'BauFlow 1-Handle Kitchen Mixer C-Spout', 'EGRGB40002053', '31230001', 11350.00, 9080.00, 100, 'percent', '064e7603-e504-4ab4-b886-23c0685aa5bc', 10, 18.00, 'BauFlow 1-Handle Kitchen Mixer C-Spout', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('10e7a4ec-d0c5-4237-9b0d-db7e9e0633d3', NULL, 'Shower Accessories', 'RSH Grandera shower arm 285mm', 'EGRGP0DA01528', '26900DA0', 18710.00, 14968.00, 100, 'percent', 'b11ffef7-9876-4b92-9b72-980eba219209', 10, 18.00, 'RSH Grandera shower arm 285mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('11bdf679-c4d7-4908-baf2-2f1d94529d69', NULL, 'Basin Mixer - DM', 'Three-hole basin mixer deck mounted with knob\r\nchrome', 'EGRGP5000002', '20595000', 135000.00, 108000.00, 10023, 'percent', '2e955ca0-1361-41d3-86ae-6a349c42efb4', 10, 18.00, 'Three-hole basin mixer deck mounted with knob\r\nchrome', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-10 05:18:19', NULL, 0),
	('13332631-b6a4-4486-95d4-4851b1b00d09', NULL, 'Digital', 'Rough-In Set Ceiling Shower Light', 'EGRGP10001531', '29411000', 17670.00, 14136.00, 100, 'percent', '5ef4dc69-07f5-4381-97b7-b2370e6b4f47', 10, 18.00, 'Rough-In Set Ceiling Shower Light', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('15d1a5f3-7a08-474c-a4e9-7007727fc823', NULL, 'Flush Plate', 'Skate Flush Plate', 'EGRGB40002034', '37547000', 6250.00, 5000.00, 100, 'percent', 'e45f62e0-de41-4ae9-b36f-35c47b3fe169', 10, 18.00, 'Skate Flush Plate', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('163fa16f-47bb-437c-bfe5-b11436839f83', NULL, 'Shower Accessories', 'Rotaflex Metal Shw. Hose 1750', 'EGRGB40002076', '28025001', 7350.00, 5880.00, 100, 'percent', '20a900fd-ccc9-438c-9665-d9e052eb0c43', 10, 18.00, 'Rotaflex Metal Shw. Hose 1750', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('1a276ab0-1066-4a4d-99ea-f41a9b80bbea', NULL, 'Shower Accessories', 'Euphoria Cube Wall Union', 'EGRGP40001373', '27704000', 4000.00, 3200.00, 100, 'percent', 'd78b0d67-1e34-4099-8a55-fb54d9ea82db', 10, 18.00, 'Euphoria Cube Wall Union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('1c02ccfd-eaa6-4696-837d-fdb3d1aff96b', NULL, 'Shower Accessories', 'Silverflex Shower Hose 1250 mm BL', 'EGRGB40002080', '26335001', 2750.00, 2200.00, 100, 'percent', '84ff95ca-d468-41c8-af2a-cffd747ce0c6', 10, 18.00, 'Silverflex Shower Hose 1250 mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('1d2343f6-af57-45be-8155-0ea1ac6d0bc9', NULL, 'Shower Accessories', 'Grandera Ceiling Shower Arm 142mm', 'EGRGP90001522', '26899000', 11510.00, 9208.00, 100, 'percent', 'bd5838d4-e2ab-449d-85b7-f037bf60cee9', 10, 18.00, 'Grandera Ceiling Shower Arm 142mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('1e58f3c9-58db-42ee-a7db-9fb8346478e8', NULL, 'Shower Accessories', 'Metal Tube 1750 mm', 'EGRGB40002065', '28139001', 5100.00, 4080.00, 100, 'percent', '3fd6567f-3d4e-4c36-8572-efe03f256564', 10, 18.00, 'Metal Tube 1750 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('20017e02-1095-4daa-8be9-9ed07bfb0a23', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" L-Size with knob', 'EGRGP8000004', '21138000', 155000.00, 124000.00, 100, 'percent', '17d1973b-a27f-408b-bd3d-2aea70b12de2', 10, 18.00, 'One-hole basin mixer 1/2" L-Size with knob', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('20441126-1d27-4614-b81c-4fb09dfed40e', NULL, 'Flush Plate', 'Skate Wall Plate for Av1', 'EGRGB40002033', '38862000', 8100.00, 6480.00, 100, 'percent', '416005d8-6c47-4756-bb7d-0a08847adbd6', 10, 18.00, 'Skate Wall Plate for Av1', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2074d76e-f383-41c4-aebf-fccfbea6ae1c', NULL, 'Drain Technology (Traps)', 'Bottle Trap 25cm Brass', 'EAS81072129', 'F78107-CHADYBR', 2450.00, 1960.00, 541, 'percent', 'fd7370ba-2a92-4c61-a829-0723551dcd1f', 10, 18.00, 'Bottle Trap 25cm Brass', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-10 05:58:37', NULL, 0),
	('2113f98f-f070-4ad6-9d67-075e8e32e194', NULL, 'Shower Accessories', 'Relexaflex Shower Hose 2000mm BL', 'EGRGB40002071', '28155002', 3050.00, 2440.00, 100, 'percent', '04017294-e902-469d-a10a-0f953e233d76', 10, 18.00, 'Relexaflex Shower Hose 2000mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('21282777-e41f-4c55-9c9f-e819a6209061', NULL, 'Grab Bar', 'Shower  Nylon grab bar', 'EAS94062145', 'FFAS9406-000040BC0', 27250.00, 21800.00, 100, 'percent', '6dfa8709-f54f-4068-bfeb-5faf0f7585d9', 10, 18.00, 'Shower  Nylon grab bar', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2187e90c-2b3e-4d2e-9ea0-0a73b8419369', NULL, 'Stop Valve', 'STOP VALVE CERAMIC VALVE', 'EASAL012126', '103650AL01', 1700.00, 1360.00, 100, 'percent', '69838607-2992-49c1-b498-b58fb5e2373c', 10, 18.00, 'STOP VALVE CERAMIC VALVE', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('22d81d29-856c-40de-97b7-780bbe6aafe7', NULL, 'Head Shower', 'Euphoria 260 Headshower', 'EGRGP50001328', '26455000', 20150.00, 16120.00, 100, 'percent', '0964cb32-4cca-4f2f-8b9c-51e6c1dcf728', 10, 18.00, 'Euphoria 260 Headshower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('239e2817-c4b5-497e-b15b-0828cef714f7', NULL, 'Shower System', 'Essence 1-Handle Freestanding Shower System', 'EGRGP10011510', '23741001', 262200.00, 209760.00, 100, 'percent', '49750248-9431-4681-bbb7-11735ba64701', 10, 18.00, 'Essence 1-Handle Freestanding Shower System', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2593ad89-25fc-4450-aa28-b76fdf7f126c', NULL, 'Head Shower', 'RSH Grandera 210 headshower', 'EGRGP8DA01516', '26898DA0', 95000.00, 76000.00, 100, 'percent', 'c7673722-53ec-4239-bb2d-ba2f4687c3d9', 10, 18.00, 'RSH Grandera 210 headshower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('27460fcb-300f-4099-be31-24934636d7bd', NULL, 'Side Shower', 'RSH AQUA 75x75 sideshw 3,3l square', 'EGRGP2DC01325', '26802DC0', 24400.00, 19520.00, 100, 'percent', '0b79522c-9471-41d2-a1f5-560f79620679', 10, 18.00, 'RSH AQUA 75x75 sideshw 3,3l square', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('292ed8a2-5147-4610-a9cc-81b6698eca58', NULL, 'Flush Plate', 'Skate Air Flush Plate, Chrome', 'EGRGB40002038', '38505000', 3550.00, 2840.00, 100, 'percent', '1c942cb3-bf75-4eb4-8ea5-3006e80def53', 10, 18.00, 'Skate Air Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('29b8cbd8-35a1-43e1-9552-935d75ee501a', NULL, 'Kitchen Mixer', 'Euroeco 1-Handle Kitchen Mixer Swivel Spout', 'EGRGB40002050', '32752000', 12250.00, 9800.00, 100, 'percent', '21790a3f-f596-443f-93f7-39298d965f87', 10, 18.00, 'Euroeco 1-Handle Kitchen Mixer Swivel Spout', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2b69a40e-42e6-4420-9359-8d52f1966b89', NULL, 'Flush Plate', 'Surf Dual Flush Plate, Chrome', 'EGRGB40002030', '38861000', 4850.00, 3880.00, 100, 'percent', '115964c4-1f17-4c5f-b6db-5eadcfc3fc6e', 10, 18.00, 'Surf Dual Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2c452cd3-4c0c-4e15-beb2-827f4b5c64d2', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with knob\r\nSuperSteel', 'EGRGP2DC0031', '21142DC0', 228750.00, 183000.00, 100, 'percent', '4828f0c0-6206-4b35-bfde-063d3deab280', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with knob\r\nSuperSteel', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2ef6f338-130b-4dff-80ef-8002a9ae5b8a', NULL, 'Shower Accessories', 'Rotaflex Shower Hose 2000mm BL', 'EGRGB40002079', '28413002', 3500.00, 2800.00, 100, 'percent', 'd15b65ba-5bf7-4f49-b4e9-7705f5cbd93f', 10, 18.00, 'Rotaflex Shower Hose 2000mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('2fa759f0-64f3-44d8-8405-b6c136d22c94', NULL, 'Flush Plate', 'Skate Flush Plate', 'EGRGB40002035', '38573000', 5000.00, 4000.00, 100, 'percent', '6a60a76e-2e1c-4b6b-a436-43abc20cd686', 10, 18.00, 'Skate Flush Plate', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3221ee48-888b-4693-899d-94e6a6caa389', NULL, 'Drain Technology (Traps)', 'TUBING TRAP FOR LAVATORY - CHROME', 'EAS81002136', 'F78100-CHACTN', 5100.00, 4080.00, 100, 'percent', '5d9f6f51-9fb6-4a31-bf3f-3c5fb3947a9e', 10, 18.00, 'TUBING TRAP FOR LAVATORY - CHROME', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('32be13b8-2ae0-409f-802e-f822c952432d', NULL, 'Flush Plate', 'Arena Cosmopolitan Urinal Wall Plate', 'EGRGB40002026', '38857000', 8100.00, 6480.00, 100, 'percent', '985dfec9-f6b4-42fe-a7cd-c8170aac13f0', 10, 18.00, 'Arena Cosmopolitan Urinal Wall Plate', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('32c60a6d-9543-41fa-bce3-a4290d3569db', NULL, 'Head Shower', 'Euphoria 260 Headshower Set 142mm', 'EGRGP00001333', '26460000', 22950.00, 18360.00, 100, 'percent', 'd8e0a60b-253b-4867-bf7a-5e9d2658d21f', 10, 18.00, 'Euphoria 260 Headshower Set 142mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('375d593f-9000-4153-8bfb-7ffb3de74b27', NULL, 'Kitchen Cold Only Tap', 'BauCurve Wall-Mount Kitchen Cold Only tap', 'EGRGB40002062', '31226000', 5850.00, 4680.00, 100, 'percent', 'eed4ea49-302e-464c-97b9-15c1acf1601c', 10, 18.00, 'BauCurve Wall-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('380dfa17-35a4-40d0-a9f6-081075c8a197', NULL, 'Shower Accessories', 'Allure Brilliant Wall Union', 'EGRGP00001505', '26850000', 8210.00, 6568.00, 100, 'percent', '897c9add-b013-485f-8055-ea2e964e47d4', 10, 18.00, 'Allure Brilliant Wall Union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3817e603-1eab-4399-abee-a9834aea550e', NULL, 'Shower Railset', 'Euphoria Cosmopolitan Stick Shower Rail Set\r\n900mm 9.5L', 'EGRGP80001362', '27368000', 24350.00, 19480.00, 100, 'percent', 'ee3521e9-30e9-4b79-93a1-053f50975177', 10, 18.00, 'Euphoria Cosmopolitan Stick Shower Rail Set\r\n900mm 9.5L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('38bee4ae-41f6-4331-809a-b8e5ef9182b1', NULL, 'Shower Railset', 'Euphoria 110 Massage Shower Rail Set 900mm', 'EGRGP6ALI1359', '27226AL1', 44300.00, 35440.00, 100, 'percent', '681e67e9-af77-4ace-9daf-1b258992d683', 10, 18.00, 'Euphoria 110 Massage Shower Rail Set 900mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('39cb8b06-75dd-48d5-b4b6-763d7ce8d11b', NULL, 'Basin Mixer - DM', 'Acc: black Caesarstone inlay set 1 (2x) for basin\r\nOHM L- and XL-size', 'EGRGP7000008', '48457000', 35500.00, 28400.00, 100, 'percent', '4abac4bb-6f10-4451-a0a2-38cb431c9612', 10, 18.00, 'Acc: black Caesarstone inlay set 1 (2x) for basin\r\nOHM L- and XL-size', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3b70f19f-6560-4682-922f-0e9ea0792a81', NULL, 'Shower Railset', 'Euphoria 110 Mono Shower Rail Set+ Dish', 'EGRGP70011369', '27267001', 13150.00, 10520.00, 100, 'percent', '4cf3e88f-56dc-430f-a5f5-64f495b3e751', 10, 18.00, 'Euphoria 110 Mono Shower Rail Set+ Dish', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3c635bf2-f3a3-434a-a007-554403951571', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with stick\r\nBrushed Hard Graphite', 'EGRGP0AL0025', '21140AL0', 181250.00, 145000.00, 100, 'percent', '4c706384-afbf-4df8-a8ac-3372a77087a7', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with stick\r\nBrushed Hard Graphite', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3c64ba09-8048-4236-8dff-f91aee02a526', NULL, 'Hand Shower', 'Euphoria 110 Mono Hand Shower', 'EGRGP50001342', '27265000', 5200.00, 4160.00, 100, 'percent', 'cfb995e1-78ad-4eb8-af26-1c72bd15fdab', 10, 18.00, 'Euphoria 110 Mono Hand Shower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3e28f00d-19ec-4a16-aac9-2078a967b153', NULL, 'Flush Plate', 'Arena Cosmopolitan Flush Plate, Chrome', 'EGRGB40002027', '38858000', 8250.00, 6600.00, 100, 'percent', 'dad0c52a-ae6f-4667-a873-0774758d54cc', 10, 18.00, 'Arena Cosmopolitan Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('3e33b352-6f1b-41d9-b93f-23bdf24eddf3', NULL, 'Hygiene Spray', 'DuoSTiX Hygiene Spray (Glossy White)', 'EASTS282150', 'FFASTS28-000091BF0', 2750.00, 2200.00, 100, 'percent', 'a36144f2-9204-4ab8-a9ae-e8b0eef25cb4', 10, 18.00, 'DuoSTiX Hygiene Spray (Glossy White)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('4019451a-65a0-47e6-a97a-33a2c5a18144', NULL, 'Kitchen Mixer', 'Touch Sensor Kitchen Faucet', 'EAS56442123', 'FFAS5644-5015L0BF0', 69750.00, 55800.00, 100, 'percent', '98f483e5-fbaf-4e4e-82aa-60abdbf17179', 10, 18.00, 'Touch Sensor Kitchen Faucet', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('4290512c-63a9-4e67-a06e-8a651b89c969', NULL, 'Hand Shower', 'Euphoria 110 Duo Hand Shower', 'EGRGP00001338', '27220000', 7100.00, 5680.00, 100, 'percent', 'ce2758bb-777a-43a0-8011-8d4d57bc5ffe', 10, 18.00, 'Euphoria 110 Duo Hand Shower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('45178b0e-38d2-4f84-ba98-e0148fb4e21f', NULL, 'Shower Accessories', 'Allure Brilliant shower holder', 'EGRGP7AL01506', '26847AL0', 6670.00, 5336.00, 100, 'percent', 'a8be2d2f-eaa3-40ef-9668-cf33c8eac5a8', 10, 18.00, 'Allure Brilliant shower holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('45b0ec0f-0f8c-45ba-95ac-3f864a19826c', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with stick', 'EGRGP2114005', '21140000', 144450.00, 115560.00, 100, 'percent', '220e2210-7168-431f-bcc0-c7378756aafc', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with stick', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('47357731-a90f-4e97-a5f1-796652212f10', NULL, 'Shower Accessories', 'Metal Tube Combination', 'EGRGB40002067', '27102000', 6850.00, 5480.00, 100, 'percent', '8906808f-5a75-4628-879e-e78b5fd5457c', 10, 18.00, 'Metal Tube Combination', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('4808544a-8ffa-4c46-a5c2-4eaf33f4a447', NULL, 'Side Shower', 'RSH AQUA 75 sideshower 3,3l round', 'EGRGP1DL01320', '26801DL0', 23000.00, 18400.00, 100, 'percent', '0a092c7f-5647-4769-9c0e-05c8c76ccead', 10, 18.00, 'RSH AQUA 75 sideshower 3,3l round', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('48226fa1-1719-4ff1-b4d0-05a90f74bb90', NULL, 'Hygiene Spray', 'DuoSTiX™ Hygiene Spray_Matte Black', 'EASTS282152', 'FFASTS28-000441BF0', 3300.00, 2640.00, 100, 'percent', '6590f521-3e3d-4522-b21a-f1121425a6c7', 10, 18.00, 'DuoSTiX™ Hygiene Spray_Matte Black', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('49a48ef2-7887-4f87-af5c-b70e7a514d18', NULL, 'Hygiene Spray', 'DuoSTiX™ Hygiene Spray', 'EASTS282153', 'FFASTS28-000AL0BF0', 3440.00, 2752.00, 100, 'percent', '526aa8f5-3ccb-43b0-91f7-995afe5f20f5', 10, 18.00, 'DuoSTiX™ Hygiene Spray', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('4d3ef538-ba47-4bec-ace0-8b7ec1df6949', NULL, 'Flush Plate', 'Skate Cosmopolitan Flush Plate, Chrome', 'EGRGB40002040', '490049045', 5250.00, 4200.00, 100, 'percent', 'e8426020-2911-4294-8bdb-424486d8bfbd', 10, 18.00, 'Skate Cosmopolitan Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('4d959365-3f5e-4885-be28-9747740db5d3', NULL, 'Shower Accessories', 'Allure Brilliant wall union', 'EGRGP0AL01508', '26850AL0', 10260.00, 8208.00, 100, 'percent', 'a749dc07-9b06-44fe-84df-dac6ccfc2e73', 10, 18.00, 'Allure Brilliant wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('4dcaf95c-d9d1-41b2-9fe5-cf5b796886d5', NULL, 'Flush Plate', 'Skate Cosmopolitan Flush Plate, Chrome', 'EGRGB40002043', '38732000', 4100.00, 3280.00, 100, 'percent', '3460eba4-068b-4c58-afc2-5e50b1469155', 10, 18.00, 'Skate Cosmopolitan Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5035351f-07f7-408b-b786-b6a9fe5b7a19', NULL, 'Manual Flush Valve for Toilet', 'Concept Arc Dual Toilet Flush Valve  (32mm  – Low pressure)', 'EAS98092156', 'FFAS9809-000500BA0', 5450.00, 4360.00, 100, 'percent', '14e70ddf-ae82-482e-9b93-eaea1c7e8fb3', 10, 18.00, 'Concept Arc Dual Toilet Flush Valve  (32mm  – Low pressure)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('51480d22-1651-422f-99ec-d02bea1fc9ca', NULL, 'Shower Accessories', 'Euphoria Cube Handshower Holder', 'EGRGP30001372', '27693000', 3500.00, 2800.00, 100, 'percent', '27c56008-cb29-412c-a951-f2eaa4915a93', 10, 18.00, 'Euphoria Cube Handshower Holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('517de69d-3246-40cf-97bb-274d9f0cb7f2', NULL, 'Hand Shower', 'Grandera Stick Hand Shower Set 7.6L', 'EGRGP10001512', '26901000', 41950.00, 33560.00, 100, 'percent', 'c814a88b-0201-405d-a133-5adbc7a978fd', 10, 18.00, 'Grandera Stick Hand Shower Set 7.6L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('52146b03-834a-4943-8475-3dfbd5437027', NULL, 'Shower Railset', 'Euphoria 110 Champagne Shower Rail Set+ Dish\r\n900mm', 'EGRGP70011364', '27227001', 20300.00, 16240.00, 100, 'percent', '2fc929e1-c6e7-4b7f-895d-b18ecff7a992', 10, 18.00, 'Euphoria 110 Champagne Shower Rail Set+ Dish\r\n900mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5521838c-e90f-4ab7-8b6e-92b021fd6851', NULL, 'Flush Plate', 'Nova Cosmopolitan Flush Plate, Vertical Matt, Chrome', 'EGRGB40002047', '38765P00', 7350.00, 5880.00, 100, 'percent', 'c027844a-a61f-4f02-890f-9830c19f89d7', 10, 18.00, 'Nova Cosmopolitan Flush Plate, Vertical Matt, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5555e1f4-900a-4568-873e-20e962f96f52', NULL, 'Grab Bar', 'Shower Nylon chair', 'EAS94072140', 'FFAS9407-000040BC0', 136550.00, 109240.00, 100, 'percent', '7ef3e9e8-c426-4ed7-b53c-8c66c5b79ba5', 10, 18.00, 'Shower Nylon chair', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('57177050-f1e1-4dd1-9d82-8cd67c811f06', NULL, 'Shower Accessories', 'Relexaflex Shower hose-Long Life Metal 2000 mm', 'EGRGB40002074', '28145001', 7450.00, 5960.00, 100, 'percent', '51731d43-66cf-4798-aa97-37f2fa9c1f1d', 10, 18.00, 'Relexaflex Shower hose-Long Life Metal 2000 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5756e652-6c33-45b6-b37e-e0ad14806916', NULL, 'Shower Accessories', 'Relexaflex Shower Hose 1750mm BL', 'EGRGB40002070', '28154002', 2850.00, 2280.00, 100, 'percent', '5841bda0-0c7e-405f-a47b-4f58535e4ef0', 10, 18.00, 'Relexaflex Shower Hose 1750mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5dbe5ece-50e6-4137-af4f-bf65c59588c9', NULL, 'Kitchen Mixer', 'Euroeco 1-Handle Kitchen Mixer', 'EGRGB40002055', '32750000', 10450.00, 8360.00, 100, 'percent', '30a807d6-fced-4bb7-8852-90b474c38ca7', 10, 18.00, 'Euroeco 1-Handle Kitchen Mixer', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5e0dc149-155a-49bb-8c7c-0687f0deb5d9', NULL, 'Shower Accessories', 'Metal Tube 2000 mm', 'EGRGB40002066', '28140001', 5300.00, 4240.00, 100, 'percent', '033d7f63-3cdf-407b-a072-2496036ff2c2', 10, 18.00, 'Metal Tube 2000 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5eb86300-50bd-418e-ae64-ebe64816e46a', NULL, 'Shower Accessories', 'Euphoria Shower Rail 600mm', 'EGRGP90001371', '27499000', 8850.00, 7080.00, 100, 'percent', 'b347a029-91f8-4c11-ba5a-6a41d995f294', 10, 18.00, 'Euphoria Shower Rail 600mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('5f0175c0-f9d0-4d79-b54b-fb8b3d3a4c00', NULL, 'Hygiene Spray', 'DuoSTiX Hygiene Spray (Chrome & Glossy White)', 'EASTS282149', 'FFASTS28-000090BF0', 3000.00, 2400.00, 100, 'percent', 'a4bc0b2c-2ba2-4d28-a106-4863752d9bca', 10, 18.00, 'DuoSTiX Hygiene Spray (Chrome & Glossy White)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('62c423e6-b545-48f5-a5d4-d57a40cdf70b', NULL, 'Shower Accessories', 'Relexaflex Shower hose-Long Life Metal 1500 mm', 'EGRGB40002073', '28143001', 6950.00, 5560.00, 100, 'percent', 'f0428659-602b-4faf-a9da-5b94c19f12dd', 10, 18.00, 'Relexaflex Shower hose-Long Life Metal 1500 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('640846c5-184b-4443-b27a-bfd856b6df74', NULL, 'Drain Technology (Traps)', 'Stainless steel/ABS Long 25 cm long', 'EAS81062138', 'F78106-CHADYST', 2600.00, 2080.00, 100, 'percent', 'f1cfc755-8f70-43d9-ac59-ba996917f839', 10, 18.00, 'Stainless steel/ABS Long 25 cm long', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('644d11db-7be8-486c-bd78-f34f5062ac0a', NULL, 'Flush Plate', 'Arena Cosmopolitan Flush Plate Vertical, Chrome', 'EGRGB40002028', '38844000', 8100.00, 6480.00, 100, 'percent', '77d3e955-f4de-4ae7-9fae-d6c4901ddce0', 10, 18.00, 'Arena Cosmopolitan Flush Plate Vertical, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('65579d62-d1e9-4c98-ac36-ab1c45852565', NULL, 'Kitchen Cold Only Tap', 'BauFlow Wall-Mount Kitchen Cold Only tap', 'EGRGB40002063', '31225000', 5750.00, 4600.00, 100, 'percent', 'c1d4c26f-21bb-4dc8-853d-3d0451c64c72', 10, 18.00, 'BauFlow Wall-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('670e8f3e-9baa-4562-a186-165a6ded1e96', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with stick Cool\r\nSunrise', 'EGRGP0GL0028', '21140GL0', 181250.00, 145000.00, 100, 'percent', 'dbc786fa-3f96-43c6-9f7e-b5bf0c07bd61', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with stick Cool\r\nSunrise', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('68d5d961-dbe4-464b-85f8-9f6ea8d06fc9', NULL, 'Shower Accessories', 'Rotaflex Shower Hose 1750mm BL', 'EGRGB40002078', '28410002', 3150.00, 2520.00, 100, 'percent', '3f4f1a9f-a093-4b84-9f2d-bfe6084753b1', 10, 18.00, 'Rotaflex Shower Hose 1750mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('69d829ed-ae46-4590-b3ba-5a8f17307897', NULL, 'Shower Accessories', 'RSH Grandera shower arm 285mm', 'EGRGP0IG01529', '26900IG0', 21420.00, 17136.00, 100, 'percent', 'b1a8af0d-1e33-41ea-897a-a7b05caa126f', 10, 18.00, 'RSH Grandera shower arm 285mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('6a5c234d-06c3-40f4-b2d5-cc5292b9114c', NULL, 'Shower Accessories', 'Relexaflex Shower hose-Long Life Metal 1250 mm', 'EGRGB40002072', '28142002', 6750.00, 5400.00, 100, 'percent', '37afa7be-fe58-42a6-b39c-c9f49d59c1dc', 10, 18.00, 'Relexaflex Shower hose-Long Life Metal 1250 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('6b8a5b19-e2ec-4444-ba09-b2a3dfa47a17', NULL, 'Kitchen Mixer', 'StartEdge 1-Handle Kitchen Mixer, C-spout, Pull-Out', 'EGRGB40002049', '30551000', 15450.00, 12360.00, 100, 'percent', '83a20a1a-c44f-49d6-b9b6-e56506b7fbba', 10, 18.00, 'StartEdge 1-Handle Kitchen Mixer, C-spout, Pull-Out', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('6c1057a7-f7cf-454c-abff-d01f73d0e266', NULL, 'Flush Plate', 'Skate Air Flush Plate Vertical, Alpine White', 'EGRGB40002046', '38505SH0', 5600.00, 4480.00, 100, 'percent', 'b54b3f05-6f53-4cbf-a3ff-ff5edb8dc579', 10, 18.00, 'Skate Air Flush Plate Vertical, Alpine White', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('6c62d6d2-21f7-4875-a37b-9946f72a8de2', NULL, 'Side Shower', 'RSH AQUA 75 sideshower 3,3l round', 'EGRGP1DC01319', '26801DC0', 23000.00, 18400.00, 100, 'percent', 'e7e9c8e8-32f0-45e6-a605-883d23b45acb', 10, 18.00, 'RSH AQUA 75 sideshower 3,3l round', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('6d536552-9ef1-4563-a556-7c8d01f8b83a', NULL, 'Shower Accessories', 'Grandera wall union', 'EGRGP7IG01527', '26897IG0', 27300.00, 21840.00, 100, 'percent', '4434547e-b77a-40d2-964c-844539b50ff1', 10, 18.00, 'Grandera wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('7118d031-359e-43c2-bf55-f0fa19618934', NULL, 'Hand Dryers', 'High speed hand dryer(Silver)', 'EAS80172147', 'FFAS8017-000230BA0', 53850.00, 43080.00, 100, 'percent', 'cec108ae-a8a4-4a1d-974d-8b6bee967756', 10, 18.00, 'High speed hand dryer(Silver)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('734db0e1-fa2f-441e-bc0e-67bbd36f15ca', NULL, 'Flush Plate', 'Classic Flush Plate, Chrome', 'EGRGB40002039', '37053000', 8550.00, 6840.00, 100, 'percent', '2b75178f-74d6-4f3c-a5ee-e98a2e7a06f7', 10, 18.00, 'Classic Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('74852469-23c6-4b0a-80da-e5dab7319de8', NULL, 'Side Shower', 'RSH AQUA 75x75 sideshw 3,3l square', 'EGRGP2DL01326', '26802DL0', 24400.00, 19520.00, 100, 'percent', '29c756bb-d021-4bb0-812e-54e12bdb7dad', 10, 18.00, 'RSH AQUA 75x75 sideshw 3,3l square', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('754ccec9-77b8-4ad3-a2bb-48a2dfefddbf', NULL, 'Digital', 'Rough-In Light Module', 'EGRGP20001532', '29412000', 34550.00, 27640.00, 100, 'percent', '5f217919-9239-4bc0-9343-78eb5f9c5116', 10, 18.00, 'Rough-In Light Module', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('7827ac7c-4849-4646-bb6c-38401f03c08a', NULL, 'Flush Plate', 'Skate Air Flush Plate, Chrome', 'EGRGB40002036', '38506000', 5450.00, 4360.00, 100, 'percent', '5eb14351-9265-4825-995a-8a6ea1af945e', 10, 18.00, 'Skate Air Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('7936439d-e436-4768-a9fc-8b0788368023', NULL, 'Hygiene Spray', 'Jet washer w/120cm PVC hose and holder', 'EASP4052148', 'CLTP405-CHZZ', 2300.00, 1840.00, 100, 'percent', '1037339e-6920-460f-bf49-326b93c39a16', 10, 18.00, 'Jet washer w/120cm PVC hose and holder', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('7d0cec93-b7e4-4c90-b371-01500425eadf', NULL, 'Drain Technology (Traps)', 'P-TRAP FOR LAVATORY,LONG TAIL PIECE,C', 'EAS81002132', 'F78100-CHACTLS', 5050.00, 4040.00, 100, 'percent', '1c611ebf-1dbd-4f11-8516-2b8c538f4a9a', 10, 18.00, 'P-TRAP FOR LAVATORY,LONG TAIL PIECE,C', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('7d0d216a-5438-48e1-b395-7ceb76d55569', NULL, 'Drain Technology (Traps)', 'ABS BOTTLE TRAP, CHROME PLATED (A-810"', 'EAS81042137', 'F78104-CHADYN', 2750.00, 2200.00, 100, 'percent', '85ac0b4a-6233-4695-bdfd-82084b8a1003', 10, 18.00, 'ABS BOTTLE TRAP, CHROME PLATED (A-810"', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('7d3703f7-1cac-4051-8d2e-63c066255394', NULL, 'Kitchen Cold Only Tap', 'BauLoop Deck-Mount Kitchen Cold Only tap', 'EGRGB40002057', '31222000', 6650.00, 5320.00, 100, 'percent', 'e0ddfbe6-e797-447f-b03a-11c7bbf472d1', 10, 18.00, 'BauLoop Deck-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('806c23af-e7d2-4b2e-9c6a-d71444959a88', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" L-Size with stick', 'EGRGP2113003', '21134000', 130000.00, 104000.00, 100, 'percent', '2369b560-5eda-4c04-b9dc-c54a9c8e28e5', 10, 18.00, 'One-hole basin mixer 1/2" L-Size with stick', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('81a72fa2-691e-4323-9fa9-7ff267a7ed7d', NULL, 'Shower Accessories', 'Euphoria Cube wall union', 'EGRGP0DC01378', '26370DC0', 6100.00, 4880.00, 100, 'percent', '661faaf1-187f-4eb0-8b6b-255102680cbf', 10, 18.00, 'Euphoria Cube wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('8266979b-9de4-4e04-bc2a-90b7346186a5', NULL, 'Head Shower', 'Euphoria 260 Headshower 9.5L', 'EGRGP70001330', '26457000', 20300.00, 16240.00, 100, 'percent', 'dfe47f3b-7619-4ba2-8c21-efa3d147ee59', 10, 18.00, 'Euphoria 260 Headshower 9.5L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('833a5ad7-3451-4c05-95ca-b057194ac8f3', NULL, 'Hand Shower', 'Euphoria Cube+ Stick handshower 9,5l', 'EGRGP5A001354', '26885A00', 16200.00, 12960.00, 100, 'percent', '7030e802-1c07-485a-a035-8d55af2828dc', 10, 18.00, 'Euphoria Cube+ Stick handshower 9,5l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('841831e6-251c-42ea-b78a-c375531db3c3', NULL, 'Digital', 'Base Unit Box 4.0 Bluetooth F-Series 40"', 'EGRGP40001530', '26864000', 276800.00, 221440.00, 100, 'percent', 'e280157c-8c7e-47c2-8d0e-89702b248536', 10, 18.00, 'Base Unit Box 4.0 Bluetooth F-Series 40"', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('86f272e9-d85d-4444-bf6e-98e1758bb198', NULL, 'Head Shower', 'Euphoria 260 Headshower Set 9.5L, 142mm', 'EGRGP10001334', '26461000', 22950.00, 18360.00, 100, 'percent', '95deabf8-4b8f-4593-a7b7-233a19c2476c', 10, 18.00, 'Euphoria 260 Headshower Set 9.5L, 142mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('87956066-2745-4902-950f-c261ac642b0d', NULL, 'Shower Accessories', 'Euphoria Cube Wall Union with Shower Holder', 'EGRGP00001370', '26370000', 3900.00, 3120.00, 100, 'percent', 'b82970f4-4791-4c41-8c27-5c449111b6bb', 10, 18.00, 'Euphoria Cube Wall Union with Shower Holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('8832ad2c-54d4-4713-8302-d662b0f8d2c5', NULL, 'Manual Flush Valve for Toilet', 'Concept Arc Dual Toilet Flush Valve  (40mm  – Low pressure)', 'EAS98082155', 'FFAS9808-000500BA0', 5550.00, 4440.00, 100, 'percent', '11c29fa6-0d33-4386-86f2-0ccaa4d9c22e', 10, 18.00, 'Concept Arc Dual Toilet Flush Valve  (40mm  – Low pressure)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('885b11b5-fabf-454f-9351-f5ba4275274f', NULL, 'Stop Valve', 'STOP VALVE CERAMIC VALVE', 'EAS24302128', '1024362430', 1490.00, 1192.00, 100, 'percent', '683f46e0-f7ef-4f37-ab84-b28bde5007ac', 10, 18.00, 'STOP VALVE CERAMIC VALVE', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('89e8b435-5d8d-4010-955d-c46f5e51f2a1', NULL, 'Basin Mixer - DM', 'Three-hole basin mixer deck mounted for stick\r\nCool Sunrise', 'EGRGP3GL0012', '20593GL0', 144500.00, 115600.00, 100, 'percent', '83f5c2f8-9e7c-45eb-a269-46c39bc98b04', 10, 18.00, 'Three-hole basin mixer deck mounted for stick\r\nCool Sunrise', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('8ef32be2-7891-41d6-b72e-063e3c7757aa', NULL, 'Shower Accessories', 'Rotaflex Metal Shw. Hose 1500', 'EGRGB40002075', '28417001', 7100.00, 5680.00, 100, 'percent', 'd7ab09f8-4f47-44cc-8269-79e0348e7cc8', 10, 18.00, 'Rotaflex Metal Shw. Hose 1500', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('902f7a28-7feb-4693-b0fe-d93762415984', NULL, 'Kitchen Cold Only Tap', 'BauLoop Wall-Mount Kitchen Cold Only tap', 'EGRGB40002061', '31227000', 5950.00, 4760.00, 100, 'percent', 'ad50dd0e-48e4-40f9-8535-8a92d68d1740', 10, 18.00, 'BauLoop Wall-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('906afb96-0b5d-4bab-a790-af9cf5551823', NULL, 'Shower Accessories', 'Silverflex Shower Hose, 1750 mm', 'EGRGB40002084', '28388001', 3700.00, 2960.00, 100, 'percent', 'ff4965a1-5882-4968-a200-5f80974d3c78', 10, 18.00, 'Silverflex Shower Hose, 1750 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('90ba83d4-8994-42e7-bf77-108151fe3c2d', NULL, 'Flush Plate', 'Surf Single Flush Plate, Chrome', 'EGRGB40002029', '37063000', 4900.00, 3920.00, 100, 'percent', '7a76cbf7-d85a-4d4d-bd61-319c3d3ce16a', 10, 18.00, 'Surf Single Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('93e4480b-aadc-49cd-9815-892b053ceca9', NULL, 'Angle Valve', 'Angle Stop', 'EAS44002125', 'F54400-CHACT', 900.00, 720.00, 100, 'percent', '22f94d3b-444b-46c6-9c10-490f824294ba', 10, 18.00, 'Angle Stop', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('963a9989-29d4-45f3-b985-f5f7d4c7c7e0', NULL, 'Grab Bar', 'CF-9403.000.04\\Floor stand Nylon grab ba', 'EAS94032139', 'FFAS9403-000040BC0', 144600.00, 115680.00, 100, 'percent', 'e9259b22-95fe-411a-81ea-65286cd35ea8', 10, 18.00, 'CF-9403.000.04\\Floor stand Nylon grab ba', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('96ac3aa9-8a9c-446f-b577-23a25358f222', NULL, 'Drain Technology (Traps)', 'TUBING TRAP FOR LAVATORY SLIDE PACK', 'EAS81002131', 'F78100-CHADY', 5300.00, 4240.00, 100, 'percent', '130d85ad-eb44-4ff3-8cc4-f3bc995f7f70', 10, 18.00, 'TUBING TRAP FOR LAVATORY SLIDE PACK', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('9bfa72cd-1875-4752-9328-108c1a95e668', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with knob\r\nBrushed Hard Graphite', 'EGRGP2AL0029', '21142AL0', 228750.00, 183000.00, 100, 'percent', '680ce904-a23a-4e4d-b565-c940fcf42cd6', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with knob\r\nBrushed Hard Graphite', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('9ca3964a-d1f9-4759-93a8-073ee505f295', NULL, 'Shower Railset', 'Euphoria Cube Stick Shower Rail Set 900mm', 'EGRGP00001361', '27700000', 30350.00, 24280.00, 100, 'percent', '0c0d6316-ce75-4763-9549-32b2b909b2bb', 10, 18.00, 'Euphoria Cube Stick Shower Rail Set 900mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('9cd3829f-a3b5-4964-8994-87c3e1b08fe5', NULL, 'Kitchen Cold Only Tap', 'BauFlow Deck-Mount Kitchen Cold Only tap', 'EGRGB40002058', '31220000', 6450.00, 5160.00, 100, 'percent', 'eafd2309-058e-4717-a764-c82cb22af6d5', 10, 18.00, 'BauFlow Deck-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('9dab5f09-d518-4b93-b5a8-7bee652fc5d8', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with knob', 'EGRGP2000006', '21142000', 169450.00, 135560.00, 100, 'percent', 'c183f55e-8ea7-4e4f-91b0-0db5973a024f', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with knob', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('9e688231-3160-478a-9d0b-6955572712c6', NULL, 'Head Shower', 'Euphoria 260 Headshower Set, 380mm', 'EGRGP80001331', '26458000', 22950.00, 18360.00, 100, 'percent', '63ef8e93-10f8-4e16-9352-69abbb9d53b2', 10, 18.00, 'Euphoria 260 Headshower Set, 380mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a01f85c9-69c0-42e1-8676-8562c69eb904', NULL, 'Shower Accessories', 'Euphoria Cube Wall Union', 'EGRGP0DL01379', '26370DL0', 6100.00, 4880.00, 100, 'percent', 'c0c27ce4-1bae-44ce-843f-b2c06b420855', 10, 18.00, 'Euphoria Cube Wall Union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a22a9eca-8b9e-4c56-a43b-23cf0e64a329', NULL, 'Hand Shower', 'RSH Grandera Stick handshower 7,6l', 'EGRGP2IG01513', '26852IG0', 26950.00, 21560.00, 100, 'percent', '6acaceec-2499-46b3-8eef-15ec6a31f806', 10, 18.00, 'RSH Grandera Stick handshower 7,6l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a2ced602-1c54-4628-b1b7-30bd0bf36d8f', NULL, 'Manual Flush Valve for Urinal', 'Manual Urinal FV', 'EAS98592158', 'FFAS9859-000500BF0', 4700.00, 3760.00, 100, 'percent', '548ec096-4010-4ed1-804a-0557c7d8c083', 10, 18.00, 'Manual Urinal FV', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a323509f-0923-4bbb-a01d-8c42f1071caa', NULL, 'Shower Accessories', 'Euphoria Cube Shower Rail 600mm', 'EGRGP20001375', '27892000', 25000.00, 20000.00, 100, 'percent', '9118641f-59b0-43b8-90b1-33f9085ba157', 10, 18.00, 'Euphoria Cube Shower Rail 600mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a5e770ad-2e75-4cab-bb62-0fefcbc075f7', NULL, 'Kitchen Cold Only Tap', 'BauCurve Deck-Mount Kitchen Cold Only tap', 'EGRGB40002059', '31221000', 6550.00, 5240.00, 100, 'percent', 'ca587f63-fbfc-4390-bcc3-1831eb61f488', 10, 18.00, 'BauCurve Deck-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a748d353-a9a8-4aa0-89b3-42fc342b87a9', NULL, 'Side Shower', 'RSH AQUA 75x75 sideshw 3,3l square', 'EGRGP2AL01324', '26802AL0', 24400.00, 19520.00, 100, 'percent', 'a51f05b4-701a-434a-b757-44dda4128fba', 10, 18.00, 'RSH AQUA 75x75 sideshw 3,3l square', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a7a237ce-4027-41a0-b0ad-1a09de3cb478', NULL, 'Hand Shower', 'Euphoria Cosmopolitan Stick Hand Shower', 'EGRGP70001343', '\r\n27367000', 8200.00, 6560.00, 100, 'percent', 'd7fee221-b331-4490-b8e3-8cc98cd2e69f', 10, 18.00, 'Euphoria Cosmopolitan Stick Hand Shower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a8389c82-0367-412b-85bf-f87e346838ac', NULL, 'Hygiene Spray', 'DuoSTiX™ Hygiene Spray', 'EASTS282154', 'FFASTS28-000GL0BF0', 3440.00, 2752.00, 100, 'percent', '3bbb96b2-440f-4285-a42a-82edbdb88296', 10, 18.00, 'DuoSTiX™ Hygiene Spray', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a8449b4f-b2c1-433f-9a42-0a42dd137052', NULL, 'Shower Accessories', 'Allure Brilliant wall union', 'EGRGP0DC01509', '26850DC0', 10260.00, 8208.00, 100, 'percent', '9c0f97cc-0fff-4625-a1d6-4ba76901449b', 10, 18.00, 'Allure Brilliant wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('a8461fd6-f5b2-4287-aaf3-608e7a082289', NULL, 'Grab Bar', 'CF-9404.000.04\\L Nylon grab bar(Left)', 'EAS94042142', 'FFAS9404-000040BC0', 51050.00, 40840.00, 100, 'percent', 'a406dcce-6982-43df-a94d-d36034d9b07c', 10, 18.00, 'CF-9404.000.04\\L Nylon grab bar(Left)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('aeca245b-3cb8-4f55-96e0-563d3b76d550', NULL, 'Hand Shower', 'RSH Grandera Stick handshower set 7,6l', 'EGRGP1IG01514', '26901IG0', 56950.00, 45560.00, 100, 'percent', '16c97f2f-dc87-4739-9c88-6a7bc7f3a3c1', 10, 18.00, 'RSH Grandera Stick handshower set 7,6l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('af00e75b-c2ba-4d9a-9d51-c7ad8741e8d1', NULL, 'Shower Accessories', 'Silverflex Shower Hose 1500mm BL', 'EGRGB40002081', '26346001', 3450.00, 2760.00, 100, 'percent', '44211fda-8d7f-4341-b03d-34805ba045e7', 10, 18.00, 'Silverflex Shower Hose 1500mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('af8fc73e-9b1a-49ef-83af-e7fb89f92c32', NULL, 'Shower Accessories', 'Euphoria Cube wall union', 'EGRGP0GL01380', '26370GL0', 6100.00, 4880.00, 100, 'percent', '5556153e-9687-401a-a7de-d2e64a251d91', 10, 18.00, 'Euphoria Cube wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('b1e07912-90e1-4e69-ac6d-c81af29af7e4', NULL, 'Shower Railset', 'Euphoria 110 Duo Shower Rail Set+ Dish 900mm', 'EGRGP50011367', '27225001', 15700.00, 12560.00, 100, 'percent', 'f7edff97-1ef4-4eac-be2a-b7d385f7c801', 10, 18.00, 'Euphoria 110 Duo Shower Rail Set+ Dish 900mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('b29f3d21-bf4e-4cbf-814c-904760309366', NULL, 'Drain Technology (Traps)', 'P-TRAP FOR LAVA LONG TAIL TOP 30 CMS,', 'EAS81002135', 'F78100-CHACTLSTT', 5100.00, 4080.00, 100, 'percent', 'c26ceb7e-5a5e-4671-aced-cfa4ebb3d8dc', 10, 18.00, 'P-TRAP FOR LAVA LONG TAIL TOP 30 CMS,', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('b2e92905-60a9-4c70-a2fe-d4b135f52151', NULL, 'Kitchen Mixer', 'CERAPLAN SINGLE HOLE DECK KITCHEN FAUCET', 'EAS56372124', 'FFAS5637-501500BF0', 12950.00, 10360.00, 100, 'percent', 'a2346155-7b8f-469e-a6f2-9d8fb5dea099', 10, 18.00, 'CERAPLAN SINGLE HOLE DECK KITCHEN FAUCET', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('b517c745-d42e-4fd1-a3e1-1175a989cd4f', NULL, 'Kitchen Mixer', 'BauCurve 1-Handle Kitchen Mixer C-Spout', 'EGRGB40002054', '31231001', 11550.00, 9240.00, 100, 'percent', '9bc2ae8f-9f5d-4720-96bc-a0ad0ac00c18', 10, 18.00, 'BauCurve 1-Handle Kitchen Mixer C-Spout', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('b5e625c0-20dd-4d4f-8a4f-82ccc7234ed9', NULL, 'Basin Mixer - DM', '20593000', 'EGRGP2059001', '20593000', 110000.00, 88000.00, 100, 'percent', 'eaab0c80-5e9a-4a5f-8dfe-e7248cf0fb01', 10, 18.00, '20593000', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('b71be9a7-14ed-47b4-b353-433f95d8f2b0', NULL, 'Hand Shower', 'Euphoria Cube+ Stick handshower 9,5l', 'EGRGP5AL01355', '26885AL0', 16200.00, 12960.00, 100, 'percent', 'aaf6cfba-60dd-4bc3-a135-0a149a772a6d', 10, 18.00, 'Euphoria Cube+ Stick handshower 9,5l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('ba28eb4e-bbe5-4739-88aa-06d741da4e3c', NULL, 'Hand Shower', 'Euphoria 110 Massage Hand Shower', 'EGRGP10001339', '27221000', 9700.00, 7760.00, 100, 'percent', '1eb3e1d6-789c-4d38-b58f-f194887d21d1', 10, 18.00, 'Euphoria 110 Massage Hand Shower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('bac381b5-d560-4b2e-a4f7-63606132520b', NULL, 'Basin Mixer - DM', 'Acc: white Caesarstone inlay set 1 (2x) for basin\r\nOHM L- and XL-size', 'EGRGP4845007', '48456000', 35500.00, 28400.00, 100, 'percent', 'edd0da15-3e09-4c4a-9eb1-d1b8b471e2ab', 10, 18.00, 'Acc: white Caesarstone inlay set 1 (2x) for basin\r\nOHM L- and XL-size', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('be168b26-a3f8-4789-948b-5c6c85d85bc2', NULL, 'Shower Accessories', 'Grandera Wall Union', 'EGRGP70001521', '26897000', 22300.00, 17840.00, 100, 'percent', '21002086-ba48-47ad-922f-a9c3064c8216', 10, 18.00, 'Grandera Wall Union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('be3c94bd-bce8-4f6a-8bad-27942f857f9d', NULL, 'Shower Accessories', 'Grandera Wall Shower Arm 285mm', 'EGRGP00001523', '26900000', 15710.00, 12568.00, 100, 'percent', '005c8cd8-1919-4290-b98a-ac76eda1f5f6', 10, 18.00, 'Grandera Wall Shower Arm 285mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('bf738f22-b1a4-4337-97fc-ee5449da0f84', NULL, 'Basin Mixer - DM', 'Three-hole basin mixer deck mounted for stick\r\nSuperSteel', 'EGRGP3DC0011', '20593DC0', 144500.00, 115600.00, 100, 'percent', '1cea7faf-fd0e-4795-968b-cb5dc5d9c967', 10, 18.00, 'Three-hole basin mixer deck mounted for stick\r\nSuperSteel', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('bfa71ba2-2173-496d-8740-665917a7001d', NULL, 'Shower Railset', 'RSH Grandera Stick shw rail set 900 7,6l', 'EGRGP31G01519', '26853IG0', 61050.00, 48840.00, 100, 'percent', 'd7b85510-c439-46f2-92e4-cc62f0f8a2ea', 10, 18.00, 'RSH Grandera Stick shw rail set 900 7,6l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c098f4c0-36c9-485d-8c72-5dd274fd8134', NULL, 'Shower Railset', 'Euphoria Cube+ Stick Rail Set 600mm 9.5L', 'EGRGP10001360', '27891000', 33050.00, 26440.00, 100, 'percent', 'f7bda490-5f1f-44fb-8867-aefb35754624', 10, 18.00, 'Euphoria Cube+ Stick Rail Set 600mm 9.5L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c1e69b5b-ef53-449c-a6d7-9e141ae29881', NULL, 'Kitchen Cold Only Tap', 'BauEdge Wall-Mount Kitchen Cold Only tap', 'EGRGB40002060', '31228000', 6050.00, 4840.00, 100, 'percent', '2faab611-5977-4230-a37a-a9f98068755c', 10, 18.00, 'BauEdge Wall-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c2889bcd-e881-4468-9db0-9c59f0402b3f', NULL, 'Shower Accessories', 'Allure Brilliant Shower Holder', 'EGRGP70001504', '26847000', 5350.00, 4280.00, 100, 'percent', '22b96b96-637c-4c23-bf26-be2f09cda010', 10, 18.00, 'Allure Brilliant Shower Holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c3bdd96b-8f16-4066-99ce-c7c8e2bb7e22', NULL, 'Flush Plate', 'Skate Cosmopolitanflush Plate, Cool Sunrise', 'EGRGB40002045', '38732GL0', 12350.00, 9880.00, 100, 'percent', '28fbfa95-6302-4e94-ab5e-8d5558d73141', 10, 18.00, 'Skate Cosmopolitanflush Plate, Cool Sunrise', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c3c6a2c8-1cf6-4b7d-93fd-f18e11211a8b', NULL, 'Shower Railset', 'Euphoria 110 Massage Shower Rail Set 900mm', 'EGRGP60011365', '27226001', 19400.00, 15520.00, 100, 'percent', '258a43ba-2a0b-4982-94f3-bad49018d5b6', 10, 18.00, 'Euphoria 110 Massage Shower Rail Set 900mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c440728c-7577-4f7d-b318-7b03d38f2cf8', NULL, 'Flush Plate', 'Surf Flush Plate, Alpine White', 'EGRGB40002032', '37018SH0', 2440.00, 1952.00, 100, 'percent', '91293ece-11a5-443f-8453-2750aeffad09', 10, 18.00, 'Surf Flush Plate, Alpine White', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c4d33fe7-0364-46a8-929c-eaaae2c27662', NULL, 'Shower Accessories', 'Grandera wall union', 'EGRGP7DA01526', '26897DA0', 26550.00, 21240.00, 100, 'percent', 'ff4f8859-f589-4b55-9918-b90ba1bea253', 10, 18.00, 'Grandera wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c5a3f182-316d-4106-bab8-6b22c60ed6e1', NULL, 'Shower Accessories', 'Silverflex Shower Hose, 1250 mm', 'EGRGB40002082', '28362001', 2500.00, 2000.00, 100, 'percent', 'e226b769-a656-46ad-9226-a6fe2690d381', 10, 18.00, 'Silverflex Shower Hose, 1250 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c7573304-f353-4705-a45c-59dfe3014575', NULL, 'Hand Shower', 'Euphoria Cube+ Stick handshower 9,5l', 'EGRGP5DC01356', '26885DC0', 16200.00, 12960.00, 100, 'percent', '728ef2c1-0e50-4a56-9543-8b0085363005', 10, 18.00, 'Euphoria Cube+ Stick handshower 9,5l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c7de17a3-6d78-4d5c-b1c2-de8fbb864e54', NULL, 'Shower Accessories', 'Euphoria Cube wall union', 'EGRGP0GLC1381', '26370GLC', 6100.00, 4880.00, 100, 'percent', 'daaad6ad-06cf-4e5c-9a7a-224d99612b11', 10, 18.00, 'Euphoria Cube wall union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('c9b5c0df-d8e6-47ce-8752-62ef42c627e0', NULL, 'Head Shower', 'Euphoria Cosmopolitan 180 Headshower', 'EGRGP20001336', '27492000', 13950.00, 11160.00, 100, 'percent', '272659a4-86ed-4314-b0f7-841cbdea0975', 10, 18.00, 'Euphoria Cosmopolitan 180 Headshower', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('cd0344e6-970f-40a5-868b-b051d9f69d0c', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with stick\r\nWarm Sunset', 'EGRGP0DA0026', '21140DA0', 181250.00, 145000.00, 100, 'percent', '7fa69aa3-39a7-45b0-9599-55cdbff2617d', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with stick\r\nWarm Sunset', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('cd35dc1a-ddc6-4591-bebf-70553f19e31f', NULL, 'Flush Plate', 'Skate Air Flush Plate Chrome', 'EGRGB40002037', '38564000', 4900.00, 3920.00, 100, 'percent', '14c6fcca-977d-4ca5-8d4b-36caf685deda', 10, 18.00, 'Skate Air Flush Plate Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('ce378852-1841-455c-8daa-24a309f7e8fc', NULL, 'Head Shower', 'Euphoria Cosmopolitan 160 Headshower 9.5L', 'EGRGP30001337', '28233000', 10600.00, 8480.00, 100, 'percent', '6fd881d9-fc28-4492-86ac-baa1ee28a4bc', 10, 18.00, 'Euphoria Cosmopolitan 160 Headshower 9.5L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('d731e238-98af-4373-94ff-d5d180a32d9e', NULL, 'Head Shower', 'Grandera 210 Headshower without Arm', 'EGRGP80001515', '26898000', 78250.00, 62600.00, 100, 'percent', '40884a9f-999a-4403-9c07-940658a9142d', 10, 18.00, 'Grandera 210 Headshower without Arm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('d75cc07a-32f8-4c1b-9853-ae44b87b468d', NULL, 'Shower Accessories', 'Grandera shower holder', 'EGRGP6DA01524', '26896DA0', 16600.00, 13280.00, 100, 'percent', 'f78e45e3-061d-4a45-a026-af22901b9205', 10, 18.00, 'Grandera shower holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('daec0c88-17e9-412a-97fa-4ac5f3bfd229', NULL, 'Head Shower', 'Euphoria Cube 152 Headshower 9.5L', 'EGRGP50001335', '27705000', 20900.00, 16720.00, 100, 'percent', 'ccbc5d1f-cbee-44ea-8388-16809e17f2d5', 10, 18.00, 'Euphoria Cube 152 Headshower 9.5L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('db128634-a9f4-4b7f-8500-f1abccb58cff', NULL, 'Hand Shower', 'Euphoria 110 Massage Hand Shower 9.5L', 'EGRGP90001341', '27239000', 9800.00, 7840.00, 100, 'percent', '0e084ee1-0b08-41a7-a932-cc2a42b686dc', 10, 18.00, 'Euphoria 110 Massage Hand Shower 9.5L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('db8c9504-9374-4bd8-a38d-e35fd5a2c992', NULL, 'Shower Accessories', 'Relexaflex Shower Hose 1500mm BL', 'EGRGB40002069', '28151002', 2550.00, 2040.00, 100, 'percent', '449b313e-2af1-462a-a166-05ba7799be24', 10, 18.00, 'Relexaflex Shower Hose 1500mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('dbdc131c-80e6-45fb-b762-a99b0a799da8', NULL, 'Basin Mixer - DM', 'Three-hole basin mixer deck mounted for stick\r\nBrushed Hard Graphite', 'EGRGP3AL0009', '20593AL0', 144500.00, 115600.00, 100, 'percent', 'c7a069ca-ac74-4bb6-8876-a10a41009288', 10, 18.00, 'Three-hole basin mixer deck mounted for stick\r\nBrushed Hard Graphite', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('dc88fa1a-e24e-4b76-8f8e-486bad916c0b', NULL, 'Hand Dryers', 'High speed hand dryer(white)', 'EAS80172146', 'FFAS8017-000090BA0', 53850.00, 43080.00, 100, 'percent', 'd93f3a76-490a-4f4f-94df-681277417a5e', 10, 18.00, 'High speed hand dryer(white)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('dc8b2a78-f9d9-4288-a412-065d5a6f981f', NULL, 'Shower Accessories', 'Rotaflex Shower Hose 1500mm BL', 'EGRGB40002077', '28409002', 2750.00, 2200.00, 100, 'percent', 'e232aaae-8c95-4679-a31c-a9539f13cff3', 10, 18.00, 'Rotaflex Shower Hose 1500mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('de94ceba-71db-47bc-8da4-eef0201b24c2', NULL, 'Grab Bar', 'CF-9402.000.04\\Nylon grab bar', 'EAS94022144', 'FFAS9402-000040BC0', 46500.00, 37200.00, 100, 'percent', '430226d6-6d7b-4c62-82a2-608daeb24d9f', 10, 18.00, 'CF-9402.000.04\\Nylon grab bar', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('df3d7301-b3dd-4e72-921f-366204a136e5', NULL, 'Shower Accessories', 'Euphoria Cube wall union CN', 'EGRGP0ALC1377', '26370ALC', 6100.00, 4880.00, 100, 'percent', '07faa135-7d02-489a-8fe7-0204624e0f2d', 10, 18.00, 'Euphoria Cube wall union CN', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('df9bff2e-31c8-4592-9ea9-4a0d34ff9587', NULL, 'Manual Flush Valve for Toilet', 'Concept Arc Dual Flush Valve Trim', 'EAS98102157', 'FFAS9810-000500BA0', 1300.00, 1040.00, 100, 'percent', 'c131149d-bd6e-45de-a7cb-d73eededc12b', 10, 18.00, 'Concept Arc Dual Flush Valve Trim', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e069e294-b3d4-4e2c-bb29-8859c3cd3e00', NULL, 'Kitchen Mixer', 'BauLoop 1-Handle Kitchen Mixer C-Spout', 'EGRGB40002052', '31232001', 11750.00, 9400.00, 100, 'percent', 'eaba9a90-1843-4049-883e-fa9ccd856d58', 10, 18.00, 'BauLoop 1-Handle Kitchen Mixer C-Spout', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e26087fc-b0f9-4ce1-8809-f77cf3acb8eb', NULL, 'Flush Plate', 'Surf Single Flush Plate, Chrome', 'EGRGB40002031', '38574000', 4200.00, 3360.00, 100, 'percent', '739fbe00-9720-41ff-afe7-7df901a93390', 10, 18.00, 'Surf Single Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e272d52e-2f8b-4f4f-8a4e-7b0ddd03433c', NULL, 'Kitchen Cold Only Tap', 'BauEdge Deck-Mount Kitchen Cold Only tap', 'EGRGB40002056', '31223000', 6750.00, 5400.00, 100, 'percent', '156ae1c5-b593-4db7-a105-a4843c92be9c', 10, 18.00, 'BauEdge Deck-Mount Kitchen Cold Only tap', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e7323a15-1024-474b-bb1c-29b00d96d7c2', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size for stick', 'EGRGP0DC0027', '21140DC0', 181250.00, 145000.00, 100, 'percent', 'a13f504a-c619-4367-af5d-85c0f5fb4e1f', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size for stick', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e7ae2097-4424-4c28-819e-d548cdfdcdce', NULL, 'Digital', 'Rough-In Sound Module', 'EGRGP30001533', '29413000', 34550.00, 27640.00, 100, 'percent', '5bf16b8a-39d9-4b71-82bd-b7f033a90696', 10, 18.00, 'Rough-In Sound Module', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e7f6a295-32ac-486c-8496-256ee6b7f975', NULL, 'Hygiene Spray', 'DuoSTiX Hygiene Spray (Chrome & Matte Bl', 'EASTS282151', 'FFASTS28-000440BF0', 3000.00, 2400.00, 100, 'percent', '1b29863f-98b3-4103-ad45-5a02a66745de', 10, 18.00, 'DuoSTiX Hygiene Spray (Chrome & Matte Bl', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('e9d020de-eea0-4c85-ae32-b93525058b8f', NULL, 'Drain Technology (Traps)', 'P-TRAP FOR LAVA LONG TAIL TOP 25 CMS,', 'EAS81002133', 'F78100-CHACTLST', 5150.00, 4120.00, 100, 'percent', 'deb06fd4-2a6b-47c6-96fb-be1b23c79503', 10, 18.00, 'P-TRAP FOR LAVA LONG TAIL TOP 25 CMS,', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('ec1a5462-af14-4705-9e0b-baf78119a5bb', NULL, 'Drain Technology (Traps)', 'BOTTLE TRAP FOR LAVATORY - CHROME', 'EAS81022134', 'F78102-CHADYN', 5100.00, 4080.00, 100, 'percent', 'fdaa1d88-8f78-418a-833a-4fa0ae97d50b', 10, 18.00, 'BOTTLE TRAP FOR LAVATORY - CHROME', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('ec7df46f-c553-46f0-b29a-82bf9d82d142', NULL, 'Head Shower', 'Euphoria 260 Headshower Set 9.5L, 380mm', 'EGRGP90001332', '26459000', 22950.00, 18360.00, 100, 'percent', '169eddf2-2819-491c-adda-f27e64a6ccc4', 10, 18.00, 'Euphoria 260 Headshower Set 9.5L, 380mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('ecb9f610-aa5e-4317-9aa5-d4e0f4b84dac', NULL, 'Side Shower', 'RSH AQUA 75x75 sideshw 3,3l square', 'EGRGP2A001323', '26802A00', 24400.00, 19520.00, 100, 'percent', '749e939a-97a1-46c6-8e30-acb0763e6315', 10, 18.00, 'RSH AQUA 75x75 sideshw 3,3l square', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('eda60b16-c4ae-4160-a0fb-77531daf3804', NULL, 'Shower Accessories', 'Euphoria Cube Shower Rail 900mm', 'EGRGP10001374', '27841000', 26400.00, 21120.00, 100, 'percent', 'ff3c49a2-3bb9-4f86-96dc-86e5fab16754', 10, 18.00, 'Euphoria Cube Shower Rail 900mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('ee7b0346-b54c-4bf4-b7b1-35194ff40cdd', NULL, 'Grab Bar', 'L  Nylon grab bar(Right)', 'EAS94052143', 'FFAS9405-000040BC0', 51050.00, 40840.00, 100, 'percent', '4d6d9786-385d-4e75-9625-d39e56c42a8f', 10, 18.00, 'L  Nylon grab bar(Right)', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f145e49a-1e7a-4e4a-ba71-63aec6e4b9ed', NULL, 'Basin Mixer - DM', 'One-hole basin mixer 1/2" XL-Size with knob\r\nCool Sunrise', 'EGRGP2GL0032', '21142GL0', 228750.00, 183000.00, 100, 'percent', '1af968a2-11bd-4dc9-95af-592b1d54ae50', 10, 18.00, 'One-hole basin mixer 1/2" XL-Size with knob\r\nCool Sunrise', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f161b632-b2a0-48d4-9a6a-fa93ae555646', NULL, 'Shower Accessories', 'Allure Brilliant shower holder', 'EGRGP7DC01507', '26847DC0', 6670.00, 5336.00, 100, 'percent', 'd948396c-d7ea-4594-b20f-c3565353c7de', 10, 18.00, 'Allure Brilliant shower holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f2876308-ae4f-46e2-8634-63d2c89f1351', NULL, 'Head Shower', 'Euphoria 260 Headshower 6, 6L', 'EGRGP60001329', '26456000', 20300.00, 16240.00, 100, 'percent', '8bec46b8-d955-4452-8fbd-fb7d98d059f1', 10, 18.00, 'Euphoria 260 Headshower 6, 6L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f2da781e-ca22-4d8a-9573-ac1f744ded1f', NULL, 'Side Shower', 'RSH AQUA 75 sideshower 3,3l round', 'EGRGP1GN01322', '26801GN0', 23000.00, 18400.00, 100, 'percent', 'a77c259f-403c-4b47-8efe-f19f3e605258', 10, 18.00, 'RSH AQUA 75 sideshower 3,3l round', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f36f4727-0f9a-43bb-b218-b2b7acd108b8', NULL, 'Shower Accessories', 'Metal Tube 1500 mm', 'EGRGB40002064', '28105001', 4850.00, 3880.00, 100, 'percent', 'd394c5a7-3876-477c-94d0-ec2b1f5312c9', 10, 18.00, 'Metal Tube 1500 mm', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f393b227-33fd-4c70-b660-fb2bd2706c1e', NULL, 'Shower Accessories', 'Grandera shower holder', 'EGRGP6IG01525', '26896IG0', 17420.00, 13936.00, 100, 'percent', 'e413d953-b8dd-492d-909e-9c9c7d59ca0c', 10, 18.00, 'Grandera shower holder', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f5642730-8682-47f1-ac83-571f78a2387d', NULL, 'Grab Bar', 'Turnup Nylon grab bar', 'EAS94012141', 'FFAS9401-000040BC0', 122850.00, 98280.00, 100, 'percent', '9726b800-8f32-4f89-807b-6c9fe7e9dea6', 10, 18.00, 'Turnup Nylon grab bar', '"[]"', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f597a0ca-4dd9-4bb5-bdbb-d707638f6077', NULL, 'Shower Railset', 'Grandera Stick Shower Rail Set 900mm 7.6L', 'EGRGP30001518', '26853000', 44800.00, 35840.00, 100, 'percent', '0039eceb-36d3-4ac4-ae50-5e995829995c', 10, 18.00, 'Grandera Stick Shower Rail Set 900mm 7.6L', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f5beef63-5087-4108-99d1-162f390cb9a0', NULL, 'Side Shower', 'RSH AQUA 75x75 sideshw 3,3l square', 'EGRGP2GN01327', '26802GN0', 24400.00, 19520.00, 100, 'percent', '671f50f8-7144-42ee-bebd-961fe7003fcc', 10, 18.00, 'RSH AQUA 75x75 sideshw 3,3l square', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('f7cc81b8-c409-49a3-a3e4-6b5ad5f54859', NULL, 'Shower Accessories', 'Relexaflex Shower Hose 1250 mm BL', 'EGRGB40002068', '28150002', 2300.00, 1840.00, 100, 'percent', '5fe753a0-94af-4119-abd7-7e06f333d4bc', 10, 18.00, 'Relexaflex Shower Hose 1250 mm BL', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('fa430a16-27eb-4b7e-b836-305df0468991', NULL, 'Shower Accessories', 'Euphoria Cube Wall Union', 'EGRGP0AL01376', '26370AL0', 6100.00, 4880.00, 100, 'percent', '53359573-4429-4dd0-8271-fad16ae06d8d', 10, 18.00, 'Euphoria Cube Wall Union', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('fb504eb8-a97f-4cb5-8966-ad06d7c08b16', NULL, 'Shower Railset', 'Euphoria 110 Duo Shower Rail Set+ Dish 600mm', 'EGRG00011368', '27230001', 15300.00, 12240.00, 100, 'percent', 'aabf82e0-166a-49a2-acb2-1036ac165f29', 10, 18.00, 'Euphoria 110 Duo Shower Rail Set+ Dish 600mm', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('fd29a56e-d8e8-4f93-9242-897165155ae1', NULL, 'Basin Mixer - DM', 'Three-hole basin mixer deck mounted for stick\r\nWarm Sunset', 'EGRGP3DA0010', '20593DA0', 144500.00, 115600.00, 100, 'percent', '4cdf44c6-7d37-405e-8af1-f3aa76f1e63f', 10, 18.00, 'Three-hole basin mixer deck mounted for stick\r\nWarm Sunset', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('fd8c659e-284e-4d4c-8b14-e2326550e75a', NULL, 'Kitchen Mixer', 'BauEdge 1-Handle Kitchen Mixer C-Spout', 'EGRGB40002051', '31233001', 11950.00, 9560.00, 100, 'percent', '759e3e3f-3545-432c-bb3a-31405281f85c', 10, 18.00, 'BauEdge 1-Handle Kitchen Mixer C-Spout', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'e84647d5-98d8-46b5-bbae-43e140ff81f2', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('fe22ebe9-7fd5-4578-9637-e74e5bf99953', NULL, 'Flush Plate', 'Nova Cosmopolitan Flush Plate, Chrome', 'EGRGB40002041', '38765000', 4950.00, 3960.00, 100, 'percent', 'cfe0feb5-9003-41a8-a3f1-073cbdfbbd37', 10, 18.00, 'Nova Cosmopolitan Flush Plate, Chrome', '"[]"', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', '748a1b48-aa57-440f-9d85-f6a544b094d5', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0),
	('fed02ff0-a1dd-4dab-ae52-0d331e8de560', NULL, 'Hand Shower', 'Euphoria Cube+ Stick handshower 9,5l', 'EGRGP5GN01358', '26885GN0', 16200.00, 12960.00, 100, 'percent', 'e444f5aa-96c3-456e-8a91-37b5545383b0', 10, 18.00, 'Euphoria Cube+ Stick handshower 9,5l', '"[]"', '13847c2c-3c91-4bb2-a130-f94928658237', '0e718b1d-a0ab-47a7-bb51-021e522b5596', '2025-03-01 10:19:10', '2025-03-01 10:19:10', NULL, 0);

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
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `Quotations_createdBy_fk` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_fk_customer` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_66` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_67` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_68` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_69` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_70` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_71` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_72` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.quotations: ~11 rows (approximately)
INSERT INTO `quotations` (`quotationId`, `document_title`, `quotation_date`, `due_date`, `reference_number`, `include_gst`, `gst_value`, `products`, `discountType`, `roundOff`, `finalAmount`, `signature_name`, `signature_image`, `createdAt`, `updatedAt`, `customerId`, `createdBy`) VALUES
	('06c554b0-15a1-49b8-b3b7-912de4fa8dd6', 'TEST 1234455', '2025-03-19', '2025-05-02', '8278978827', 1, 2.50, '[{"qty": 1, "tax": 0, "name": "Grandera Ceiling Shower Arm 142mm", "total": 11510, "images": "[]", "barcode": "bd5838d4-e2ab-449d-85b7-f037bf60cee9", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": "percent", "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "1d2343f6-af57-45be-8155-0ea1ac6d0bc9", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Grandera Ceiling Shower Arm 142mm", "company_code": "26899000", "discountType": "percent", "productGroup": "Shower Accessories", "product_code": "EGRGP90001522", "sellingPrice": "11510.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "9208.00"}, {"qty": 1, "tax": 0, "name": "Euphoria 260 Headshower Set 142mm", "total": 22950, "images": "[]", "barcode": "d8e0a60b-253b-4867-bf7a-5e9d2658d21f", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": "percent", "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "32c60a6d-9543-41fa-bce3-a4290d3569db", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Euphoria 260 Headshower Set 142mm", "company_code": "26460000", "discountType": "percent", "productGroup": "Head Shower", "product_code": "EGRGP00001333", "sellingPrice": "22950.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "18360.00"}, {"qty": 1, "tax": 0, "name": "Brass chromed/ABS 40 cm long", "total": 6200, "images": "[]", "barcode": "3cb6f78c-fdc4-4e69-9cb7-af8d1bc17a23", "brandId": "4e3acf32-1e47-4d38-a6bb-417addd52ac0", "user_id": null, "discount": "percent", "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "049acce1-3390-4452-bc18-1dd2fbff10df", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Brass chromed/ABS 40 cm long", "company_code": "F78108-CHADYBR", "discountType": "percent", "productGroup": "Drain Technology (Traps)", "product_code": "EAS81082130", "sellingPrice": "6200.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "4960.00"}]', 'percent', 2.50, 41679.00, 'Sachin', '', '2025-03-17 04:40:23', '2025-03-17 04:40:23', 'db5daa16-f57d-426b-8093-c81c8d209ac3', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('1b4e7469-23f7-44dc-ab48-8e12f3676faa', 'Test Quotation 6', '2025-05-07', '2025-11-09', 'QTN-009', 1, 18.00, '[{"MRP": 144500, "Brand_Slug": "13847c2c-3c91-4bb2-a130-f94928658237", "Category_Id": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "Vendor_Slug": "V_3", "Company Code": "20593AL0", "Product Code": "EGRGP3AL0009", "Product group": "Basin Mixer - DM", "Product Segment": "Bathroom Fittings", "Product Description": "Three-hole basin mixer deck mounted for stick"}]', 'percent', 50.00, 120000.00, 'John Doe', 'base64_encoded_string', '2025-03-13 06:23:40', '2025-03-13 06:23:40', '09e042f3-b3e4-4889-a21e-71a95af8125e', '6208fc6a-45a3-4563-af1f-a63c294fd3bf'),
	('33ad626e-ef68-4686-b374-1c54d0b694d7', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-12345', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-here"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-here"}]', 'percent', 2.50, 0.00, 'John Do', 'base64string', '2025-03-13 07:45:32', '2025-03-13 07:45:32', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('485922da-8fda-4161-8b61-6466569786aa', 'Test Quotation 2', '2025-03-04', '2025-05-05', 'QTN-002', 1, 18.00, '[{"MRP": 144500, "Brand_Slug": "13847c2c-3c91-4bb2-a130-f94928658237", "Category_Id": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "Vendor_Slug": "V_3", "Company Code": "20593AL0", "Product Code": "EGRGP3AL0009", "Product group": "Basin Mixer - DM", "Product Segment": "Bathroom Fittings", "Product Description": "Three-hole basin mixer deck mounted for stick"}]', 'percent', 50.00, 120000.00, 'John Doe', 'base64_encoded_string', '2025-03-12 05:58:29', '2025-03-12 05:58:29', '09e042f3-b3e4-4889-a21e-71a95af8125e', '6208fc6a-45a3-4563-af1f-a63c294fd3bf'),
	('54988ab8-0aa5-42ef-acb1-357cfe716806', 'New Quotation', '2025-03-13', '2025-04-01', 'REF-12345', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-here"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-here"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:35:11', '2025-03-13 07:35:11', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('76db8d82-b27a-43e6-8297-c30b83803884', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:52:07', '2025-03-13 07:52:07', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('80fec02f-6701-4e1b-a4b6-e0929fd5290f', 'TEST 1234455', '2025-03-19', '2025-05-02', '8278978827', 1, 2.50, '[{"qty": 1, "tax": 0, "name": "Grandera Ceiling Shower Arm 142mm", "total": 11510, "images": "[]", "barcode": "bd5838d4-e2ab-449d-85b7-f037bf60cee9", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": 0, "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "1d2343f6-af57-45be-8155-0ea1ac6d0bc9", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Grandera Ceiling Shower Arm 142mm", "company_code": "26899000", "discountType": "percent", "productGroup": "Shower Accessories", "product_code": "EGRGP90001522", "sellingPrice": "11510.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "9208.00"}, {"qty": 1, "tax": 0, "name": "Euphoria 260 Headshower Set 142mm", "total": 22950, "images": "[]", "barcode": "d8e0a60b-253b-4867-bf7a-5e9d2658d21f", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": 0, "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "32c60a6d-9543-41fa-bce3-a4290d3569db", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Euphoria 260 Headshower Set 142mm", "company_code": "26460000", "discountType": "percent", "productGroup": "Head Shower", "product_code": "EGRGP00001333", "sellingPrice": "22950.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "18360.00"}, {"qty": 1, "tax": 0, "name": "Brass chromed/ABS 40 cm long", "total": 6200, "images": "[]", "barcode": "3cb6f78c-fdc4-4e69-9cb7-af8d1bc17a23", "brandId": "4e3acf32-1e47-4d38-a6bb-417addd52ac0", "user_id": null, "discount": 0, "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "049acce1-3390-4452-bc18-1dd2fbff10df", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Brass chromed/ABS 40 cm long", "company_code": "F78108-CHADYBR", "discountType": "percent", "productGroup": "Drain Technology (Traps)", "product_code": "EAS81082130", "sellingPrice": "6200.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "4960.00"}]', 'percent', 2.50, 41679.00, 'Sachin', '', '2025-03-17 04:46:39', '2025-03-17 04:46:39', 'db5daa16-f57d-426b-8093-c81c8d209ac3', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('98e67b0f-02cb-4cc7-a28c-b09fcfe0d20c', 'Test Quotation', '2025-03-04', '2025-04-04', 'QTN-001', 1, 18.00, '[{"MRP": 144500, "Brand_Slug": "13847c2c-3c91-4bb2-a130-f94928658237", "Category_Id": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "Vendor_Slug": "V_3", "Company Code": "20593AL0", "Product Code": "EGRGP3AL0009", "Product group": "Basin Mixer - DM", "Product Segment": "Bathroom Fittings", "Product Description": "Three-hole basin mixer deck mounted for stick"}]', 'percent', 50.00, 120000.00, 'John Doe', 'base64_encoded_string', '2025-03-12 05:49:26', '2025-03-12 05:49:26', '09e042f3-b3e4-4889-a21e-71a95af8125e', '6208fc6a-45a3-4563-af1f-a63c294fd3bf'),
	('b1774b0a-7c15-4083-87c9-f8fc2ba56d1b', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:48:46', '2025-03-13 07:48:46', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('d6237d5e-99db-43c6-bb9c-5addc84de0b9', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:48:17', '2025-03-13 07:48:17', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('e7f5a181-5ca8-4def-9666-f41379136db1', 'New Quotation 6', '2025-03-17', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-17 04:10:24', '2025-03-17 04:10:24', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c');

-- Dumping structure for table spsyn8lm_rocklime_dashboard.rolepermissions
CREATE TABLE IF NOT EXISTS `rolepermissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RolePermissions_permissionId_roleId_unique` (`roleId`,`permissionId`),
  KEY `permissionId` (`permissionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.rolepermissions: ~1 rows (approximately)
INSERT INTO `rolepermissions` (`id`, `createdAt`, `updatedAt`, `roleId`, `permissionId`) VALUES
	('a09eb65d-7db9-494c-8da2-cea98015320a', '2025-03-22 08:01:55', '2025-03-22 08:01:55', 'c2eaf23a-765c-4ee5-91bf-cbc37fbdea21', '084a4f97-216b-4570-a3f8-f7eaf02e18bb');

-- Dumping structure for table spsyn8lm_rocklime_dashboard.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `roleName` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `roleName` (`roleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.roles: ~6 rows (approximately)
INSERT INTO `roles` (`roleId`, `roleName`, `createdAt`, `updatedAt`) VALUES
	('0c3392e0-f416-407c-8699-e8638554eba9', 'USERS', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('5bb7eed4-1106-4b93-9218-ad733cfc7b12', 'DEVELOPER', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('c2eaf23a-765c-4ee5-91bf-cbc37fbdea21', 'SUPER_ADMIN', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 'SALES', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('cfbe02d3-c61d-4f09-9bc7-88fb2493f31d', 'ACCOUNTS', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('ffb71a9e-3f2e-4e26-97e4-8611591356b0', 'ADMIN', '2025-03-18 09:59:47', '2025-03-18 09:59:47');

-- Dumping structure for table spsyn8lm_rocklime_dashboard.signatures
CREATE TABLE IF NOT EXISTS `signatures` (
  `signatureId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `signature_name` varchar(255) NOT NULL,
  `signature_image` longblob NOT NULL,
  `mark_as_default` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`signatureId`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.signatures: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_rocklime_dashboard.teammembers
CREATE TABLE IF NOT EXISTS `teammembers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `teamId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userName` varchar(255) NOT NULL,
  `roleId` varchar(255) NOT NULL,
  `roleName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `teamId` (`teamId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.teammembers: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_rocklime_dashboard.teams
CREATE TABLE IF NOT EXISTS `teams` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `adminId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `adminName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.teams: ~0 rows (approximately)

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
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.users: ~3 rows (approximately)
INSERT INTO `users` (`userId`, `username`, `name`, `email`, `mobileNumber`, `roles`, `status`, `password`, `createdAt`, `updatedAt`, `roleId`) VALUES
	('2754cc2c-c5d6-4961-bc41-375df0caa9aa', 'vermadhruv', 'vermadhruv09112002', 'vermadhruv09112002@gmail.com', NULL, 'SALES', 'active', '$2b$10$3RkviShB7gEuY7nj.DP3/ujMGHsQ3Wi.c4e4PYvePRseqjK6emkdC', '2025-03-04 04:29:27', '2025-03-27 06:06:12', 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30'),
	('5d5bd153-8877-4db1-a5cc-2af5c7e55d9c', 'nandmurlibalakrishn', 'nandmurli balakrishn', 'nandmurlibalakrishn@gmail.com', NULL, 'SUPER_ADMIN', 'active', '$2b$10$fCjd0f5naTpvJvS0qkXve.26TZ.1AeTaxabsWba3mNSj2GBbyE9DS', '2025-03-08 04:31:16', '2025-03-08 04:31:16', 'c2eaf23a-765c-4ee5-91bf-cbc37fbdea21'),
	('6208fc6a-45a3-4563-af1f-a63c294fd3bf', 'dhruvermafz', 'dhruv verma', 'dhruvermafz@rocklime.com', NULL, 'USERS', 'active', '$2b$10$lMYcK.pxcLvXwgishy.33urquQu2zo5BoY5uJ/r8QVh3tUCnLHIbq', '2025-03-01 11:02:37', '2025-03-01 11:02:37', NULL);

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
  KEY `vendors_fk_brandId` (`brandId`),
  KEY `vendors_fk_brandSlug` (`brandSlug`),
  CONSTRAINT `vendors_fk_brandId` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_fk_brandSlug` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.vendors: ~5 rows (approximately)
INSERT INTO `vendors` (`id`, `vendorId`, `vendorName`, `brandId`, `brandSlug`, `createdAt`, `updatedAt`) VALUES
	('04a1e87e-baef-49ef-b881-c4ecc0c851a6', 'V_2', 'S4 Bath', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'GB_004', '2025-03-01 10:12:42', '2025-03-01 10:12:42'),
	('18f6e324-5156-42da-8a70-89ec03f93e96', 'V_4', 'Jayna', '25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab', 'JA_003', '2025-03-01 10:12:42', '2025-03-01 10:12:42'),
	('3a4df5ea-e679-4882-8e3e-16004e9c11ce', 'V_1', 'Arth Tiles', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'AS_001', '2025-03-01 10:12:41', '2025-03-01 10:12:41'),
	('bed3059b-c368-4941-8c0a-34c298cc53da', 'V_64', 'riftttt', NULL, 'JA_003', '2025-03-10 10:16:39', '2025-03-10 10:16:39'),
	('d56421ab-772d-4894-8bb5-a675d41cdc76', 'V_3', 'Groha', '13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', '2025-03-01 10:12:42', '2025-03-01 10:12:42');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

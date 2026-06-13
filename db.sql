-- --------------------------------------------------------
-- Host:                         116.206.104.225
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
-- HeidiSQL Version:             12.17.0.7270
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for spsyn8lm_construction_db
CREATE DATABASE IF NOT EXISTS `spsyn8lm_construction_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `spsyn8lm_construction_db`;

-- Dumping structure for table spsyn8lm_construction_db.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `activityLogId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contextTag` enum('AUTH','USER','PROJECT','INVENTORY','BOQ','VENDOR','CLIENT','SITE','TASK','DRAWING','COST_ESTIMATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subContext` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` enum('CREATE','UPDATE','DELETE','VIEW','LOGIN','LOGOUT','ASSIGN','APPROVE','REJECT','DOWNLOAD','UPLOAD') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `referenceId` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referenceType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_unicode_ci,
  `isSystemGenerated` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `severity` enum('INFO','WARNING','ERROR','CRITICAL') COLLATE utf8mb4_unicode_ci DEFAULT 'INFO',
  `moduleName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `oldValues` json DEFAULT NULL,
  `newValues` json DEFAULT NULL,
  PRIMARY KEY (`activityLogId`),
  KEY `idx_activity_user` (`userId`),
  KEY `idx_activity_context` (`contextTag`),
  KEY `idx_activity_action` (`action`),
  KEY `idx_activity_reference` (`referenceId`),
  KEY `idx_activity_created` (`createdAt`),
  KEY `idx_activity_context_action` (`contextTag`,`action`),
  KEY `idx_activity_user_created` (`userId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table spsyn8lm_construction_db.activity_logs: ~0 rows (approximately)
INSERT INTO `activity_logs` (`activityLogId`, `userId`, `userName`, `contextTag`, `subContext`, `action`, `title`, `description`, `referenceId`, `referenceType`, `metadata`, `ipAddress`, `userAgent`, `isSystemGenerated`, `createdAt`, `updatedAt`, `severity`, `moduleName`, `oldValues`, `newValues`) VALUES
	('54d5d939-96bc-4e8e-a1ab-17517e75fdab', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Dhruv Verma', 'AUTH', NULL, 'LOGIN', 'User Logged In', 'Dhruv Verma logged in successfully', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'USER', '{"role": "developer", "email": "dverma@rocklime.com"}', NULL, NULL, 0, '2026-06-09 10:07:04', '2026-06-09 10:07:04', 'INFO', 'Auth', NULL, NULL),
	('b9344e4a-6d6e-49d8-9f06-bc096b74172a', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Dhruv Verma', 'AUTH', NULL, 'LOGIN', 'User Logged In', 'Dhruv Verma logged in successfully', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'USER', '{"role": "developer", "email": "dverma@rocklime.com"}', NULL, NULL, 0, '2026-06-04 14:54:15', '2026-06-04 14:54:15', 'INFO', 'Auth', NULL, NULL),
	('c0bb1444-eb85-486e-88af-954c2a766734', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Dhruv Verma', 'AUTH', NULL, 'LOGIN', 'User Logged In', 'Dhruv Verma logged in successfully', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'USER', '{"role": "developer", "email": "dverma@rocklime.com"}', NULL, NULL, 0, '2026-06-05 11:24:44', '2026-06-05 11:24:44', 'INFO', 'Auth', NULL, NULL),
	('e736fdcc-f797-4981-8ed0-1519b423181c', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Dhruv Verma', 'AUTH', NULL, 'LOGIN', 'User Logged In', 'Dhruv Verma logged in successfully', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'USER', '{"role": "developer", "email": "dverma@rocklime.com"}', NULL, NULL, 0, '2026-06-09 11:46:29', '2026-06-09 11:46:29', 'INFO', 'Auth', NULL, NULL);

-- Dumping structure for table spsyn8lm_construction_db.addresses
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` char(36) NOT NULL,
  `line1` varchar(255) NOT NULL,
  `line2` varchar(255) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `pincode` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `google_map_link` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.addresses: ~0 rows (approximately)
INSERT INTO `addresses` (`id`, `line1`, `line2`, `landmark`, `city`, `state`, `country`, `pincode`, `latitude`, `longitude`, `google_map_link`, `created_at`, `updated_at`) VALUES
	('343b99ab-2c47-42be-8ea7-d42c90a7267d', 'Shaitan Gali, Khatra Maha', 'Shaitan Gali, Khatra Maha', 'Near nowhere', 'New Delhi', 'Delhi', 'India', '12401', NULL, NULL, NULL, '2026-05-22 13:54:23', '2026-05-22 13:54:23');

-- Dumping structure for table spsyn8lm_construction_db.boq_categories
CREATE TABLE IF NOT EXISTS `boq_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(100) DEFAULT NULL,
  `description` text,
  `sort_order` int(11) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_boq_category_code` (`code`) USING BTREE,
  KEY `idx_boq_categories_name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.boq_categories: ~3 rows (approximately)
INSERT INTO `boq_categories` (`id`, `name`, `code`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
	('498a9f16-4e97-11f1-bc5e-52540021303b', 'Architectural', 'ARCH', 'Architectural BOQ covering civil finishes, facade works, masonry, plastering, flooring, ceilings, and related construction activities.', 1, 1, '2026-05-13 06:45:10', '2026-05-13 06:45:10'),
	('498aaad3-4e97-11f1-bc5e-52540021303b', 'Interior', 'INT', 'Interior BOQ covering partitions, false ceiling, wall finishes, painting, décor, and interior fit-out works.', 2, 1, '2026-05-13 06:45:10', '2026-05-13 06:45:10'),
	('498aad2d-4e97-11f1-bc5e-52540021303b', 'Furniture', 'FURN', 'Furniture BOQ covering modular furniture, loose furniture, joinery, wardrobes, workstations, and custom fabricated furniture.', 3, 1, '2026-05-13 06:45:10', '2026-05-13 06:45:10');

-- Dumping structure for table spsyn8lm_construction_db.boq_items
CREATE TABLE IF NOT EXISTS `boq_items` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) NOT NULL,
  `section_id` char(36) NOT NULL,
  `subheading_id` char(36) DEFAULT NULL,
  `inventory_master_id` char(36) DEFAULT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `sno` varchar(50) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` text NOT NULL,
  `description` text,
  `specification` text,
  `brand` varchar(255) DEFAULT NULL,
  `qty` decimal(14,3) DEFAULT '0.000',
  `rate` decimal(14,2) DEFAULT '0.00',
  `wastage_percent` decimal(5,2) DEFAULT '0.00',
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `tax_percent` decimal(5,2) DEFAULT '0.00',
  `base_amount` decimal(16,2) GENERATED ALWAYS AS ((`qty` * `rate`)) STORED,
  `tax_amount` decimal(16,2) GENERATED ALWAYS AS ((((`qty` * `rate`) * `tax_percent`) / 100)) STORED,
  `final_amount` decimal(16,2) GENERATED ALWAYS AS (((`qty` * `rate`) + (((`qty` * `rate`) * `tax_percent`) / 100))) STORED,
  `remarks` text,
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boq_items_boq` (`boq_id`),
  KEY `fk_boq_items_section` (`section_id`),
  KEY `fk_boq_items_unit` (`unit_id`),
  KEY `idx_boq_items_subheading` (`subheading_id`) USING BTREE,
  KEY `idx_boq_items_inventory` (`inventory_master_id`) USING BTREE,
  CONSTRAINT `fk_boq_items_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boq_items_inventory_master` FOREIGN KEY (`inventory_master_id`) REFERENCES `inventory_master` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_boq_items_section` FOREIGN KEY (`section_id`) REFERENCES `boq_sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boq_items_subheading` FOREIGN KEY (`subheading_id`) REFERENCES `boq_subheadings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_boq_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.boq_items: ~58 rows (approximately)
INSERT INTO `boq_items` (`id`, `boq_id`, `section_id`, `subheading_id`, `inventory_master_id`, `unit_id`, `sno`, `item_code`, `item_name`, `description`, `specification`, `brand`, `qty`, `rate`, `wastage_percent`, `discount_percent`, `tax_percent`, `remarks`, `sort_order`, `created_at`, `updated_at`) VALUES
	('006a2fab-3057-4ecb-9cc5-ed4d3638a22c', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', '267f338c-897e-45d3-8442-9bb814997a85', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 1.000, 42000.00, 0.00, 0.00, 18.00, NULL, 2, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('091ae9ad-800f-4a2f-885b-d55c679ce85e', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '04e32ffe-2338-431b-8b36-087884cd9315', '8d6460fb-ed42-4978-80fc-98621f8d5111', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, '', 2, '2026-06-01 05:00:08', '2026-06-01 05:01:12'),
	('0c5e4909-10fa-4fa2-b059-deaf805c5430', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', 'bda815f3-bd87-43cf-95ea-0f99e34e9564', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, NULL, 12, '2026-06-01 05:01:14', '2026-06-01 05:01:14'),
	('21b0fa85-d767-4ae6-83dd-29fbdaaaca91', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'a6a76f57-1b5d-47bf-ab37-87ac5d1a9d04', '98ca7c05-051b-4447-b28e-37ac393f891a', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 10, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('2463921f-fb0c-4ead-a7ff-ff9333740a38', '5a9b4f26-6071-405d-8c45-0572032eea07', '1b587127-f285-4bc2-9924-323f49d04aeb', '02bb2097-e48e-4191-8b74-13ea5cdbbbe8', '780e6af2-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Concrete Mixer', NULL, '500L capacity, diesel engine', NULL, 1.000, 18500.00, 0.00, 0.00, 18.00, '', 4, '2026-05-31 20:01:34', '2026-06-01 05:39:07'),
	('25ebf41c-7005-4512-9ee1-b5e5fffde10d', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', 'e1385c36-6b62-49a1-9318-d6abbba9c6e5', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 1.000, 42000.00, 0.00, 0.00, 18.00, NULL, 2, '2026-06-01 04:47:13', '2026-06-01 04:47:13'),
	('269198b9-4eac-494f-94b2-abd008799fab', '5a9b4f26-6071-405d-8c45-0572032eea07', '1b587127-f285-4bc2-9924-323f49d04aeb', '02bb2097-e48e-4191-8b74-13ea5cdbbbe8', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, '', 5, '2026-05-31 20:01:34', '2026-06-01 05:39:07'),
	('271383c4-417c-4a1a-9d5f-979afba49769', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', '267f338c-897e-45d3-8442-9bb814997a85', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, NULL, 4, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('27b61c86-0f7f-47ad-9cff-0df553d62ce3', '449adb5b-714a-415f-9ae3-47c45bac66bb', '3711ea8e-7f8b-40cf-a7a4-94ab8edfae9e', '2eb92975-e44a-4dc3-95dd-17c6e31c3a3a', NULL, NULL, NULL, '123143', 'item 12312', NULL, NULL, NULL, 10.000, 10.00, 0.00, 0.00, 18.00, NULL, 0, '2026-05-15 05:07:24', '2026-05-15 05:07:24'),
	('2c5340b4-c001-4bf2-a602-f472d7a3064b', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', '6250777b-4436-401f-8d3e-540f8eb99671', '780e6af2-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Concrete Mixer', NULL, '500L capacity, diesel engine', NULL, 1.000, 18500.00, 0.00, 0.00, 18.00, NULL, 9, '2026-05-27 06:50:01', '2026-05-27 06:50:01'),
	('31247d5e-076d-4c02-b86b-68d9b9687d7b', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', '49a607a7-b19c-4763-8e04-8fb18ed63d75', 'df364df0-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Cordless Impact Driver', NULL, '18V lithium battery, brushless motor', NULL, 1.000, 3200.00, 0.00, 0.00, 18.00, NULL, 6, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('35c2762d-f9df-460a-9d60-78eff6ed50fb', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', 'e1385c36-6b62-49a1-9318-d6abbba9c6e5', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, NULL, 3, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('39d12486-528e-4d99-9a7d-ec72eb230d87', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', '1bfd3e0d-cc1f-48e8-98e7-644633ad4169', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, '', NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, '', 7, '2026-06-01 05:00:10', '2026-06-01 05:01:13'),
	('3f8c7470-6b76-4a0f-8d77-c9bab6d0e707', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '04e32ffe-2338-431b-8b36-087884cd9315', '8d6460fb-ed42-4978-80fc-98621f8d5111', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 1.000, 42000.00, 0.00, 0.00, 18.00, '', 3, '2026-06-01 05:00:09', '2026-06-01 05:01:12'),
	('46d82ed9-b56b-443d-852c-7fb41e62a063', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '0cb8ae0e-debb-4238-94dc-f13375dc4023', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 0.00, NULL, 3, '2026-06-01 05:45:20', '2026-06-01 05:45:20'),
	('50196929-004d-4e7c-84bc-5263c47c0c89', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', '267f338c-897e-45d3-8442-9bb814997a85', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, NULL, 3, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('5717ace9-47d2-4ee0-acdb-a68594385acd', '5a9b4f26-6071-405d-8c45-0572032eea07', '1b587127-f285-4bc2-9924-323f49d04aeb', '02bb2097-e48e-4191-8b74-13ea5cdbbbe8', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 5.000, 50000.00, 0.00, 0.00, 18.00, '', 2, '2026-05-31 20:01:34', '2026-06-01 05:39:06'),
	('5af366d0-1676-43fd-aa1e-4fff437b6eb9', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'e95dd3ff-52b9-4661-8b4a-5b95fa454a24', '558dfc6e-a675-4fd8-9be1-0aaa559b8aea', NULL, NULL, NULL, 'item new', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 3, '2026-05-27 06:50:00', '2026-05-27 06:50:00'),
	('5be6dede-8698-4bf6-b6a9-1f0c1009fcf9', '5a9b4f26-6071-405d-8c45-0572032eea07', '40108b2e-67ec-4704-9307-6767f717c981', '727c04c5-a44b-4d4e-8ac0-f3c3e297fa07', 'df364df0-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Cordless Impact Driver', NULL, '18V lithium battery, brushless motor', NULL, 1.000, 3200.00, 0.00, 0.00, 18.00, NULL, 9, '2026-06-01 05:39:08', '2026-06-01 05:39:08'),
	('62ae197d-416e-439c-bcb4-17a6b400e9fa', '5a9b4f26-6071-405d-8c45-0572032eea07', '40108b2e-67ec-4704-9307-6767f717c981', '727c04c5-a44b-4d4e-8ac0-f3c3e297fa07', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, NULL, 8, '2026-06-01 05:39:07', '2026-06-01 05:39:07'),
	('660123f3-61c4-47f0-9779-dfb26c441d3d', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'd80af210-1fef-4796-b842-c5b64a25d3e5', 'c7eeca9a-acb8-4fff-905e-ea7ab5f6479f', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, NULL, 12, '2026-06-01 04:47:18', '2026-06-01 04:47:18'),
	('6c20119c-d608-4210-add9-f948a137f45c', '9bf5c19c-116d-40c2-9660-79e3242fa3a8', '561e64e3-edbc-49b9-a2ca-fcdb971a6d73', 'dd628431-7820-4ea8-b36f-39b59d1dd7cf', NULL, NULL, NULL, '6787678', 'NEW23443', NULL, NULL, NULL, 70.000, 79.99, 0.00, 0.00, 18.00, NULL, 0, '2026-05-14 05:18:42', '2026-05-14 05:18:42'),
	('6f589118-6d88-4994-a986-890f9dce2517', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', 'bda815f3-bd87-43cf-95ea-0f99e34e9564', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, '', 10, '2026-06-01 05:00:10', '2026-06-01 05:01:14'),
	('6f863dae-c7d4-42cc-9967-feb3f2030220', '0dbf66e8-a100-4bf4-8bf1-b160f0d29065', 'f7b44711-726a-4a8a-bd15-2ab57c8df337', 'cb0a83f9-af0c-4b0b-bde9-49c9090fe9d9', '558dfc6e-a675-4fd8-9be1-0aaa559b8aea', NULL, NULL, NULL, 'item new', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 2, '2026-05-26 07:24:12', '2026-05-26 07:24:12'),
	('7129f5dc-354d-4a94-ab71-17b28b7abe10', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '2fe6b28b-ae53-4703-918e-ee70d2ed9bba', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 0.00, NULL, 9, '2026-06-01 05:45:22', '2026-06-01 05:45:22'),
	('761a784c-dcc9-4114-9d5f-ed6755071490', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', 'e1385c36-6b62-49a1-9318-d6abbba9c6e5', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, NULL, 4, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('7eca8b49-b7a0-4fbd-8224-4abf7d265261', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'd80af210-1fef-4796-b842-c5b64a25d3e5', 'c7eeca9a-acb8-4fff-905e-ea7ab5f6479f', '780e6e3a-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Industrial Hammer', NULL, 'Forged steel, anti-slip grip', NULL, 1.000, 850.00, 0.00, 0.00, 18.00, NULL, 11, '2026-06-01 04:47:18', '2026-06-01 04:47:18'),
	('88f5862d-3067-4bbb-9a3a-3834c6960a6f', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '02759bea-4b6a-45a9-b6b0-24c34ad2cc16', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 0.00, NULL, 6, '2026-06-01 05:45:21', '2026-06-01 05:45:21'),
	('9553676c-506a-4d96-ac83-9ae884a1a2bd', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', '359a15b9-b401-4d67-93bf-8b4e911903d7', '0bf53971-68ed-4839-acc8-9ceeb7020d7a', '780e6af2-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Concrete Mixer', NULL, '500L capacity, diesel engine', NULL, 1.000, 18500.00, 0.00, 0.00, 18.00, NULL, 2, '2026-05-26 09:52:13', '2026-05-26 09:52:13'),
	('9885fd55-356d-4145-9f16-fdd09ee7ca62', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'e95dd3ff-52b9-4661-8b4a-5b95fa454a24', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 1.000, 42000.00, 0.00, 0.00, 18.00, NULL, 5, '2026-05-27 06:50:00', '2026-05-27 06:50:00'),
	('a2197c37-e41f-458e-a324-bed069fc18e4', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', 'ee8826b3-e24a-4a9d-9678-41a71114e18a', '785be00c-7ad6-4dcb-8e89-cbeb26edcd5e', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, NULL, 7, '2026-05-26 09:52:15', '2026-05-26 09:52:15'),
	('a75cebe5-83cb-4030-8de1-614947a2efb1', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'a6a76f57-1b5d-47bf-ab37-87ac5d1a9d04', '98ca7c05-051b-4447-b28e-37ac393f891a', '780e6e3a-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Industrial Hammer', NULL, 'Forged steel, anti-slip grip', NULL, 1.000, 850.00, 0.00, 0.00, 18.00, NULL, 11, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('ab496665-8d86-4069-bfbf-fbb80b54a59d', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '2fe6b28b-ae53-4703-918e-ee70d2ed9bba', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 0.00, NULL, 8, '2026-06-01 05:45:21', '2026-06-01 05:45:21'),
	('ac072213-bc80-4f1b-9919-7b542c476315', '0dbf66e8-a100-4bf4-8bf1-b160f0d29065', 'f7b44711-726a-4a8a-bd15-2ab57c8df337', 'cb0a83f9-af0c-4b0b-bde9-49c9090fe9d9', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 3, '2026-05-26 07:24:12', '2026-05-26 07:24:12'),
	('ac2759a8-bfdc-4c21-8c49-c6397f159b01', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '9f4e294c-ccd8-43f5-9dcf-64c7e957b50c', '343ba443-586e-4aeb-a0e4-1bf3f06e9cc1', 'df36540b-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Laser Distance Meter', NULL, '0.05–100m range, accuracy ±1.5mm', NULL, 1.000, 4500.00, 0.00, 0.00, 18.00, NULL, 15, '2026-06-01 05:01:15', '2026-06-01 05:01:15'),
	('ae060a6f-b2fa-479e-974e-e96576d120cc', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', '1d5d072a-09ba-4a6a-94da-0286753666eb', 'df364df0-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Cordless Impact Driver', NULL, '18V lithium battery, brushless motor', NULL, 1.000, 3200.00, 0.00, 0.00, 18.00, NULL, 6, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('b28ce63b-7cf0-4fff-8eb2-f4ea9320d72d', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', 'bda815f3-bd87-43cf-95ea-0f99e34e9564', '780e6af2-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Concrete Mixer', NULL, '500L capacity, diesel engine', NULL, 1.000, 18500.00, 0.00, 0.00, 18.00, '', 11, '2026-06-01 05:00:10', '2026-06-01 05:01:14'),
	('bfd38bf1-875c-49b3-8e2d-5ad1c7819ae6', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', '6250777b-4436-401f-8d3e-540f8eb99671', '558dfc6e-a675-4fd8-9be1-0aaa559b8aea', NULL, NULL, NULL, 'item new', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 8, '2026-05-27 06:50:01', '2026-05-27 06:50:01'),
	('c3a2a261-fd32-4c9e-8e75-a283b494367a', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'e95dd3ff-52b9-4661-8b4a-5b95fa454a24', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, NULL, 2, '2026-05-27 06:49:59', '2026-05-27 06:49:59'),
	('c5708c1d-119c-4641-bc1b-c9cb995f74e9', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'a6a76f57-1b5d-47bf-ab37-87ac5d1a9d04', '98ca7c05-051b-4447-b28e-37ac393f891a', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, NULL, 12, '2026-06-01 04:47:16', '2026-06-01 04:47:16'),
	('c60fbdf1-43f9-4003-bd46-513728534ab4', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', '6250777b-4436-401f-8d3e-540f8eb99671', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 10, '2026-05-27 06:50:01', '2026-05-27 06:50:01'),
	('d4be039d-45d1-4eaf-89e6-74785f246968', '5a9b4f26-6071-405d-8c45-0572032eea07', 'f5d8b3ed-5f52-49cf-beb8-89a1c87f8845', 'f81f3066-2cb3-4190-9651-9586bea46ded', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 13, '2026-06-01 05:39:09', '2026-06-01 05:39:09'),
	('d9369214-f6a3-4e54-9b90-820e726e450a', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', '359a15b9-b401-4d67-93bf-8b4e911903d7', 'd3c49cf9-bca8-4e23-a9d1-6828cdce9631', NULL, NULL, NULL, 'ITM-005', 'Cordless Impact Driver', 'High torque cordless impact driver', '18V lithium battery, brushless motor', 'Makita', 10.000, 3200.00, 0.00, 0.00, 18.00, '', 4, '2026-05-25 07:13:47', '2026-05-26 09:52:14'),
	('de82ee5f-21dd-46c1-837d-6eec1be83091', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', '49a607a7-b19c-4763-8e04-8fb18ed63d75', '558dfc6e-a675-4fd8-9be1-0aaa559b8aea', NULL, NULL, NULL, 'item new', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 7, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('dfe7aba9-6f07-43a2-b12c-0708b046e253', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '04e32ffe-2338-431b-8b36-087884cd9315', '8d6460fb-ed42-4978-80fc-98621f8d5111', '780dd999-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Electric Drill', NULL, '800W, variable speed', NULL, 1.000, 2500.00, 0.00, 0.00, 18.00, '', 4, '2026-06-01 05:00:08', '2026-06-01 05:01:12'),
	('e9c23ff9-cf4f-4c25-bf2f-03abf92bb940', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '0cb8ae0e-debb-4238-94dc-f13375dc4023', '780e6af2-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Concrete Mixer', NULL, '500L capacity, diesel engine', NULL, 1.000, 18500.00, 0.00, 0.00, 0.00, NULL, 2, '2026-06-01 05:45:20', '2026-06-01 05:45:20'),
	('eadf8a76-f1b8-4ef9-8290-dbbe56511902', '449adb5b-714a-415f-9ae3-47c45bac66bb', '00dc7cea-3c0f-4d85-9a49-30b8cba378cd', 'bb03c004-91a9-4f2c-981e-8c2c34a6bec1', NULL, NULL, NULL, '121212', 'item 1', NULL, NULL, NULL, 120.000, 10.00, 0.00, 0.00, 18.00, NULL, 0, '2026-05-15 05:07:23', '2026-05-15 05:07:23'),
	('ed7abe7d-918c-4516-9e3b-78233f92be29', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'e95dd3ff-52b9-4661-8b4a-5b95fa454a24', '780dd999-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Electric Drill', NULL, '800W, variable speed', NULL, 1.000, 2500.00, 0.00, 0.00, 18.00, NULL, 6, '2026-05-27 06:50:00', '2026-05-27 06:50:00'),
	('ee5893c9-5d05-4f98-bd5b-841b39025912', '5a9b4f26-6071-405d-8c45-0572032eea07', 'f5d8b3ed-5f52-49cf-beb8-89a1c87f8845', 'f81f3066-2cb3-4190-9651-9586bea46ded', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 1.000, 42000.00, 0.00, 0.00, 18.00, NULL, 12, '2026-06-01 05:39:09', '2026-06-01 05:39:09'),
	('f0f4bf2b-3ab8-4cec-bc9a-219d237cb314', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', 'ee8826b3-e24a-4a9d-9678-41a71114e18a', '785be00c-7ad6-4dcb-8e89-cbeb26edcd5e', '780e6d6f-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart LED TV', NULL, '4K UHD, HDR10', NULL, 1.000, 42000.00, 0.00, 0.00, 18.00, NULL, 8, '2026-05-26 09:52:15', '2026-05-26 09:52:15'),
	('f43443ff-9898-45ae-a636-7863820ad30b', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', '1bfd3e0d-cc1f-48e8-98e7-644633ad4169', '558dfc6e-a675-4fd8-9be1-0aaa559b8aea', NULL, NULL, NULL, 'item new', NULL, '', NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, '', 8, '2026-06-01 05:00:09', '2026-06-01 05:01:13'),
	('f9000b5f-d8f3-4aec-a407-f4744cc826b4', '5a9b4f26-6071-405d-8c45-0572032eea07', '1b587127-f285-4bc2-9924-323f49d04aeb', '02bb2097-e48e-4191-8b74-13ea5cdbbbe8', 'df36559e-535c-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Smart Refrigerator', NULL, 'Inverter compressor, 3-star energy rating', NULL, 1.000, 55000.00, 0.00, 0.00, 18.00, '', 3, '2026-05-31 20:01:34', '2026-06-01 05:39:06'),
	('f9f81af3-9c46-41ae-a30e-f2fe89a4e9f9', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'e95dd3ff-52b9-4661-8b4a-5b95fa454a24', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 4, '2026-05-27 06:50:00', '2026-05-27 06:50:00'),
	('fa682c2e-b320-4875-a0d0-844317946524', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'd80af210-1fef-4796-b842-c5b64a25d3e5', 'c7eeca9a-acb8-4fff-905e-ea7ab5f6479f', '888f2df5-4a35-452d-87c2-7140c28239b4', NULL, NULL, NULL, 'item 23', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 10, '2026-06-01 04:47:16', '2026-06-01 04:47:16'),
	('fbb4555f-cd3b-412a-807f-f748ed88f9ba', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', '1d5d072a-09ba-4a6a-94da-0286753666eb', '558dfc6e-a675-4fd8-9be1-0aaa559b8aea', NULL, NULL, NULL, 'item new', NULL, NULL, NULL, 1.000, 1200.00, 0.00, 0.00, 18.00, NULL, 7, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('fbdd0789-3b12-474b-ae8b-3c454be568c4', '449adb5b-714a-415f-9ae3-47c45bac66bb', '00dc7cea-3c0f-4d85-9a49-30b8cba378cd', 'bb03c004-91a9-4f2c-981e-8c2c34a6bec1', NULL, NULL, NULL, '121212', 'item 1212', NULL, NULL, NULL, 120.000, 120.00, 0.00, -0.02, 18.00, NULL, 1, '2026-05-15 05:07:23', '2026-05-15 05:07:23'),
	('fdc4a266-a3aa-4ebe-92fd-e0b26be305c9', '449adb5b-714a-415f-9ae3-47c45bac66bb', '4f7e20d2-03b5-47f4-a5ad-82de200a495e', '22e70a6e-a963-455a-a6ea-b856ef7cc8a6', NULL, NULL, NULL, '123123123', 'item 123234', NULL, NULL, NULL, 110.000, 1110.00, 0.00, 0.00, 18.00, NULL, 0, '2026-05-15 05:07:24', '2026-05-15 05:07:24'),
	('fdfd74ef-a676-41f2-a304-7af0d0f487bb', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '02759bea-4b6a-45a9-b6b0-24c34ad2cc16', '780e6af2-535b-11f1-87a9-52540021303b', NULL, NULL, NULL, 'Concrete Mixer', NULL, '500L capacity, diesel engine', NULL, 1.000, 18500.00, 0.00, 0.00, 0.00, NULL, 5, '2026-06-01 05:45:21', '2026-06-01 05:45:21');

-- Dumping structure for table spsyn8lm_construction_db.boq_sections
CREATE TABLE IF NOT EXISTS `boq_sections` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boq_sections_boq` (`boq_id`),
  CONSTRAINT `fk_boq_sections_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.boq_sections: ~21 rows (approximately)
INSERT INTO `boq_sections` (`id`, `boq_id`, `title`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
	('00dc7cea-3c0f-4d85-9a49-30b8cba378cd', '449adb5b-714a-415f-9ae3-47c45bac66bb', 'section 1', '', 0, '2026-05-15 05:07:22', '2026-05-15 05:07:22'),
	('04e32ffe-2338-431b-8b36-087884cd9315', '2262f38d-e729-4ee5-942e-2af587dc9aa7', 'New Heading', NULL, 0, '2026-06-01 05:00:07', '2026-06-01 05:00:07'),
	('10cedfde-4ece-4507-8ea1-01e832732bad', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'New Heading', NULL, 0, '2026-06-01 04:47:13', '2026-06-01 04:47:13'),
	('19ad9930-cf65-4c3a-bec0-3621d977a78e', 'a9f6a42a-edef-4305-acff-56511b114a16', 'New Heading', NULL, 0, '2026-05-27 06:49:59', '2026-05-27 06:49:59'),
	('1b587127-f285-4bc2-9924-323f49d04aeb', '5a9b4f26-6071-405d-8c45-0572032eea07', 'MASTER BEDROOM 1', NULL, 0, '2026-05-31 20:01:33', '2026-05-31 20:01:33'),
	('359a15b9-b401-4d67-93bf-8b4e911903d7', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', 'NWE SECIO', '', 0, '2026-05-25 07:13:47', '2026-05-25 07:13:47'),
	('3711ea8e-7f8b-40cf-a7a4-94ab8edfae9e', '449adb5b-714a-415f-9ae3-47c45bac66bb', 'section 2', '', 1, '2026-05-15 05:07:23', '2026-05-15 05:07:23'),
	('40108b2e-67ec-4704-9307-6767f717c981', '5a9b4f26-6071-405d-8c45-0572032eea07', 'MASTER BEDROOM 2', NULL, 6, '2026-05-31 20:01:34', '2026-05-31 20:01:34'),
	('4f7e20d2-03b5-47f4-a5ad-82de200a495e', '449adb5b-714a-415f-9ae3-47c45bac66bb', 'section 3', '', 2, '2026-05-15 05:07:24', '2026-05-15 05:07:24'),
	('561e64e3-edbc-49b9-a2ca-fcdb971a6d73', '9bf5c19c-116d-40c2-9660-79e3242fa3a8', 'NEW23', '', 0, '2026-05-14 05:18:41', '2026-05-14 05:18:41'),
	('64faead8-a822-41a6-9f35-00756099169e', '2262f38d-e729-4ee5-942e-2af587dc9aa7', 'New Heading', NULL, 5, '2026-06-01 05:00:09', '2026-06-01 05:00:09'),
	('74a51955-7b20-40d1-937b-43552b800a39', '19862165-8075-4274-8e55-b2a1469a6afc', 'New Heading', NULL, 0, '2026-05-26 09:38:42', '2026-05-26 09:38:42'),
	('99d1cba8-8744-4afb-a99e-89de8b953388', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'New Heading', NULL, 0, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('9f4e294c-ccd8-43f5-9dcf-64c7e957b50c', '2262f38d-e729-4ee5-942e-2af587dc9aa7', 'New Heading', NULL, 13, '2026-06-01 05:01:14', '2026-06-01 05:01:14'),
	('a32eebe6-6826-45b6-9295-e6968004a942', 'd19051f8-7461-4433-bacc-c6d677b77bb9', 'New Heading', NULL, 0, '2026-05-26 09:43:34', '2026-05-26 09:43:34'),
	('a6a76f57-1b5d-47bf-ab37-87ac5d1a9d04', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'New Heading', NULL, 8, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('a725afb2-c48e-48c8-b4d2-0e43dbc5d6f3', 'b968ce26-86a7-4cf2-9712-3317ce40b31d', 'New Heading', NULL, 0, '2026-05-26 09:35:23', '2026-05-26 09:35:23'),
	('c86cbb5a-0131-4212-a46c-7b4e42e20cd3', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'New Heading', NULL, 0, '2026-06-01 05:45:19', '2026-06-01 05:45:19'),
	('d80af210-1fef-4796-b842-c5b64a25d3e5', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'New Heading', NULL, 8, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('ee8826b3-e24a-4a9d-9678-41a71114e18a', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', 'NEW HEADING', '', 5, '2026-05-25 07:13:47', '2026-05-26 09:52:14'),
	('f5d8b3ed-5f52-49cf-beb8-89a1c87f8845', '5a9b4f26-6071-405d-8c45-0572032eea07', 'KIDS ROOM', NULL, 10, '2026-05-31 20:01:34', '2026-06-01 05:39:08'),
	('f7b44711-726a-4a8a-bd15-2ab57c8df337', '0dbf66e8-a100-4bf4-8bf1-b160f0d29065', 'New Heading', NULL, 0, '2026-05-26 07:24:11', '2026-05-26 07:24:11');

-- Dumping structure for table spsyn8lm_construction_db.boq_subheadings
CREATE TABLE IF NOT EXISTS `boq_subheadings` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) NOT NULL,
  `section_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boq_subheadings_boq` (`boq_id`),
  KEY `idx_boq_subheadings_section` (`section_id`),
  CONSTRAINT `fk_boq_subheadings_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_boq_subheadings_section` FOREIGN KEY (`section_id`) REFERENCES `boq_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.boq_subheadings: ~26 rows (approximately)
INSERT INTO `boq_subheadings` (`id`, `boq_id`, `section_id`, `title`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
	('02759bea-4b6a-45a9-b6b0-24c34ad2cc16', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', 'New Subheading', NULL, 4, '2026-06-01 05:45:20', '2026-06-01 05:45:20'),
	('02bb2097-e48e-4191-8b74-13ea5cdbbbe8', '5a9b4f26-6071-405d-8c45-0572032eea07', '1b587127-f285-4bc2-9924-323f49d04aeb', 'BATHROOM 1', NULL, 1, '2026-05-31 20:01:33', '2026-05-31 20:01:33'),
	('0bf53971-68ed-4839-acc8-9ceeb7020d7a', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', '359a15b9-b401-4d67-93bf-8b4e911903d7', 'DETAILED SUB', '', 1, '2026-05-25 07:13:47', '2026-05-26 09:52:13'),
	('0cb8ae0e-debb-4238-94dc-f13375dc4023', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', 'New Subheading', NULL, 1, '2026-06-01 05:45:20', '2026-06-01 05:45:20'),
	('1bfd3e0d-cc1f-48e8-98e7-644633ad4169', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', 'New Subheading', NULL, 6, '2026-06-01 05:00:09', '2026-06-01 05:00:09'),
	('1d5d072a-09ba-4a6a-94da-0286753666eb', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', 'New Subheading', NULL, 5, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('22e70a6e-a963-455a-a6ea-b856ef7cc8a6', '449adb5b-714a-415f-9ae3-47c45bac66bb', '4f7e20d2-03b5-47f4-a5ad-82de200a495e', 'subheading 3', '', 0, '2026-05-15 05:07:24', '2026-05-15 05:07:24'),
	('267f338c-897e-45d3-8442-9bb814997a85', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '99d1cba8-8744-4afb-a99e-89de8b953388', 'New Subheading', NULL, 1, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('2eb92975-e44a-4dc3-95dd-17c6e31c3a3a', '449adb5b-714a-415f-9ae3-47c45bac66bb', '3711ea8e-7f8b-40cf-a7a4-94ab8edfae9e', 'subheading 12', '', 0, '2026-05-15 05:07:23', '2026-05-15 05:07:23'),
	('2fe6b28b-ae53-4703-918e-ee70d2ed9bba', '64e7e2db-dc68-466e-bcda-9c7f3ee0e773', 'c86cbb5a-0131-4212-a46c-7b4e42e20cd3', 'New Subheading', NULL, 7, '2026-06-01 05:45:21', '2026-06-01 05:45:21'),
	('343ba443-586e-4aeb-a0e4-1bf3f06e9cc1', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '9f4e294c-ccd8-43f5-9dcf-64c7e957b50c', 'New Subheading', NULL, 14, '2026-06-01 05:01:15', '2026-06-01 05:01:15'),
	('49a607a7-b19c-4763-8e04-8fb18ed63d75', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', 'New Subheading', NULL, 5, '2026-06-01 04:47:14', '2026-06-01 04:47:14'),
	('507fd239-439b-4eeb-b3d7-9085e86ad671', 'd19051f8-7461-4433-bacc-c6d677b77bb9', 'a32eebe6-6826-45b6-9295-e6968004a942', 'New Subheading', NULL, 1, '2026-05-26 09:43:35', '2026-05-26 09:43:35'),
	('580e6788-9436-4ab0-8eff-126ffb9bb478', 'b968ce26-86a7-4cf2-9712-3317ce40b31d', 'a725afb2-c48e-48c8-b4d2-0e43dbc5d6f3', 'New Subheading', NULL, 1, '2026-05-26 09:35:23', '2026-05-26 09:35:23'),
	('6250777b-4436-401f-8d3e-540f8eb99671', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'New Subheading', NULL, 7, '2026-05-27 06:50:01', '2026-05-27 06:50:01'),
	('727c04c5-a44b-4d4e-8ac0-f3c3e297fa07', '5a9b4f26-6071-405d-8c45-0572032eea07', '40108b2e-67ec-4704-9307-6767f717c981', 'BATHROOM 2', NULL, 7, '2026-05-31 20:01:34', '2026-05-31 20:01:34'),
	('785be00c-7ad6-4dcb-8e89-cbeb26edcd5e', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', 'ee8826b3-e24a-4a9d-9678-41a71114e18a', 'NEW SUBHEADING', '', 6, '2026-05-25 07:13:47', '2026-05-26 09:52:15'),
	('7d21d012-fa77-4ac9-bd05-04ab65e34bf8', '19862165-8075-4274-8e55-b2a1469a6afc', '74a51955-7b20-40d1-937b-43552b800a39', 'New Subheading', NULL, 1, '2026-05-26 09:38:42', '2026-05-26 09:38:42'),
	('8d6460fb-ed42-4978-80fc-98621f8d5111', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '04e32ffe-2338-431b-8b36-087884cd9315', 'New Subheading', NULL, 1, '2026-06-01 05:00:08', '2026-06-01 05:00:08'),
	('98ca7c05-051b-4447-b28e-37ac393f891a', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'a6a76f57-1b5d-47bf-ab37-87ac5d1a9d04', 'New Subheading', NULL, 9, '2026-06-01 04:47:15', '2026-06-01 04:47:15'),
	('bb03c004-91a9-4f2c-981e-8c2c34a6bec1', '449adb5b-714a-415f-9ae3-47c45bac66bb', '00dc7cea-3c0f-4d85-9a49-30b8cba378cd', 'subheading 1', '', 0, '2026-05-15 05:07:22', '2026-05-15 05:07:22'),
	('bda815f3-bd87-43cf-95ea-0f99e34e9564', '2262f38d-e729-4ee5-942e-2af587dc9aa7', '64faead8-a822-41a6-9f35-00756099169e', 'New Subheading', NULL, 9, '2026-06-01 05:00:10', '2026-06-01 05:00:10'),
	('c7eeca9a-acb8-4fff-905e-ea7ab5f6479f', '61b2a666-83ad-4418-8ec9-b3329fac5cff', 'd80af210-1fef-4796-b842-c5b64a25d3e5', 'New Subheading', NULL, 9, '2026-06-01 04:47:16', '2026-06-01 04:47:16'),
	('cb0a83f9-af0c-4b0b-bde9-49c9090fe9d9', '0dbf66e8-a100-4bf4-8bf1-b160f0d29065', 'f7b44711-726a-4a8a-bd15-2ab57c8df337', 'New Subheading', NULL, 1, '2026-05-26 07:24:11', '2026-05-26 07:24:11'),
	('d3c49cf9-bca8-4e23-a9d1-6828cdce9631', '6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', '359a15b9-b401-4d67-93bf-8b4e911903d7', 'NEW SUBHEADING', '', 3, '2026-05-25 07:13:47', '2026-05-26 09:52:14'),
	('dd628431-7820-4ea8-b36f-39b59d1dd7cf', '9bf5c19c-116d-40c2-9660-79e3242fa3a8', '561e64e3-edbc-49b9-a2ca-fcdb971a6d73', 'SECTION234', '', 0, '2026-05-14 05:18:41', '2026-05-14 05:18:41'),
	('e1385c36-6b62-49a1-9318-d6abbba9c6e5', '61b2a666-83ad-4418-8ec9-b3329fac5cff', '10cedfde-4ece-4507-8ea1-01e832732bad', 'New Subheading', NULL, 1, '2026-06-01 04:47:13', '2026-06-01 04:47:13'),
	('e95dd3ff-52b9-4661-8b4a-5b95fa454a24', 'a9f6a42a-edef-4305-acff-56511b114a16', '19ad9930-cf65-4c3a-bec0-3621d977a78e', 'New Subheading', NULL, 1, '2026-05-27 06:49:59', '2026-05-27 06:49:59'),
	('f81f3066-2cb3-4190-9651-9586bea46ded', '5a9b4f26-6071-405d-8c45-0572032eea07', 'f5d8b3ed-5f52-49cf-beb8-89a1c87f8845', 'KIDS BATHROOM', NULL, 11, '2026-05-31 20:01:35', '2026-06-01 05:39:08');

-- Dumping structure for table spsyn8lm_construction_db.boqs
CREATE TABLE IF NOT EXISTS `boqs` (
  `id` char(36) NOT NULL,
  `project_id` char(36) DEFAULT NULL,
  `client_id` char(36) DEFAULT NULL,
  `boq_category_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `code` varchar(100) DEFAULT NULL,
  `revision_no` varchar(50) DEFAULT 'Rev-01',
  `status` enum('draft','submitted','approved','rejected','revised') DEFAULT 'draft',
  `notes` text,
  `subtotal` decimal(16,2) DEFAULT '0.00',
  `tax_amount` decimal(16,2) DEFAULT '0.00',
  `grand_total` decimal(16,2) DEFAULT '0.00',
  `prepared_by` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boqs_project` (`project_id`),
  KEY `fk_boq_category` (`boq_category_id`),
  KEY `fk_boq_prepared_by` (`prepared_by`),
  KEY `fk_boq_approved_by` (`approved_by`),
  KEY `fk_boq_client` (`client_id`) USING BTREE,
  CONSTRAINT `fk_boq_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_boq_category` FOREIGN KEY (`boq_category_id`) REFERENCES `boq_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boq_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_boq_prepared_by` FOREIGN KEY (`prepared_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_boq_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.boqs: ~11 rows (approximately)
INSERT INTO `boqs` (`id`, `project_id`, `client_id`, `boq_category_id`, `title`, `code`, `revision_no`, `status`, `notes`, `subtotal`, `tax_amount`, `grand_total`, `prepared_by`, `approved_by`, `created_at`, `updated_at`) VALUES
	('0dbf66e8-a100-4bf4-8bf1-b160f0d29065', NULL, '5f2e51c5-6936-4b7e-9252-df8bfdeb3bce', '498a9f16-4e97-11f1-bc5e-52540021303b', 'rocklime dev', NULL, 'Rev-01', 'draft', NULL, 2832.00, 0.00, 2832.00, NULL, NULL, '2026-05-26 07:23:01', '2026-05-26 07:24:13'),
	('19862165-8075-4274-8e55-b2a1469a6afc', NULL, '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', '498a9f16-4e97-11f1-bc5e-52540021303b', 'rocklime dev ', NULL, 'Rev-01', 'draft', NULL, 129033.00, 0.00, 129033.00, NULL, NULL, '2026-05-26 07:18:07', '2026-05-26 07:19:17'),
	('2262f38d-e729-4ee5-942e-2af587dc9aa7', NULL, '27e48c04-38c6-47dc-b65e-5350b07dec00', '498aaad3-4e97-11f1-bc5e-52540021303b', 'NEW RE', NULL, 'Rev-01', 'draft', NULL, 98412.00, 0.00, 98412.00, NULL, NULL, '2026-06-01 05:00:07', '2026-06-01 05:01:15'),
	('449adb5b-714a-415f-9ae3-47c45bac66bb', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', NULL, '498aad2d-4e97-11f1-bc5e-52540021303b', 'new12312', NULL, 'Rev-01', 'draft', '', 162604.00, 0.00, 162604.00, NULL, NULL, '2026-05-15 05:07:22', '2026-05-15 05:07:24'),
	('5a9b4f26-6071-405d-8c45-0572032eea07', NULL, '5d1e14a3-e59a-44bf-a511-765612320316', '498a9f16-4e97-11f1-bc5e-52540021303b', 'BHAV FLOOR 1', NULL, 'Rev-01', 'submitted', NULL, 506692.00, 0.00, 506692.00, NULL, NULL, '2026-05-31 20:01:33', '2026-06-01 05:39:09'),
	('61b2a666-83ad-4418-8ec9-b3329fac5cff', NULL, '5d1e14a3-e59a-44bf-a511-765612320316', '498aaad3-4e97-11f1-bc5e-52540021303b', 'new', NULL, 'Rev-01', 'draft', NULL, 384562.00, 0.00, 384562.00, NULL, NULL, '2026-06-01 04:47:13', '2026-06-01 04:47:18'),
	('64e7e2db-dc68-466e-bcda-9c7f3ee0e773', NULL, 'ff232ecc-4de6-11f1-bc5e-52540021303b', '498aad2d-4e97-11f1-bc5e-52540021303b', 'NEW 1123123', NULL, 'Rev-01', 'draft', NULL, 152700.00, 0.00, 152700.00, NULL, NULL, '2026-06-01 05:45:19', '2026-06-01 05:45:22'),
	('6b9d5928-bd3e-496e-bd86-33a0ff86ef1e', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', '498aaad3-4e97-11f1-bc5e-52540021303b', 'NQW', NULL, 'Rev-01', 'draft', '', 114460.00, 0.00, 114460.00, NULL, NULL, '2026-05-25 07:13:47', '2026-05-26 09:52:16'),
	('9bf5c19c-116d-40c2-9660-79e3242fa3a8', 'ff330cfd-4de6-11f1-bc5e-52540021303b', NULL, '498aaad3-4e97-11f1-bc5e-52540021303b', 'NEW234423', NULL, 'Rev-01', 'draft', '', 6607.17, 0.00, 6607.17, NULL, NULL, '2026-05-14 05:18:41', '2026-05-14 05:18:42'),
	('a9f6a42a-edef-4305-acff-56511b114a16', NULL, '5f2e51c5-6936-4b7e-9252-df8bfdeb3bce', '498a9f16-4e97-11f1-bc5e-52540021303b', 'new updated BOQ TEMPLATE ', NULL, 'Rev-01', 'draft', NULL, 144904.00, 0.00, 144904.00, NULL, NULL, '2026-05-27 06:49:58', '2026-05-27 06:50:02'),
	('b968ce26-86a7-4cf2-9712-3317ce40b31d', NULL, '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', '498a9f16-4e97-11f1-bc5e-52540021303b', 'ROCKLIME DEV TITLE', NULL, 'Rev-01', 'draft', NULL, 80004.00, 0.00, 80004.00, NULL, NULL, '2026-05-26 07:43:14', '2026-05-26 08:33:52'),
	('d19051f8-7461-4433-bacc-c6d677b77bb9', NULL, '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', '498a9f16-4e97-11f1-bc5e-52540021303b', 'new title ', NULL, 'Rev-01', 'draft', NULL, 63012.00, 0.00, 63012.00, NULL, NULL, '2026-05-26 09:42:15', '2026-05-26 09:42:18');

-- Dumping structure for table spsyn8lm_construction_db.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_brands_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.brands: ~22 rows (approximately)
INSERT INTO `brands` (`id`, `name`, `is_active`, `created_at`, `updated_at`) VALUES
	('6ca46422-535b-11f1-87a9-52540021303b', 'Samsung', 1, '2026-05-19 13:49:15', '2026-05-19 13:49:15'),
	('6ca468bf-535b-11f1-87a9-52540021303b', 'Bosch', 1, '2026-05-19 13:49:15', '2026-05-19 13:49:15'),
	('6ca469f1-535b-11f1-87a9-52540021303b', 'Hilti', 1, '2026-05-19 13:49:15', '2026-05-19 13:49:15'),
	('6ca46a6b-535b-11f1-87a9-52540021303b', 'LG', 1, '2026-05-19 13:49:15', '2026-05-19 13:49:15'),
	('6ca46add-535b-11f1-87a9-52540021303b', 'Makita', 1, '2026-05-19 13:49:15', '2026-05-19 13:49:15'),
	('9c8f2b46-63cf-11f1-8f9b-52540021303b', 'UltraTech', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f32f9-63cf-11f1-8f9b-52540021303b', 'ACC', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f33ec-63cf-11f1-8f9b-52540021303b', 'Ambuja Cement', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f349f-63cf-11f1-8f9b-52540021303b', 'Tata Steel', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f353e-63cf-11f1-8f9b-52540021303b', 'JSW Steel', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f35d5-63cf-11f1-8f9b-52540021303b', 'Astral Pipes', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f366d-63cf-11f1-8f9b-52540021303b', 'Supreme Industries', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3763-63cf-11f1-8f9b-52540021303b', 'Asian Paints', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f37f7-63cf-11f1-8f9b-52540021303b', 'Berger Paints', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f388a-63cf-11f1-8f9b-52540021303b', 'Saint-Gobain', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3920-63cf-11f1-8f9b-52540021303b', 'DeWalt', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f39b9-63cf-11f1-8f9b-52540021303b', 'JK Cement', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3b53-63cf-11f1-8f9b-52540021303b', 'Shree Cement', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3c00-63cf-11f1-8f9b-52540021303b', 'Finolex', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3c9a-63cf-11f1-8f9b-52540021303b', 'Prince Pipes', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3d2e-63cf-11f1-8f9b-52540021303b', 'Pidilite', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16'),
	('9c8f3dc6-63cf-11f1-8f9b-52540021303b', 'Nerolac', 1, '2026-06-09 12:21:16', '2026-06-09 12:21:16');

-- Dumping structure for table spsyn8lm_construction_db.cdn_files
CREATE TABLE IF NOT EXISTS `cdn_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int(11) NOT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table spsyn8lm_construction_db.cdn_files: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `preferred_communication` enum('Call','WhatsApp','Email') DEFAULT NULL,
  `is_owner` tinyint(1) DEFAULT '1',
  `representative_involved` tinyint(1) DEFAULT '0',
  `representative_comment` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.clients: ~3 rows (approximately)
INSERT INTO `clients` (`id`, `name`, `contact_number`, `email`, `preferred_communication`, `is_owner`, `representative_involved`, `representative_comment`, `created_at`, `updated_at`) VALUES
	('27e48c04-38c6-47dc-b65e-5350b07dec00', 'Sumit', '2323343445', NULL, NULL, 1, 0, '', '2026-05-27 15:52:39', '2026-05-27 15:52:39'),
	('5d1e14a3-e59a-44bf-a511-765612320316', 'Bhav', NULL, NULL, NULL, 1, 0, '', '2026-06-01 01:26:13', '2026-06-01 01:26:13'),
	('5f2e51c5-6936-4b7e-9252-df8bfdeb3bce', 'Rocklime Dev', '4564562323', 'rocklimedev23@gmail.com', 'WhatsApp', 1, 0, '', '2026-05-25 11:57:12', '2026-05-25 11:57:12'),
	('9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', 'Rocklime Dev', '1231231232', 'rocklimedev@gmail.com', 'Email', 1, 0, '', '2026-05-15 10:24:15', '2026-05-15 10:24:15'),
	('ff232ecc-4de6-11f1-bc5e-52540021303b', 'John Doe', '+91-9876543210', 'john@example.com', 'WhatsApp', 1, 0, NULL, '2026-05-12 15:13:14', '2026-05-12 15:13:14');

-- Dumping structure for table spsyn8lm_construction_db.comments
CREATE TABLE IF NOT EXISTS `comments` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` char(36) NOT NULL,
  `parent_comment_id` char(36) DEFAULT NULL,
  `comment` text NOT NULL,
  `created_by_user_id` char(36) NOT NULL,
  `is_internal` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_user` (`created_by_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.comments: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.daily_progress_reports
CREATE TABLE IF NOT EXISTS `daily_progress_reports` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `report_date` date NOT NULL,
  `supervisor_id` char(36) DEFAULT NULL,
  `current_stage` varchar(100) DEFAULT NULL,
  `work_executed` text,
  `manpower_count` int(11) DEFAULT NULL,
  `materials_used` text,
  `issues_faced` text,
  `progress_photos` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `supervisor_id` (`supervisor_id`),
  CONSTRAINT `daily_progress_reports_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `daily_progress_reports_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.daily_progress_reports: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.drawing_approval_logs
CREATE TABLE IF NOT EXISTS `drawing_approval_logs` (
  `id` char(36) NOT NULL,
  `drawing_id` char(36) NOT NULL,
  `client_id` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `action` enum('approved','rejected','revision_requested','commented') NOT NULL DEFAULT 'commented',
  `approved` tinyint(1) NOT NULL DEFAULT '0',
  `remarks` text,
  `internal_note` text,
  `attachment_url` varchar(500) DEFAULT NULL,
  `drawing_version` int(11) DEFAULT NULL,
  `revision_requested` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `drawing_id` (`drawing_id`),
  KEY `client_id` (`client_id`),
  KEY `idx_drawing_approval_logs_action` (`action`) USING BTREE,
  KEY `idx_drawing_approval_logs_approved_by` (`approved_by`) USING BTREE,
  KEY `idx_drawing_approval_logs_created_at` (`created_at`) USING BTREE,
  CONSTRAINT `drawing_approval_logs_ibfk_1` FOREIGN KEY (`drawing_id`) REFERENCES `project_drawings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `drawing_approval_logs_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `drawing_approval_logs_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.drawing_approval_logs: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.handovers
CREATE TABLE IF NOT EXISTS `handovers` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `handover_date` datetime DEFAULT NULL,
  `planned_vs_actual_timeline` text,
  `completion_confirmation` tinyint(1) DEFAULT '1',
  `outstanding_items` text,
  `warranty_notes` text,
  `sign_off_client` tinyint(1) DEFAULT '0',
  `sign_off_firm` tinyint(1) DEFAULT '0',
  `handover_pdf_url` varchar(500) DEFAULT NULL,
  `full_drawings_set_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`),
  CONSTRAINT `handovers_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.handovers: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.inventory_dispatches
CREATE TABLE IF NOT EXISTS `inventory_dispatches` (
  `id` char(36) NOT NULL,
  `request_id` char(36) NOT NULL,
  `dispatch_date` datetime DEFAULT NULL,
  `dispatch_quantity` decimal(12,2) DEFAULT NULL,
  `vehicle_challan` varchar(100) DEFAULT NULL,
  `received_quantity` decimal(12,2) DEFAULT NULL,
  `damage_shortage` tinyint(1) DEFAULT NULL,
  `supervisor_confirmation` tinyint(1) DEFAULT NULL,
  `delivery_photo_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  CONSTRAINT `inventory_dispatches_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `inventory_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.inventory_dispatches: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.inventory_master
CREATE TABLE IF NOT EXISTS `inventory_master` (
  `id` char(36) NOT NULL,
  `item_code` varchar(100) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text,
  `unit_id` char(36) DEFAULT NULL,
  `default_rate` decimal(14,2) DEFAULT '0.00',
  `specification` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `brand_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_inventory_item_code` (`item_code`) USING BTREE,
  KEY `idx_inventory_item_name` (`item_name`) USING BTREE,
  KEY `fk_inventory_unit` (`unit_id`) USING BTREE,
  KEY `idx_inventory_brand_id` (`brand_id`),
  CONSTRAINT `fk_inventory_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inventory_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.inventory_master: ~62 rows (approximately)
INSERT INTO `inventory_master` (`id`, `item_code`, `item_name`, `description`, `unit_id`, `default_rate`, `specification`, `is_active`, `created_at`, `updated_at`, `brand_id`) VALUES
	('558dfc6e-a675-4fd8-9be1-0aaa559b8aea', 'AUTO-1779780252267', 'item new', NULL, NULL, 1200.00, NULL, 1, '2026-05-26 07:24:12', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('780dd999-535b-11f1-87a9-52540021303b', 'ITM-001', 'Electric Drill', 'Heavy duty electric drill for construction use', NULL, 2500.00, '800W, variable speed', 1, '2026-05-19 08:19:34', '2026-05-19 08:29:31', '6ca46add-535b-11f1-87a9-52540021303b'),
	('780e6af2-535b-11f1-87a9-52540021303b', 'ITM-002', 'Concrete Mixer', 'Portable concrete mixing machine', NULL, 18500.00, '500L capacity, diesel engine', 1, '2026-05-19 08:19:34', '2026-05-19 08:29:31', '6ca468bf-535b-11f1-87a9-52540021303b'),
	('780e6d6f-535b-11f1-87a9-52540021303b', 'ITM-003', 'Smart LED TV', '55 inch smart LED television', NULL, 42000.00, '4K UHD, HDR10', 1, '2026-05-19 08:19:34', '2026-05-19 08:29:31', '6ca46422-535b-11f1-87a9-52540021303b'),
	('780e6e3a-535b-11f1-87a9-52540021303b', 'ITM-004', 'Industrial Hammer', 'High durability steel hammer', NULL, 850.00, 'Forged steel, anti-slip grip', 1, '2026-05-19 08:19:34', '2026-05-19 08:29:31', '6ca469f1-535b-11f1-87a9-52540021303b'),
	('888f2df5-4a35-452d-87c2-7140c28239b4', 'AUTO-1779780252862', 'item 23', NULL, NULL, 1200.00, NULL, 1, '2026-05-26 07:24:12', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bacf88-63ce-11f1-8f9b-52540021303b', 'ITM-026', 'OPC Cement 53 Grade', 'Ordinary Portland Cement for structural construction', NULL, 420.00, '50kg bag', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bad5a4-63ce-11f1-8f9b-52540021303b', 'ITM-027', 'PPC Cement', 'Portland Pozzolana Cement', NULL, 390.00, '50kg bag', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bad734-63ce-11f1-8f9b-52540021303b', 'ITM-028', 'TMT Bar 8mm', 'High strength reinforcement steel bar', NULL, 58.00, 'Fe550 grade', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bad899-63ce-11f1-8f9b-52540021303b', 'ITM-029', 'TMT Bar 10mm', 'High strength reinforcement steel bar', NULL, 59.00, 'Fe550 grade', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bad98c-63ce-11f1-8f9b-52540021303b', 'ITM-030', 'TMT Bar 12mm', 'High strength reinforcement steel bar', NULL, 61.00, 'Fe550 grade', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4badb33-63ce-11f1-8f9b-52540021303b', 'ITM-031', 'TMT Bar 16mm', 'Construction reinforcement steel', NULL, 63.00, 'Fe550 grade', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4badc54-63ce-11f1-8f9b-52540021303b', 'ITM-032', 'Binding Wire', 'Steel binding wire for reinforcement work', NULL, 78.00, '18 gauge', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bade37-63ce-11f1-8f9b-52540021303b', 'ITM-033', 'River Sand', 'Fine aggregate for masonry and plastering', NULL, 1800.00, 'Per ton', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4badedb-63ce-11f1-8f9b-52540021303b', 'ITM-034', 'M-Sand', 'Manufactured sand for construction', NULL, 1400.00, 'Per ton', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4badf7b-63ce-11f1-8f9b-52540021303b', 'ITM-035', '20mm Aggregate', 'Crushed stone aggregate', NULL, 1100.00, 'Per ton', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae01a-63ce-11f1-8f9b-52540021303b', 'ITM-036', '10mm Aggregate', 'Fine crushed aggregate', NULL, 1150.00, 'Per ton', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae0a1-63ce-11f1-8f9b-52540021303b', 'ITM-037', 'Fly Ash Bricks', 'Eco-friendly fly ash bricks', NULL, 8.50, '230x110x75 mm', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae13f-63ce-11f1-8f9b-52540021303b', 'ITM-038', 'Red Clay Bricks', 'Traditional burnt clay bricks', NULL, 9.00, 'Standard size', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae1d4-63ce-11f1-8f9b-52540021303b', 'ITM-039', 'AAC Block', 'Autoclaved Aerated Concrete Block', NULL, 75.00, '600x200x200 mm', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae261-63ce-11f1-8f9b-52540021303b', 'ITM-040', 'Concrete Paver Block', 'Heavy-duty paving block', NULL, 45.00, '60mm thickness', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae2f2-63ce-11f1-8f9b-52540021303b', 'ITM-041', 'PVC Pipe 110mm', 'Drainage pipe', NULL, 950.00, '6 meter length', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae394-63ce-11f1-8f9b-52540021303b', 'ITM-042', 'PVC Pipe 63mm', 'Water supply pipe', NULL, 420.00, '6 meter length', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae427-63ce-11f1-8f9b-52540021303b', 'ITM-043', 'UPVC Elbow 110mm', 'Pipe fitting elbow', NULL, 120.00, '90 degree', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae4b1-63ce-11f1-8f9b-52540021303b', 'ITM-044', 'Waterproofing Compound', 'Concrete waterproofing additive', NULL, 1450.00, '20L container', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae5ec-63ce-11f1-8f9b-52540021303b', 'ITM-045', 'Tile Adhesive', 'High bond tile fixing adhesive', NULL, 650.00, '20kg bag', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae686-63ce-11f1-8f9b-52540021303b', 'ITM-046', 'Wall Putty', 'White cement based wall putty', NULL, 780.00, '40kg bag', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae714-63ce-11f1-8f9b-52540021303b', 'ITM-047', 'Primer Paint', 'Exterior wall primer', NULL, 1650.00, '20L bucket', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae7a1-63ce-11f1-8f9b-52540021303b', 'ITM-048', 'Exterior Emulsion Paint', 'Weather resistant paint', NULL, 4850.00, '20L bucket', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae837-63ce-11f1-8f9b-52540021303b', 'ITM-049', 'Safety Jacket', 'Reflective safety vest', NULL, 250.00, 'Fluorescent orange', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae8cb-63ce-11f1-8f9b-52540021303b', 'ITM-050', 'Safety Shoes', 'Steel toe safety shoes', NULL, 1800.00, 'ISI certified', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae95d-63ce-11f1-8f9b-52540021303b', 'ITM-051', 'Safety Gloves', 'Industrial hand protection gloves', NULL, 120.00, 'Rubber coated', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4bae9ea-63ce-11f1-8f9b-52540021303b', 'ITM-052', 'Scaffolding Pipe', 'MS scaffolding pipe', NULL, 780.00, '3 meter length', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baea7f-63ce-11f1-8f9b-52540021303b', 'ITM-053', 'Scaffolding Clamp', 'Forged scaffolding coupler', NULL, 85.00, 'Heavy duty', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baeb09-63ce-11f1-8f9b-52540021303b', 'ITM-054', 'Shuttering Plywood', 'Film faced shuttering board', NULL, 1650.00, '18mm x 8ft x 4ft', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baeb96-63ce-11f1-8f9b-52540021303b', 'ITM-055', 'Centering Plate', 'Steel centering plate', NULL, 950.00, '1200mm x 600mm', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baec27-63ce-11f1-8f9b-52540021303b', 'ITM-056', 'Concrete Curing Compound', 'Water retention curing liquid', NULL, 2400.00, '20L drum', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baecad-63ce-11f1-8f9b-52540021303b', 'ITM-057', 'GI Wire', 'Galvanized iron wire', NULL, 92.00, 'Per kg', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baed38-63ce-11f1-8f9b-52540021303b', 'ITM-058', 'Welding Electrode', 'Mild steel welding rod', NULL, 180.00, 'E6013 grade', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baedc9-63ce-11f1-8f9b-52540021303b', 'ITM-059', 'Cutting Disc 4 Inch', 'Metal cutting wheel', NULL, 35.00, '4 inch', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('a4baee60-63ce-11f1-8f9b-52540021303b', 'ITM-060', 'Diamond Cutting Blade', 'Concrete and stone cutting blade', NULL, 1250.00, '14 inch', 1, '2026-06-09 06:44:20', '2026-06-09 06:51:26', '9c8f3dc6-63cf-11f1-8f9b-52540021303b'),
	('df364df0-535c-11f1-87a9-52540021303b', 'ITM-005', 'Cordless Impact Driver', 'High torque cordless impact driver', NULL, 3200.00, '18V lithium battery, brushless motor', 1, '2026-05-19 08:29:37', '2026-05-19 08:29:37', '6ca46add-535b-11f1-87a9-52540021303b'),
	('df36540b-535c-11f1-87a9-52540021303b', 'ITM-006', 'Laser Distance Meter', 'Digital laser measuring tool', NULL, 4500.00, '0.05–100m range, accuracy ±1.5mm', 1, '2026-05-19 08:29:37', '2026-05-19 08:29:37', '6ca468bf-535b-11f1-87a9-52540021303b'),
	('df36559e-535c-11f1-87a9-52540021303b', 'ITM-007', 'Smart Refrigerator', 'WiFi-enabled double door refrigerator', NULL, 55000.00, 'Inverter compressor, 3-star energy rating', 1, '2026-05-19 08:29:37', '2026-05-19 08:29:37', '6ca46422-535b-11f1-87a9-52540021303b'),
	('f172f810-63cc-11f1-8f9b-52540021303b', 'ITM-008', 'Angle Grinder', 'Industrial angle grinder for cutting and polishing', NULL, 2800.00, '900W motor, 100mm disc', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46add-535b-11f1-87a9-52540021303b'),
	('f173931d-63cc-11f1-8f9b-52540021303b', 'ITM-009', 'Rotary Hammer Drill', 'Heavy-duty rotary hammer drill', NULL, 6800.00, '1200W, SDS Plus chuck', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46add-535b-11f1-87a9-52540021303b'),
	('f17397a8-63cc-11f1-8f9b-52540021303b', 'ITM-010', 'Tile Cutter', 'Professional manual tile cutter', NULL, 3500.00, '1200mm cutting length', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca469f1-535b-11f1-87a9-52540021303b'),
	('f17399c0-63cc-11f1-8f9b-52540021303b', 'ITM-011', 'Wheelbarrow', 'Heavy-duty construction wheelbarrow', NULL, 2200.00, '100L capacity, steel body', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca469f1-535b-11f1-87a9-52540021303b'),
	('f1739bb5-63cc-11f1-8f9b-52540021303b', 'ITM-012', 'Water Pump', 'High-pressure water pump', NULL, 9200.00, '2HP motor, 50L/min flow rate', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca468bf-535b-11f1-87a9-52540021303b'),
	('f1739d14-63cc-11f1-8f9b-52540021303b', 'ITM-013', 'Air Compressor', 'Portable air compressor', NULL, 14500.00, '50L tank, 8 bar pressure', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca468bf-535b-11f1-87a9-52540021303b'),
	('f1739e36-63cc-11f1-8f9b-52540021303b', 'ITM-014', 'Washing Machine', 'Fully automatic front-load washing machine', NULL, 32000.00, '8kg capacity, inverter motor', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46422-535b-11f1-87a9-52540021303b'),
	('f1739fbb-63cc-11f1-8f9b-52540021303b', 'ITM-015', 'Microwave Oven', 'Convection microwave oven', NULL, 13500.00, '28L capacity, digital controls', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46422-535b-11f1-87a9-52540021303b'),
	('f173a0f4-63cc-11f1-8f9b-52540021303b', 'ITM-016', 'Bluetooth Speaker', 'Portable wireless Bluetooth speaker', NULL, 2800.00, '20W output, IPX7 waterproof', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46422-535b-11f1-87a9-52540021303b'),
	('f173a250-63cc-11f1-8f9b-52540021303b', 'ITM-017', 'Circular Saw', 'Professional circular saw', NULL, 5200.00, '1800W motor, 185mm blade', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46add-535b-11f1-87a9-52540021303b'),
	('f173a374-63cc-11f1-8f9b-52540021303b', 'ITM-018', 'Paint Sprayer', 'Electric paint spraying machine', NULL, 4100.00, '800ml container, adjustable nozzle', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca469f1-535b-11f1-87a9-52540021303b'),
	('f173a4f2-63cc-11f1-8f9b-52540021303b', 'ITM-019', 'Digital Multimeter', 'Electronic testing and measurement device', NULL, 1200.00, 'Auto-ranging, LCD display', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca468bf-535b-11f1-87a9-52540021303b'),
	('f173a638-63cc-11f1-8f9b-52540021303b', 'ITM-020', 'Generator', 'Portable diesel generator', NULL, 68000.00, '5kVA output, electric start', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca468bf-535b-11f1-87a9-52540021303b'),
	('f173a76b-63cc-11f1-8f9b-52540021303b', 'ITM-021', 'Safety Helmet', 'Construction site safety helmet', NULL, 450.00, 'ISI certified, adjustable strap', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca469f1-535b-11f1-87a9-52540021303b'),
	('f173a861-63cc-11f1-8f9b-52540021303b', 'ITM-022', 'Ladder', 'Aluminium folding ladder', NULL, 3900.00, '12ft height, anti-slip steps', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca469f1-535b-11f1-87a9-52540021303b'),
	('f173a963-63cc-11f1-8f9b-52540021303b', 'ITM-023', 'Laptop', 'Business laptop for office use', NULL, 65000.00, 'Intel i7, 16GB RAM, 512GB SSD', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46422-535b-11f1-87a9-52540021303b'),
	('f173aa84-63cc-11f1-8f9b-52540021303b', 'ITM-024', 'Desktop Computer', 'Office workstation computer', NULL, 48000.00, 'Intel i5, 16GB RAM, 1TB SSD', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46422-535b-11f1-87a9-52540021303b'),
	('f173abca-63cc-11f1-8f9b-52540021303b', 'ITM-025', 'Projector', 'Full HD office projector', NULL, 29000.00, '1080p resolution, 4000 lumens', 1, '2026-06-09 06:32:10', '2026-06-09 06:32:10', '6ca46422-535b-11f1-87a9-52540021303b');

-- Dumping structure for table spsyn8lm_construction_db.inventory_requests
CREATE TABLE IF NOT EXISTS `inventory_requests` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `material_id` char(36) DEFAULT NULL,
  `quantity_required` decimal(12,2) DEFAULT NULL,
  `required_date` date DEFAULT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `source_type` enum('Vendor','Warehouse') DEFAULT NULL,
  `status` enum('requested','approved','dispatched','delivered') DEFAULT 'requested',
  `requested_by` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `material_id` (`material_id`),
  KEY `vendor_id` (`vendor_id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_inventory_project` (`project_id`),
  CONSTRAINT `inventory_requests_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_requests_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`),
  CONSTRAINT `inventory_requests_ibfk_3` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `inventory_requests_ibfk_4` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `inventory_requests_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.inventory_requests: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.issue_logs
CREATE TABLE IF NOT EXISTS `issue_logs` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `issue_description` text,
  `responsible_party` varchar(100) DEFAULT NULL,
  `target_resolution_date` date DEFAULT NULL,
  `status` enum('Open','Closed') DEFAULT 'Open',
  `before_photo_url` varchar(500) DEFAULT NULL,
  `after_photo_url` varchar(500) DEFAULT NULL,
  `reported_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `reported_by` (`reported_by`),
  CONSTRAINT `issue_logs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `issue_logs_ibfk_2` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.issue_logs: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.materials
CREATE TABLE IF NOT EXISTS `materials` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.materials: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.permissions: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.pitch_comments
CREATE TABLE IF NOT EXISTS `pitch_comments` (
  `id` char(36) NOT NULL,
  `pitch_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `pitch_comments_pitch_id_index` (`pitch_id`) USING BTREE,
  KEY `pitch_comments_user_id_index` (`user_id`) USING BTREE,
  CONSTRAINT `pitch_comments_pitch_fk` FOREIGN KEY (`pitch_id`) REFERENCES `project_pitch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pitch_comments_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.pitch_comments: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.pitch_references
CREATE TABLE IF NOT EXISTS `pitch_references` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `reference_type` enum('image','link','portfolio') DEFAULT NULL,
  `url` text,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `pitch_references_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.pitch_references: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.project_brief
CREATE TABLE IF NOT EXISTS `project_brief` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `rooms_spaces_required` json DEFAULT NULL,
  `parking_required` tinyint(1) DEFAULT NULL,
  `first_construction_project` tinyint(1) DEFAULT NULL,
  `decision_readiness` varchar(50) DEFAULT NULL,
  `end_to_end_services` tinyint(1) DEFAULT NULL,
  `output_client_profile` json DEFAULT NULL,
  `output_project_profile` json DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `is_approved` tinyint(1) NOT NULL DEFAULT '0',
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `changes_note` text,
  `changes_requested_by` char(36) DEFAULT NULL,
  `changes_requested_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`),
  KEY `project_brief_ibfk_2` (`approved_by`),
  KEY `project_brief_ibfk_3` (`changes_requested_by`),
  CONSTRAINT `project_brief_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_brief_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `project_brief_ibfk_3` FOREIGN KEY (`changes_requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.project_brief: ~3 rows (approximately)
INSERT INTO `project_brief` (`id`, `project_id`, `rooms_spaces_required`, `parking_required`, `first_construction_project`, `decision_readiness`, `end_to_end_services`, `output_client_profile`, `output_project_profile`, `status`, `is_approved`, `approved_by`, `approved_at`, `changes_note`, `changes_requested_by`, `changes_requested_at`, `created_at`, `updated_at`) VALUES
	('8d5072b8-99b7-4d81-bbab-c06519ba49f5', 'ff330cfd-4de6-11f1-bc5e-52540021303b', '""', 0, 0, 'Client Discussion', 0, '""', '""', 'Pending', 0, NULL, NULL, NULL, NULL, NULL, '2026-05-16 11:26:38', '2026-05-30 12:57:34'),
	('f731dd31-f8ac-4934-9d1c-619b3ed69e71', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', '""', 0, 0, NULL, 0, '""', '""', 'Approved', 1, 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '2026-05-21 12:43:25', NULL, NULL, NULL, '2026-05-16 11:38:21', '2026-05-21 12:43:25');

-- Dumping structure for table spsyn8lm_construction_db.project_cost_estimates
CREATE TABLE IF NOT EXISTS `project_cost_estimates` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `estimate_type` enum('Consultation','Turnkey','Constructional') DEFAULT NULL,
  `consultation_fee` decimal(12,2) DEFAULT NULL,
  `tentative_total_cost` decimal(15,2) DEFAULT NULL,
  `material_labour_estimate` json DEFAULT NULL,
  `payment_plan` json DEFAULT NULL,
  `annexure_url` varchar(500) DEFAULT NULL,
  `contract_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_cost_estimates_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.project_cost_estimates: ~0 rows (approximately)
INSERT INTO `project_cost_estimates` (`id`, `project_id`, `estimate_type`, `consultation_fee`, `tentative_total_cost`, `material_labour_estimate`, `payment_plan`, `annexure_url`, `contract_url`, `created_at`, `updated_at`) VALUES
	('9c831aef-2fac-4a3a-bbb3-95a91422db44', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'Consultation', 1229.00, 24600.00, '[{"price": 12300, "title": "random", "description": "random"}, {"price": 12300, "title": "random", "description": "random"}]', '[{"title": "", "amount": null, "description": ""}]', '', '', '2026-06-01 12:05:38', '2026-06-01 12:05:38');

-- Dumping structure for table spsyn8lm_construction_db.project_documents
CREATE TABLE IF NOT EXISTS `project_documents` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `module_name` varchar(50) DEFAULT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `version` int(11) DEFAULT '1',
  `uploaded_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `project_documents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.project_documents: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.project_drawings
CREATE TABLE IF NOT EXISTS `project_drawings` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `drawing_type` enum('Design','Execution','Technical','Construction','Working') DEFAULT NULL,
  `version` int(11) DEFAULT '1',
  `area_floor` varchar(100) DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `approved` tinyint(1) DEFAULT '0',
  `approval_date` datetime DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_drawings_project` (`project_id`),
  CONSTRAINT `project_drawings_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_drawings_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  CONSTRAINT `project_drawings_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.project_drawings: ~1 rows (approximately)
INSERT INTO `project_drawings` (`id`, `project_id`, `drawing_type`, `version`, `area_floor`, `file_url`, `uploaded_by`, `uploaded_at`, `approved`, `approval_date`, `approved_by`) VALUES
	('3811e1ed-42ca-4189-ab52-e9eb6201a23d', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'Design', 1, 'master', 'https://media-buildcon.rippotaiarchitecture.com/0ef0d40c-5bea-4c98-a5e4-badd08a6a078.pdf', NULL, '2026-06-01 12:55:41', 0, NULL, NULL);

-- Dumping structure for table spsyn8lm_construction_db.project_pitch
CREATE TABLE IF NOT EXISTS `project_pitch` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `preferred_design_style` varchar(100) DEFAULT NULL,
  `color_tone` enum('Light','Dark','Mixed','Not Sure') DEFAULT NULL,
  `luxury_level` enum('Low','Medium','High') DEFAULT NULL,
  `functional_vs_aesthetic` text,
  `budget_flexibility` tinyint(1) DEFAULT NULL,
  `priority_areas` json DEFAULT NULL,
  `likes_dislikes` text,
  `non_negotiables` text,
  `special_requirements` text,
  `moodboard_pdf_url` varchar(500) DEFAULT NULL,
  `pitch_pdf_url` varchar(500) DEFAULT NULL,
  `status` enum('Draft','Pending Review','Approved','Rejected') NOT NULL DEFAULT 'Draft',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`),
  KEY `project_pitch_created_by_fk` (`created_by`),
  CONSTRAINT `project_pitch_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `project_pitch_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.project_pitch: ~0 rows (approximately)
INSERT INTO `project_pitch` (`id`, `project_id`, `created_by`, `preferred_design_style`, `color_tone`, `luxury_level`, `functional_vs_aesthetic`, `budget_flexibility`, `priority_areas`, `likes_dislikes`, `non_negotiables`, `special_requirements`, `moodboard_pdf_url`, `pitch_pdf_url`, `status`, `created_at`, `updated_at`) VALUES
	('14b76b09-01a4-4f67-8e36-9f1c20891765', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', NULL, 'Not Sure', 'Medium', NULL, 0, NULL, NULL, NULL, NULL, NULL, 'https://media-buildcon.rippotaiarchitecture.com/1779431326716-DEARCLIENT-09-05-2026Latest.pdf', 'Approved', '2026-05-22 11:58:47', '2026-05-30 11:36:09'),
	('d8885ec0-5e89-484d-af0c-dc92fff6cd70', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', NULL, 'Not Sure', 'Medium', NULL, 0, NULL, NULL, NULL, NULL, NULL, 'https://media-buildcon.rippotaiarchitecture.com/1779360126497-NEW234423.pdf', 'Rejected', '2026-05-21 16:12:09', '2026-05-30 11:36:22');

-- Dumping structure for table spsyn8lm_construction_db.project_vendors
CREATE TABLE IF NOT EXISTS `project_vendors` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `selected` tinyint(1) DEFAULT '0',
  `selection_reason` text,
  `approved_estimate_value` decimal(15,2) DEFAULT NULL,
  `scope_summary` text,
  `final_estimate_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `vendor_id` (`vendor_id`),
  CONSTRAINT `project_vendors_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_vendors_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.project_vendors: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `site_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `project_type` enum('New Construction','Renovation','Interior Fit-out') NOT NULL,
  `service_type` enum('Construction','Interior','Renovation') DEFAULT NULL,
  `purpose` enum('Residential','Commercial','Mixed') DEFAULT NULL,
  `number_of_floors` int(11) DEFAULT NULL,
  `approximate_area_sqft` decimal(12,2) DEFAULT NULL,
  `budget_range` varchar(100) DEFAULT NULL,
  `timeline_expectation` enum('Immediate','Flexible','Fixed Date') DEFAULT NULL,
  `design_preference` varchar(50) DEFAULT NULL,
  `status` enum('brief','pitch','reki_pending','reki_done','scope_done','boq_done','design','execution','vendor_selection','inventory','quality','handover','completed','cancelled','on_hold') DEFAULT 'brief',
  `current_stage` varchar(50) DEFAULT NULL,
  `progress_percentage` decimal(5,2) DEFAULT '0.00',
  `token_received` tinyint(1) DEFAULT '0',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `is_completed` tinyint(1) NOT NULL DEFAULT '0',
  `estimated_start_date` date DEFAULT NULL,
  `estimated_end_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `estimated_budget` decimal(15,2) DEFAULT NULL,
  `final_budget` decimal(15,2) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `site_id` (`site_id`),
  KEY `idx_projects_client` (`client_id`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_created_by` (`created_by`),
  KEY `idx_projects_assigned_to` (`assigned_to`) USING BTREE,
  KEY `idx_projects_archived` (`is_archived`) USING BTREE,
  KEY `idx_projects_completed` (`is_completed`) USING BTREE,
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `projects_ibfk_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.projects: ~3 rows (approximately)
INSERT INTO `projects` (`id`, `client_id`, `site_id`, `name`, `description`, `project_type`, `service_type`, `purpose`, `number_of_floors`, `approximate_area_sqft`, `budget_range`, `timeline_expectation`, `design_preference`, `status`, `current_stage`, `progress_percentage`, `token_received`, `is_archived`, `is_completed`, `estimated_start_date`, `estimated_end_date`, `actual_start_date`, `actual_end_date`, `estimated_budget`, `final_budget`, `created_by`, `assigned_to`, `created_at`, `updated_at`) VALUES
	('d2d1a463-0b75-42d4-8ec9-9203561f193f', '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', NULL, 'new raw12345', NULL, 'Interior Fit-out', 'Interior', 'Residential', NULL, NULL, '', NULL, NULL, 'reki_pending', 'Reki Started', 0.00, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-15 10:29:16', '2026-05-23 15:58:16'),
	('d5e447f4-fe59-483c-b1bd-808e0f501e2d', '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', NULL, 'NEW PROJECT 2', NULL, 'Interior Fit-out', 'Interior', 'Residential', NULL, NULL, NULL, 'Flexible', NULL, 'scope_done', 'Scope Approved', 45.00, 1, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-19 12:40:01', '2026-05-30 11:10:03'),
	('ff330cfd-4de6-11f1-bc5e-52540021303b', 'ff232ecc-4de6-11f1-bc5e-52540021303b', NULL, 'Skyline Residence', NULL, 'New Construction', 'Construction', 'Residential', 2, 4500.00, '1Cr-1.5Cr', '', 'Modern', 'scope_done', 'Scope Approved', 45.00, 0, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-12 15:13:14', '2026-05-30 11:10:09');

-- Dumping structure for table spsyn8lm_construction_db.quality_checks
CREATE TABLE IF NOT EXISTS `quality_checks` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `stage_name` varchar(100) DEFAULT NULL,
  `quality_met` tinyint(1) DEFAULT NULL,
  `deviations` tinyint(1) DEFAULT NULL,
  `corrective_action_required` tinyint(1) DEFAULT NULL,
  `supervisor_remarks` text,
  `checked_date` date DEFAULT NULL,
  `checked_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `checked_by` (`checked_by`),
  CONSTRAINT `quality_checks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quality_checks_ibfk_2` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.quality_checks: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.reki_photos
CREATE TABLE IF NOT EXISTS `reki_photos` (
  `id` char(36) NOT NULL,
  `reki_report_id` char(36) NOT NULL,
  `photo_type` varchar(50) DEFAULT NULL,
  `photo_url` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reki_report_id` (`reki_report_id`),
  CONSTRAINT `reki_photos_ibfk_1` FOREIGN KEY (`reki_report_id`) REFERENCES `reki_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.reki_photos: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.reki_reports
CREATE TABLE IF NOT EXISTS `reki_reports` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `supervisor_id` char(36) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `client_present` tinyint(1) DEFAULT NULL,
  `road_access` tinyint(1) DEFAULT NULL,
  `unloading_space` tinyint(1) DEFAULT NULL,
  `area_type` varchar(30) DEFAULT NULL,
  `neighbouring_buildings` tinyint(1) DEFAULT NULL,
  `working_time_restrictions` text,
  `plot_type` varchar(50) DEFAULT NULL,
  `existing_structure` tinyint(1) DEFAULT NULL,
  `construction_type` varchar(50) DEFAULT NULL,
  `existing_floors` int(11) DEFAULT NULL,
  `structural_cracks` tinyint(1) DEFAULT NULL,
  `built_up_area` decimal(12,2) DEFAULT NULL,
  `floor_to_floor_height` decimal(6,2) DEFAULT NULL,
  `slab_thickness` decimal(6,2) DEFAULT NULL,
  `columns_beams_visible` tinyint(1) DEFAULT NULL,
  `wall_condition` varchar(20) DEFAULT NULL,
  `floor_condition` varchar(20) DEFAULT NULL,
  `dampness` tinyint(1) DEFAULT NULL,
  `dampness_location` text,
  `termite_damage` tinyint(1) DEFAULT NULL,
  `electrical_wiring` tinyint(1) DEFAULT NULL,
  `electrical_panel_location` text,
  `plumbing_lines` tinyint(1) DEFAULT NULL,
  `water_inlet_outlet` text,
  `tanks_present` tinyint(1) DEFAULT NULL,
  `demolition_required` tinyint(1) DEFAULT NULL,
  `demolition_type` varchar(20) DEFAULT NULL,
  `safety_concerns` tinyint(1) DEFAULT NULL,
  `load_bearing_changes` varchar(20) DEFAULT NULL,
  `beam_cutting` tinyint(1) DEFAULT NULL,
  `core_drilling` tinyint(1) DEFAULT NULL,
  `structural_consultant_required` tinyint(1) DEFAULT NULL,
  `power_supply` tinyint(1) DEFAULT NULL,
  `water_supply` tinyint(1) DEFAULT NULL,
  `drainage_available` tinyint(1) DEFAULT NULL,
  `fire_safety_norms` tinyint(1) DEFAULT NULL,
  `major_constraints` text,
  `risk_factors` text,
  `suggestions` text,
  `client_instructions` text,
  `reki_pdf_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `idx_reki_project` (`project_id`),
  CONSTRAINT `reki_reports_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reki_reports_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.reki_reports: ~0 rows (approximately)
INSERT INTO `reki_reports` (`id`, `project_id`, `supervisor_id`, `visit_date`, `client_present`, `road_access`, `unloading_space`, `area_type`, `neighbouring_buildings`, `working_time_restrictions`, `plot_type`, `existing_structure`, `construction_type`, `existing_floors`, `structural_cracks`, `built_up_area`, `floor_to_floor_height`, `slab_thickness`, `columns_beams_visible`, `wall_condition`, `floor_condition`, `dampness`, `dampness_location`, `termite_damage`, `electrical_wiring`, `electrical_panel_location`, `plumbing_lines`, `water_inlet_outlet`, `tanks_present`, `demolition_required`, `demolition_type`, `safety_concerns`, `load_bearing_changes`, `beam_cutting`, `core_drilling`, `structural_consultant_required`, `power_supply`, `water_supply`, `drainage_available`, `fire_safety_norms`, `major_constraints`, `risk_factors`, `suggestions`, `client_instructions`, `reki_pdf_url`, `created_at`, `updated_at`) VALUES
	('993b12c9-5618-4200-9e9d-11974d351117', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', NULL, '0000-00-00', 1, 1, 1, NULL, NULL, NULL, NULL, 1, NULL, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, NULL, 1, NULL, 1, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-22 16:06:52', '2026-05-23 16:09:56'),
	('bfe83c63-4c08-43b6-8613-17a8a5be11a2', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', NULL, '0000-00-00', 1, 1, 1, NULL, NULL, NULL, NULL, 1, NULL, NULL, 1, NULL, 0.00, NULL, NULL, NULL, NULL, 1, NULL, 1, 1, NULL, 1, NULL, 1, 1, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-23 15:58:16', '2026-05-23 15:58:16');

-- Dumping structure for table spsyn8lm_construction_db.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.role_permissions: ~0 rows (approximately)

-- Dumping structure for table spsyn8lm_construction_db.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.roles: ~9 rows (approximately)
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `created_at`, `updated_at`) VALUES
	('e78588de-5404-11f1-87a9-52540021303b', 'developer', 'Developer', 'Responsible for software development and system implementation', '2026-05-20 10:02:26', '2026-05-20 10:02:26'),
	('e7878192-5404-11f1-87a9-52540021303b', 'stylist', 'Stylist', 'Handles styling, aesthetics, and visual presentation', '2026-05-20 10:02:26', '2026-05-20 10:02:26'),
	('e7878537-5404-11f1-87a9-52540021303b', 'interior_designer', 'Interior Designer', 'Designs and plans interior spaces for functionality and aesthetics', '2026-05-20 10:02:26', '2026-05-20 10:02:26'),
	('eb212e37-4dbf-11f1-bc5e-52540021303b', 'user', 'User', 'Basic user role', '2026-05-12 10:33:30', '2026-05-12 10:33:30'),
	('eb215db3-4dbf-11f1-bc5e-52540021303b', 'architect', 'Architect', 'Design and planning access', '2026-05-12 10:33:30', '2026-05-12 10:33:30'),
	('eb2160f7-4dbf-11f1-bc5e-52540021303b', 'client', 'Client', 'Client who requests services', '2026-05-12 10:33:30', '2026-05-12 10:33:30'),
	('eb2161e5-4dbf-11f1-bc5e-52540021303b', 'site_supervisor', 'Site Supervisor', 'On-site supervision and monitoring', '2026-05-12 10:33:30', '2026-05-12 10:33:30'),
	('eb21628c-4dbf-11f1-bc5e-52540021303b', 'admin', 'Admin', 'Administrative access', '2026-05-12 10:33:30', '2026-05-12 10:33:30'),
	('eb216304-4dbf-11f1-bc5e-52540021303b', 'super_admin', 'Super Admin', 'Full system access with all permissions', '2026-05-12 10:33:30', '2026-05-12 10:33:30');

-- Dumping structure for table spsyn8lm_construction_db.scope_of_work
CREATE TABLE IF NOT EXISTS `scope_of_work` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `scope_summary` text,
  `civil_works` json DEFAULT NULL,
  `mep_works` json DEFAULT NULL,
  `interior_works` json DEFAULT NULL,
  `finishes` json DEFAULT NULL,
  `area_summary` json DEFAULT NULL,
  `scope_pdf_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_id` (`project_id`),
  CONSTRAINT `scope_of_work_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.scope_of_work: ~1 rows (approximately)
INSERT INTO `scope_of_work` (`id`, `project_id`, `scope_summary`, `civil_works`, `mep_works`, `interior_works`, `finishes`, `area_summary`, `scope_pdf_url`, `created_at`, `updated_at`) VALUES
	('17958daa-83c7-46cf-aa02-4f1a1df33cdb', 'ff330cfd-4de6-11f1-bc5e-52540021303b', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-28 12:05:06', '2026-05-28 12:05:06'),
	('9596bbf1-9fc4-49b3-b410-1b46bc40e40c', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'Luxury villa renovation project with smart home integration.', '[{"title": "Excavation", "description": "Excavation for additional basement utilities."}, {"title": "RCC Work", "description": "Strengthening existing RCC beams and columns."}, {"title": "Brickwork", "description": "AAC block partition walls for interior segmentation."}]', '[{"title": "HVAC", "description": "VRV air conditioning system installation."}, {"title": "Smart Lighting", "description": "Automated smart lighting system with motion sensors"}, {"title": "Solar", "description": "5KW rooftop solar integration."}]', '[{"title": "Kitchen", "description": "German modular kitchen with quartz countertop."}, {"title": "TV Unit", "description": "Custom fluted panel TV wall"}]', '[{"title": "Wood Finish", "description": "Natural teak veneer polish finish."}, {"title": "False Ceiling", "description": "Gypsum false ceiling with LED strip lighting."}]', '[{"title": "Ground Floor", "description": "2500 sqft"}, {"title": "First Floor", "description": "2200 sqft"}]', NULL, '2026-05-28 12:16:05', '2026-05-28 12:29:23');

-- Dumping structure for table spsyn8lm_construction_db.sites
CREATE TABLE IF NOT EXISTS `sites` (
  `id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `address_id` char(36) NOT NULL,
  `ownership_status` enum('Owned','Rented','Under Process') DEFAULT NULL,
  `access_available` tinyint(1) DEFAULT '1',
  `existing_structure` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sites_address` (`address_id`),
  KEY `idx_sites_client` (`client_id`),
  CONSTRAINT `sites_ibfk_1` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`),
  CONSTRAINT `sites_ibfk_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.sites: ~0 rows (approximately)
INSERT INTO `sites` (`id`, `client_id`, `address_id`, `ownership_status`, `access_available`, `existing_structure`, `created_at`, `updated_at`) VALUES
	('ab287209-a4e3-47ed-832d-dc5f8d418e83', '9d6c85b4-b5cb-487e-bc69-95e06d1a04a9', '343b99ab-2c47-42be-8ea7-d42c90a7267d', 'Owned', 1, 1, '2026-05-22 13:54:23', '2026-05-25 12:04:03');

-- Dumping structure for table spsyn8lm_construction_db.team_tasks
CREATE TABLE IF NOT EXISTS `team_tasks` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `created_by_user_id` char(36) NOT NULL,
  `assigned_to_user_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `module` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `task_type` enum('General','Design upload','Revision response','Site visit','Vendor follow-up','Inventory dispatch','Quality check','Client response','Internal documentation') NOT NULL DEFAULT 'General',
  `status` enum('todo','in_progress','review','completed','blocked') NOT NULL DEFAULT 'todo',
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_team_tasks_project_id` (`project_id`),
  KEY `idx_team_tasks_created_by_user_id` (`created_by_user_id`),
  KEY `idx_team_tasks_assigned_to_user_id` (`assigned_to_user_id`),
  CONSTRAINT `fk_team_tasks_assigned_user` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_team_tasks_created_by_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_team_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.team_tasks: ~26 rows (approximately)
INSERT INTO `team_tasks` (`id`, `project_id`, `created_by_user_id`, `assigned_to_user_id`, `title`, `module`, `due_date`, `priority`, `task_type`, `status`, `description`, `created_at`, `updated_at`) VALUES
	('422087b6-a335-4e77-ba7f-615aec994ebe', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', NULL, 'new pitch update', '', '2026-05-06', 'medium', 'General', 'todo', '', '2026-05-30 10:42:43', '2026-05-30 10:42:43'),
	('83147fc4-63d2-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608a1222-63d2-11f1-8f9b-52540021303b', 'Prepare architectural concept drawings', 'Architecture', '2026-06-15', 'high', 'Design upload', 'in_progress', 'Initial floor plan and elevation concepts', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315b902-63d2-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608ef5eb-63d2-11f1-8f9b-52540021303b', 'Prepare moodboard for living spaces', 'Interior Design', '2026-06-17', 'medium', 'Design upload', 'todo', 'Modern luxury residential theme', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315bc6d-63d2-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efbc5-63d2-11f1-8f9b-52540021303b', 'Conduct site measurement verification', 'Execution', '2026-06-13', 'urgent', 'Site visit', 'todo', 'Verify dimensions before design freeze', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315bd8b-63d2-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efcef-63d2-11f1-8f9b-52540021303b', 'Collect vendor quotations', 'Procurement', '2026-06-18', 'medium', 'Vendor follow-up', 'todo', 'Stone, wood and lighting vendors', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315be8a-63d2-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efe16-63d2-11f1-8f9b-52540021303b', 'Review BOQ quantities', 'Quality', '2026-06-20', 'high', 'Quality check', 'review', 'Cross-check estimated quantities', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c160-63d2-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608ef5eb-63d2-11f1-8f9b-52540021303b', 'Finalize scope drawings', 'Interior', '2026-06-12', 'high', 'Revision response', 'in_progress', 'Update drawings after client comments', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c259-63d2-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efa75-63d2-11f1-8f9b-52540021303b', 'Prepare material palette', 'Styling', '2026-06-15', 'medium', 'Design upload', 'todo', 'Wood, fabric and finish selections', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c347-63d2-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efbc5-63d2-11f1-8f9b-52540021303b', 'Client site walkthrough', 'Execution', '2026-06-11', 'urgent', 'Site visit', 'completed', 'Scope validation completed', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c42e-63d2-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efcef-63d2-11f1-8f9b-52540021303b', 'Follow-up with modular vendors', 'Procurement', '2026-06-16', 'medium', 'Vendor follow-up', 'todo', 'Kitchen and wardrobe vendors', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c516-63d2-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efe16-63d2-11f1-8f9b-52540021303b', 'Review approved scope document', 'Quality', '2026-06-14', 'medium', 'Quality check', 'review', 'Validate scope against client requirements', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c60e-63d2-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608a1222-63d2-11f1-8f9b-52540021303b', 'Perform initial site assessment', 'Architecture', '2026-06-14', 'high', 'Site visit', 'todo', 'Collect measurements and constraints', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c6e8-63d2-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608ef5eb-63d2-11f1-8f9b-52540021303b', 'Prepare concept presentation', 'Design', '2026-06-18', 'medium', 'Design upload', 'todo', 'Initial concept for client discussion', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c7f6-63d2-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efbc5-63d2-11f1-8f9b-52540021303b', 'Coordinate reki visit', 'Execution', '2026-06-10', 'urgent', 'Site visit', 'in_progress', 'Schedule team visit and client availability', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c8d9-63d2-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efe16-63d2-11f1-8f9b-52540021303b', 'Validate site photographs', 'Quality', '2026-06-12', 'medium', 'Quality check', 'todo', 'Ensure documentation completeness', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('8315c9c0-63d2-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', '608efa75-63d2-11f1-8f9b-52540021303b', 'Prepare inspiration board', 'Styling', '2026-06-19', 'low', 'Design upload', 'todo', 'Reference styles and material inspirations', '2026-06-09 12:42:01', '2026-06-09 12:42:01'),
	('9651cd78-63d3-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Implement Activity Log Filters API', 'Activity Logs', '2026-06-11', 'high', 'Internal documentation', 'in_progress', 'Create backend filtering by severity, module, user and date range with pagination support.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651d868-63d3-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Develop RTK Query Integration for Activity Logs', 'Frontend', '2026-06-12', 'high', 'Internal documentation', 'todo', 'Replace axios calls with RTK Query hooks and implement cache invalidation.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651da7e-63d3-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Inventory Module Performance Optimization', 'Inventory', '2026-06-14', 'urgent', 'General', 'todo', 'Optimize inventory listing queries and reduce response times below 300ms.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651dcc0-63d3-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Create Project Dashboard Analytics', 'Projects', '2026-06-16', 'high', 'General', 'todo', 'Develop KPI cards, project progress charts and summary metrics APIs.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651de74-63d3-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Implement Notification Center', 'Notifications', '2026-06-13', 'medium', 'General', 'in_progress', 'Create realtime notification feed using websocket integration.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651e032-63d3-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'BOQ Approval Workflow Development', 'BOQ', '2026-06-17', 'high', 'General', 'todo', 'Implement BOQ approval stages, comments and revision tracking.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651e1b7-63d3-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'User Permission Matrix Refactor', 'RBAC', '2026-06-18', 'high', 'Internal documentation', 'todo', 'Refactor role-permission mapping and add module level access control.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651e400-63d3-11f1-8f9b-52540021303b', 'd5e447f4-fe59-483c-b1bd-808e0f501e2d', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Create Vendor Performance Dashboard', 'Vendors', '2026-06-19', 'medium', 'General', 'todo', 'Track vendor response time, order completion rate and delivery metrics.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651e5a0-63d3-11f1-8f9b-52540021303b', 'ff330cfd-4de6-11f1-bc5e-52540021303b', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'Audit Log Export Feature', 'Activity Logs', '2026-06-20', 'medium', 'General', 'todo', 'Add CSV and Excel export functionality for audit logs.', '2026-06-09 12:49:43', '2026-06-09 12:49:43'),
	('9651e717-63d3-11f1-8f9b-52540021303b', 'd2d1a463-0b75-42d4-8ec9-9203561f193f', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'API Health Monitoring Setup', 'DevOps', '2026-06-15', 'urgent', 'General', 'todo', 'Implement health checks, uptime monitoring and automated alerting.', '2026-06-09 12:49:43', '2026-06-09 12:49:43');

-- Dumping structure for table spsyn8lm_construction_db.units
CREATE TABLE IF NOT EXISTS `units` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `short_name` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_name` (`short_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.units: ~9 rows (approximately)
INSERT INTO `units` (`id`, `name`, `short_name`, `created_at`, `updated_at`) VALUES
	('94827778-58c1-11f1-87a9-52540021303b', 'Square Feet', 'sqft', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('94827eb4-58c1-11f1-87a9-52540021303b', 'Square Meter', 'sqm', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('94827f6f-58c1-11f1-87a9-52540021303b', 'Numbers', 'nos', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('94827fe3-58c1-11f1-87a9-52540021303b', 'Kilogram', 'kg', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('94828055-58c1-11f1-87a9-52540021303b', 'Meter', 'm', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('948280c4-58c1-11f1-87a9-52540021303b', 'Liter', 'ltr', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('94828129-58c1-11f1-87a9-52540021303b', 'Ton', 'ton', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('9482819a-58c1-11f1-87a9-52540021303b', 'Pieces', 'pcs', '2026-05-26 05:13:06', '2026-05-26 05:13:06'),
	('94828206-58c1-11f1-87a9-52540021303b', 'Box', 'box', '2026-05-26 05:13:06', '2026-05-26 05:13:06');

-- Dumping structure for table spsyn8lm_construction_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `avatar_thumbnail` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.users: ~9 rows (approximately)
INSERT INTO `users` (`id`, `role_id`, `name`, `email`, `phone`, `password_hash`, `avatar_url`, `avatar_thumbnail`, `is_active`, `last_login`, `created_at`, `updated_at`, `is_email_verified`) VALUES
	('608a1222-63d2-11f1-8f9b-52540021303b', 'eb215db3-4dbf-11f1-bc5e-52540021303b', 'Arjun Mehra', 'arjun.mehra@rocklime.com', '9811100001', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', NULL, NULL, 1, NULL, '2026-06-09 12:41:03', '2026-06-09 12:41:03', 1),
	('608ef5eb-63d2-11f1-8f9b-52540021303b', 'e7878537-5404-11f1-87a9-52540021303b', 'Riya Kapoor', 'riya.kapoor@rocklime.com', '9811100002', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', NULL, NULL, 1, NULL, '2026-06-09 12:41:03', '2026-06-09 12:41:03', 1),
	('608efa75-63d2-11f1-8f9b-52540021303b', 'e7878192-5404-11f1-87a9-52540021303b', 'Kashish Arora', 'kashish.arora@rocklime.com', '9811100003', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', NULL, NULL, 1, NULL, '2026-06-09 12:41:03', '2026-06-09 12:41:03', 1),
	('608efbc5-63d2-11f1-8f9b-52540021303b', 'eb2161e5-4dbf-11f1-bc5e-52540021303b', 'Vikram Singh', 'vikram.singh@rocklime.com', '9811100004', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', NULL, NULL, 1, NULL, '2026-06-09 12:41:03', '2026-06-09 12:41:03', 1),
	('608efcef-63d2-11f1-8f9b-52540021303b', 'eb212e37-4dbf-11f1-bc5e-52540021303b', 'Nitin Sharma', 'nitin.sharma@rocklime.com', '9811100005', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', NULL, NULL, 1, NULL, '2026-06-09 12:41:03', '2026-06-09 12:41:03', 1),
	('608efe16-63d2-11f1-8f9b-52540021303b', 'eb212e37-4dbf-11f1-bc5e-52540021303b', 'Sneha Gupta', 'sneha.gupta@rocklime.com', '9811100006', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', NULL, NULL, 1, NULL, '2026-06-09 12:41:03', '2026-06-09 12:41:03', 1),
	('7979bea1-942a-4f46-b687-c7d36726241e', 'eb21628c-4dbf-11f1-bc5e-52540021303b', 'Bhav', 'bhav.lamba@rocklime.com', '', '$2b$10$nBTMoG3qXDtoyOwYZvsa4OjJJzUASVhRhdhuIazHBVpsOD5tzLL6q', NULL, NULL, 1, '2026-05-25 11:27:59', '2026-05-14 15:14:04', '2026-05-25 11:42:00', 1),
	('fb522c33-b0ea-4a15-83a0-5f4131e92e80', 'e78588de-5404-11f1-87a9-52540021303b', 'Dhruv Verma', 'dverma@rocklime.com', '8278978827', '$2b$10$7qc3b/tSIi2l639Q.6hj3.NXJTqlhM.NIgie5Z9aH0BF.fK17lw0K', 'https://media-buildcon.rippotaiarchitecture.com/1779435287451-Screenshot-2026-05-22-103635.png', 'https://media-buildcon.rippotaiarchitecture.com/1779435287451-Screenshot-2026-05-22-103635.png', 1, '2026-06-09 11:46:29', '2026-05-14 13:09:39', '2026-06-09 11:46:29', 1);

-- Dumping structure for table spsyn8lm_construction_db.vendor_type_vendor
CREATE TABLE IF NOT EXISTS `vendor_type_vendor` (
  `vendor_id` char(36) NOT NULL,
  `type_id` char(36) NOT NULL,
  PRIMARY KEY (`vendor_id`,`type_id`),
  KEY `fk_vendor_type_vendor_type` (`type_id`),
  CONSTRAINT `fk_vendor_type_vendor_type` FOREIGN KEY (`type_id`) REFERENCES `vendor_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vendor_type_vendor_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.vendor_type_vendor: ~3 rows (approximately)
INSERT INTO `vendor_type_vendor` (`vendor_id`, `type_id`) VALUES
	('564aacdf-4dd3-11f1-bc5e-52540021303b', '5380425f-4dd3-11f1-bc5e-52540021303b'),
	('564ad38a-4dd3-11f1-bc5e-52540021303b', '53803f5e-4dd3-11f1-bc5e-52540021303b'),
	('564ad6ab-4dd3-11f1-bc5e-52540021303b', '538040a8-4dd3-11f1-bc5e-52540021303b');

-- Dumping structure for table spsyn8lm_construction_db.vendor_types
CREATE TABLE IF NOT EXISTS `vendor_types` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vendor_type_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.vendor_types: ~20 rows (approximately)
INSERT INTO `vendor_types` (`id`, `name`) VALUES
	('53803b4d-4dd3-11f1-bc5e-52540021303b', 'Architect'),
	('53803f5e-4dd3-11f1-bc5e-52540021303b', 'Interior Designer'),
	('538040a8-4dd3-11f1-bc5e-52540021303b', 'Furniture Supplier'),
	('5380411d-4dd3-11f1-bc5e-52540021303b', 'Electrician'),
	('53804190-4dd3-11f1-bc5e-52540021303b', 'Plumber'),
	('538041fb-4dd3-11f1-bc5e-52540021303b', 'Painter'),
	('5380425f-4dd3-11f1-bc5e-52540021303b', 'Contractor'),
	('538042bb-4dd3-11f1-bc5e-52540021303b', 'Civil Engineer'),
	('53804323-4dd3-11f1-bc5e-52540021303b', 'Carpenter'),
	('53804382-4dd3-11f1-bc5e-52540021303b', 'Tile Contractor'),
	('538043e4-4dd3-11f1-bc5e-52540021303b', 'Fabricator'),
	('5380443f-4dd3-11f1-bc5e-52540021303b', 'POP Contractor'),
	('538044a1-4dd3-11f1-bc5e-52540021303b', 'False Ceiling'),
	('538044ff-4dd3-11f1-bc5e-52540021303b', 'Glass Work'),
	('53804561-4dd3-11f1-bc5e-52540021303b', 'Aluminium Work'),
	('538045bb-4dd3-11f1-bc5e-52540021303b', 'Hardware Supplier'),
	('5380461f-4dd3-11f1-bc5e-52540021303b', 'Cement Supplier'),
	('5380468d-4dd3-11f1-bc5e-52540021303b', 'Steel Supplier'),
	('538046ed-4dd3-11f1-bc5e-52540021303b', 'Marble Supplier'),
	('5380474a-4dd3-11f1-bc5e-52540021303b', 'Labour Contractor');

-- Dumping structure for table spsyn8lm_construction_db.vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `brand_company_id` char(36) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `position` varchar(150) DEFAULT NULL,
  `type_of_business` varchar(150) DEFAULT NULL,
  `optional_mobile` varchar(20) DEFAULT NULL,
  `notes` text,
  `area_covered` varchar(255) DEFAULT NULL,
  `is_architect` tinyint(1) DEFAULT '0',
  `is_interior` tinyint(1) DEFAULT '0',
  `is_furniture` tinyint(1) DEFAULT '0',
  `age` int(11) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `reference_name` varchar(255) DEFAULT NULL,
  `reference_mobile` varchar(20) DEFAULT NULL,
  `address` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `trade_type` varchar(100) DEFAULT NULL,
  `contact_details` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_construction_db.vendors: ~3 rows (approximately)
INSERT INTO `vendors` (`id`, `name`, `mobile_number`, `brand_company_id`, `company_name`, `position`, `type_of_business`, `optional_mobile`, `notes`, `area_covered`, `is_architect`, `is_interior`, `is_furniture`, `age`, `dob`, `reference_name`, `reference_mobile`, `address`, `is_active`, `created_by`, `updated_by`, `trade_type`, `contact_details`, `created_at`, `updated_at`) VALUES
	('564aacdf-4dd3-11f1-bc5e-52540021303b', 'Rohit Sharma', '9876543210', NULL, 'Sharma Constructions', 'Owner', 'Construction', '9898989898', 'Handles residential projects', 'Delhi NCR', 0, 0, 0, 35, '1991-05-10', 'Amit Verma', '9811111111', '{"city": "Noida", "state": "UP", "street": "Sector 15", "pincode": "201301"}', 1, NULL, NULL, 'Contractor', 'Email: rohit@example.com', '2026-05-12 12:52:30', '2026-05-12 12:52:30'),
	('564ad38a-4dd3-11f1-bc5e-52540021303b', 'Priya Mehta', '9123456780', NULL, 'Elegant Interiors', 'Lead Designer', 'Interior Design', NULL, 'Luxury interior specialist', 'Gurgaon', 0, 1, 0, 30, '1995-08-15', 'Neha Kapoor', '9822222222', '{"city": "Gurgaon", "state": "Haryana", "street": "DLF Phase 2", "pincode": "122002"}', 1, NULL, NULL, 'Interior', 'Instagram: @elegantinteriors', '2026-05-12 12:52:30', '2026-05-12 12:52:30'),
	('564ad6ab-4dd3-11f1-bc5e-52540021303b', 'Arjun Patel', '9988776655', NULL, 'Patel Furniture House', 'Manager', 'Furniture', NULL, 'Custom furniture manufacturer', 'Faridabad', 0, 0, 1, 40, '1985-03-20', 'Raj Malhotra', '9833333333', '{"city": "Faridabad", "state": "Haryana", "street": "Industrial Area", "pincode": "121001"}', 1, NULL, NULL, 'Furniture', 'WhatsApp available', '2026-05-12 12:52:30', '2026-05-12 12:52:30');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

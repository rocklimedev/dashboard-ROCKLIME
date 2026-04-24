-- --------------------------------------------------------
-- Host:                         119.18.54.11
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

-- Dumping data for table spsyn8lm_rocklime_dashboard.brand_parentcategories: ~6 rows (approximately)
INSERT INTO `brand_parentcategories` (`id`, `name`, `slug`, `createdAt`, `updatedAt`, `brandId`, `parentCategoryId`) VALUES
	('158dd2fa-7421-11f0-9e84-52540021303b', 'Plumbing', 'plumbing', '2025-08-08 11:59:49', '2025-08-08 11:59:49', NULL, NULL),
	('94b8daf8-d026-4983-a567-85381c8faded', 'Chemicals & Adhesive', 'chemicals_and_adhesive', '2025-07-30 08:53:20', '2025-07-30 08:53:20', NULL, NULL),
	('a733afe9-78ee-11f0-9e84-52540021303b', 'Accessories & Add Ons', 'accessories_and_add_ons', '2025-08-14 14:41:25', '2025-08-14 14:41:25', NULL, NULL),
	('a73fa5fa-78ee-11f0-9e84-52540021303b', 'Stone', 'stone', '2025-08-14 14:41:25', '2025-08-14 14:41:25', NULL, NULL),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', 'Tiles', 'tiles', '2025-07-30 08:53:20', '2025-07-30 08:53:20', NULL, NULL),
	('f7940b5e-8d97-43be-b37b-0fd6b56e431a', 'CP Fittings & Sanitary', 'cp_fittings_and_sanitary', '2025-07-30 08:53:18', '2025-07-30 08:53:18', NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

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

-- Dumping data for table spsyn8lm_rocklime_dashboard.parentcategories: ~10 rows (approximately)
INSERT INTO `parentcategories` (`id`, `name`, `slug`, `createdAt`, `updatedAt`, `brandParentCategoryId`) VALUES
	('1a76fdf5-a380-4a62-867c-ca32f6bd7f29', 'Grohe Kitchen', 'CT_GK_002', '2025-04-05 07:47:55', '2025-04-05 07:47:55', NULL),
	('282b5212-88b7-4ae8-9a6c-049a285c5f70', 'American Standard', 'CT_AS_001', '2025-04-05 07:47:55', '2025-04-05 07:47:55', NULL),
	('34e5ad50-2d39-4dfe-8726-cb4db364d84d', 'Grohe Bau', 'CT_GB_003', '2025-04-05 07:47:55', '2025-04-05 07:47:55', NULL),
	('53d41af3-b078-45aa-b226-bef6a35ce1c8', 'COLSTON WELLNESS', 'colston-wellness', '2025-08-08 07:00:44', '2025-08-08 07:00:44', NULL),
	('7a5e2bd8-8dfe-4511-a098-6ffd13e0a178', 'Grohe Colour', 'CT_GC_005', '2025-04-05 07:47:55', '2025-04-05 07:47:55', NULL),
	('7b7a5690-1dae-46dd-9de0-601646b66331', 'COLSTON WATER INNOVATION', 'colston-water-innovation', '2025-08-08 07:00:44', '2025-08-08 07:00:44', NULL),
	('80afdfa6-2124-4c58-8d1e-116f9f7d8c56', 'Grohe Premium', 'CT_GP_004', '2025-04-05 07:47:55', '2025-04-05 07:47:55', NULL),
	('cf6cdeb5-7bff-11f0-9e84-52540021303b', 'ACCESSORIES', 'accessories', '2025-08-18 12:21:47', '2025-08-18 12:21:47', 'a733afe9-78ee-11f0-9e84-52540021303b'),
	('d18dd89c-90d2-44dd-8ba4-16783d58bd5e', 'COLSTON BATHROOM', 'colston-bathroom', '2025-08-08 07:00:44', '2025-08-08 07:00:44', NULL),
	('fcec49c3-3931-4120-841c-50d517b2ab1b', 'COLSTON PROJECT', 'colston-project', '2025-08-08 06:46:36', '2025-08-08 06:46:36', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

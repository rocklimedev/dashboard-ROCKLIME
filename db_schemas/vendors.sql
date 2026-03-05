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

-- Dumping data for table spsyn8lm_rocklime_dashboard.vendors: ~7 rows (approximately)
INSERT INTO `vendors` (`id`, `vendorId`, `vendorName`, `brandId`, `brandSlug`, `createdAt`, `updatedAt`) VALUES
	('04a1e87e-baef-49ef-b881-c4ecc0c851a6', 'V_2', 'S4 Bath', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'GB_004', '2025-03-01 10:12:42', '2025-03-01 10:12:42'),
	('0e43317e-2b3b-4a96-8da7-41afbcb7d112', '123', 'GROHE INDIA', '13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', '2026-01-30 11:16:44', '2026-01-30 11:16:44'),
	('18f6e324-5156-42da-8a70-89ec03f93e96', 'V_4', 'Jayna', '25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab', 'JA_003', '2025-03-01 10:12:42', '2025-03-01 10:12:42'),
	('3a4df5ea-e679-4882-8e3e-16004e9c11ce', 'V_1', 'Arth Tiles', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'AS_001', '2025-03-01 10:12:41', '2025-03-01 10:12:41'),
	('919d22fa-911c-4ae9-a7c5-34fc6d400ebe', 'V_747109', 'Unknown', NULL, NULL, '2026-01-30 06:15:47', '2026-01-30 06:15:47'),
	('982b40c6-06b0-4c8e-9d50-ae9b9377f902', 'V_45456', 'YUBB', '39fd411d-7c06-11f0-9e84-52540021303b', 'extras', '2025-10-14 05:07:48', '2025-10-14 05:07:48'),
	('d56421ab-772d-4894-8bb5-a675d41cdc76', 'V_3', 'Groha', '13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', '2025-03-01 10:12:42', '2025-03-01 10:12:42');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

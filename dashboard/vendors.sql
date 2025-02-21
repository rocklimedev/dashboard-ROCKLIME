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

-- Dumping data for table dashboard.vendors: ~0 rows (approximately)
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

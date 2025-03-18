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

-- Dumping structure for table dashboard.categories
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
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `slug_2` (`slug`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `slug_3` (`slug`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `slug_4` (`slug`),
  KEY `vendorId` (`vendorId`),
  KEY `parentCategoryId` (`parentCategoryId`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_131` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_132` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_133` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_134` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_135` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_136` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_137` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_138` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_139` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_140` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_141` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_142` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_143` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_144` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_145` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_146` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_147` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_148` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_149` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_150` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_151` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_4` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_5` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_6` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_7` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_8` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_80` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_81` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_82` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_83` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_84` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_85` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_86` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_87` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_88` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_89` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_9` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_90` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_91` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_92` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_93` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_94` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_95` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_96` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_97` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`),
  CONSTRAINT `categories_ibfk_98` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_99` FOREIGN KEY (`parentCategoryId`) REFERENCES `parentcategories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.categories: ~3 rows (approximately)
INSERT INTO `categories` (`categoryId`, `name`, `total_products`, `vendorId`, `slug`, `parentCategory`, `parentCategoryId`, `createdAt`, `updatedAt`) VALUES
	('0e718b1d-a0ab-47a7-bb51-021e522b5596', 'Sanitary', 0, NULL, 'C_1', 1, NULL, '2025-03-01 10:10:18', '2025-03-01 10:10:18'),
	('748a1b48-aa57-440f-9d85-f6a544b094d5', 'Ceramics', 0, NULL, 'C_2', 1, NULL, '2025-03-01 10:10:18', '2025-03-01 10:10:18'),
	('e84647d5-98d8-46b5-bbae-43e140ff81f2', 'Kitchen', 0, NULL, 'C_3', 1, NULL, '2025-03-01 10:10:18', '2025-03-01 10:10:18');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

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
  `slug` varchar(255) NOT NULL,
  `parentCategory` tinyint(1) NOT NULL,
  `parentCategoryName` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`categoryId`),
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
  KEY `vendorId` (`vendorId`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_3` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_4` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_5` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_6` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `categories_ibfk_7` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`),
  CONSTRAINT `Categories_vendorId_foreign_idx` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.categories: ~1 rows (approximately)
INSERT INTO `categories` (`categoryId`, `name`, `total_products`, `slug`, `parentCategory`, `parentCategoryName`, `createdAt`, `updatedAt`, `vendorId`) VALUES
	('18633ed7-7ec6-432f-bd70-40329967ab35', 'Electronics', 0, 'electronics', 1, NULL, '2025-02-15 11:04:45', '2025-02-15 11:04:45', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

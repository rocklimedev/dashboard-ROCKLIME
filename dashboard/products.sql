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

-- Dumping structure for table dashboard.products
CREATE TABLE IF NOT EXISTS `products` (
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `itemType` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `sellingPrice` decimal(10,2) NOT NULL,
  `purchasingPrice` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `alert_quantity` int DEFAULT NULL,
  `tax` decimal(5,2) DEFAULT NULL,
  `description` text,
  `images` json DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `categoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `productGroup` varchar(100) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `sku_2` (`sku`),
  UNIQUE KEY `sku_3` (`sku`),
  UNIQUE KEY `sku_4` (`sku`),
  UNIQUE KEY `sku_5` (`sku`),
  UNIQUE KEY `sku_6` (`sku`),
  UNIQUE KEY `sku_7` (`sku`),
  UNIQUE KEY `sku_8` (`sku`),
  UNIQUE KEY `sku_9` (`sku`),
  UNIQUE KEY `sku_10` (`sku`),
  UNIQUE KEY `sku_11` (`sku`),
  UNIQUE KEY `sku_12` (`sku`),
  UNIQUE KEY `sku_13` (`sku`),
  UNIQUE KEY `sku_14` (`sku`),
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
  UNIQUE KEY `barcode_12` (`barcode`),
  UNIQUE KEY `barcode_13` (`barcode`),
  UNIQUE KEY `barcode_14` (`barcode`),
  KEY `categoryId` (`categoryId`),
  KEY `user_id` (`user_id`),
  KEY `brandId` (`brandId`),
  CONSTRAINT `Products_brandId_foreign_idx` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_10` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_11` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_12` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_13` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_14` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_15` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_16` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_17` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_18` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_19` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_20` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_21` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_22` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_23` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_24` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_25` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_26` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_27` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`),
  CONSTRAINT `products_ibfk_3` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_5` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_6` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_7` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_8` FOREIGN KEY (`user_id`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_9` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.products: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

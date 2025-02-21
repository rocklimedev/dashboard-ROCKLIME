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

-- Dumping structure for table dashboard.quotations
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
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_10` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_11` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_12` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_13` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_5` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_6` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_8` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_9` FOREIGN KEY (`customerId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.quotations: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

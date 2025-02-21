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

-- Dumping structure for table dashboard.invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoiceId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `client` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `billTo` varchar(255) DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `orderNumber` varchar(100) DEFAULT NULL,
  `invoiceDate` date NOT NULL,
  `dueDate` date NOT NULL,
  `paymentMethod` json DEFAULT NULL,
  `status` enum('paid','unpaid','partially paid') NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `products` json NOT NULL,
  `signatureName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`invoiceId`),
  KEY `client` (`client`),
  KEY `shipTo` (`shipTo`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `invoices_ibfk_12` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_15` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_18` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_21` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_24` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_27` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_30` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_33` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_36` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_37` FOREIGN KEY (`client`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_38` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_39` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_6` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `invoices_ibfk_9` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.invoices: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

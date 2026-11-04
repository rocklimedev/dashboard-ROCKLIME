/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `fgsId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','in_negotiation','confirmed','partial_delivered','delivered','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `orderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `totalAmount` decimal(12,2) DEFAULT '0.00',
  `mongoItemsId` varchar(24) COLLATE utf8_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `poNumber` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `expectDeliveryDate` datetime DEFAULT NULL,
  `warehouseId` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vendorRef` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `paymentTerms` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `deliveryTerms` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `freight` decimal(12,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8_unicode_ci,
  `subTotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discountTotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `taxableValue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gstAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `interState` tinyint(1) NOT NULL DEFAULT '0',
  `roundOff` decimal(8,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `poNumber` (`poNumber`),
  UNIQUE KEY `poNumber_2` (`poNumber`),
  UNIQUE KEY `uk_mongoItemsId` (`mongoItemsId`),
  KEY `vendorId` (`vendorId`),
  KEY `idx_fgsId` (`fgsId`),
  KEY `idx_purchase_orders_userId` (`userId`),
  CONSTRAINT `fk_purchase_orders_fgsId` FOREIGN KEY (`fgsId`) REFERENCES `field_guided_sheets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_orders_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

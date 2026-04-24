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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.purchase_orders
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

-- Dumping data for table spsyn8lm_rocklime_dashboard.purchase_orders: ~4 rows (approximately)
INSERT INTO `purchase_orders` (`id`, `vendorId`, `userId`, `fgsId`, `status`, `orderDate`, `totalAmount`, `mongoItemsId`, `createdAt`, `updatedAt`, `poNumber`, `expectDeliveryDate`) VALUES
	('4002ef1d-2beb-46b7-b6e7-199e5e7f4088', '26264130-b469-4194-a7ca-ce13a0c38225', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'confirmed', '2026-03-31 05:10:42', 849000.00, '69cb57520f0316e909b94d84', '2026-03-31 05:10:42', '2026-03-31 05:11:31', 'PO310326101', '2026-04-18 00:00:00'),
	('5a9cc676-b6b3-4774-8ea1-a1709939fa12', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-11 07:16:42', 202800.00, '69d9f55aafbbeb0666d2d8d4', '2026-04-11 07:16:42', '2026-04-11 07:27:40', 'PO110426102', '2026-04-11 00:00:00'),
	('6d9c8cc6-1832-4934-9306-cd56426d0f85', '26264130-b469-4194-a7ca-ce13a0c38225', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-09 11:43:40', 115300.00, '69d790ec8782c8216bd25594', '2026-04-09 11:43:40', '2026-04-09 11:43:40', 'PO090426101', '2026-04-09 00:00:00'),
	('c7c5820f-ab5b-421b-9ed7-e7bde03e25a2', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-11 06:42:08', 469790.00, '69d9ed40afbbeb0666d2d831', '2026-04-11 06:42:08', '2026-04-11 06:49:28', 'PO110426101', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

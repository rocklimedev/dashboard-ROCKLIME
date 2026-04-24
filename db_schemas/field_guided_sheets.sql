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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.field_guided_sheets
CREATE TABLE IF NOT EXISTS `field_guided_sheets` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fgsNumber` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('draft','negotiating','approved','converted','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `orderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expectDeliveryDate` datetime DEFAULT NULL,
  `totalAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `mongoItemsId` varchar(24) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fgsNumber` (`fgsNumber`),
  UNIQUE KEY `mongoItemsId` (`mongoItemsId`),
  KEY `idx_vendorId` (`vendorId`),
  KEY `idx_status` (`status`),
  KEY `idx_fgsNumber` (`fgsNumber`),
  KEY `idx_mongoItemsId` (`mongoItemsId`),
  KEY `idx_field_guided_sheets_userId` (`userId`),
  CONSTRAINT `fk_field_guided_sheets_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_field_guided_sheets_vendor` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.field_guided_sheets: ~1 rows (approximately)
INSERT INTO `field_guided_sheets` (`id`, `fgsNumber`, `vendorId`, `userId`, `status`, `orderDate`, `expectDeliveryDate`, `totalAmount`, `mongoItemsId`, `createdAt`, `updatedAt`) VALUES
	('13a3c3c1-c059-4315-b502-c634df71f99d', 'FGS060226101', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '5ee872f3-a316-4de6-a55e-959a762f2327', 'converted', '2026-02-06 11:13:59', '2026-02-21 00:00:00', 43870.00, '6985ccf7507d8955fb7202a6', '2026-02-06 11:13:59', '2026-02-06 11:29:57');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

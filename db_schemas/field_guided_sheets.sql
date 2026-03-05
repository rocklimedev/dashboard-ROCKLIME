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

-- Dumping data for table spsyn8lm_rocklime_dashboard.field_guided_sheets: ~10 rows (approximately)
INSERT INTO `field_guided_sheets` (`id`, `fgsNumber`, `vendorId`, `userId`, `status`, `orderDate`, `expectDeliveryDate`, `totalAmount`, `mongoItemsId`, `createdAt`, `updatedAt`) VALUES
	('13a3c3c1-c059-4315-b502-c634df71f99d', 'FGS060226101', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '5ee872f3-a316-4de6-a55e-959a762f2327', 'converted', '2026-02-06 11:13:59', '2026-02-21 00:00:00', 43870.00, '6985ccf7507d8955fb7202a6', '2026-02-06 11:13:59', '2026-02-06 11:29:57'),
	('2136a697-3482-4806-9cfb-918b6846bdfe', 'FGS240126107', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', NULL, 'draft', '2026-01-24 07:36:36', '2026-01-31 00:00:00', 240710.00, '697476845a3550d543aa4db7', '2026-01-24 07:36:36', '2026-01-24 07:36:36'),
	('30268619-6235-43c6-abfc-772985676f3d', 'FGS240126101', '982b40c6-06b0-4c8e-9d50-ae9b9377f902', NULL, 'draft', '2026-01-24 06:58:20', '2026-01-31 00:00:00', 94722.50, '69746d8cc2ab655c3e85b4c2', '2026-01-24 06:58:20', '2026-01-24 06:58:20'),
	('580d5971-00ac-4e33-bd0c-1c200892ee8f', 'FGS240126102', '982b40c6-06b0-4c8e-9d50-ae9b9377f902', NULL, 'draft', '2026-01-24 06:58:20', '2026-01-31 00:00:00', 94722.50, '69746d8cc2ab655c3e85b4cb', '2026-01-24 06:58:20', '2026-01-24 06:58:20'),
	('79a8df66-8550-4630-a8a6-dabd5a3091c6', 'FGS240126106', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, 'draft', '2026-01-24 07:33:14', '2026-01-31 00:00:00', 27020.00, '697475ba0110cd69364da417', '2026-01-24 07:33:14', '2026-01-24 07:33:14'),
	('90ea395b-e0d2-43b4-9f6d-fe59775810e3', 'FGS240126105', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, 'draft', '2026-01-24 07:31:51', '2026-01-31 00:00:00', 4965.00, '697475677ff734f2fdf530ec', '2026-01-24 07:31:51', '2026-01-24 07:31:51'),
	('9446c14b-c00b-4ab7-8ab0-040a0b30ec05', 'FGS240126108', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, 'draft', '2026-01-24 07:37:38', '2026-01-31 00:00:00', 30180.00, '697476c2e5a11ace57b3dd6c', '2026-01-24 07:37:38', '2026-01-24 07:37:38'),
	('bfbf3f4c-5951-4134-93a1-c63afffb3a94', 'FGS240126104', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, 'draft', '2026-01-24 07:26:26', '2026-01-31 00:00:00', 20596.64, '697474227ff734f2fdf530d0', '2026-01-24 07:26:26', '2026-01-24 07:26:26'),
	('c3e45d7f-c2f6-400d-8e43-d8dbff413f61', 'FGS240126103', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, 'draft', '2026-01-24 07:13:27', '2026-01-31 00:00:00', 23970.00, '697471177ff734f2fdf530b3', '2026-01-24 07:13:27', '2026-01-24 07:13:27'),
	('d411674c-611e-4367-b1d8-a823917dd1bf', 'FGS240126109', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '5ee872f3-a316-4de6-a55e-959a762f2327', 'converted', '2026-01-24 07:40:35', '2026-01-31 00:00:00', 27020.00, '69747773353bd71f1714024c', '2026-01-24 07:40:35', '2026-01-24 08:16:36');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

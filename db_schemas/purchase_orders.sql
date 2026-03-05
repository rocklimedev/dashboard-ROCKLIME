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

-- Dumping data for table spsyn8lm_rocklime_dashboard.purchase_orders: ~9 rows (approximately)
INSERT INTO `purchase_orders` (`id`, `vendorId`, `userId`, `fgsId`, `status`, `orderDate`, `totalAmount`, `mongoItemsId`, `createdAt`, `updatedAt`, `poNumber`, `expectDeliveryDate`) VALUES
	('0f12b292-d880-4288-98d8-13d6867aabd0', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-02-10 06:52:18', 447250.16, '698ad5a29a3f5b39f404a972', '2026-02-10 06:52:18', '2026-02-10 07:03:43', 'PO100226101', NULL),
	('26761885-e1d9-48ba-8b5b-1d7dc086d7a8', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', NULL, NULL, 'pending', '2026-02-28 05:48:42', 197100.00, '69a281ba4f26c1ed98149519', '2026-02-28 05:48:42', '2026-02-28 05:48:42', 'PO280226101', '2026-02-28 00:00:00'),
	('4b2f3856-2ed6-493f-b118-5c2a982f0d4b', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-02-06 10:57:05', 4910.00, '6985c9014d8650ba5cc22c0a', '2026-02-06 10:57:05', '2026-02-06 10:57:05', 'PO060226102', '2026-02-21 00:00:00'),
	('57208f76-d3ed-49c7-8f8e-6a5b086cda38', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', NULL, NULL, 'delivered', '2026-02-06 08:31:18', 49950.00, '6985a6d69deb91c669fcdd78', '2026-02-06 08:31:18', '2026-02-06 08:31:33', 'PO060226101', '2026-02-20 00:00:00'),
	('71f4ed54-061b-445a-829e-e08626587120', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-01-30 13:06:08', 77210.00, '697cacc0ab8d8f89cde4b298', '2026-01-30 13:06:08', '2026-01-30 13:06:08', 'PO300126103', '2026-01-30 00:00:00'),
	('86717591-0643-425d-9886-0c1654c3c0f7', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-01-30 13:04:09', 30180.00, '697cac49ab8d8f89cde4b1ad', '2026-01-30 13:04:09', '2026-01-30 13:04:09', 'PO300126102', '2026-01-31 00:00:00'),
	('8c526759-bc88-4afa-a4ad-dec048f65d3a', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-01-30 11:24:27', 45350.00, '697c94ebab8d8f89cde49fa8', '2026-01-30 11:24:27', '2026-01-30 11:24:27', 'PO300126101', NULL),
	('9aca3895-3fc6-4e5b-8ada-61768d9bb2f8', '982b40c6-06b0-4c8e-9d50-ae9b9377f902', NULL, NULL, 'pending', '2026-02-06 11:01:54', 6800.00, '6985ca22d140328aa6b0cdfd', '2026-02-06 11:01:54', '2026-02-06 11:01:55', 'PO060226103', '2026-02-21 00:00:00'),
	('a0e66324-b809-4f03-ac9e-839f78058182', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, 'd411674c-611e-4367-b1d8-a823917dd1bf', 'pending', '2026-01-24 08:16:35', 27020.00, '69747fe3bfb14f2d74cf1faa', '2026-01-24 08:16:35', '2026-01-24 08:16:36', 'PO240126101', '2026-01-31 00:00:00'),
	('a3283eeb-84d4-4d8b-b0b4-cfb04b53cbcc', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, '13a3c3c1-c059-4315-b502-c634df71f99d', 'pending', '2026-02-06 11:29:56', 43870.00, '6985d0b4507d8955fb720387', '2026-02-06 11:29:56', '2026-02-06 11:29:56', 'PO060226105', '2026-02-21 00:00:00'),
	('aff69a38-a461-4081-bca7-32bd309d966b', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-02-10 13:09:24', 114750.00, '698b2e042bf7414db8dba29c', '2026-02-10 13:09:24', '2026-02-10 13:10:44', 'PO100226102', '2026-02-10 00:00:00'),
	('b19dc061-5275-4d5b-8dc9-5e3e495a92ec', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '5ee872f3-a316-4de6-a55e-959a762f2327', NULL, 'confirmed', '2026-02-06 11:07:08', 20555.00, '6985cb5c507d8955fb720255', '2026-02-06 11:07:08', '2026-02-06 11:29:45', 'PO060226104', '2026-02-20 00:00:00'),
	('b32d00cf-c715-4d95-b108-cd5db006d799', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-02-12 13:22:21', 6700.00, '698dd40d32184fdbafaf17d1', '2026-02-12 13:22:21', '2026-02-12 13:22:21', 'PO120226101', '2026-02-18 00:00:00'),
	('b9a51285-dbd7-48ad-a6bf-0d4637d8430d', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', NULL, NULL, 'pending', '2026-01-30 15:54:57', 123000.00, '697cd4542469f333c863625d', '2026-01-30 15:54:57', '2026-01-30 15:55:00', 'PO300126104', '2026-02-13 00:00:00');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

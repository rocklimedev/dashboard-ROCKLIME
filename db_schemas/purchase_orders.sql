-- --------------------------------------------------------
-- Host:                         116.206.104.225
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

-- Dumping data for table spsyn8lm_rocklime_dashboard.purchase_orders: ~27 rows (approximately)
INSERT INTO `purchase_orders` (`id`, `vendorId`, `userId`, `fgsId`, `status`, `orderDate`, `totalAmount`, `mongoItemsId`, `createdAt`, `updatedAt`, `poNumber`, `expectDeliveryDate`) VALUES
	('04d33ffb-bda1-4666-955c-9db6fcd6b659', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-07-24 12:15:05', 42750.00, '6a6357492bfb4d22502f9b26', '2026-07-24 12:15:05', '2026-07-24 12:15:05', 'PO240726101', NULL),
	('1ab991b1-2c8c-4be0-8050-44202e7a1eec', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', NULL, NULL, 'pending', '2026-04-24 11:01:16', 36350.00, '69eb4d7ccaf6050e33e9f0a5', '2026-04-24 11:01:16', '2026-04-25 05:35:26', 'PO240426101', '2026-04-25 00:00:00'),
	('27c33acc-282f-43ec-9dd3-77a1c4739205', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-08-02 06:48:18', 16750.00, '6a6ee8322bfb4d22502fa784', '2026-08-02 06:48:18', '2026-08-02 06:48:18', 'PO020826101', NULL),
	('2e271557-20e5-49ed-8a3c-6320382dd1c9', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-23 06:17:12', 46810.00, '6a3a24e8d9a8d37e7d8c7f9c', '2026-06-23 06:17:12', '2026-06-23 06:37:14', 'PO230626101', '2026-06-23 00:00:00'),
	('393a7136-0612-434a-8077-f8774eb9ebc2', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-07-06 05:17:32', 6660.00, '6a4b3a6cd9a8d37e7d8c8830', '2026-07-06 05:17:32', '2026-07-06 05:17:32', 'PO060726101', NULL),
	('4002ef1d-2beb-46b7-b6e7-199e5e7f4088', '26264130-b469-4194-a7ca-ce13a0c38225', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'confirmed', '2026-03-31 05:10:42', 849000.00, '69cb57520f0316e909b94d84', '2026-03-31 05:10:42', '2026-03-31 05:11:31', 'PO310326101', '2026-04-18 00:00:00'),
	('5a9cc676-b6b3-4774-8ea1-a1709939fa12', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-11 07:16:42', 202800.00, '69d9f55aafbbeb0666d2d8d4', '2026-04-11 07:16:42', '2026-04-11 07:27:40', 'PO110426102', '2026-04-11 00:00:00'),
	('6152c7c0-1217-4360-8245-c789ab8f8b91', '919d22fa-911c-4ae9-a7c5-34fc6d400ebe', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-05 08:34:42', 113986.00, '6a228a225fd950b1c54b7f8e', '2026-06-05 08:34:42', '2026-06-05 08:34:42', 'PO050626101', '2026-06-05 00:00:00'),
	('6d9c8cc6-1832-4934-9306-cd56426d0f85', '26264130-b469-4194-a7ca-ce13a0c38225', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-09 11:43:40', 115300.00, '69d790ec8782c8216bd25594', '2026-04-09 11:43:40', '2026-04-09 11:43:40', 'PO090426101', '2026-04-09 00:00:00'),
	('6ee3f780-733a-48c1-9ce1-761e3a87a68a', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-11 14:24:20', 329140.00, '6a2ac5141682d66d198be2e4', '2026-06-11 14:24:20', '2026-06-11 14:24:20', 'PO110626101', NULL),
	('7ee86af8-9fdb-4954-9541-649906f7b747', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-28 08:37:51', 18370.00, '6a40dd5fd9a8d37e7d8c830e', '2026-06-28 08:37:51', '2026-06-28 08:37:51', 'PO280626101', NULL),
	('8277fc89-99bf-4b65-a626-fec413ece727', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-30 06:38:08', 27050.00, '6a436450d9a8d37e7d8c83e4', '2026-06-30 06:38:08', '2026-06-30 06:38:08', 'PO300626101', '2026-06-30 00:00:00'),
	('a52bb025-f61d-4eb7-9778-c41ff48f7a0f', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-30 12:41:08', 9800.00, '69f34de439ea8b7d70cfe844', '2026-04-30 12:41:08', '2026-04-30 12:41:08', 'PO300426101', '2026-04-30 00:00:00'),
	('aec9ace2-903f-4e0d-8cd9-d2ac5022d96d', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-05-16 12:03:02', 190000.00, '6a085cf6ebde5b834d2bcfc0', '2026-05-16 12:03:02', '2026-05-16 12:03:02', 'PO160526101', '2026-05-16 00:00:00'),
	('b610e730-9252-4f57-b0a6-683bffc56c39', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-07-03 10:23:40', 8200.00, '6a478dacd9a8d37e7d8c8760', '2026-07-03 10:23:40', '2026-07-03 10:23:40', 'PO030726102', NULL),
	('babe2610-f445-48d5-adff-cf06fa287767', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-30 13:51:04', 68200.00, '6a43c9c8d9a8d37e7d8c845e', '2026-06-30 13:51:04', '2026-06-30 13:53:03', 'PO300626103', NULL),
	('bcc23991-6d95-4d8d-acdd-f18398d41c4b', 'b160a51b-b8b3-4a0c-bee1-c044150f180f', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-08-03 07:41:58', 80996.00, '6a7046462bfb4d22502fa811', '2026-08-03 07:41:58', '2026-08-03 07:41:58', 'PO030826101', NULL),
	('bf7eb7c9-39d4-4549-9df3-9e463a715f5c', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-07-03 06:30:04', 128150.00, '6a4756ecd9a8d37e7d8c874f', '2026-07-03 06:30:04', '2026-07-03 06:30:04', 'PO030726101', NULL),
	('c4eac691-23fa-430d-ae09-5e55cd1f1b0f', '3a4df5ea-e679-4882-8e3e-16004e9c11ce', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-27 11:11:00', 156150.00, '6a3fafc4d9a8d37e7d8c82f4', '2026-06-27 11:11:00', '2026-06-27 11:11:00', 'PO270626101', NULL),
	('c7c5820f-ab5b-421b-9ed7-e7bde03e25a2', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-04-11 06:42:08', 469790.00, '69d9ed40afbbeb0666d2d831', '2026-04-11 06:42:08', '2026-04-11 06:49:28', 'PO110426101', NULL),
	('ce9f6792-0493-4393-91d3-7542f0992443', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-07-27 07:34:21', 84480.00, '6a6709fd2bfb4d22502f9bfe', '2026-07-27 07:34:21', '2026-07-27 07:34:21', 'PO270726101', '2026-07-27 00:00:00'),
	('df1f80f5-c9ac-4bcd-a004-47840979b3d0', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-30 07:16:39', 21460.00, '6a436d57d9a8d37e7d8c8414', '2026-06-30 07:16:39', '2026-06-30 07:16:39', 'PO300626102', NULL),
	('e2e144d7-4b80-4988-93e9-4a294a9da4ad', 'b160a51b-b8b3-4a0c-bee1-c044150f180f', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-06-05 08:34:43', 113986.00, '6a228a235fd950b1c54b7f9a', '2026-06-05 08:34:43', '2026-06-05 08:36:38', 'PO050626102', '2026-06-05 00:00:00'),
	('e3941905-f7ed-400a-94c0-ecded87dfc41', '04a1e87e-baef-49ef-b881-c4ecc0c851a6', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-08-01 05:00:57', 355960.00, '6a6d7d892bfb4d22502fa6f8', '2026-08-01 05:00:57', '2026-08-01 05:00:57', 'PO010826101', '2026-08-01 00:00:00'),
	('e981639f-5c8d-460a-847f-391095de9919', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-07-23 14:29:39', 232550.00, '6a6225532bfb4d22502f9a75', '2026-07-23 14:29:39', '2026-07-24 06:49:34', 'PO230726101', '2026-07-24 00:00:00'),
	('e9d4dc68-1407-4a1f-b01a-7b4ab5e04bb5', '919d22fa-911c-4ae9-a7c5-34fc6d400ebe', NULL, NULL, 'pending', '2026-06-02 14:06:12', 175270.00, '6a1ee354e0ad4e081efd33bd', '2026-06-02 14:06:12', '2026-06-02 14:06:12', 'PO020626102', NULL),
	('f5dfa6cb-059f-4d6f-8487-f570a3e6c142', '0e43317e-2b3b-4a96-8da7-41afbcb7d112', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, 'pending', '2026-08-10 09:38:48', 519520.00, '6a799c28c5f0f700c0c9bbc6', '2026-08-10 09:38:48', '2026-08-10 09:38:48', 'PO100826101', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

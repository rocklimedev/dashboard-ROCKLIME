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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('DRAFT','PREPARING','CHECKING','INVOICE','DISPATCHED','PARTIALLY_DELIVERED','DELIVERED','ONHOLD','CANCELED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `dueDate` date DEFAULT NULL,
  `followupDates` json DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `createdFor` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `assignedUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `assignedTeamId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `secondaryUserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `invoiceLink` varchar(500) DEFAULT NULL,
  `gatePassLink` varchar(500) DEFAULT NULL,
  `orderNo` varchar(30) NOT NULL,
  `masterPipelineNo` varchar(20) DEFAULT NULL,
  `previousOrderNo` varchar(20) DEFAULT NULL,
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shipTo` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `products` json DEFAULT NULL,
  `shipping` decimal(12,2) NOT NULL DEFAULT '0.00',
  `gst` decimal(5,2) DEFAULT NULL,
  `gstValue` decimal(12,2) DEFAULT '0.00',
  `extraDiscount` decimal(12,2) DEFAULT '0.00',
  `extraDiscountType` enum('percent','fixed') DEFAULT NULL,
  `extraDiscountValue` decimal(12,2) DEFAULT '0.00',
  `finalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `amountPaid` decimal(14,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_no` (`orderNo`),
  KEY `createdFor` (`createdFor`),
  KEY `createdBy` (`createdBy`),
  KEY `assignedUserId` (`assignedUserId`) USING BTREE,
  KEY `assignedTeamId` (`assignedTeamId`) USING BTREE,
  KEY `secondaryUserId` (`secondaryUserId`) USING BTREE,
  KEY `idx_masterPipelineNo` (`masterPipelineNo`) USING BTREE,
  KEY `idx_previousOrderNo` (`previousOrderNo`) USING BTREE,
  KEY `idx_shipTo` (`shipTo`) USING BTREE,
  KEY `orders_status` (`status`),
  KEY `orders_created_for` (`createdFor`),
  KEY `orders_created_by` (`createdBy`),
  KEY `orders_assigned_user_id` (`assignedUserId`),
  KEY `orders_due_date` (`dueDate`),
  KEY `orders_quotation_id` (`quotationId`),
  KEY `orders_final_amount` (`finalAmount`),
  KEY `orders_created_at` (`createdAt`),
  KEY `idx_order_status_date` (`status`,`createdAt`),
  CONSTRAINT `orders_ibfk_5503` FOREIGN KEY (`createdFor`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5504` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5505` FOREIGN KEY (`assignedUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5506` FOREIGN KEY (`assignedTeamId`) REFERENCES `teams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5507` FOREIGN KEY (`secondaryUserId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5508` FOREIGN KEY (`masterPipelineNo`) REFERENCES `orders` (`orderNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5509` FOREIGN KEY (`previousOrderNo`) REFERENCES `orders` (`orderNo`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5510` FOREIGN KEY (`quotationId`) REFERENCES `quotations` (`quotationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_5511` FOREIGN KEY (`shipTo`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.orders: ~16 rows (approximately)
INSERT INTO `orders` (`id`, `status`, `dueDate`, `followupDates`, `source`, `priority`, `description`, `createdAt`, `updatedAt`, `createdFor`, `createdBy`, `assignedUserId`, `assignedTeamId`, `secondaryUserId`, `invoiceLink`, `gatePassLink`, `orderNo`, `masterPipelineNo`, `previousOrderNo`, `quotationId`, `shipTo`, `products`, `shipping`, `gst`, `gstValue`, `extraDiscount`, `extraDiscountType`, `extraDiscountValue`, `finalAmount`, `amountPaid`) VALUES
	('06e0f030-04b9-483f-9683-622f3337c396', 'PREPARING', '2026-01-16', '[]', '3de072f9-6812-4a21-9262-d03cea45d56b', 'medium', NULL, '2026-01-15 05:03:49', '2026-01-15 05:03:49', 'de0dd927-7b51-4046-ba6b-bdb8575470c3', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, '5ee872f3-a316-4de6-a55e-959a762f2327', NULL, NULL, '150126101', NULL, NULL, NULL, 'b7305202-102b-497a-b7b2-c9afc5fe8e8f', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 75.00, 0.00),
	('172cb558-825b-4414-bf64-74c989ce9234', 'PREPARING', '2026-01-31', '[]', '3de072f9-6812-4a21-9262-d03cea45d56b', 'medium', 'Converted from Quotation #QUO1501266102', '2026-01-15 05:18:16', '2026-01-15 05:18:16', 'a96dcb75-9951-4b7d-81ef-72c3f4889e97', '5ee872f3-a316-4de6-a55e-959a762f2327', 'ae80f818-b3e8-455f-b7db-61764d8d459e', NULL, '4b8b62f3-f6ce-4e46-87c8-c713a02ae71b', NULL, NULL, '150126102', NULL, NULL, '0dc6d24d-6b64-4393-be20-00cd1819c99f', '78a51d61-b935-45ff-875f-681ba838c80b', NULL, 0.00, 0.00, 0.00, NULL, NULL, 0.00, 141500.00, 0.00),
	('1995fa51-d29b-451b-9409-bc9b36c72dee', 'PREPARING', '2026-02-12', '[]', NULL, 'medium', NULL, '2026-02-11 04:42:33', '2026-02-11 04:42:33', 'f7297bc5-39ca-4c83-bbcc-73c4a1229fb5', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, NULL, NULL, NULL, '110226102', NULL, NULL, NULL, 'e11a07e5-c9f4-4432-bb75-e9164dd60c83', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 38670.00, 0.00),
	('1f8657ab-ba99-4858-8c95-3c9a37055159', 'PREPARING', '2026-02-11', '[]', NULL, 'medium', NULL, '2026-02-10 07:34:32', '2026-02-10 07:34:32', '50cf8dc3-2fbf-4581-b033-44729802dcca', '5ee872f3-a316-4de6-a55e-959a762f2327', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', NULL, NULL, NULL, NULL, '100226101', NULL, NULL, NULL, '333e18b4-cb9e-4e1c-9556-743be26c5d92', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 21820.00, 0.00),
	('52193181-477a-425f-a9be-1cfe51ca0d37', 'PARTIALLY_DELIVERED', '2026-01-07', '[]', '788a209c-5176-4d21-acdb-51ac932449ae', 'high', 'Converted from Quotation #QUO3126101', '2026-01-03 10:15:31', '2026-01-13 10:39:21', '3de072f9-6812-4a21-9262-d03cea45d56b', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', '2ef0f07a-a275-4fe1-832d-fe9a5d145f60', NULL, 'b6164c99-b566-11f0-a365-52540021303b', NULL, NULL, '30125101', NULL, NULL, '104c65f5-09af-40e3-beab-f01f4e9aaf9c', '8a365c51-34e6-47fc-8186-c90066c891b6', NULL, 0.00, 0.00, 0.00, 1051.00, 'fixed', 1051.00, 490000.40, 0.00),
	('531be571-e6cf-4dee-a70f-88b4d3d28f0c', 'PREPARING', '2026-02-13', '[]', NULL, 'medium', NULL, '2026-02-12 06:04:13', '2026-02-27 06:36:24', '89bc2daa-784a-4aa1-8a19-2c64e8c90be8', '5ee872f3-a316-4de6-a55e-959a762f2327', 'db669452-1ff2-42b4-bd24-cf9a1cf374ee', NULL, NULL, 'https://static.cmtradingco.com/invoice_pdfs/7031f93b-dbf5-48c7-9245-53b97a457a7f.pdf', 'https://static.cmtradingco.com/invoice_pdfs/3a558179-30b1-4134-a300-cf34a82b9c97-1772174184313.png', '120226102', NULL, NULL, NULL, 'd2d637ea-0aa3-4fff-8784-a792d166acdd', '[{"id": "6691ff52-dd3b-4cb1-8ff2-fda1446c00bd", "tax": 0, "name": "12” Round Stainless Steel Rain Shower Head", "price": 22100, "total": 22100, "discount": 0, "imageUrl": "", "quantity": 1, "companyCode": "", "productCode": "", "discountType": "percent"}, {"id": "84359a24-2ce8-430a-9864-e2d028d6cbf6", "tax": 0, "name": "12” Round Brass Rain Shower Head With Air-In", "price": 38050, "total": 38050, "discount": 0, "imageUrl": "", "quantity": 1, "companyCode": "", "productCode": "", "discountType": "percent"}]', 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 60150.00, 0.00),
	('53fbc3dd-7ad2-4594-a7fe-13ebc7e85861', 'PARTIALLY_DELIVERED', '2026-01-20', '[]', NULL, 'medium', 'Converted from Quotation #QUO200126118', '2026-01-22 04:23:14', '2026-02-01 04:55:36', '4cb519ac-a606-4fc9-bb02-2b80d932baaf', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, '5ee872f3-a316-4de6-a55e-959a762f2327', NULL, NULL, '220126101', NULL, NULL, 'ae5ed1c4-09c7-4fcc-b7d6-620965f36636', '2f7b5aa7-2062-48ac-a61d-4fdff886fbc4', NULL, 0.00, 0.00, 0.00, NULL, NULL, 0.00, 76120.00, 0.00),
	('54e5564e-c364-41f5-baf4-05465f8eacff', 'PREPARING', '2026-02-11', '[]', NULL, 'medium', NULL, '2026-02-10 07:48:02', '2026-02-10 07:48:02', 'f25cabbe-590d-48b8-9729-d1a115b907c5', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, NULL, NULL, NULL, '100226102', NULL, NULL, NULL, '30adb2fc-d42e-485e-84e4-3833f318f17b', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 24320.00, 0.00),
	('568dc7d7-e917-4613-bbaa-555692d8be52', 'PREPARING', '2026-02-12', '[]', NULL, 'medium', NULL, '2026-02-11 04:37:49', '2026-02-11 04:37:49', 'df39321e-5512-452a-85d6-fd54cc362ba7', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, 'db669452-1ff2-42b4-bd24-cf9a1cf374ee', NULL, NULL, '110226101', NULL, NULL, NULL, 'd214d8c8-b5fa-4025-b812-030f89ac43d7', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 3820.00, 0.00),
	('5d224f34-6228-4f5c-9335-2e6b8c767957', 'PREPARING', '2026-01-21', '[]', NULL, 'medium', 'Converted from Quotation #QUO15012666103', '2026-01-15 09:59:27', '2026-01-15 09:59:27', '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', 'ae80f818-b3e8-455f-b7db-61764d8d459e', NULL, NULL, NULL, NULL, '150126103', NULL, NULL, '5541175d-8f14-49b7-a40b-307e2ffb9ec1', '02afd8c5-9c3f-4b5b-8434-fd1a8bb452df', NULL, 0.00, 0.00, 0.00, 6300.00, 'fixed', 6300.00, 270000.00, 0.00),
	('7b486fd4-0858-4a84-9c09-b8939e19a13e', 'DISPATCHED', '2025-12-22', '["2025-12-22"]', '788a209c-5176-4d21-acdb-51ac932449ae', 'high', 'Converted from Quotation #QUO-511950-1536\nfor Ajay Chhabra', '2025-12-20 07:59:09', '2025-12-20 08:08:46', 'f617bbf7-07ec-4370-aff5-22eb07e8f8ef', '2ef0f07a-a275-4fe1-832d-fe9a5d145f60', '2ef0f07a-a275-4fe1-832d-fe9a5d145f60', NULL, 'b6164c99-b566-11f0-a365-52540021303b', 'https://static.cmtradingco.com/invoice_pdfs/11e65d79-0e8d-4402-b60b-1912f7bb6a36.pdf', 'https://static.cmtradingco.com/invoice_pdfs/8916838a-88ec-4227-b681-20738f5c515d-1766218041001.jpeg', '201225102', NULL, NULL, '97f232e6-ee1d-49ab-b58b-a73dca1a3408', '386819aa-3cfc-4db9-8748-027564e93c91', '[]', 1500.00, 0.00, 0.00, NULL, NULL, 0.00, 1500.00, 0.00),
	('8293db0d-d58a-46ac-9efe-05111f457b59', 'INVOICE', '2026-01-22', '[]', NULL, 'medium', 'Converted from Quotation #QUO190126102', '2026-01-19 05:45:06', '2026-01-21 10:43:03', 'c009febe-4def-4eee-b698-c8d2361542fd', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', '419d694e-1e85-418f-a40d-5969195360c0', NULL, '5ee872f3-a316-4de6-a55e-959a762f2327', 'https://static.cmtradingco.com/invoice_pdfs/47baab88-1f7a-475a-aa2c-5958bdd121d0.pdf', 'https://static.cmtradingco.com/invoice_pdfs/96133b37-133c-4cc1-9f45-7fde09ad24a6-1768992182897.png', '190126101', NULL, NULL, 'f11b13cf-44f6-4bbe-9566-4748d60ce2c5', 'ee3b1b73-4b60-4472-9aa4-766acfd93a30', NULL, 1200.00, 0.00, 0.00, 9920.00, 'fixed', 9920.00, 1161199.98, 0.00),
	('aa5e82a0-9bb2-4384-a83b-f8ec69cc56e5', 'PARTIALLY_DELIVERED', '2026-01-22', '[]', 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'medium', 'Converted from Quotation #QUO14126101', '2026-01-14 08:08:10', '2026-01-15 06:50:26', '159e5369-da7b-4ca3-a147-d4a4ac9a920b', '5ee872f3-a316-4de6-a55e-959a762f2327', '70bc6d94-163a-4466-817b-273ee61765a3', NULL, NULL, NULL, NULL, '140125101', NULL, NULL, '12a98873-0fa0-464e-bec0-8ff677c8b6e8', '17ee2c24-1523-4d6a-a785-c6346eb8cbd5', NULL, 0.00, NULL, 0.00, 12.00, 'fixed', 12.00, 29608.00, 0.00),
	('aa7cd7ab-0897-4f75-9bcf-23bb9da6e746', 'PREPARING', '2026-02-13', '[]', NULL, 'medium', NULL, '2026-02-12 05:47:08', '2026-02-12 05:47:08', 'a44fc4df-4272-4046-a36a-a78c4dd12dba', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, NULL, NULL, NULL, '120226101', NULL, NULL, NULL, 'b41f7b14-84f7-49d3-bc24-6d64bc342c1d', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 5200.00, 0.00),
	('b80d68e7-9f20-4d1c-be35-f979f4beacbd', 'PREPARING', '2025-12-30', '["2025-12-22", "2025-12-25"]', 'ce1945aa-9e2e-4012-8dee-e2df7f6db290', 'high', 'Converted from Quotation #QUO-128676-9576\nFor Megha Chhabra', '2025-12-20 04:54:34', '2025-12-20 07:08:38', '788a209c-5176-4d21-acdb-51ac932449ae', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', 'b6164c99-b566-11f0-a365-52540021303b', NULL, 'e30d0df5-b413-462f-9bdc-ae86813add52', 'https://static.cmtradingco.com/invoice_pdfs/012820a5-c858-4e85-9542-beeff86386f9.pdf', 'https://static.cmtradingco.com/invoice_pdfs/4f58d48d-386d-41a3-a518-bb56c2c91f11-1766213896447.jpeg', '201225101', NULL, NULL, '159edb5a-e79f-4834-b423-088da69e2301', 'a0f423f8-7873-430c-a01a-bcbdceac47a5', NULL, 800.00, NULL, 0.00, 870.00, 'fixed', 870.00, 560800.00, 0.00),
	('bc7aacb6-97c5-431a-bcc2-2b4ca8afc807', 'PREPARING', '2026-02-11', '[]', NULL, 'medium', NULL, '2026-02-10 07:49:41', '2026-02-10 07:49:41', 'de0dd927-7b51-4046-ba6b-bdb8575470c3', '5ee872f3-a316-4de6-a55e-959a762f2327', '4b8b62f3-f6ce-4e46-87c8-c713a02ae71b', NULL, NULL, NULL, NULL, '100226103', NULL, NULL, NULL, 'b7305202-102b-497a-b7b2-c9afc5fe8e8f', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 21888.00, 0.00),
	('c1aa193c-65e3-4e93-9084-fa95d15c1308', 'PREPARING', '2026-01-25', '[]', NULL, 'medium', 'Converted from Quotation #QUO150126666104', '2026-01-15 11:03:39', '2026-01-15 11:03:39', 'f05843b8-cbaf-4128-8dd5-e5ed59835d40', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', 'b6164c99-b566-11f0-a365-52540021303b', NULL, 'bdcbd52d-96a2-4643-b1e9-66dc1b10dba9', NULL, NULL, '150126104', NULL, NULL, '72fa1ab7-8a94-4973-b2a9-6f4e122716c1', '3b2f521a-1311-45c9-94b0-b113abd63dfa', NULL, 1350.00, 0.00, 0.00, 402.00, 'fixed', 402.00, 139350.00, 0.00),
	('d12636e3-b106-42e0-92f4-f7dddba40ddd', 'PREPARING', '2026-02-10', '[]', '52b66c48-29ec-4bae-8f99-f73b4a884e5b', 'medium', NULL, '2026-02-09 09:50:41', '2026-02-09 09:50:41', 'f7297bc5-39ca-4c83-bbcc-73c4a1229fb5', '5ee872f3-a316-4de6-a55e-959a762f2327', 'ae80f818-b3e8-455f-b7db-61764d8d459e', NULL, NULL, NULL, NULL, '090226102', NULL, NULL, NULL, 'e11a07e5-c9f4-4432-bb75-e9164dd60c83', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 147450.00, 0.00),
	('d9b399af-75d2-4734-aca6-ca4eb1670e9b', 'PREPARING', '2026-02-14', '[]', NULL, 'medium', 'Converted from Quotation #QUO060226103', '2026-02-07 08:17:05', '2026-02-07 08:17:05', '52b66c48-29ec-4bae-8f99-f73b4a884e5b', 'db669452-1ff2-42b4-bd24-cf9a1cf374ee', '419d694e-1e85-418f-a40d-5969195360c0', NULL, 'db669452-1ff2-42b4-bd24-cf9a1cf374ee', NULL, NULL, '070226101', NULL, NULL, '5670d237-aa3e-4e04-98f2-179396855231', 'a1ceb041-8c11-4148-8149-e07ea3c458e4', NULL, 0.00, NULL, 0.00, NULL, NULL, 0.00, 55994.00, 0.00),
	('fc8bfe6a-a400-4ad2-872d-e1ace0909434', 'PREPARING', '2026-02-28', '[]', NULL, 'medium', 'Converted from Quotation #QUO260226102', '2026-02-27 07:14:35', '2026-02-27 07:14:35', 'fead585e-c32c-40eb-b82f-395f3f744f4d', '5ee872f3-a316-4de6-a55e-959a762f2327', '4b8b62f3-f6ce-4e46-87c8-c713a02ae71b', NULL, NULL, NULL, NULL, '270226101', NULL, NULL, 'fe76fd61-db40-42cb-8b99-34c9651bbea3', '10767e6e-734d-4861-b5d4-1f2cd044d705', '[{"id": "ef0ea9ea-61c7-4da8-b385-fc3da363cbea", "tax": 0, "name": "Angle Valve 1/2\\" x 1/2\\"", "price": 1320, "total": 2640, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/2201600M.png", "quantity": 2, "companyCode": "2201600M", "productCode": "EANGR1600001", "discountType": "percent"}, {"id": "4b4070c2-e391-49a8-a56c-6ca01a576201", "tax": 0, "name": "1-Handle Mixer, Concealed Body", "price": 20500, "total": 20500, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/71512235-7aac-4c4a-9900-d6550927fc55.png", "quantity": 1, "companyCode": "23200000", "productCode": "EWAGR0000022", "discountType": "percent"}]', 0.00, 0.00, 0.00, 90.00, 'fixed', 90.00, 23050.00, 0.00),
	('fe6b03ff-1edc-4a37-913c-dd17f3c311c6', 'PREPARING', '2026-02-10', '[]', '52b66c48-29ec-4bae-8f99-f73b4a884e5b', 'medium', NULL, '2026-02-09 07:05:53', '2026-02-09 07:05:53', 'c21138da-fc5c-474f-92b0-15e500d65011', '5ee872f3-a316-4de6-a55e-959a762f2327', 'b6164c99-b566-11f0-a365-52540021303b', NULL, 'bdcbd52d-96a2-4643-b1e9-66dc1b10dba9', NULL, NULL, '090226101', NULL, NULL, NULL, 'd4d33a3c-2b96-42f8-a1ff-02beb625c6d7', NULL, 0.00, 0.00, 0.00, 0.00, 'percent', 0.00, 67400.00, 0.00);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

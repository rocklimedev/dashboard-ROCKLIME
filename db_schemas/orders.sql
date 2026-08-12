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

-- Dumping data for table spsyn8lm_rocklime_dashboard.orders: ~5 rows (approximately)
INSERT INTO `orders` (`id`, `status`, `dueDate`, `followupDates`, `source`, `priority`, `description`, `createdAt`, `updatedAt`, `createdFor`, `createdBy`, `assignedUserId`, `assignedTeamId`, `secondaryUserId`, `invoiceLink`, `gatePassLink`, `orderNo`, `masterPipelineNo`, `previousOrderNo`, `quotationId`, `shipTo`, `products`, `shipping`, `gst`, `gstValue`, `extraDiscount`, `extraDiscountType`, `extraDiscountValue`, `finalAmount`, `amountPaid`) VALUES
	('479e69a8-a6c0-419f-baa2-25f5ab52d8f0', 'DELIVERED', '2026-05-22', '[]', NULL, 'medium', 'Converted from Quotation #QUO220526101', '2026-05-22 09:42:30', '2026-05-22 09:47:42', 'cae67a86-f23f-4359-a987-c9a4de7d8b72', '12c1816f-87f3-4dc6-9432-942a007b6a4b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, NULL, 'https://media.cmtradingco.com/invoice_pdfs/3df68893-05f6-48d9-9817-2dd41873e2cb.pdf', 'https://media.cmtradingco.com/invoice_pdfs/bbfb76ce-e1cb-4a84-b619-369a0fbaa31d.jpeg', '220526101', NULL, NULL, '0991aba2-b133-4f03-b62d-003f76d0336b', '8669ddd9-dcc1-4330-a2e3-17a8bf8563f3', '[{"tax": 0, "name": "Concealed Valve Body", "price": 2500, "total": 16875, "discount": 55, "imageUrl": "https://media.cmtradingco.com/product_images/29800000.png", "quantity": 15, "productId": "7cdf7da0-0f60-4f71-8c3a-315c56529417", "companyCode": "29800000", "productCode": "ECOGR0000048", "discountType": "percent"}]', 1350.00, 0.00, 0.00, NULL, NULL, 0.00, 18225.00, 0.00),
	('93979cb1-98fd-42d9-a3cd-357e165a7f37', 'INVOICE', '2026-06-02', NULL, NULL, 'medium', 'Converted from Quotation #QUO010626101', '2026-06-01 10:08:45', '2026-06-01 11:42:43', 'cf7a89a9-9dc8-404c-b1c7-debb2f559ccd', '12c1816f-87f3-4dc6-9432-942a007b6a4b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, NULL, 'https://media.cmtradingco.com/invoice_pdfs/3cb2d99b-8ce9-4c0e-97cd-947d87b84bbb.pdf', 'https://media.cmtradingco.com/invoice_pdfs/45556691-3c7a-4c3d-8d06-83eba2bee64a.jpeg', '010626101', NULL, NULL, '8e2bba90-300b-4b7f-b055-4b1ff5d439ef', '651d8e45-9146-47de-ba2b-07d9a0b8153a', '[]', 0.00, 0.00, 0.00, NULL, NULL, 0.00, 0.00, 0.00),
	('a901a6c0-1c56-4c85-ad98-e8c01752344c', 'CHECKING', '2026-04-03', '[]', NULL, 'medium', NULL, '2026-04-02 10:43:19', '2026-06-01 11:20:50', '3de072f9-6812-4a21-9262-d03cea45d56b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, NULL, 'https://media.cmtradingco.com/invoice_pdfs/beb2a93b-35c7-4aea-85db-e6b6c3743a28.pdf', 'https://media.cmtradingco.com/invoice_pdfs/2610ea5f-08e6-4f55-a1ce-350c81b88561.jpg', '020426101', NULL, NULL, NULL, '2a83a530-70aa-41c3-bdc5-75d16b3c8abe', '[{"tax": 0, "name": "1-Handle Mixer, Concealed Body", "price": 20500, "total": 20500, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/71512235-7aac-4c4a-9900-d6550927fc55.png", "quantity": 1, "productId": "4b4070c2-e391-49a8-a56c-6ca01a576201", "companyCode": "23200000", "productCode": "EWAGR0000022", "discountType": "percent"}, {"tax": 0, "name": "1-Handle Mixer, Concealed Body", "price": 26850, "total": 26850, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/0cc1de72-79f0-462e-8dbf-446e2bdceea9.png", "quantity": 1, "productId": "8782e707-27ef-446c-a91c-3b5863c0ae39", "companyCode": "23571000", "productCode": "EWAGR1000001", "discountType": "percent"}, {"tax": 0, "name": "Acc: black Caesarstone inlay set 1 (2x) for basin OHM L- and XL-size", "price": 38350, "total": 38350, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/6864a1b9-8d0e-44db-9d8b-799b81f1ab4a.png", "quantity": 1, "productId": "39cb8b06-75dd-48d5-b4b6-763d7ce8d11b", "companyCode": "48457000", "productCode": "EKIGR7000004", "discountType": "percent"}]', 0.00, 18.00, 15426.00, 700.00, 'fixed', 700.00, 100426.00, 0.00),
	('ca492008-c09a-44b8-b6b7-3232c6affb9d', 'DISPATCHED', '2026-06-08', '[]', NULL, 'medium', 'Converted from Quotation #QUO080626101', '2026-06-08 10:33:52', '2026-06-08 11:07:25', '0293eafe-6457-43e9-8035-2961cd396f9b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, NULL, 'https://media.cmtradingco.com/invoice_pdfs/b300a412-8443-409f-89c1-25eb81cc812d.pdf', 'https://media.cmtradingco.com/invoice_pdfs/83716938-a207-4660-99dd-6b8b10c91d6d.jpeg', '080626101', NULL, NULL, '3a4a27f7-c426-4b17-ac39-a12aeb5bfe52', 'c7be37ac-bf3e-464e-b371-3223fcb8be0a', '[{"tax": 0, "name": "Eurosmart 1-Handle Wall Mount Kitchen Mixer", "price": 27050, "total": 17582.5, "discount": 35, "imageUrl": "https://media.cmtradingco.com/product_images/32482003.jpg", "quantity": 1, "productId": "d1f34a41-8ddc-49ea-8a29-f96f985dac75", "companyCode": "32482003", "productCode": "EKIGR2003004", "discountType": "percent"}]', 0.00, 0.00, 0.00, NULL, NULL, 0.00, 17582.50, 0.00),
	('f8e8faf8-6a59-4dc0-91f2-bc3166fddc17', 'DISPATCHED', '2026-06-09', '[]', NULL, 'medium', 'Converted from Quotation #QUO080626102', '2026-06-08 12:13:28', '2026-06-08 13:52:26', 'f3830a6f-641d-419a-8560-8cdb6a9267b9', '12c1816f-87f3-4dc6-9432-942a007b6a4b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, NULL, 'https://media.cmtradingco.com/invoice_pdfs/4c5a08cf-8e18-4506-a096-6d29a9b5ed15.pdf', 'https://media.cmtradingco.com/invoice_pdfs/4434887c-177b-41f6-8fb8-a1a2105fb834.jpeg', '080626102', NULL, NULL, '1e4d3ea4-cbe1-44d3-9f33-681651d77a8b', 'cce45771-4480-469d-8e5c-5a6f7be7b503', '[{"tax": 0, "name": "Acacia E In-Wall Vessel Mixer", "price": 24600, "total": 14022, "discount": 43, "imageUrl": "https://media.cmtradingco.com/product_images/FFAS1304-101GL0BF0.png", "quantity": 1, "productId": "7c3b98fb-1a86-4dcd-b1b4-924a4e6890e7", "companyCode": "FFAS1304-101GL0BF0", "productCode": "EKIAM0000027", "discountType": "percent"}, {"tax": 0, "name": "Retro Maxx 3+ Diverter Body", "price": 44998, "total": 23398.96, "discount": 48, "imageUrl": "", "quantity": 1, "productId": "5fc245e9-26fa-447b-8997-b7348d2bbcf1", "companyCode": "LS-MD-11204", "productCode": "ECLCO00007356", "discountType": "percent"}, {"tax": 0, "name": "Concealed Valve Body", "price": 2700, "total": 1175, "discount": 1525, "imageUrl": "https://media.cmtradingco.com/product_images/29800000.png", "quantity": 1, "productId": "7cdf7da0-0f60-4f71-8c3a-315c56529417", "companyCode": "29800000", "productCode": "ECOGR0000048", "discountType": "fixed"}, {"tax": 0, "name": "Ventura Wall Hung Toilet", "price": 29998, "total": 15598.96, "discount": 48, "imageUrl": "", "quantity": 1, "productId": "37e0299a-d809-45a4-a4bd-1394ca068690", "companyCode": "SN-WC-21007", "productCode": "ECLCO00007483", "discountType": "percent"}, {"tax": 0, "name": "Gd2 Flushing Cistern, without Frame, 1.13 M, 6-9", "price": 6200, "total": 3100, "discount": 3100, "imageUrl": "https://media.cmtradingco.com/product_images/3898700I.png", "quantity": 1, "productId": "8af5f8d7-66a4-4b25-b5de-e26d99827813", "companyCode": "3898700I", "productCode": "ECOGR7000004", "discountType": "fixed"}]', 0.00, 0.00, 0.00, NULL, NULL, 0.00, 57294.92, 0.00);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

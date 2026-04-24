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

-- Dumping data for table spsyn8lm_rocklime_dashboard.orders: ~0 rows (approximately)
INSERT INTO `orders` (`id`, `status`, `dueDate`, `followupDates`, `source`, `priority`, `description`, `createdAt`, `updatedAt`, `createdFor`, `createdBy`, `assignedUserId`, `assignedTeamId`, `secondaryUserId`, `invoiceLink`, `gatePassLink`, `orderNo`, `masterPipelineNo`, `previousOrderNo`, `quotationId`, `shipTo`, `products`, `shipping`, `gst`, `gstValue`, `extraDiscount`, `extraDiscountType`, `extraDiscountValue`, `finalAmount`, `amountPaid`) VALUES
	('9a49953b-c6b6-47ad-b7c3-a17b60f9ea25', 'PREPARING', '2026-04-08', '[]', 'a7e926e2-29b0-4c49-a4ca-71bed9e038d1', 'medium', NULL, '2026-04-07 06:13:48', '2026-04-07 06:14:21', '2f0c1526-9e5d-4399-81b2-ba2004a3eef0', '5ee872f3-a316-4de6-a55e-959a762f2327', '419d694e-1e85-418f-a40d-5969195360c0', NULL, 'b6164c99-b566-11f0-a365-52540021303b', 'https://static.cmtradingco.com/invoice_pdfs/39dcaca3-9c32-4486-b40b-45ed436b6b8a.pdf', 'https://static.cmtradingco.com/invoice_pdfs/2904caa4-21c0-4dbd-b10e-5ad37207c7e4.png', '070426101', NULL, NULL, NULL, '1825be7b-15b1-466e-b2a5-1862b4185180', '[{"tax": 0, "name": "test 234", "price": 12344, "total": 12344, "discount": 0, "imageUrl": "", "quantity": 1, "productId": "d04a3d40-9750-4c13-899d-7828bae4b745", "companyCode": "19450002", "productCode": "EGRGR00022392", "discountType": "percent"}]', 0.00, 18.00, 2221.92, 0.00, 'fixed', 0.00, 14565.92, 0.00),
	('a901a6c0-1c56-4c85-ad98-e8c01752344c', 'CHECKING', '2026-04-03', '[]', NULL, 'medium', NULL, '2026-04-02 10:43:19', '2026-04-10 04:34:51', '3de072f9-6812-4a21-9262-d03cea45d56b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', '12c1816f-87f3-4dc6-9432-942a007b6a4b', NULL, NULL, 'https://media.cmtradingco.com/invoice_pdfs/beb2a93b-35c7-4aea-85db-e6b6c3743a28.pdf', NULL, '020426101', NULL, NULL, NULL, '2a83a530-70aa-41c3-bdc5-75d16b3c8abe', '[{"tax": 0, "name": "1-Handle Mixer, Concealed Body", "price": 20500, "total": 20500, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/71512235-7aac-4c4a-9900-d6550927fc55.png", "quantity": 1, "productId": "4b4070c2-e391-49a8-a56c-6ca01a576201", "companyCode": "23200000", "productCode": "EWAGR0000022", "discountType": "percent"}, {"tax": 0, "name": "1-Handle Mixer, Concealed Body", "price": 26850, "total": 26850, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/0cc1de72-79f0-462e-8dbf-446e2bdceea9.png", "quantity": 1, "productId": "8782e707-27ef-446c-a91c-3b5863c0ae39", "companyCode": "23571000", "productCode": "EWAGR1000001", "discountType": "percent"}, {"tax": 0, "name": "Acc: black Caesarstone inlay set 1 (2x) for basin OHM L- and XL-size", "price": 38350, "total": 38350, "discount": 0, "imageUrl": "https://static.cmtradingco.com/product_images/6864a1b9-8d0e-44db-9d8b-799b81f1ab4a.png", "quantity": 1, "productId": "39cb8b06-75dd-48d5-b4b6-763d7ce8d11b", "companyCode": "48457000", "productCode": "EKIGR7000004", "discountType": "percent"}]', 0.00, 18.00, 15426.00, 700.00, 'fixed', 700.00, 100426.00, 0.00);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

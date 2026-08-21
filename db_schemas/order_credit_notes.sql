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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_credit_notes
CREATE TABLE IF NOT EXISTS `order_credit_notes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderNo` varchar(30) NOT NULL,
  `creditNoteNumber` varchar(100) DEFAULT NULL,
  `creditNoteLink` varchar(500) DEFAULT NULL,
  `creditNoteDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `totalQuantity` decimal(14,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `reason` text,
  `remarks` text,
  `status` enum('DRAFT','ISSUED','RECEIVED','CANCELED') NOT NULL DEFAULT 'ISSUED',
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_credit_notes_order_id` (`orderId`) USING BTREE,
  KEY `idx_order_credit_notes_order_no` (`orderNo`) USING BTREE,
  KEY `idx_order_credit_notes_number` (`creditNoteNumber`) USING BTREE,
  KEY `idx_order_credit_notes_status` (`status`) USING BTREE,
  KEY `idx_order_credit_notes_date` (`creditNoteDate`) USING BTREE,
  KEY `fk_order_credit_notes_created_by` (`createdBy`),
  CONSTRAINT `fk_order_credit_notes_created_by` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_credit_notes_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

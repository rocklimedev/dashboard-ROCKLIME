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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_dispatches
CREATE TABLE IF NOT EXISTS `order_dispatches` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderNo` varchar(30) NOT NULL,
  `dispatchNumber` int(11) NOT NULL,
  `items` json NOT NULL,
  `totalQuantity` int(11) NOT NULL DEFAULT '0',
  `totalAmount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `dispatchDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `carrier` varchar(150) DEFAULT NULL,
  `trackingNumber` varchar(150) DEFAULT NULL,
  `gatePassLink` varchar(500) DEFAULT NULL,
  `remarks` text,
  `dispatchedBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('DISPATCHED','DELIVERED','RETURNED') NOT NULL DEFAULT 'DISPATCHED',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_order_dispatch_number` (`orderId`,`dispatchNumber`) USING BTREE,
  KEY `idx_order_dispatches_order_id` (`orderId`) USING BTREE,
  KEY `idx_order_dispatches_order_no` (`orderNo`) USING BTREE,
  KEY `idx_order_dispatches_dispatch_date` (`dispatchDate`) USING BTREE,
  KEY `fk_order_dispatches_dispatched_by` (`dispatchedBy`),
  CONSTRAINT `fk_order_dispatches_dispatched_by` FOREIGN KEY (`dispatchedBy`) REFERENCES `users` (`userId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_dispatches_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.order_credit_note_items
CREATE TABLE IF NOT EXISTS `order_credit_note_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `creditNoteId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productCode` varchar(100) DEFAULT NULL,
  `name` varchar(500) NOT NULL,
  `quantity` decimal(14,2) NOT NULL,
  `price` decimal(14,2) NOT NULL,
  `discount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discountType` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `tax` decimal(14,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_credit_note_items_credit_note_id` (`creditNoteId`) USING BTREE,
  KEY `idx_credit_note_items_order_id` (`orderId`) USING BTREE,
  KEY `idx_credit_note_items_product_id` (`productId`) USING BTREE,
  CONSTRAINT `fk_credit_note_items_credit_note` FOREIGN KEY (`creditNoteId`) REFERENCES `order_credit_notes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_credit_note_items_order` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_credit_note_items_product` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

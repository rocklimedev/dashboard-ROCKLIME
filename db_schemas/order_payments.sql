/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `order_payments` (
  `id` char(36) NOT NULL,
  `receiptNo` varchar(40) NOT NULL,
  `orderId` char(36) NOT NULL,
  `orderNo` varchar(64) DEFAULT NULL,
  `customerId` char(36) DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `mode` varchar(20) NOT NULL DEFAULT 'UPI',
  `reference` varchar(120) DEFAULT NULL,
  `receivedAt` datetime NOT NULL,
  `notes` text,
  `status` varchar(12) NOT NULL DEFAULT 'RECEIVED',
  `cancelReason` text,
  `userId` char(36) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_payments_receiptNo_unique` (`receiptNo`),
  KEY `order_payments_orderId` (`orderId`),
  KEY `order_payments_customerId` (`customerId`),
  KEY `order_payments_receivedAt` (`receivedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

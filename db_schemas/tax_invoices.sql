/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `tax_invoices` (
  `id` char(36) NOT NULL,
  `invoiceNo` varchar(16) NOT NULL,
  `financialYear` varchar(5) NOT NULL,
  `invoiceDate` date NOT NULL,
  `orderId` char(36) NOT NULL,
  `orderNo` varchar(64) DEFAULT NULL,
  `dispatchId` char(36) DEFAULT NULL,
  `customerId` char(36) DEFAULT NULL,
  `customerName` varchar(255) DEFAULT NULL,
  `customerGstin` varchar(15) DEFAULT NULL,
  `billTo` json DEFAULT NULL,
  `shipTo` json DEFAULT NULL,
  `placeOfSupply` varchar(60) DEFAULT NULL,
  `interState` tinyint(1) NOT NULL DEFAULT '0',
  `lines` json NOT NULL,
  `goodsValue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `freight` decimal(14,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(14,2) NOT NULL DEFAULT '0.00',
  `taxableValue` decimal(14,2) NOT NULL DEFAULT '0.00',
  `gstRate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `cgst` decimal(14,2) NOT NULL DEFAULT '0.00',
  `sgst` decimal(14,2) NOT NULL DEFAULT '0.00',
  `igst` decimal(14,2) NOT NULL DEFAULT '0.00',
  `roundOff` decimal(6,2) NOT NULL DEFAULT '0.00',
  `total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `ewayBillNo` varchar(20) DEFAULT NULL,
  `vehicleNo` varchar(20) DEFAULT NULL,
  `irn` varchar(64) DEFAULT NULL,
  `status` varchar(12) NOT NULL DEFAULT 'ISSUED',
  `cancelReason` text,
  `cancelledAt` datetime DEFAULT NULL,
  `createdBy` char(36) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tax_invoices_invoiceNo_unique` (`invoiceNo`),
  KEY `idx_tax_invoices_orderId` (`orderId`),
  KEY `idx_tax_invoices_customerId` (`customerId`),
  KEY `idx_tax_invoices_invoiceDate` (`invoiceDate`),
  KEY `idx_tax_invoices_dispatchId` (`dispatchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

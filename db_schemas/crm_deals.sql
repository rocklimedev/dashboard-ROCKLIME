/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `crm_deals` (
  `id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `contactName` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `company` varchar(150) DEFAULT NULL,
  `customerType` varchar(30) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `source` varchar(60) DEFAULT NULL,
  `stage` varchar(20) NOT NULL DEFAULT 'capture',
  `amount` decimal(14,2) DEFAULT NULL,
  `expectedClose` date DEFAULT NULL,
  `ownerId` char(36) DEFAULT NULL,
  `tag` varchar(20) DEFAULT NULL,
  `lostReason` varchar(300) DEFAULT NULL,
  `description` text,
  `customerId` char(36) DEFAULT NULL,
  `quotationId` char(36) DEFAULT NULL,
  `orderId` char(36) DEFAULT NULL,
  `biginId` varchar(40) DEFAULT NULL,
  `biginSyncedAt` datetime DEFAULT NULL,
  `biginError` varchar(300) DEFAULT NULL,
  `stageEnteredAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closedAt` datetime DEFAULT NULL,
  `createdBy` char(36) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_crm_deals_biginId` (`biginId`),
  KEY `idx_crm_deals_stage` (`stage`),
  KEY `idx_crm_deals_customerId` (`customerId`),
  KEY `idx_crm_deals_quotationId` (`quotationId`),
  KEY `idx_crm_deals_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

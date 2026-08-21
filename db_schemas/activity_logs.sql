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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `activityLogId` char(36) COLLATE utf8mb4_bin NOT NULL,
  `userId` char(36) COLLATE utf8mb4_bin DEFAULT NULL,
  `contextTag` enum('AUTH','CRM','CATALOG','SALES','PROCUREMENT','INVENTORY','SYSTEM') COLLATE utf8mb4_bin NOT NULL,
  `subContext` enum('USER','CUSTOMER','VENDOR','BRAND','CATEGORY','PRODUCT','QUOTATION','ORDER','FIELD_GUIDED_SHEET','PURCHASE_ORDER','TEAM','ADDRESS') COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `entityId` char(36) COLLATE utf8mb4_bin DEFAULT NULL,
  `entityName` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `description` text COLLATE utf8mb4_bin,
  `severity` enum('info','warning','error','critical') COLLATE utf8mb4_bin NOT NULL DEFAULT 'info',
  `oldValues` json DEFAULT NULL,
  `newValues` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ipAddress` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_bin,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`activityLogId`),
  KEY `idx_activity_logs_user_id` (`userId`),
  CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

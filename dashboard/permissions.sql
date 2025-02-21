-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               9.2.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table dashboard.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `action` varchar(100) NOT NULL,
  `methods` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `action` (`action`),
  UNIQUE KEY `action_2` (`action`),
  UNIQUE KEY `action_3` (`action`),
  UNIQUE KEY `action_4` (`action`),
  UNIQUE KEY `action_5` (`action`),
  UNIQUE KEY `action_6` (`action`),
  UNIQUE KEY `action_7` (`action`),
  UNIQUE KEY `action_8` (`action`),
  UNIQUE KEY `action_9` (`action`),
  UNIQUE KEY `action_10` (`action`),
  UNIQUE KEY `action_11` (`action`),
  UNIQUE KEY `action_12` (`action`),
  UNIQUE KEY `action_13` (`action`),
  UNIQUE KEY `action_14` (`action`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_10` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_11` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_12` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_13` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_4` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_5` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_6` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_7` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_8` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_9` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.permissions: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

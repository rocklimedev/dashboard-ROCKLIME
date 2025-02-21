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

-- Dumping structure for table dashboard.rolepermissions
CREATE TABLE IF NOT EXISTS `rolepermissions` (
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `permissions` json NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `role_name` (`role_name`),
  UNIQUE KEY `role_name_2` (`role_name`),
  UNIQUE KEY `role_name_3` (`role_name`),
  UNIQUE KEY `role_name_4` (`role_name`),
  UNIQUE KEY `role_name_5` (`role_name`),
  UNIQUE KEY `role_name_6` (`role_name`),
  UNIQUE KEY `role_name_7` (`role_name`),
  UNIQUE KEY `role_name_8` (`role_name`),
  UNIQUE KEY `role_name_9` (`role_name`),
  UNIQUE KEY `role_name_10` (`role_name`),
  UNIQUE KEY `role_name_11` (`role_name`),
  UNIQUE KEY `role_name_12` (`role_name`),
  UNIQUE KEY `role_name_13` (`role_name`),
  UNIQUE KEY `role_name_14` (`role_name`),
  KEY `userId` (`userId`),
  CONSTRAINT `rolepermissions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_10` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_11` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_12` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_13` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_5` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_6` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_7` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_8` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `rolepermissions_ibfk_9` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.rolepermissions: ~2 rows (approximately)
INSERT INTO `rolepermissions` (`roleId`, `role_name`, `permissions`, `createdAt`, `updatedAt`, `userId`) VALUES
	('4e60b78c-3e8b-4d92-b88c-89ed535bf4a7', 'Admin-UP', '["read", "write", "delete"]', '2025-02-15 10:38:22', '2025-02-15 10:38:22', NULL),
	('ae2e6398-8ab2-43ce-a84d-61875d584b61', 'Admin', '["read", "write", "delete"]', '2025-02-15 10:36:20', '2025-02-15 10:36:20', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

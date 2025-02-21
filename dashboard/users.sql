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

-- Dumping structure for table dashboard.users
CREATE TABLE IF NOT EXISTS `users` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `role` enum('superadmin','admin','Accounts','users','staff') NOT NULL,
  `status` enum('active','inactive','restricted') NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `email_14` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_10` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_11` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_12` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_13` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_4` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_5` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_6` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_7` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_8` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_9` FOREIGN KEY (`role_id`) REFERENCES `rolepermissions` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.users: ~1 rows (approximately)
INSERT INTO `users` (`userId`, `username`, `name`, `email`, `mobileNumber`, `role`, `status`, `password`, `role_id`, `createdAt`, `updatedAt`) VALUES
	('f73086f0-e8f0-46dd-994c-2c26b60770ec', 'dashingvijay', 'dashingvijay', 'user1@example.com', NULL, 'users', 'active', '$2a$10$ef/4xHEX2Aogp/cjIIoKEOtWOMBrnLMWR8Dx.iCv/pHVz3GlJxapG', NULL, '2025-02-15 09:22:54', '2025-02-15 09:22:54');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

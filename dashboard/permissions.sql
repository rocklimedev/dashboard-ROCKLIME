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
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `route` varchar(255) NOT NULL,
  `name` enum('view','delete','write','edit') NOT NULL,
  PRIMARY KEY (`permissionId`),
  UNIQUE KEY `route` (`route`),
  UNIQUE KEY `route_2` (`route`),
  UNIQUE KEY `route_3` (`route`),
  UNIQUE KEY `route_4` (`route`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_36` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_37` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_38` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_39` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_4` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_40` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_41` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_42` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_43` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_44` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_45` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_46` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_47` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_48` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_49` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_5` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_50` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_51` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_52` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_53` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_54` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_55` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_56` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_57` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_58` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_59` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_6` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_60` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_61` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_62` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_63` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_64` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_65` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_66` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_67` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_68` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_69` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_7` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_70` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_71` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_72` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_73` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_74` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_75` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_76` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_77` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_78` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_79` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_8` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_80` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_81` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_82` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_83` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_84` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_85` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_86` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_87` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_88` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissions_ibfk_9` FOREIGN KEY (`role_id`) REFERENCES `roles` (`roleId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.permissions: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

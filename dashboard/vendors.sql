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

-- Dumping structure for table dashboard.vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `vendorId` varchar(255) NOT NULL,
  `vendorName` varchar(255) NOT NULL,
  `brandId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `brandSlug` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendorId` (`vendorId`),
  UNIQUE KEY `vendorId_2` (`vendorId`),
  UNIQUE KEY `vendorId_3` (`vendorId`),
  UNIQUE KEY `vendorId_4` (`vendorId`),
  KEY `brandId` (`brandId`),
  KEY `brandSlug` (`brandSlug`),
  CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_129` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_130` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_131` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_132` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_133` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_134` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_135` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_136` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_137` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_138` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_139` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_140` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_141` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_142` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_143` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_144` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_145` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_146` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_147` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_148` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_149` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_150` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_151` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_152` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_153` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_154` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_155` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_156` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_157` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_158` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_159` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_160` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_161` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_162` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_163` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_164` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_165` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_166` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_167` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_168` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_169` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_170` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_171` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_172` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_173` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_174` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_175` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_176` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_177` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_178` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_179` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_180` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_181` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_182` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_183` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_184` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_185` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_186` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_4` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_40` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_41` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_42` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_43` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_44` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_45` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_46` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_47` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_48` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_49` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_5` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_50` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_51` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_52` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_53` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_54` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_55` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_56` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_57` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_58` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_59` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_6` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_60` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_61` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_62` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_63` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_64` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_65` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_66` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_67` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_68` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_69` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_7` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_70` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_71` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_72` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_73` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_74` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_75` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_76` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_77` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_78` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_79` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_8` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_80` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_81` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_82` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_83` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_84` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_85` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_86` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_87` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_88` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_89` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_9` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_90` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_91` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_92` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_93` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_94` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_95` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_96` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_97` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_98` FOREIGN KEY (`brandSlug`) REFERENCES `brands` (`brandSlug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_99` FOREIGN KEY (`brandId`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.vendors: ~5 rows (approximately)
INSERT INTO `vendors` (`id`, `vendorId`, `vendorName`, `brandId`, `brandSlug`, `createdAt`, `updatedAt`) VALUES
	('04a1e87e-baef-49ef-b881-c4ecc0c851a6', 'V_2', 'S4 Bath', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'GB_004', '2025-03-01 10:12:42', '2025-03-01 10:12:42'),
	('18f6e324-5156-42da-8a70-89ec03f93e96', 'V_4', 'Jayna', '25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab', 'JA_003', '2025-03-01 10:12:42', '2025-03-01 10:12:42'),
	('3a4df5ea-e679-4882-8e3e-16004e9c11ce', 'V_1', 'Arth Tiles', '4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'AS_001', '2025-03-01 10:12:41', '2025-03-01 10:12:41'),
	('bed3059b-c368-4941-8c0a-34c298cc53da', 'V_64', 'riftttt', NULL, 'JA_003', '2025-03-10 10:16:39', '2025-03-10 10:16:39'),
	('d56421ab-772d-4894-8bb5-a675d41cdc76', 'V_3', 'Groha', '13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', '2025-03-01 10:12:42', '2025-03-01 10:12:42');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

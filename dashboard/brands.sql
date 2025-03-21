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

-- Dumping structure for table dashboard.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  `brandName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brandSlug` (`brandSlug`),
  UNIQUE KEY `brandSlug_2` (`brandSlug`),
  UNIQUE KEY `brandSlug_3` (`brandSlug`),
  UNIQUE KEY `brandSlug_4` (`brandSlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.brands: ~5 rows (approximately)
INSERT INTO `brands` (`id`, `brandSlug`, `brandName`, `createdAt`, `updatedAt`) VALUES
	('13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', 'Grohe Premium', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab', 'JA_003', 'Jayna', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('3b83a3bd-ded7-476b-b0ba-a7e094d07dad', 'JA_00334', 'eliiiot', '2025-03-10 10:25:01', '2025-03-10 10:25:01'),
	('4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'AS_001', 'American Standard', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('d642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'GB_004', 'Grohe Bau', '2025-03-01 10:10:42', '2025-03-01 10:10:42');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

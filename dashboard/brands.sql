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
  `brandName` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brandSlug` (`brandSlug`),
  UNIQUE KEY `brandSlug_2` (`brandSlug`),
  UNIQUE KEY `brandSlug_3` (`brandSlug`),
  UNIQUE KEY `brandSlug_4` (`brandSlug`),
  UNIQUE KEY `brandSlug_5` (`brandSlug`),
  UNIQUE KEY `brandSlug_6` (`brandSlug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.brands: ~0 rows (approximately)
INSERT INTO `brands` (`id`, `brandName`, `createdAt`, `updatedAt`, `brandSlug`) VALUES
	('3395a37c-1549-472d-9d97-119471e612fc', 'Grohe Bau', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'GB_004'),
	('9b84740a-c1ef-4e80-a4df-e3c349d1e42a', 'Jayna', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'JA_003'),
	('efb728dd-c9b4-4520-97b8-8ec8c41255cc', 'American Standard', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'AS_001'),
	('ff6e65e2-d343-4aca-86c6-bb1e668d5018', 'Grohe Premium', '2025-02-20 06:00:29', '2025-02-20 06:00:29', 'GP_002');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

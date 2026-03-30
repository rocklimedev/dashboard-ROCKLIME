-- --------------------------------------------------------
-- Host:                         119.18.54.11
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brands
CREATE TABLE IF NOT EXISTS `brands` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `brandSlug` varchar(255) NOT NULL,
  `brandName` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `brands_brand_name` (`brandName`),
  UNIQUE KEY `brands_brand_slug` (`brandSlug`),
  UNIQUE KEY `brandSlug` (`brandSlug`),
  UNIQUE KEY `brandName` (`brandName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.brands: ~12 rows (approximately)
INSERT INTO `brands` (`id`, `brandSlug`, `brandName`, `createdAt`, `updatedAt`) VALUES
	('13847c2c-3c91-4bb2-a130-f94928658237', 'GP_002', 'Grohe Premium', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('1e19b647-1138-11f1-b773-52540021303b', 'perk', 'PERK', '2026-02-24 09:50:14', '2026-02-24 09:50:14'),
	('25df6ffd-16a5-4cd2-8c4b-c7a18a3f18ab', 'JA_003', 'Jayna', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('39fd411d-7c06-11f0-9e84-52540021303b', 'extras', 'EXTRAS', '2025-08-18 13:07:43', '2025-08-18 13:07:43'),
	('4e3acf32-1e47-4d38-a6bb-417addd52ac0', 'AS_001', 'American Standard', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('500b10a7-7686-11f0-9e84-52540021303b', 'shiv-ceramic', 'SHIV CERAMIC', '2025-08-11 13:09:28', '2025-08-11 13:09:28'),
	('50105657-7686-11f0-9e84-52540021303b', 'sgt', 'SGT', '2025-08-11 13:09:28', '2025-08-11 13:09:28'),
	('50106480-7686-11f0-9e84-52540021303b', 'jtc', 'JTC', '2025-08-11 13:09:28', '2025-08-11 13:09:28'),
	('501073c4-7686-11f0-9e84-52540021303b', 'baleno-grey', 'BALENO GREY', '2025-08-11 13:09:28', '2025-08-11 13:09:28'),
	('50107b22-7686-11f0-9e84-52540021303b', 'uw', 'UW', '2025-08-11 13:09:28', '2025-08-11 13:09:28'),
	('501083c0-7686-11f0-9e84-52540021303b', 'ibis', 'IBIS', '2025-08-11 13:09:28', '2025-08-11 13:09:28'),
	('70a6bfc1-7bf3-11f0-9e84-52540021303b', 'jk_adhesive', 'JK_ADHESIVE', '2025-08-18 10:53:14', '2025-08-18 10:53:14'),
	('70b2c3f3-7bf3-11f0-9e84-52540021303b', 'walplast', 'WALPLAST', '2025-08-18 10:53:14', '2025-08-18 10:53:14'),
	('987bb747-773d-11f0-9e84-52540021303b', 'subway', 'SUBWAY', '2025-08-12 11:01:28', '2025-08-12 11:01:28'),
	('acbe7061-9b76-47d1-a509-e4b1f982a36f', 'colston', 'Colston', '2025-07-30 07:59:10', '2025-07-30 07:59:10'),
	('c69121e3-7686-11f0-9e84-52540021303b', 'sunheart', 'SUNHEART', '2025-08-11 13:12:47', '2025-08-11 13:12:47'),
	('d642a7f4-9bb9-4d91-bcf3-fd63b438b85e', 'GB_004', 'Grohe Bau', '2025-03-01 10:10:42', '2025-03-01 10:10:42'),
	('f84227c5-9852-11f0-ac50-52540021303b', 'plumbing', 'Plumbing', '2025-09-23 13:27:36', '2025-09-23 13:27:36');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

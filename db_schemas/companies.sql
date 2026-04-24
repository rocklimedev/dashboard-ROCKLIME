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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.companies
CREATE TABLE IF NOT EXISTS `companies` (
  `companyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `createdDate` date NOT NULL,
  `slug` varchar(255) NOT NULL,
  `parentCompanyId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`companyId`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `parentCompanyId` (`parentCompanyId`),
  CONSTRAINT `companies_ibfk_1` FOREIGN KEY (`parentCompanyId`) REFERENCES `companies` (`companyId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.companies: ~5 rows (approximately)
INSERT INTO `companies` (`companyId`, `name`, `address`, `website`, `createdDate`, `slug`, `parentCompanyId`, `createdAt`, `updatedAt`) VALUES
	('3dec65cc-3d93-4b12-b060-6e0374f375d9', 'SP SYNDICATE PRIVATE LIMITED', '123, Main Street, Mumbai, India', 'https://spsyndicate.com', '2005-07-20', 'sp-syndicate-private-limited', NULL, '2025-03-12 10:57:43', '2025-03-12 10:57:43'),
	('401df7ef-f350-4bc4-ba6f-bf36923af252', 'CHABBRA MARBEL', '123, Main Street, Mumbai, India', 'https://cmtradingco.com/', '2005-07-20', 'chabbra-marbel', NULL, '2025-03-12 11:03:07', '2025-03-12 11:03:07'),
	('5f87b3a4-6b9b-4208-ad00-e197d5d19763', 'EMBARK ENTERPRISES', '123, Main Street, Mumbai, India', 'https://sarvesa.in', '2005-07-20', 'embark-enterprises', NULL, '2025-03-12 11:00:28', '2025-03-12 11:00:28'),
	('5ffbaa43-2cea-410f-b604-8b6e5558b2e8', 'RIPPOTAI ARCHITECTURE', '123, Main Street, Mumbai, India', 'https://rippotaiarchitecture.com/', '2005-07-20', 'rippotai-architecture', NULL, '2025-03-12 11:01:37', '2025-03-12 11:01:37'),
	('87a5c590-5a81-4893-985e-f19a0ad0b122', 'ROCKLIME', '123, Main Street, Mumbai, India', 'https://cmtradingco.com/', '2005-07-20', 'rocklime', NULL, '2025-03-12 11:04:18', '2025-03-12 11:04:18');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

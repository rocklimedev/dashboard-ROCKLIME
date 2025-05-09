-- --------------------------------------------------------
-- Host:                         119.18.54.11
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
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


-- Dumping database structure for spsyn8lm_rocklime_dashboard
CREATE DATABASE IF NOT EXISTS `spsyn8lm_rocklime_dashboard` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `spsyn8lm_rocklime_dashboard`;

-- Dumping structure for table spsyn8lm_rocklime_dashboard.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `roleName` varchar(100) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE KEY `roleName` (`roleName`),
  UNIQUE KEY `roleName_62` (`roleName`),
  UNIQUE KEY `roleName_63` (`roleName`),
  UNIQUE KEY `roleName_2` (`roleName`),
  UNIQUE KEY `roleName_3` (`roleName`),
  UNIQUE KEY `roleName_4` (`roleName`),
  UNIQUE KEY `roleName_5` (`roleName`),
  UNIQUE KEY `roleName_6` (`roleName`),
  UNIQUE KEY `roleName_7` (`roleName`),
  UNIQUE KEY `roleName_8` (`roleName`),
  UNIQUE KEY `roleName_9` (`roleName`),
  UNIQUE KEY `roleName_10` (`roleName`),
  UNIQUE KEY `roleName_11` (`roleName`),
  UNIQUE KEY `roleName_12` (`roleName`),
  UNIQUE KEY `roleName_13` (`roleName`),
  UNIQUE KEY `roleName_14` (`roleName`),
  UNIQUE KEY `roleName_15` (`roleName`),
  UNIQUE KEY `roleName_16` (`roleName`),
  UNIQUE KEY `roleName_17` (`roleName`),
  UNIQUE KEY `roleName_18` (`roleName`),
  UNIQUE KEY `roleName_19` (`roleName`),
  UNIQUE KEY `roleName_20` (`roleName`),
  UNIQUE KEY `roleName_21` (`roleName`),
  UNIQUE KEY `roleName_22` (`roleName`),
  UNIQUE KEY `roleName_23` (`roleName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.roles: ~7 rows (approximately)
INSERT INTO `roles` (`roleId`, `roleName`, `createdAt`, `updatedAt`) VALUES
	('0c3392e0-f416-407c-8699-e8638554eba9', 'USERS', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('5bb7eed4-1106-4b93-9218-ad733cfc7b12', 'DEVELOPER', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('c2eaf23a-765c-4ee5-91bf-cbc37fbdea21', 'SUPER_ADMIN', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 'SALES', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('cfbe02d3-c61d-4f09-9bc7-88fb2493f31d', 'ACCOUNTS', '2025-03-18 09:59:47', '2025-03-18 09:59:47'),
	('faa429f2-b1c8-4534-a521-ad8f5a4104cc', 'OPS', '2025-04-24 09:39:42', '2025-04-24 09:39:42'),
	('ffb71a9e-3f2e-4e26-97e4-8611591356b0', 'ADMIN', '2025-03-18 09:59:47', '2025-03-18 09:59:47');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

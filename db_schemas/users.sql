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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.users
CREATE TABLE IF NOT EXISTS `users` (
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `roles` varchar(255) DEFAULT 'USERS',
  `status` enum('active','inactive','restricted') NOT NULL DEFAULT 'inactive',
  `password` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `shiftFrom` time DEFAULT NULL,
  `shiftTo` time DEFAULT NULL,
  `bloodGroup` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `emergencyNumber` varchar(20) DEFAULT NULL,
  `roleId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `isEmailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `photo_thumbnail` varchar(255) DEFAULT NULL,
  `photo_original` varchar(255) DEFAULT NULL,
  `addressId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `email_2` (`email`),
  KEY `roleId` (`roleId`),
  KEY `addressId` (`addressId`),
  CONSTRAINT `users_ibfk_63` FOREIGN KEY (`roleId`) REFERENCES `roles` (`roleId`) ON UPDATE CASCADE,
  CONSTRAINT `users_ibfk_64` FOREIGN KEY (`addressId`) REFERENCES `addresses` (`addressId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.users: ~12 rows (approximately)
INSERT INTO `users` (`userId`, `username`, `name`, `email`, `mobileNumber`, `roles`, `status`, `password`, `createdAt`, `updatedAt`, `dateOfBirth`, `shiftFrom`, `shiftTo`, `bloodGroup`, `emergencyNumber`, `roleId`, `isEmailVerified`, `photo_thumbnail`, `photo_original`, `addressId`) VALUES
	('12c1816f-87f3-4dc6-9432-942a007b6a4b', 'NITISHCMT', 'NITISH ', 'nitish7834@gmail.com', NULL, 'SALES', 'active', '$2b$10$WRBrNzfBASVV65i7E27yIehOKdKrzhTIj0/1YeUJVoIA6SfvJJTaC', '2026-03-07 06:11:10', '2026-03-07 06:11:10', NULL, NULL, NULL, NULL, NULL, 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 1, NULL, NULL, NULL),
	('2ef0f07a-a275-4fe1-832d-fe9a5d145f60', 'ajaychhabra', 'Ajay Chhabra', 'ajay@rocklime.com', NULL, 'SUPER_ADMIN', 'active', '$2b$10$uXMciajyt/hN0sP3tHZgZefGP5AUEcwALAziH6wrV64ETcvL6YPkC', '2025-08-07 07:10:26', '2026-02-07 11:52:11', NULL, NULL, NULL, NULL, NULL, 'c2eaf23a-765c-4ee5-91bf-cbc37fbdea21', 1, NULL, NULL, NULL),
	('419d694e-1e85-418f-a40d-5969195360c0', 'sajjan.dagaura', 'Sajjan Dagaura', 'sdagaura@rocklime.com', '8278978827', 'SALES', 'active', '$2b$10$obUQqA7CW501oWe67rm5zed9EdbZ380snobMlKS8UGc.ghWDsqj0O', '2025-10-31 11:43:58', '2025-11-17 13:12:08', NULL, NULL, NULL, NULL, NULL, 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 1, 'https://static.cmtradingco.com/user_photos/38fb3dc7-f9e4-43fd-bff3-8d6a5b8559fd_thumb', 'https://static.cmtradingco.com/user_photos/38fb3dc7-f9e4-43fd-bff3-8d6a5b8559fd', NULL),
	('4b8b62f3-f6ce-4e46-87c8-c713a02ae71b', 'hemraj', 'Hemraj ', 'accounts@embarkent.in', NULL, 'ACCOUNTS', 'active', '$2b$10$sCaRfZrQIv/3JhtHVWWn5.ECN0qclarGkYa9Rclo/uBYzHYiQOZwO', '2025-11-29 10:28:50', '2025-11-29 10:32:54', NULL, NULL, NULL, NULL, NULL, 'cfbe02d3-c61d-4f09-9bc7-88fb2493f31d', 1, NULL, NULL, NULL),
	('56a3ba45-0557-47ac-bb5d-409f93d6661d', 'priyanka', 'PRIYANKA', 'admin@chhabramarble.com', NULL, 'ADMIN', 'active', '$2b$10$VfBH8z7vHlesBI1rwf6qQuNnjZ3tQRf78LkqPogfw2tq5pTZMhXEm', '2025-10-10 05:45:01', '2025-11-08 07:16:02', NULL, '09:30:00', '18:30:00', NULL, NULL, 'ffb71a9e-3f2e-4e26-97e4-8611591356b0', 1, NULL, NULL, NULL),
	('5ee872f3-a316-4de6-a55e-959a762f2327', 'd.verma', 'Dhruv Verma', 'dverma@rocklime.com', '8278978827', 'DEVELOPER', 'active', '$2b$10$rLCS.g1mh5hYAIgZJ21j9.OXhrZjdhoUhkeyJKKypgd3FPevN078C', '2025-10-13 10:44:07', '2026-03-14 10:54:47', '2021-05-09', '09:00:00', '17:30:00', 'B+', '', '5bb7eed4-1106-4b93-9218-ad733cfc7b12', 1, 'https://static.cmtradingco.com/user_photos/fc26534f-a4c1-4665-a27b-bee49ee23b4b_thumb', 'https://static.cmtradingco.com/user_photos/fc26534f-a4c1-4665-a27b-bee49ee23b4b', '9bb30911-a061-4079-bf84-4765df476b8d'),
	('70bc6d94-163a-4466-817b-273ee61765a3', 'Nitin@7', 'Nitin', 'nitindeol@rocklime.com', NULL, 'DEVELOPER', 'active', '$2b$10$PT9Dy106QT6T2bDPgR5QTOnRoTHJvLI7e9Rv5dFAqTmTS4fcidCGy', '2025-12-19 09:33:36', '2025-12-19 09:33:36', NULL, NULL, NULL, NULL, NULL, '5bb7eed4-1106-4b93-9218-ad733cfc7b12', 1, NULL, NULL, NULL),
	('7dceca2f-1058-4c81-b877-fcd1dac03687', 'raju', 'Raju kapoor', 'rajukapoor@cmt.com', '8810480383', 'SALES', 'active', '$2b$10$qe7k9uokkRpVubI1sWIH.eXSnrzTOsGzTUMRNI/etC/HRnQbCaRfe', '2026-03-28 09:43:58', '2026-03-28 09:43:58', NULL, NULL, NULL, NULL, NULL, 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 1, NULL, NULL, NULL),
	('ae80f818-b3e8-455f-b7db-61764d8d459e', 'lakshay', 'lakshay', 'accounts@chhabramarble.com', NULL, 'ACCOUNTS', 'active', '$2b$10$VEu7TfGAc/X2yF4QuAJ/BeZ4D0A1Q2v7CyL3V3TTMV6QKHBRbQI86', '2025-11-29 10:47:24', '2025-11-29 10:50:26', NULL, NULL, NULL, NULL, NULL, 'cfbe02d3-c61d-4f09-9bc7-88fb2493f31d', 1, NULL, NULL, NULL),
	('b6164c99-b566-11f0-a365-52540021303b', 'priya_galhotra', 'Priya Galhotra', 'pgalhotra@rocklime.com', NULL, 'ADMIN', 'active', '$2b$10$z8vCph4uWmNqgEJfH4Kx6eKImu8g/IMDhf8C6DPp1a3dAGV3JIbqK', '2025-10-30 13:31:59', '2025-11-11 05:14:53', NULL, NULL, NULL, NULL, NULL, 'ffb71a9e-3f2e-4e26-97e4-8611591356b0', 1, NULL, NULL, NULL),
	('d90fcfe6-05a7-471b-b122-36b04e53aac2', 'bhav.rocklime', 'Bhav', 'bhav.lamba@rocklime.com', '9250206208', 'DEVELOPER', 'active', '$2b$10$TNTPy/V1doDth3RzJH2inOw/ISInFGnkQ69XzaXNHrlWQt8i1SoUi', '2025-10-13 10:23:46', '2026-01-14 06:12:03', '2000-01-07', NULL, NULL, 'B+', '9250206207', '5bb7eed4-1106-4b93-9218-ad733cfc7b12', 1, 'https://static.cmtradingco.com/user_photos/6ad2244a-fdae-4a87-aff0-877219a089f6_thumb', 'https://static.cmtradingco.com/user_photos/6ad2244a-fdae-4a87-aff0-877219a089f6', '5d5fe8c4-92de-4eb6-9dca-cb27b62336d6'),
	('db669452-1ff2-42b4-bd24-cf9a1cf374ee', 'demouser', 'DEMO USER', 'demouser@gmail.com', NULL, 'DEVELOPER', 'active', '$2b$10$uvA1/umyVzu9JDove0yDm.gqsUq9z1ADd9jfn3ttbNnfT/DEmLYx.', '2025-10-27 10:22:31', '2026-02-07 08:19:42', NULL, NULL, NULL, NULL, NULL, '5bb7eed4-1106-4b93-9218-ad733cfc7b12', 1, NULL, NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

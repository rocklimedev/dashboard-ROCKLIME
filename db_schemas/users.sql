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
	('12c1816f-87f3-4dc6-9432-942a007b6a4b', 'NITISHCMT', 'NITISH ', 'nitish7834@gmail.com', NULL, 'SALES', 'active', '$2b$10$WRBrNzfBASVV65i7E27yIehOKdKrzhTIj0/1YeUJVoIA6SfvJJTaC', '2026-03-07 06:11:10', '2026-03-31 05:09:32', NULL, NULL, NULL, NULL, NULL, 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 1, 'https://media.cmtradingco.com/user_photos/c97e9b4c-1526-454f-ae40-787218e949e2_thumb', 'https://media.cmtradingco.com/user_photos/c97e9b4c-1526-454f-ae40-787218e949e2', NULL),
	('2ef0f07a-a275-4fe1-832d-fe9a5d145f60', 'ajaychhabra', 'Ajay Chhabra', 'ajay@rocklime.com', NULL, 'SUPER_ADMIN', 'active', '$2b$10$uXMciajyt/hN0sP3tHZgZefGP5AUEcwALAziH6wrV64ETcvL6YPkC', '2025-08-07 07:10:26', '2026-02-07 11:52:11', NULL, NULL, NULL, NULL, NULL, 'c2eaf23a-765c-4ee5-91bf-cbc37fbdea21', 1, NULL, NULL, NULL),
	('419d694e-1e85-418f-a40d-5969195360c0', 'sajjan.dagaura', 'Sajjan Dagaura', 'sdagaura@rocklime.com', '8278978827', 'SALES', 'active', '$2b$10$obUQqA7CW501oWe67rm5zed9EdbZ380snobMlKS8UGc.ghWDsqj0O', '2025-10-31 11:43:58', '2025-11-17 13:12:08', NULL, NULL, NULL, NULL, NULL, 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 1, 'https://media.cmtradingco.com/user_photos/38fb3dc7-f9e4-43fd-bff3-8d6a5b8559fd_thumb', 'https://media.cmtradingco.com/user_photos/38fb3dc7-f9e4-43fd-bff3-8d6a5b8559fd', NULL),
	('4b8b62f3-f6ce-4e46-87c8-c713a02ae71b', 'hemraj', 'Hemraj ', 'accounts@embarkent.in', NULL, 'ACCOUNTS', 'active', '$2b$10$sCaRfZrQIv/3JhtHVWWn5.ECN0qclarGkYa9Rclo/uBYzHYiQOZwO', '2025-11-29 10:28:50', '2025-11-29 10:32:54', NULL, NULL, NULL, NULL, NULL, 'cfbe02d3-c61d-4f09-9bc7-88fb2493f31d', 1, NULL, NULL, NULL),
	('56a3ba45-0557-47ac-bb5d-409f93d6661d', 'priyanka', 'PRIYANKA', 'admin@chhabramarble.com', NULL, 'ADMIN', 'active', '$2b$10$VfBH8z7vHlesBI1rwf6qQuNnjZ3tQRf78LkqPogfw2tq5pTZMhXEm', '2025-10-10 05:45:01', '2025-11-08 07:16:02', NULL, '09:30:00', '18:30:00', NULL, NULL, 'ffb71a9e-3f2e-4e26-97e4-8611591356b0', 1, NULL, NULL, NULL),
	('5ee872f3-a316-4de6-a55e-959a762f2327', 'd.verma', 'Dhruv Verma', 'dverma@rocklime.com', '8278978827', 'DEVELOPER', 'active', '$2b$10$rLCS.g1mh5hYAIgZJ21j9.OXhrZjdhoUhkeyJKKypgd3FPevN078C', '2025-10-13 10:44:07', '2026-04-27 06:55:43', '2002-11-09', '09:00:00', '17:30:00', 'B+', '', '5bb7eed4-1106-4b93-9218-ad733cfc7b12', 1, 'https://media.cmtradingco.com/user_photos/ed8dd13d-2050-482a-b2cb-0400eb84296d_thumb', 'https://media.cmtradingco.com/user_photos/ed8dd13d-2050-482a-b2cb-0400eb84296d', '9bb30911-a061-4079-bf84-4765df476b8d'),
	('70bc6d94-163a-4466-817b-273ee61765a3', 'Nitin@7', 'Nitin', 'nitindeol@rocklime.com', NULL, 'DEVELOPER', 'active', '$2b$10$PT9Dy106QT6T2bDPgR5QTOnRoTHJvLI7e9Rv5dFAqTmTS4fcidCGy', '2025-12-19 09:33:36', '2025-12-19 09:33:36', NULL, NULL, NULL, NULL, NULL, '5bb7eed4-1106-4b93-9218-ad733cfc7b12', 1, NULL, NULL, NULL),
	('ae80f818-b3e8-455f-b7db-61764d8d459e', 'lakshay', 'lakshay', 'accounts@chhabramarble.com', NULL, 'ACCOUNTS', 'active', '$2b$10$VEu7TfGAc/X2yF4QuAJ/BeZ4D0A1Q2v7CyL3V3TTMV6QKHBRbQI86', '2025-11-29 10:47:24', '2025-11-29 10:50:26', NULL, NULL, NULL, NULL, NULL, 'cfbe02d3-c61d-4f09-9bc7-88fb2493f31d', 1, NULL, NULL, NULL),
	('b6164c99-b566-11f0-a365-52540021303b', 'priya_galhotra', 'Priya Galhotra', 'pgalhotra@rocklime.com', NULL, 'ADMIN', 'active', '$2b$10$z8vCph4uWmNqgEJfH4Kx6eKImu8g/IMDhf8C6DPp1a3dAGV3JIbqK', '2025-10-30 13:31:59', '2025-11-11 05:14:53', NULL, NULL, NULL, NULL, NULL, 'ffb71a9e-3f2e-4e26-97e4-8611591356b0', 1, NULL, NULL, NULL),
	('ce2549ac-ec37-4201-946c-625725114c6a', 'aditya26', 'aditya', 'aditya@cmtrading.com', NULL, 'SALES', 'active', '$2b$10$LPogQ.t6HQuBOUA8v2VTuudjp5dZgkHnnekpG01HyLv4ulTJfhz.W', '2026-04-14 05:57:41', '2026-04-14 06:09:56', NULL, NULL, NULL, NULL, NULL, 'c3893e5f-4b6c-43c5-83ec-bc74beecfb30', 1, 'https://media.cmtradingco.com/user_photos/172d3527-54a0-4cc2-beac-d6ecea481e74_thumb', 'https://media.cmtradingco.com/user_photos/172d3527-54a0-4cc2-beac-d6ecea481e74', NULL),
	('d90fcfe6-05a7-471b-b122-36b04e53aac2', 'bhav.rocklime', 'Bhav', 'bhav.lamba@rocklime.com', '9250206208', 'SUPER_ADMIN', 'active', '$2b$10$TNTPy/V1doDth3RzJH2inOw/ISInFGnkQ69XzaXNHrlWQt8i1SoUi', '2025-10-13 10:23:46', '2026-03-31 07:36:32', '2000-01-07', NULL, NULL, 'B+', '9250206207', 'c2eaf23a-765c-4ee5-91bf-cbc37fbdea21', 1, 'https://media.cmtradingco.com/user_photos/772d56d2-25e4-4e49-beb6-f9274c649601_thumb', 'https://media.cmtradingco.com/user_photos/772d56d2-25e4-4e49-beb6-f9274c649601', '5d5fe8c4-92de-4eb6-9dca-cb27b62336d6');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

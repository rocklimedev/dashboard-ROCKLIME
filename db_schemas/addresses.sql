-- --------------------------------------------------------
-- Host:                         116.206.104.225
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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.addresses
CREATE TABLE IF NOT EXISTS `addresses` (
  `addressId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postalCode` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `status` enum('BILLING','PRIMARY','ADDITIONAL') NOT NULL DEFAULT 'ADDITIONAL',
  PRIMARY KEY (`addressId`),
  KEY `userId` (`userId`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `addresses_ibfk_457` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `addresses_ibfk_458` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.addresses: ~27 rows (approximately)
INSERT INTO `addresses` (`addressId`, `street`, `city`, `state`, `postalCode`, `country`, `createdAt`, `updatedAt`, `userId`, `customerId`, `status`) VALUES
	('2a83a530-70aa-41c3-bdc5-75d16b3c8abe', '39 Street', 'Delhi', 'Delhi', '110051', 'India', '2026-04-02 10:43:18', '2026-04-02 10:43:18', NULL, '3de072f9-6812-4a21-9262-d03cea45d56b', 'PRIMARY'),
	('3a0294c0-18f3-41b6-9aea-48fb806bf657', 'Site No.2, opposite Signature Tower\nSector 29, Gurugram', 'HARYANA', 'Haryana', '122001', 'India', '2026-06-29 10:24:16', '2026-06-29 10:24:16', NULL, '864da623-1635-4f02-8e0d-2a1dd7f82ec0', 'BILLING'),
	('3d306ab9-39f3-4d65-a5ed-9f1cd6e119e8', 'JAIN NAGAR ', 'DELHI', 'Delhi', '110086', 'India', '2026-05-26 05:08:36', '2026-05-26 05:08:36', NULL, '550fe628-3bbd-41ec-8fa8-db6e38d8591a', 'BILLING'),
	('402ad6d7-e12c-4e6a-a8fe-b3f09b131e27', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:27:14', '2026-04-24 06:27:14', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'ADDITIONAL'),
	('5d5fe8c4-92de-4eb6-9dca-cb27b62336d6', '39,shankar nagar street no 2', 'Delhi', 'Delhi', '110051', 'India', '2026-01-14 06:12:03', '2026-07-15 09:19:58', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', NULL, 'ADDITIONAL'),
	('5ed93437-d29e-451e-894a-47528e70568f', '.', '.', 'Delhi', '.', 'India', '2026-04-11 05:17:50', '2026-04-11 05:17:50', NULL, 'd70c96e9-76a6-475b-969d-b48ea496841c', 'BILLING'),
	('5f50bb1d-eadb-4e97-9032-7de3c4381f81', 'GK', 'Delhi', 'Delhi', NULL, 'India', '2026-07-29 12:59:15', '2026-07-29 12:59:15', NULL, 'b12da1a5-1627-43fe-b2af-ec5477a6fee8', 'BILLING'),
	('63a703f4-e377-436b-9dc6-d7e4f7df59d3', 'GK', 'Delhi', 'Delhi', NULL, 'India', '2026-07-29 12:14:15', '2026-07-29 12:14:15', NULL, '5deff912-bb81-40e5-ae59-a1a5737eec71', 'BILLING'),
	('651d8e45-9146-47de-ba2b-07d9a0b8153a', 'M-574 GURU HARKISHAN NAGAR', 'DELHI', 'Delhi', '110087', 'India', '2026-06-01 10:05:01', '2026-06-01 10:05:01', NULL, 'cf7a89a9-9dc8-404c-b1c7-debb2f559ccd', 'BILLING'),
	('81f0bb60-b687-4604-bd51-5bacbad61afa', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:11:36', '2026-04-24 06:11:36', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'ADDITIONAL'),
	('8669ddd9-dcc1-4330-a2e3-17a8bf8563f3', 'SANOLI ROAD, NEAR GOYAL MARBLE, UGRAKHEDI, PANIPAT', 'HARYANA', 'Haryana', '132103', 'India', '2026-05-22 09:41:08', '2026-05-22 09:41:08', NULL, 'cae67a86-f23f-4359-a987-c9a4de7d8b72', 'BILLING'),
	('8a365c51-34e6-47fc-8186-c90066c891b6', '39 Street', 'Delhi', 'Delhi', '110051', 'India', '2026-01-03 10:11:04', '2026-01-03 10:11:04', NULL, '3de072f9-6812-4a21-9262-d03cea45d56b', 'BILLING'),
	('8a55caf8-b5c6-4c2d-b4f5-fec0ffdd7b9a', '196 bhera enclave', 'NEW DELHI', 'Delhi', '110087', 'India', '2026-07-04 07:38:56', '2026-07-04 07:38:56', NULL, '1ab5db6e-6246-4c70-ab7f-7823a3693efd', 'BILLING'),
	('9bb30911-a061-4079-bf84-4765df476b8d', '636/6 Partap Chowk Rohtak', 'Rohtak', 'Haryana', '124001', 'India', '2026-01-22 09:37:48', '2026-04-27 06:55:43', '5ee872f3-a316-4de6-a55e-959a762f2327', NULL, 'ADDITIONAL'),
	('9d0bc965-4515-424f-a457-b4e4c7b5f5fa', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:11:38', '2026-04-24 06:11:38', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'ADDITIONAL'),
	('b4084c12-e5e5-42a4-99f6-7f5b1a5222fa', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:11:33', '2026-04-24 06:11:33', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'ADDITIONAL'),
	('c1418b45-e9d2-4540-9473-e879f24781f3', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:10:13', '2026-04-24 06:10:13', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'BILLING'),
	('c7be37ac-bf3e-464e-b371-3223fcb8be0a', 'HNO 1, Vikram vihar extn\nLajpat Nagar IV, Near Amar Colony Gurudwara', 'NEW DELHI', 'Delhi', '110024', 'India', '2026-06-08 10:32:31', '2026-06-08 10:32:31', NULL, '0293eafe-6457-43e9-8035-2961cd396f9b', 'BILLING'),
	('c9017882-d538-480d-9257-6676f105f76e', 'M-574 GURUHARKISHAN NAGAR', 'Delhi', 'Delhi', '110087', 'India', '2026-04-24 06:30:37', '2026-06-01 11:05:10', NULL, 'cf7a89a9-9dc8-404c-b1c7-debb2f559ccd', 'ADDITIONAL'),
	('cce45771-4480-469d-8e5c-5a6f7be7b503', 'A-/101 FIRST FLOOR JANAKPURI', 'NEW DELHI', 'Delhi', '110058', 'India', '2026-06-08 12:03:52', '2026-06-08 12:03:52', NULL, 'f3830a6f-641d-419a-8560-8cdb6a9267b9', 'BILLING'),
	('cfcda74d-eeb4-4d43-a33f-7836068e20d3', '.', 'NEW DELHI', 'Delhi', NULL, 'India', '2026-06-21 10:52:23', '2026-06-21 10:52:23', NULL, '514db2ae-f9e4-42b7-bd7a-e6cb78d4b82e', 'BILLING'),
	('d663e59e-fea7-45f4-9ca5-f3ccbce1d874', '.', 'NEW DELHI', 'Delhi', '110087', 'India', '2026-06-14 06:19:57', '2026-06-14 06:19:57', NULL, '4cdb89e3-998e-4eac-95a0-6576e90819e3', 'BILLING'),
	('e4d08b05-12a2-4009-97c6-53e8e628e031', '.', 'NEW DELHI', 'Delhi', NULL, 'India', '2026-07-02 09:04:30', '2026-07-02 09:04:30', NULL, '60f3c328-8d33-4e2a-b7ad-08b7474c89fa', 'BILLING'),
	('ef18fb0f-5d71-47cc-b3c2-f5db4ef6ac70', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:11:19', '2026-04-24 06:11:19', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'PRIMARY'),
	('f5677633-24b3-4b4c-a759-1d2780419186', 'bjbmbm', 'bnm', 'Meghalaya', NULL, 'India', '2026-04-24 06:32:17', '2026-04-24 06:32:17', NULL, '4a7f6ef8-81ba-40de-a887-c620aeecd532', 'BILLING'),
	('f76c4207-ef9f-4720-8126-28937c09ebcf', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:11:34', '2026-04-24 06:11:34', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'ADDITIONAL'),
	('f8e91216-93f4-4151-854c-8f48caad05ce', 'Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur', 'Delhi', 'Delhi', '110007', 'India', '2026-04-24 06:27:19', '2026-04-24 06:27:19', NULL, 'cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'ADDITIONAL');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

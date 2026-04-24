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

-- Dumping data for table spsyn8lm_rocklime_dashboard.addresses: ~89 rows (approximately)
INSERT INTO `addresses` (`addressId`, `street`, `city`, `state`, `postalCode`, `country`, `createdAt`, `updatedAt`, `userId`, `customerId`, `status`) VALUES
	('001a8115-a1cf-4448-9c7d-51b414ed1b52', 'house 31', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-17 05:22:47', '2026-01-17 05:22:47', NULL, 'aef1d143-f5f3-4385-ae67-02509fe38a1b', 'BILLING'),
	('02afd8c5-9c3f-4b5b-8434-fd1a8bb452df', '636/6 Partap Mohalla, Quilla Road\nNear Durga Bhawan Mandir', 'ROHTAK', 'Haryana', '124001', 'India', '2026-01-14 06:51:15', '2026-01-14 06:51:15', NULL, '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'BILLING'),
	('06f6176d-fc66-4020-8ab2-d63a8f2ca8cc', '77 bheera enclave pashchim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-27 10:30:56', '2026-03-27 10:30:56', NULL, '3f3f0573-f1e3-42a1-b60d-411867927cf5', 'BILLING'),
	('0825e92d-1bcc-413e-b9b4-8e731d5a9cb4', 'house 3', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 10:12:00', '2026-01-14 10:12:00', NULL, '50c48280-b8a0-43b1-ac38-438d55b7a01e', 'BILLING'),
	('0cf8eb81-2c56-429b-82db-416098b9250d', '4RETDGF', 'PASCHIM VIHAR', 'Delhi', '110087', 'India', '2026-03-26 05:45:57', '2026-03-26 05:45:57', NULL, '18070658-6b48-4586-9898-5d746d536371', 'BILLING'),
	('0d7cce7e-5f66-4137-9f7c-d0781a65b551', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'Bihar', 'Chhattisgarh', '110087', 'India', '2026-02-10 07:34:14', '2026-02-10 07:34:14', NULL, '50cf8dc3-2fbf-4581-b033-44729802dcca', 'BILLING'),
	('10767e6e-734d-4861-b5d4-1f2cd044d705', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-17 09:21:42', '2026-01-17 09:21:42', NULL, 'fead585e-c32c-40eb-b82f-395f3f744f4d', 'BILLING'),
	('1148c421-9115-4c93-83cc-1e9f785fd908', 'house 256', 'New Delhi', 'Andhra Pradesh', '110087', 'India', '2026-01-20 11:39:56', '2026-01-20 11:39:56', NULL, '276f5364-6790-4068-afdd-79ad351f80fe', 'BILLING'),
	('15740b27-556b-493e-9c8e-f144ec8ce126', 'something', 'something', 'Chhattisgarh', '110087', 'India', '2026-03-26 08:17:35', '2026-03-26 08:17:35', NULL, '6d0f1e08-0d61-44ed-88a3-3b13ac3d1af4', 'PRIMARY'),
	('17ee2c24-1523-4d6a-a785-c6346eb8cbd5', 'House No 1', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 07:27:17', '2026-01-14 07:27:17', NULL, '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'PRIMARY'),
	('1825be7b-15b1-466e-b2a5-1862b4185180', 'NIL', 'Delhi', 'Delhi', NULL, 'India', '2026-03-30 10:17:39', '2026-03-30 10:17:39', NULL, '2f0c1526-9e5d-4399-81b2-ba2004a3eef0', 'BILLING'),
	('1d492b2f-88ee-4720-b31f-498259c9272b', '46, RJ', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-09 07:05:17', '2026-02-09 07:05:17', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'PRIMARY'),
	('249810df-4318-4de1-8f84-034fa1bb6e59', 'ASLKL', 'SA', 'Andaman and Nicobar Islands', '277001', 'India', '2026-03-05 11:49:24', '2026-03-05 11:49:24', NULL, 'b9177757-0426-4a1b-abe9-e1c9d6be57ae', 'BILLING'),
	('26b75d0b-cba7-499e-8195-42bd362ea9a4', 'House 4', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 11:49:39', '2026-01-14 11:49:39', NULL, '2cd776e8-3226-43d4-bc86-f060486d1f65', 'BILLING'),
	('298d4a5b-8e91-4c6b-bb83-b5928e16f2f0', '98', 'VIJAY VIHAR', 'Delhi', '110086', 'India', '2026-02-23 04:52:19', '2026-02-23 04:52:19', NULL, 'bcf91e51-0012-4e25-8bd9-f16b43e39424', 'BILLING'),
	('299bde8c-f477-4395-a790-c35c54922002', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:49:43', '2026-03-30 06:49:43', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'ADDITIONAL'),
	('2a83a530-70aa-41c3-bdc5-75d16b3c8abe', '39 Street', 'Delhi', 'Delhi', '110051', 'India', '2026-04-02 10:43:18', '2026-04-02 10:43:18', NULL, '3de072f9-6812-4a21-9262-d03cea45d56b', 'PRIMARY'),
	('2be22b50-a9f9-4b35-921a-2017e477e146', '77 bheera enclave', 'Delhi', 'Delhi', '110087', 'India', '2026-01-19 07:03:49', '2026-01-19 07:03:49', NULL, '8fc34e27-b0ff-4c70-b373-564d5b471025', 'BILLING'),
	('2f7b5aa7-2062-48ac-a61d-4fdff886fbc4', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 12:57:19', '2026-01-20 12:57:19', NULL, '4cb519ac-a606-4fc9-bb02-2b80d932baaf', 'BILLING'),
	('30adb2fc-d42e-485e-84e4-3833f318f17b', '46, RJ', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-09 07:05:17', '2026-02-09 07:05:17', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'PRIMARY'),
	('3263cbaf-ac53-4c15-a959-88efb775c50a', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 12:21:00', '2026-01-20 12:21:00', NULL, '524f787a-bb00-4930-b191-ce10b4024e21', 'BILLING'),
	('333e18b4-cb9e-4e1c-9556-743be26c5d92', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'Bihar', 'Chhattisgarh', '110087', 'India', '2026-02-10 07:34:31', '2026-02-10 07:34:31', NULL, '50cf8dc3-2fbf-4581-b033-44729802dcca', 'PRIMARY'),
	('34dfd12c-d89d-4dc9-9c10-ca2d4200ae40', 'peera garhi', 'DELHI', 'Dadra and Nagar Haveli and Daman and Diu', '110087', 'India', '2026-01-20 08:06:32', '2026-01-20 08:06:32', NULL, 'bda3861a-c793-4fdc-a14a-89c7809d7870', 'BILLING'),
	('381645c8-89db-4195-97fd-0a86908656d1', 'house 12', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-16 06:20:23', '2026-01-16 06:20:23', NULL, 'd9388c2a-98e5-4e84-bb8e-c6d132cd2d8d', 'BILLING'),
	('386819aa-3cfc-4db9-8748-027564e93c91', 'B3/33 MIANWALI NAGAR', 'NEW DELHI', 'Delhi', '110087', 'India', '2025-12-20 07:30:45', '2025-12-20 07:30:45', NULL, 'f617bbf7-07ec-4370-aff5-22eb07e8f8ef', 'BILLING'),
	('396c1e57-0c21-46be-b53f-b3643ca61a4b', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 11:23:22', '2026-01-20 11:23:22', NULL, '59fae0d1-78b7-42dd-a046-4c2fa344d454', 'BILLING'),
	('3b2f521a-1311-45c9-94b0-b113abd63dfa', '9A/3 vallabh vihar,delhi', 'Delhi', 'Delhi', '110094', 'India', '2026-01-15 11:00:00', '2026-01-15 11:00:00', NULL, 'f05843b8-cbaf-4128-8dd5-e5ed59835d40', 'PRIMARY'),
	('43c2f610-6391-4d35-a918-8fd7c3d42608', '77 bheera enclave pashchim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-27 10:30:57', '2026-03-27 10:30:57', NULL, '3f3f0573-f1e3-42a1-b60d-411867927cf5', 'PRIMARY'),
	('44955534-0fae-4912-be0e-3b96367dad6b', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:49:04', '2026-03-30 06:49:04', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'PRIMARY'),
	('49410898-a2ea-4777-b2f4-31010a6a135f', '636/6 Partap Chowk Rohtak', 'Rohtak', 'Haryana', '124001', 'India', '2026-03-26 05:28:58', '2026-03-26 05:28:58', NULL, 'be00f681-6239-489c-b04c-d4a55ed54f17', 'PRIMARY'),
	('4d711bdc-1b97-4039-9cea-9ee6faf793cd', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-23 05:10:16', '2026-02-23 05:10:16', NULL, '83834f90-b2b8-4626-b10e-b9874411c717', 'BILLING'),
	('4fc4fbed-b1b1-4b89-b5c5-08195d410704', 'AEROCITY', 'NEW DELHI', 'Delhi', '110015', 'India', '2025-12-12 11:05:44', '2025-12-12 11:05:44', NULL, NULL, 'BILLING'),
	('50dc64b7-e469-4e19-8437-74e14e8ecb09', 'something', 'something', 'Chhattisgarh', '110087', 'India', '2026-03-26 08:17:34', '2026-03-26 08:17:34', NULL, '6d0f1e08-0d61-44ed-88a3-3b13ac3d1af4', 'BILLING'),
	('513824e8-fecc-4ca4-8b97-8ace851af9a8', '', '', '', '', '', '2025-12-24 10:48:01', '2025-12-24 10:48:01', NULL, NULL, 'ADDITIONAL'),
	('5d35becd-2aef-4963-83dc-f60166414704', 'House 6', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 13:14:24', '2026-01-14 13:14:24', NULL, 'a25accb6-f0a8-40b7-9be0-0f2a7b17995b', 'BILLING'),
	('5d5fe8c4-92de-4eb6-9dca-cb27b62336d6', '39,shankar nagar street no 2', 'Delhi', 'Delhi', '110051', 'India', '2026-01-14 06:12:03', '2026-01-14 06:12:03', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', NULL, 'ADDITIONAL'),
	('5ed93437-d29e-451e-894a-47528e70568f', '.', '.', 'Delhi', '.', 'India', '2026-04-11 05:17:50', '2026-04-11 05:17:50', NULL, 'd70c96e9-76a6-475b-969d-b48ea496841c', 'BILLING'),
	('66a891f7-3440-4449-b12c-79583073cc95', '3594 D-3', 'delhi', 'Delhi', '110070', 'India', '2026-02-27 12:01:26', '2026-02-27 12:01:26', NULL, '7c084080-2931-4451-8045-a8e620a9d089', 'BILLING'),
	('6af56153-f073-4436-ba6e-bd2ea3c6b534', '89B ,111 welfare society, pashchim vihar', 'delhi', 'Delhi', '110090', 'India', '2026-01-15 10:59:10', '2026-01-15 10:59:10', NULL, 'f05843b8-cbaf-4128-8dd5-e5ed59835d40', 'BILLING'),
	('6c99f419-587b-4d8b-a378-f85e68a9bf1c', 'bhera enclave', 'delhi', 'Delhi', NULL, 'India', '2026-03-28 07:46:02', '2026-03-28 07:46:02', NULL, '13dfe2a2-fa7b-46cc-81a8-e41116d372e4', 'BILLING'),
	('6d068264-6159-4a6a-847b-65eb0f186667', '98', 'VIJAY VIHAR', 'Delhi', '110086', 'India', '2026-02-23 04:52:19', '2026-02-23 04:52:19', NULL, 'bcf91e51-0012-4e25-8bd9-f16b43e39424', 'BILLING'),
	('7595ce18-d64d-4ad1-ba95-b79d5e540439', 'House 11', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-16 05:47:02', '2026-01-16 05:47:02', NULL, 'be00f681-6239-489c-b04c-d4a55ed54f17', 'BILLING'),
	('769f70a3-4e75-4329-b130-70ae8009c387', 'peera garhi', 'DELHI', 'Bihar', '110087', 'India', '2026-01-20 09:50:52', '2026-01-20 09:50:52', NULL, 'b9c0f047-4549-4542-bff5-902c61784d88', 'BILLING'),
	('77010fb2-dee9-4051-91a4-1e4fbab29e2a', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'Bihar', 'Delhi', '110087', 'India', '2026-01-14 06:26:50', '2026-01-14 06:26:50', NULL, 'f617bbf7-07ec-4370-aff5-22eb07e8f8ef', 'PRIMARY'),
	('78a51d61-b935-45ff-875f-681ba838c80b', 'house 4', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 11:25:32', '2026-01-14 11:25:32', NULL, 'a96dcb75-9951-4b7d-81ef-72c3f4889e97', 'BILLING'),
	('7dd72555-9770-49a2-89af-c27fe6d88613', '1,107/1, Gopal Mahal Bld, 1st Flr, Gundopanth Street', 'Banglore', 'Karnataka', '560053', 'India', '2026-01-17 05:17:08', '2026-01-17 05:17:08', NULL, '707431af-afa4-4b9d-b6e7-6e01ca10aeda', 'PRIMARY'),
	('8a365c51-34e6-47fc-8186-c90066c891b6', '39 Street', 'Delhi', 'Delhi', '110051', 'India', '2026-01-03 10:11:04', '2026-01-03 10:11:04', NULL, '3de072f9-6812-4a21-9262-d03cea45d56b', 'BILLING'),
	('94e26733-96e0-4a64-9398-be254e5effaf', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 10:34:45', '2026-01-20 10:34:45', NULL, 'fcb8e8db-6523-4fa9-bd08-a054834b2cb7', 'BILLING'),
	('96a76ab1-9a96-4292-811d-2e50069e4414', 'RANDOM', 'SOHNA', 'Haryana', NULL, 'India', '2026-01-28 08:26:37', '2026-01-28 08:26:37', NULL, '50fa88e7-312c-430c-bfeb-9385dafbb64f', 'BILLING'),
	('987a0593-516f-400d-93d5-61459dc15559', '77 bheera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-03-29 06:33:02', '2026-03-29 06:33:02', NULL, 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'ADDITIONAL'),
	('9bb30911-a061-4079-bf84-4765df476b8d', '636/6 Partap Chowk Rohtak', 'Rohtak', 'Haryana', '124001', 'India', '2026-01-22 09:37:48', '2026-03-14 08:05:11', '5ee872f3-a316-4de6-a55e-959a762f2327', NULL, 'ADDITIONAL'),
	('9e631324-4a81-4c04-b146-eb2f3fa61ab3', 'house 31', 'NEW DELHI', 'Delhi', '110087', 'India', '2026-01-19 09:25:57', '2026-01-19 09:25:57', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'BILLING'),
	('9fb1483a-c17e-4832-9ee4-888b01486980', 'B99', 'delhi', 'Delhi', '110087', 'India', '2026-03-07 06:19:04', '2026-03-07 06:19:04', NULL, '911941df-444e-43dd-aac7-eb515ec6872a', 'BILLING'),
	('a02c6473-5afb-4055-a762-a8c31c1881b3', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-11 04:45:26', '2026-02-11 04:45:26', NULL, '5cbd1d68-46ba-4fc5-a886-6d2ee1dd014b', 'BILLING'),
	('a0f423f8-7873-430c-a01a-bcbdceac47a5', 'B/33 mianwali, paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2025-12-20 04:51:34', '2025-12-20 04:51:34', NULL, '788a209c-5176-4d21-acdb-51ac932449ae', 'BILLING'),
	('a1ceb041-8c11-4148-8149-e07ea3c458e4', 'KK', 'DELHI', 'Delhi', '110018', 'India', '2026-02-06 12:37:26', '2026-02-06 12:37:26', NULL, '52b66c48-29ec-4bae-8f99-f73b4a884e5b', 'BILLING'),
	('a2491080-4aab-4890-8b80-572329480689', '', '', '', '', 'India', '2026-02-27 11:47:32', '2026-02-27 11:47:44', NULL, NULL, 'ADDITIONAL'),
	('aaac2ed5-c2db-4033-88ce-8413f5fd9f6b', '-', 'delhi', 'Delhi', '110018', 'India', '2026-02-13 10:56:46', '2026-02-13 10:56:46', NULL, 'f5cd9f78-3556-4029-b856-140b16f39c7c', 'BILLING'),
	('ac8e6667-92ca-4b5e-8791-e493729997bb', '77 bheera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-01-14 06:06:00', '2026-01-14 06:06:00', NULL, 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'BILLING'),
	('add2a41b-829d-46c4-b017-1c2d6e217f84', 'BG-1/201 PASCHIM VIHAR', 'NEW DELHI', 'Delhi', '110063', 'India', '2026-02-10 07:06:05', '2026-02-10 07:06:05', NULL, '46c03acc-c337-485b-8664-811648442403', 'BILLING'),
	('ae884175-a2e2-4025-8459-2f0ca46a2fe5', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:49:24', '2026-03-30 06:49:24', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'ADDITIONAL'),
	('b14d2c56-d0fe-4bc7-8a28-cd6a1a330a14', '78 pashchim Vihar', 'Delhi', 'Delhi', '110089', 'India', '2026-03-14 05:42:37', '2026-03-14 05:42:37', NULL, 'af8d8424-075e-4d52-b145-9a1b9beb573f', 'BILLING'),
	('b32495bd-132d-45a5-9c2d-a0939c815329', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-28 08:07:13', '2026-01-28 08:07:13', NULL, '791f387f-0439-4318-ae1c-7be0df341113', 'BILLING'),
	('b41f7b14-84f7-49d3-bc24-6d64bc342c1d', 'bhera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-01-31 10:11:28', '2026-01-31 10:11:28', NULL, 'a44fc4df-4272-4046-a36a-a78c4dd12dba', 'BILLING'),
	('b7305202-102b-497a-b7b2-c9afc5fe8e8f', 'House No 2', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 08:10:40', '2026-01-14 08:10:40', NULL, 'de0dd927-7b51-4046-ba6b-bdb8575470c3', 'BILLING'),
	('b7c4ec3a-18db-447a-93d1-410d2fa540ce', 'EW-4 MIYANWALI', 'NEW DELHI', 'Delhi', '110087', 'India', '2026-03-15 06:25:09', '2026-03-15 06:25:09', NULL, 'c28f8bda-efa1-443e-bb2d-3abb4ee44015', 'BILLING'),
	('b98d0d2b-4372-47f5-b945-3cdc08091b64', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-02-10 07:38:05', '2026-02-10 07:38:05', NULL, '50c48280-b8a0-43b1-ac38-438d55b7a01e', 'PRIMARY'),
	('b9bc8cc9-6c11-40ff-a736-4655c87dc9b4', 'C 5/8 Mianwali Nagar', 'New Delhi', 'Delhi', '110087', 'India', '2026-03-30 07:28:01', '2026-03-30 07:28:01', NULL, '83e168cd-fb86-435b-81c3-511d46dd2ec8', 'BILLING'),
	('bb024292-278e-48c9-a313-8998c218c036', '39 shankar nagar street no 2', 'Delhi', 'Delhi', '110051', 'India', '2026-02-26 10:11:16', '2026-02-26 10:11:16', NULL, 'a7e926e2-29b0-4c49-a4ca-71bed9e038d1', 'BILLING'),
	('bf00c012-5c45-4907-9bad-7d9fe5279187', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Bihar', '110087', 'India', '2025-12-05 07:52:13', '2025-12-05 07:52:13', NULL, NULL, 'BILLING'),
	('c9da25d8-4883-4414-8f3e-7c48a3dac9e2', '14, Sant Nagar, East of Kailash', 'New Delhi', 'Delhi', '110065', 'India', '2025-12-12 10:51:14', '2025-12-12 10:51:14', NULL, 'ce1945aa-9e2e-4012-8dee-e2df7f6db290', 'BILLING'),
	('cb5f1ecc-c103-4d4b-b2dd-a70612301c1d', '636/6 Partap Mohalla, Quilla Road', 'ROHTAK', 'Uttar Pradesh', '124001', 'India', '2026-02-10 07:30:07', '2026-02-10 07:30:07', NULL, '190f6f83-1e3a-4e6d-ad6c-ef04dbe82475', 'BILLING'),
	('cc814912-dac7-4395-b207-f0cdf7a304d1', 'peera garhi', 'asd', 'Nagaland', '111008', 'India', '2026-01-20 11:58:19', '2026-01-20 11:58:19', NULL, 'a974d385-5619-4c14-8faa-b6a768ce5221', 'BILLING'),
	('cc86f8df-aac2-4284-bc2f-6b96cc62bab9', '77 bheera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-03-29 06:25:00', '2026-03-29 06:25:00', NULL, 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'PRIMARY'),
	('ce0da19a-3844-4ea8-99e6-9cf5d74f8905', 'bhbh', 'delhi', 'Delhi', NULL, 'India', '2026-03-30 07:39:43', '2026-03-30 07:39:43', NULL, 'd1a55e0e-7e2e-4d96-b354-69612deae71a', 'BILLING'),
	('ceab65c6-eed5-48a9-a6f6-bd37d7af19a7', '77 bheera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-03-29 06:25:04', '2026-03-29 06:25:04', NULL, 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'ADDITIONAL'),
	('d05cc540-c019-4dad-b759-10fc82a5afb5', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:49:49', '2026-03-30 06:49:49', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'ADDITIONAL'),
	('d214d8c8-b5fa-4025-b812-030f89ac43d7', 'peera garhi', 'DELHI', 'Punjab', '110087', 'India', '2026-01-20 10:07:45', '2026-01-20 10:07:45', NULL, 'df39321e-5512-452a-85d6-fd54cc362ba7', 'BILLING'),
	('d2d637ea-0aa3-4fff-8784-a792d166acdd', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-17 08:30:57', '2026-01-17 08:30:57', NULL, '89bc2daa-784a-4aa1-8a19-2c64e8c90be8', 'BILLING'),
	('d473f82f-183a-4dfb-8e8c-d055aa158482', 'NO IDEA', 'DELHI', 'Delhi', NULL, 'India', '2026-02-17 06:05:03', '2026-02-17 06:05:03', NULL, '5cdda2bd-982f-4b68-8a7b-5011ad8beb87', 'BILLING'),
	('d4d33a3c-2b96-42f8-a1ff-02beb625c6d7', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 07:25:39', '2026-01-20 07:25:39', NULL, 'c21138da-fc5c-474f-92b0-15e500d65011', 'BILLING'),
	('d685c4f4-032a-472f-9e78-0093e412bad8', '88,Bheera enclave ,110072', 'Delhi', 'Delhi', '110072', 'India', '2026-03-21 06:10:10', '2026-03-21 06:10:10', NULL, '85f05673-9590-46b5-b722-151244fa23eb', 'BILLING'),
	('dce8deb0-1ac4-454a-b0cf-8902de028373', '1/3, 2nd Floor, Mulji Laxmidas Bldg, 26 Mint Road', 'Mumbai', 'Maharashtra', '400001', 'India', '2026-01-17 05:16:32', '2026-01-17 05:16:32', NULL, '707431af-afa4-4b9d-b6e7-6e01ca10aeda', 'BILLING'),
	('e11a07e5-c9f4-4432-bb75-e9164dd60c83', '2B Street', 'NEW DELHI', 'Delhi', NULL, 'India', '2026-01-28 09:35:29', '2026-01-28 09:35:29', NULL, 'f7297bc5-39ca-4c83-bbcc-73c4a1229fb5', 'BILLING'),
	('e5fe447a-f060-4fcb-aa82-f437a8208a40', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:50:40', '2026-03-30 06:50:40', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'ADDITIONAL'),
	('e88b6901-1764-4c6e-9d1f-b96158f92f35', '77 BASEMNET BHERA ENCLAVE PASCIM VIHAR\nBHERA ENCLAVE', 'PASCHIM VIHAR', 'Delhi', '110087', 'India', '2026-03-17 11:29:32', '2026-03-17 11:29:32', NULL, '4bb60967-6063-4c7d-8601-d13b4a66e350', 'BILLING'),
	('eb1298b0-c524-4016-823f-f341fe8917f4', '77 bheera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-03-29 06:25:59', '2026-03-29 06:25:59', NULL, 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'ADDITIONAL'),
	('eb3e3cec-506a-4e84-81a4-297d846a0ae4', '46, RJ', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-09 07:05:17', '2026-02-09 07:05:17', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'PRIMARY'),
	('ec918a36-8c66-452c-8818-b94e6c3000fd', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:48:49', '2026-03-30 06:48:49', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'BILLING'),
	('ee3b1b73-4b60-4472-9aa4-766acfd93a30', '7/B mianwali nagar', 'Delhi', 'Delhi', '110087', 'India', '2026-01-19 05:34:30', '2026-01-19 05:34:30', NULL, 'c009febe-4def-4eee-b698-c8d2361542fd', 'BILLING'),
	('f12bface-f53c-48f3-ac5c-ab2c1ee38b5f', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:49:16', '2026-03-30 06:49:16', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'ADDITIONAL'),
	('f149034c-de6a-45f7-9677-ecff1e41bb39', 'B3/33 mianwali,paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2026-03-30 06:49:43', '2026-03-30 06:49:43', NULL, 'ae9a17e3-16ef-47fb-af5d-1e4335271365', 'ADDITIONAL'),
	('f314f5a8-4757-430d-9f06-41e1c8d98360', '77 bheera anclave', 'Delhi', 'Delhi', '110087', 'India', '2026-01-15 09:57:06', '2026-01-15 09:57:06', NULL, '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'ADDITIONAL'),
	('f7ff02b2-36bc-48f8-81ac-d4674606dd5e', 'Bhera Enclave', 'DELHI', 'Delhi', '110087', 'India', '2026-02-01 04:50:42', '2026-02-01 04:50:42', NULL, '366f0ecf-ae89-4675-98fe-b28f22399fa0', 'BILLING'),
	('fc339daa-eb96-4bc0-b370-6a5fc4d3ea2c', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 10:48:51', '2026-01-20 10:48:51', NULL, '690cf5b0-5ab7-40e5-8e24-8e175d0d538f', 'BILLING');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

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

-- Dumping data for table spsyn8lm_rocklime_dashboard.addresses: ~46 rows (approximately)
INSERT INTO `addresses` (`addressId`, `street`, `city`, `state`, `postalCode`, `country`, `createdAt`, `updatedAt`, `userId`, `customerId`, `status`) VALUES
	('001a8115-a1cf-4448-9c7d-51b414ed1b52', 'house 31', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-17 05:22:47', '2026-01-17 05:22:47', NULL, 'aef1d143-f5f3-4385-ae67-02509fe38a1b', 'BILLING'),
	('02afd8c5-9c3f-4b5b-8434-fd1a8bb452df', '636/6 Partap Mohalla, Quilla Road\nNear Durga Bhawan Mandir', 'ROHTAK', 'Haryana', '124001', 'India', '2026-01-14 06:51:15', '2026-01-14 06:51:15', NULL, '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'BILLING'),
	('0825e92d-1bcc-413e-b9b4-8e731d5a9cb4', 'house 3', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 10:12:00', '2026-01-14 10:12:00', NULL, '50c48280-b8a0-43b1-ac38-438d55b7a01e', 'BILLING'),
	('0d7cce7e-5f66-4137-9f7c-d0781a65b551', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'Bihar', 'Chhattisgarh', '110087', 'India', '2026-02-10 07:34:14', '2026-02-10 07:34:14', NULL, '50cf8dc3-2fbf-4581-b033-44729802dcca', 'BILLING'),
	('10767e6e-734d-4861-b5d4-1f2cd044d705', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-17 09:21:42', '2026-01-17 09:21:42', NULL, 'fead585e-c32c-40eb-b82f-395f3f744f4d', 'BILLING'),
	('1148c421-9115-4c93-83cc-1e9f785fd908', 'house 256', 'New Delhi', 'Andhra Pradesh', '110087', 'India', '2026-01-20 11:39:56', '2026-01-20 11:39:56', NULL, '276f5364-6790-4068-afdd-79ad351f80fe', 'BILLING'),
	('17ee2c24-1523-4d6a-a785-c6346eb8cbd5', 'House No 1', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 07:27:17', '2026-01-14 07:27:17', NULL, '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'PRIMARY'),
	('1d492b2f-88ee-4720-b31f-498259c9272b', '46, RJ', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-09 07:05:17', '2026-02-09 07:05:17', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'PRIMARY'),
	('26b75d0b-cba7-499e-8195-42bd362ea9a4', 'House 4', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 11:49:39', '2026-01-14 11:49:39', NULL, '2cd776e8-3226-43d4-bc86-f060486d1f65', 'BILLING'),
	('298d4a5b-8e91-4c6b-bb83-b5928e16f2f0', '98', 'VIJAY VIHAR', 'Delhi', '110086', 'India', '2026-02-23 04:52:19', '2026-02-23 04:52:19', NULL, 'bcf91e51-0012-4e25-8bd9-f16b43e39424', 'BILLING'),
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
	('4d711bdc-1b97-4039-9cea-9ee6faf793cd', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-23 05:10:16', '2026-02-23 05:10:16', NULL, '83834f90-b2b8-4626-b10e-b9874411c717', 'BILLING'),
	('4fc4fbed-b1b1-4b89-b5c5-08195d410704', 'AEROCITY', 'NEW DELHI', 'Delhi', '110015', 'India', '2025-12-12 11:05:44', '2025-12-12 11:05:44', NULL, NULL, 'BILLING'),
	('513824e8-fecc-4ca4-8b97-8ace851af9a8', '', '', '', '', '', '2025-12-24 10:48:01', '2025-12-24 10:48:01', 'bdcbd52d-96a2-4643-b1e9-66dc1b10dba9', NULL, 'ADDITIONAL'),
	('5d35becd-2aef-4963-83dc-f60166414704', 'House 6', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 13:14:24', '2026-01-14 13:14:24', NULL, 'a25accb6-f0a8-40b7-9be0-0f2a7b17995b', 'BILLING'),
	('5d5fe8c4-92de-4eb6-9dca-cb27b62336d6', '39,shankar nagar street no 2', 'Delhi', 'Delhi', '110051', 'India', '2026-01-14 06:12:03', '2026-01-14 06:12:03', 'd90fcfe6-05a7-471b-b122-36b04e53aac2', NULL, 'ADDITIONAL'),
	('66a891f7-3440-4449-b12c-79583073cc95', '3594 D-3', 'delhi', 'Delhi', '110070', 'India', '2026-02-27 12:01:26', '2026-02-27 12:01:26', NULL, '7c084080-2931-4451-8045-a8e620a9d089', 'BILLING'),
	('6af56153-f073-4436-ba6e-bd2ea3c6b534', '89B ,111 welfare society, pashchim vihar', 'delhi', 'Delhi', '110090', 'India', '2026-01-15 10:59:10', '2026-01-15 10:59:10', NULL, 'f05843b8-cbaf-4128-8dd5-e5ed59835d40', 'BILLING'),
	('6d068264-6159-4a6a-847b-65eb0f186667', '98', 'VIJAY VIHAR', 'Delhi', '110086', 'India', '2026-02-23 04:52:19', '2026-02-23 04:52:19', NULL, 'bcf91e51-0012-4e25-8bd9-f16b43e39424', 'BILLING'),
	('7595ce18-d64d-4ad1-ba95-b79d5e540439', 'House 11', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-16 05:47:02', '2026-01-16 05:47:02', NULL, 'be00f681-6239-489c-b04c-d4a55ed54f17', 'BILLING'),
	('769f70a3-4e75-4329-b130-70ae8009c387', 'peera garhi', 'DELHI', 'Bihar', '110087', 'India', '2026-01-20 09:50:52', '2026-01-20 09:50:52', NULL, 'b9c0f047-4549-4542-bff5-902c61784d88', 'BILLING'),
	('77010fb2-dee9-4051-91a4-1e4fbab29e2a', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'Bihar', 'Delhi', '110087', 'India', '2026-01-14 06:26:50', '2026-01-14 06:26:50', NULL, 'f617bbf7-07ec-4370-aff5-22eb07e8f8ef', 'PRIMARY'),
	('78a51d61-b935-45ff-875f-681ba838c80b', 'house 4', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 11:25:32', '2026-01-14 11:25:32', NULL, 'a96dcb75-9951-4b7d-81ef-72c3f4889e97', 'BILLING'),
	('7dd72555-9770-49a2-89af-c27fe6d88613', '1,107/1, Gopal Mahal Bld, 1st Flr, Gundopanth Street', 'Banglore', 'Karnataka', '560053', 'India', '2026-01-17 05:17:08', '2026-01-17 05:17:08', NULL, '707431af-afa4-4b9d-b6e7-6e01ca10aeda', 'PRIMARY'),
	('8a365c51-34e6-47fc-8186-c90066c891b6', '39 Street', 'Delhi', 'Delhi', '110051', 'India', '2026-01-03 10:11:04', '2026-01-03 10:11:04', NULL, '3de072f9-6812-4a21-9262-d03cea45d56b', 'BILLING'),
	('94e26733-96e0-4a64-9398-be254e5effaf', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 10:34:45', '2026-01-20 10:34:45', NULL, 'fcb8e8db-6523-4fa9-bd08-a054834b2cb7', 'BILLING'),
	('96a76ab1-9a96-4292-811d-2e50069e4414', 'RANDOM', 'SOHNA', 'Haryana', NULL, 'India', '2026-01-28 08:26:37', '2026-01-28 08:26:37', NULL, '50fa88e7-312c-430c-bfeb-9385dafbb64f', 'BILLING'),
	('9bb30911-a061-4079-bf84-4765df476b8d', '636/6 Partap Chowk Rohtak', 'Rohtak', 'Haryana', '124001', 'India', '2026-01-22 09:37:48', '2026-02-07 11:14:44', '5ee872f3-a316-4de6-a55e-959a762f2327', NULL, 'ADDITIONAL'),
	('9e631324-4a81-4c04-b146-eb2f3fa61ab3', 'house 31', 'NEW DELHI', 'Delhi', '110087', 'India', '2026-01-19 09:25:57', '2026-01-19 09:25:57', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'BILLING'),
	('a02c6473-5afb-4055-a762-a8c31c1881b3', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-11 04:45:26', '2026-02-11 04:45:26', NULL, '5cbd1d68-46ba-4fc5-a886-6d2ee1dd014b', 'BILLING'),
	('a0f423f8-7873-430c-a01a-bcbdceac47a5', 'B/33 mianwali, paschim vihar', 'Delhi', 'Delhi', '110087', 'India', '2025-12-20 04:51:34', '2025-12-20 04:51:34', NULL, '788a209c-5176-4d21-acdb-51ac932449ae', 'BILLING'),
	('a1ceb041-8c11-4148-8149-e07ea3c458e4', 'KK', 'DELHI', 'Delhi', '110018', 'India', '2026-02-06 12:37:26', '2026-02-06 12:37:26', NULL, '52b66c48-29ec-4bae-8f99-f73b4a884e5b', 'BILLING'),
	('a2491080-4aab-4890-8b80-572329480689', '', '', '', '', 'India', '2026-02-27 11:47:32', '2026-02-27 11:47:44', 'e30d0df5-b413-462f-9bdc-ae86813add52', NULL, 'ADDITIONAL'),
	('aaac2ed5-c2db-4033-88ce-8413f5fd9f6b', '-', 'delhi', 'Delhi', '110018', 'India', '2026-02-13 10:56:46', '2026-02-13 10:56:46', NULL, 'f5cd9f78-3556-4029-b856-140b16f39c7c', 'BILLING'),
	('ac8e6667-92ca-4b5e-8791-e493729997bb', '77 bheera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-01-14 06:06:00', '2026-01-14 06:06:00', NULL, 'c89f876d-5b69-4a80-b81b-620d72253bbb', 'BILLING'),
	('add2a41b-829d-46c4-b017-1c2d6e217f84', 'BG-1/201 PASCHIM VIHAR', 'NEW DELHI', 'Delhi', '110063', 'India', '2026-02-10 07:06:05', '2026-02-10 07:06:05', NULL, '46c03acc-c337-485b-8664-811648442403', 'BILLING'),
	('b32495bd-132d-45a5-9c2d-a0939c815329', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-28 08:07:13', '2026-01-28 08:07:13', NULL, '791f387f-0439-4318-ae1c-7be0df341113', 'BILLING'),
	('b41f7b14-84f7-49d3-bc24-6d64bc342c1d', 'bhera enclave', 'delhi', 'Delhi', '110087', 'India', '2026-01-31 10:11:28', '2026-01-31 10:11:28', NULL, 'a44fc4df-4272-4046-a36a-a78c4dd12dba', 'BILLING'),
	('b7305202-102b-497a-b7b2-c9afc5fe8e8f', 'House No 2', 'New Delhi', 'Delhi', '110087', 'India', '2026-01-14 08:10:40', '2026-01-14 08:10:40', NULL, 'de0dd927-7b51-4046-ba6b-bdb8575470c3', 'BILLING'),
	('b98d0d2b-4372-47f5-b945-3cdc08091b64', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-02-10 07:38:05', '2026-02-10 07:38:05', NULL, '50c48280-b8a0-43b1-ac38-438d55b7a01e', 'PRIMARY'),
	('bb024292-278e-48c9-a313-8998c218c036', '39 shankar nagar street no 2', 'Delhi', 'Delhi', '110051', 'India', '2026-02-26 10:11:16', '2026-02-26 10:11:16', NULL, 'a7e926e2-29b0-4c49-a4ca-71bed9e038d1', 'BILLING'),
	('bf00c012-5c45-4907-9bad-7d9fe5279187', '77, Basement, Bhera Enclave, Paschim Vihar, Delhi,', 'New Delhi', 'Bihar', '110087', 'India', '2025-12-05 07:52:13', '2025-12-05 07:52:13', NULL, NULL, 'BILLING'),
	('c9da25d8-4883-4414-8f3e-7c48a3dac9e2', '14, Sant Nagar, East of Kailash', 'New Delhi', 'Delhi', '110065', 'India', '2025-12-12 10:51:14', '2025-12-12 10:51:14', NULL, 'ce1945aa-9e2e-4012-8dee-e2df7f6db290', 'BILLING'),
	('cb5f1ecc-c103-4d4b-b2dd-a70612301c1d', '636/6 Partap Mohalla, Quilla Road', 'ROHTAK', 'Uttar Pradesh', '124001', 'India', '2026-02-10 07:30:07', '2026-02-10 07:30:07', NULL, '190f6f83-1e3a-4e6d-ad6c-ef04dbe82475', 'BILLING'),
	('cc814912-dac7-4395-b207-f0cdf7a304d1', 'peera garhi', 'asd', 'Nagaland', '111008', 'India', '2026-01-20 11:58:19', '2026-01-20 11:58:19', NULL, 'a974d385-5619-4c14-8faa-b6a768ce5221', 'BILLING'),
	('d214d8c8-b5fa-4025-b812-030f89ac43d7', 'peera garhi', 'DELHI', 'Punjab', '110087', 'India', '2026-01-20 10:07:45', '2026-01-20 10:07:45', NULL, 'df39321e-5512-452a-85d6-fd54cc362ba7', 'BILLING'),
	('d2d637ea-0aa3-4fff-8784-a792d166acdd', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-17 08:30:57', '2026-01-17 08:30:57', NULL, '89bc2daa-784a-4aa1-8a19-2c64e8c90be8', 'BILLING'),
	('d473f82f-183a-4dfb-8e8c-d055aa158482', 'NO IDEA', 'DELHI', 'Delhi', NULL, 'India', '2026-02-17 06:05:03', '2026-02-17 06:05:03', NULL, '5cdda2bd-982f-4b68-8a7b-5011ad8beb87', 'BILLING'),
	('d4d33a3c-2b96-42f8-a1ff-02beb625c6d7', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 07:25:39', '2026-01-20 07:25:39', NULL, 'c21138da-fc5c-474f-92b0-15e500d65011', 'BILLING'),
	('dce8deb0-1ac4-454a-b0cf-8902de028373', '1/3, 2nd Floor, Mulji Laxmidas Bldg, 26 Mint Road', 'Mumbai', 'Maharashtra', '400001', 'India', '2026-01-17 05:16:32', '2026-01-17 05:16:32', NULL, '707431af-afa4-4b9d-b6e7-6e01ca10aeda', 'BILLING'),
	('e11a07e5-c9f4-4432-bb75-e9164dd60c83', '2B Street', 'NEW DELHI', 'Delhi', NULL, 'India', '2026-01-28 09:35:29', '2026-01-28 09:35:29', NULL, 'f7297bc5-39ca-4c83-bbcc-73c4a1229fb5', 'BILLING'),
	('eb3e3cec-506a-4e84-81a4-297d846a0ae4', '46, RJ', 'New Delhi', 'Delhi', '110087', 'India', '2026-02-09 07:05:17', '2026-02-09 07:05:17', NULL, 'f25cabbe-590d-48b8-9729-d1a115b907c5', 'PRIMARY'),
	('ee3b1b73-4b60-4472-9aa4-766acfd93a30', '7/B mianwali nagar', 'Delhi', 'Delhi', '110087', 'India', '2026-01-19 05:34:30', '2026-01-19 05:34:30', NULL, 'c009febe-4def-4eee-b698-c8d2361542fd', 'BILLING'),
	('f314f5a8-4757-430d-9f06-41e1c8d98360', '77 bheera anclave', 'Delhi', 'Delhi', '110087', 'India', '2026-01-15 09:57:06', '2026-01-15 09:57:06', NULL, '159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'ADDITIONAL'),
	('f7ff02b2-36bc-48f8-81ac-d4674606dd5e', 'Bhera Enclave', 'DELHI', 'Delhi', '110087', 'India', '2026-02-01 04:50:42', '2026-02-01 04:50:42', NULL, '366f0ecf-ae89-4675-98fe-b28f22399fa0', 'BILLING'),
	('fc339daa-eb96-4bc0-b370-6a5fc4d3ea2c', 'peera garhi', 'DELHI', 'Delhi', '110087', 'India', '2026-01-20 10:48:51', '2026-01-20 10:48:51', NULL, '690cf5b0-5ab7-40e5-8e24-8e175d0d538f', 'BILLING');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

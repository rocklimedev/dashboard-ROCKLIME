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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `companyName` varchar(150) DEFAULT NULL,
  `customerType` enum('Retail','Architect','Interior','Builder','Contractor') DEFAULT 'Retail',
  `address` json DEFAULT NULL,
  `isVendor` tinyint(1) NOT NULL DEFAULT '0',
  `vendorId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `gstNumber` varchar(20) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `phone2` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `email` (`email`),
  KEY `vendorId` (`vendorId`),
  KEY `customers_mobile_number` (`mobileNumber`),
  KEY `customers_email` (`email`),
  KEY `customers_is_vendor` (`isVendor`),
  KEY `customers_customer_type` (`customerType`),
  KEY `customers_gst_number` (`gstNumber`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`vendorId`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.customers: ~50 rows (approximately)
INSERT INTO `customers` (`customerId`, `name`, `email`, `mobileNumber`, `companyName`, `customerType`, `address`, `isVendor`, `vendorId`, `gstNumber`, `createdAt`, `updatedAt`, `phone2`) VALUES
	('013aefb1-220e-4052-a345-6971bc2bdd2a', 'MR YASH TYAGI', NULL, NULL, NULL, 'Retail', '{"zip": "110086", "street": "BUDH VIHAR"}', 0, NULL, NULL, '2026-03-07 08:11:06', '2026-03-07 08:11:06', NULL),
	('08e611dc-2e0a-42dc-b5b4-feaa954cc2f2', 'DEEPAK JUNEJA', NULL, NULL, NULL, 'Builder', '{"zip": "110087", "street": "A-3/199"}', 0, NULL, NULL, '2026-04-13 06:03:55', '2026-04-13 06:03:55', NULL),
	('0c9f2206-3258-477e-89e6-38f50b4c2e75', 'Mr hemant', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-02-01 13:47:17', '2026-02-01 13:47:17', NULL),
	('123ffce4-a7c3-4c87-9ea4-79302962ef7a', 'RAMESH', NULL, NULL, NULL, NULL, '{"zip": "110087", "city": "PASCHIM VIHAR", "street": "23 BHERA"}', 0, NULL, NULL, '2026-03-27 13:14:28', '2026-03-27 13:14:28', NULL),
	('13dfe2a2-fa7b-46cc-81a8-e41116d372e4', 'Sahil Sachdeva', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-03-28 07:37:35', '2026-03-28 07:37:35', NULL),
	('159e5369-da7b-4ca3-a147-d4a4ac9a920b', 'Mr. Shivam Phukela', 'sdagaura@rocklime.com', '9999998080', 'Rocklime', 'Retail', '{"zip": "110087", "city": "", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-14 06:00:22', '2026-01-14 06:00:22', '8239828328'),
	('18070658-6b48-4586-9898-5d746d536371', 'DR RAKESH', NULL, NULL, NULL, 'Retail', '{"zip": "110087", "city": "PASCHIM VIHAR", "street": "23 BHERA"}', 0, NULL, NULL, '2026-03-26 05:24:36', '2026-03-26 05:24:36', NULL),
	('190f6f83-1e3a-4e6d-ad6c-ef04dbe82475', 'hello90', 'hello56@gmail.com', '2342342333', '', 'Contractor', '{"zip": "124001", "city": "ROHTAK", "state": "Uttar Pradesh", "street": "636/6 Partap Mohalla, Quilla Road"}', 0, NULL, NULL, '2026-01-30 11:00:33', '2026-01-30 11:00:33', NULL),
	('19e3e308-908f-480e-af2d-c59f96196b36', 'riya', 'priyagalhotra.2305@gmail.com', '9899886172', NULL, 'Retail', '{"zip": "110087", "city": "delhi", "street": "77 basement paschim vihar"}', 0, NULL, NULL, '2026-02-07 08:13:18', '2026-02-07 08:13:18', '9899886172'),
	('1a5c970f-2057-4833-8640-5691bb3b524b', 'Mr. Vinod', 'vinodb@gmail.com', '3232323456', '', 'Retail', NULL, 0, NULL, NULL, '2026-01-28 07:28:19', '2026-01-28 07:28:19', NULL),
	('26d13281-a260-49dc-8c52-a4a3b450a12a', 'Mr. Rahul', 'Mr.Rahul@gmail.com', '1597532586', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 12:51:06', '2026-01-20 12:51:06', NULL),
	('276f5364-6790-4068-afdd-79ad351f80fe', 'Mr. Mandy 4', 'Mr.000Mandy4@gmail.com', '4596321564', 'Rocklime', 'Retail', '{"zip": "111008", "city": "", "state": "Meghalaya", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 11:39:24', '2026-01-20 11:39:24', NULL),
	('2cd776e8-3226-43d4-bc86-f060486d1f65', 'Mr. shiv Kumar', 'Mr.shivKumar@gmail.com', '1234512358', 'Mr. shiv Kumar', 'Retail', '{"zip": "111008", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-14 11:48:59', '2026-01-14 11:48:59', NULL),
	('2ed9310c-52a0-473f-83c8-af4f45f403cd', 'Mr. Vinod', 'vinod2@gmail.com', '1561552221', '', 'Retail', '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "null"}', 0, NULL, NULL, '2026-01-30 10:46:59', '2026-01-30 10:46:59', NULL),
	('2f0c1526-9e5d-4399-81b2-ba2004a3eef0', '30-03-2026', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-03-30 10:16:03', '2026-03-30 10:16:03', NULL),
	('366f0ecf-ae89-4675-98fe-b28f22399fa0', 'Mr. Hemant', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-02-01 04:49:59', '2026-02-01 04:49:59', NULL),
	('371bb062-5b4a-47f1-a91b-9f58506ec16c', 'Mr. Sumit', 'sumit@gmail.com', '9899075295', '', 'Retail', NULL, 0, NULL, NULL, '2026-01-28 10:43:08', '2026-01-28 10:43:08', NULL),
	('3aaa53ef-5583-48b8-88eb-8abddf4d23b1', 'Mr. Vinod', 'vinod@gmail.com', '5165156115', '', 'Retail', NULL, 0, NULL, NULL, '2026-01-28 07:26:26', '2026-01-28 07:26:26', NULL),
	('3de072f9-6812-4a21-9262-d03cea45d56b', 'Bhav Lamba', 'bhav.lamba@gmail.com', '9250206208', 'Rocklime', 'Builder', '{"zip": "110051", "city": "Delhi", "state": "Delhi", "street": "39 Street"}', 0, NULL, NULL, '2026-01-03 10:10:57', '2026-01-03 10:10:57', '7778889991'),
	('3f3f0573-f1e3-42a1-b60d-411867927cf5', 'Raju', NULL, '7788787787', NULL, 'Retail', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "77 bheera enclave pashchim vihar"}', 0, NULL, NULL, '2026-03-27 10:26:21', '2026-03-27 10:26:21', NULL),
	('46c03acc-c337-485b-8664-811648442403', 'MR. VARUN CHAWLA', NULL, NULL, NULL, 'Retail', '{"zip": "110063", "city": "New Delhi", "state": "Delhi", "street": "BG-1/201 PASCHIM VIHAAR"}', 0, NULL, NULL, '2026-02-10 07:00:22', '2026-02-10 07:00:22', NULL),
	('4a7f6ef8-81ba-40de-a887-c620aeecd532', 'HUMBLE INFRA', NULL, NULL, NULL, 'Builder', '{"zip": "110087", "city": "DELHI", "street": "GURUHAR KRISHN NAGAR"}', 0, NULL, NULL, '2026-04-14 07:27:52', '2026-04-14 07:27:52', NULL),
	('4bb60967-6063-4c7d-8601-d13b4a66e350', 'RAKESH', NULL, NULL, NULL, NULL, '{"zip": "110063", "city": "NEW DELHI", "street": "46, RJ"}', 0, NULL, NULL, '2026-02-10 11:42:01', '2026-02-10 11:42:01', NULL),
	('4c3954dc-01ef-444d-920b-accbed59ca67', 'RAKESH', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-02-10 11:41:33', '2026-02-10 11:41:33', NULL),
	('4cb519ac-a606-4fc9-bb02-2b80d932baaf', 'bhav', 'lambabhav@gmail.com', '7667676767', 'Rocklime', 'Architect', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 12:57:11', '2026-01-20 12:57:11', NULL),
	('50c48280-b8a0-43b1-ac38-438d55b7a01e', 'Mr. Karan', 'karan@gmail.com', '8080808080', 'Mr. Karan', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-14 10:11:30', '2026-01-14 10:11:30', NULL),
	('50cf8dc3-2fbf-4581-b033-44729802dcca', 'new 123', NULL, NULL, NULL, 'Builder', '{"zip": "110087", "city": "Bihar", "state": "Chhattisgarh", "street": "77, Basement, Bhera Enclave, Paschim Vihar, Delhi,"}', 0, NULL, NULL, '2026-01-31 10:31:15', '2026-01-31 10:31:15', NULL),
	('50fa88e7-312c-430c-bfeb-9385dafbb64f', 'Mr. Arpit', 'arpit@gmail.com', '1565111122', '', NULL, '{"zip": "", "city": "Sohna", "state": "Haryana", "street": ""}', 0, NULL, NULL, '2026-01-28 08:24:47', '2026-01-28 08:24:47', NULL),
	('512ac57d-35a9-47f8-9f9c-9d76195f2ad7', 'Mr. Rahul', 'social@rocklime.com', '1258993589', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Odisha", "street": ""}', 0, NULL, NULL, '2026-01-20 12:34:50', '2026-01-20 12:34:50', NULL),
	('524f787a-bb00-4930-b191-ce10b4024e21', 'Mr. Gagandeep 2', 'sajjan@rocklime.com', '0236974555', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 12:20:48', '2026-01-20 12:20:48', NULL),
	('52b66c48-29ec-4bae-8f99-f73b4a884e5b', 'MR. KUNAL KAPOOR', NULL, NULL, NULL, 'Architect', '{"street": "PEERAGADHI"}', 0, NULL, NULL, '2026-02-06 12:15:05', '2026-02-06 12:15:05', NULL),
	('54662310-f461-4589-9364-672371c6ff97', 'Priyanka', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-01 09:56:27', '2026-04-01 09:56:27', NULL),
	('5487c3d1-98a5-450c-86ba-fb17c3edcaef', 'VARUN BANSAL', NULL, NULL, NULL, 'Retail', '{"zip": "110087", "city": "NEW DELHI", "street": "."}', 0, NULL, NULL, '2026-04-14 12:47:48', '2026-04-14 12:47:48', NULL),
	('59fae0d1-78b7-42dd-a046-4c2fa344d454', 'Mr. Mandy 3', 'Mr.Mandy3@gmail.com', '9999998080', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 11:23:17', '2026-01-20 11:23:17', NULL),
	('5cbd1d68-46ba-4fc5-a886-6d2ee1dd014b', 'hello 2', 'ekvamevsecratery2@gokuldham.in', '9012234567', 'GOKULDHAM', 'Interior', '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "77, Basement, Bhera Enclave, Paschim Vihar, Delhi,"}', 0, NULL, NULL, '2026-01-28 08:11:55', '2026-01-28 08:11:55', NULL),
	('5cdda2bd-982f-4b68-8a7b-5011ad8beb87', 'Mr. Akshay', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-02-17 05:57:01', '2026-02-17 05:57:01', NULL),
	('6825d1aa-4d18-454d-985b-9546f66321e9', 'Dipanshu', NULL, NULL, NULL, 'Builder', NULL, 0, NULL, NULL, '2026-04-14 06:13:48', '2026-04-14 06:13:48', NULL),
	('690cf5b0-5ab7-40e5-8e24-8e175d0d538f', 'Mr. Mandy 2', 'MrMandy@gmail.com', '2103698520', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 10:48:36', '2026-01-20 10:48:36', NULL),
	('6bea106f-dca4-435d-adf1-3092e99ee904', 'Mr. Gaurang ', 'gaurangji@gmail.com', '2161516561', '', 'Retail', NULL, 0, NULL, NULL, '2026-01-28 10:11:25', '2026-01-28 10:11:25', NULL),
	('6d0f1e08-0d61-44ed-88a3-3b13ac3d1af4', 'something something', 'sdomething@something.com', '8901212233', 'sdomething@something.com', 'Architect', '{"zip": "110087", "city": "something", "state": "Chhattisgarh", "street": "something"}', 0, NULL, NULL, '2026-03-26 07:58:16', '2026-03-26 07:58:16', NULL),
	('707431af-afa4-4b9d-b6e7-6e01ca10aeda', 'Shreya', 'shreya@gmail.com', '9255990099', '', 'Retail', '{"zip": "400001", "city": "Mumbai", "state": "Maharashtra", "street": "1/3, 2nd Floor, Mulji Laxmidas Bldg, 26 Mint Road"}', 0, NULL, NULL, '2026-01-17 05:16:14', '2026-01-17 05:16:14', '8723782378'),
	('75b146ee-5aa6-4ec0-9f3a-67ca6d6542c4', 'Bath Expertz Technologies Pvt.Ltd.', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-01 10:07:35', '2026-04-01 10:07:35', NULL),
	('75b85d6e-9fff-4a67-a9ba-80e10b682579', 'AMUL MADAN', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-08 08:35:38', '2026-04-08 08:35:38', NULL),
	('788a209c-5176-4d21-acdb-51ac932449ae', 'Megha Chhabra', 'megha@rocklime.com', '9995335992', 'Rocklime', 'Retail', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "B/33 mianwali, paschim vihar"}', 0, NULL, NULL, '2025-12-20 04:51:29', '2025-12-20 04:51:29', '9250206208'),
	('78fae522-4519-4efb-887e-ecae295f6e56', 'Bhav', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-01 09:48:24', '2026-04-01 09:48:24', NULL),
	('791f387f-0439-4318-ae1c-7be0df341113', 'JETHALAL CHAMPAKLAL GADA', 'jethalal@gadaelectronics.in', '8723723123', 'GADA ELECTRONICS', 'Interior', '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "77, Basement, Bhera Enclave, Paschim Vihar, Delhi,"}', 0, NULL, NULL, '2026-01-28 08:07:06', '2026-01-28 08:07:06', NULL),
	('7a3c01b6-ab8f-4492-830e-39a7cd3d8d7f', 'NEW  NAME', 'new@gmail.com', NULL, 'NEWNAME', 'Architect', NULL, 0, NULL, NULL, '2026-03-30 09:56:48', '2026-03-30 09:56:48', NULL),
	('7c084080-2931-4451-8045-a8e620a9d089', 'Avanish Kant', 'TRIAL@gmail.com', '9811123623', 'chhabra marble', 'Retail', '{"zip": "110070", "city": "delhi", "state": "Delhi", "street": "3594 D-3"}', 0, NULL, NULL, '2026-02-27 11:59:58', '2026-02-27 11:59:58', NULL),
	('83834f90-b2b8-4626-b10e-b9874411c717', 'EKVAMEV SECRETARY', 'gajubhai@gmail.com', '8723782389', 'GOKULDHAM', NULL, '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "77, Basement, Bhera Enclave, Paschim Vihar, Delhi,"}', 0, NULL, NULL, '2026-02-23 04:56:41', '2026-02-23 04:56:41', NULL),
	('83e168cd-fb86-435b-81c3-511d46dd2ec8', 'Hello', 'doctoryogeshchhabra1@gmail.com', '8923456662', 'Rocklime Media', 'Interior', '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "C 5/8 Mianwali Nagar"}', 0, NULL, NULL, '2026-01-28 07:45:29', '2026-01-28 07:45:29', NULL),
	('84b41a92-296c-4db9-a863-070238fa6ea2', 'bath arcade', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-02 10:33:08', '2026-04-02 10:33:08', NULL),
	('85f05673-9590-46b5-b722-151244fa23eb', 'Sanjay Dutt', 'sanjaydutt@tseries.com', '7878788778', 'T series', 'Builder', '{"zip": "110072", "city": "Delhi", "state": "Delhi", "street": "88,Bheera enclave ,110072"}', 0, NULL, NULL, '2026-03-21 06:04:57', '2026-03-21 06:04:57', '2323232323'),
	('860d3c6b-1942-4e84-98c3-0078e8a583c4', 'Sagar Chhabra', 'sagar@gmail.com', '7777878888', 'Rippotai', 'Architect', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "B3/33 Mianwali, Pashchim vihar"}', 0, NULL, NULL, '2026-03-25 13:04:46', '2026-03-25 13:04:46', '2323233223'),
	('89bc2daa-784a-4aa1-8a19-2c64e8c90be8', '17-01-2026 2', 'sajan@gmail.com', '8278978827', 'Rocklime', NULL, '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-17 08:30:47', '2026-01-17 08:30:47', NULL),
	('8fc34e27-b0ff-4c70-b373-564d5b471025', 'Bhav', 'bhav.lamba@rocklime.com', '7272727272', '', 'Retail', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "77 bheera enclave"}', 0, NULL, NULL, '2026-01-19 07:03:21', '2026-01-19 07:03:21', '3232323232'),
	('911941df-444e-43dd-aac7-eb515ec6872a', 'Jayant', 'jayant@rippotai.com', '2323232323', NULL, 'Architect', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "C banga residence"}', 0, NULL, NULL, '2026-03-07 06:18:33', '2026-03-07 06:18:33', NULL),
	('99aea5d1-0d26-43ab-b94a-43c1eb8f926c', 'Mr. Shubham', 'shubham1@gmail.com', '1515484956', '', 'Retail', '{"zip": "277005", "city": "Mumbai", "state": "Maharashtra", "street": "52b"}', 0, NULL, NULL, '2026-01-30 11:49:39', '2026-01-30 11:49:39', NULL),
	('9c354ac0-745b-4701-9e51-1833e0eaf464', 'hello9023', 'hello234@gmail.com', '2342344221', 'GOKULDHAM', NULL, '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "77, Basement, Bhera Enclave, Paschim Vihar, Delhi,"}', 0, NULL, NULL, '2026-01-30 11:01:52', '2026-01-30 11:01:52', NULL),
	('a02b4d0b-cd36-455e-8ea2-9011714ccac1', 'hello 4 ', 'hello5@gmail.com', '6788768766', '', 'Interior', '{"zip": "110018", "city": "Mumbai", "state": "Himachal Pradesh", "street": "AEROCITY"}', 0, NULL, NULL, '2026-01-30 10:44:07', '2026-01-30 10:44:07', NULL),
	('a25accb6-f0a8-40b7-9be0-0f2a7b17995b', 'THIRD FLOOR MASTER', 'THIRDFLOORMASTER@gmail.com', '7845784569', 'THIRD FLOOR MASTER', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-14 13:13:57', '2026-01-14 13:13:57', NULL),
	('a44fc4df-4272-4046-a36a-a78c4dd12dba', '31-01-2026', '0@gmail.com', '0000000000', 'chhabra marble ', NULL, NULL, 0, NULL, NULL, '2026-01-31 09:58:06', '2026-02-01 10:04:53', NULL),
	('a7e926e2-29b0-4c49-a4ca-71bed9e038d1', 'Bhav Lamba', 'bhav.lamba07@rocklime.com', '9250206299', 'Rocklime', 'Builder', '{"zip": "110051", "city": "Delhi", "state": "Delhi", "street": "39 shankar nagar street no 2"}', 0, NULL, NULL, '2026-02-26 10:09:28', '2026-02-26 10:09:28', NULL),
	('a96dcb75-9951-4b7d-81ef-72c3f4889e97', 'Mr. Piplani Ji', 'Mr.Piplani@gmail.com', '3593593590', 'Mr. Piplani Ji', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-14 11:25:10', '2026-01-14 11:25:10', NULL),
	('a974d385-5619-4c14-8faa-b6a768ce5221', 'Mr. Gagandeep ', 'Mr.Gagandeep@gmail.com', '7900000000', 'Rocklime', 'Retail', '{"zip": "111008", "city": "asd", "state": "Nagaland", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 11:58:11', '2026-01-20 11:58:11', NULL),
	('ae9a17e3-16ef-47fb-af5d-1e4335271365', 'Ajay chhabra', NULL, '3434343434', 'CMT', 'Builder', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "B3/33 mianwali,paschim vihar"}', 0, NULL, NULL, '2026-03-30 06:48:38', '2026-03-30 06:48:38', NULL),
	('aef1d143-f5f3-4385-ae67-02509fe38a1b', '17-01-2026 1', 'rohit12356@gmail.com', '2583697415', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-17 05:22:14', '2026-01-17 05:22:14', NULL),
	('af8d8424-075e-4d52-b145-9a1b9beb573f', 'Rajesh Khanna', 'rajesh@mail.com', '8989899889', 'TVS', 'Retail', '{"zip": "110089", "city": "Delhi", "state": "Delhi", "street": "78 pashchim Vihar"}', 0, NULL, NULL, '2026-03-14 05:35:16', '2026-03-14 05:35:16', '2323232323'),
	('b0181c30-92e1-4e46-a881-e1c0707f2e93', 'MR LALIT', NULL, NULL, NULL, 'Retail', '{"zip": "110086", "city": "NEW DELHI", "street": "B-32"}', 0, NULL, NULL, '2026-03-10 06:33:36', '2026-03-10 06:33:36', NULL),
	('b9177757-0426-4a1b-abe9-e1c9d6be57ae', 'PANKAJ', NULL, NULL, NULL, NULL, '{"zip": "110086", "street": "BUDH VIAHAR"}', 0, NULL, NULL, '2026-03-05 11:47:23', '2026-03-05 11:47:23', NULL),
	('b9c0f047-4549-4542-bff5-902c61784d88', 'bhav magar', 'bhavmagar@gmail.com', '7852369145', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Bihar", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 09:50:44', '2026-01-20 09:50:44', NULL),
	('bcf91e51-0012-4e25-8bd9-f16b43e39424', 'MR PANKAJ BATRA', NULL, NULL, NULL, 'Retail', '{"zip": "110086", "city": "VIJAY VIHAR", "state": "Delhi", "street": "98"}', 0, NULL, NULL, '2026-02-22 11:10:14', '2026-02-22 11:10:14', NULL),
	('bda3861a-c793-4fdc-a14a-89c7809d7870', 'sajju ', 'sajju@gmail.com', '7531598526', 'Rocklime', NULL, '{"zip": "110087", "city": "DELHI", "state": "Dadra and Nagar Haveli and Daman and Diu", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 08:06:24', '2026-01-20 08:06:24', NULL),
	('be00f681-6239-489c-b04c-d4a55ed54f17', 'FIRST FLOOR MASTER 2', 'FIRSTFLOOR@gmail.com', '7894562589', 'FIRST FLOOR MASTER', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-16 05:46:31', '2026-01-16 05:46:31', NULL),
	('c009febe-4def-4eee-b698-c8d2361542fd', 'Monika', 'monika@gmail.com', '8829928822', '', 'Retail', '{"zip": "110087", "city": "Delhi", "state": "Delhi", "street": "7/B mianwali nagar"}', 0, NULL, NULL, '2026-01-19 05:34:22', '2026-01-19 05:34:22', '8923892389'),
	('c21138da-fc5c-474f-92b0-15e500d65011', 'ajju magar', 'ajjumagar@gmail.com', '7896541232', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 07:25:32', '2026-01-20 07:25:32', NULL),
	('c28f8bda-efa1-443e-bb2d-3abb4ee44015', 'MR JAGDEEP SINGH', NULL, NULL, NULL, 'Retail', '{"zip": "110087", "city": "MIYANWALI ", "street": "EW 4 "}', 0, NULL, NULL, '2026-03-15 06:23:30', '2026-03-15 06:23:30', NULL),
	('c73b3385-7736-4f52-b0a3-2bd5c4daee7f', 'BATH TECH', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-04 13:11:47', '2026-04-04 13:11:47', NULL),
	('c8573d69-8be1-454f-9fb8-b57be18bc080', 'Mr. Vinod', 'vinodbb@gmail.com', '1518822665', '', NULL, NULL, 0, NULL, NULL, '2026-01-28 07:29:13', '2026-01-28 07:29:13', NULL),
	('c89f876d-5b69-4a80-b81b-620d72253bbb', 'Sajjan', 'sajjan@gmail.com', '2783287323', '', 'Retail', '{"zip": "110087", "city": "delhi", "state": "Delhi", "street": "77 bheera enclave"}', 0, NULL, NULL, '2026-01-14 06:05:55', '2026-01-14 06:05:55', '2323222323'),
	('cb5cd848-2325-4394-8d71-aa63187b5227', 'DR HARSH', NULL, NULL, NULL, 'Retail', '{"zip": "110087", "street": "23 BHERA"}', 0, NULL, NULL, '2026-03-25 14:02:06', '2026-03-25 14:02:06', NULL),
	('ce1945aa-9e2e-4012-8dee-e2df7f6db290', 'Vimal Gupta', 'vimalgupta@gmail.com', '4521122221', '', 'Retail', '{"zip": "110065", "city": "New Delhi", "state": "Delhi", "street": "14, Sant Nagar, East of Kailash "}', 0, NULL, NULL, '2025-12-12 10:51:09', '2025-12-12 10:51:09', NULL),
	('d1a55e0e-7e2e-4d96-b354-69612deae71a', 'Mr Saurabh', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-03-30 07:37:02', '2026-03-30 07:37:02', NULL),
	('d70c96e9-76a6-475b-969d-b48ea496841c', 'MR RAJESH', NULL, NULL, NULL, 'Retail', '{"zip": ".", "city": ".", "state": "Delhi", "street": "."}', 0, NULL, NULL, '2026-04-11 05:13:03', '2026-04-11 05:13:03', NULL),
	('d9388c2a-98e5-4e84-bb8e-c6d132cd2d8d', 'SECOND FLOOR FRONT BATHROOM', 'SECONDFLOORFRONT@gmail.com', '1593572546', 'SECOND FLOOR FRONT BATHROOM', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-16 06:19:57', '2026-01-16 06:19:57', NULL),
	('dd426a4b-6d9b-48c6-b5d3-bacc22562d87', 'Pankaj Mittal', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-06 12:41:17', '2026-04-06 12:41:17', NULL),
	('de0dd927-7b51-4046-ba6b-bdb8575470c3', 'Mr. Apoorv Gupta', 'apoorv@gmail.com', '9999998090', 'Apoorv', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-14 08:09:59', '2026-01-14 08:09:59', '8239828325'),
	('df39321e-5512-452a-85d6-fd54cc362ba7', 'Mr. Harbola', 'Harbola@gmail.com', '1111111111', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Punjab", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 10:07:18', '2026-01-20 10:07:18', NULL),
	('e29b1738-4b00-45d8-94be-ef3a808c6ef0', 'DR HARSH', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-03-25 14:01:23', '2026-03-25 14:01:23', NULL),
	('ed23e1c1-de6d-429a-89c9-c83bfd5d1760', 'MR BANGA', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-14 13:29:53', '2026-04-14 13:29:53', NULL),
	('f05843b8-cbaf-4128-8dd5-e5ed59835d40', 'Arul singh', 'arul11sch@gmail.com', '9250206207', 'Schbang', 'Builder', '{"zip": "110090", "city": "delhi", "state": "Delhi", "street": "89B ,111 welfare society, pashchim vihar"}', 0, NULL, NULL, '2026-01-15 10:59:04', '2026-01-15 10:59:04', '8810320042'),
	('f25cabbe-590d-48b8-9729-d1a115b907c5', '19-01-2026', 'pubgpaglu@gmail.com', '4561230256', 'Chhabra Marble', 'Retail', '{"zip": "110087", "city": "New Delhi", "state": "Delhi", "street": "46, RJ"}', 0, NULL, NULL, '2026-01-19 09:25:10', '2026-01-19 09:25:10', NULL),
	('f38f9f65-57d2-4621-a583-a2ccfc03aa0b', 'Mr. Sarthak', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-08 05:13:23', '2026-03-08 05:13:23', NULL),
	('f5cd9f78-3556-4029-b856-140b16f39c7c', '13-02-2026', 'TRIAL1993@gmail.com', '0000000001', 'chhabra marble', 'Retail', '{"zip": "110018", "city": "delhi", "state": "Delhi", "street": "-"}', 0, NULL, NULL, '2026-02-13 10:55:24', '2026-02-13 10:55:24', '0000000001'),
	('f617bbf7-07ec-4370-aff5-22eb07e8f8ef', 'Ajay Chhabra', 'ajay@rocklime.com', '9999300699', 'Inoside', 'Retail', '{"zip": "110087", "city": "NEW DELHI", "state": "Delhi", "street": "B3/33 MIANWALI NAGAR"}', 0, NULL, '07AAWCS5148J1ZM', '2025-12-20 07:30:36', '2025-12-20 07:30:36', '9999500699'),
	('f7297bc5-39ca-4c83-bbcc-73c4a1229fb5', 'Mr. Bansal', 'bansal@gmail.com', '2119515231', '', 'Retail', NULL, 0, NULL, NULL, '2026-01-28 09:34:35', '2026-01-28 09:34:35', NULL),
	('fcb8e8db-6523-4fa9-bd08-a054834b2cb7', 'Mr. Mandy', 'mandy@gmail.com', '7894563215', 'Rocklime', NULL, '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-20 10:34:38', '2026-01-20 10:34:38', NULL),
	('fead585e-c32c-40eb-b82f-395f3f744f4d', '17-01-2026', 'bgmipaglu@gmail.com', '4569871235', 'Rocklime', 'Retail', '{"zip": "110087", "city": "DELHI", "state": "Delhi", "street": "peera garhi"}', 0, NULL, NULL, '2026-01-17 09:21:32', '2026-01-17 09:21:32', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

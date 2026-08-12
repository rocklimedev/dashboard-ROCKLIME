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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `mobileNumber` varchar(20) DEFAULT NULL,
  `companyName` varchar(150) DEFAULT NULL,
  `customerType` enum('Retail','Architect','Interior','Builder','Contractor') DEFAULT 'Retail',
  `gender` enum('Male','Female','Other') DEFAULT NULL,
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

-- Dumping data for table spsyn8lm_rocklime_dashboard.customers: ~60 rows (approximately)
INSERT INTO `customers` (`customerId`, `name`, `email`, `mobileNumber`, `companyName`, `customerType`, `gender`, `address`, `isVendor`, `vendorId`, `gstNumber`, `createdAt`, `updatedAt`, `phone2`) VALUES
	('0293eafe-6457-43e9-8035-2961cd396f9b', 'MR SANJAY GULATI', NULL, NULL, NULL, 'Retail', NULL, '{"zip": "110024", "city": "DELHI", "street": "VIKRAM VIAHR ETX. "}', 0, NULL, NULL, '2026-06-08 10:23:08', '2026-06-08 10:23:08', NULL),
	('059d3f1b-66eb-4b71-a869-4edab9799c4d', 'vaishnavi', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-07-22 08:58:54', '2026-07-22 08:58:54', NULL),
	('08d04384-4270-4080-8912-5c126097f7db', 'MS MEGHA (FEMALE BATHROOM)', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-04-29 08:01:37', '2026-04-29 08:01:37', NULL),
	('08e611dc-2e0a-42dc-b5b4-feaa954cc2f2', 'DEEPAK JUNEJA', NULL, NULL, NULL, 'Builder', NULL, '{"zip": "110087", "street": "A-3/199"}', 0, NULL, NULL, '2026-04-13 06:03:55', '2026-04-13 06:03:55', NULL),
	('0de38190-4a23-45b2-857c-7bf6a0d2adf3', 'DEAR CLIENT', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-06 08:28:20', '2026-05-06 08:28:20', NULL),
	('1a04255c-6dca-4439-81cc-0b5eed5772ef', 'MR. PULKIT', NULL, NULL, NULL, NULL, NULL, '{"city": "NEW DELH", "state": "Delhi"}', 0, NULL, NULL, '2026-07-28 08:21:48', '2026-07-28 08:21:48', NULL),
	('1ab5db6e-6246-4c70-ab7f-7823a3693efd', 'SUNIL ANAND', NULL, NULL, NULL, 'Retail', NULL, '{"city": "NEW DELH", "street": "-"}', 0, NULL, NULL, '2026-07-04 07:37:57', '2026-07-04 07:37:57', NULL),
	('1b3f305c-90be-4986-9979-6fd9756866d2', 'Fariya Ansari Ji', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-06 08:39:32', '2026-05-06 08:39:32', NULL),
	('1c6d7a60-e909-4321-b785-aa304b4f33cd', '14-06-2026', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-06-14 14:29:57', '2026-06-14 14:29:57', NULL),
	('1f5ec6de-6acd-4ecf-b35a-4c0f98030098', 'Mrs Priyanka', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-12 12:58:38', '2026-05-12 12:58:38', NULL),
	('22cffda5-fead-4b0d-b599-0b368cea13f7', 'NEW OSWAL', NULL, NULL, NULL, 'Builder', NULL, '{"city": "delhi", "state": "Delhi", "street": "-"}', 0, NULL, NULL, '2026-06-21 12:22:46', '2026-06-21 12:22:46', NULL),
	('243a185f-c656-44da-bd25-21e1cff06aee', 'MR. SHUBHAM', NULL, '9899901618', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 05:22:52', '2026-05-11 05:22:52', NULL),
	('25ff95d9-b475-4609-b606-5385822784ad', 'Mr Rohit Arora', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-22 07:39:26', '2026-05-22 07:39:26', NULL),
	('29ce94bb-5923-446e-8ec5-975fea412cd9', '31-05-2026', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-31 14:18:01', '2026-05-31 14:18:01', NULL),
	('33d6e6a0-eb6c-4121-9ac8-4bd45d3a9d03', 'MSAP ARCHITECT', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-07-02 14:29:22', '2026-07-02 14:29:22', NULL),
	('3bdd1ccc-4933-4609-8962-d49b62b1723c', 'MSAP', NULL, NULL, NULL, NULL, NULL, '{"city": "NEW DELHI", "state": "Delhi"}', 0, NULL, NULL, '2026-07-02 13:53:54', '2026-07-02 13:53:54', NULL),
	('3de072f9-6812-4a21-9262-d03cea45d56b', 'Bhav Lamba', 'bhav.lamba@gmail.com', '9250206208', 'Rocklime', 'Builder', NULL, '{"zip": "110051", "city": "Delhi", "state": "Delhi", "street": "39 Street"}', 0, NULL, NULL, '2026-01-03 10:10:57', '2026-01-03 10:10:57', '7778889991'),
	('3f495fc1-3e99-4a64-866b-b10ddbdf75ce', 'MUNJAAL', NULL, NULL, NULL, 'Retail', NULL, '{"city": "delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-06-25 14:13:20', '2026-06-25 14:13:20', NULL),
	('3f6adb37-d43f-40af-b9c4-24c5c5931460', 'HOTEL CROWN  PLAZA - GURGAON', NULL, NULL, NULL, 'Builder', NULL, '{"city": "deLHI", "state": "Delhi"}', 0, NULL, NULL, '2026-08-11 07:24:27', '2026-08-11 07:24:27', NULL),
	('443f683c-63c2-4c05-bcd9-82ffb904e795', 'KTC', NULL, NULL, NULL, 'Retail', NULL, '{"city": "delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-06-29 10:07:15', '2026-06-29 10:07:15', NULL),
	('4a7f6ef8-81ba-40de-a887-c620aeecd532', 'HUMBLE INFRA', NULL, NULL, NULL, 'Builder', NULL, '{"zip": "110087", "city": "DELHI", "street": "GURUHAR KRISHN NAGAR"}', 0, NULL, NULL, '2026-04-14 07:27:52', '2026-04-14 07:27:52', NULL),
	('4cdb89e3-998e-4eac-95a0-6576e90819e3', 'MRS. MONA', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-06-14 06:19:19', '2026-06-14 06:19:19', NULL),
	('4db28245-8686-41d0-95f8-5a3e2fcaea79', 'FLYP Designs', NULL, '9319757072', NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-06-23 13:58:00', '2026-06-23 13:58:00', NULL),
	('514db2ae-f9e4-42b7-bd7a-e6cb78d4b82e', 'AR. VIBHA', NULL, NULL, NULL, 'Architect', NULL, NULL, 0, NULL, NULL, '2026-06-21 10:51:54', '2026-06-21 10:51:54', NULL),
	('52d56c5a-aa14-4a93-9b0d-218b915a3efa', 'MR. ROHIT ARORA', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-04-28 08:49:12', '2026-04-28 08:49:12', NULL),
	('5487c3d1-98a5-450c-86ba-fb17c3edcaef', 'VARUN BANSAL', NULL, NULL, NULL, 'Retail', NULL, '{"zip": "110087", "city": "NEW DELHI", "street": "."}', 0, NULL, NULL, '2026-04-14 12:47:48', '2026-04-14 12:47:48', NULL),
	('550fe628-3bbd-41ec-8fa8-db6e38d8591a', 'ASHISH PANDEY', NULL, NULL, NULL, 'Retail', NULL, '{"zip": "110086", "city": "DELHI", "state": "Delhi", "street": "JAIN NAGAR "}', 0, NULL, NULL, '2026-05-26 05:06:17', '2026-05-26 05:06:17', NULL),
	('562286f8-9451-475c-ab87-da69563edb12', 'MR ROHIT ARORA BUILDER', NULL, NULL, NULL, 'Builder', NULL, NULL, 0, NULL, NULL, '2026-04-28 09:49:37', '2026-04-28 09:49:37', NULL),
	('5deff912-bb81-40e5-ae59-a1a5737eec71', 'Rajvir', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-07-29 12:13:44', '2026-07-29 12:13:44', NULL),
	('60285865-9842-4e95-96d3-a77be208e104', 'MR ARAV', NULL, NULL, NULL, 'Builder', NULL, NULL, 0, NULL, NULL, '2026-05-02 07:19:24', '2026-05-02 07:19:24', NULL),
	('60f3c328-8d33-4e2a-b7ad-08b7474c89fa', 'MD SONS', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-07-02 09:04:01', '2026-07-02 09:04:01', NULL),
	('649e3a53-9e85-4229-8132-9b7c8a2e4cce', 'MR. RAKESH', NULL, NULL, NULL, NULL, NULL, '{"city": "delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-08-11 09:32:15', '2026-08-11 09:32:15', NULL),
	('6825d1aa-4d18-454d-985b-9546f66321e9', 'Dipanshu', NULL, NULL, NULL, 'Builder', NULL, NULL, 0, NULL, NULL, '2026-04-14 06:13:48', '2026-04-14 06:13:48', NULL),
	('7060d9d1-d891-4798-a839-5b56963eb2ea', 'MS MEGHA (MALE BATHROOM)', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-29 13:50:58', '2026-04-29 13:50:58', NULL),
	('79d35676-f23e-4e26-ae73-9588bd8cf204', 'NIKHIL', NULL, NULL, NULL, NULL, NULL, '{"city": "deLHI", "state": "Delhi"}', 0, NULL, NULL, '2026-08-01 11:28:27', '2026-08-01 11:28:27', NULL),
	('84706e05-e076-4607-930d-5b5450dd6775', 'HPC', NULL, NULL, NULL, NULL, NULL, '{"city": "delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-06-22 09:50:54', '2026-06-22 09:50:54', NULL),
	('84b41a92-296c-4db9-a863-070238fa6ea2', 'bath arcade', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-02 10:33:08', '2026-04-02 10:33:08', NULL),
	('864da623-1635-4f02-8e0d-2a1dd7f82ec0', 'Hotel Crown Plaza', NULL, NULL, NULL, 'Contractor', NULL, '{"zip": "122001", "city": "HARYANA ", "state": "Haryana"}', 0, NULL, NULL, '2026-06-29 10:22:59', '2026-06-29 10:22:59', NULL),
	('8a5150c4-771b-4992-9c4d-47589f10b9c0', 'Unity Buildmart Private Limited', NULL, NULL, NULL, NULL, NULL, '{"city": "NEW DELH", "state": "Delhi"}', 0, NULL, NULL, '2026-07-07 08:08:42', '2026-07-07 08:08:42', NULL),
	('94367fe0-257d-442e-9659-eb40f890f6d4', 'DR BATRA', NULL, NULL, NULL, NULL, NULL, '{"city": "new delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-08-01 08:49:59', '2026-08-01 08:49:59', NULL),
	('96d914e7-8aaa-4af1-9866-60ee88b8fb30', 'MR. YOGESH', NULL, NULL, NULL, 'Retail', NULL, '{"city": "new delhi", "state": "Delhi", "street": "144 VINUS APPT."}', 0, NULL, NULL, '2026-07-30 06:49:25', '2026-07-30 06:49:25', NULL),
	('9a4275b6-6239-46d3-83fe-47c0130b4bee', 'sahiba kaur', NULL, '9821793334', NULL, 'Retail', NULL, '{"zip": "110015", "city": "Delhi", "state": "Delhi", "street": "f-63A, Mansarover garden"}', 0, NULL, NULL, '2026-06-24 06:37:15', '2026-06-24 06:37:15', NULL),
	('a72f4c02-ed6f-4fa7-b084-6cbe57e6c8c7', 'Mr. Dushyant', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-07-10 15:45:21', '2026-07-10 15:45:21', NULL),
	('a762f721-79fd-4f4c-80a8-87c0a06edc38', 'KASHISH', NULL, NULL, NULL, 'Retail', NULL, '{"city": "NEW DELH", "state": "Delhi"}', 0, NULL, NULL, '2026-08-04 09:54:17', '2026-08-04 09:54:17', NULL),
	('ae14cf94-fc82-4dc7-8644-459f7e190dae', 'RAJAT BINDAL', NULL, NULL, NULL, 'Builder', NULL, '{"zip": "110063", "city": "NEW DELH", "state": "Delhi", "street": "B-2/136 PASCHIM VIHAR"}', 0, NULL, NULL, '2026-06-21 10:23:03', '2026-06-21 10:23:03', NULL),
	('b12da1a5-1627-43fe-b2af-ec5477a6fee8', 'Mr. RAJVIR', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-07-29 12:38:32', '2026-07-29 12:38:32', NULL),
	('b3ad797a-6cf2-4de2-bf47-40f9deaeec32', 'MIGLANI JI', NULL, NULL, NULL, 'Builder', 'Male', '{"city": "new delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-08-03 14:17:46', '2026-08-04 04:01:40', NULL),
	('b882e192-042e-4bc3-b943-613f2d9590e6', 'MR. RAKESH', NULL, NULL, NULL, 'Builder', NULL, '{"city": "NEW DELH", "state": "Delhi"}', 0, NULL, NULL, '2026-07-25 09:39:45', '2026-07-25 09:39:45', NULL),
	('cae67a86-f23f-4359-a987-c9a4de7d8b72', 'THE WHITE HOUSE', NULL, NULL, NULL, NULL, NULL, '{"zip": "132103", "city": "HARYANA"}', 0, NULL, NULL, '2026-05-22 09:37:44', '2026-05-22 09:37:44', NULL),
	('cc60fa61-2ad1-4698-8e2f-212f8073c17f', 'MR. VISHESH', NULL, NULL, NULL, NULL, NULL, '{"city": "NEW DELH", "state": "Delhi"}', 0, NULL, NULL, '2026-07-05 06:06:29', '2026-07-05 06:06:29', NULL),
	('cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'Mrinaal Mittal', 'mrinaalmittal@gmail.com', '9599250091', '', 'Retail', NULL, '{"zip": "110007", "city": "Delhi", "state": "Delhi", "street": "Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur"}', 0, NULL, NULL, '2026-04-24 06:09:38', '2026-04-24 06:09:38', NULL),
	('cf7a89a9-9dc8-404c-b1c7-debb2f559ccd', 'BUNNY SAHWNEY', NULL, NULL, NULL, 'Builder', NULL, '{"zip": "110086", "city": "DELHI", "state": "Delhi", "street": "M-574 GURUHARKISHAN NAGAR"}', 0, NULL, NULL, '2026-06-01 10:02:50', '2026-06-01 10:02:50', NULL),
	('d4b02fef-0add-4489-a053-94488ac5a3fe', 'MR. ABHILASH JHA', NULL, '9911152044', NULL, 'Retail', NULL, '{"zip": "110075", "city": "", "state": "Delhi", "street": "PLOT NO 37 SECTOR 10 DWARKA"}', 0, NULL, NULL, '2026-05-08 12:29:55', '2026-05-08 12:29:55', NULL),
	('d70c96e9-76a6-475b-969d-b48ea496841c', 'MR RAJESH', NULL, NULL, NULL, 'Retail', NULL, '{"zip": ".", "city": ".", "state": "Delhi", "street": "."}', 0, NULL, NULL, '2026-04-11 05:13:03', '2026-04-11 05:13:03', NULL),
	('ed23e1c1-de6d-429a-89c9-c83bfd5d1760', 'MR BANGA', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-04-14 13:29:53', '2026-04-14 13:29:53', NULL),
	('ef9c4a8a-da1e-43ce-af95-a4dfa5da4fff', 'MS. PRIYANKA', NULL, NULL, NULL, 'Retail', NULL, NULL, 0, NULL, NULL, '2026-04-27 10:38:07', '2026-04-27 10:38:07', NULL),
	('f3830a6f-641d-419a-8560-8cdb6a9267b9', 'sharthak mehta', NULL, NULL, NULL, 'Retail', NULL, '{"zip": "110058", "city": "new delhi", "state": "Delhi", "street": "A-/101 FIRST FLOOR JANAKPURI"}', 0, NULL, NULL, '2026-06-08 11:59:06', '2026-06-08 11:59:06', NULL),
	('f9858b88-e414-4cec-9bcc-61cdf170a8ac', 'MR. MIGLANI', NULL, NULL, NULL, 'Retail', NULL, '{"city": "new delhi", "state": "Delhi"}', 0, NULL, NULL, '2026-08-03 14:20:26', '2026-08-03 14:20:26', NULL),
	('fca8b8f9-0f51-4fc2-8f30-969fd138562e', 'MR. SALMAN', NULL, NULL, NULL, 'Retail', NULL, '{"zip": "190023", "state": "Jammu and Kashmir", "street": "LAL BAZAAR"}', 0, NULL, NULL, '2026-05-12 13:29:25', '2026-05-12 13:29:25', NULL),
	('fea6485f-6512-4cd7-85ed-ea0b605e6063', 'TECH MAK', NULL, NULL, NULL, NULL, NULL, '{"city": "deLHI", "state": "Delhi"}', 0, NULL, NULL, '2026-08-11 10:31:20', '2026-08-11 10:31:20', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

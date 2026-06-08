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

-- Dumping data for table spsyn8lm_rocklime_dashboard.customers: ~26 rows (approximately)
INSERT INTO `customers` (`customerId`, `name`, `email`, `mobileNumber`, `companyName`, `customerType`, `address`, `isVendor`, `vendorId`, `gstNumber`, `createdAt`, `updatedAt`, `phone2`) VALUES
	('08d04384-4270-4080-8912-5c126097f7db', 'MS MEGHA (FEMALE BATHROOM)', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-29 08:01:37', '2026-04-29 08:01:37', NULL),
	('08e611dc-2e0a-42dc-b5b4-feaa954cc2f2', 'DEEPAK JUNEJA', NULL, NULL, NULL, 'Builder', '{"zip": "110087", "street": "A-3/199"}', 0, NULL, NULL, '2026-04-13 06:03:55', '2026-04-13 06:03:55', NULL),
	('0de38190-4a23-45b2-857c-7bf6a0d2adf3', 'DEAR CLIENT', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-06 08:28:20', '2026-05-06 08:28:20', NULL),
	('1b3f305c-90be-4986-9979-6fd9756866d2', 'Fariya Ansari Ji', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-06 08:39:32', '2026-05-06 08:39:32', NULL),
	('1f5ec6de-6acd-4ecf-b35a-4c0f98030098', 'Mrs Priyanka', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-12 12:58:38', '2026-05-12 12:58:38', NULL),
	('243a185f-c656-44da-bd25-21e1cff06aee', 'MR. SHUBHAM', NULL, '9899901618', NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 05:22:52', '2026-05-11 05:22:52', NULL),
	('25ff95d9-b475-4609-b606-5385822784ad', 'Mr Rohit Arora', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-22 07:39:26', '2026-05-22 07:39:26', NULL),
	('29ce94bb-5923-446e-8ec5-975fea412cd9', '31-05-2026', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-31 14:18:01', '2026-05-31 14:18:01', NULL),
	('3de072f9-6812-4a21-9262-d03cea45d56b', 'Bhav Lamba', 'bhav.lamba@gmail.com', '9250206208', 'Rocklime', 'Builder', '{"zip": "110051", "city": "Delhi", "state": "Delhi", "street": "39 Street"}', 0, NULL, NULL, '2026-01-03 10:10:57', '2026-01-03 10:10:57', '7778889991'),
	('4a7f6ef8-81ba-40de-a887-c620aeecd532', 'HUMBLE INFRA', NULL, NULL, NULL, 'Builder', '{"zip": "110087", "city": "DELHI", "street": "GURUHAR KRISHN NAGAR"}', 0, NULL, NULL, '2026-04-14 07:27:52', '2026-04-14 07:27:52', NULL),
	('52d56c5a-aa14-4a93-9b0d-218b915a3efa', 'MR. ROHIT ARORA', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-28 08:49:12', '2026-04-28 08:49:12', NULL),
	('5487c3d1-98a5-450c-86ba-fb17c3edcaef', 'VARUN BANSAL', NULL, NULL, NULL, 'Retail', '{"zip": "110087", "city": "NEW DELHI", "street": "."}', 0, NULL, NULL, '2026-04-14 12:47:48', '2026-04-14 12:47:48', NULL),
	('550fe628-3bbd-41ec-8fa8-db6e38d8591a', 'ASHISH PANDEY', NULL, NULL, NULL, 'Retail', '{"zip": "110086", "city": "DELHI", "state": "Delhi", "street": "JAIN NAGAR "}', 0, NULL, NULL, '2026-05-26 05:06:17', '2026-05-26 05:06:17', NULL),
	('562286f8-9451-475c-ab87-da69563edb12', 'MR ROHIT ARORA BUILDER', NULL, NULL, NULL, 'Builder', NULL, 0, NULL, NULL, '2026-04-28 09:49:37', '2026-04-28 09:49:37', NULL),
	('60285865-9842-4e95-96d3-a77be208e104', 'MR ARAV', NULL, NULL, NULL, 'Builder', NULL, 0, NULL, NULL, '2026-05-02 07:19:24', '2026-05-02 07:19:24', NULL),
	('6825d1aa-4d18-454d-985b-9546f66321e9', 'Dipanshu', NULL, NULL, NULL, 'Builder', NULL, 0, NULL, NULL, '2026-04-14 06:13:48', '2026-04-14 06:13:48', NULL),
	('7060d9d1-d891-4798-a839-5b56963eb2ea', 'MS MEGHA (MALE BATHROOM)', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-29 13:50:58', '2026-04-29 13:50:58', NULL),
	('84b41a92-296c-4db9-a863-070238fa6ea2', 'bath arcade', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-02 10:33:08', '2026-04-02 10:33:08', NULL),
	('cae67a86-f23f-4359-a987-c9a4de7d8b72', 'THE WHITE HOUSE', NULL, NULL, NULL, NULL, '{"zip": "132103", "city": "HARYANA"}', 0, NULL, NULL, '2026-05-22 09:37:44', '2026-05-22 09:37:44', NULL),
	('cd70db23-5846-4b4b-9224-7eef7a5d9cae', 'Mrinaal Mittal', 'mrinaalmittal@gmail.com', '9599250091', '', 'Retail', '{"zip": "110007", "city": "Delhi", "state": "Delhi", "street": "Amritan, 1 Sultanpur Farms Parkriti Marg, Chhattarpur"}', 0, NULL, NULL, '2026-04-24 06:09:38', '2026-04-24 06:09:38', NULL),
	('cf7a89a9-9dc8-404c-b1c7-debb2f559ccd', 'BUNNY SAHWNEY', NULL, NULL, NULL, 'Builder', '{"zip": "110086", "city": "DELHI", "state": "Delhi", "street": "M-574 GURUHARKISHAN NAGAR"}', 0, NULL, NULL, '2026-06-01 10:02:50', '2026-06-01 10:02:50', NULL),
	('d4b02fef-0add-4489-a053-94488ac5a3fe', 'MR. ABHILASH JHA', NULL, '9911152044', NULL, 'Retail', '{"zip": "110075", "city": "", "state": "Delhi", "street": "PLOT NO 37 SECTOR 10 DWARKA"}', 0, NULL, NULL, '2026-05-08 12:29:55', '2026-05-08 12:29:55', NULL),
	('d70c96e9-76a6-475b-969d-b48ea496841c', 'MR RAJESH', NULL, NULL, NULL, 'Retail', '{"zip": ".", "city": ".", "state": "Delhi", "street": "."}', 0, NULL, NULL, '2026-04-11 05:13:03', '2026-04-11 05:13:03', NULL),
	('ed23e1c1-de6d-429a-89c9-c83bfd5d1760', 'MR BANGA', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-14 13:29:53', '2026-04-14 13:29:53', NULL),
	('ef9c4a8a-da1e-43ce-af95-a4dfa5da4fff', 'MS. PRIYANKA', NULL, NULL, NULL, 'Retail', NULL, 0, NULL, NULL, '2026-04-27 10:38:07', '2026-04-27 10:38:07', NULL),
	('fca8b8f9-0f51-4fc2-8f30-969fd138562e', 'MR. SALMAN', NULL, NULL, NULL, 'Retail', '{"zip": "190023", "state": "Jammu and Kashmir", "street": "LAL BAZAAR"}', 0, NULL, NULL, '2026-05-12 13:29:25', '2026-05-12 13:29:25', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

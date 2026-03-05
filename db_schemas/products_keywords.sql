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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.products_keywords
CREATE TABLE IF NOT EXISTS `products_keywords` (
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `keywordId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`productId`,`keywordId`),
  UNIQUE KEY `unique_product_keyword` (`productId`,`keywordId`),
  KEY `idx_keywordId` (`keywordId`),
  KEY `idx_productId` (`productId`),
  CONSTRAINT `fk_products_keywords_keyword` FOREIGN KEY (`keywordId`) REFERENCES `keywords` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_products_keywords_product` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.products_keywords: ~20 rows (approximately)
INSERT INTO `products_keywords` (`productId`, `keywordId`, `createdAt`, `updatedAt`) VALUES
	('0eb9713c-4607-4d01-9979-facc73869206', 'e3f7ddbd-a998-4635-9ab2-e2474190a22c', '2026-01-08 12:50:29', '2026-01-08 12:50:29'),
	('0ed58abc-3c63-4221-a522-b5bf4c498d13', '7de8886b-fc77-431e-9b77-23e38b4fbd36', '2025-12-19 08:17:17', '2025-12-19 08:17:17'),
	('228dec64-41ea-41f5-96ae-8d3bc0ea79e2', '01183faa-fb1d-400a-ae57-8685221c1b40', '2025-12-31 05:44:09', '2025-12-31 05:44:09'),
	('2330a4fa-f033-4719-baf4-11a73fa3622e', '1fbe5a4c-7f07-42ae-ab4e-4dac024d60cd', '2026-01-05 05:16:54', '2026-01-05 05:16:54'),
	('28aab6a0-fe5b-4e5c-85f3-925a29d27a4c', 'b7139452-4eb3-483a-b266-dc4ae56974b3', '2026-01-01 06:32:40', '2026-01-01 06:32:40'),
	('2985c4e0-ac82-4b67-8bb5-ec78155c5db5', '680d5313-ed2d-4065-9553-3bbc3e956904', '2025-12-19 05:25:59', '2025-12-19 05:25:59'),
	('2985c4e0-ac82-4b67-8bb5-ec78155c5db5', 'e76e675f-de94-4615-96f7-89beee08f5cc', '2025-12-19 05:25:59', '2025-12-19 05:25:59'),
	('335df608-e5b0-4d26-8d24-d3327c4abadb', '6fd707b5-7bd0-46fe-b911-331cbb3a3c7e', '2026-02-26 09:21:27', '2026-02-26 09:21:27'),
	('479edf44-996c-40cd-90e2-7bf3d3d9252f', 'e3f7ddbd-a998-4635-9ab2-e2474190a22c', '2026-01-08 12:44:33', '2026-01-08 12:44:33'),
	('48ef6fa4-6cdc-4f15-b7f9-f3dc0a4217cc', 'd52f0be2-3a17-471a-a6c5-886543b79257', '2025-12-25 06:38:40', '2025-12-25 06:38:40'),
	('5e05c734-cee9-4b62-96c2-b86bca1b6bef', 'e3f7ddbd-a998-4635-9ab2-e2474190a22c', '2026-01-08 12:51:13', '2026-01-08 12:51:13'),
	('79c49723-2cda-4ed3-8b3e-7e682e518ce2', '401409cf-182c-4e38-819c-54dccd8048ee', '2025-12-19 05:43:32', '2025-12-19 05:43:32'),
	('7ead6e2b-5625-4832-b48c-c301756787f0', '1b56b70c-de3e-4757-b336-0406631a5c81', '2026-01-01 06:31:01', '2026-01-01 06:31:01'),
	('884e03ad-2c91-4b3b-9be9-068a0d23d3d5', '2403c1d6-92fa-4cc9-b104-4f2f9c7e6595', '2026-02-26 12:29:01', '2026-02-26 12:29:01'),
	('92a68b80-ee1c-4eef-b7da-ce5a08360e85', '92bbfa8e-4e9a-4959-b384-57eafe372e58', '2026-01-01 06:35:09', '2026-01-01 06:35:09'),
	('970325c4-c898-4635-a7ea-5eb66af54ed4', '9e11a237-9be8-4b6f-8bd5-7183f6a62588', '2026-01-01 06:33:50', '2026-01-01 06:33:50'),
	('970dd38d-1bbf-4e4f-b00e-c2eccfb6d712', '401409cf-182c-4e38-819c-54dccd8048ee', '2025-12-18 13:14:48', '2025-12-18 13:14:48'),
	('9d7d6f8c-af50-4c34-b761-0723c71b0cec', 'ea72ee37-7037-4785-bb11-0cb70aadb98f', '2025-12-19 08:42:20', '2025-12-19 08:42:20'),
	('cced21a1-7f74-438a-b758-8fb4d5f7010c', '040cf236-9b12-415f-bd1a-9921b4bf9c34', '2026-01-11 12:26:48', '2026-01-11 12:26:48'),
	('f5252fdc-7621-4322-95f0-22be30717e37', '6789eae4-0cb3-41cc-aea8-deb5e70fba8c', '2026-01-01 06:39:58', '2026-01-01 06:39:58');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

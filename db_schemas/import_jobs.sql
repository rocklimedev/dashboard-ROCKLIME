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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.import_jobs
CREATE TABLE IF NOT EXISTS `import_jobs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `userId` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `filePath` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  `originalFileName` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mapping` json NOT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'pending',
  `totalRows` int(11) DEFAULT NULL,
  `processedRows` int(11) NOT NULL DEFAULT '0',
  `successCount` int(11) NOT NULL DEFAULT '0',
  `failedCount` int(11) NOT NULL DEFAULT '0',
  `newCategoriesCount` int(11) NOT NULL DEFAULT '0',
  `newBrandsCount` int(11) NOT NULL DEFAULT '0',
  `newVendorsCount` int(11) NOT NULL DEFAULT '0',
  `errorLog` json DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.import_jobs: ~7 rows (approximately)
INSERT INTO `import_jobs` (`id`, `userId`, `filePath`, `originalFileName`, `mapping`, `status`, `totalRows`, `processedRows`, `successCount`, `failedCount`, `newCategoriesCount`, `newBrandsCount`, `newVendorsCount`, `errorLog`, `completedAt`, `createdAt`, `updatedAt`) VALUES
	('19f727c8-8b0f-4637-97dd-57116b1b03ce', NULL, 'https://static.cmtradingco.com/product_images/ffe60a32-2c80-4f39-9375-babde08161e7.xlsx', 'bulk-import-template.xlsx', '{"name": "name", "brand": "brand", "images": "images", "vendor": "vendor", "category": "category", "keywords": "keywords", "quantity": "quantity", "description": "description", "meta_barcode": "meta_barcode", "product_code": "product_code", "meta_sellingPrice": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 09:28:40', '2026-01-24 10:06:27'),
	('2080bbed-e0e0-4d47-a5b9-2ac8bad205df', NULL, 'https://static.cmtradingco.com/product_images/7eebd279-0389-429a-873d-4855aa4a6fff.xlsx', 'PRODUCT LIST FW.xlsx', '{"0": "name", "1": "images", "2": "description", "3": "product_code", "4": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-24 09:50:19', '2026-01-24 10:06:28'),
	('4305134f-2922-4640-afcd-a1977303df07', NULL, 'https://static.cmtradingco.com/product_images/a038e1ca-90f6-424d-894d-0093397f20e9.xlsx', 'bulk-import-template.xlsx', '{"name": "name", "brand": "brand", "images": "images", "vendor": "vendor", "category": "category", "keywords": "keywords", "quantity": "quantity", "description": "description", "meta_barcode": "meta_barcode", "product_code": "product_code", "meta_sellingPrice": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 09:44:41', '2026-01-24 10:06:27'),
	('62200ad6-91aa-486a-8151-914c38b5bdc3', NULL, 'https://static.cmtradingco.com/product_images/f0c87903-ec3c-44b4-a429-e877bfb1cfc5.xlsx', 'bulk-import-template.xlsx', '{"0": "name", "1": "product_code", "2": "description", "3": "quantity", "4": "category", "5": "brand", "6": "vendor", "7": "images", "8": "keywords", "9": "meta_barcode", "10": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 10:39:19', '2026-01-24 10:06:28'),
	('70ba6119-06c2-40de-9473-8097e5de0226', NULL, 'https://static.cmtradingco.com/product_images/5aa95d29-1a12-496c-b4d1-771c39a1f962.xlsx', 'bulk-import-template.xlsx', '{"0": "name", "1": "product_code", "2": "description", "3": "quantity", "4": "category", "5": "brand", "6": "vendor", "7": "images", "8": "keywords", "9": "meta_barcode", "10": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 11:10:39', '2026-01-24 10:06:28'),
	('a66de652-8c7c-463d-893e-fbfde21eaf8a', NULL, 'https://static.cmtradingco.com/product_images/260a776e-51cf-4cd4-8c89-de473acfd6ae.xlsx', 'bulk-import-template.xlsx', '{"name": "name", "brand": "brand", "images": "images", "vendor": "vendor", "category": "category", "keywords": "keywords", "quantity": "quantity", "description": "description", "meta_barcode": "meta_barcode", "product_code": "product_code", "meta_sellingPrice": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 09:52:59', '2026-01-24 10:06:27'),
	('b08f0388-242a-428b-9345-ab8c40495f53', NULL, 'https://static.cmtradingco.com/product_images/7304d6aa-d1a1-415c-a98c-3e063d7eaf66.xlsx', 'bulk-import-template.xlsx', '{"name": "name", "brand": "brand", "images": "images", "vendor": "vendor", "category": "category", "keywords": "keywords", "quantity": "quantity", "description": "description", "meta_barcode": "meta_barcode", "product_code": "product_code", "meta_sellingPrice": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 10:07:48', '2026-01-24 10:06:28'),
	('d823b009-e5c9-4269-885c-bc486fbaa1f6', NULL, 'https://static.cmtradingco.com/product_images/e5b020fe-51e2-42c6-9848-5c4096a94d93.xlsx', 'bulk-import-template.xlsx', '{"0": "name", "1": "product_code", "2": "description", "3": "quantity", "4": "category", "5": "brand", "6": "vendor", "7": "images", "8": "keywords", "9": "meta_barcode", "10": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 10:31:23', '2026-01-24 10:06:28'),
	('e5a15356-68b2-4b9a-a3a6-09ef66747591', NULL, 'https://static.cmtradingco.com/product_images/1157eff5-6a81-4809-9f43-6512efd039a1.xlsx', 'bulk-import-template.xlsx', '{"name": "name", "brand": "brand", "images": "images", "vendor": "vendor", "category": "category", "keywords": "keywords", "quantity": "quantity", "description": "description", "meta_barcode": "meta_barcode", "product_code": "product_code", "meta_sellingPrice": "meta_sellingPrice"}', 'failed', NULL, 0, 0, 0, 0, 0, 0, '[{"error": "Failed to download file: downloadFromFtp is not a function"}]', NULL, '2026-01-20 08:37:54', '2026-01-24 10:06:27');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.product_metas
CREATE TABLE IF NOT EXISTS `product_metas` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Label for the metadata field (e.g., Selling Price, MRP)',
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fieldType` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Type of data (e.g., string, number, mm, inch, pcs, box, feet)',
  `unit` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Optional unit of measurement (e.g., inch, mm, pcs)',
  `createdAt` datetime DEFAULT NULL,
  `tally_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'Tally product code',
  `tally_stock` decimal(10,2) DEFAULT NULL COMMENT 'Stock value from Tally',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.product_metas: ~27 rows (approximately)
INSERT INTO `product_metas` (`id`, `title`, `slug`, `fieldType`, `unit`, `createdAt`, `tally_code`, `tally_stock`) VALUES
	('0f429633-220c-478b-972e-817193a527f2', 'Size (mm)', 'sizeMM', 'number', 'mm', '2025-08-06 09:59:29', NULL, NULL),
	('16ffa365-3b25-4230-a8f5-73ba5b8ac5a1', 'Product Segment', 'productSegment', 'string', NULL, '2025-08-06 10:57:04', NULL, NULL),
	('1cf23921-49cd-11f1-93ac-52540021303b', 'Product No', 'product_no', 'string', NULL, '2026-05-07 09:57:52', NULL, NULL),
	('1cf286a9-49cd-11f1-93ac-52540021303b', 'HSN Code', 'hsnCode', 'string', NULL, '2026-05-07 09:57:52', NULL, NULL),
	('1cf288ba-49cd-11f1-93ac-52540021303b', 'Base Unit', 'base_unit', 'string', NULL, '2026-05-07 09:57:52', NULL, NULL),
	('32cef946-b417-4acf-a342-58e6c60f5aa4', 'Area Covered per Box', 'areaCoveredPerBox', 'number', 'sqft', '2025-08-06 09:59:29', NULL, NULL),
	('4a408954-1143-11f1-b773-52540021303b', 'Size (ML)', 'size-ml', 'number', 'ml', '2026-02-24 11:10:13', NULL, NULL),
	('4a427124-1143-11f1-b773-52540021303b', 'Size (L)', 'size-l', 'number', 'l', '2026-02-24 11:10:13', NULL, NULL),
	('4ded1cb3-5d31-42e8-90ec-a381a6ab1e35', 'Barcode', 'barcode', 'string', NULL, '2025-08-06 10:56:59', NULL, NULL),
	('5f2144bd-5f0b-11f1-8f9b-52540021303b', 'Price Segment', 'price_segment', 'string', NULL, '2026-06-03 10:46:27', NULL, NULL),
	('6af40ff1-4838-11f1-ba3d-52540021303b', 'Caliber', 'caliber', 'number', 'mm', '2026-05-05 09:40:57', NULL, NULL),
	('6af430ed-4838-11f1-ba3d-52540021303b', 'Retail MRP per Sq.Ft.', 'retail_mrp_per_sft', 'number', 'INR/sqft', '2026-05-05 09:40:57', NULL, NULL),
	('6af43237-4838-11f1-ba3d-52540021303b', 'Ex-Factory Price per Sq.Ft.', 'ex_factory_per_sft', 'number', 'INR/sqft', '2026-05-05 09:40:57', NULL, NULL),
	('6af43383-4838-11f1-ba3d-52540021303b', 'Square Feet per Box', 'sft_per_box', 'number', 'sqft', '2026-05-05 09:40:57', NULL, NULL),
	('6af433e4-4838-11f1-ba3d-52540021303b', 'Weight per Box', 'kg_per_box', 'number', 'kg', '2026-05-05 09:40:57', NULL, NULL),
	('73c6caff-3b7d-4eae-bb7a-dfd176d130c7', 'MRP per Pcs', 'mrpPerPcs', 'number', 'INR', '2025-08-06 09:59:29', NULL, NULL),
	('7687da21-9173-4172-9371-51aa426de108', 'Purchasing Price', 'purchasingPrice', 'number', 'INR', '2025-08-06 09:59:29', NULL, NULL),
	('7e2b4efb-4ff2-4e4d-9b08-82559a7e3cd0', 'Size (inches/feet)', 'sizeFeet', 'string', 'feet', '2025-08-06 09:59:29', NULL, NULL),
	('81cd6d76-d7d2-4226-b48e-6704e6224c2b', 'Product Group', 'productGroup', 'string', NULL, '2025-08-06 10:56:59', NULL, NULL),
	('963ad7fb-734b-41d7-a95a-27a84e068ae0', 'MRP per Box', 'mrpPerBox', 'number', 'INR', '2025-08-06 09:59:29', NULL, NULL),
	('9ba862ef-f993-4873-95ef-1fef10036aa5', 'Selling Price', 'sellingPrice', 'number', 'INR', '2025-08-06 09:59:29', NULL, NULL),
	('af3b4db4-6365-4dbc-b46b-4c9a744b1b4e', 'Length', 'length', 'number', 'inch', '2025-08-06 09:59:29', NULL, NULL),
	('b9e1df45-113d-11f1-b773-52540021303b', 'Color Name', 'color_name', 'string', NULL, '2026-02-24 10:30:23', NULL, NULL),
	('d11da9f9-3f2e-4536-8236-9671200cca4a', 'Company Code', 'companyCode', 'string', NULL, '2025-08-06 10:56:59', NULL, NULL),
	('d3d3bd17-86fd-4390-83ea-8822755b8de9', 'Width', 'width', 'number', 'inch', '2025-08-06 09:59:29', NULL, NULL),
	('e926224f-7ca6-4e28-b28c-69f0162d57c4', 'Area Covered per Pcs', 'areaCoveredPerPcs', 'number', 'sqft', '2025-08-06 09:59:29', NULL, NULL),
	('ff53919e-40ac-4cb9-9b8e-d159547901f7', 'Pcs per Box', 'pcsPerBox', 'number', 'pcs', '2025-08-06 09:59:29', NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

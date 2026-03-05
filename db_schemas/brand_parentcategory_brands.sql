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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.brand_parentcategory_brands
CREATE TABLE IF NOT EXISTS `brand_parentcategory_brands` (
  `brandParentCategoryId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `brandId` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`brandParentCategoryId`,`brandId`),
  UNIQUE KEY `brand_parentcategory_brands_brandId_brandParentCategoryId_unique` (`brandParentCategoryId`,`brandId`),
  UNIQUE KEY `brand_parentcategory_brands_brand_parent_category_id_brand_id` (`brandParentCategoryId`,`brandId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Dumping data for table spsyn8lm_rocklime_dashboard.brand_parentcategory_brands: ~27 rows (approximately)
INSERT INTO `brand_parentcategory_brands` (`brandParentCategoryId`, `brandId`) VALUES
	('158dd2fa-7421-11f0-9e84-52540021303b', 'f84227c5-9852-11f0-ac50-52540021303b'),
	('1a76fdf5-a380-4a62-867c-ca32f6bd7f29', '13847c2c-3c91-4bb2-a130-f94928658237'),
	('7a5e2bd8-8dfe-4511-a098-6ffd13e0a178', '13847c2c-3c91-4bb2-a130-f94928658237'),
	('7b7a5690-1dae-46dd-9de0-601646b66331', 'acbe7061-9b76-47d1-a509-e4b1f982a36f'),
	('94b8daf8-d026-4983-a567-85381c8faded', '70a6bfc1-7bf3-11f0-9e84-52540021303b'),
	('94b8daf8-d026-4983-a567-85381c8faded', '70b2c3f3-7bf3-11f0-9e84-52540021303b'),
	('a733afe9-78ee-11f0-9e84-52540021303b', '1e19b647-1138-11f1-b773-52540021303b'),
	('a733afe9-78ee-11f0-9e84-52540021303b', '39fd411d-7c06-11f0-9e84-52540021303b'),
	('a73fa5fa-78ee-11f0-9e84-52540021303b', '501083c0-7686-11f0-9e84-52540021303b'),
	('a73fa5fa-78ee-11f0-9e84-52540021303b', 'c69121e3-7686-11f0-9e84-52540021303b'),
	('cf02dafa-6640-47dd-a38e-45e79c4a52ae', 'acbe7061-9b76-47d1-a509-e4b1f982a36f'),
	('d18dd89c-90d2-44dd-8ba4-16783d58bd5e', 'acbe7061-9b76-47d1-a509-e4b1f982a36f'),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', '500b10a7-7686-11f0-9e84-52540021303b'),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', '50105657-7686-11f0-9e84-52540021303b'),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', '50106480-7686-11f0-9e84-52540021303b'),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', '50107b22-7686-11f0-9e84-52540021303b'),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', '987bb747-773d-11f0-9e84-52540021303b'),
	('dfe98ae0-3437-4d6b-933d-e51623b7dc34', 'f7c065c3-e2bf-48c9-9c32-8d979402388c'),
	('f7940b5e-8d97-43be-b37b-0fd6b56e431a', '13847c2c-3c91-4bb2-a130-f94928658237'),
	('f7940b5e-8d97-43be-b37b-0fd6b56e431a', '4e3acf32-1e47-4d38-a6bb-417addd52ac0'),
	('f7940b5e-8d97-43be-b37b-0fd6b56e431a', 'acbe7061-9b76-47d1-a509-e4b1f982a36f'),
	('f7940b5e-8d97-43be-b37b-0fd6b56e431a', 'd642a7f4-9bb9-4d91-bcf3-fd63b438b85e'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '500b10a7-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '50105657-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '50106480-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '501073c4-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '50107b22-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '501083c0-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', '987bb747-773d-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', 'c69121e3-7686-11f0-9e84-52540021303b'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', 'dfe98ae0-3437-4d6b-933d-e51623b7dc34'),
	('f7c065c3-e2bf-48c9-9c32-8d979402388c', 'f7c065c3-e2bf-48c9-9c32-8d979402388c'),
	('fcec49c3-3931-4120-841c-50d517b2ab1b', 'acbe7061-9b76-47d1-a509-e4b1f982a36f');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

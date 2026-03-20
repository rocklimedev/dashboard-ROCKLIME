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

-- Dumping structure for table spsyn8lm_rocklime_dashboard.site_maps
CREATE TABLE IF NOT EXISTS `site_maps` (
  `id` char(36) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'e.g., Dhruv Verma Residence, Galaxy Mall Project',
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `siteSizeInBHK` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'e.g., 3BHK, 4BHK+Study, Duplex, Commercial 5000sqft',
  `totalFloors` int(11) NOT NULL DEFAULT '1',
  `floorDetails` json NOT NULL COMMENT 'Array of floors → [{ floor_number: 1, floor_name: ''Ground Floor'', floor_size: ''1400 sqft'', details: ''Lobby + 2 Bathrooms'', rooms: [{ room_id: ''r1'', room_name: ''Master Bathroom'', room_type: ''Bathroom'', room_size: ''100 sqft'', details: ''Shower + Sink'' }] }]',
  `items` json NOT NULL COMMENT 'Full items array (same structure as quotation.products but with floor/room allocation) → [{ productId, name, imageUrl, quantity, price, floor_number, room_id, productType, ... }]',
  `summaries` json DEFAULT NULL COMMENT 'Auto-computed on save, now with perRoom nested under perFloor',
  `quotationId` char(36) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL COMMENT 'Nullable → Optional link to quotation',
  `status` enum('draft','finalized','converted') COLLATE utf8_unicode_ci DEFAULT 'draft',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `site_maps_customer_id` (`customerId`),
  KEY `site_maps_quotation_id` (`quotationId`),
  KEY `site_maps_status` (`status`),
  CONSTRAINT `site_maps_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

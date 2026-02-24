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

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

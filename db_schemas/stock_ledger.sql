/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `stock_ledger` (
  `id` char(36) NOT NULL,
  `productId` char(36) NOT NULL,
  `warehouseId` char(36) NOT NULL,
  `movement` varchar(30) NOT NULL,
  `onHandChange` int(11) NOT NULL DEFAULT '0',
  `reservedChange` int(11) NOT NULL DEFAULT '0',
  `incomingChange` int(11) NOT NULL DEFAULT '0',
  `damagedChange` int(11) NOT NULL DEFAULT '0',
  `onHandAfter` int(11) NOT NULL DEFAULT '0',
  `reservedAfter` int(11) NOT NULL DEFAULT '0',
  `incomingAfter` int(11) NOT NULL DEFAULT '0',
  `damagedAfter` int(11) NOT NULL DEFAULT '0',
  `refType` varchar(30) DEFAULT NULL,
  `refId` varchar(64) DEFAULT NULL,
  `refNo` varchar(64) DEFAULT NULL,
  `userId` char(36) DEFAULT NULL,
  `reason` text,
  `idempotencyKey` varchar(160) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idempotencyKey` (`idempotencyKey`),
  KEY `ix_stock_ledger_product` (`productId`,`createdAt`),
  KEY `ix_stock_ledger_ref` (`refType`,`refId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

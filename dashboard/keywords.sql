-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               9.2.0 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table dashboard.keywords
CREATE TABLE IF NOT EXISTS `keywords` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `keyword` varchar(100) NOT NULL,
  `type` enum('Ceramics','Sanitary') NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`),
  UNIQUE KEY `keyword_2` (`keyword`),
  UNIQUE KEY `keyword_3` (`keyword`),
  UNIQUE KEY `keyword_4` (`keyword`),
  UNIQUE KEY `keyword_5` (`keyword`),
  UNIQUE KEY `keyword_6` (`keyword`),
  UNIQUE KEY `keyword_7` (`keyword`),
  UNIQUE KEY `keyword_8` (`keyword`),
  UNIQUE KEY `keyword_9` (`keyword`),
  UNIQUE KEY `keyword_10` (`keyword`),
  UNIQUE KEY `keyword_11` (`keyword`),
  UNIQUE KEY `keyword_12` (`keyword`),
  UNIQUE KEY `keyword_13` (`keyword`),
  UNIQUE KEY `keyword_14` (`keyword`),
  UNIQUE KEY `keyword_15` (`keyword`),
  UNIQUE KEY `keyword_16` (`keyword`),
  UNIQUE KEY `keyword_17` (`keyword`),
  UNIQUE KEY `keyword_18` (`keyword`),
  UNIQUE KEY `keyword_19` (`keyword`),
  UNIQUE KEY `keyword_20` (`keyword`),
  UNIQUE KEY `keyword_21` (`keyword`),
  UNIQUE KEY `keyword_22` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.keywords: ~23 rows (approximately)
INSERT INTO `keywords` (`id`, `keyword`, `type`, `createdAt`, `updatedAt`) VALUES
	('0ae5be0e-5fb2-465e-81ed-b861fd786d56', 'faucet', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('0d08646f-e165-4f0c-87d0-8de053a1cdf9', 'cover', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('1d0b8789-fcbd-4d5e-9925-2c3d1e2fad9a', 'counter', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('1fcd80a4-4276-4066-8795-e822c0a3ea96', 'bath', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('3bf812ca-9968-4632-8078-91ea3232b543', 'dddd', 'Sanitary', '2025-03-11 05:55:58', '2025-03-11 05:55:58'),
	('3e5e358b-9bdb-4156-a599-611932dbcb8f', 'urinal Floor standing', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('3eff87ac-5e6c-47f2-b1e2-0e900aab8a2b', 'spray', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('4096777b-f0c0-40a5-ae5f-26cc9ce0414f', 'wb wall-hung', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('498707e0-ea9e-4333-b59d-82911d5868ad', 'wc one-piece', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('4a0d4e31-b792-4df0-ac50-958450d02227', 'vessel', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('4f7e78b1-b120-44aa-b0bd-95b5021d6e3a', 'toilet', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('524887ec-58ce-4396-8b01-1286f28e23c5', 'mixer', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('67c023d8-d062-4d9b-91d1-e0da7730a204', 'wc wall-hung', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('74756fcd-5535-46be-be5d-70796123941e', 'Pedistal', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('7b1b47a3-3f59-412c-bd3d-7dab70b8e21b', 'spout', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('8049502e-2fcc-474b-aa56-34b90caf9b13', 'urinal wall-hung', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('847e8ac9-d4b8-46eb-8796-d488ff0cdcc1', 'Semi-Pedestal', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('90c3328e-f4cf-4abc-a9b4-cb001f535f96', 'wc close-coupled', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('9781dc97-3943-44d0-a7fb-a651512a7ed1', 'bidet', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('a483632e-e078-4e93-a0c7-826ff24151cb', 'wc back to wall', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('a81cff0b-52e4-4607-8374-55e76f914761', 'shower', 'Sanitary', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('b89ca00a-c73c-4e8d-9ab8-2be7115a221b', 'basin', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01'),
	('eabb744b-99e8-4963-85fe-c9594f771f00', 'seat', 'Ceramics', '2025-03-04 07:16:01', '2025-03-04 07:16:01');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

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

-- Dumping structure for table dashboard.quotations
CREATE TABLE IF NOT EXISTS `quotations` (
  `quotationId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_title` varchar(255) NOT NULL,
  `quotation_date` date NOT NULL,
  `due_date` date NOT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  `include_gst` tinyint(1) NOT NULL,
  `gst_value` decimal(10,2) DEFAULT NULL,
  `products` json NOT NULL,
  `discountType` enum('percent','fixed') DEFAULT NULL,
  `roundOff` decimal(10,2) DEFAULT NULL,
  `finalAmount` decimal(10,2) NOT NULL,
  `signature_name` varchar(255) DEFAULT NULL,
  `signature_image` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdBy` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`quotationId`),
  KEY `customerId` (`customerId`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `Quotations_createdBy_fk` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_fk_customer` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_10` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_11` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_12` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_13` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_14` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_15` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_16` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_5` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_6` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_8` FOREIGN KEY (`createdBy`) REFERENCES `users` (`userId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotations_ibfk_9` FOREIGN KEY (`customerId`) REFERENCES `customers` (`customerId`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table dashboard.quotations: ~10 rows (approximately)
INSERT INTO `quotations` (`quotationId`, `document_title`, `quotation_date`, `due_date`, `reference_number`, `include_gst`, `gst_value`, `products`, `discountType`, `roundOff`, `finalAmount`, `signature_name`, `signature_image`, `createdAt`, `updatedAt`, `customerId`, `createdBy`) VALUES
	('06c554b0-15a1-49b8-b3b7-912de4fa8dd6', 'TEST 1234455', '2025-03-19', '2025-05-02', '8278978827', 1, 2.50, '[{"qty": 1, "tax": 0, "name": "Grandera Ceiling Shower Arm 142mm", "total": 11510, "images": "[]", "barcode": "bd5838d4-e2ab-449d-85b7-f037bf60cee9", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": "percent", "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "1d2343f6-af57-45be-8155-0ea1ac6d0bc9", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Grandera Ceiling Shower Arm 142mm", "company_code": "26899000", "discountType": "percent", "productGroup": "Shower Accessories", "product_code": "EGRGP90001522", "sellingPrice": "11510.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "9208.00"}, {"qty": 1, "tax": 0, "name": "Euphoria 260 Headshower Set 142mm", "total": 22950, "images": "[]", "barcode": "d8e0a60b-253b-4867-bf7a-5e9d2658d21f", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": "percent", "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "32c60a6d-9543-41fa-bce3-a4290d3569db", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Euphoria 260 Headshower Set 142mm", "company_code": "26460000", "discountType": "percent", "productGroup": "Head Shower", "product_code": "EGRGP00001333", "sellingPrice": "22950.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "18360.00"}, {"qty": 1, "tax": 0, "name": "Brass chromed/ABS 40 cm long", "total": 6200, "images": "[]", "barcode": "3cb6f78c-fdc4-4e69-9cb7-af8d1bc17a23", "brandId": "4e3acf32-1e47-4d38-a6bb-417addd52ac0", "user_id": null, "discount": "percent", "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "049acce1-3390-4452-bc18-1dd2fbff10df", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Brass chromed/ABS 40 cm long", "company_code": "F78108-CHADYBR", "discountType": "percent", "productGroup": "Drain Technology (Traps)", "product_code": "EAS81082130", "sellingPrice": "6200.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "4960.00"}]', 'percent', 2.50, 41679.00, 'Sachin', '', '2025-03-17 04:40:23', '2025-03-17 04:40:23', 'db5daa16-f57d-426b-8093-c81c8d209ac3', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('1b4e7469-23f7-44dc-ab48-8e12f3676faa', 'Test Quotation 6', '2025-05-07', '2025-11-09', 'QTN-009', 1, 18.00, '[{"MRP": 144500, "Brand_Slug": "13847c2c-3c91-4bb2-a130-f94928658237", "Category_Id": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "Vendor_Slug": "V_3", "Company Code": "20593AL0", "Product Code": "EGRGP3AL0009", "Product group": "Basin Mixer - DM", "Product Segment": "Bathroom Fittings", "Product Description": "Three-hole basin mixer deck mounted for stick"}]', 'percent', 50.00, 120000.00, 'John Doe', 'base64_encoded_string', '2025-03-13 06:23:40', '2025-03-13 06:23:40', '09e042f3-b3e4-4889-a21e-71a95af8125e', '6208fc6a-45a3-4563-af1f-a63c294fd3bf'),
	('33ad626e-ef68-4686-b374-1c54d0b694d7', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-12345', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-here"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-here"}]', 'percent', 2.50, 0.00, 'John Do', 'base64string', '2025-03-13 07:45:32', '2025-03-13 07:45:32', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('485922da-8fda-4161-8b61-6466569786aa', 'Test Quotation 2', '2025-03-04', '2025-05-05', 'QTN-002', 1, 18.00, '[{"MRP": 144500, "Brand_Slug": "13847c2c-3c91-4bb2-a130-f94928658237", "Category_Id": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "Vendor_Slug": "V_3", "Company Code": "20593AL0", "Product Code": "EGRGP3AL0009", "Product group": "Basin Mixer - DM", "Product Segment": "Bathroom Fittings", "Product Description": "Three-hole basin mixer deck mounted for stick"}]', 'percent', 50.00, 120000.00, 'John Doe', 'base64_encoded_string', '2025-03-12 05:58:29', '2025-03-12 05:58:29', '09e042f3-b3e4-4889-a21e-71a95af8125e', '6208fc6a-45a3-4563-af1f-a63c294fd3bf'),
	('54988ab8-0aa5-42ef-acb1-357cfe716806', 'New Quotation', '2025-03-13', '2025-04-01', 'REF-12345', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-here"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-here"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:35:11', '2025-03-13 07:35:11', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('76db8d82-b27a-43e6-8297-c30b83803884', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:52:07', '2025-03-13 07:52:07', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('80fec02f-6701-4e1b-a4b6-e0929fd5290f', 'TEST 1234455', '2025-03-19', '2025-05-02', '8278978827', 1, 2.50, '[{"qty": 1, "tax": 0, "name": "Grandera Ceiling Shower Arm 142mm", "total": 11510, "images": "[]", "barcode": "bd5838d4-e2ab-449d-85b7-f037bf60cee9", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": 0, "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "1d2343f6-af57-45be-8155-0ea1ac6d0bc9", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Grandera Ceiling Shower Arm 142mm", "company_code": "26899000", "discountType": "percent", "productGroup": "Shower Accessories", "product_code": "EGRGP90001522", "sellingPrice": "11510.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "9208.00"}, {"qty": 1, "tax": 0, "name": "Euphoria 260 Headshower Set 142mm", "total": 22950, "images": "[]", "barcode": "d8e0a60b-253b-4867-bf7a-5e9d2658d21f", "brandId": "13847c2c-3c91-4bb2-a130-f94928658237", "user_id": null, "discount": 0, "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "32c60a6d-9543-41fa-bce3-a4290d3569db", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Euphoria 260 Headshower Set 142mm", "company_code": "26460000", "discountType": "percent", "productGroup": "Head Shower", "product_code": "EGRGP00001333", "sellingPrice": "22950.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "18360.00"}, {"qty": 1, "tax": 0, "name": "Brass chromed/ABS 40 cm long", "total": 6200, "images": "[]", "barcode": "3cb6f78c-fdc4-4e69-9cb7-af8d1bc17a23", "brandId": "4e3acf32-1e47-4d38-a6bb-417addd52ac0", "user_id": null, "discount": 0, "quantity": 100, "createdAt": "2025-03-01T10:19:10.000Z", "productId": "049acce1-3390-4452-bc18-1dd2fbff10df", "updatedAt": "2025-03-01T10:19:10.000Z", "categoryId": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "isFeatured": false, "description": "Brass chromed/ABS 40 cm long", "company_code": "F78108-CHADYBR", "discountType": "percent", "productGroup": "Drain Technology (Traps)", "product_code": "EAS81082130", "sellingPrice": "6200.00", "alert_quantity": 10, "product_segment": null, "purchasingPrice": "4960.00"}]', 'percent', 2.50, 41679.00, 'Sachin', '', '2025-03-17 04:46:39', '2025-03-17 04:46:39', 'db5daa16-f57d-426b-8093-c81c8d209ac3', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('98e67b0f-02cb-4cc7-a28c-b09fcfe0d20c', 'Test Quotation', '2025-03-04', '2025-04-04', 'QTN-001', 1, 18.00, '[{"MRP": 144500, "Brand_Slug": "13847c2c-3c91-4bb2-a130-f94928658237", "Category_Id": "0e718b1d-a0ab-47a7-bb51-021e522b5596", "Vendor_Slug": "V_3", "Company Code": "20593AL0", "Product Code": "EGRGP3AL0009", "Product group": "Basin Mixer - DM", "Product Segment": "Bathroom Fittings", "Product Description": "Three-hole basin mixer deck mounted for stick"}]', 'percent', 50.00, 120000.00, 'John Doe', 'base64_encoded_string', '2025-03-12 05:49:26', '2025-03-12 05:49:26', '09e042f3-b3e4-4889-a21e-71a95af8125e', '6208fc6a-45a3-4563-af1f-a63c294fd3bf'),
	('b1774b0a-7c15-4083-87c9-f8fc2ba56d1b', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:48:46', '2025-03-13 07:48:46', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('d6237d5e-99db-43c6-bb9c-5addc84de0b9', 'New Quotation 6', '2025-03-13', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-13 07:48:17', '2025-03-13 07:48:17', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c'),
	('e7f5a181-5ca8-4def-9666-f41379136db1', 'New Quotation 6', '2025-03-17', '2025-05-01', 'REF-1234555', 1, 18.00, '[{"tax": 18, "name": "Product A", "price": 500, "total": 0, "discount": 10, "quantity": 2, "productId": "product-uuid-1"}, {"tax": 12, "name": "Product B", "price": 1000, "total": 0, "discount": 5, "quantity": 1, "productId": "product-uuid-2"}]', 'percent', 2.50, 0.00, 'John Doe', 'base64string', '2025-03-17 04:10:24', '2025-03-17 04:10:24', '09e042f3-b3e4-4889-a21e-71a95af8125e', '5d5bd153-8877-4db1-a5cc-2af5c7e55d9c');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

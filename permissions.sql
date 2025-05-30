-- --------------------------------------------------------
-- Host:                         119.18.54.11
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
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


-- Dumping database structure for spsyn8lm_rocklime_dashboard
CREATE DATABASE IF NOT EXISTS `spsyn8lm_rocklime_dashboard` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `spsyn8lm_rocklime_dashboard`;

-- Dumping structure for table spsyn8lm_rocklime_dashboard.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `permissionId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'Human-readable name for the permission',
  `module` varchar(255) NOT NULL,
  `api` enum('view','delete','write','edit','export') NOT NULL,
  `route` varchar(500) NOT NULL COMMENT 'Actual route path like /user/create or /orders/export',
  PRIMARY KEY (`permissionId`),
  UNIQUE KEY `permissions_route_name` (`name`),
  KEY `permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dumping data for table spsyn8lm_rocklime_dashboard.permissions: ~129 rows (approximately)
INSERT INTO `permissions` (`permissionId`, `createdAt`, `updatedAt`, `name`, `module`, `api`, `route`) VALUES
	('00bf152a-9c34-47f5-8f84-ff6b49d1532d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_category_by_id', 'categories', 'view', '/category/:id'),
	('01c83f95-d7ee-4acf-b686-e3b2fad6fed7', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_quotation', 'quotations', 'delete', '/quotations/:id'),
	('031a7971-4aed-4da1-8558-0283676ca4d7', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_cart_of_user', 'cart', 'view', '/cart/:userId'),
	('04a68ab2-cccf-47ec-952f-00014ceb4095', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'draft_order', 'orders', 'write', '/orders/draft'),
	('04e72fe7-bced-4b98-98c7-9d944edb1e1f', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_category', 'categories', 'edit', '/category/:id'),
	('062bb870-f2b3-4835-a438-4aaa03c354c5', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'search_user', 'users', 'view', '/users/search'),
	('0a2b72d3-f030-48cf-ae25-89621957a4a6', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'clone_quotation', 'quotations', '', '/quotations/clone/:id'),
	('0a9488b6-dc66-441d-87e4-3f52b4fe726c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_low_stock_products', 'products', 'view', '/products/low-stock'),
	('0ac936dc-cf2b-4156-ab2c-7186d0e1575e', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'reset-password', 'auth', 'write', '/auth/reset-password'),
	('0b8970e8-2cc1-48af-a3fc-c990f31d54db', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_parent_category_by_id', 'parentcategories', 'view', '/parent-categories/:id'),
	('0d2d8fe2-67da-4883-b725-88dd80e9eb71', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'updateOrderStatus', 'orders', 'edit', '/orders/update-status'),
	('0d41f3e7-f563-4164-924d-9171fb12e8e9', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_customer', 'customers', 'write', '/customers'),
	('105895b2-e291-4dd8-9f41-4a9ed2fc8daa', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_product', 'products', 'edit', '/products/:productId'),
	('11108001-a78d-483d-8c4a-20849583203d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_quotation_by_id', 'quotations', 'view', '/quotations/:id'),
	('135b50c3-4ca7-4c00-ae56-e4e56c64f70a', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'convert_quotation_to_cart', 'cart', 'write', '/cart/convert-to-cart/:quotationId'),
	('15d68530-66ef-456d-871c-700c5268ff9d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_keyword', 'keywords', 'edit', '/keywords/:id'),
	('15dd7f51-c91c-493a-9e02-8153dfa992b4', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_user_by_id', 'users', 'view', '/users/:userId'),
	('169b555a-1c65-4be3-819d-003400a73fcc', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'change_status_to_inactive', 'users', 'edit', '/users/:userId'),
	('16b45602-3e59-46be-af9d-458828b2f16f', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_carts', 'cart', 'view', '/cart/all'),
	('1859a8c8-6b03-4d0f-aafb-c82701870bae', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'remove_stock', 'products', 'edit', '/products/:productId/remove-stock'),
	('18f5ef19-471f-4eef-82b1-93d432dbf4f1', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'getAddressById', 'address', 'view', '/addresses/:addressId'),
	('1af6fc93-d96a-40f4-baa3-6475911fd609', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_cart', 'cart', 'write', '/cart/update'),
	('1f2eb055-9e3c-48be-8a50-93c4f7fb555a', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_role', 'roles', 'delete', '/roles/:roleId'),
	('20a87e6b-cbc1-46f3-91d5-3d15031dec28', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_quotation', 'quotations', 'edit', '/quotations/:id'),
	('22fa43af-f5c7-4c84-aec6-425cb68e4308', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'edit_permission', 'permissions', 'edit', '/permissions/:permissionId'),
	('25902701-3af7-4d3e-b5b7-377fa6085a9c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'add_stock', 'products', 'edit', '/products/:productId/add-stock'),
	('25a5fa80-5247-40e7-9aef-e347ccc58e2d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_company', 'companies', 'edit', '/companies/:id'),
	('2b0facd9-f500-4578-82ca-af6ddf554b25', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'createAddress', 'address', 'write', '/addresses'),
	('2c84d6ae-3b0e-4f73-8484-a860b73bd087', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'recent_orders', 'orders', 'view', '/orders/recent'),
	('2ce16d01-a51a-4ff4-8ecc-96699dc5214c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'refresh-token', 'auth', 'write', '/auth/refresh-token'),
	('2dab3781-fda0-4f51-8bf4-4c54352c781d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'report_user', 'users', '', '/users/report/:userId'),
	('33a75735-ac09-47f7-82f3-5241eedba96c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_brand', 'brands', 'delete', '/brands/:id'),
	('3a80980a-283e-4cad-8010-173828a3874d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'add_team_members', 'teams', 'write', '/teams/add'),
	('3cc11780-bc0a-450c-acee-1090005a4924', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_vendor', 'vendors', 'delete', '/vendors/:id'),
	('3fc2b09e-73ac-4b17-bc86-0ea8a156399e', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_user', 'users', 'write', '/users/add'),
	('4be2cc37-522e-44fc-b51b-da5dfe7d9c98', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_brand', 'brands', 'write', '/brands/add'),
	('4c65d13a-c9ab-415b-9455-957e68eb714b', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_company_by_id', 'companies', 'view', '/companies/:id'),
	('4d67838b-c360-4bee-9bf9-9e5e557a2558', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_role_by_id', 'roles', 'view', '/roles/:roleId'),
	('4f7d27fd-430c-4a39-bb11-e0b561b05ea9', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_role_permissions', 'roles', 'view', '/roles/:roleId'),
	('54384460-fe5c-42d8-86c8-979592bd4e99', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_filtered_orders', 'orders', 'view', '/orders/filter'),
	('5776a6d2-d896-402f-a4d2-912c26b9a7d0', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_teams', 'teams', 'view', '/teams/all'),
	('5e5e7ef2-a4e8-4a1e-85d8-2b6fbd3cc286', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_parent_category', 'parentcategories', 'delete', '/parent-categories/:id'),
	('62967a76-1b62-4959-be10-15cafb27a870', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_cart', 'cart', 'view', '/cart/:cartId'),
	('6452bad8-cba4-47b4-8a24-761436ba22e9', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_signature', 'signatures', 'write', '/signatures'),
	('649a97ae-f000-4c2a-9fbe-e3beca6e1546', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_role_permissions', 'roles', 'edit', '/roles/:roleId'),
	('67933024-6640-4c31-84a1-3137087895b6', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_signature', 'signatures', 'delete', '/signatures/:id'),
	('67f87415-a053-428c-a76d-0a61fdfca69f', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_vendor', 'vendors', 'edit', '/vendors/:id'),
	('6abbe334-d795-4cee-8273-e2e1f831ac88', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_orders', 'orders', 'view', '/orders/all'),
	('6c42f803-0be5-4986-877b-c6ea0e549a2c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_parent_categories', 'parentcategories', 'view', '/parent-categories'),
	('6c850055-32b9-4b19-b742-094742074235', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'add_to_cart', 'cart', 'write', '/cart/add'),
	('6f0d619a-b8b8-4175-ad7d-912e6295a35f', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'login', 'auth', 'write', '/auth/login'),
	('711bfeab-5e8f-4b97-8ea0-d9712e3be55f', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'export_quotation', 'quotations', 'export', '/quotations/:id'),
	('774b692a-1236-4bb3-98bd-9269023f43a1', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_vendors', 'vendors', 'view', '/vendors'),
	('78a7175a-7ba2-4b3f-8d83-fd54403b5893', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_team_member', 'teams', 'edit', '/teams/:memberId/update'),
	('79b67ad0-e8c8-4f96-9ed1-087fbcf655da', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_order', 'orders', 'delete', '/orders/delete/:orderId'),
	('7a5a3495-6a97-4d36-b434-8f67fe27587d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_product', 'products', 'delete', '/products/:productId'),
	('7ce7e75e-630b-4b6a-874d-de38032326a3', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'deleteAddress', 'address', 'delete', '/addresses/:addressId'),
	('7db6eb65-c6c2-4d90-b761-6612cc78fb16', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_team_members', 'teams', 'view', '/teams/:teamId/members'),
	('818320b4-2aa2-42fb-8b63-4e25dac64aaa', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'assign_role', 'roles', 'write', '/roles/assign-role'),
	('85dc189f-c636-4857-835a-066dc3a2f507', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_recent_role_to_give', 'roles', 'view', '/roles/recent'),
	('87a3b11a-0e10-4af4-ae8e-6f802637175a', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_customer_by_id', 'customers', 'view', '/customers/:id'),
	('8a0afbcf-fe74-4799-b7c9-50bef779a3d6', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_permission', 'permissions', 'delete', '/permissions/:permissionId'),
	('8ca1ef6b-7bc7-4c0f-bcbb-e8e39a0b4f63', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'edit_brand', 'brands', 'edit', '/brands/:id'),
	('8e822f02-daa6-4fa7-93df-8b817d99647b', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_keywords', 'keywords', 'view', '/keywords'),
	('8e8f6023-c8db-426b-bf89-490786a8964a', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_product_by_id', 'products', 'view', '/products/:productId'),
	('90b80b92-fcbe-4bfc-8463-84f58d7fad89', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_category', 'categories', 'delete', '/category/:id'),
	('91183519-8ffb-4029-bfc2-9069330c84c3', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_invoice', 'invoices', 'delete', '/invoices/:id'),
	('938e01af-3d1c-4446-8608-1090deeeec9a', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_invoice_by_id', 'invoices', 'view', '/invoices/:id'),
	('93de8cbe-4029-4911-8e55-5a579d002cae', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_role_permissions', 'role_permissions', 'view', '/role-permissions/'),
	('94170d90-a712-4b0a-99fa-4d0528f0d23a', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'reuce_product_quantity', 'cart', '', '/cart/reduce'),
	('984a7c74-07ca-4a4d-959a-f2f51871061d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_rolepermission_by_roleId_and_permissionId', 'rolepermissions', 'view', '/role-permissions/:roleId/permission/:permissionId'),
	('9891613f-b8d2-406b-a1ec-d1f1a4b3b164', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_order_by_id', 'orders', 'edit', '/orders/:orderId'),
	('9eed37ed-5d7f-49c2-aeb3-a6e12ab3df84', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_invoices', 'invoices', 'view', '/invoices'),
	('a157bdba-b4a4-40e0-9c4b-7f2326e5397b', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_profile', 'users', 'edit', '/users'),
	('a74dd858-95c2-4cc8-bc36-ececf429c731', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'clear_cart', 'cart', '', '/cart/clear'),
	('a7557670-6464-4866-9b29-6fd2ab700a01', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'view_brand', 'brands', 'view', '/brands'),
	('a8613d91-3dcb-4032-b50e-1a5e42940d59', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_child_companies', 'companies', 'view', '/companies/parent/:parentId'),
	('a89eb2f3-1836-4776-bcbb-5a24e0d31812', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_permission', 'permissions', 'write', '/permissions'),
	('a98e8b97-7d74-44f7-b31c-b077b5dddb2c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_signatures', 'signatures', 'view', '/signatures'),
	('ad70092a-1223-450a-b0bf-7eff035df1ec', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_parent_category', 'parentcategories', 'write', '/parent-categories'),
	('b4a0b068-75ca-4a6c-8922-f7052efaca6d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_permission', 'permissions', 'view', '/permissions'),
	('b52e0b52-0664-4263-a4c4-1526f093e189', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_keyword', 'keywords', 'write', '/keywords'),
	('b8dc18ef-7351-4add-a297-ed16a262163d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_signature_by_id', 'signatures', 'view', '/signatures/:id'),
	('b99186b4-c921-4bbc-b38c-18fb6e2be471', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'remove_from_cart', 'cart', 'write', '/cart/remove'),
	('bae5c7fb-1e32-4c38-b362-31280feb8c59', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'getAllAddresses', 'address', 'view', '/addresses'),
	('bc08b4ea-2605-4856-be9a-3b268ee95465', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_keyword', 'keywords', 'delete', '/keywords/:id'),
	('c5f796a9-ac6c-44c7-8a70-c0f1cd865628', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_parent_category', 'parentcategories', 'edit', '/parent-categories/:id'),
	('c6af2a17-1a16-4956-a981-b96f87bed6ed', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'add_product_to_cart', 'cart', 'write', '/cart/add-to-cart'),
	('c6f00be5-34b2-4efd-89b1-4663f0c055b7', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'remove_permission_from_role', 'rolepermissions', 'write', '/role-permissions/remove-permission'),
	('c73882b8-258a-4bb4-abf3-509d1dd71dc5', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_total_products_of_this_brand', 'brands', 'view', '/brands/total-products'),
	('c7891f37-ba67-41f8-b308-6ddd7842175e', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_vendor_by_id', 'vendors', 'view', '/vendors/:id'),
	('c814ef18-3bc0-4cc4-9e3c-9b89719bdd12', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'assign_permission_to_role', 'permissions', 'write', '/permissions/assign-permission'),
	('c8723a87-092f-43f3-b6a3-b9f5756982a4', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_vendor', 'vendors', 'write', '/vendors'),
	('c94448f1-d451-413c-97bc-59e99a1403a1', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_team', 'teams', 'delete', '/teams/:teamId/delete'),
	('c97f1fc7-694d-424d-a753-3c31506ad46e', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_companies', 'companies', 'view', '/companies'),
	('ca06daa9-2fbd-432d-9e7a-fbee10fd76a7', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_invoice', 'invoices', 'write', '/invoices'),
	('cb56b568-7dbf-4fee-8224-c7b02975d25c', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_quotations', 'quotations', 'view', '/quotations'),
	('cdd2ef5a-d1ec-4d39-9cfe-ec4281e6a0db', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_company', 'companies', 'write', '/companies'),
	('ce964604-039d-4e8d-80f5-f904bd180b7d', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_category', 'categories', 'write', '/category'),
	('cfa87fbf-c61e-4fc0-86b9-42eaee2412ff', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_company', 'companies', 'delete', '/companies/:id'),
	('d2510e8e-f81b-4f4f-aa16-54762f7175a1', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_roles', 'roles', 'view', '/roles'),
	('d4e69728-c7c7-49e4-a08b-83030db55098', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_role_permissions_by_roleId', 'rolepermissions', 'view', '/role-permissions/:roleId/permissions'),
	('d63333e0-2b6b-4c22-8bd3-b390486a2802', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_users', 'users', 'view', '/users'),
	('d7001c40-4b3d-41de-a70a-95e487bff9bc', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_quotation', 'quotations', 'write', '/quotations/add'),
	('d76abdbb-b20c-46cb-8011-6734cb19b416', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_user', 'users', 'edit', '/users/:userId'),
	('d77c8147-a597-43c9-b87f-f376a61ba15f', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_profile', 'users', 'view', '/users/me'),
	('d8496a77-a0a8-41ae-9d4a-95299b345ae9', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'search_products', 'products', 'view', '/products/search'),
	('dc8197c2-1ff9-494c-9d59-e0d803d9aaf2', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_categories', 'categories', 'view', '/category/all'),
	('dc925b6d-90b5-4fec-9e12-7a29e7a2c3e6', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_permission', 'permissions', 'view', '/permissions/:permissionId'),
	('dcd345ae-4f1b-415d-a259-b6c3443ac5b0', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'assign_permissions_to_role', 'roles', 'edit', '/roles/:roleId/permissions'),
	('de42852a-ff6d-4b36-8f0b-ae4e3125b3f9', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_invoice', 'invoices', 'edit', '/invoices/:id'),
	('e043531f-25c7-4608-b6f9-6e1b8c2c04d5', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_order_details', 'orders', 'view', '/orders/:id'),
	('e4c0a89e-378e-4bee-829e-24f6a72286d6', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_team', 'teams', 'edit', '/teams/:teamId/update'),
	('ed09f4ae-568b-490d-9e6d-bddc921d66be', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_user', 'users', 'delete', '/users/:userId'),
	('ed4cf21e-af86-4763-8268-9e95f63ccf1b', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_history_by_product_id', 'products', 'view', '/products/:productId/history'),
	('ee9654bc-b528-4d44-8a2e-d3673aabbd21', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_role', 'roles', 'write', '/roles'),
	('ef8a2d27-c338-4510-a39f-e050cc6e8cff', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_keyword_by_id', 'keywords', 'view', '/keywords/:id'),
	('ef95f2e3-34ca-4c43-8edb-5161e8103423', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'delete_customer', 'customers', 'delete', '/customers/:id'),
	('efa256c8-590a-45c3-9b87-9ef0e056d7d8', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_product', 'products', 'write', '/products'),
	('f0d0b505-7d7d-472c-b98a-9552e2888e78', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'updateAddress', 'address', 'edit', '/addresses/:addressId'),
	('f2ba7d4e-43d0-4f48-9b8f-e3b957ef9d28', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'register', 'auth', 'write', '/auth/register'),
	('f496c1e6-7c2a-4e68-9a8c-80e6ff8275d2', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_invoices_by_customer_id', 'customers', 'view', '/customers/:id/invoices'),
	('f6b60f23-91c3-4fae-8cf8-0d6369b812fd', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'remove_permission', 'permissions', 'write', '/permissions/remove-permission'),
	('fa0cbb9a-ede5-49a2-afdb-61408f5be766', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_customers', 'customers', 'view', '/customers'),
	('faff502e-391d-4f0e-8b2f-3f94106a1cec', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'logout', 'auth', 'write', '/auth/logout'),
	('fc491dbd-da77-4dfd-90ec-cb5640330774', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_order', 'orders', 'write', '/orders/create'),
	('fcbd6b59-6454-4b31-acf0-a9145d5ec196', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'update_customer', 'customers', 'edit', '/customers/:id'),
	('fdfeb3ec-c123-4a8a-a3e6-0fd9c21c99d6', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'create_team', 'teams', 'write', '/teams/create'),
	('feb1344d-c8e1-406a-86c0-69cfc2b87469', '2025-04-16 11:22:51', '2025-04-16 11:22:51', 'get_all_products', 'products', 'view', '/products');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

SELECT * FROM permissions;
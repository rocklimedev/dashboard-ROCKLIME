-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 18, 2025 at 10:23 AM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `spsyn8lm_sarvessain`
--

-- --------------------------------------------------------

--
-- Table structure for table `appreciations`
--

CREATE TABLE `appreciations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `award_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `date` datetime NOT NULL,
  `price_amount` double DEFAULT NULL,
  `price_given` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendances`
--

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date` date DEFAULT NULL,
  `is_holiday` tinyint(1) NOT NULL DEFAULT '0',
  `is_leave` tinyint(1) NOT NULL DEFAULT '0',
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `leave_id` bigint(20) UNSIGNED DEFAULT NULL,
  `leave_type_id` bigint(20) UNSIGNED DEFAULT NULL,
  `holiday_id` bigint(20) UNSIGNED DEFAULT NULL,
  `clock_in_date_time` datetime DEFAULT NULL,
  `clock_out_date_time` datetime DEFAULT NULL,
  `clock_in_ip_address` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_duration` int(11) DEFAULT NULL,
  `clock_out_ip_address` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clock_in_time` time DEFAULT NULL,
  `clock_out_time` time DEFAULT NULL,
  `office_clock_in_time` time DEFAULT NULL,
  `office_clock_out_time` time DEFAULT NULL,
  `is_half_day` tinyint(1) NOT NULL DEFAULT '0',
  `is_late` tinyint(1) NOT NULL DEFAULT '0',
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'present',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `awards`
--

CREATE TABLE `awards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `award_price` double DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `basic_salaries`
--

CREATE TABLE `basic_salaries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `basic_salary` double DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `company_id`, `name`, `slug`, `image`, `created_at`, `updated_at`) VALUES
(1, 1, 'American Standard', 'american-standard-3rket5sxa', NULL, '2024-07-20 02:14:18', '2024-07-20 02:14:18'),
(2, 1, 'Grohe', 'grohe-zz16labw', NULL, '2024-07-20 02:14:54', '2024-07-20 02:14:54'),
(3, 1, 'JK', 'jk-vr27h5hs', NULL, '2024-07-20 02:15:05', '2024-07-20 02:15:05'),
(4, 1, 'kerakoll', 'kerakoll-gp8sarwe', NULL, '2024-07-20 02:15:45', '2024-07-20 02:15:45');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `company_id`, `name`, `slug`, `image`, `parent_id`, `created_at`, `updated_at`) VALUES
(1, 1, 'Bath Fitting', 'bath-fitting-j2fjvsil', NULL, NULL, '2024-07-20 02:17:20', '2024-07-20 02:17:20'),
(2, 1, 'Sanitary', 'sanitary-9ztckxxg', NULL, NULL, '2024-07-20 02:18:45', '2024-07-20 02:18:45'),
(3, 1, 'Tiles', 'tiles-651pm8ml', NULL, NULL, '2024-07-20 02:18:55', '2024-07-20 02:18:55'),
(4, 1, 'Adhesive', 'adhesive-iosknvt', NULL, NULL, '2024-07-20 02:19:49', '2024-07-20 02:19:49'),
(5, 1, 'Indian Marble', 'indian-marble-e1eb9ero', NULL, NULL, '2024-07-20 02:20:04', '2024-07-20 02:20:04'),
(6, 1, 'Indian Granite', 'indian-granite-0hlk7f8s', NULL, NULL, '2024-07-20 02:21:01', '2024-07-20 02:21:01');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `light_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dark_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `small_dark_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `small_light_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `app_layout` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sidebar',
  `rtl` tinyint(1) NOT NULL DEFAULT '0',
  `mysqldump_command` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '/usr/bin/mysqldump',
  `shortcut_menus` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'top_bottom',
  `currency_id` bigint(20) UNSIGNED DEFAULT NULL,
  `lang_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `left_sidebar_theme` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dark',
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#1890ff',
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DD-MM-YYYY',
  `time_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'hh:mm a',
  `auto_detect_timezone` tinyint(1) NOT NULL DEFAULT '1',
  `timezone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Kolkata',
  `session_driver` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'file',
  `app_debug` tinyint(1) NOT NULL DEFAULT '0',
  `update_app_notification` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `login_image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_brand` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_last_four` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `subscription_plan_id` bigint(20) UNSIGNED DEFAULT NULL,
  `package_type` enum('monthly','annual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monthly',
  `licence_expire_on` date DEFAULT NULL,
  `is_global` tinyint(1) NOT NULL DEFAULT '0',
  `admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `total_users` int(11) NOT NULL DEFAULT '1',
  `email_verification_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `white_label_completed` tinyint(1) NOT NULL DEFAULT '0',
  `clock_in_time` time DEFAULT '09:30:00',
  `clock_out_time` time DEFAULT '18:00:00',
  `leave_start_month` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '01',
  `late_mark_after` int(11) DEFAULT NULL,
  `early_clock_in_time` int(11) DEFAULT NULL,
  `allow_clock_out_till` int(11) DEFAULT NULL,
  `self_clocking` tinyint(1) NOT NULL DEFAULT '1',
  `allowed_ip_address` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `short_name`, `email`, `phone`, `website`, `light_logo`, `dark_logo`, `small_dark_logo`, `small_light_logo`, `address`, `app_layout`, `rtl`, `mysqldump_command`, `shortcut_menus`, `currency_id`, `lang_id`, `warehouse_id`, `left_sidebar_theme`, `primary_color`, `date_format`, `time_format`, `auto_detect_timezone`, `timezone`, `session_driver`, `app_debug`, `update_app_notification`, `created_at`, `updated_at`, `login_image`, `stripe_id`, `card_brand`, `card_last_four`, `trial_ends_at`, `subscription_plan_id`, `package_type`, `licence_expire_on`, `is_global`, `admin_id`, `status`, `total_users`, `email_verification_code`, `verified`, `white_label_completed`, `clock_in_time`, `clock_out_time`, `leave_start_month`, `late_mark_after`, `early_clock_in_time`, `allow_clock_out_till`, `self_clocking`, `allowed_ip_address`) VALUES
(1, 'EMBARK ENTERPRISES', 'EMBARK ENTERPRISES', 'AJAYCHHABRA@OUTLOOK.COM', '+919999500699', NULL, NULL, NULL, NULL, NULL, '7 street, city, state, 762782', 'sidebar', 0, '/usr/bin/mysqldump', 'top_bottom', 1, 1, 1, 'dark', '#1890ff', 'DD-MM-YYYY', 'hh:mm A', 1, 'Asia/Kolkata', 'file', 0, 1, NULL, '2024-06-25 03:57:13', NULL, NULL, NULL, NULL, NULL, NULL, 'monthly', NULL, 0, 1, 'active', 1, NULL, 0, 0, '09:30:00', '18:00:00', '01', NULL, NULL, NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `company_id`, `name`, `code`, `symbol`, `position`, `is_deletable`, `created_at`, `updated_at`) VALUES
(1, 1, 'INDIAN RUPEE', 'INR', '₹', 'front', 1, '2024-06-25 03:52:42', '2024-06-25 03:52:42');

-- --------------------------------------------------------

--
-- Table structure for table `custom_fields`
--

CREATE TABLE `custom_fields` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `active` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `bill` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expense_category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` double(8,2) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `front_product_cards`
--

CREATE TABLE `front_product_cards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `products` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `front_website_settings`
--

CREATE TABLE `front_website_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `featured_categories` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `featured_categories_title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'Featured Categories',
  `featured_categories_subtitle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `featured_products` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `featured_products_title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'Featured Products',
  `featured_products_subtitle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `features_lists` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `facebook_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `twitter_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `instagram_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `linkedin_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `youtube_url` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `pages_widget` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_info_widget` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `links_widget` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `footer_company_description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Stockify have many propular products wiht high discount and special offers.',
  `footer_copyright_text` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Copyright 2021 @ Stockify, All rights reserved.',
  `top_banners` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bottom_banners_1` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bottom_banners_2` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `bottom_banners_3` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `front_website_settings`
--

INSERT INTO `front_website_settings` (`id`, `company_id`, `warehouse_id`, `featured_categories`, `featured_categories_title`, `featured_categories_subtitle`, `featured_products`, `featured_products_title`, `featured_products_subtitle`, `features_lists`, `facebook_url`, `twitter_url`, `instagram_url`, `linkedin_url`, `youtube_url`, `pages_widget`, `contact_info_widget`, `links_widget`, `footer_company_description`, `footer_copyright_text`, `top_banners`, `bottom_banners_1`, `bottom_banners_2`, `bottom_banners_3`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '[3]', 'Featured Categories', NULL, '[6,22,16]', 'Featured Products', NULL, '[]', NULL, NULL, NULL, NULL, NULL, '[]', '[]', '[]', 'Bhera Enclave have many propular products wiht high discount and special offers.', 'Copyright 2024 @ Bhera Enclave, All rights reserved.', '[]', '[\"banners_jjoseskvp01vykuo7ont.jfif\"]', '[]', '[]', '2024-06-25 03:49:59', '2024-08-29 01:04:16'),
(2, 1, 1, '[]', 'Featured Categories', '', '[]', 'Featured Products', '', '[]', '', '', '', '', '', '[]', '[]', '[]', 'Stockify have many propular products wiht high discount and special offers.', 'Copyright 2021 @ Stockify, All rights reserved.', '[]', '[]', '[]', '[]', '2024-06-25 03:49:59', '2024-06-25 03:49:59');

-- --------------------------------------------------------

--
-- Table structure for table `holidays`
--

CREATE TABLE `holidays` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `date` date NOT NULL,
  `is_weekend` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `increments_promotions`
--

CREATE TABLE `increments_promotions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'promotion',
  `date` date NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `net_salary` int(11) DEFAULT NULL,
  `promoted_designation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `current_designation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `langs`
--

CREATE TABLE `langs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `langs`
--

INSERT INTO `langs` (`id`, `image`, `name`, `key`, `enabled`, `created_at`, `updated_at`) VALUES
(1, NULL, 'English', 'en', 1, '2024-06-25 01:20:35', '2024-06-25 01:20:35');

-- --------------------------------------------------------

--
-- Table structure for table `leaves`
--

CREATE TABLE `leaves` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `leave_type_id` bigint(20) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `total_days` int(11) NOT NULL DEFAULT '0',
  `is_half_day` tinyint(1) NOT NULL DEFAULT '0',
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `total_leaves` int(11) NOT NULL,
  `max_leaves_per_month` int(11) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_08_19_000000_create_failed_jobs_table', 1),
(2, '2021_01_02_193004_create_langs_table', 1),
(3, '2021_01_02_193005_create_translations_table', 1),
(4, '2021_02_01_040700_create_payment_modes_table', 1),
(5, '2021_03_01_040700_create_currencies_table', 1),
(6, '2021_03_02_130932_create_warehouses_table', 1),
(7, '2021_03_03_114417_create_companies_table', 1),
(8, '2021_04_04_000000_create_users_table', 1),
(9, '2021_04_05_190756_entrust_setup_tables', 1),
(10, '2021_05_06_151454_create_brands_table', 1),
(11, '2021_05_06_162224_create_categories_table', 1),
(12, '2021_05_07_033806_create_taxes_table', 1),
(13, '2021_05_07_033823_create_units_table', 1),
(14, '2021_05_08_052842_create_expense_categories_table', 1),
(15, '2021_05_08_052858_create_expenses_table', 1),
(16, '2021_05_08_144116_custom_fields_table', 1),
(17, '2021_05_09_153334_create_products_table', 1),
(18, '2021_05_13_072501_create_orders_table', 1),
(19, '2021_05_13_072518_create_order_items_table', 1),
(20, '2021_05_23_060918_create_payments_table', 1),
(21, '2021_05_23_060919_create_order_payments_table', 1),
(22, '2021_05_28_120405_create_warehouse_stocks_table', 1),
(23, '2021_10_10_100006_create_stock_history_table', 1),
(24, '2022_01_10_115820_create_stock_adjustments_table', 1),
(25, '2022_02_01_094402_create_settings_table', 1),
(26, '2022_02_24_075933_create_notifications_table', 1),
(27, '2022_02_24_122754_create_jobs_table', 1),
(28, '2022_03_07_110707_create_warehouse_history_table', 1),
(29, '2022_04_11_105713_add_login_image_column_in_companies_table', 1),
(30, '2022_04_14_141740_create_order_shipping_address_table', 1),
(31, '2022_04_15_141741_create_user_address_table', 1),
(32, '2022_04_16_054851_create_front_product_cards_table', 1),
(33, '2022_04_17_092949_create_front_website_settings_table', 1),
(34, '2022_04_30_044824_add_rtl_in_companies_warehouses_table', 1),
(35, '2022_05_05_044824_add_setting_records_in_settings_table', 1),
(36, '2022_05_22_004926_add_from_warehouse_id_column_in_orders_table', 1),
(37, '2022_06_24_094848_add_staff_user_id_in_payments_warehouse_history_table', 1),
(38, '2022_10_06_152352_create_company_id_columns_in_all_tables', 1),
(39, '2022_11_22_130234_add_tax_number_in_users_table', 1),
(40, '2022_12_09_065955_add_created_by_column_in_users_table', 1),
(41, '2022_12_19_160559_add_white_label_complete_column_in_companies_table', 1),
(42, '2022_12_21_233823_add_mrp_column_in_order_items_table', 1),
(43, '2023_02_10_084305_create_user_warehouse_table', 1),
(44, '2023_06_06_042524_change_date_to_datetime_in_expenses_and_payments_table', 1),
(45, '2023_06_16_050954_add_tax_type_coloumn_in_taxes_table', 1),
(46, '2023_06_23_081313_create_order_item_taxes_table', 1),
(47, '2023_06_23_091909_create_variations_table', 1),
(48, '2023_10_10_052101_add_barcode_type_in_warehouses_table', 1),
(49, '2024_04_21_143907_add_reset_password_token_in_users_table', 1),
(50, '2024_04_29_042332_create_holidays_table', 1),
(51, '2024_04_29_045301_create_pre_payments_table', 1),
(52, '2024_04_29_045302_create_basic_salaries_table', 1),
(53, '2024_04_29_072410_create_shifts_table', 1),
(54, '2024_04_29_082443_create_departments_table', 1),
(55, '2024_04_29_082524_create_designations_table', 1),
(56, '2024_04_29_083810_create_leave_types_table', 1),
(57, '2024_04_29_092911_create_payrolls_table', 1),
(58, '2024_04_29_093915_add_hrm_columns_in_users_table', 1),
(59, '2024_04_29_093915_add_leave_per_month_columns_in_companies_table', 1),
(60, '2024_04_29_094204_create_payroll_components_table', 1),
(61, '2024_04_29_095300_create_leaves_table', 1),
(62, '2024_04_29_095789_create_attendances_table', 1),
(63, '2024_04_29_110627_create_awards_table', 1),
(64, '2024_04_29_111142_create_increments_promotions_table', 1),
(65, '2024_04_29_120627_create_appreciations_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint(20) UNSIGNED NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `notifiable_type`, `notifiable_id`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
('3f16da17-fda1-4c76-98fd-6cbbdc3a2fce', 'App\\Notifications\\MainNotificaiton', 'App\\Models\\Warehouse', 1, '{\"send_for\":\"purchases_create\",\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"mail\":{\"setting\":{\"is_global\":0,\"company_id\":1,\"setting_type\":\"email\",\"name\":\"SMTP\",\"name_key\":\"smtp\",\"credentials\":{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"},\"other_data\":null,\"status\":0,\"verified\":0,\"xid\":\"7ZWDkbpO\"},\"isAbleToSend\":false,\"content\":\"\",\"title\":\"\"},\"data\":{\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"warehouse\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"order\":{\"invoice_number\":\"1229082024\",\"order_date\":\"2024-08-29T06:48:35+00:00\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to Noida jurisdiction only\",\"notes\":null,\"order_status\":\"ordered\",\"tax_rate\":5,\"tax_amount\":366.98000000000001818989403545856475830078125,\"discount\":0,\"shipping\":250,\"subtotal\":7339.5,\"total\":7956.47999999999956344254314899444580078125,\"total_items\":1,\"unique_id\":\"6XfMhtYTndL8GmtYtkr8\",\"order_type\":\"purchases\",\"company_id\":1,\"updated_at\":\"2024-08-29T06:53:34+00:00\",\"created_at\":\"2024-08-29T06:53:34+00:00\",\"total_quantity\":10,\"due_amount\":7339.5,\"is_deletable\":1,\"xid\":\"yMWXPWGQ\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_from_warehouse_id\":null,\"x_user_id\":\"M6q8vWzR\",\"x_tax_id\":\"AdWNDqgV\",\"x_staff_user_id\":\"AdWNDqgV\",\"x_cancelled_by\":null,\"document_url\":\"https:\\/\\/sarvessa.in\\/images\\/order.png\",\"items\":[{\"quantity\":10,\"mrp\":null,\"unit_price\":699,\"single_unit_price\":699,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":0,\"total_tax\":349.5,\"total_discount\":0,\"subtotal\":7339.5,\"created_at\":\"2024-08-29T06:53:34+00:00\",\"updated_at\":\"2024-08-29T06:53:34+00:00\",\"xid\":\"3nqdjW2Z\",\"x_order_id\":\"yMWXPWGQ\",\"x_user_id\":\"M6q8vWzR\",\"x_product_id\":\"xVbpGq1Q\",\"x_unit_id\":\"dJb01WB6\",\"x_tax_id\":\"AdWNDqgV\"}]},\"staff_member\":{\"is_superadmin\":0,\"lang_id\":1,\"user_type\":\"staff_members\",\"is_walkin_customer\":0,\"login_enabled\":1,\"name\":\"Admin\",\"email\":\"admin@example.com\",\"phone\":null,\"profile_image\":null,\"address\":null,\"shipping_address\":null,\"email_verification_code\":null,\"status\":\"enabled\",\"reset_code\":null,\"timezone\":\"Asia\\/Kolkata\",\"date_format\":\"d-m-Y\",\"date_picker_format\":\"dd-mm-yyyy\",\"time_format\":\"h:i a\",\"tax_number\":null,\"created_by\":null,\"reset_password_token\":null,\"created_at\":null,\"updated_at\":\"2024-06-25T09:27:13+00:00\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_role_id\":\"AdWNDqgV\",\"profile_image_url\":\"https:\\/\\/sarvessa.in\\/images\\/user.png\",\"x_department_id\":null,\"x_designation_id\":null,\"x_shift_id\":null}}}', NULL, '2024-08-29 01:23:35', '2024-08-29 01:23:35'),
('524c76d3-df0c-4656-bb6f-a6a22af5c391', 'App\\Notifications\\MainNotificaiton', 'App\\Models\\Warehouse', 1, '{\"send_for\":\"purchases_create\",\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"mail\":{\"setting\":{\"is_global\":0,\"company_id\":1,\"setting_type\":\"email\",\"name\":\"SMTP\",\"name_key\":\"smtp\",\"credentials\":{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"},\"other_data\":null,\"status\":0,\"verified\":0,\"xid\":\"7ZWDkbpO\"},\"isAbleToSend\":false,\"content\":\"\",\"title\":\"\"},\"data\":{\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"warehouse\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"order\":{\"invoice_number\":\"129082024\",\"order_date\":\"2024-08-29T06:48:35+00:00\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to Noida jurisdiction only\",\"notes\":null,\"order_status\":\"ordered\",\"tax_rate\":5,\"tax_amount\":366.98000000000001818989403545856475830078125,\"discount\":0,\"shipping\":250,\"subtotal\":7339.5,\"total\":7956.47999999999956344254314899444580078125,\"total_items\":1,\"unique_id\":\"xWawKvO9MssEtzJpKUqk\",\"order_type\":\"purchases\",\"company_id\":1,\"updated_at\":\"2024-08-29T06:53:26+00:00\",\"created_at\":\"2024-08-29T06:53:25+00:00\",\"total_quantity\":10,\"due_amount\":7339.5,\"is_deletable\":1,\"xid\":\"dJb01WB6\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_from_warehouse_id\":null,\"x_user_id\":\"M6q8vWzR\",\"x_tax_id\":\"AdWNDqgV\",\"x_staff_user_id\":\"AdWNDqgV\",\"x_cancelled_by\":null,\"document_url\":\"https:\\/\\/sarvessa.in\\/images\\/order.png\",\"items\":[{\"quantity\":10,\"mrp\":null,\"unit_price\":699,\"single_unit_price\":699,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":0,\"total_tax\":349.5,\"total_discount\":0,\"subtotal\":7339.5,\"created_at\":\"2024-08-29T06:53:26+00:00\",\"updated_at\":\"2024-08-29T06:53:26+00:00\",\"xid\":\"2krPNbR7\",\"x_order_id\":\"dJb01WB6\",\"x_user_id\":\"M6q8vWzR\",\"x_product_id\":\"xVbpGq1Q\",\"x_unit_id\":\"dJb01WB6\",\"x_tax_id\":\"AdWNDqgV\"}]},\"staff_member\":{\"is_superadmin\":0,\"lang_id\":1,\"user_type\":\"staff_members\",\"is_walkin_customer\":0,\"login_enabled\":1,\"name\":\"Admin\",\"email\":\"admin@example.com\",\"phone\":null,\"profile_image\":null,\"address\":null,\"shipping_address\":null,\"email_verification_code\":null,\"status\":\"enabled\",\"reset_code\":null,\"timezone\":\"Asia\\/Kolkata\",\"date_format\":\"d-m-Y\",\"date_picker_format\":\"dd-mm-yyyy\",\"time_format\":\"h:i a\",\"tax_number\":null,\"created_by\":null,\"reset_password_token\":null,\"created_at\":null,\"updated_at\":\"2024-06-25T09:27:13+00:00\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_role_id\":\"AdWNDqgV\",\"profile_image_url\":\"https:\\/\\/sarvessa.in\\/images\\/user.png\",\"x_department_id\":null,\"x_designation_id\":null,\"x_shift_id\":null}}}', NULL, '2024-08-29 01:23:26', '2024-08-29 01:23:26'),
('611b973c-0132-4e7b-9ff2-9d1dce6ef7b6', 'App\\Notifications\\MainNotificaiton', 'App\\Models\\Warehouse', 1, '{\"send_for\":\"purchases_create\",\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"mail\":{\"setting\":{\"is_global\":0,\"company_id\":1,\"setting_type\":\"email\",\"name\":\"SMTP\",\"name_key\":\"smtp\",\"credentials\":{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"},\"other_data\":null,\"status\":0,\"verified\":0,\"xid\":\"7ZWDkbpO\"},\"isAbleToSend\":false,\"content\":\"\",\"title\":\"\"},\"data\":{\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"warehouse\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"order\":{\"invoice_number\":\"29082024\",\"order_date\":\"2024-08-29T06:48:35+00:00\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"notes\":null,\"order_status\":\"ordered\",\"tax_rate\":5,\"tax_amount\":36.7000000000000028421709430404007434844970703125,\"discount\":0,\"shipping\":250,\"subtotal\":733.950000000000045474735088646411895751953125,\"total\":1020.6499999999999772626324556767940521240234375,\"total_items\":1,\"unique_id\":\"9ifrn0eTSBuqlqlj223N\",\"order_type\":\"purchases\",\"company_id\":1,\"updated_at\":\"2024-08-29T06:49:12+00:00\",\"created_at\":\"2024-08-29T06:49:12+00:00\",\"total_quantity\":1,\"due_amount\":733.950000000000045474735088646411895751953125,\"is_deletable\":1,\"xid\":\"Jlq1nbR6\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_from_warehouse_id\":null,\"x_user_id\":\"M6q8vWzR\",\"x_tax_id\":\"AdWNDqgV\",\"x_staff_user_id\":\"AdWNDqgV\",\"x_cancelled_by\":null,\"document_url\":\"https:\\/\\/sarvessa.in\\/images\\/order.png\",\"items\":[{\"quantity\":1,\"mrp\":null,\"unit_price\":699,\"single_unit_price\":699,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":0,\"total_tax\":34.9500000000000028421709430404007434844970703125,\"total_discount\":0,\"subtotal\":733.950000000000045474735088646411895751953125,\"created_at\":\"2024-08-29T06:49:12+00:00\",\"updated_at\":\"2024-08-29T06:49:12+00:00\",\"xid\":\"dJb01WB6\",\"x_order_id\":\"Jlq1nbR6\",\"x_user_id\":\"M6q8vWzR\",\"x_product_id\":\"xVbpGq1Q\",\"x_unit_id\":\"dJb01WB6\",\"x_tax_id\":\"AdWNDqgV\"}]},\"staff_member\":{\"is_superadmin\":0,\"lang_id\":1,\"user_type\":\"staff_members\",\"is_walkin_customer\":0,\"login_enabled\":1,\"name\":\"Admin\",\"email\":\"admin@example.com\",\"phone\":null,\"profile_image\":null,\"address\":null,\"shipping_address\":null,\"email_verification_code\":null,\"status\":\"enabled\",\"reset_code\":null,\"timezone\":\"Asia\\/Kolkata\",\"date_format\":\"d-m-Y\",\"date_picker_format\":\"dd-mm-yyyy\",\"time_format\":\"h:i a\",\"tax_number\":null,\"created_by\":null,\"reset_password_token\":null,\"created_at\":null,\"updated_at\":\"2024-06-25T09:27:13+00:00\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_role_id\":\"AdWNDqgV\",\"profile_image_url\":\"https:\\/\\/sarvessa.in\\/images\\/user.png\",\"x_department_id\":null,\"x_designation_id\":null,\"x_shift_id\":null}}}', NULL, '2024-08-29 01:19:12', '2024-08-29 01:19:12'),
('aa344341-0ca9-4d98-8d2d-44e7754c0d68', 'App\\Notifications\\MainNotificaiton', 'App\\Models\\Warehouse', 1, '{\"send_for\":\"purchases_create\",\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"mail\":{\"setting\":{\"is_global\":0,\"company_id\":1,\"setting_type\":\"email\",\"name\":\"SMTP\",\"name_key\":\"smtp\",\"credentials\":{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"},\"other_data\":null,\"status\":0,\"verified\":0,\"xid\":\"7ZWDkbpO\"},\"isAbleToSend\":false,\"content\":\"\",\"title\":\"\"},\"data\":{\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"warehouse\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"order\":{\"invoice_number\":\"PUR-5\",\"order_date\":\"2024-08-29T06:48:35+00:00\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to Noida jurisdiction only\",\"notes\":null,\"order_status\":\"ordered\",\"tax_rate\":5,\"tax_amount\":366.98000000000001818989403545856475830078125,\"discount\":0,\"shipping\":250,\"subtotal\":7339.5,\"total\":7956.47999999999956344254314899444580078125,\"total_items\":1,\"unique_id\":\"GMJNAg9EJgyjTtYWZglB\",\"order_type\":\"purchases\",\"company_id\":1,\"updated_at\":\"2024-08-29T06:53:13+00:00\",\"created_at\":\"2024-08-29T06:53:13+00:00\",\"total_quantity\":10,\"due_amount\":7339.5,\"is_deletable\":1,\"xid\":\"M6q8vWzR\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_from_warehouse_id\":null,\"x_user_id\":\"M6q8vWzR\",\"x_tax_id\":\"AdWNDqgV\",\"x_staff_user_id\":\"AdWNDqgV\",\"x_cancelled_by\":null,\"document_url\":\"https:\\/\\/sarvessa.in\\/images\\/order.png\",\"items\":[{\"quantity\":10,\"mrp\":null,\"unit_price\":699,\"single_unit_price\":699,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":0,\"total_tax\":349.5,\"total_discount\":0,\"subtotal\":7339.5,\"created_at\":\"2024-08-29T06:53:13+00:00\",\"updated_at\":\"2024-08-29T06:53:13+00:00\",\"xid\":\"yMWXPWGQ\",\"x_order_id\":\"M6q8vWzR\",\"x_user_id\":\"M6q8vWzR\",\"x_product_id\":\"xVbpGq1Q\",\"x_unit_id\":\"dJb01WB6\",\"x_tax_id\":\"AdWNDqgV\"}]},\"staff_member\":{\"is_superadmin\":0,\"lang_id\":1,\"user_type\":\"staff_members\",\"is_walkin_customer\":0,\"login_enabled\":1,\"name\":\"Admin\",\"email\":\"admin@example.com\",\"phone\":null,\"profile_image\":null,\"address\":null,\"shipping_address\":null,\"email_verification_code\":null,\"status\":\"enabled\",\"reset_code\":null,\"timezone\":\"Asia\\/Kolkata\",\"date_format\":\"d-m-Y\",\"date_picker_format\":\"dd-mm-yyyy\",\"time_format\":\"h:i a\",\"tax_number\":null,\"created_by\":null,\"reset_password_token\":null,\"created_at\":null,\"updated_at\":\"2024-06-25T09:27:13+00:00\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_role_id\":\"AdWNDqgV\",\"profile_image_url\":\"https:\\/\\/sarvessa.in\\/images\\/user.png\",\"x_department_id\":null,\"x_designation_id\":null,\"x_shift_id\":null}}}', NULL, '2024-08-29 01:23:13', '2024-08-29 01:23:13'),
('ddfcb211-c2bb-434f-b6af-7050620774bb', 'App\\Notifications\\MainNotificaiton', 'App\\Models\\Warehouse', 1, '{\"send_for\":\"quotations_create\",\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"mail\":{\"setting\":{\"is_global\":0,\"company_id\":1,\"setting_type\":\"email\",\"name\":\"SMTP\",\"name_key\":\"smtp\",\"credentials\":{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"},\"other_data\":null,\"status\":0,\"verified\":0,\"xid\":\"7ZWDkbpO\"},\"isAbleToSend\":false,\"content\":\"\",\"title\":\"\"},\"data\":{\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"warehouse\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"order\":{\"invoice_number\":\"27082024\",\"order_date\":\"2024-08-27T07:21:22+00:00\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"notes\":\"Demo Quotation\",\"order_status\":\"pending\",\"tax_rate\":5,\"tax_amount\":5357.2899999999999636202119290828704833984375,\"discount\":1000,\"shipping\":1200,\"subtotal\":108145.800000000002910383045673370361328125,\"total\":113703.08999999999650754034519195556640625,\"total_items\":2,\"unique_id\":\"YUk1OmyQPp7NsZmZFv3f\",\"order_type\":\"quotations\",\"company_id\":1,\"updated_at\":\"2024-08-27T07:24:25+00:00\",\"created_at\":\"2024-08-27T07:24:25+00:00\",\"total_quantity\":110,\"due_amount\":108145.800000000002910383045673370361328125,\"is_deletable\":1,\"xid\":\"NArJeWyE\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_from_warehouse_id\":null,\"x_user_id\":\"7ZWDkbpO\",\"x_tax_id\":\"AdWNDqgV\",\"x_staff_user_id\":\"AdWNDqgV\",\"x_cancelled_by\":null,\"document_url\":\"https:\\/\\/sarvessa.in\\/images\\/order.png\",\"items\":[{\"quantity\":10,\"mrp\":null,\"unit_price\":899,\"single_unit_price\":809.1000000000000227373675443232059478759765625,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":10,\"total_tax\":404.55000000000001136868377216160297393798828125,\"total_discount\":899,\"subtotal\":8495.54999999999927240423858165740966796875,\"created_at\":\"2024-08-27T07:24:25+00:00\",\"updated_at\":\"2024-08-27T07:24:25+00:00\",\"xid\":\"7ZWDkbpO\",\"x_order_id\":\"NArJeWyE\",\"x_user_id\":\"7ZWDkbpO\",\"x_product_id\":\"aXrLJbp7\",\"x_unit_id\":\"dJb01WB6\",\"x_tax_id\":\"AdWNDqgV\"},{\"quantity\":100,\"mrp\":1299,\"unit_price\":999,\"single_unit_price\":949.049999999999954525264911353588104248046875,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":5,\"total_tax\":4745.25,\"total_discount\":4995,\"subtotal\":99650.25,\"created_at\":\"2024-08-27T07:24:25+00:00\",\"updated_at\":\"2024-08-27T07:24:25+00:00\",\"xid\":\"Jlq1nbR6\",\"x_order_id\":\"NArJeWyE\",\"x_user_id\":\"7ZWDkbpO\",\"x_product_id\":\"dJb01WB6\",\"x_unit_id\":\"NArJeWyE\",\"x_tax_id\":\"AdWNDqgV\"}]},\"staff_member\":{\"is_superadmin\":0,\"lang_id\":1,\"user_type\":\"staff_members\",\"is_walkin_customer\":0,\"login_enabled\":1,\"name\":\"Admin\",\"email\":\"admin@example.com\",\"phone\":null,\"profile_image\":null,\"address\":null,\"shipping_address\":null,\"email_verification_code\":null,\"status\":\"enabled\",\"reset_code\":null,\"timezone\":\"Asia\\/Kolkata\",\"date_format\":\"d-m-Y\",\"date_picker_format\":\"dd-mm-yyyy\",\"time_format\":\"h:i a\",\"tax_number\":null,\"created_by\":null,\"reset_password_token\":null,\"created_at\":null,\"updated_at\":\"2024-06-25T09:27:13+00:00\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_role_id\":\"AdWNDqgV\",\"profile_image_url\":\"https:\\/\\/sarvessa.in\\/images\\/user.png\",\"x_department_id\":null,\"x_designation_id\":null,\"x_shift_id\":null}}}', NULL, '2024-08-27 01:54:25', '2024-08-27 01:54:25'),
('e7010e40-5c32-414d-902c-9978d12f2515', 'App\\Notifications\\MainNotificaiton', 'App\\Models\\Warehouse', 1, '{\"send_for\":\"purchases_create\",\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"mail\":{\"setting\":{\"is_global\":0,\"company_id\":1,\"setting_type\":\"email\",\"name\":\"SMTP\",\"name_key\":\"smtp\",\"credentials\":{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"},\"other_data\":null,\"status\":0,\"verified\":0,\"xid\":\"7ZWDkbpO\"},\"isAbleToSend\":false,\"content\":\"\",\"title\":\"\"},\"data\":{\"to\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"warehouse\":{\"company_id\":1,\"logo\":null,\"dark_logo\":null,\"name\":\"Bhera Enclave\",\"slug\":\"bhera-enclave-showbsho\",\"email\":\"ajaychhabra@outlook.com\",\"phone\":\"9999500699\",\"show_email_on_invoice\":0,\"show_phone_on_invoice\":0,\"address\":\"487\\/65 PLOE 130 NATIONAL MARKET BHERA ENCLAVE MAIN ROAD PEERA GARI NEW DELHI WEST DELHI - 110087\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only\",\"bank_details\":\"IDFC FIRST\\n10179237657\\nIDFB0020149\\nBhera Enclave Paschim Vihar Branch\",\"signature\":\"warehouses_vxowro4pk9ey4wutijwh.png\",\"online_store_enabled\":1,\"customers_visibility\":\"all\",\"suppliers_visibility\":\"all\",\"products_visibility\":\"all\",\"default_pos_order_status\":\"delivered\",\"show_mrp_on_invoice\":1,\"show_discount_tax_on_invoice\":1,\"created_at\":\"2024-06-25T09:19:59+00:00\",\"updated_at\":\"2024-06-25T09:19:59+00:00\",\"barcode_type\":\"barcode\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/light.png\",\"dark_logo_url\":\"https:\\/\\/sarvessa.in\\/images\\/dark.png\",\"signature_url\":\"https:\\/\\/sarvessa.in\\/uploads\\/warehouses\\/warehouses_vxowro4pk9ey4wutijwh.png\"},\"order\":{\"invoice_number\":\"98765412301\",\"order_date\":\"2024-08-29T06:48:35+00:00\",\"terms_condition\":\"1. Goods once sold will not be taken back or exchanged\\n2. All disputes are subject to Noida jurisdiction only\",\"notes\":null,\"order_status\":\"ordered\",\"tax_rate\":5,\"tax_amount\":366.98000000000001818989403545856475830078125,\"discount\":0,\"shipping\":250,\"subtotal\":7339.5,\"total\":7956.47999999999956344254314899444580078125,\"total_items\":1,\"unique_id\":\"BkYlwSLjeGa7CQcTrcHZ\",\"order_type\":\"purchases\",\"company_id\":1,\"updated_at\":\"2024-08-29T06:53:52+00:00\",\"created_at\":\"2024-08-29T06:53:51+00:00\",\"total_quantity\":10,\"due_amount\":7339.5,\"is_deletable\":1,\"xid\":\"2krPNbR7\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_from_warehouse_id\":null,\"x_user_id\":\"M6q8vWzR\",\"x_tax_id\":\"AdWNDqgV\",\"x_staff_user_id\":\"AdWNDqgV\",\"x_cancelled_by\":null,\"document_url\":\"https:\\/\\/sarvessa.in\\/images\\/order.png\",\"items\":[{\"quantity\":10,\"mrp\":null,\"unit_price\":699,\"single_unit_price\":699,\"tax_rate\":5,\"tax_type\":\"exclusive\",\"discount_rate\":0,\"total_tax\":349.5,\"total_discount\":0,\"subtotal\":7339.5,\"created_at\":\"2024-08-29T06:53:51+00:00\",\"updated_at\":\"2024-08-29T06:53:51+00:00\",\"xid\":\"3BrZXbA5\",\"x_order_id\":\"2krPNbR7\",\"x_user_id\":\"M6q8vWzR\",\"x_product_id\":\"xVbpGq1Q\",\"x_unit_id\":\"dJb01WB6\",\"x_tax_id\":\"AdWNDqgV\"}]},\"staff_member\":{\"is_superadmin\":0,\"lang_id\":1,\"user_type\":\"staff_members\",\"is_walkin_customer\":0,\"login_enabled\":1,\"name\":\"Admin\",\"email\":\"admin@example.com\",\"phone\":null,\"profile_image\":null,\"address\":null,\"shipping_address\":null,\"email_verification_code\":null,\"status\":\"enabled\",\"reset_code\":null,\"timezone\":\"Asia\\/Kolkata\",\"date_format\":\"d-m-Y\",\"date_picker_format\":\"dd-mm-yyyy\",\"time_format\":\"h:i a\",\"tax_number\":null,\"created_by\":null,\"reset_password_token\":null,\"created_at\":null,\"updated_at\":\"2024-06-25T09:27:13+00:00\",\"xid\":\"AdWNDqgV\",\"x_company_id\":\"AdWNDqgV\",\"x_warehouse_id\":\"AdWNDqgV\",\"x_role_id\":\"AdWNDqgV\",\"profile_image_url\":\"https:\\/\\/sarvessa.in\\/images\\/user.png\",\"x_department_id\":null,\"x_designation_id\":null,\"x_shift_id\":null}}}', NULL, '2024-08-29 01:23:52', '2024-08-29 01:23:52');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `unique_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sales',
  `order_date` datetime NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `from_warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_rate` double(8,2) DEFAULT NULL,
  `tax_amount` double NOT NULL DEFAULT '0',
  `discount` double DEFAULT NULL,
  `shipping` double DEFAULT NULL,
  `subtotal` double NOT NULL,
  `total` double NOT NULL,
  `paid_amount` double NOT NULL DEFAULT '0',
  `due_amount` double NOT NULL DEFAULT '0',
  `order_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `total_items` double(8,2) NOT NULL DEFAULT '0.00',
  `total_quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `terms_condition` text COLLATE utf8mb4_unicode_ci,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '1',
  `cancelled` tinyint(1) NOT NULL DEFAULT '0',
  `cancelled_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `company_id`, `unique_id`, `invoice_number`, `invoice_type`, `order_type`, `order_date`, `warehouse_id`, `from_warehouse_id`, `user_id`, `tax_id`, `tax_rate`, `tax_amount`, `discount`, `shipping`, `subtotal`, `total`, `paid_amount`, `due_amount`, `order_status`, `notes`, `document`, `staff_user_id`, `payment_status`, `total_items`, `total_quantity`, `terms_condition`, `is_deletable`, `cancelled`, `cancelled_by`, `created_at`, `updated_at`) VALUES
(1, 1, 'lSQk8A51g0z63oI4toro', 'SALE-1', 'pos', 'sales', '2024-07-28 11:46:36', 1, NULL, 2, 1, 5.00, 89.65, 200, 0, 1992.9, 1882.55, 0, 1882.55, 'delivered', NULL, NULL, 1, 'unpaid', 2.00, 2.00, NULL, 1, 0, NULL, '2024-07-28 06:16:36', '2024-07-28 06:16:36'),
(2, 1, 'YUk1OmyQPp7NsZmZFv3f', '27082024', NULL, 'quotations', '2024-08-27 07:21:22', 1, NULL, 3, 1, 5.00, 5357.29, 1000, 1200, 108145.8, 113703.09, 10000, 103703.09, 'pending', 'Demo Quotation', NULL, 1, 'partially_paid', 2.00, 110.00, '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only', 1, 0, NULL, '2024-08-27 01:54:25', '2024-08-29 01:13:28'),
(3, 1, 'mM4AkfAc8zWo9ko6CKeZ', 'ONLI-TRANS-3', NULL, 'online-orders', '2024-08-29 06:36:52', 1, NULL, 4, NULL, NULL, 49.95, NULL, NULL, 1048.95, 1048.95, 0, 1048.95, 'delivered', NULL, NULL, NULL, 'unpaid', 1.00, 1.00, NULL, 1, 0, NULL, '2024-08-29 01:06:52', '2024-08-29 01:11:33'),
(4, 1, '9ifrn0eTSBuqlqlj223N', '29082024', NULL, 'purchases', '2024-08-29 06:48:35', 1, NULL, 5, 1, 5.00, 36.7, 0, 250, 733.95, 1020.65, 0, 1020.65, 'ordered', NULL, NULL, 1, 'unpaid', 1.00, 1.00, '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only', 1, 0, NULL, '2024-08-29 01:19:12', '2024-08-29 01:19:12'),
(5, 1, 'GMJNAg9EJgyjTtYWZglB', 'PUR-5', NULL, 'purchases', '2024-08-29 06:48:35', 1, NULL, 5, 1, 5.00, 366.98, 0, 250, 7339.5, 7956.48, 0, 7956.48, 'ordered', NULL, NULL, 1, 'unpaid', 1.00, 10.00, '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to Noida jurisdiction only', 1, 0, NULL, '2024-08-29 01:23:13', '2024-08-29 01:23:13'),
(6, 1, 'xWawKvO9MssEtzJpKUqk', '129082024', NULL, 'purchases', '2024-08-29 06:48:35', 1, NULL, 5, 1, 5.00, 366.98, 0, 250, 7339.5, 7956.48, 0, 7956.48, 'ordered', NULL, NULL, 1, 'unpaid', 1.00, 10.00, '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to Noida jurisdiction only', 1, 0, NULL, '2024-08-29 01:23:25', '2024-08-29 01:23:26'),
(7, 1, '6XfMhtYTndL8GmtYtkr8', '1229082024', NULL, 'purchases', '2024-08-29 06:48:35', 1, NULL, 5, 1, 5.00, 366.98, 0, 250, 7339.5, 7956.48, 1000, 6956.48, 'ordered', NULL, NULL, 1, 'partially_paid', 1.00, 10.00, '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to Noida jurisdiction only', 1, 0, NULL, '2024-08-29 01:23:34', '2024-08-29 01:24:36'),
(8, 1, 'BkYlwSLjeGa7CQcTrcHZ', '98765412301', NULL, 'purchases', '2024-08-29 06:48:35', 1, NULL, 5, 1, 5.00, 366.98, 0, 250, 7339.5, 7956.48, 0, 7956.48, 'ordered', NULL, NULL, 1, 'unpaid', 1.00, 10.00, '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to Noida jurisdiction only', 1, 0, NULL, '2024-08-29 01:23:51', '2024-08-29 01:23:52'),
(9, 1, 'HVZ4pi22EiQbwdoMph0N', 'SALE-9', 'pos', 'sales', '2024-08-29 06:56:14', 1, NULL, 2, NULL, 0.00, 0, 0, 0, 1992.9, 1992.9, 100, 1892.9, 'delivered', NULL, NULL, 1, 'partially_paid', 2.00, 2.00, NULL, 1, 0, NULL, '2024-08-29 01:26:14', '2024-08-29 01:26:14');

-- --------------------------------------------------------

--
-- Table structure for table `order_custom_fields`
--

CREATE TABLE `order_custom_fields` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `field_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `unit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quantity` double(8,2) NOT NULL,
  `mrp` double DEFAULT NULL,
  `unit_price` double NOT NULL,
  `single_unit_price` double NOT NULL,
  `tax_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_rate` double(8,2) NOT NULL DEFAULT '0.00',
  `tax_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_rate` double(8,2) DEFAULT NULL,
  `total_tax` double DEFAULT NULL,
  `total_discount` double DEFAULT NULL,
  `subtotal` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `user_id`, `order_id`, `product_id`, `unit_id`, `quantity`, `mrp`, `unit_price`, `single_unit_price`, `tax_id`, `tax_rate`, `tax_type`, `discount_rate`, `total_tax`, `total_discount`, `subtotal`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 6, 2, 1.00, 1299, 999, 999, 1, 5.00, 'exclusive', 0.00, 49.95, 0, 1048.95, '2024-07-28 06:16:36', '2024-07-28 06:16:36'),
(2, 2, 1, 7, 2, 1.00, 1299, 899, 899, 1, 5.00, 'exclusive', 0.00, 44.95, 0, 943.95, '2024-07-28 06:16:36', '2024-07-28 06:16:36'),
(3, 3, 2, 20, 6, 10.00, NULL, 899, 809.1, 1, 5.00, 'exclusive', 10.00, 404.55, 899, 8495.55, '2024-08-27 01:54:25', '2024-08-27 01:54:25'),
(4, 3, 2, 6, 2, 100.00, 1299, 999, 949.05, 1, 5.00, 'exclusive', 5.00, 4745.25, 4995, 99650.25, '2024-08-27 01:54:25', '2024-08-27 01:54:25'),
(5, 4, 3, 6, 2, 1.00, NULL, 999, 999, 1, 5.00, 'exclusive', NULL, 49.95, NULL, 1048.95, '2024-08-29 01:06:52', '2024-08-29 01:06:52'),
(6, 5, 4, 18, 6, 1.00, NULL, 699, 699, 1, 5.00, 'exclusive', 0.00, 34.95, 0, 733.95, '2024-08-29 01:19:12', '2024-08-29 01:19:12'),
(7, 5, 5, 18, 6, 10.00, NULL, 699, 699, 1, 5.00, 'exclusive', 0.00, 349.5, 0, 7339.5, '2024-08-29 01:23:13', '2024-08-29 01:23:13'),
(8, 5, 6, 18, 6, 10.00, NULL, 699, 699, 1, 5.00, 'exclusive', 0.00, 349.5, 0, 7339.5, '2024-08-29 01:23:26', '2024-08-29 01:23:26'),
(9, 5, 7, 18, 6, 10.00, NULL, 699, 699, 1, 5.00, 'exclusive', 0.00, 349.5, 0, 7339.5, '2024-08-29 01:23:34', '2024-08-29 01:23:34'),
(10, 5, 8, 18, 6, 10.00, NULL, 699, 699, 1, 5.00, 'exclusive', 0.00, 349.5, 0, 7339.5, '2024-08-29 01:23:51', '2024-08-29 01:23:51'),
(11, 2, 9, 6, 2, 1.00, 1299, 999, 999, 1, 5.00, 'exclusive', 0.00, 49.95, 0, 1048.95, '2024-08-29 01:26:14', '2024-08-29 01:26:14'),
(12, 2, 9, 7, 2, 1.00, 1299, 899, 899, 1, 5.00, 'exclusive', 0.00, 44.95, 0, 943.95, '2024-08-29 01:26:14', '2024-08-29 01:26:14');

-- --------------------------------------------------------

--
-- Table structure for table `order_item_taxes`
--

CREATE TABLE `order_item_taxes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tax_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_amount` double NOT NULL,
  `tax_rate` double(8,2) NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `order_item_id` bigint(20) UNSIGNED NOT NULL,
  `tax_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_payments`
--

CREATE TABLE `order_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_payments`
--

INSERT INTO `order_payments` (`id`, `company_id`, `payment_id`, `order_id`, `amount`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 2, 10000, '2024-08-29 01:13:28', '2024-08-29 01:13:28'),
(2, 1, 3, 7, 1000, '2024-08-29 01:24:36', '2024-08-29 01:24:36'),
(3, 1, 4, 9, 100, '2024-08-29 01:26:14', '2024-08-29 01:26:14');

-- --------------------------------------------------------

--
-- Table structure for table `order_shipping_address`
--

CREATE TABLE `order_shipping_address` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_shipping_address`
--

INSERT INTO `order_shipping_address` (`id`, `company_id`, `order_id`, `name`, `email`, `phone`, `address`, `shipping_address`, `city`, `state`, `country`, `zipcode`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'Shyam', 'spshyam1@gmail.com', '8076595733', 'Delhi', 'Noida', 'Noida', 'Uttar Pradesh', 'India', '201304', '2024-08-29 01:06:52', '2024-08-29 01:06:52');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'out',
  `payment_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` datetime NOT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `unused_amount` double NOT NULL DEFAULT '0',
  `paid_amount` double NOT NULL DEFAULT '0',
  `payment_mode_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_receipt` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `staff_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `company_id`, `warehouse_id`, `payment_type`, `payment_number`, `date`, `amount`, `unused_amount`, `paid_amount`, `payment_mode_id`, `user_id`, `payment_receipt`, `notes`, `staff_user_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'in', 'PAY-IN-1', '2024-08-29 06:42:05', 1000, 1000, 0, 1, 3, NULL, NULL, NULL, '2024-08-29 01:12:35', '2024-08-29 01:12:35'),
(2, 1, 1, 'in', 'PAY-IN-2', '2024-08-29 00:00:00', 10000, 0, 10000, 1, 3, NULL, 'test payment', NULL, '2024-08-29 01:13:28', '2024-08-29 01:13:28'),
(3, 1, 1, 'out', 'PAY-OUT-3', '2024-08-29 00:00:00', 1000, 0, 1000, 1, 5, NULL, NULL, NULL, '2024-08-29 01:24:36', '2024-08-29 01:24:36'),
(4, 1, 1, 'in', 'PAY-IN-4', '2024-08-29 06:56:14', 100, 0, 100, 1, 2, NULL, NULL, NULL, '2024-08-29 01:26:14', '2024-08-29 01:26:14');

-- --------------------------------------------------------

--
-- Table structure for table `payment_modes`
--

CREATE TABLE `payment_modes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mode_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'bank',
  `credentials` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_modes`
--

INSERT INTO `payment_modes` (`id`, `company_id`, `name`, `mode_type`, `credentials`, `created_at`, `updated_at`) VALUES
(1, 1, 'BANK', 'bank', NULL, '2024-06-25 03:55:35', '2024-06-25 03:55:35');

-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

CREATE TABLE `payrolls` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `basic_salary` double NOT NULL,
  `salary_amount` double NOT NULL,
  `pre_payment_amount` double NOT NULL DEFAULT '0',
  `expense_amount` double NOT NULL DEFAULT '0',
  `net_salary` double NOT NULL,
  `total_days` double(8,2) NOT NULL,
  `working_days` double(8,2) NOT NULL,
  `present_days` double(8,2) NOT NULL,
  `total_office_time` int(11) NOT NULL,
  `total_worked_time` int(11) NOT NULL,
  `half_days` int(11) NOT NULL,
  `late_days` double(8,2) NOT NULL,
  `paid_leaves` double(8,2) NOT NULL,
  `unpaid_leaves` double(8,2) NOT NULL,
  `holiday_count` double(8,2) NOT NULL,
  `payment_date` date DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'generated',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_mode_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_components`
--

CREATE TABLE `payroll_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payroll_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pre_payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expense_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `is_earning` tinyint(1) NOT NULL DEFAULT '1',
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_payments',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `display_name`, `description`, `module_name`, `created_at`, `updated_at`) VALUES
(1, 'shifts_view', 'Shift View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(2, 'shifts_create', 'Shift Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(3, 'shifts_edit', 'Shift Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(4, 'shifts_delete', 'Shift Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(5, 'attendances_view', 'Attendance View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(6, 'attendances_create', 'Attendance Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(7, 'attendances_edit', 'Attendance Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(8, 'attendances_delete', 'Attendance Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(9, 'awards_view', 'Award View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(10, 'awards_create', 'Award Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(11, 'awards_edit', 'Award Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(12, 'awards_delete', 'Award Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(13, 'appreciations_view', 'Appreciation View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(14, 'appreciations_create', 'Appreciation Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(15, 'appreciations_edit', 'Appreciation Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(16, 'appreciations_delete', 'Appreciation Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(17, 'departments_view', 'Department View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(18, 'departments_create', 'Department Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(19, 'departments_edit', 'Department Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(20, 'departments_delete', 'Department Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(21, 'designations_view', 'Designation View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(22, 'designations_create', 'Designation Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(23, 'designations_edit', 'Designation Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(24, 'designations_delete', 'Designation Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(25, 'employee_payments_view', 'Employee Payment View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(26, 'employee_payments_create', 'Employee Payment Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(27, 'employee_payments_edit', 'Employee Payment Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(28, 'employee_payments_delete', 'Employee Payment Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(29, 'holidays_create', 'Holiday Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(30, 'holidays_edit', 'Holiday Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(31, 'holidays_delete', 'Holiday Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(32, 'mark_weekend_holiday', 'Mark Weend Holiday', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(33, 'leave_types_view', 'Leave Type View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(34, 'leave_types_create', 'Leave Type Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(35, 'leave_types_edit', 'Leave Type Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(36, 'leave_types_delete', 'Leave Type Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(37, 'leaves_assign_to_all', 'Leave Assign To All', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(38, 'leaves_edit_all', 'Edit All Leaves', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(39, 'leaves_delete_all', 'Delete All Leaves', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(40, 'leaves_approve_reject', 'Approve/Reject Leaves', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(41, 'leaves_settings', 'Leave Settings', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(42, 'increments_promotions_view', 'Increment and Promotion View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(43, 'increments_promotions_create', 'Increment and Promotion Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(44, 'increments_promotions_edit', 'Increment and Promotion Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(45, 'increments_promotions_delete', 'Increment and Promotion Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(46, 'payrolls_view', 'Payroll View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(47, 'payrolls_create', 'Payroll Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(48, 'payrolls_edit', 'Payroll Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(49, 'payrolls_delete', 'Payroll Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(50, 'pre_payments_view', 'Pre Payments View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(51, 'pre_payments_create', 'Pre Payments Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(52, 'pre_payments_edit', 'Pre Payments Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(53, 'pre_payments_delete', 'Pre Payments Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(54, 'basic_salaries_view', 'Basic Salary View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(55, 'basic_salaries_create', 'Basic Salary Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(56, 'basic_salaries_edit', 'Basic Salary Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(57, 'basic_salaries_delete', 'Basic Salary Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(58, 'hrm_settings', 'HRM Settings', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(59, 'brands_view', 'Brand View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(60, 'brands_create', 'Brand Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(61, 'brands_edit', 'Brand Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(62, 'brands_delete', 'Brand Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(63, 'categories_view', 'Category View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(64, 'categories_create', 'Category Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(65, 'categories_edit', 'Category Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(66, 'categories_delete', 'Category Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(67, 'products_view', 'Product View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(68, 'products_create', 'Product Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(69, 'products_edit', 'Product Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(70, 'products_delete', 'Product Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(71, 'variations_view', 'Variation View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(72, 'variations_create', 'Variation Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(73, 'variations_edit', 'Variation Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(74, 'variations_delete', 'Variation Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(75, 'purchases_view', 'Purchase View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(76, 'purchases_create', 'Purchase Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(77, 'purchases_edit', 'Purchase Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(78, 'purchases_delete', 'Purchase Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(79, 'purchase_returns_view', 'Purchase Return View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(80, 'purchase_returns_create', 'Purchase Return Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(81, 'purchase_returns_edit', 'Purchase Return Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(82, 'purchase_returns_delete', 'Purchase Return Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(83, 'payment_out_view', 'Payment Out View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(84, 'payment_out_create', 'Payment Out Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(85, 'payment_out_edit', 'Payment Out Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(86, 'payment_out_delete', 'Payment Out Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(87, 'payment_in_view', 'Payment In View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(88, 'payment_in_create', 'Payment In Create', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(89, 'payment_in_edit', 'Payment In Edit', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(90, 'payment_in_delete', 'Payment In Delete', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(91, 'sales_view', 'Sales View', NULL, NULL, '2024-06-25 01:20:48', '2024-06-25 01:20:48'),
(92, 'sales_create', 'Sales Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(93, 'sales_edit', 'Sales Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(94, 'sales_delete', 'Sales Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(95, 'sales_returns_view', 'Sales Return View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(96, 'sales_returns_create', 'Sales Return Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(97, 'sales_returns_edit', 'Sales Return Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(98, 'sales_returns_delete', 'Sales Return Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(99, 'order_payments_view', 'Order Payments View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(100, 'order_payments_create', 'Order Payments Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(101, 'stock_adjustments_view', 'Stock Adjustment View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(102, 'stock_adjustments_create', 'Stock Adjustment Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(103, 'stock_adjustments_edit', 'Stock Adjustment Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(104, 'stock_adjustments_delete', 'Stock Adjustment Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(105, 'stock_transfers_view', 'Stock Transfer View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(106, 'stock_transfers_create', 'Stock Transfer Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(107, 'stock_transfers_edit', 'Stock Transfer Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(108, 'stock_transfers_delete', 'Stock Transfer Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(109, 'quotations_view', 'Quotation View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(110, 'quotations_create', 'Quotation Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(111, 'quotations_edit', 'Quotation Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(112, 'quotations_delete', 'Quotation Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(113, 'expense_categories_view', 'Expense Category View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(114, 'expense_categories_create', 'Expense Category Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(115, 'expense_categories_edit', 'Expense Category Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(116, 'expense_categories_delete', 'Expense Category Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(117, 'expenses_view', 'Expense View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(118, 'expenses_create', 'Expense Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(119, 'expenses_edit', 'Expense Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(120, 'expenses_delete', 'Expense Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(121, 'units_view', 'Unit View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(122, 'units_create', 'Unit Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(123, 'units_edit', 'Unit Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(124, 'units_delete', 'Unit Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(125, 'custom_fields_view', 'Custom Field View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(126, 'custom_fields_create', 'Custom Field Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(127, 'custom_fields_edit', 'Custom Field Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(128, 'custom_fields_delete', 'Custom Field Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(129, 'payment_modes_view', 'Payment Mode View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(130, 'payment_modes_create', 'Payment Mode Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(131, 'payment_modes_edit', 'Payment Mode Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(132, 'payment_modes_delete', 'Payment Mode Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(133, 'currencies_view', 'Currency View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(134, 'currencies_create', 'Currency Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(135, 'currencies_edit', 'Currency Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(136, 'currencies_delete', 'Currency Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(137, 'taxes_view', 'Tax View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(138, 'taxes_create', 'Tax Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(139, 'taxes_edit', 'Tax Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(140, 'taxes_delete', 'Tax Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(141, 'modules_view', 'Modules View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(142, 'roles_view', 'Role View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(143, 'roles_create', 'Role Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(144, 'roles_edit', 'Role Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(145, 'roles_delete', 'Role Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(146, 'warehouses_view', 'Warehouse View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(147, 'warehouses_create', 'Warehouse Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(148, 'warehouses_edit', 'Warehouse Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(149, 'warehouses_delete', 'Warehouse Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(150, 'companies_edit', 'Company Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(151, 'translations_view', 'Translation View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(152, 'translations_create', 'Translation Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(153, 'translations_edit', 'Translation Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(154, 'translations_delete', 'Translation Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(155, 'users_view', 'Staff Member View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(156, 'users_create', 'Staff Member Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(157, 'users_edit', 'Staff Member Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(158, 'users_delete', 'Staff Member Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(159, 'customers_view', 'Customer View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(160, 'customers_create', 'Customer Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(161, 'customers_edit', 'Customer Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(162, 'customers_delete', 'Customer Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(163, 'suppliers_view', 'Supplier View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(164, 'suppliers_create', 'Supplier Create', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(165, 'suppliers_edit', 'Supplier Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(166, 'suppliers_delete', 'Supplier Delete', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(167, 'storage_edit', 'Storage Settings Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(168, 'email_edit', 'Email Settings Edit', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(169, 'pos_view', 'POS View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(170, 'update_app', 'Update App', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49'),
(171, 'cash_bank_view', 'Cash & Bank View', NULL, NULL, '2024-06-25 01:20:49', '2024-06-25 01:20:49');

-- --------------------------------------------------------

--
-- Table structure for table `permission_role`
--

CREATE TABLE `permission_role` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pre_payments`
--

CREATE TABLE `pre_payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `payment_mode_id` bigint(20) UNSIGNED NOT NULL,
  `amount` double NOT NULL,
  `date_time` datetime NOT NULL,
  `deduct_from_payroll` tinyint(1) NOT NULL DEFAULT '1',
  `payroll_month` int(11) NOT NULL,
  `payroll_year` int(11) NOT NULL,
  `notes` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `parent_item_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode_symbology` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `brand_id` bigint(20) UNSIGNED DEFAULT NULL,
  `unit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `warehouse_id`, `product_type`, `parent_id`, `parent_item_code`, `name`, `slug`, `barcode_symbology`, `item_code`, `image`, `category_id`, `brand_id`, `unit_id`, `description`, `user_id`, `created_at`, `updated_at`) VALUES
(5, 1, 1, 'variable', NULL, NULL, 'Shiv Ceramic', 'shiv-ceramic-fe2ryfsy', 'CODE128', 'TILE12x8', NULL, 3, NULL, 2, NULL, 1, '2024-07-28 05:45:52', '2024-07-28 05:45:52'),
(6, 1, 1, 'single', 5, 'TILE12x8', 'Shiv Ceramic - White', 'shiv-ceramic-white', 'CODE128', 'TILE12x8-White', NULL, 3, NULL, 2, NULL, 1, '2024-07-28 05:45:52', '2024-07-28 05:45:52'),
(7, 1, 1, 'single', 5, 'TILE12x8', 'Shiv Ceramic - Ivory', 'shiv-ceramic-ivory', 'CODE128', 'TILE12x8-Ivory', NULL, 3, NULL, 2, NULL, 1, '2024-07-28 05:45:52', '2024-07-28 05:45:52'),
(9, 1, 1, 'variable', NULL, NULL, '10119', '10119-fxw1oirk', 'CODE128', '10119', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:33:58', '2024-08-27 01:33:58'),
(10, 1, 1, 'single', 9, '10119', '10119 - 12\"x12\"', '10119-12x12', 'CODE128', '10119', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:33:59', '2024-08-27 01:33:59'),
(11, 1, 1, 'single', NULL, NULL, 'DG-240', 'dg-240-tu47uj3q', 'CODE128', 'DG-240', NULL, 3, NULL, 4, NULL, 1, '2024-08-27 01:36:44', '2024-08-27 01:36:44'),
(12, 1, 1, 'single', NULL, NULL, 'DG-261', 'dg-261-evexg2i', 'CODE128', 'DG-261', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:37:38', '2024-08-27 01:37:38'),
(13, 1, 1, 'single', NULL, NULL, '10128', '10128-wxyoki2h', 'CODE128', '10128', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:38:15', '2024-08-27 01:38:15'),
(14, 1, 1, 'single', NULL, NULL, '10126', '10126-dng1zu2d', 'CODE128', '10126', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:39:10', '2024-08-27 01:39:10'),
(15, 1, 1, 'single', NULL, NULL, 'AUSTIN', 'austin-nzvpgzi', 'CODE128', 'AUSTIN', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:39:51', '2024-08-27 01:39:51'),
(16, 1, 1, 'single', NULL, NULL, 'WISCON', 'wiscon-3w1lfikv', 'CODE128', 'WISCON', NULL, 3, NULL, 3, NULL, 1, '2024-08-27 01:40:40', '2024-08-27 01:40:40'),
(17, 1, 1, 'variable', NULL, NULL, 'Shiv Ceramic', 'shiv-ceramic-94b6yukp', 'CODE128', '1245-L', NULL, 3, NULL, 6, NULL, 1, '2024-08-27 01:44:24', '2024-08-27 01:44:24'),
(18, 1, 1, 'single', 17, '1245-L', 'Shiv Ceramic - 159-L', 'shiv-ceramic-159-l', 'CODE128', '159L', NULL, 3, NULL, 6, NULL, 1, '2024-08-27 01:48:51', '2024-08-27 01:48:51'),
(19, 1, 1, 'single', 17, '1245-L', 'Shiv Ceramic - 140-L', 'shiv-ceramic-140-l', 'CODE128', '140L', NULL, 3, NULL, 6, NULL, 1, '2024-08-27 01:48:51', '2024-08-27 01:48:51'),
(20, 1, 1, 'single', 17, '1245-L', 'Shiv Ceramic - 1245-D', 'shiv-ceramic-1245-d', 'CODE128', '1245D', NULL, 3, NULL, 6, NULL, 1, '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(21, 1, 1, 'single', 17, '1245-L', 'Shiv Ceramic - 1245-HL', 'shiv-ceramic-1245-hl', 'CODE128', '1245HL', NULL, 3, NULL, 6, NULL, 1, '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(22, 1, 1, 'single', 17, '1245-L', 'Shiv Ceramic - 1245-L', 'shiv-ceramic-1245-l', 'CODE128', '1245L', NULL, 3, NULL, 6, NULL, 1, '2024-08-27 01:48:52', '2024-08-27 01:48:52');

-- --------------------------------------------------------

--
-- Table structure for table `product_custom_fields`
--

CREATE TABLE `product_custom_fields` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `field_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_details`
--

CREATE TABLE `product_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `current_stock` double(8,2) NOT NULL DEFAULT '0.00',
  `mrp` double DEFAULT NULL,
  `purchase_price` double NOT NULL,
  `sales_price` double NOT NULL,
  `tax_id` bigint(20) UNSIGNED DEFAULT NULL,
  `purchase_tax_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'exclusive',
  `sales_tax_type` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'exclusive',
  `stock_quantitiy_alert` int(11) DEFAULT NULL,
  `opening_stock` int(11) DEFAULT NULL,
  `opening_stock_date` date DEFAULT NULL,
  `wholesale_price` double DEFAULT NULL,
  `wholesale_quantity` int(11) DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_stock',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_details`
--

INSERT INTO `product_details` (`id`, `product_id`, `warehouse_id`, `current_stock`, `mrp`, `purchase_price`, `sales_price`, `tax_id`, `purchase_tax_type`, `sales_tax_type`, `stock_quantitiy_alert`, `opening_stock`, `opening_stock_date`, `wholesale_price`, `wholesale_quantity`, `status`, `created_at`, `updated_at`) VALUES
(4, 6, 1, 9997.00, 1299, 799, 999, 1, 'exclusive', 'exclusive', 9999, 9999, NULL, NULL, NULL, 'out_of_stock', '2024-07-28 05:45:52', '2024-08-29 01:26:14'),
(5, 7, 1, 9997.00, 1299, 799, 899, 1, 'exclusive', 'exclusive', 9999, 9999, NULL, NULL, NULL, 'out_of_stock', '2024-07-28 05:45:52', '2024-08-29 01:26:14'),
(7, 10, 1, 9999.00, 1299, 699, 999, 1, 'exclusive', 'exclusive', 10, 9999, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:33:59', '2024-08-27 01:33:59'),
(8, 11, 1, 0.00, 1299, 699, 799, NULL, 'exclusive', 'exclusive', NULL, NULL, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:36:44', '2024-08-27 01:36:44'),
(9, 12, 1, 0.00, 1299, 699, 899, 1, 'exclusive', 'exclusive', 99999, NULL, NULL, NULL, NULL, 'out_of_stock', '2024-08-27 01:37:39', '2024-08-27 01:37:39'),
(10, 13, 1, 0.00, 1299, 699, 899, 1, 'exclusive', 'exclusive', NULL, NULL, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:38:15', '2024-08-27 01:38:15'),
(11, 14, 1, 0.00, 1299, 699, 899, 1, 'exclusive', 'exclusive', NULL, NULL, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:39:10', '2024-08-27 01:39:10'),
(12, 15, 1, 0.00, 1299, 699, 899, 1, 'exclusive', 'exclusive', NULL, NULL, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:39:51', '2024-08-27 01:39:51'),
(13, 16, 1, 0.00, 1299, 699, 899, 1, 'exclusive', 'exclusive', NULL, NULL, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:40:40', '2024-08-27 01:40:40'),
(14, 18, 1, 1040.00, NULL, 699, 899, 1, 'exclusive', 'exclusive', NULL, 999, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:48:51', '2024-08-29 01:23:52'),
(15, 19, 1, 999.00, NULL, 699, 899, 1, 'exclusive', 'exclusive', NULL, 999, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(16, 20, 1, 999.00, NULL, 699, 899, 1, 'exclusive', 'exclusive', NULL, 999, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(17, 21, 1, 999.00, NULL, 699, 899, 1, 'exclusive', 'exclusive', NULL, 999, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(18, 22, 1, 999.00, 1299, 699, 899, 1, 'exclusive', 'exclusive', NULL, 999, NULL, NULL, NULL, 'in_stock', '2024-08-27 01:48:52', '2024-08-27 01:48:52');

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `variant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `variant_value_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `variant_id`, `variant_value_id`, `created_at`, `updated_at`) VALUES
(4, 6, 11, 12, '2024-07-28 05:45:52', '2024-07-28 05:45:52'),
(5, 7, 11, 13, '2024-07-28 05:45:52', '2024-07-28 05:45:52'),
(6, 10, 1, 36, '2024-08-27 01:33:59', '2024-08-27 01:33:59'),
(7, 18, 39, 44, '2024-08-27 01:48:51', '2024-08-27 01:48:51'),
(8, 19, 39, 43, '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(9, 20, 39, 42, '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(10, 21, 39, 41, '2024-08-27 01:48:52', '2024-08-27 01:48:52'),
(11, 22, 39, 40, '2024-08-27 01:48:52', '2024-08-27 01:48:52');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `company_id`, `name`, `display_name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', 'Admin', 'Admin is allowed to manage everything of the app.', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_user`
--

CREATE TABLE `role_user` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_user`
--

INSERT INTO `role_user` (`user_id`, `role_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `is_global` tinyint(1) NOT NULL DEFAULT '0',
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `setting_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credentials` text COLLATE utf8mb4_unicode_ci,
  `other_data` text COLLATE utf8mb4_unicode_ci,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `is_global`, `company_id`, `setting_type`, `name`, `name_key`, `credentials`, `other_data`, `status`, `verified`, `created_at`, `updated_at`) VALUES
(1, 0, 1, 'storage', 'Local', 'local', '[]', NULL, 1, 0, NULL, NULL),
(2, 0, 1, 'storage', 'AWS', 'aws', '{\"driver\":\"s3\",\"key\":\"\",\"secret\":\"\",\"region\":\"\",\"bucket\":\"\"}', NULL, 0, 0, NULL, NULL),
(3, 0, 1, 'email', 'SMTP', 'smtp', '{\"from_name\":\"\",\"from_email\":\"\",\"host\":\"\",\"port\":\"\",\"encryption\":\"\",\"username\":\"\",\"password\":\"\"}', NULL, 0, 0, NULL, NULL),
(4, 0, 1, 'send_mail_settings', 'Send mail to warehouse', 'warehouse', '[]', NULL, 0, 0, NULL, NULL),
(5, 0, 1, 'shortcut_menus', 'Add Menu', 'shortcut_menus', '[\"staff_member\",\"customer\",\"supplier\",\"brand\",\"category\",\"product\",\"purchase\",\"sales\",\"expense_category\",\"expense\",\"warehouse\",\"currency\",\"unit\",\"language\",\"role\",\"tax\",\"payment_mode\"]', NULL, 1, 0, NULL, NULL),
(6, 0, 1, 'email_templates', 'Stock adjustment created', 'stock_adjustment_create', '{\"title\":\"Stock adjustment created\",\"content\":\"Stock adjustment created by ##staff_member_name## for warehouse ##warehouse_name## for product ##product_name## with ##stock_adjustment_quantity## (##stock_adjustment_type##) quantity\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(7, 0, 1, 'email_templates', 'Stock adjustment updated', 'stock_adjustment_update', '{\"title\":\"Stock adjustment updated\",\"content\":\"Stock adjustment updated by ##staff_member_name## for warehouse ##warehouse_name## for product ##product_name## with ##stock_adjustment_quantity## (##stock_adjustment_type##) quantity\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(8, 0, 1, 'email_templates', 'Stock adjustment deleted', 'stock_adjustment_delete', '{\"title\":\"Stock adjustment deleted\",\"content\":\"Stock adjustment deleted by ##staff_member_name## for warehouse ##warehouse_name## for product ##product_name## with ##stock_adjustment_quantity## (##stock_adjustment_type##) quantity\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(9, 0, 1, 'email_templates', 'Staff Member created', 'staff_member_create', '{\"title\":\"Staff Member created\",\"content\":\"A new staff Member added with ##staff_member_name## name in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(10, 0, 1, 'email_templates', 'Staff Member updated', 'staff_member_update', '{\"title\":\"Staff Member updated\",\"content\":\"Staff Member with name ##staff_member_name## updated in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(11, 0, 1, 'email_templates', 'Staff Member deleted', 'staff_member_delete', '{\"title\":\"Staff Member deleted\",\"content\":\"Staff member with name ##staff_member_name## deleted from your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(12, 0, 1, 'email_templates', 'Purchase created', 'purchases_create', '{\"title\":\"Purchase created\",\"content\":\"A new purhcase added by ##staff_member_name## in your warehouse ##warehouse_name## with invoice number ##invoice_number##.\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(13, 0, 1, 'email_templates', 'Purchase updated', 'purchases_update', '{\"title\":\"Purchase updated\",\"content\":\"Purchase with invoice number ##invoice_number## updated by ##staff_member_name## in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:07', '2024-06-25 01:21:07'),
(14, 0, 1, 'email_templates', 'Purchase deleted', 'purchases_delete', '{\"title\":\"Purchase deleted\",\"content\":\"Purchase with invoice number ##invoice_number## deleted by ##staff_member_name## from your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(15, 0, 1, 'email_templates', 'Purchase created', 'purchase_returns_create', '{\"title\":\"Purchase created\",\"content\":\"A new purhcase return added by ##staff_member_name## in your warehouse ##warehouse_name## with invoice number ##invoice_number##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(16, 0, 1, 'email_templates', 'Purchase updated', 'purchase_returns_update', '{\"title\":\"Purchase updated\",\"content\":\"Purchase return with invoice number ##invoice_number## updated by ##staff_member_name## in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(17, 0, 1, 'email_templates', 'Purchase return deleted', 'purchase_returns_delete', '{\"title\":\"Purchase return deleted\",\"content\":\"Purchase return with invoice number ##invoice_number## deleted by ##staff_member_name## from your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(18, 0, 1, 'email_templates', 'Sales created', 'sales_create', '{\"title\":\"Sales created\",\"content\":\"A new sales added by ##staff_member_name## name in your warehouse ##warehouse_name## with invoice number ##invoice_number##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(19, 0, 1, 'email_templates', 'Sales updated', 'sales_update', '{\"title\":\"Sales updated\",\"content\":\"Sales with invoice number ##invoice_number## updated by ##staff_member_name## in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(20, 0, 1, 'email_templates', 'Sales deleted', 'sales_delete', '{\"title\":\"Sales deleted\",\"content\":\"Sales with invoice number ##invoice_number## deleted by ##staff_member_name## from your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(21, 0, 1, 'email_templates', 'Sales return created', 'sales_returns_create', '{\"title\":\"Sales return created\",\"content\":\"A new sales return added by ##staff_member_name## in your warehouse ##warehouse_name## with invoice number ##invoice_number##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(22, 0, 1, 'email_templates', 'Sales return updated', 'sales_returns_update', '{\"title\":\"Sales return updated\",\"content\":\"Sales return with invoice number ##invoice_number## updated by ##staff_member_name## in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(23, 0, 1, 'email_templates', 'Sales return deleted', 'sales_returns_delete', '{\"title\":\"Sales return deleted\",\"content\":\"Sales return with invoice number ##invoice_number## deleted by ##staff_member_name## from your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(24, 0, 1, 'email_templates', 'Quotations created', 'quotations_create', '{\"title\":\"Quotations created\",\"content\":\"A new quotations added by ##staff_member_name## name in your warehouse ##warehouse_name## with invoice number ##invoice_number##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(25, 0, 1, 'email_templates', 'Quotations updated', 'quotations_update', '{\"title\":\"Quotations updated\",\"content\":\"Quotations with invoice number ##invoice_number## updated by ##staff_member_name## in your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(26, 0, 1, 'email_templates', 'Quotations deleted', 'quotations_delete', '{\"title\":\"Quotations deleted\",\"content\":\"Quotations with invoice number ##invoice_number## deleted by ##staff_member_name## from your warehouse ##warehouse_name##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(27, 0, 1, 'email_templates', 'Expense created', 'expense_create', '{\"title\":\"Expense created\",\"content\":\"A new expense added by ##staff_member_name## in your warehouse ##warehouse_name## with amount ##expense_amount##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(28, 0, 1, 'email_templates', 'Expense updated', 'expense_update', '{\"title\":\"Expense updated\",\"content\":\"Expense updated by ##staff_member_name## in your warehouse ##warehouse_name## with amount ##expense_amount##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08'),
(29, 0, 1, 'email_templates', 'Expense deleted', 'expense_delete', '{\"title\":\"Expense deleted\",\"content\":\"Expense deleted by ##staff_member_name## from your warehouse ##warehouse_name## with amount ##expense_amount##.\"}', NULL, 0, 0, '2024-06-25 01:21:08', '2024-06-25 01:21:08');

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `clock_in_time` time NOT NULL,
  `clock_out_time` time NOT NULL,
  `late_mark_after` int(11) DEFAULT NULL,
  `early_clock_in_time` int(11) DEFAULT NULL,
  `allow_clock_out_till` int(11) DEFAULT NULL,
  `self_clocking` tinyint(1) NOT NULL DEFAULT '1',
  `allowed_ip_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_adjustments`
--

CREATE TABLE `stock_adjustments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` double(8,2) NOT NULL,
  `adjustment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'add',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_history`
--

CREATE TABLE `stock_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` double(8,2) NOT NULL,
  `old_quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `order_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'sales',
  `stock_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in',
  `action_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'add',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_history`
--

INSERT INTO `stock_history` (`id`, `company_id`, `warehouse_id`, `product_id`, `quantity`, `old_quantity`, `order_type`, `stock_type`, `action_type`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 6, 1.00, 0.00, 'sales', 'out', 'add', 1, '2024-07-28 06:16:36', '2024-07-28 06:16:36'),
(2, 1, 1, 7, 1.00, 0.00, 'sales', 'out', 'add', 1, '2024-07-28 06:16:36', '2024-07-28 06:16:36'),
(3, 1, 1, 18, 1.00, 0.00, 'purchases', 'in', 'add', 1, '2024-08-29 01:19:12', '2024-08-29 01:19:12'),
(4, 1, 1, 18, 10.00, 0.00, 'purchases', 'in', 'add', 1, '2024-08-29 01:23:13', '2024-08-29 01:23:13'),
(5, 1, 1, 18, 10.00, 0.00, 'purchases', 'in', 'add', 1, '2024-08-29 01:23:26', '2024-08-29 01:23:26'),
(6, 1, 1, 18, 10.00, 0.00, 'purchases', 'in', 'add', 1, '2024-08-29 01:23:34', '2024-08-29 01:23:34'),
(7, 1, 1, 18, 10.00, 0.00, 'purchases', 'in', 'add', 1, '2024-08-29 01:23:52', '2024-08-29 01:23:52'),
(8, 1, 1, 6, 1.00, 0.00, 'sales', 'out', 'add', 1, '2024-08-29 01:26:14', '2024-08-29 01:26:14'),
(9, 1, 1, 7, 1.00, 0.00, 'sales', 'out', 'add', 1, '2024-08-29 01:26:14', '2024-08-29 01:26:14');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `annual_price` double NOT NULL DEFAULT '0',
  `monthly_price` double NOT NULL DEFAULT '0',
  `max_products` int(10) UNSIGNED NOT NULL DEFAULT '0',
  `modules` text COLLATE utf8mb4_unicode_ci,
  `default` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no',
  `is_popular` tinyint(1) NOT NULL DEFAULT '0',
  `is_private` tinyint(1) NOT NULL DEFAULT '0',
  `billing_cycle` tinyint(4) DEFAULT NULL,
  `stripe_monthly_plan_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_annual_plan_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpay_monthly_plan_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `razorpay_annual_plan_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paystack_monthly_plan_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paystack_annual_plan_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `duration` int(11) DEFAULT '30',
  `notify_before` int(11) DEFAULT NULL,
  `position` smallint(6) DEFAULT NULL,
  `features` text COLLATE utf8mb4_unicode_ci,
  `currency_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `currency_symbol` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '$',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `taxes`
--

CREATE TABLE `taxes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `tax_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'single',
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` double(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `taxes`
--

INSERT INTO `taxes` (`id`, `parent_id`, `tax_type`, `company_id`, `name`, `rate`, `created_at`, `updated_at`) VALUES
(1, NULL, 'single', 1, 'CGST', 5.00, '2024-07-28 02:11:25', '2024-07-28 02:11:25');

-- --------------------------------------------------------

--
-- Table structure for table `translations`
--

CREATE TABLE `translations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `lang_id` bigint(20) UNSIGNED DEFAULT NULL,
  `group` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `translations`
--

INSERT INTO `translations` (`id`, `lang_id`, `group`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1, 1, 'common', 'enabled', 'Enabled', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(2, 1, 'common', 'disabled', 'Disabled', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(3, 1, 'common', 'id', 'Id', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(4, 1, 'common', 'action', 'Action', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(5, 1, 'common', 'placeholder_default_text', 'Please Enter {0}', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(6, 1, 'common', 'placeholder_social_text', 'Please Enter {0} Url', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(7, 1, 'common', 'placeholder_search_text', 'Search By {0}', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(8, 1, 'common', 'select_default_text', 'Select {0}...', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(9, 1, 'common', 'create', 'Create', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(10, 1, 'common', 'edit', 'Edit', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(11, 1, 'common', 'update', 'Update', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(12, 1, 'common', 'cancel', 'Cancel', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(13, 1, 'common', 'delete', 'Delete', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(14, 1, 'common', 'success', 'Success', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(15, 1, 'common', 'error', 'Error', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(16, 1, 'common', 'yes', 'Yes', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(17, 1, 'common', 'no', 'No', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(18, 1, 'common', 'fix_errors', 'Please Fix Below Errors.', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(19, 1, 'common', 'cancelled', 'Cancelled', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(20, 1, 'common', 'pending', 'Pending', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(21, 1, 'common', 'paid', 'Paid', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(22, 1, 'common', 'completed', 'Completed', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(23, 1, 'common', 'save', 'Save', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(24, 1, 'common', 'all', 'All', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(25, 1, 'common', 'name', 'Name', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(26, 1, 'common', 'back', 'Back', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(27, 1, 'common', 'max_amount', 'Max. Amount', '2024-06-25 01:20:35', '2024-06-25 01:20:35'),
(28, 1, 'common', 'date_time', 'Date Time', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(29, 1, 'common', 'select_time', 'Select Time', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(30, 1, 'common', 'start_date', 'Start Date', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(31, 1, 'common', 'end_date', 'End Date', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(32, 1, 'common', 'search', 'Search', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(33, 1, 'common', 'date', 'Date', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(34, 1, 'common', 'out_of_stock', 'Out Of Stock', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(35, 1, 'common', 'pay', 'Pay', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(36, 1, 'common', 'received', 'Received', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(37, 1, 'common', 'with_tax', 'With Tax', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(38, 1, 'common', 'without_tax', 'Without Tax', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(39, 1, 'common', 'invoice_number', 'Invoice Number', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(40, 1, 'common', 'ordered', 'Ordered', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(41, 1, 'common', 'confirmed', 'Confirmed', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(42, 1, 'common', 'processing', 'Processing', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(43, 1, 'common', 'shipping', 'Shipping', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(44, 1, 'common', 'delivered', 'Delivered', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(45, 1, 'common', 'confirm', 'Confirm', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(46, 1, 'common', 'title', 'Title', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(47, 1, 'common', 'value', 'Value', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(48, 1, 'common', 'add', 'Add', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(49, 1, 'common', 'view', 'View', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(50, 1, 'common', 'download', 'Download', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(51, 1, 'common', 'change_order_status', 'Change Order Status', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(52, 1, 'common', 'total', 'Total', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(53, 1, 'common', 'print_invoice', 'Print Invoice', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(54, 1, 'common', 'email', 'Email', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(55, 1, 'common', 'phone', 'Phone', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(56, 1, 'common', 'item', 'Item', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(57, 1, 'common', 'items', 'Items', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(58, 1, 'common', 'qty', 'Qty', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(59, 1, 'common', 'rate', 'Rate', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(60, 1, 'common', 'purchase_code', 'Purchase Code', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(61, 1, 'common', 'verify_purchase', 'Verify Purchase', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(62, 1, 'common', 'buy_now', 'Buy Now', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(63, 1, 'common', 'install', 'Install', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(64, 1, 'common', 'installing', 'Installing', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(65, 1, 'common', 'updating', 'Updating', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(66, 1, 'common', 'free', 'Free', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(67, 1, 'common', 'domain', 'Domain', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(68, 1, 'common', 'verify', 'Verify', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(69, 1, 'common', 'send', 'Send', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(70, 1, 'common', 'upload', 'Upload', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(71, 1, 'common', 'view_all', 'View All', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(72, 1, 'common', 'unpaid', 'Unpaid', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(73, 1, 'common', 'loading', 'Loading', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(74, 1, 'common', 'update_app', 'Update App', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(75, 1, 'common', 'welcome_back', 'Welcome {0}', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(76, 1, 'common', 'off', 'Off', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(77, 1, 'common', 'on_create', 'On Create', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(78, 1, 'common', 'on_update', 'On Update', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(79, 1, 'common', 'on_delete', 'On Delete', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(80, 1, 'common', 'demo_account_credentials', 'Demo account login credentials', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(81, 1, 'common', 'balance', 'Balance', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(82, 1, 'common', 'party', 'Party', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(83, 1, 'common', 'created_by', 'Created By', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(84, 1, 'common', 'import', 'Import', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(85, 1, 'common', 'file', 'File', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(86, 1, 'common', 'copy_url', 'Copy Url', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(87, 1, 'common', 'print', 'Print', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(88, 1, 'common', 'pdf', 'Pdf', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(89, 1, 'common', 'particulars', 'Particulars', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(90, 1, 'common', 'amount', 'Amount', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(91, 1, 'common', 'profit', 'Profit', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(92, 1, 'common', 'profit_reports_by_orders', 'Profit Reports By Orders', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(93, 1, 'common', 'profit_reports_by_payments', 'Profit Reports By Payments', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(94, 1, 'common', 'status', 'Status', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(95, 1, 'common', 'active', 'Active', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(96, 1, 'common', 'inactive', 'Inactive', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(97, 1, 'common', 'verified', 'Verified', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(98, 1, 'common', 'configure', 'Configure', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(99, 1, 'common', 'logo', 'Logo', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(100, 1, 'common', 'comment', 'Comment', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(101, 1, 'common', 'rating', 'Rating', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(102, 1, 'common', 'page_content', 'Page Content', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(103, 1, 'common', 'slug', 'Slug', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(104, 1, 'common', 'question', 'Question', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(105, 1, 'common', 'answer', 'Answer', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(106, 1, 'common', 'description', 'Description', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(107, 1, 'common', 'image', 'Image', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(108, 1, 'common', 'address', 'Address', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(109, 1, 'common', 'not_allowed', 'Not Allowed', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(110, 1, 'common', 'details', 'Details', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(111, 1, 'common', 'excel', 'Excel', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(112, 1, 'common', 'daily_income', 'Daily Income', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(113, 1, 'common', 'average_price', 'Average Price', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(114, 1, 'common', 'module', 'Module', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(115, 1, 'common', 'save_and_new', 'Save & New', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(116, 1, 'common', 'save_and_continue', 'Save & Continue', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(117, 1, 'common', 'clear', 'Clear', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(118, 1, 'common', 'filters', 'Filters', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(119, 1, 'common', 'reset', 'Reset', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(120, 1, 'common', 'preview', 'Preview', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(121, 1, 'common', 'minutes', 'Minutes', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(122, 1, 'common', 'approved', 'Approved', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(123, 1, 'common', 'rejected', 'Rejected', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(124, 1, 'common', 'january', 'January', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(125, 1, 'common', 'february', 'February', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(126, 1, 'common', 'march', 'March', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(127, 1, 'common', 'april', 'April', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(128, 1, 'common', 'may', 'May', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(129, 1, 'common', 'june', 'June', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(130, 1, 'common', 'july', 'July', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(131, 1, 'common', 'august', 'August', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(132, 1, 'common', 'september', 'September', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(133, 1, 'common', 'october', 'October', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(134, 1, 'common', 'november', 'November', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(135, 1, 'common', 'december', 'December', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(136, 1, 'common', 'hrm_permissions', 'HRM Permissions', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(137, 1, 'common', 'am', 'AM', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(138, 1, 'common', 'pm', 'PM', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(139, 1, 'common', 'approved_message', 'Are you sure you want to change status to approved?', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(140, 1, 'common', 'rejected_message', 'Are you sure you want to change status to rejected?', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(141, 1, 'common', 'status_changed', 'Status Changed', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(142, 1, 'common', 'holiday', 'Holiday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(143, 1, 'common', 'weekends', 'Weekends', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(144, 1, 'common', 'month', 'Month', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(145, 1, 'common', 'generated', 'Salary Generated Sucessfully', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(146, 1, 'common', 'assign_to_all', 'Assign To All', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(147, 1, 'common', 'edit_all', 'Edit All', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(148, 1, 'common', 'delete_all', 'Delete All', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(149, 1, 'common', 'approve_reject', 'Approve/Reject', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(150, 1, 'common', 'summary', 'Summary', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(151, 1, 'common', 'leave', 'Leave', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(152, 1, 'common', 'time', 'Time', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(153, 1, 'common', 'sunday', 'Sunday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(154, 1, 'common', 'monday', 'Monday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(155, 1, 'common', 'tuesday', 'Tuesday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(156, 1, 'common', 'wednesday', 'Wednesday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(157, 1, 'common', 'thursday', 'Thursday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(158, 1, 'common', 'friday', 'Friday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(159, 1, 'common', 'saturday', 'Saturday', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(160, 1, 'common', 'pos_invoice', 'POS Invoice', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(161, 1, 'common', 'download_invoice', 'Download Invoice', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(162, 1, 'menu', 'dashboard', 'Dashboard', '2024-06-25 01:20:36', '2024-06-25 01:20:36'),
(163, 1, 'menu', 'stock_management', 'Stock Manager', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(164, 1, 'menu', 'purchase', 'Purchase', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(165, 1, 'menu', 'purchases', 'Purchases', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(166, 1, 'menu', 'purchase_returns', 'Purchase Return / Dr. Note', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(167, 1, 'menu', 'sales', 'Sales', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(168, 1, 'menu', 'sales_return', 'Sales Return', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(169, 1, 'menu', 'sales_returns', 'Sales Return / Cr. Note', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(170, 1, 'menu', 'product_manager', 'Product Manager', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(171, 1, 'menu', 'brands', 'Brands', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(172, 1, 'menu', 'categories', 'Categories', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(173, 1, 'menu', 'products', 'Products', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(174, 1, 'menu', 'expense_manager', 'Expenses', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(175, 1, 'menu', 'expense_categories', 'Expense Categories', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(176, 1, 'menu', 'expenses', 'Expenses', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(177, 1, 'menu', 'users', 'Users', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(178, 1, 'menu', 'parties', 'Parties', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(179, 1, 'menu', 'staff_members', 'Staff Members', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(180, 1, 'menu', 'customers', 'Customers', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(181, 1, 'menu', 'suppliers', 'Suppliers', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(182, 1, 'menu', 'settings', 'Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(183, 1, 'menu', 'company', 'Company Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(184, 1, 'menu', 'profile', 'Profile', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(185, 1, 'menu', 'translations', 'Translations', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(186, 1, 'menu', 'languages', 'Languages', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(187, 1, 'menu', 'warehouses', 'Warehouses', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(188, 1, 'menu', 'roles', 'Role & Permissions', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(189, 1, 'menu', 'taxes', 'Taxes', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(190, 1, 'menu', 'currencies', 'Currencies', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(191, 1, 'menu', 'payment_modes', 'Payment Modes', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(192, 1, 'menu', 'units', 'Units', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(193, 1, 'menu', 'login', 'Login', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(194, 1, 'menu', 'logout', 'Logout', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(195, 1, 'menu', 'reports', 'Reports', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(196, 1, 'menu', 'order_payments', 'Order Payments', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(197, 1, 'menu', 'payments', 'Payments', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(198, 1, 'menu', 'stock_alert', 'Stock Alert', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(199, 1, 'menu', 'users_reports', 'Users Reports', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(200, 1, 'menu', 'warehouses_reports', 'Warehouses Reports', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(201, 1, 'menu', 'pos', 'POS', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(202, 1, 'menu', 'stock_adjustment', 'Stock Adjustment', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(203, 1, 'menu', 'verify_product', 'Verify Product', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(204, 1, 'menu', 'modules', 'Modules', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(205, 1, 'menu', 'storage_settings', 'Storage Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(206, 1, 'menu', 'email_settings', 'Email Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(207, 1, 'menu', 'update_app', 'Update App', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(208, 1, 'menu', 'custom_fields', 'Custom Fields', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(209, 1, 'menu', 'payment_in', 'Payment In', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(210, 1, 'menu', 'payment_out', 'Payment Out', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(211, 1, 'menu', 'cash_bank', 'Cash & Bank', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(212, 1, 'menu', 'sales_summary', 'Sales Summary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(213, 1, 'menu', 'stock_summary', 'Stock Summary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(214, 1, 'menu', 'rate_list', 'Rate List', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(215, 1, 'menu', 'product_sales_summary', 'Product Sales Summary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(216, 1, 'menu', 'homepage', 'Buy online products', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(217, 1, 'menu', 'online_orders', 'Online Orders', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(218, 1, 'menu', 'website_setup', 'Website Setup', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(219, 1, 'menu', 'product_cards', 'Product Cards', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(220, 1, 'menu', 'front_settings', 'Front Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(221, 1, 'menu', 'orders', 'Orders', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(222, 1, 'menu', 'quotations', 'Quotations', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(223, 1, 'menu', 'quotation', 'Quotation', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(224, 1, 'menu', 'quotation_estimate', 'Quotation / Estimate', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(225, 1, 'menu', 'database_backup', 'Database Backup', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(226, 1, 'menu', 'stock_transfer', 'Stock Transfer', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(227, 1, 'menu', 'stock_transfers', 'Stock Transfers', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(228, 1, 'menu', 'profit_loss', 'Profit & Loss', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(229, 1, 'menu', 'companies', 'Companies', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(230, 1, 'menu', 'pos_settings', 'POS Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(231, 1, 'menu', 'setup_company', 'Setup Company', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(232, 1, 'menu', 'expense_reports', 'Expense Reports', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(233, 1, 'menu', 'variations', 'Variations', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(234, 1, 'menu', 'print_barcodes', 'Print Barcode', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(235, 1, 'menu', 'reset_password', 'Reset Password', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(236, 1, 'menu', 'reset', 'Reset', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(237, 1, 'menu', 'submit', 'Submit', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(238, 1, 'menu', 'menu', 'Menu', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(239, 1, 'menu', 'create_account', 'Create Account', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(240, 1, 'menu', 'already_account_login_here', 'Already Registered? Login here', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(241, 1, 'menu', 'departments', 'Departments', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(242, 1, 'menu', 'designations', 'Designations', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(243, 1, 'menu', 'hrm', 'HRM', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(244, 1, 'menu', 'holidays', 'Holidays', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(245, 1, 'menu', 'weekends', 'Weekends', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(246, 1, 'menu', 'leaves_types', 'Leave Types', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(247, 1, 'menu', 'leaves', 'Leaves', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(248, 1, 'menu', 'shifts', 'Shifts', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(249, 1, 'menu', 'pre_payments', 'Pre Payments', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(250, 1, 'menu', 'attendances', 'Attendance', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(251, 1, 'menu', 'staff', 'Staff', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(252, 1, 'menu', 'all_holidays', 'All Holidays', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(253, 1, 'menu', 'leave_types', 'Leave Types', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(254, 1, 'menu', 'remaining_leaves', 'Remaining Leaves', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(255, 1, 'menu', 'unpaid_leaves', 'Unpaid Leaves', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(256, 1, 'menu', 'summary', 'Summary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(257, 1, 'menu', 'awards', 'Awards', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(258, 1, 'menu', 'appreciations', 'Appreciations', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(259, 1, 'menu', 'increments_promotions', 'Increment/Promotion', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(260, 1, 'menu', 'payrolls', 'Payroll', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(261, 1, 'menu', 'dashboards', 'HRM Dashboard', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(262, 1, 'menu', 'attendance_details', 'Attendance Details', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(263, 1, 'menu', 'attendance_summary', 'Attendance Summary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(264, 1, 'menu', 'basic_salaries', 'Basic Salary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(265, 1, 'menu', 'hrm_settings', 'HRM Settings', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(266, 1, 'mobile_app', 'welcome_your_business_overview', 'Welcome, your business overview', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(267, 1, 'mobile_app', 'today', 'Today', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(268, 1, 'mobile_app', 'yesterday', 'Yesterday', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(269, 1, 'mobile_app', 'weekly', 'Weekly', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(270, 1, 'mobile_app', 'monthly', 'Monthly', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(271, 1, 'mobile_app', 'yearly', 'Yearly', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(272, 1, 'mobile_app', 'how_to_use_the_app', 'How to use the app', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(273, 1, 'mobile_app', 'have_not_any_account', 'Haven\'t any account?', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(274, 1, 'mobile_app', 'register', 'Register', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(275, 1, 'department', 'add', 'Add New Department', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(276, 1, 'department', 'edit', 'Edit Department', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(277, 1, 'department', 'created', 'Department Created Successfully', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(278, 1, 'department', 'updated', 'Department Updated Successfully', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(279, 1, 'department', 'deleted', 'Department Deleted Successfully', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(280, 1, 'department', 'department_details', 'Department Details', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(281, 1, 'department', 'delete_message', 'Are you sure you want to delete this department?', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(282, 1, 'department', 'selected_delete_message', 'Are you sure you want to delete selected department?', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(283, 1, 'department', 'display_name', 'Display Name', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(284, 1, 'department', 'name', 'Name', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(285, 1, 'department', 'user_id', 'User', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(286, 1, 'department', 'shift_id', 'Shift', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(287, 1, 'increment_promotion', 'add', 'Add New Increment/Promotion', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(288, 1, 'increment_promotion', 'edit', 'Edit Increment/Promotion', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(289, 1, 'increment_promotion', 'created', 'Increment/Promotion Created Successfully', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(290, 1, 'increment_promotion', 'updated', 'Increment/Promotion Updated Successfully', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(291, 1, 'increment_promotion', 'deleted', 'Increment/Promotion Deleted Successfully', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(292, 1, 'increment_promotion', 'increment_and_promotion_details', 'Increment/Promotion Details', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(293, 1, 'increment_promotion', 'delete_message', 'Are you sure you want to delete this increment/promotion?', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(294, 1, 'increment_promotion', 'selected_delete_message', 'Are you sure you want to delete selected increment/promotion?', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(295, 1, 'increment_promotion', 'type', 'Type', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(296, 1, 'increment_promotion', 'date', 'Date', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(297, 1, 'increment_promotion', 'user_id', 'User', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(298, 1, 'increment_promotion', 'total_duration', 'Total Duration', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(299, 1, 'increment_promotion', 'description', 'Description', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(300, 1, 'increment_promotion', 'net_salary', 'Net Salary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(301, 1, 'increment_promotion', 'promoted_designation_id', 'Promoted Designation', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(302, 1, 'increment_promotion', 'current_designation_id', 'Current Designation', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(303, 1, 'increment_promotion', 'increment', 'Increment', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(304, 1, 'increment_promotion', 'promotion', 'Promotion', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(305, 1, 'increment_promotion', 'increment_promotion', 'Increment/Promotion', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(306, 1, 'increment_promotion', 'details', 'Details', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(307, 1, 'increment_promotion', 'update_basic_salary', 'Update Basic Salary', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(308, 1, 'increment_promotion', 'update_designation', 'Update Designation', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(309, 1, 'designation', 'add', 'Add New Designation', '2024-06-25 01:20:37', '2024-06-25 01:20:37'),
(310, 1, 'designation', 'edit', 'Edit Designation', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(311, 1, 'designation', 'created', 'Designation Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(312, 1, 'designation', 'updated', 'Designation Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(313, 1, 'designation', 'deleted', 'Designation Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(314, 1, 'designation', 'designation_details', 'Designation Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(315, 1, 'designation', 'delete_message', 'Are you sure you want to delete this designation?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(316, 1, 'designation', 'selected_delete_message', 'Are you sure you want to delete selected designation?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(317, 1, 'designation', 'display_name', 'Display Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(318, 1, 'designation', 'name', 'Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(319, 1, 'holiday', 'add', 'Add New Holiday', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(320, 1, 'holiday', 'edit', 'Edit Holiday', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(321, 1, 'holiday', 'created', 'Holiday Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(322, 1, 'holiday', 'updated', 'Holiday Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(323, 1, 'holiday', 'deleted', 'Holiday Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(324, 1, 'holiday', 'holiday_details', 'Holiday Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(325, 1, 'holiday', 'delete_message', 'Are you sure you want to delete this holiday?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(326, 1, 'holiday', 'selected_delete_message', 'Are you sure you want to delete selected holiday?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(327, 1, 'holiday', 'display_name', 'Display Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(328, 1, 'holiday', 'name', 'Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(329, 1, 'holiday', 'year', 'Year', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(330, 1, 'holiday', 'date', 'Date', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(331, 1, 'holiday', 'mark_weekend_holiday', 'Mark Weekend Holiday', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(332, 1, 'holiday', 'created_by', 'Created By', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(333, 1, 'holiday', 'from', 'From', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(334, 1, 'holiday', 'to', 'To', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(335, 1, 'holiday', 'month', 'Month', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(336, 1, 'holiday', 'ocassion_name', 'Ocassion Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(337, 1, 'holiday', 'weekend_marked_successfully', 'Weekend marked successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(338, 1, 'leave_type', 'add', 'Add New Leave Type', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(339, 1, 'leave_type', 'edit', 'Edit Leave Type', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(340, 1, 'leave_type', 'created', 'Leave Type Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(341, 1, 'leave_type', 'updated', 'Leave Type Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(342, 1, 'leave_type', 'deleted', 'Leave Type Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(343, 1, 'leave_type', 'leave_type_details', 'LeaveType Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(344, 1, 'leave_type', 'delete_message', 'Are you sure you want to delete this leave type?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(345, 1, 'leave_type', 'selected_delete_message', 'Are you sure you want to delete selected leave type?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(346, 1, 'leave_type', 'display_name', 'Display Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(347, 1, 'leave_type', 'name', 'Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(348, 1, 'leave_type', 'is_paid', 'Is Paid', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(349, 1, 'leave_type', 'total_leaves', 'Total Leaves', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(350, 1, 'leave_type', 'leave_interval_count', 'Leave Interval Count', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(351, 1, 'leave_type', 'max_leaves_per_month', 'Max Leaves Per Month', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(352, 1, 'leave', 'add', 'Add New Leave', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(353, 1, 'leave', 'edit', 'Edit Leave', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(354, 1, 'leave', 'created', 'Leave Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(355, 1, 'leave', 'updated', 'Leave Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(356, 1, 'leave', 'deleted', 'Leave Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(357, 1, 'leave', 'leave_details', 'LeaveType Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(358, 1, 'leave', 'delete_message', 'Are you sure you want to delete this leave?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(359, 1, 'leave', 'selected_delete_message', 'Are you sure you want to delete selected leave?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(360, 1, 'leave', 'display_name', 'Display Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(361, 1, 'leave', 'user_id', 'User', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(362, 1, 'leave', 'leave_type', 'Leave Type', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(363, 1, 'leave', 'is_paid', 'Is Paid', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(364, 1, 'leave', 'start_date', 'Start Date', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(365, 1, 'leave', 'end_date', 'End Date', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(366, 1, 'leave', 'is_half_day', 'Is Half Day', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(367, 1, 'leave', 'reason', 'Reason', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(368, 1, 'leave', 'file', 'File', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(369, 1, 'leave', 'status', 'Status', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(370, 1, 'leave', 'bill', 'Bill', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(371, 1, 'leave', 'date', 'Date', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(372, 1, 'leave', 'user', 'User', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(373, 1, 'leave', 'leave_status', 'Leave Status', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(374, 1, 'leave', 'department', 'Department', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(375, 1, 'leave', 'employees', 'Employees', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(376, 1, 'leave', 'mark_attendance', 'Mark Attendance By', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(377, 1, 'leave', 'clock_out', 'Clock Out', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(378, 1, 'leave', 'clock_in', 'Clock In', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(379, 1, 'leave', 'late', 'Late', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(380, 1, 'leave', 'half_day', 'Half Day', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(381, 1, 'leave', 'multiple_date', 'You can select multiple dates', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(382, 1, 'leave', 'clock_in_month', 'Clock in Month', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(383, 1, 'leave', 'attendance_overwrite', 'Attendance Overwrite', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(384, 1, 'leave', 'add_multiple', 'Add Multiple Attendance', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(385, 1, 'award', 'add', 'Add New Award', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(386, 1, 'award', 'edit', 'Edit Award', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(387, 1, 'award', 'created', 'Award Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(388, 1, 'award', 'updated', 'Award Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(389, 1, 'award', 'deleted', 'Award Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(390, 1, 'award', 'award_details', 'Arwad Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(391, 1, 'award', 'delete_message', 'Are you sure you want to delete this award?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(392, 1, 'award', 'name', 'Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(393, 1, 'award', 'active', 'Active', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(394, 1, 'award', 'description', 'Description', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(395, 1, 'award', 'award_price', 'Award Price', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(396, 1, 'appreciation', 'add', 'Add New Appreciation', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(397, 1, 'appreciation', 'edit', 'Edit Appreciation', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(398, 1, 'appreciation', 'created', 'Appreciation Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(399, 1, 'appreciation', 'updated', 'Appreciation Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(400, 1, 'appreciation', 'deleted', 'Appreciation Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(401, 1, 'appreciation', 'appreciation_details', 'Arwad Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(402, 1, 'appreciation', 'delete_message', 'Are you sure you want to delete this appreciation?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(403, 1, 'appreciation', 'date', 'Date', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(404, 1, 'appreciation', 'description', 'Description', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(405, 1, 'appreciation', 'user', 'User', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(406, 1, 'appreciation', 'award', 'Award', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(407, 1, 'appreciation', 'price_amount', 'Price Amount', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(408, 1, 'appreciation', 'price_given', 'Price Given', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(409, 1, 'appreciation', 'add_price_given', 'Add Price Given', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(410, 1, 'appreciation', 'price_given_placeholder', 'Holiday Vouchar, Movie Tickets etc...', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(411, 1, 'shift', 'add', 'Add New Shift', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(412, 1, 'shift', 'edit', 'Edit Shift', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(413, 1, 'shift', 'created', 'Shift Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(414, 1, 'shift', 'updated', 'Shift Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(415, 1, 'shift', 'deleted', 'Shift Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(416, 1, 'shift', 'shift_details', 'Shift Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(417, 1, 'shift', 'delete_message', 'Are you sure you want to delete this shift?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(418, 1, 'shift', 'selected_delete_message', 'Are you sure you want to delete selected shift?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(419, 1, 'shift', 'display_name', 'Display Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(420, 1, 'shift', 'name', 'Name', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(421, 1, 'shift', 'clock_in_time', 'Clock In Time', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(422, 1, 'shift', 'clock_out_time', 'Clock Out Time', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(423, 1, 'shift', 'late_mark_after', 'Late Mark After', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(424, 1, 'shift', 'self_clocking', 'Self Clocking', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(425, 1, 'shift', 'allowed_ip_address', 'Allowed IP Address', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(426, 1, 'shift', 'add_new_ip_address', 'Add New IP Address', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(427, 1, 'shift', 'allow_clock_out_till', 'Allow Clock Out Till', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(428, 1, 'shift', 'early_clock_in_time', 'Early Clock In Time', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(429, 1, 'pre_payment', 'add', 'Add New Pre Payment', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(430, 1, 'pre_payment', 'edit', 'Edit Pre Payment', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(431, 1, 'pre_payment', 'created', 'Pre Payment Created Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(432, 1, 'pre_payment', 'updated', 'Pre Payment Updated Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(433, 1, 'pre_payment', 'deleted', 'Pre Payment Deleted Successfully', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(434, 1, 'pre_payment', 'pre_payment_details', 'Pre Payment Details', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(435, 1, 'pre_payment', 'delete_message', 'Are you sure you want to delete this Pre Payment?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(436, 1, 'pre_payment', 'selected_delete_message', 'Are you sure you want to delete selected Pre Payment?', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(437, 1, 'pre_payment', 'user_id', 'User', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(438, 1, 'pre_payment', 'payment_mode_id', 'Payment Mode', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(439, 1, 'pre_payment', 'date_time', 'Date', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(440, 1, 'pre_payment', 'amount', 'Amount', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(441, 1, 'pre_payment', 'notes', 'Notes', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(442, 1, 'pre_payment', 'month', 'Month', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(443, 1, 'pre_payment', 'deduct_from_payroll', 'Deduct From Payroll', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(444, 1, 'pre_payment', 'payroll_month', 'Payroll Month', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(445, 1, 'pre_payment', 'payroll_year', 'Payroll Year', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(446, 1, 'pre_payment', 'on_given_payment_month', 'On Given Payment Month', '2024-06-25 01:20:38', '2024-06-25 01:20:38'),
(447, 1, 'pre_payment', 'another_month', 'Another Month', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(448, 1, 'pre_payment', 'deduct_month', 'Deduct Month', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(449, 1, 'attendance', 'add', 'Add New Attendance', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(450, 1, 'attendance', 'edit', 'Edit Attendance', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(451, 1, 'attendance', 'created', 'Attendance Created Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(452, 1, 'attendance', 'updated', 'Attendance Updated Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(453, 1, 'attendance', 'deleted', 'Attendance Deleted Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(454, 1, 'attendance', 'delete_message', 'Are you sure you want to delete this attendance?', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(455, 1, 'attendance', 'selected_delete_message', 'Are you sure you want to delete selected attendance?', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(456, 1, 'attendance', 'month', 'Month', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(457, 1, 'attendance', 'year', 'Year', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(458, 1, 'attendance', 'user_id', 'Staff Members', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(459, 1, 'attendance', 'name', 'Staff Members', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(460, 1, 'attendance', 'present', 'Present', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(461, 1, 'attendance', 'present_days', 'Present Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(462, 1, 'attendance', 'working_days', 'Working Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(463, 1, 'attendance', 'total_office_time', 'Total Office Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(464, 1, 'attendance', 'half_day', 'Half Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(465, 1, 'attendance', 'absent', 'Absent', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(466, 1, 'attendance', 'holiday', 'Holiday', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(467, 1, 'attendance', 'date', 'Date', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(468, 1, 'attendance', 'on_leave', 'On Leave', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(469, 1, 'attendance', 'status', 'Status', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(470, 1, 'attendance', 'clock_in', 'Clock In', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(471, 1, 'attendance', 'clock_out', 'Clock Out', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(472, 1, 'attendance', 'clocked_time', 'Clocked Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(473, 1, 'attendance', 'other_details', 'Other Details', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(474, 1, 'attendance', 'clock_in_ip', 'Clock-In IP', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(475, 1, 'attendance', 'clock_out_ip', 'Clock-Out IP', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(476, 1, 'attendance', 'hours', 'hrs', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(477, 1, 'attendance', 'minutes', 'mins', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(478, 1, 'attendance', 'late', 'Late', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(479, 1, 'attendance', 'not_marked', 'Not Marked', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(480, 1, 'attendance', 'total_worked_time', 'Total Worked Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(481, 1, 'attendance', 'present_working_days', 'Present / Working Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(482, 1, 'attendance', 'clock_in_date_time', 'Clock In Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(483, 1, 'attendance', 'clock_out_date_time', 'Clock Out Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(484, 1, 'attendance', 'clock_in_ip_address', 'Clock In IP Address', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(485, 1, 'attendance', 'clock_out_ip_address', 'Clock Out IP Address', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(486, 1, 'attendance', 'days', 'Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(487, 1, 'attendance', 'total_duration', 'Total Duration', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(488, 1, 'attendance', 'is_late', 'Is Late', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(489, 1, 'attendance', 'admin', 'Admin', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(490, 1, 'attendance', 'is_half_day', 'Is Half Day', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(491, 1, 'attendance', 'leave_type', 'Leave Type', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(492, 1, 'attendance', 'user', 'Users', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(493, 1, 'attendance', 'half_days', 'Half Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(494, 1, 'attendance', 'reason', 'Reason', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(495, 1, 'payroll', 'add', 'Add New Payroll', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(496, 1, 'payroll', 'edit', 'Edit Payroll', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(497, 1, 'payroll', 'created', 'Payroll Created Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(498, 1, 'payroll', 'updated', 'Payroll Updated Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(499, 1, 'payroll', 'deleted', 'Payroll Deleted Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(500, 1, 'payroll', 'payroll_details', 'Payroll Details', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(501, 1, 'payroll', 'delete_message', 'Are you sure you want to delete this payroll?', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(502, 1, 'payroll', 'month', 'Month', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(503, 1, 'payroll', 'year', 'Year', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(504, 1, 'payroll', 'user_id', 'User', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(505, 1, 'payroll', 'net_salary', 'Net Salary', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(506, 1, 'payroll', 'status', 'Status', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(507, 1, 'payroll', 'payment_date', 'Payment Date', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(508, 1, 'payroll', 'generate', 'Generate', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(509, 1, 'payroll', 'generated', 'Generated', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(510, 1, 'payroll', 'regenerate', 'Regenerate', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(511, 1, 'payroll', 'regenerated', 'Regenerated', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(512, 1, 'payroll', 'bonus', 'Bonus', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(513, 1, 'payroll', 'earning', 'Earning', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(514, 1, 'payroll', 'amount', 'Amount', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(515, 1, 'payroll', 'add_earning', 'Add Earning', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(516, 1, 'payroll', 'deduction', 'Deduction', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(517, 1, 'payroll', 'total_days', 'Total Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(518, 1, 'payroll', 'working_days', 'Working Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(519, 1, 'payroll', 'present_days', 'Present Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39');
INSERT INTO `translations` (`id`, `lang_id`, `group`, `key`, `value`, `created_at`, `updated_at`) VALUES
(520, 1, 'payroll', 'total_office_time', 'Total Office Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(521, 1, 'payroll', 'total_worked_time', 'Total Worked Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(522, 1, 'payroll', 'half_days', 'Half Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(523, 1, 'payroll', 'late_days', 'Late Days', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(524, 1, 'payroll', 'paid_leaves', 'Paid Leaves', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(525, 1, 'payroll', 'unpaid_leaves', 'Unpaid Leaves', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(526, 1, 'payroll', 'holiday_count', 'Holiday Count', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(527, 1, 'payroll', 'leaves', 'Leaves', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(528, 1, 'payroll', 'holiday', 'Holiday', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(529, 1, 'payroll', 'summary', 'Summary', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(530, 1, 'payroll', 'pre_payment_deduction', 'Pre Payment Deduction', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(531, 1, 'payroll', 'salary_component', 'Salary Component', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(532, 1, 'payroll', 'expense_claim', 'Expense Claim', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(533, 1, 'payroll', 'basic_salary', 'Basic Salary', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(534, 1, 'payroll', 'salary_amount', 'Salary Amount', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(535, 1, 'payroll', 'paid', 'Paid', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(536, 1, 'payroll', 'payroll_status', 'Payroll Status', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(537, 1, 'payroll', 'date', 'Date', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(538, 1, 'payroll', 'payment_mode_id', 'Payment Mode', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(539, 1, 'payroll', 'status_generated', 'Status Updated Sucessfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(540, 1, 'payroll', 'setup_basic_salary_to_generate_payroll', 'If you want to generate payroll for an employee then first setup basic salary for that employee.', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(541, 1, 'payroll', 'basic_salary_setup', 'Basic Salary Setup', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(542, 1, 'hrm_dashboard', 'today_attendance', 'Today Attendance', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(543, 1, 'hrm_dashboard', 'current_ip_address', 'Current IP Address', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(544, 1, 'hrm_dashboard', 'current_time', 'Current Time', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(545, 1, 'hrm_dashboard', 'clock_in', 'Clock In', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(546, 1, 'hrm_dashboard', 'clocked_in', 'Clocked In', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(547, 1, 'hrm_dashboard', 'clock_out', 'Clock Out', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(548, 1, 'hrm_dashboard', 'clocked_out', 'Clocked Out', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(549, 1, 'hrm_dashboard', 'office_hours_expired', 'Times Up: Office Hours Expired. Ensure Timely Clock-In and Clock-Out to Keep Attendance Records Accurate.', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(550, 1, 'hrm_dashboard', 'pening_approvals', 'Pending Approvals', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(551, 1, 'hrm_dashboard', 'not_marked', 'Not Marked', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(552, 1, 'hrm_dashboard', 'present', 'Present', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(553, 1, 'hrm_dashboard', 'absent', 'Absent', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(554, 1, 'hrm_dashboard', 'today_is_holiday', 'Today is holiday...', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(555, 1, 'hrm_dashboard', 'you_are_on_leave', 'You are on leave so you cannot clock-in... Enjoy your leave.', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(556, 1, 'hrm_dashboard', 'self_clocking_is_disabled', 'Self clocking is disabled by admin', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(557, 1, 'basic_salary', 'add', 'Add New Basic Salary', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(558, 1, 'basic_salary', 'edit', 'Edit Basic Salary', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(559, 1, 'basic_salary', 'created', 'Basic Salary Created Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(560, 1, 'basic_salary', 'updated', 'Basic Salary Updated Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(561, 1, 'basic_salary', 'deleted', 'Basic Salary Deleted Successfully', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(562, 1, 'basic_salary', 'basic_salary_details', 'Basic Salary Details', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(563, 1, 'basic_salary', 'delete_message', 'Are you sure you want to delete this basic salary?', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(564, 1, 'basic_salary', 'user_id', 'User', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(565, 1, 'basic_salary', 'active', 'Active', '2024-06-25 01:20:39', '2024-06-25 01:20:39'),
(566, 1, 'basic_salary', 'basic_salary', 'Basic Salary', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(567, 1, 'hrm_settings', 'updated', 'HRM Setting Updated Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(568, 1, 'hrm_settings', 'leave_start_month', 'Leave Start Month', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(569, 1, 'hrm_settings', 'late_mark_after', 'Late Mark After', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(570, 1, 'hrm_settings', 'clock_in_time', 'Clock In Time', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(571, 1, 'hrm_settings', 'clock_out_time', 'Clock Out Time', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(572, 1, 'hrm_settings', 'self_clocking', 'Self Clocking', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(573, 1, 'hrm_settings', 'allowed_ip_address', 'Allowed Ip Address', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(574, 1, 'hrm_settings', 'early_clock_in_time', 'Early Clock In Time', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(575, 1, 'hrm_settings', 'allow_clock_out_till', 'Allow Clock Out till', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(576, 1, 'dashboard', 'dashboard', 'Dashboard', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(577, 1, 'dashboard', 'recent_stock_history', 'Recent Stock History', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(578, 1, 'dashboard', 'top_selling_product', 'Top Selling Product', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(579, 1, 'dashboard', 'sales_purchases', 'Sales & Purchases', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(580, 1, 'dashboard', 'total_sales', 'Total Sales', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(581, 1, 'dashboard', 'top_customers', 'Top Customers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(582, 1, 'dashboard', 'total_expenses', 'Total Expenses', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(583, 1, 'dashboard', 'payment_sent', 'Payment Sent', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(584, 1, 'dashboard', 'payment_received', 'Payment Received', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(585, 1, 'dashboard', 'total_sales_items', 'Total Sales Items', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(586, 1, 'dashboard', 'total_sales_returns_items', 'Total Sales Returns Items', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(587, 1, 'dashboard', 'total_purchases_items', 'Total Purchase Items', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(588, 1, 'dashboard', 'total_purchase_returns_items', 'Total Purchase Returns Items', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(589, 1, 'dashboard', 'today', 'Today', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(590, 1, 'dashboard', 'last_7_days', 'Last 7 Days', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(591, 1, 'dashboard', 'this_month', 'This Month', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(592, 1, 'dashboard', 'this_year', 'This Year', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(593, 1, 'dashboard', 'yesterday', 'Yesterday', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(594, 1, 'user', 'email_phone', 'Email or Phone', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(595, 1, 'user', 'user', 'User', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(596, 1, 'user', 'name', 'Name', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(597, 1, 'user', 'created_at', 'Created At', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(598, 1, 'user', 'email', 'Email', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(599, 1, 'user', 'password', 'Password', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(600, 1, 'user', 'login_enabled', 'Login Enabled', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(601, 1, 'user', 'profile_image', 'Profile Image', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(602, 1, 'user', 'company_name', 'Company Name', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(603, 1, 'user', 'phone', 'Phone Number', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(604, 1, 'user', 'address', 'Address', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(605, 1, 'user', 'city', 'City', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(606, 1, 'user', 'state', 'State', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(607, 1, 'user', 'country', 'Country', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(608, 1, 'user', 'zipcode', 'Zipcode', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(609, 1, 'user', 'billing_address', 'Billing Address', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(610, 1, 'user', 'shipping_address', 'Shipping Address', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(611, 1, 'user', 'opening_balance', 'Opening Balance', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(612, 1, 'user', 'credit_period', 'Credit Period', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(613, 1, 'user', 'credit_limit', 'Credit Limit', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(614, 1, 'user', 'to_receive', 'To Collect', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(615, 1, 'user', 'to_pay', 'To Pay', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(616, 1, 'user', 'receive', 'Receive', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(617, 1, 'user', 'pay', 'Pay', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(618, 1, 'user', 'status', 'Status', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(619, 1, 'user', 'role', 'Role', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(620, 1, 'user', 'days', 'Day(s)', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(621, 1, 'user', 'profile_updated', 'Profile Updated Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(622, 1, 'user', 'password_blank', 'Leave blank if you don\'t want to update password.', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(623, 1, 'user', 'total_sales', 'Total Sales', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(624, 1, 'user', 'total_purchases', 'Total Purchases', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(625, 1, 'user', 'walk_in_customer', 'Walk In Customer', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(626, 1, 'user', 'staff_members_details', 'Staff Member Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(627, 1, 'user', 'customers_details', 'Customer Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(628, 1, 'user', 'suppliers_details', 'Supplier Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(629, 1, 'user', 'admin_account_details', 'Admin Account Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(630, 1, 'user', 'tax_number', 'Tax Number', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(631, 1, 'user', 'warehouse_not_changable', 'Warehouse Can Not Be Changed', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(632, 1, 'user', 'sign_in', 'Sign In', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(633, 1, 'user', 'new_password', 'New Password', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(634, 1, 'user', 'confirm_password', 'Confirm Password', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(635, 1, 'user', 'department_id', 'Department', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(636, 1, 'user', 'designation_id', 'Designation', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(637, 1, 'user', 'shift_id', 'Shift', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(638, 1, 'user', 'staff', 'Staff', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(639, 1, 'user', 'basic_salary', 'Basic Salary', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(640, 1, 'print_barcode', 'warehouse', 'Warehouse', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(641, 1, 'print_barcode', 'paper_size', 'Paper Size', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(642, 1, 'print_barcode', 'quantity', 'Quantity', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(643, 1, 'print_barcode', 'name', 'Name', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(644, 1, 'print_barcode', 'delete_message', 'Are you sure you want to delete this product?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(645, 1, 'print_barcode', 'select_name', 'Select Name', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(646, 1, 'print_barcode', 'select_price', 'Select Price', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(647, 1, 'staff_member', 'add', 'Add New Staff Member', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(648, 1, 'staff_member', 'edit', 'Edit Staff Member', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(649, 1, 'staff_member', 'created', 'Staff Member Created Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(650, 1, 'staff_member', 'updated', 'Staff Member Updated Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(651, 1, 'staff_member', 'deleted', 'Staff Member Deleted Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(652, 1, 'staff_member', 'staff_member_details', 'Staff Member Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(653, 1, 'staff_member', 'staff_member', 'Staff Member', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(654, 1, 'staff_member', 'delete_message', 'Are you sure you want to delete this staff member?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(655, 1, 'staff_member', 'selected_delete_message', 'Are you sure you want to delete selected staff member?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(656, 1, 'staff_member', 'import_staff_members', 'Import Staff Members', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(657, 1, 'customer', 'add', 'Add New Customer', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(658, 1, 'customer', 'edit', 'Edit Customer', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(659, 1, 'customer', 'created', 'Customer Created Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(660, 1, 'customer', 'updated', 'Customer Updated Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(661, 1, 'customer', 'deleted', 'Customer Deleted Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(662, 1, 'customer', 'customer_details', 'Customer Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(663, 1, 'customer', 'delete_message', 'Are you sure you want to delete this customer?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(664, 1, 'customer', 'selected_delete_message', 'Are you sure you want to delete selected customer?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(665, 1, 'customer', 'import_customers', 'Import Customers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(666, 1, 'supplier', 'add', 'Add New Supplier', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(667, 1, 'supplier', 'edit', 'Edit Supplier', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(668, 1, 'supplier', 'created', 'Supplier Created Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(669, 1, 'supplier', 'updated', 'Supplier Updated Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(670, 1, 'supplier', 'deleted', 'Supplier Deleted Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(671, 1, 'supplier', 'supplier_details', 'Supplier Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(672, 1, 'supplier', 'delete_message', 'Are you sure you want to delete this supplier?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(673, 1, 'supplier', 'selected_delete_message', 'Are you sure you want to delete selected supplier?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(674, 1, 'supplier', 'import_suppliers', 'Import Suppliers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(675, 1, 'warehouse', 'add', 'Add New Warehouse', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(676, 1, 'warehouse', 'edit', 'Edit Warehouse', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(677, 1, 'warehouse', 'created', 'Warehouse Created Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(678, 1, 'warehouse', 'updated', 'Warehouse Updated Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(679, 1, 'warehouse', 'deleted', 'Warehouse Deleted Successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(680, 1, 'warehouse', 'warehouse_details', 'Warehouse Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(681, 1, 'warehouse', 'warehouse', 'Warehouse', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(682, 1, 'warehouse', 'logo', 'Logo', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(683, 1, 'warehouse', 'dark_logo', 'Dark Logo', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(684, 1, 'warehouse', 'name', 'Name', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(685, 1, 'warehouse', 'slug', 'Slug', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(686, 1, 'warehouse', 'email', 'Email', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(687, 1, 'warehouse', 'phone', 'Phone', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(688, 1, 'warehouse', 'address', 'Billing Address', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(689, 1, 'warehouse', 'show_email_on_invoice', 'Show email on invoice', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(690, 1, 'warehouse', 'show_phone_on_invoice', 'Show phone on invoice', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(691, 1, 'warehouse', 'terms_condition', 'Terms & Conditions', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(692, 1, 'warehouse', 'bank_details', 'Bank Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(693, 1, 'warehouse', 'signature', 'Signature', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(694, 1, 'warehouse', 'delete_message', 'Are you sure you want to delete this warehouse?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(695, 1, 'warehouse', 'selected_delete_message', 'Are you sure you want to delete selected warehouse?', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(696, 1, 'warehouse', 'details_will_be_shown_on_invoice', 'Note: Details added below will be shown on your invoices', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(697, 1, 'warehouse', 'online_store', 'Online Store', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(698, 1, 'warehouse', 'online_store_status_updated', 'Online store status updated successfully', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(699, 1, 'warehouse', 'no_online_store_exists', 'No online store exists for this url. Please contact to admin for support.', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(700, 1, 'warehouse', 'view_online_store', 'View Online Store', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(701, 1, 'warehouse', 'default_pos_order_status', 'POS Default Status', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(702, 1, 'warehouse', 'basic_details', 'Basic Details', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(703, 1, 'warehouse', 'visibility', 'Visibility', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(704, 1, 'warehouse', 'customers_visibility', 'Customers Visibility', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(705, 1, 'warehouse', 'suppliers_visibility', 'Suppliers Visibility', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(706, 1, 'warehouse', 'products_visibility', 'Products Visibility', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(707, 1, 'warehouse', 'view_all_customers', 'View All Customers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(708, 1, 'warehouse', 'view_warehouse_customers', 'View Only Warehouse Customers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(709, 1, 'warehouse', 'view_all_suppliers', 'View All Suppliers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(710, 1, 'warehouse', 'view_warehouse_suppliers', 'View Only Warehouse Suppliers', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(711, 1, 'warehouse', 'view_all_products', 'View All Products', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(712, 1, 'warehouse', 'view_warehouse_products', 'View Only Warehouse Products', '2024-06-25 01:20:40', '2024-06-25 01:20:40'),
(713, 1, 'warehouse', 'show_mrp_on_invoice', 'Show MRP On Invoice', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(714, 1, 'warehouse', 'show_discount_tax_on_invoice', 'Show discount & Tax On Invoice', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(715, 1, 'warehouse', 'barcode_type', 'Barcode Type', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(716, 1, 'warehouse', 'barcode', 'Barcode', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(717, 1, 'warehouse', 'qrcode', 'QR Code', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(718, 1, 'front_website', 'home', 'Home', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(719, 1, 'front_website', 'features', 'Features', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(720, 1, 'front_website', 'pricing', 'Pricing', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(721, 1, 'front_website', 'contact', 'Contact', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(722, 1, 'front_website', 'links', 'Links', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(723, 1, 'front_website', 'pages', 'Pages', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(724, 1, 'front_website', 'register', 'Register', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(725, 1, 'front_website', 'company_name', 'Company Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(726, 1, 'front_website', 'email', 'Email', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(727, 1, 'front_website', 'password', 'Password', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(728, 1, 'front_website', 'confirm_password', 'Confirm Password', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(729, 1, 'front_website', 'login', 'Login', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(730, 1, 'front_website', 'first_name', 'First Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(731, 1, 'front_website', 'last_name', 'Last Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(732, 1, 'front_website', 'address', 'Address', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(733, 1, 'front_website', 'phone', 'Phone', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(734, 1, 'front_website', 'send_message', 'Send Message', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(735, 1, 'front_website', 'register_thank_you', 'Thank you for registration. Please login to get started', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(736, 1, 'front_website', 'error_contact_support', 'Some error occurred when inserting the data. Please try again or contact support', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(737, 1, 'front_website', 'contact_us_submit_message', 'Thanks for contacting us. We will catch you soon.', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(738, 1, 'role', 'add', 'Add New Role', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(739, 1, 'role', 'edit', 'Edit Role', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(740, 1, 'role', 'created', 'Role Created Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(741, 1, 'role', 'updated', 'Role Updated Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(742, 1, 'role', 'deleted', 'Role Deleted Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(743, 1, 'role', 'role_details', 'Role Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(744, 1, 'role', 'delete_message', 'Are you sure you want to delete this role?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(745, 1, 'role', 'selected_delete_message', 'Are you sure you want to delete selected role?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(746, 1, 'role', 'display_name', 'Display Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(747, 1, 'role', 'role_name', 'Role Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(748, 1, 'role', 'description', 'Description', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(749, 1, 'role', 'user_management', 'User Management', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(750, 1, 'role', 'permissions', 'Permissions', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(751, 1, 'role', 'approve_reject_leaves', 'Approve/Reject Leaves', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(752, 1, 'role', 'mark_weekend', 'Mark Weekend', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(753, 1, 'report', 'by_order', 'By Orders', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(754, 1, 'report', 'by_dates', 'By Dates', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(755, 1, 'report', 'select_date', 'Select Date', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(756, 1, 'report', 'select_date_message', 'Select a date to view the report', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(757, 1, 'company', 'add', 'Add New Company', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(758, 1, 'company', 'edit', 'Edit Company', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(759, 1, 'company', 'created', 'Company Created Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(760, 1, 'company', 'updated', 'Company Updated Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(761, 1, 'company', 'deleted', 'Company Deleted Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(762, 1, 'company', 'currency_details', 'Company Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(763, 1, 'company', 'delete_message', 'Are you sure you want to delete this company?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(764, 1, 'company', 'selected_delete_message', 'Are you sure you want to delete selected company?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(765, 1, 'company', 'name', 'Company Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(766, 1, 'company', 'short_name', 'Company Short Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(767, 1, 'company', 'email', 'Company Email', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(768, 1, 'company', 'phone', 'Company Phone', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(769, 1, 'company', 'address', 'Company Address', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(770, 1, 'company', 'currency', 'Currency', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(771, 1, 'company', 'logo', 'Company Logo', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(772, 1, 'company', 'left_sidebar_theme', 'Left Sidebar Theme', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(773, 1, 'company', 'dark', 'Dark', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(774, 1, 'company', 'light', 'Light', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(775, 1, 'company', 'dark_logo', 'Dark Logo', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(776, 1, 'company', 'light_logo', 'Light Logo', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(777, 1, 'company', 'small_dark_logo', 'Small Dark Logo', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(778, 1, 'company', 'small_light_logo', 'Small Light Logo', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(779, 1, 'company', 'primary_color', 'Primary Color', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(780, 1, 'company', 'default_timezone', 'Default Timezone', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(781, 1, 'company', 'date_format', 'Date Format', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(782, 1, 'company', 'time_format', 'Time Format', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(783, 1, 'company', 'auto_detect_timezone', 'Auto Detect Timezone', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(784, 1, 'company', 'app_debug', 'App Debug', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(785, 1, 'company', 'update_app_notification', 'Update App Notitication', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(786, 1, 'company', 'login_image', 'Login Image', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(787, 1, 'company', 'layout', 'Layout', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(788, 1, 'company', 'rtl', 'RTL', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(789, 1, 'company', 'ltr', 'LTR', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(790, 1, 'company', 'language', 'Language', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(791, 1, 'company', 'shortcut_menu_Placement', 'Add Menu Placement', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(792, 1, 'company', 'top_and_bottom', 'Top & Bottom', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(793, 1, 'company', 'top_header', 'Top Header', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(794, 1, 'company', 'bottom_corner', 'Bottom Conrer', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(795, 1, 'company', 'shortcut_menu_setting', 'Add Menu Settings', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(796, 1, 'company', 'menu_setting_updated', 'Menu Setting Updated', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(797, 1, 'company', 'basic_details', 'Basic Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(798, 1, 'company', 'details', 'Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(799, 1, 'company', 'register_date', 'Register Date', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(800, 1, 'company', 'total_users', 'Total Users', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(801, 1, 'tax', 'add', 'Add New Tax', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(802, 1, 'tax', 'edit', 'Edit Tax', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(803, 1, 'tax', 'created', 'Tax Created Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(804, 1, 'tax', 'updated', 'Tax Updated Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(805, 1, 'tax', 'deleted', 'Tax Deleted Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(806, 1, 'tax', 'tax_details', 'Tax Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(807, 1, 'tax', 'delete_message', 'Are you sure you want to delete this tax?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(808, 1, 'tax', 'selected_delete_message', 'Are you sure you want to delete selected tax?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(809, 1, 'tax', 'display_name', 'Display Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(810, 1, 'tax', 'name', 'Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(811, 1, 'tax', 'rate', 'Tax Rate', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(812, 1, 'tax', 'no_tax', 'No Tax', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(813, 1, 'tax', 'tax_type', 'Tax Type', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(814, 1, 'tax', 'single', 'Single', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(815, 1, 'tax', 'multiple', 'Multiple', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(816, 1, 'tax', 'multiple_tax', 'Multiple Tax', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(817, 1, 'variation', 'add', 'Add New Variation', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(818, 1, 'variation', 'edit', 'Edit Variation', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(819, 1, 'variation', 'created', 'Variation Created Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(820, 1, 'variation', 'updated', 'Variation Updated Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(821, 1, 'variation', 'deleted', 'Variation Deleted Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(822, 1, 'variation', 'variation_details', 'Variation Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(823, 1, 'variation', 'delete_message', 'Are you sure you want to delete this variation?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(824, 1, 'variation', 'selected_delete_message', 'Are you sure you want to delete selected variation?', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(825, 1, 'variation', 'variation_name', 'Variation Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(826, 1, 'variation', 'name', 'Name', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(827, 1, 'variation', 'value', 'Value', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(828, 1, 'variation', 'add_new_value', 'Add New Value', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(829, 1, 'variation', 'variation_values', 'Variation Values', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(830, 1, 'currency', 'add', 'Add New Currency', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(831, 1, 'currency', 'edit', 'Edit Currency', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(832, 1, 'currency', 'created', 'Currency Created Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(833, 1, 'currency', 'updated', 'Currency Updated Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(834, 1, 'currency', 'deleted', 'Currency Deleted Successfully', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(835, 1, 'currency', 'currency_details', 'Currency Details', '2024-06-25 01:20:41', '2024-06-25 01:20:41'),
(836, 1, 'currency', 'delete_message', 'Are you sure you want to delete this currency?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(837, 1, 'currency', 'selected_delete_message', 'Are you sure you want to delete selected currency?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(838, 1, 'currency', 'name', 'Currency Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(839, 1, 'currency', 'symbol', 'Currency Symbol', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(840, 1, 'currency', 'position', 'Currency Position', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(841, 1, 'currency', 'front', 'Front', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(842, 1, 'currency', 'front_position_example', 'Example : $100', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(843, 1, 'currency', 'behind', 'Behind', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(844, 1, 'currency', 'behind_position_example', 'Example : 100$', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(845, 1, 'currency', 'code', 'Currency Code', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(846, 1, 'payment_mode', 'add', 'Add New Payment Mode', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(847, 1, 'payment_mode', 'edit', 'Edit Payment Mode', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(848, 1, 'payment_mode', 'created', 'Payment Mode Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(849, 1, 'payment_mode', 'updated', 'Payment Mode Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(850, 1, 'payment_mode', 'deleted', 'Payment Mode Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(851, 1, 'payment_mode', 'payment_mode_details', 'Payment Mode Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(852, 1, 'payment_mode', 'delete_message', 'Are you sure you want to delete this payment mode?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(853, 1, 'payment_mode', 'selected_delete_message', 'Are you sure you want to delete selected payment mode?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(854, 1, 'payment_mode', 'name', 'Payment Mode Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(855, 1, 'payment_mode', 'mode_type', 'Mode Type', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(856, 1, 'payment_mode', 'cash', 'Cash', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(857, 1, 'payment_mode', 'bank', 'Bank', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(858, 1, 'unit', 'add', 'Add New Unit', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(859, 1, 'unit', 'edit', 'Edit Unit', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(860, 1, 'unit', 'created', 'Unit Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(861, 1, 'unit', 'updated', 'Unit Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(862, 1, 'unit', 'deleted', 'Unit Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(863, 1, 'unit', 'delete_message', 'Are you sure you want to delete this unit?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(864, 1, 'unit', 'selected_delete_message', 'Are you sure you want to delete selected unit?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(865, 1, 'unit', 'unit_details', 'Unit Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(866, 1, 'unit', 'name', 'Unit Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(867, 1, 'unit', 'short_name', 'Short Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(868, 1, 'unit', 'base_unit', 'Base Unit', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(869, 1, 'unit', 'operator', 'Operator', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(870, 1, 'unit', 'multiply', 'Multiply (*)', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(871, 1, 'unit', 'divide', 'Divide (/)', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(872, 1, 'unit', 'operator_value', 'Operator Value', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(873, 1, 'custom_field', 'add', 'Add New Custom Field', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(874, 1, 'custom_field', 'edit', 'Edit Custom Field', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(875, 1, 'custom_field', 'created', 'Custom Field Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(876, 1, 'custom_field', 'updated', 'Custom Field Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(877, 1, 'custom_field', 'deleted', 'Custom Field Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(878, 1, 'custom_field', 'delete_message', 'Are you sure you want to delete this custom field?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(879, 1, 'custom_field', 'selected_delete_message', 'Are you sure you want to delete selected custom field?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(880, 1, 'custom_field', 'name', 'Field Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(881, 1, 'custom_field', 'value', 'Default Value', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(882, 1, 'custom_field', 'type', 'Field Type', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(883, 1, 'module', 'name', 'Module Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(884, 1, 'module', 'verified', 'Verified', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(885, 1, 'module', 'verify_purchase_code', 'Verify Purchase Code', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(886, 1, 'module', 'current_version', 'Current Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(887, 1, 'module', 'latest_version', 'Latest Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(888, 1, 'module', 'status', 'Status', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(889, 1, 'module', 'installed_modules', 'Installed Modules', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(890, 1, 'module', 'other_modules', 'Other Modules', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(891, 1, 'module', 'module_status_updated', 'Modules Status Updated', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(892, 1, 'module', 'downloading_completed', 'Download Completed', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(893, 1, 'module', 'extract_zip_file', 'Extract Zip File', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(894, 1, 'module', 'file_extracted', 'Zip File Extracted', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(895, 1, 'update_app', 'app_details', 'App Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(896, 1, 'update_app', 'name', 'Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(897, 1, 'update_app', 'value', 'Value', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(898, 1, 'update_app', 'php_version', 'PHP Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(899, 1, 'update_app', 'app_version', 'App Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(900, 1, 'update_app', 'laravel_version', 'Laravel Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(901, 1, 'update_app', 'mysql_version', 'MySQL Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(902, 1, 'update_app', 'vue_version', 'Vue Version', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(903, 1, 'update_app', 'update_app', 'Update App', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(904, 1, 'update_app', 'update_now', 'Update Now', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(905, 1, 'update_app', 'update_available', 'Update Available', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(906, 1, 'update_app', 'verify_again', 'Verify Again', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(907, 1, 'update_app', 'verify_failed', 'Verification Failed', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(908, 1, 'update_app', 'verify_failed_message', 'Your application is not registerd with us. Please verify it', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(909, 1, 'update_app', 'verified_with_other_domain', 'Your purchase code is registerd with other doamin. Please verfiy your purhcase code', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(910, 1, 'expense_category', 'add', 'Add New Expense Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(911, 1, 'expense_category', 'edit', 'Edit Expense Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(912, 1, 'expense_category', 'created', 'Expense Category Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(913, 1, 'expense_category', 'updated', 'Expense Category Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(914, 1, 'expense_category', 'deleted', 'Expense Category Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(915, 1, 'expense_category', 'delete_message', 'Are you sure you want to delete this expense category?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(916, 1, 'expense_category', 'selected_delete_message', 'Are you sure you want to delete selected expense category?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(917, 1, 'expense_category', 'expense_category_details', 'Expense Category Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(918, 1, 'expense_category', 'name', 'Expense Category Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(919, 1, 'expense_category', 'description', 'Description', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(920, 1, 'expense', 'add', 'Add New Expense', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(921, 1, 'expense', 'edit', 'Edit Expense', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(922, 1, 'expense', 'created', 'Expense Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(923, 1, 'expense', 'updated', 'Expense Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(924, 1, 'expense', 'deleted', 'Expense Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(925, 1, 'expense', 'delete_message', 'Are you sure you want to delete this expense?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(926, 1, 'expense', 'selected_delete_message', 'Are you sure you want to delete selected expense?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(927, 1, 'expense', 'details', 'Expense Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(928, 1, 'expense', 'warehouse', 'Warehouse', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(929, 1, 'expense', 'expense_category', 'Expense Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(930, 1, 'expense', 'date', 'Date', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(931, 1, 'expense', 'amount', 'Amount', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(932, 1, 'expense', 'bill', 'Expense Bill', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(933, 1, 'expense', 'user', 'User', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(934, 1, 'expense', 'created_by_user', 'User', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(935, 1, 'expense', 'notes', 'Notes', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(936, 1, 'brand', 'add', 'Add New Brand', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(937, 1, 'brand', 'edit', 'Edit Brand', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(938, 1, 'brand', 'created', 'Brand Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(939, 1, 'brand', 'updated', 'Brand Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(940, 1, 'brand', 'deleted', 'Brand Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(941, 1, 'brand', 'delete_message', 'Are you sure you want to delete this brand?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(942, 1, 'brand', 'selected_delete_message', 'Are you sure you want to delete selected brand?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(943, 1, 'brand', 'details', 'Brand Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(944, 1, 'brand', 'name', 'Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(945, 1, 'brand', 'slug', 'Slug', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(946, 1, 'brand', 'logo', 'Brand Logo', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(947, 1, 'brand', 'import_brands', 'Import Brands', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(948, 1, 'category', 'add', 'Add New Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(949, 1, 'category', 'edit', 'Edit Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(950, 1, 'category', 'created', 'Category Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(951, 1, 'category', 'updated', 'Category Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(952, 1, 'category', 'deleted', 'Category Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(953, 1, 'category', 'delete_message', 'Are you sure you want to delete this category?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(954, 1, 'category', 'selected_delete_message', 'Are you sure you want to delete selected category?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(955, 1, 'category', 'details', 'Category Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(956, 1, 'category', 'category', 'Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(957, 1, 'category', 'name', 'Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(958, 1, 'category', 'slug', 'Slug', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(959, 1, 'category', 'logo', 'Category Logo', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(960, 1, 'category', 'parent_category', 'Parent Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(961, 1, 'category', 'no_parent_category', 'No Parent Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(962, 1, 'category', 'import_categories', 'Import Categories', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(963, 1, 'product', 'add', 'Add New Product', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(964, 1, 'product', 'edit', 'Edit Product', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(965, 1, 'product', 'created', 'Product Created Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(966, 1, 'product', 'updated', 'Product Updated Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(967, 1, 'product', 'deleted', 'Product Deleted Successfully', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(968, 1, 'product', 'delete_message', 'Are you sure you want to delete this product?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(969, 1, 'product', 'selected_delete_message', 'Are you sure you want to delete selected product?', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(970, 1, 'product', 'details', 'Product Details', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(971, 1, 'product', 'name', 'Name', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(972, 1, 'product', 'slug', 'Slug', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(973, 1, 'product', 'sku', 'SKU', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(974, 1, 'product', 'image', 'Image', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(975, 1, 'product', 'quantitiy_alert', 'Quantity Alert', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(976, 1, 'product', 'brand', 'Brand', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(977, 1, 'product', 'category', 'Category', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(978, 1, 'product', 'price', 'Price', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(979, 1, 'product', 'mrp', 'MRP', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(980, 1, 'product', 'purchase_price', 'Purchase Price', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(981, 1, 'product', 'sales_price', 'Sales Price', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(982, 1, 'product', 'tax_type', 'Tax Type', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(983, 1, 'product', 'description', 'Description', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(984, 1, 'product', 'product', 'Product', '2024-06-25 01:20:42', '2024-06-25 01:20:42'),
(985, 1, 'product', 'quantity', 'Quantity', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(986, 1, 'product', 'discount', 'Discount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(987, 1, 'product', 'tax', 'Tax', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(988, 1, 'product', 'subtotal', 'SubTotal', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(989, 1, 'product', 'unit', 'Unit', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(990, 1, 'product', 'unit_price', 'Unit Price', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(991, 1, 'product', 'avl_qty', 'Avl. qty:', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(992, 1, 'product', 'order_items', 'Order Items', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(993, 1, 'product', 'inclusive', 'Inclusive', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(994, 1, 'product', 'exclusive', 'Exclusive', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(995, 1, 'product', 'stocks', 'Stocks', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(996, 1, 'product', 'stock_quantity', 'Stock Quantity', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(997, 1, 'product', 'product_orders', 'Product Orders', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(998, 1, 'product', 'stock_history', 'Stock History', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(999, 1, 'product', 'current_stock', 'Current Stock', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1000, 1, 'product', 'item_code', 'Item Code', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1001, 1, 'product', 'barcode_symbology', 'Barcode Symbology', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1002, 1, 'product', 'barcode', 'Barcode', '2024-06-25 01:20:43', '2024-06-25 01:20:43');
INSERT INTO `translations` (`id`, `lang_id`, `group`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1003, 1, 'product', 'view_barcode', 'ViewCode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1004, 1, 'product', 'generate_barcode', 'Generate Barcode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1005, 1, 'product', 'generate_bar', 'Generate', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1006, 1, 'product', 'print_barcode', 'Print Barcode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1007, 1, 'product', 'price_tax', 'Price & Tax', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1008, 1, 'product', 'variant_details', 'Variants Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1009, 1, 'product', 'custom_fields', 'Custom Fields', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1010, 1, 'product', 'wholesale_rate', 'Wholesale Rate', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1011, 1, 'product', 'wholesale_price', 'Wholesale Price', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1012, 1, 'product', 'wholesale_quantity', 'Wholesale Quantity', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1013, 1, 'product', 'enter_min_quantity', 'Enter Minimum Quantity', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1014, 1, 'product', 'opening_stock', 'Opening Stock', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1015, 1, 'product', 'opening_stock_date', 'Opening Stock Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1016, 1, 'product', 'stock_value', 'Stock Value', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1017, 1, 'product', 'by_purchase', 'By Purchase', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1018, 1, 'product', 'by_sales', 'By Sales', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1019, 1, 'product', 'unit_sold', 'Unit Sold', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1020, 1, 'product', 'import_products', 'Import Products', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1021, 1, 'product', 'total_purchase_price', 'Total Purchase Price', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1022, 1, 'product', 'total_sales_price', 'Total Sales Price', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1023, 1, 'product', 'product_type', 'Product Type', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1024, 1, 'product', 'search_scan_product', 'Search Product Name / Item Code / Scan bar code', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1025, 1, 'product', 'product_history', 'Product History', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1026, 1, 'product', 'single', 'Single', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1027, 1, 'product', 'variable', 'Variable', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1028, 1, 'product', 'service', 'Service', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1029, 1, 'variations', 'add', 'Add Variation', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1030, 1, 'variations', 'edit', 'Edit Variation', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1031, 1, 'variations', 'add_variation_message', 'Select Variant and Variant Type From Below Dropdown and Then Click on + Add Variation Button', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1032, 1, 'variations', 'single_type_product', 'Single Type Product', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1033, 1, 'variations', 'variant_type_product', 'Variant Type Product', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1034, 1, 'variations', 'variation', 'Variation', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1035, 1, 'variations', 'variant_value', 'Variant Value', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1036, 1, 'variations', 'service_type_product', 'Service Type Product', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1037, 1, 'stock', 'order_type', 'Order Type', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1038, 1, 'stock', 'order_date', 'Order Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1039, 1, 'stock', 'warehouse', 'Warehouse', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1040, 1, 'stock', 'supplier', 'Supplier', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1041, 1, 'stock', 'customer', 'Customer', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1042, 1, 'stock', 'product', 'Product', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1043, 1, 'stock', 'invoice_number', 'Invoice Number', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1044, 1, 'stock', 'invoie_number_blank', 'Leave it blank to generate automatically', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1045, 1, 'stock', 'notes', 'Notes', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1046, 1, 'stock', 'status', 'Order Status', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1047, 1, 'stock', 'order_tax', 'Order Tax', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1048, 1, 'stock', 'discount', 'Discount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1049, 1, 'stock', 'shipping', 'Shipping', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1050, 1, 'stock', 'grand_total', 'Grand Total', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1051, 1, 'stock', 'remarks', 'Remarks', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1052, 1, 'stock', 'pay_now', 'Pay Now', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1053, 1, 'stock', 'reset', 'Reset', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1054, 1, 'stock', 'total_items', 'Total Items', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1055, 1, 'stock', 'paying_amount', 'Paying Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1056, 1, 'stock', 'payable_amount', 'Payable Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1057, 1, 'stock', 'change_return', 'Change Return', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1058, 1, 'stock', 'order_details', 'Order Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1059, 1, 'stock', 'order_canceled', 'Order Canceled Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1060, 1, 'stock', 'order_cancel_message', 'Are you sure you want to cancel this order?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1061, 1, 'stock', 'view_order', 'View Order', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1062, 1, 'stock', 'order_id', 'Order Id', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1063, 1, 'stock', 'shipping_address', 'Shipping Address', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1064, 1, 'stock', 'billing_address', 'Billing Address', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1065, 1, 'stock', 'order_taken_by', 'Order Taken By', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1066, 1, 'stock', 'no_product_found', 'No product found for selected resource', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1067, 1, 'stock', 'sold_by', 'Sold By', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1068, 1, 'stock', 'complete_order', 'Complete Order', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1069, 1, 'stock', 'add_order_item', 'Add Order Item', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1070, 1, 'stock', 'search_item_to_add', 'Search item to add in your order', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1071, 1, 'stock', 'add_pay', 'Add Pay', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1072, 1, 'stock', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1073, 1, 'stock', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1074, 1, 'stock', 'paid_payment', 'Paid Payment', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1075, 1, 'purchase', 'add', 'Add New Purchase', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1076, 1, 'purchase', 'edit', 'Edit Purchase', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1077, 1, 'purchase', 'details', 'Purchase Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1078, 1, 'purchase', 'created', 'Purchase Created Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1079, 1, 'purchase', 'updated', 'Purchase Updated Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1080, 1, 'purchase', 'deleted', 'Purchase Deleted Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1081, 1, 'purchase', 'delete_message', 'Are you sure you want to delete this purchase?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1082, 1, 'purchase', 'selected_delete_message', 'Are you sure you want to delete selected purchase?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1083, 1, 'purchase', 'purchase_date', 'Purchase Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1084, 1, 'purchase', 'purchase_status', 'Purchase Status', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1085, 1, 'purchase', 'user', 'Supplier', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1086, 1, 'purchase', 'add_pay', 'Add Pay', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1087, 1, 'purchase', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1088, 1, 'purchase', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1089, 1, 'sales', 'add', 'Add New Sales', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1090, 1, 'sales', 'edit', 'Edit Sales', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1091, 1, 'sales', 'details', 'Sales Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1092, 1, 'sales', 'created', 'Sales Created Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1093, 1, 'sales', 'updated', 'Sales Updated Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1094, 1, 'sales', 'deleted', 'Sales Deleted Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1095, 1, 'sales', 'delete_message', 'Are you sure you want to delete this sales?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1096, 1, 'sales', 'selected_delete_message', 'Are you sure you want to delete selected sales?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1097, 1, 'sales', 'sales_date', 'Sales Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1098, 1, 'sales', 'sales_status', 'Sales Status', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1099, 1, 'sales', 'user', 'Customer', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1100, 1, 'sales', 'tax_invoice', 'TAX INVOICE', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1101, 1, 'sales', 'invoice', 'Invoice', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1102, 1, 'sales', 'add_pay', 'Add Pay', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1103, 1, 'sales', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1104, 1, 'sales', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1105, 1, 'purchase_returns', 'add', 'Add New Purchase Return', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1106, 1, 'purchase_returns', 'edit', 'Edit Purchase Return', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1107, 1, 'purchase_returns', 'details', 'Purchase Return Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1108, 1, 'purchase_returns', 'created', 'Purchase Return Created Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1109, 1, 'purchase_returns', 'updated', 'Purchase Return Updated Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1110, 1, 'purchase_returns', 'deleted', 'Purchase Return Deleted Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1111, 1, 'purchase_returns', 'delete_message', 'Are you sure you want to delete this purchase return?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1112, 1, 'purchase_returns', 'selected_delete_message', 'Are you sure you want to delete selected purchase return?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1113, 1, 'purchase_returns', 'purchase_returns_date', 'Return Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1114, 1, 'purchase_returns', 'purchase_returns_status', 'Return Status', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1115, 1, 'purchase_returns', 'user', 'Supplier', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1116, 1, 'purchase_returns', 'add_pay', 'Add Pay', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1117, 1, 'purchase_returns', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1118, 1, 'purchase_returns', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1119, 1, 'sales_returns', 'add', 'Add New Sales Return', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1120, 1, 'sales_returns', 'edit', 'Edit Sales Return', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1121, 1, 'sales_returns', 'details', 'Sales Return Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1122, 1, 'sales_returns', 'created', 'Sales Return Created Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1123, 1, 'sales_returns', 'updated', 'Sales Return Updated Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1124, 1, 'sales_returns', 'deleted', 'Sales Return Deleted Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1125, 1, 'sales_returns', 'delete_message', 'Are you sure you want to delete this sales return?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1126, 1, 'sales_returns', 'selected_delete_message', 'Are you sure you want to delete selected sales return?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1127, 1, 'sales_returns', 'sales_returns_date', 'Return Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1128, 1, 'sales_returns', 'sales_returns_status', 'Return Status', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1129, 1, 'sales_returns', 'user', 'Customer', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1130, 1, 'sales_returns', 'add_pay', 'Add Pay', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1131, 1, 'sales_returns', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1132, 1, 'sales_returns', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1133, 1, 'quotation', 'add', 'Add New Quotation', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1134, 1, 'quotation', 'edit', 'Edit Quotation', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1135, 1, 'quotation', 'details', 'Quotation Details', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1136, 1, 'quotation', 'created', 'Quotation Created Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1137, 1, 'quotation', 'updated', 'Quotation Updated Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1138, 1, 'quotation', 'deleted', 'Quotation Deleted Successfully', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1139, 1, 'quotation', 'delete_message', 'Are you sure you want to delete this quotation/estimate?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1140, 1, 'quotation', 'selected_delete_message', 'Are you sure you want to delete selected quotation/estimate?', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1141, 1, 'quotation', 'quotation_date', 'Quotation Date', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1142, 1, 'quotation', 'quotation_status', 'Quotation Status', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1143, 1, 'quotation', 'user', 'Customer', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1144, 1, 'quotation', 'tax_invoice', 'TAX INVOICE', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1145, 1, 'quotation', 'invoice', 'Invoice', '2024-06-25 01:20:43', '2024-06-25 01:20:43'),
(1146, 1, 'quotation', 'convert_to_sale', 'Convert to sale', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1147, 1, 'quotation', 'convert_message', 'Are you really want to convert this quotation to sales?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1148, 1, 'quotation', 'quotation_converted_to_sales', 'Quotation converted to sales successfully.', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1149, 1, 'quotation', 'add_pay', 'Add Pay', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1150, 1, 'quotation', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1151, 1, 'quotation', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1152, 1, 'payments', 'add', 'Add New Payment', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1153, 1, 'payments', 'edit', 'Edit Payment', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1154, 1, 'payments', 'details', 'Payment Details', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1155, 1, 'payments', 'created', 'Payment Created Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1156, 1, 'payments', 'updated', 'Payment Updated Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1157, 1, 'payments', 'deleted', 'Payment Deleted Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1158, 1, 'payments', 'delete_message', 'Are you sure you want to delete this payment?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1159, 1, 'payments', 'selected_delete_message', 'Are you sure you want to delete selected payment?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1160, 1, 'payments', 'user', 'User', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1161, 1, 'payments', 'amount', 'Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1162, 1, 'payments', 'invoice_amount', 'Invoice Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1163, 1, 'payments', 'payment_number', 'Reference Number', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1164, 1, 'payments', 'payments', 'Payments', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1165, 1, 'payments', 'date', 'Payment Date', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1166, 1, 'payments', 'due_amount', 'Due Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1167, 1, 'payments', 'paid_amount', 'Paid Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1168, 1, 'payments', 'total_amount', 'Total Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1169, 1, 'payments', 'unused_amount', 'Unused Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1170, 1, 'payments', 'settled_amount', 'Settled Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1171, 1, 'payments', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1172, 1, 'payments', 'paid_total_amount', 'Paid/Total Amount', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1173, 1, 'payments', 'notes', 'Notes', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1174, 1, 'payments', 'payment_status', 'Payment Status', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1175, 1, 'payments', 'unpaid', 'Unpaid', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1176, 1, 'payments', 'paid', 'Paid', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1177, 1, 'payments', 'transactions', 'Transactions', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1178, 1, 'payments', 'transaction_number', 'Txns No.', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1179, 1, 'payments', 'partially_paid', 'Partially Paid', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1180, 1, 'payments', 'order_payment', 'Order Payment', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1181, 1, 'payments', 'settle_invoice_using_payment', 'Settle below invoices using this payment', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1182, 1, 'payments', 'payment_type', 'Payment Type', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1183, 1, 'payments', 'you_will_pay', 'You Will Pay', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1184, 1, 'payments', 'you_will_receive', 'You Will Receive', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1185, 1, 'payments', 'cash', 'Cash', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1186, 1, 'payments', 'bank', 'Bank', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1187, 1, 'payments', 'view_payments', 'View Payments', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1188, 1, 'payments', 'payment_details', 'Payment Details', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1189, 1, 'payments', 'invoice_number', 'Invoice Number', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1190, 1, 'payments', 'customer', 'Customer', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1191, 1, 'payments', 'status', 'Status', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1192, 1, 'langs', 'add', 'Add New Language', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1193, 1, 'langs', 'edit', 'Edit Language', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1194, 1, 'langs', 'details', 'Language Details', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1195, 1, 'langs', 'created', 'Language Created Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1196, 1, 'langs', 'updated', 'Language Updated Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1197, 1, 'langs', 'deleted', 'Language Deleted Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1198, 1, 'langs', 'delete_message', 'Are you sure you want to delete this language?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1199, 1, 'langs', 'selected_delete_message', 'Are you sure you want to delete selected language?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1200, 1, 'langs', 'view_all_langs', 'View All Languages', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1201, 1, 'langs', 'status_updated', 'Langugage status updated', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1202, 1, 'langs', 'name', 'Name', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1203, 1, 'langs', 'key', 'Key', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1204, 1, 'langs', 'flag', 'Flag', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1205, 1, 'langs', 'enabled', 'Enabled', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1206, 1, 'translations', 'fetch_new_translations', 'Fetch New Translations', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1207, 1, 'translations', 'reload_translations', 'Reload Translations', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1208, 1, 'translations', 'reload_successfully', 'Translations Reload Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1209, 1, 'translations', 'fetched_successfully', 'Translations Fetch Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1210, 1, 'translations', 'import_translations', 'Import Translations', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1211, 1, 'storage_settings', 'updated', 'Storage Settings Updated', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1212, 1, 'storage_settings', 'storage', 'Storage', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1213, 1, 'storage_settings', 'local', 'Local', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1214, 1, 'storage_settings', 'aws', 'AWS S3 Storage', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1215, 1, 'storage_settings', 'aws_key', 'AWS Key', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1216, 1, 'storage_settings', 'aws_secret', 'AWS Secret', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1217, 1, 'storage_settings', 'aws_region', 'AWS Region', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1218, 1, 'storage_settings', 'aws_bucket', 'AWS Bucket', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1219, 1, 'mail_settings', 'updated', 'Mail Settings Updated', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1220, 1, 'mail_settings', 'mail_driver', 'Mail Driver', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1221, 1, 'mail_settings', 'none', 'None', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1222, 1, 'mail_settings', 'mail', 'Mail', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1223, 1, 'mail_settings', 'smtp', 'SMTP', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1224, 1, 'mail_settings', 'from_name', 'Mail From Name', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1225, 1, 'mail_settings', 'from_email', 'Mail From Email', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1226, 1, 'mail_settings', 'host', 'Host', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1227, 1, 'mail_settings', 'port', 'Port', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1228, 1, 'mail_settings', 'encryption', 'Encryption', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1229, 1, 'mail_settings', 'username', 'Username', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1230, 1, 'mail_settings', 'password', 'Password', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1231, 1, 'mail_settings', 'send_test_mail', 'Send Test Mail', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1232, 1, 'mail_settings', 'send_mail_setting_saved', 'Send mail setting saved', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1233, 1, 'mail_settings', 'enable_mail_queue', 'Enable Mail Queue', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1234, 1, 'mail_settings', 'send_mail_for', 'Send Mail For', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1235, 1, 'mail_settings', 'email', 'Email address for which you want to send test mail', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1236, 1, 'mail_settings', 'test_mail_sent_successfully', 'Test mail sent successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1237, 1, 'mail_settings', 'stock_adjustment_create', 'Stock Adjustment Create', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1238, 1, 'mail_settings', 'notificaiton_will_be_sent_to_warehouse', 'Notification will be sent to warehouse email', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1239, 1, 'online_orders', 'order_summary', 'Order Summary', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1240, 1, 'online_orders', 'cancel_order', 'Cancel Order', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1241, 1, 'online_orders', 'order_cancelled', 'Order cancelled successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1242, 1, 'online_orders', 'order_cancelled_message', 'This order has been cancelled.', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1243, 1, 'online_orders', 'cancel_message', 'Are you sure you want to cancel this online order', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1244, 1, 'online_orders', 'deliver_message', 'Are you sure you want to this order as delivered', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1245, 1, 'online_orders', 'order_confirmed', 'Order confirmed successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1246, 1, 'online_orders', 'order_status_changed', 'Order status changed successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1247, 1, 'online_orders', 'online_orders_date', 'Order Date', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1248, 1, 'online_orders', 'online_orders_status', 'Order Status', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1249, 1, 'online_orders', 'update_orders_status', 'Update Order Status', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1250, 1, 'online_orders', 'confirm_delivery', 'Confirm Delivery', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1251, 1, 'online_orders', 'order_delivered', 'Order delivered successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1252, 1, 'online_orders', 'user', 'Customer', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1253, 1, 'online_orders', 'online_store_url', 'Online Store Url', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1254, 1, 'product_card', 'add', 'Add New Product Card', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1255, 1, 'product_card', 'edit', 'Edit Product Card', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1256, 1, 'product_card', 'details', 'Product Card Details', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1257, 1, 'product_card', 'created', 'Product Card Created Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1258, 1, 'product_card', 'updated', 'Product Card Updated Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1259, 1, 'product_card', 'deleted', 'Product Card Deleted Successfully', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1260, 1, 'product_card', 'delete_message', 'Are you sure you want to delete this product card?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1261, 1, 'product_card', 'selected_delete_message', 'Are you sure you want to delete selected product card?', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1262, 1, 'product_card', 'title', 'Title', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1263, 1, 'product_card', 'subtitle', 'Subtitle', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1264, 1, 'product_card', 'products', 'Products', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1265, 1, 'front_setting', 'products', 'Products', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1266, 1, 'front_setting', 'featured_categories', 'Featured Categories', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1267, 1, 'front_setting', 'featured_categories_title', 'Featured Categories Title', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1268, 1, 'front_setting', 'featured_categories_subtitle', 'Featured Categories Subtitle', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1269, 1, 'front_setting', 'featured_products', 'Featured Products', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1270, 1, 'front_setting', 'featured_products_title', 'Featured Products Title', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1271, 1, 'front_setting', 'featured_products_subtitle', 'Featured Products Subtitle', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1272, 1, 'front_setting', 'social_links', 'Social Links', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1273, 1, 'front_setting', 'facebook', 'Facebook', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1274, 1, 'front_setting', 'twitter', 'Twitter', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1275, 1, 'front_setting', 'instagram', 'Instagram', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1276, 1, 'front_setting', 'linkedin', 'Linkedin', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1277, 1, 'front_setting', 'youtube', 'Youttube', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1278, 1, 'front_setting', 'footer', 'Footer', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1279, 1, 'front_setting', 'banners', 'Banners', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1280, 1, 'front_setting', 'placeholder_social_text', 'Please Enter {0} Url', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1281, 1, 'front_setting', 'footers', 'Footers', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1282, 1, 'front_setting', 'copyright_text', 'Copyright Text', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1283, 1, 'front_setting', 'addLink', 'Add Link', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1284, 1, 'front_setting', 'addContactLink', 'Add Contact Link', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1285, 1, 'front_setting', 'addPageDetails', 'Add Pages Details', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1286, 1, 'front_setting', 'required_text', '{0} Required', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1287, 1, 'front_setting', 'footer_page_widget', 'Footer Page Widget', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1288, 1, 'front_setting', 'footer_contact_widget', 'Footer Contact Widget', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1289, 1, 'front_setting', 'footer_links_widget', 'Footer Links Widget', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1290, 1, 'front_setting', 'bottom_banners', 'Bottom Banners', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1291, 1, 'front_setting', 'top_banners_1', 'Top Banner 1', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1292, 1, 'front_setting', 'top_banners_2', 'Top Banner 2', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1293, 1, 'front_setting', 'top_banners_3', 'Top Banner 3', '2024-06-25 01:20:44', '2024-06-25 01:20:44'),
(1294, 1, 'front_setting', 'add_to_cart', 'Add To Cart', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1295, 1, 'front_setting', 'footer_company_description', 'Footer Company Description', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1296, 1, 'front_setting', 'useful_links', 'Useful Links', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1297, 1, 'front_setting', 'pages', 'Pages', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1298, 1, 'front_setting', 'contact', 'Contact', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1299, 1, 'front_setting', 'all_categories', 'All Categories', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1300, 1, 'front_setting', 'no_results', 'No Results', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1301, 1, 'front_setting', 'seo_keywords', 'SEO Keywords', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1302, 1, 'front_setting', 'seo_description', 'SEO Description', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1303, 1, 'stock_adjustment', 'add', 'Add New Adjustment', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1304, 1, 'stock_adjustment', 'edit', 'Edit Adjustment', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1305, 1, 'stock_adjustment', 'details', 'Adjustment Details', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1306, 1, 'stock_adjustment', 'created', 'Adjustment Created Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1307, 1, 'stock_adjustment', 'updated', 'Adjustment Updated Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1308, 1, 'stock_adjustment', 'deleted', 'Adjustment Deleted Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1309, 1, 'stock_adjustment', 'delete_message', 'Are you sure you want to delete this stock adjustment?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1310, 1, 'stock_adjustment', 'selected_delete_message', 'Are you sure you want to delete selected stock adjustment?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1311, 1, 'stock_adjustment', 'notes', 'Notes', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1312, 1, 'stock_adjustment', 'current_stock', 'Current Stock', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1313, 1, 'stock_adjustment', 'quantity', 'Quantity', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1314, 1, 'stock_adjustment', 'adjustment_type', 'Adjustment Type', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1315, 1, 'stock_adjustment', 'adjustment_add', 'Add', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1316, 1, 'stock_adjustment', 'adjustment_subtract', 'Subtract', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1317, 1, 'stock_transfer', 'add', 'Add New Transfer', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1318, 1, 'stock_transfer', 'edit', 'Edit Transfer', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1319, 1, 'stock_transfer', 'details', 'Transfer Details', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1320, 1, 'stock_transfer', 'created', 'Transfer Created Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1321, 1, 'stock_transfer', 'updated', 'Transfer Updated Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1322, 1, 'stock_transfer', 'deleted', 'Transfer Deleted Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1323, 1, 'stock_transfer', 'delete_message', 'Are you sure you want to delete this stock adjustment?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1324, 1, 'stock_transfer', 'selected_delete_message', 'Are you sure you want to delete selected stock adjustment?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1325, 1, 'stock_transfer', 'stock_transfer_date', 'Stock Transfer Date', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1326, 1, 'stock_transfer', 'stock_transfer_status', 'Stock Transfer Status', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1327, 1, 'stock_transfer', 'stock_transfer_transfered', 'Stock Transfer Transfered', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1328, 1, 'stock_transfer', 'stock_transfer_received', 'Stock Transfer Received', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1329, 1, 'stock_transfer', 'from_warehouse', 'From Warehouse', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1330, 1, 'stock_transfer', 'to_warehouse', 'To Warehouse', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1331, 1, 'stock_transfer', 'warehouse', 'Warehouse', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1332, 1, 'stock_transfer', 'products', 'Products', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1333, 1, 'stock_transfer', 'notes', 'Notes', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1334, 1, 'stock_transfer', 'quantity', 'Quantity', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1335, 1, 'stock_transfer', 'created_by', 'Created By', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1336, 1, 'stock_transfer', 'received', 'Received', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1337, 1, 'stock_transfer', 'transfered', 'Transfered', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1338, 1, 'stock_transfer', 'add_pay', 'Add Pay', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1339, 1, 'stock_transfer', 'pay_amount', 'Pay Amount', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1340, 1, 'stock_transfer', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1341, 1, 'database_backup', 'file', 'File', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1342, 1, 'database_backup', 'file_size', 'File Size', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1343, 1, 'database_backup', 'generate_backup', 'Generate Backup', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1344, 1, 'database_backup', 'delete_backup', 'Delete Backup', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1345, 1, 'database_backup', 'backup_generated_successfully', 'Backup Generated Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1346, 1, 'database_backup', 'are_you_sure_generate_backup', 'Are you sure you want to generate database backup?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1347, 1, 'database_backup', 'are_you_sure_delete_backup', 'Are you sure you want to delete this database backup?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1348, 1, 'database_backup', 'backup_locaion_is', 'All generated database file will be stored in storage/app/public/backup folder. ', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1349, 1, 'database_backup', 'settings', 'Command Settings', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1350, 1, 'database_backup', 'backup_command_setting', 'Backup Command Settings', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1351, 1, 'database_backup', 'mysqldump_command_path', 'mysqldump command path', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1352, 1, 'database_backup', 'command_updated', 'Command updated successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1353, 1, 'database_backup', 'window_command_path', 'If you use XAMPP then it will be => C:\\xampp\\mysql\\bin\\mysqldump.exe', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1354, 1, 'database_backup', 'laragon_command_path', 'If you use Laragon then it will be => C:\\laragon\\bin\\mysql\\mysql-5.7.24-winx64\\bin\\mysqldump.exe', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1355, 1, 'database_backup', 'linux_command_path', 'If you are on ubuntu or mac then run following command and enter output here => which mysqldump', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1356, 1, 'database_backup', 'put_dump_path_command_on_env_file', 'Find your MySQL dump path from below and then add it to the DUMP_PATH inside .env file', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1357, 1, 'messages', 'product_out_of_stock', 'Product is out of stock. Current Stock is {0} while required stock is {1}.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1358, 1, 'messages', 'leave_blank_to_create_parent_category', 'Leave it blank to create parent category', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1359, 1, 'messages', 'somehing_went_wrong', 'Something went wrong. Please contact to administrator.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1360, 1, 'messages', 'verify_success', 'Successfully verified. Redirect to app...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1361, 1, 'messages', 'login_success', 'Successfully login. Redirect to app...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1362, 1, 'messages', 'login_success_dashboard', 'Successfully logged into app.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1363, 1, 'messages', 'reset_success', 'Please check the link to set a new password on your gmail...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1364, 1, 'messages', 'click_here_to_find_purchase_code', 'Click here to find your purchase code', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1365, 1, 'messages', 'verification_successfull', 'Verification successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1366, 1, 'messages', 'other_domain_linked', 'Other domain linked', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1367, 1, 'messages', 'other_domain_linked_with_purchase_code', 'Other domain is already linked with your purchase code. Please enter your purchase code for more details...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1368, 1, 'messages', 'first_verify_module_message', 'To enable please \\n verify this module', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1369, 1, 'messages', 'are_you_sure_install_message', 'Are you sure you want to install?', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1370, 1, 'messages', 'downloading_started_message', 'Downloading started. Please wait ...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1371, 1, 'messages', 'file_extracting_message', 'File extracteding. Please wait ...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1372, 1, 'messages', 'installation_success', 'Installation successfully. Click here to reload page...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1373, 1, 'messages', 'are_you_sure_update_message', 'Are you sure you want to update? Please take backup before update.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1374, 1, 'messages', 'stmp_success_message', 'Your SMTP settings are correct..', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1375, 1, 'messages', 'stmp_error_message', 'Your SMTP settings are incorrect. Please update it to send mails', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1376, 1, 'messages', 'uploading_failed', 'Uploading failed', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1377, 1, 'messages', 'loading_app_message', 'Please wait... we are preparing something amazing for you', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1378, 1, 'messages', 'fetching_product_details', 'We are fetching product details. Please wait...', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1379, 1, 'messages', 'product_is_upto_date', 'You are on the latest version of app.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1380, 1, 'messages', 'new_app_version_avaialbe', 'New app version {0} is available. Please update to get latest version.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1381, 1, 'messages', 'not_able_to_edit_order', 'Only order status editable, other fields can not be editable becuase this order linked to some payments. Delete those payment(s) and try again.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1382, 1, 'messages', 'click_here_to_download_sample_file', 'Click here to download sample csv file', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1383, 1, 'messages', 'imported_successfully', 'Imported Successfully', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1384, 1, 'messages', 'company_admin_password_message', 'Admin will login using this password. (Leave blank to keep current password)', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1385, 1, 'messages', 'email_setting_not_configured', 'Email setting not configured', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1386, 1, 'messages', 'please_configure_email_settings', 'Please configure your email settings to send emails. Click Here to configure email settings.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1387, 1, 'messages', 'please_login_to_your_account', 'Please login to your account', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1388, 1, 'messages', 'reset_password_massage', 'Great, you have reset your new password!', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1389, 1, 'popover', 'quantitiy_alert', 'After this stock quanity it will enable low stock warning.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1390, 1, 'popover', 'auto_detect_timezone', 'Allow auto detect timezone from browser for currently logged in user.', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1391, 1, 'popover', 'click_here_to_copy_credentials', 'Click here to copy {0} credentials', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1392, 1, 'invoice', 'purchase_invoice', 'Purchase Invoice', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1393, 1, 'invoice', 'purchase_return_invoice', 'Purchase Return Invoice', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1394, 1, 'invoice', 'sales_invoice', 'Sales Invoice', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1395, 1, 'invoice', 'sales_return_invoice', 'Sales Return Invoice', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1396, 1, 'invoice', 'invoice', 'Invoice', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1397, 1, 'invoice', 'order_date', 'Date', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1398, 1, 'invoice', 'order_status', 'Status', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1399, 1, 'invoice', 'payment_status', 'Payment Status', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1400, 1, 'invoice', 'bill_to', 'Bill To', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1401, 1, 'invoice', 'product', 'Product', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1402, 1, 'invoice', 'unit_price', 'Unit Price', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1403, 1, 'invoice', 'quantity', 'Quantity', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1404, 1, 'invoice', 'total', 'Total', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1405, 1, 'invoice', 'mrp', 'MRP', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1406, 1, 'invoice', 'notes', 'Notes', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1407, 1, 'invoice', 'subtotal', 'Subtotal', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1408, 1, 'invoice', 'tax', 'Tax', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1409, 1, 'invoice', 'discount', 'Discount', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1410, 1, 'invoice', 'shipping', 'Shipping', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1411, 1, 'invoice', 'total_items', 'Total Items', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1412, 1, 'invoice', 'qty', 'Qty', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1413, 1, 'invoice', 'paid_amount', 'Paid Amount', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1414, 1, 'invoice', 'due_amount', 'Due Amount', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1415, 1, 'invoice', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1416, 1, 'invoice', 'total_discount_on_mrp', 'Total Discount On MRP', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1417, 1, 'invoice', 'total_discount', 'Total Discount', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1418, 1, 'invoice', 'total_tax', 'Total Tax', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1419, 1, 'invoice', 'thanks_message', 'Thank You For Shopping With Us. Please Come Again', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1420, 1, 'invoice', 'quotation_invoice', 'Quotation Invoice', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1421, 1, 'invoice', 'terms_condition', 'Terms & Conditions', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1422, 1, 'invoice', 'ref', 'Ref', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1423, 1, 'invoice', 'sold_by', 'Sold By', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1424, 1, 'invoice', 'seller', 'Seller', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1425, 1, 'invoice', 'buyer', 'Buyer', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1426, 1, 'invoice', 'authorized_person', 'Authorized Person', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1427, 1, 'invoice', 'bank_details', 'Bank Details', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1428, 1, 'front', 'home', 'Home', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1429, 1, 'front', 'profile', 'Profile', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1430, 1, 'front', 'dashboard', 'Dashboard', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1431, 1, 'front', 'my_orders', 'My Orders', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1432, 1, 'front', 'my_profile', 'My Profile', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1433, 1, 'front', 'logout', 'Logout', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1434, 1, 'front', 'total_orders', 'Total Orders', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1435, 1, 'front', 'pending_orders', 'Pending Orders', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1436, 1, 'front', 'processing_orders', 'Processing Orders', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1437, 1, 'front', 'completed_orders', 'Completed Orders', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1438, 1, 'front', 'recent_orders', 'Recent Orders', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1439, 1, 'front', 'order_history', 'Order History', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1440, 1, 'front', 'profile_settings', 'Profile Settings', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1441, 1, 'front', 'select_shipping_address', 'Select Shipping Address', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1442, 1, 'front', 'checkout_page', 'Checkout Page', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1443, 1, 'front', 'address_details', 'Address Details', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1444, 1, 'front', 'payment_details', 'Payment Details', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1445, 1, 'front', 'add_new_address', 'Add New Address', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1446, 1, 'front', 'cash_on_delivery', 'Cash On Delivery', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1447, 1, 'front', 'continue_shopping', 'Continue Shopping', '2024-06-25 01:20:45', '2024-06-25 01:20:45'),
(1448, 1, 'front', 'confirm_order', 'Confirm Order', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1449, 1, 'front', 'confirm_order_message', 'Are you sure you want to confirm this order?', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1450, 1, 'front', 'order_placed', 'Order placeded.', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1451, 1, 'front', 'order_placed_message', 'Order placed successfully.', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1452, 1, 'front', 'all_orders', 'All Orders', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1453, 1, 'front', 'follow_us', 'Follow Us', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1454, 1, 'front', 'categories', 'Categories', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1455, 1, 'front', 'pages', 'Pages', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1456, 1, 'front', 'address_deleted', 'Address Deleted', '2024-06-25 01:20:46', '2024-06-25 01:20:46');
INSERT INTO `translations` (`id`, `lang_id`, `group`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1457, 1, 'front', 'address_saved', 'Address Saved', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1458, 1, 'front', 'address_delete_message', 'Are you sure you want to delete this address?', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1459, 1, 'front', 'setting_updated_successfully', 'Setting updated successfully', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1460, 1, 'front', 'login', 'Login', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1461, 1, 'front', 'login_using_email_password', 'Login using email and password', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1462, 1, 'front', 'logged_in_successfully', 'Logged in successfully', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1463, 1, 'front', 'dont_have_account', 'Don\'t have account?', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1464, 1, 'front', 'signup', 'Signup', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1465, 1, 'front', 'signup_using_email_password', 'Signup using email & password', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1466, 1, 'front', 'already_have_account', 'Already have account', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1467, 1, 'front', 'register_successfully', 'Registered successfully', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1468, 1, 'front', 'click_here_to_login', 'Click here to login', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1469, 1, 'topbar_add_button', 'add_staff_member', 'Add Staff Member', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1470, 1, 'topbar_add_button', 'add_customer', 'Add Customer', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1471, 1, 'topbar_add_button', 'add_supplier', 'Add Supplier', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1472, 1, 'topbar_add_button', 'add_brand', 'Add Brand', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1473, 1, 'topbar_add_button', 'add_category', 'Add Category', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1474, 1, 'topbar_add_button', 'add_product', 'Add Product', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1475, 1, 'topbar_add_button', 'add_sales', 'Add Sales', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1476, 1, 'topbar_add_button', 'add_purchase', 'Add Purchase', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1477, 1, 'topbar_add_button', 'add_expense_cateogory', 'Add Expense Category', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1478, 1, 'topbar_add_button', 'add_expense', 'Add Expense', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1479, 1, 'topbar_add_button', 'add_currency', 'Add Currency', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1480, 1, 'topbar_add_button', 'add_warehouse', 'Add Warehouse', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1481, 1, 'topbar_add_button', 'add_unit', 'Add Unit', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1482, 1, 'topbar_add_button', 'add_language', 'Add Language', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1483, 1, 'topbar_add_button', 'add_role', 'Add Role', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1484, 1, 'topbar_add_button', 'add_tax', 'Add Tax', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1485, 1, 'topbar_add_button', 'add_payment_mode', 'Add Payment Mode', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1486, 1, 'setup_company', 'setup_not_completed', 'Setup Not Completed', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1487, 1, 'setup_company', 'setup_not_completed_description', 'Your company default settings not completed. Follow below setups to complete your company basic settings...', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1488, 1, 'setup_company', 'warehouse', 'Warehouse', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1489, 1, 'setup_company', 'add_first_warehouse', 'Add First Warehouse', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1490, 1, 'setup_company', 'currency', 'Currency', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1491, 1, 'setup_company', 'add_first_currency', 'Add First Currency', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1492, 1, 'setup_company', 'payment_mode', 'Payment Mode', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1493, 1, 'setup_company', 'add_payment_mode', 'Add First Payment Mode', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1494, 1, 'setup_company', 'company_settings', 'Company Settings', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1495, 1, 'setup_company', 'set_company_basic_settings', 'Setup Company Basic Settings', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1496, 1, 'setup_company', 'previous_step', 'Previous Step', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1497, 1, 'setup_company', 'next_step', 'Next Step', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1498, 1, 'setup_company', 'basic_settings', 'Basic Settings', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1499, 1, 'setup_company', 'theme_settings', 'Theme Settings', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1500, 1, 'setup_company', 'logo_settings', 'Logo Settings', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1501, 1, 'setup_company', 'save_finish_setup', 'Save & Finish Setup', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1502, 1, 'setup_company', 'go_to_dashboard', 'Go To Dashboard', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1503, 1, 'setup_company', 'setup_running_message', 'Please wait... we are setting up inital company settings.', '2024-06-25 01:20:46', '2024-06-25 01:20:46'),
(1504, 1, 'setup_company', 'setup_complete_message', 'Setup completed... Click on below link to view your app...', '2024-06-25 01:20:46', '2024-06-25 01:20:46');

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

CREATE TABLE `units` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator_value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deletable` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `company_id`, `name`, `short_name`, `base_unit`, `parent_id`, `operator`, `operator_value`, `is_deletable`, `created_at`, `updated_at`) VALUES
(2, 1, 'Tile Size 12\"x8\"', '12\"x8\"', NULL, NULL, 'multiply', '1', 1, '2024-07-28 05:28:00', '2024-07-28 05:28:00'),
(3, 1, '12\"x12\"', 'Tile Size 12\"x12\"', NULL, NULL, 'multiply', '1', 1, '2024-08-27 01:27:20', '2024-08-27 01:27:20'),
(4, 1, '12\"x12\"', 'Tile Size 12\"x12\"', NULL, NULL, 'multiply', '1', 1, '2024-08-27 01:31:02', '2024-08-27 01:31:02'),
(5, 1, 'DG-240', 'DG-240', NULL, NULL, 'multiply', '1', 1, '2024-08-27 01:36:13', '2024-08-27 01:36:13'),
(6, 1, '12\"x18\"', 'Tile Size 12\"x18\"', NULL, NULL, 'multiply', '1', 1, '2024-08-27 01:42:14', '2024-08-27 01:42:14');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_superadmin` tinyint(1) NOT NULL DEFAULT '0',
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `role_id` bigint(20) UNSIGNED DEFAULT NULL,
  `lang_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customers',
  `is_walkin_customer` tinyint(1) NOT NULL DEFAULT '0',
  `login_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verification_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'enabled',
  `reset_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Kolkata',
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'd-m-Y',
  `date_picker_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'dd-mm-yyyy',
  `time_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'h:i a',
  `tax_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `designation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reset_password_token` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `company_id`, `is_superadmin`, `warehouse_id`, `role_id`, `lang_id`, `user_type`, `is_walkin_customer`, `login_enabled`, `name`, `email`, `password`, `phone`, `profile_image`, `address`, `shipping_address`, `email_verification_code`, `status`, `reset_code`, `timezone`, `date_format`, `date_picker_format`, `time_format`, `tax_number`, `created_by`, `department_id`, `designation_id`, `shift_id`, `reset_password_token`, `created_at`, `updated_at`) VALUES
(1, 1, 0, 1, 1, 1, 'staff_members', 0, 1, 'Admin', 'admin@example.com', '$2y$10$icc76bEiTR6tOFTfb6WeQeZmk2AgcD5ctOApWoske64vWq.uWEERK', NULL, NULL, NULL, NULL, NULL, 'enabled', NULL, 'Asia/Kolkata', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2024-06-25 03:57:13'),
(2, 1, 0, NULL, NULL, 1, 'customers', 1, 0, 'Walk In Customer', 'walkin@email.com', NULL, '+911111111111', NULL, 'address', 'shipping address', NULL, 'enabled', NULL, 'Asia/Kolkata', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 1, 0, 1, NULL, 1, 'customers', 0, 1, 'Shyam', 'spoddar@rocklime.com', '$2y$10$mrIPauUUHDMxumLdsPBvWuK0.yyay66GuQuqx3jbod28oF64KDckC', '8802552186', NULL, 'Delhi', 'Noida', NULL, 'enabled', NULL, 'Asia/Kolkata', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, NULL, NULL, NULL, NULL, '2024-08-27 01:52:13', '2024-08-27 01:52:13'),
(4, 1, 0, 1, NULL, NULL, 'customers', 0, 1, 'Shyam', 'spshyam1@gmail.com', '$2y$10$U2pmJ58JKTD1SOvFevtFEeEodxH4uFDGxjRhAzMWBO0efOmHNDuvW', '8076595733', NULL, NULL, NULL, NULL, 'enabled', NULL, 'Asia/Kolkata', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, NULL, NULL, NULL, NULL, '2024-08-29 01:05:38', '2024-08-29 01:05:38'),
(5, 1, 0, 1, NULL, 1, 'suppliers', 0, 1, 'Demo Suppliers', 'demo@suppliers.com', '12345678', '9876543210', NULL, NULL, NULL, NULL, 'enabled', NULL, 'Asia/Kolkata', 'd-m-Y', 'dd-mm-yyyy', 'h:i a', NULL, NULL, NULL, NULL, NULL, NULL, '2024-08-29 01:18:26', '2024-08-29 01:18:26');

-- --------------------------------------------------------

--
-- Table structure for table `user_address`
--

CREATE TABLE `user_address` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_address`
--

INSERT INTO `user_address` (`id`, `company_id`, `user_id`, `name`, `email`, `phone`, `address`, `shipping_address`, `city`, `state`, `country`, `zipcode`, `created_at`, `updated_at`) VALUES
(1, 1, 4, 'Shyam', 'spshyam1@gmail.com', '8076595733', 'Delhi', 'Noida', 'Noida', 'Uttar Pradesh', 'India', '201304', '2024-08-29 01:06:38', '2024-08-29 01:06:38');

-- --------------------------------------------------------

--
-- Table structure for table `user_details`
--

CREATE TABLE `user_details` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `opening_balance` double NOT NULL DEFAULT '0',
  `opening_balance_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'receive',
  `credit_period` int(11) NOT NULL DEFAULT '0',
  `credit_limit` double NOT NULL DEFAULT '0',
  `purchase_order_count` int(11) NOT NULL DEFAULT '0',
  `purchase_return_count` int(11) NOT NULL DEFAULT '0',
  `sales_order_count` int(11) NOT NULL DEFAULT '0',
  `sales_return_count` int(11) NOT NULL DEFAULT '0',
  `total_amount` double NOT NULL DEFAULT '0',
  `paid_amount` double NOT NULL DEFAULT '0',
  `due_amount` double NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_details`
--

INSERT INTO `user_details` (`id`, `warehouse_id`, `user_id`, `opening_balance`, `opening_balance_type`, `credit_period`, `credit_limit`, `purchase_order_count`, `purchase_return_count`, `sales_order_count`, `sales_return_count`, `total_amount`, `paid_amount`, `due_amount`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 0, 'receive', 30, 0, 0, 0, 2, 0, 3875.45, 100, 3775.45, '2024-06-25 03:49:59', '2024-08-29 01:26:14'),
(2, 1, 3, 0, 'receive', 30, 0, 0, 0, 0, 0, 0, 11000, -11000, '2024-08-27 01:52:13', '2024-08-29 01:13:28'),
(3, 1, 4, 0, 'receive', 30, 0, 0, 0, 0, 0, 0, 0, 0, '2024-08-29 01:05:38', '2024-08-29 01:05:38'),
(4, 1, 5, 0, 'receive', 30, 0, 5, 0, 0, 0, -32846.57, -1000, -31846.57, '2024-08-29 01:18:26', '2024-08-29 01:24:36');

-- --------------------------------------------------------

--
-- Table structure for table `user_warehouse`
--

CREATE TABLE `user_warehouse` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variations`
--

CREATE TABLE `variations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `variations`
--

INSERT INTO `variations` (`id`, `company_id`, `name`, `parent_id`, `created_at`, `updated_at`) VALUES
(1, 1, 'Size (inch/feet)', NULL, '2024-07-20 02:30:21', '2024-07-20 02:32:34'),
(2, 1, '24\"x24\"', 1, '2024-07-20 02:30:21', '2024-07-20 02:46:04'),
(3, 1, '16\"x16\"', 1, '2024-07-20 02:30:21', '2024-07-20 02:30:21'),
(4, 1, '12\"x24\"', 1, '2024-07-20 02:30:21', '2024-07-20 02:46:04'),
(5, 1, '12\"x18\"', 1, '2024-07-20 02:30:21', '2024-07-20 02:46:04'),
(6, 1, 'Size (mm)', NULL, '2024-07-20 02:31:38', '2024-07-20 02:31:38'),
(7, 1, '600x300', 6, '2024-07-20 02:31:38', '2024-07-20 02:31:38'),
(8, 1, '400x400', 6, '2024-07-20 02:31:38', '2024-07-20 02:31:38'),
(9, 1, '600x600', 6, '2024-07-20 02:31:38', '2024-07-20 02:31:38'),
(10, 1, '600x1200', 6, '2024-07-20 02:31:38', '2024-07-20 02:31:38'),
(11, 1, 'Color', NULL, '2024-07-20 02:34:38', '2024-07-20 02:34:38'),
(12, 1, 'White', 11, '2024-07-20 02:34:38', '2024-07-20 02:34:38'),
(13, 1, 'Ivory', 11, '2024-07-20 02:34:38', '2024-07-20 02:34:38'),
(14, 1, 'Pcs per box', NULL, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(15, 1, '1', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(16, 1, '2', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(17, 1, '3', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(18, 1, '4', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(19, 1, '5', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(20, 1, '6', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(21, 1, '7', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(22, 1, '8', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(23, 1, '9', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(24, 1, '10', 14, '2024-07-20 02:35:42', '2024-07-20 02:35:42'),
(25, 1, 'Area covered per box', NULL, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(26, 1, '1', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(27, 1, '2', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(28, 1, '3', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(29, 1, '4', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(30, 1, '5', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(31, 1, '6', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(32, 1, '7', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(33, 1, '8', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(34, 1, '9', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(35, 1, '10', 25, '2024-07-20 02:41:20', '2024-07-20 02:41:20'),
(36, 1, '12\"x12\"', 1, '2024-07-20 02:43:40', '2024-07-20 02:46:04'),
(37, 1, '12\"x8\"', 1, '2024-07-20 02:43:40', '2024-07-20 02:46:04'),
(38, 1, '24\"x48\"', 1, '2024-07-20 02:46:04', '2024-07-20 02:46:04'),
(39, 1, 'Product Code', NULL, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(40, 1, '1245-L', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(41, 1, '1245-HL', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(42, 1, '1245-D', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(43, 1, '140-L', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(44, 1, '159-L', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(45, 1, '1200-HL', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15'),
(46, 1, '1872-L', 39, '2024-08-27 01:44:15', '2024-08-27 01:44:15');

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dark_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `show_email_on_invoice` tinyint(1) NOT NULL DEFAULT '0',
  `show_phone_on_invoice` tinyint(1) NOT NULL DEFAULT '0',
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `terms_condition` text COLLATE utf8mb4_unicode_ci,
  `bank_details` text COLLATE utf8mb4_unicode_ci,
  `signature` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `online_store_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `customers_visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `suppliers_visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `products_visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `default_pos_order_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'delivered',
  `show_mrp_on_invoice` tinyint(1) NOT NULL DEFAULT '1',
  `show_discount_tax_on_invoice` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `barcode_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'barcode'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `company_id`, `logo`, `dark_logo`, `name`, `slug`, `email`, `phone`, `show_email_on_invoice`, `show_phone_on_invoice`, `address`, `terms_condition`, `bank_details`, `signature`, `online_store_enabled`, `customers_visibility`, `suppliers_visibility`, `products_visibility`, `default_pos_order_status`, `show_mrp_on_invoice`, `show_discount_tax_on_invoice`, `created_at`, `updated_at`, `barcode_type`) VALUES
(1, 1, NULL, NULL, 'Bhera Enclave', 'bhera-enclave-showbsho', 'ajaychhabra@outlook.com', '9999500699', 0, 0, '487/65 PLOE 130 \nNATIONAL MARKET \nBHERA ENCLAVE MAIN ROAD \nPEERA GARI, NEW DELHI\nWEST DELHI - 110087', '1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to New Delhi jurisdiction only', 'IDFC FIRST\n10179237657\nIDFB0020149\nBhera Enclave Paschim Vihar Branch', 'warehouses_vxowro4pk9ey4wutijwh.png', 1, 'all', 'all', 'all', 'delivered', 1, 1, '2024-06-25 03:49:59', '2024-08-29 01:28:32', 'barcode');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_history`
--

CREATE TABLE `warehouse_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date` date NOT NULL,
  `warehouse_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `expense_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` double NOT NULL DEFAULT '0',
  `quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouse_history`
--

INSERT INTO `warehouse_history` (`id`, `company_id`, `date`, `warehouse_id`, `user_id`, `order_id`, `order_item_id`, `product_id`, `payment_id`, `expense_id`, `amount`, `quantity`, `status`, `type`, `transaction_number`, `staff_user_id`, `updated_at`) VALUES
(1, 1, '2024-08-27', 1, 3, 2, NULL, NULL, NULL, NULL, 113703.09, 110.00, NULL, 'quotations', '27082024', NULL, '2024-08-27 07:24:25'),
(2, 1, '2024-08-27', 1, 3, 2, 3, 20, NULL, NULL, 8495.55, 10.00, NULL, 'order-items', '27082024', NULL, '2024-08-27 07:24:25'),
(3, 1, '2024-08-27', 1, 3, 2, 4, 6, NULL, NULL, 99650.25, 100.00, NULL, 'order-items', '27082024', NULL, '2024-08-27 07:24:25'),
(4, 1, '2024-08-29', 1, 3, NULL, NULL, NULL, 1, NULL, 1000, 0.00, 'paid', 'payment-in', 'PAY-IN-1', NULL, '2024-08-29 06:42:35'),
(5, 1, '2024-08-29', 1, 3, NULL, NULL, NULL, 2, NULL, 10000, 0.00, 'paid', 'payment-in', 'PAY-IN-2', NULL, '2024-08-29 06:43:28'),
(6, 1, '2024-08-29', 1, 3, 2, NULL, NULL, 2, NULL, 10000, 0.00, 'paid', 'payment-orders', 'PAY-IN-2', NULL, '2024-08-29 06:43:28'),
(7, 1, '2024-08-29', 1, 5, 4, NULL, NULL, NULL, NULL, 1020.65, 1.00, NULL, 'purchases', '29082024', NULL, '2024-08-29 06:49:12'),
(8, 1, '2024-08-29', 1, 5, 4, 6, 18, NULL, NULL, 733.95, 1.00, NULL, 'order-items', '29082024', NULL, '2024-08-29 06:49:12'),
(9, 1, '2024-08-29', 1, 5, 5, NULL, NULL, NULL, NULL, 7956.48, 10.00, NULL, 'purchases', 'PUR-5', NULL, '2024-08-29 06:53:13'),
(10, 1, '2024-08-29', 1, 5, 5, 7, 18, NULL, NULL, 7339.5, 10.00, NULL, 'order-items', 'PUR-5', NULL, '2024-08-29 06:53:13'),
(11, 1, '2024-08-29', 1, 5, 6, NULL, NULL, NULL, NULL, 7956.48, 10.00, NULL, 'purchases', '129082024', NULL, '2024-08-29 06:53:26'),
(12, 1, '2024-08-29', 1, 5, 6, 8, 18, NULL, NULL, 7339.5, 10.00, NULL, 'order-items', '129082024', NULL, '2024-08-29 06:53:26'),
(13, 1, '2024-08-29', 1, 5, 7, NULL, NULL, NULL, NULL, 7956.48, 10.00, NULL, 'purchases', '1229082024', NULL, '2024-08-29 06:53:34'),
(14, 1, '2024-08-29', 1, 5, 7, 9, 18, NULL, NULL, 7339.5, 10.00, NULL, 'order-items', '1229082024', NULL, '2024-08-29 06:53:34'),
(15, 1, '2024-08-29', 1, 5, 8, NULL, NULL, NULL, NULL, 7956.48, 10.00, NULL, 'purchases', '98765412301', NULL, '2024-08-29 06:53:52'),
(16, 1, '2024-08-29', 1, 5, 8, 10, 18, NULL, NULL, 7339.5, 10.00, NULL, 'order-items', '98765412301', NULL, '2024-08-29 06:53:52'),
(17, 1, '2024-08-29', 1, 5, NULL, NULL, NULL, 3, NULL, 1000, 0.00, 'paid', 'payment-out', 'PAY-OUT-3', NULL, '2024-08-29 06:54:36'),
(18, 1, '2024-08-29', 1, 5, 7, NULL, NULL, 3, NULL, 1000, 0.00, 'paid', 'payment-orders', 'PAY-OUT-3', NULL, '2024-08-29 06:54:36');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_stocks`
--

CREATE TABLE `warehouse_stocks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `company_id` bigint(20) UNSIGNED DEFAULT NULL,
  `warehouse_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `stock_quantity` double(8,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appreciations`
--
ALTER TABLE `appreciations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appreciations_company_id_foreign` (`company_id`),
  ADD KEY `appreciations_award_id_foreign` (`award_id`),
  ADD KEY `appreciations_user_id_foreign` (`user_id`),
  ADD KEY `appreciations_created_by_foreign` (`created_by`);

--
-- Indexes for table `attendances`
--
ALTER TABLE `attendances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attendances_company_id_foreign` (`company_id`),
  ADD KEY `attendances_user_id_foreign` (`user_id`),
  ADD KEY `attendances_leave_id_foreign` (`leave_id`),
  ADD KEY `attendances_leave_type_id_foreign` (`leave_type_id`),
  ADD KEY `attendances_holiday_id_foreign` (`holiday_id`);

--
-- Indexes for table `awards`
--
ALTER TABLE `awards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `awards_company_id_foreign` (`company_id`),
  ADD KEY `awards_created_by_foreign` (`created_by`);

--
-- Indexes for table `basic_salaries`
--
ALTER TABLE `basic_salaries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `basic_salaries_company_id_foreign` (`company_id`),
  ADD KEY `basic_salaries_user_id_foreign` (`user_id`);

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD KEY `brands_company_id_foreign` (`company_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_parent_id_foreign` (`parent_id`),
  ADD KEY `categories_company_id_foreign` (`company_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `companies_currency_id_foreign` (`currency_id`),
  ADD KEY `companies_lang_id_foreign` (`lang_id`),
  ADD KEY `companies_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `companies_subscription_plan_id_foreign` (`subscription_plan_id`),
  ADD KEY `companies_stripe_id_index` (`stripe_id`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `currencies_company_id_foreign` (`company_id`);

--
-- Indexes for table `custom_fields`
--
ALTER TABLE `custom_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `custom_fields_company_id_foreign` (`company_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `departments_company_id_foreign` (`company_id`),
  ADD KEY `departments_created_by_foreign` (`created_by`);

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `designations_company_id_foreign` (`company_id`),
  ADD KEY `designations_created_by_foreign` (`created_by`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expenses_expense_category_id_foreign` (`expense_category_id`),
  ADD KEY `expenses_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `expenses_user_id_foreign` (`user_id`),
  ADD KEY `expenses_company_id_foreign` (`company_id`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expense_categories_company_id_foreign` (`company_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `front_product_cards`
--
ALTER TABLE `front_product_cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `front_product_cards_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `front_product_cards_company_id_foreign` (`company_id`);

--
-- Indexes for table `front_website_settings`
--
ALTER TABLE `front_website_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `front_website_settings_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `front_website_settings_company_id_foreign` (`company_id`);

--
-- Indexes for table `holidays`
--
ALTER TABLE `holidays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `holidays_company_id_foreign` (`company_id`),
  ADD KEY `holidays_created_by_foreign` (`created_by`);

--
-- Indexes for table `increments_promotions`
--
ALTER TABLE `increments_promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `increments_promotions_company_id_foreign` (`company_id`),
  ADD KEY `increments_promotions_user_id_foreign` (`user_id`),
  ADD KEY `increments_promotions_promoted_designation_id_foreign` (`promoted_designation_id`),
  ADD KEY `increments_promotions_current_designation_id_foreign` (`current_designation_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `langs`
--
ALTER TABLE `langs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leaves`
--
ALTER TABLE `leaves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leaves_company_id_foreign` (`company_id`),
  ADD KEY `leaves_user_id_foreign` (`user_id`),
  ADD KEY `leaves_leave_type_id_foreign` (`leave_type_id`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_types_company_id_foreign` (`company_id`),
  ADD KEY `leave_types_created_by_foreign` (`created_by`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orders_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `orders_user_id_foreign` (`user_id`),
  ADD KEY `orders_tax_id_foreign` (`tax_id`),
  ADD KEY `orders_staff_user_id_foreign` (`staff_user_id`),
  ADD KEY `orders_cancelled_by_foreign` (`cancelled_by`),
  ADD KEY `orders_from_warehouse_id_foreign` (`from_warehouse_id`),
  ADD KEY `orders_company_id_foreign` (`company_id`);

--
-- Indexes for table `order_custom_fields`
--
ALTER TABLE `order_custom_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_custom_fields_order_id_foreign` (`order_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_user_id_foreign` (`user_id`),
  ADD KEY `order_items_order_id_foreign` (`order_id`),
  ADD KEY `order_items_product_id_foreign` (`product_id`),
  ADD KEY `order_items_unit_id_foreign` (`unit_id`),
  ADD KEY `order_items_tax_id_foreign` (`tax_id`);

--
-- Indexes for table `order_item_taxes`
--
ALTER TABLE `order_item_taxes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_item_taxes_order_id_foreign` (`order_id`),
  ADD KEY `order_item_taxes_order_item_id_foreign` (`order_item_id`),
  ADD KEY `order_item_taxes_tax_id_foreign` (`tax_id`);

--
-- Indexes for table `order_payments`
--
ALTER TABLE `order_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_payments_payment_id_foreign` (`payment_id`),
  ADD KEY `order_payments_order_id_foreign` (`order_id`),
  ADD KEY `order_payments_company_id_foreign` (`company_id`);

--
-- Indexes for table `order_shipping_address`
--
ALTER TABLE `order_shipping_address`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_shipping_address_order_id_foreign` (`order_id`),
  ADD KEY `order_shipping_address_company_id_foreign` (`company_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `payments_payment_mode_id_foreign` (`payment_mode_id`),
  ADD KEY `payments_user_id_foreign` (`user_id`),
  ADD KEY `payments_staff_user_id_foreign` (`staff_user_id`),
  ADD KEY `payments_company_id_foreign` (`company_id`);

--
-- Indexes for table `payment_modes`
--
ALTER TABLE `payment_modes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_modes_company_id_foreign` (`company_id`);

--
-- Indexes for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payrolls_company_id_foreign` (`company_id`),
  ADD KEY `payrolls_user_id_foreign` (`user_id`),
  ADD KEY `payrolls_created_by_foreign` (`created_by`),
  ADD KEY `payrolls_updated_by_foreign` (`updated_by`),
  ADD KEY `payrolls_payment_mode_id_foreign` (`payment_mode_id`);

--
-- Indexes for table `payroll_components`
--
ALTER TABLE `payroll_components`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payroll_components_company_id_foreign` (`company_id`),
  ADD KEY `payroll_components_user_id_foreign` (`user_id`),
  ADD KEY `payroll_components_payroll_id_foreign` (`payroll_id`),
  ADD KEY `payroll_components_pre_payment_id_foreign` (`pre_payment_id`),
  ADD KEY `payroll_components_expense_id_foreign` (`expense_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `permission_role`
--
ALTER TABLE `permission_role`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `permission_role_role_id_foreign` (`role_id`);

--
-- Indexes for table `pre_payments`
--
ALTER TABLE `pre_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pre_payments_company_id_foreign` (`company_id`),
  ADD KEY `pre_payments_user_id_foreign` (`user_id`),
  ADD KEY `pre_payments_payment_mode_id_foreign` (`payment_mode_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_category_id_foreign` (`category_id`),
  ADD KEY `products_brand_id_foreign` (`brand_id`),
  ADD KEY `products_unit_id_foreign` (`unit_id`),
  ADD KEY `products_user_id_foreign` (`user_id`),
  ADD KEY `products_company_id_foreign` (`company_id`),
  ADD KEY `products_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `products_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `product_custom_fields`
--
ALTER TABLE `product_custom_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_custom_fields_product_id_foreign` (`product_id`),
  ADD KEY `product_custom_fields_warehouse_id_foreign` (`warehouse_id`);

--
-- Indexes for table `product_details`
--
ALTER TABLE `product_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_details_product_id_foreign` (`product_id`),
  ADD KEY `product_details_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `product_details_tax_id_foreign` (`tax_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_variants_product_id_foreign` (`product_id`),
  ADD KEY `product_variants_variant_id_foreign` (`variant_id`),
  ADD KEY `product_variants_variant_value_id_foreign` (`variant_value_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `roles_company_id_foreign` (`company_id`);

--
-- Indexes for table `role_user`
--
ALTER TABLE `role_user`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_user_role_id_foreign` (`role_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `settings_company_id_foreign` (`company_id`);

--
-- Indexes for table `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shifts_company_id_foreign` (`company_id`);

--
-- Indexes for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_adjustments_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `stock_adjustments_product_id_foreign` (`product_id`),
  ADD KEY `stock_adjustments_created_by_foreign` (`created_by`),
  ADD KEY `stock_adjustments_company_id_foreign` (`company_id`);

--
-- Indexes for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_history_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `stock_history_product_id_foreign` (`product_id`),
  ADD KEY `stock_history_created_by_foreign` (`created_by`),
  ADD KEY `stock_history_company_id_foreign` (`company_id`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `taxes`
--
ALTER TABLE `taxes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taxes_company_id_foreign` (`company_id`),
  ADD KEY `taxes_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `translations`
--
ALTER TABLE `translations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `translations_lang_id_foreign` (`lang_id`);

--
-- Indexes for table `units`
--
ALTER TABLE `units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `units_parent_id_foreign` (`parent_id`),
  ADD KEY `units_company_id_foreign` (`company_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `users_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `users_company_id_foreign` (`company_id`),
  ADD KEY `users_created_by_foreign` (`created_by`),
  ADD KEY `users_lang_id_foreign` (`lang_id`),
  ADD KEY `users_department_id_foreign` (`department_id`),
  ADD KEY `users_designation_id_foreign` (`designation_id`),
  ADD KEY `users_shift_id_foreign` (`shift_id`);

--
-- Indexes for table `user_address`
--
ALTER TABLE `user_address`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_address_user_id_foreign` (`user_id`),
  ADD KEY `user_address_company_id_foreign` (`company_id`);

--
-- Indexes for table `user_details`
--
ALTER TABLE `user_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_details_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `user_details_user_id_foreign` (`user_id`);

--
-- Indexes for table `user_warehouse`
--
ALTER TABLE `user_warehouse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_warehouse_user_id_foreign` (`user_id`),
  ADD KEY `user_warehouse_warehouse_id_foreign` (`warehouse_id`);

--
-- Indexes for table `variations`
--
ALTER TABLE `variations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `variations_company_id_foreign` (`company_id`),
  ADD KEY `variations_parent_id_foreign` (`parent_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warehouses_company_id_foreign` (`company_id`);

--
-- Indexes for table `warehouse_history`
--
ALTER TABLE `warehouse_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warehouse_history_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `warehouse_history_user_id_foreign` (`user_id`),
  ADD KEY `warehouse_history_order_id_foreign` (`order_id`),
  ADD KEY `warehouse_history_order_item_id_foreign` (`order_item_id`),
  ADD KEY `warehouse_history_product_id_foreign` (`product_id`),
  ADD KEY `warehouse_history_payment_id_foreign` (`payment_id`),
  ADD KEY `warehouse_history_expense_id_foreign` (`expense_id`),
  ADD KEY `warehouse_history_staff_user_id_foreign` (`staff_user_id`),
  ADD KEY `warehouse_history_company_id_foreign` (`company_id`);

--
-- Indexes for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `warehouse_stocks_warehouse_id_foreign` (`warehouse_id`),
  ADD KEY `warehouse_stocks_product_id_foreign` (`product_id`),
  ADD KEY `warehouse_stocks_company_id_foreign` (`company_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appreciations`
--
ALTER TABLE `appreciations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendances`
--
ALTER TABLE `attendances`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `awards`
--
ALTER TABLE `awards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `basic_salaries`
--
ALTER TABLE `basic_salaries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `custom_fields`
--
ALTER TABLE `custom_fields`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `front_product_cards`
--
ALTER TABLE `front_product_cards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `front_website_settings`
--
ALTER TABLE `front_website_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `increments_promotions`
--
ALTER TABLE `increments_promotions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `langs`
--
ALTER TABLE `langs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `leaves`
--
ALTER TABLE `leaves`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `order_custom_fields`
--
ALTER TABLE `order_custom_fields`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `order_item_taxes`
--
ALTER TABLE `order_item_taxes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `order_shipping_address`
--
ALTER TABLE `order_shipping_address`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payment_modes`
--
ALTER TABLE `payment_modes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payrolls`
--
ALTER TABLE `payrolls`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll_components`
--
ALTER TABLE `payroll_components`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=172;

--
-- AUTO_INCREMENT for table `pre_payments`
--
ALTER TABLE `pre_payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `product_custom_fields`
--
ALTER TABLE `product_custom_fields`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_details`
--
ALTER TABLE `product_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `taxes`
--
ALTER TABLE `taxes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `translations`
--
ALTER TABLE `translations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1505;

--
-- AUTO_INCREMENT for table `units`
--
ALTER TABLE `units`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_address`
--
ALTER TABLE `user_address`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_details`
--
ALTER TABLE `user_details`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_warehouse`
--
ALTER TABLE `user_warehouse`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `variations`
--
ALTER TABLE `variations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `warehouse_history`
--
ALTER TABLE `warehouse_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appreciations`
--
ALTER TABLE `appreciations`
  ADD CONSTRAINT `appreciations_award_id_foreign` FOREIGN KEY (`award_id`) REFERENCES `awards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `appreciations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `appreciations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `appreciations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `attendances`
--
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendances_holiday_id_foreign` FOREIGN KEY (`holiday_id`) REFERENCES `holidays` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendances_leave_id_foreign` FOREIGN KEY (`leave_id`) REFERENCES `leaves` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendances_leave_type_id_foreign` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attendances_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `awards`
--
ALTER TABLE `awards`
  ADD CONSTRAINT `awards_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `awards_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `basic_salaries`
--
ALTER TABLE `basic_salaries`
  ADD CONSTRAINT `basic_salaries_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `basic_salaries_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `brands`
--
ALTER TABLE `brands`
  ADD CONSTRAINT `brands_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `companies_lang_id_foreign` FOREIGN KEY (`lang_id`) REFERENCES `langs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `companies_subscription_plan_id_foreign` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `companies_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `currencies`
--
ALTER TABLE `currencies`
  ADD CONSTRAINT `currencies_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `custom_fields`
--
ALTER TABLE `custom_fields`
  ADD CONSTRAINT `custom_fields_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `departments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `designations`
--
ALTER TABLE `designations`
  ADD CONSTRAINT `designations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `designations_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `front_product_cards`
--
ALTER TABLE `front_product_cards`
  ADD CONSTRAINT `front_product_cards_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `front_product_cards_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `front_website_settings`
--
ALTER TABLE `front_website_settings`
  ADD CONSTRAINT `front_website_settings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `front_website_settings_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `holidays`
--
ALTER TABLE `holidays`
  ADD CONSTRAINT `holidays_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `holidays_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `increments_promotions`
--
ALTER TABLE `increments_promotions`
  ADD CONSTRAINT `increments_promotions_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `increments_promotions_current_designation_id_foreign` FOREIGN KEY (`current_designation_id`) REFERENCES `designations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `increments_promotions_promoted_designation_id_foreign` FOREIGN KEY (`promoted_designation_id`) REFERENCES `designations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `increments_promotions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `leaves`
--
ALTER TABLE `leaves`
  ADD CONSTRAINT `leaves_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `leaves_leave_type_id_foreign` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `leaves_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD CONSTRAINT `leave_types_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `leave_types_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_cancelled_by_foreign` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_from_warehouse_id_foreign` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_staff_user_id_foreign` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_custom_fields`
--
ALTER TABLE `order_custom_fields`
  ADD CONSTRAINT `order_custom_fields_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_item_taxes`
--
ALTER TABLE `order_item_taxes`
  ADD CONSTRAINT `order_item_taxes_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_item_taxes_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_item_taxes_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_payments`
--
ALTER TABLE `order_payments`
  ADD CONSTRAINT `order_payments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_payments_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_shipping_address`
--
ALTER TABLE `order_shipping_address`
  ADD CONSTRAINT `order_shipping_address_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_shipping_address_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_payment_mode_id_foreign` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_staff_user_id_foreign` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payment_modes`
--
ALTER TABLE `payment_modes`
  ADD CONSTRAINT `payment_modes_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD CONSTRAINT `payrolls_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payrolls_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payrolls_payment_mode_id_foreign` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payrolls_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payrolls_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payroll_components`
--
ALTER TABLE `payroll_components`
  ADD CONSTRAINT `payroll_components_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payroll_components_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payroll_components_payroll_id_foreign` FOREIGN KEY (`payroll_id`) REFERENCES `payrolls` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payroll_components_pre_payment_id_foreign` FOREIGN KEY (`pre_payment_id`) REFERENCES `pre_payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payroll_components_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `permission_role`
--
ALTER TABLE `permission_role`
  ADD CONSTRAINT `permission_role_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `permission_role_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pre_payments`
--
ALTER TABLE `pre_payments`
  ADD CONSTRAINT `pre_payments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pre_payments_payment_mode_id_foreign` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `pre_payments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_brand_id_foreign` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `products_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `products_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `products_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `product_custom_fields`
--
ALTER TABLE `product_custom_fields`
  ADD CONSTRAINT `product_custom_fields_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_custom_fields_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_details`
--
ALTER TABLE `product_details`
  ADD CONSTRAINT `product_details_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_details_tax_id_foreign` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `product_details_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_variants_variant_id_foreign` FOREIGN KEY (`variant_id`) REFERENCES `variations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `product_variants_variant_value_id_foreign` FOREIGN KEY (`variant_value_id`) REFERENCES `variations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `role_user`
--
ALTER TABLE `role_user`
  ADD CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `shifts_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stock_adjustments`
--
ALTER TABLE `stock_adjustments`
  ADD CONSTRAINT `stock_adjustments_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_adjustments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_adjustments_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_adjustments_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD CONSTRAINT `stock_history_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_history_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_history_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_history_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `taxes`
--
ALTER TABLE `taxes`
  ADD CONSTRAINT `taxes_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `taxes_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `taxes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `translations`
--
ALTER TABLE `translations`
  ADD CONSTRAINT `translations_lang_id_foreign` FOREIGN KEY (`lang_id`) REFERENCES `langs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `units`
--
ALTER TABLE `units`
  ADD CONSTRAINT `units_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `units_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `users_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `users_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `users_designation_id_foreign` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `users_lang_id_foreign` FOREIGN KEY (`lang_id`) REFERENCES `langs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `users_shift_id_foreign` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `users_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_address`
--
ALTER TABLE `user_address`
  ADD CONSTRAINT `user_address_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_address_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_details`
--
ALTER TABLE `user_details`
  ADD CONSTRAINT `user_details_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_details_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_warehouse`
--
ALTER TABLE `user_warehouse`
  ADD CONSTRAINT `user_warehouse_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_warehouse_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `variations`
--
ALTER TABLE `variations`
  ADD CONSTRAINT `variations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `variations_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `variations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD CONSTRAINT `warehouses_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `warehouse_history`
--
ALTER TABLE `warehouse_history`
  ADD CONSTRAINT `warehouse_history_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_staff_user_id_foreign` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_history_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  ADD CONSTRAINT `warehouse_stocks_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_stocks_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `warehouse_stocks_warehouse_id_foreign` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

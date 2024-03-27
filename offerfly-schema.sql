-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 24, 2023 at 03:45 PM
-- Server version: 8.0.31
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `offerfly`
--

-- --------------------------------------------------------

--
-- Table structure for table `link_clicks`
--

CREATE TABLE `link_clicks` (
  `id` int NOT NULL,
  `short_url` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `earning` double DEFAULT '0.01',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `earning_per_click` double NOT NULL,
  `id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`earning_per_click`, `id`) VALUES
(0.01, 1);

-- --------------------------------------------------------

--
-- Table structure for table `short_links`
--

CREATE TABLE `short_links` (
  `id` int NOT NULL,
  `userId` int DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `batch` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `courseId` int DEFAULT NULL,
  `original_url` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `short_url` varchar(255) NOT NULL,
  `clicks` int DEFAULT '0',
  `status` enum('active','blocked') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revenue` decimal(10,2) DEFAULT '0.00',
  `is_block_exempt` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `short_links_clicks`
--

CREATE TABLE `short_links_clicks` (
  `id` int NOT NULL,
  `short_url` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `click_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `link_clicks`
--
ALTER TABLE `link_clicks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `short_links`
--
ALTER TABLE `short_links`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `short_links_clicks`
--
ALTER TABLE `short_links_clicks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_short_links_clicks` (`short_url`,`ip_address`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `link_clicks`
--
ALTER TABLE `link_clicks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `short_links`
--
ALTER TABLE `short_links`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `short_links_clicks`
--
ALTER TABLE `short_links_clicks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

CREATE TABLE `bond_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`previousAmount` decimal(12,2),
	`newAmount` decimal(12,2),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bond_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`parish` varchar(100) NOT NULL,
	`externalBookingId` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`age` int,
	`bookingTime` varchar(100),
	`bondText` text,
	`bondAmount` decimal(12,2),
	`chargesText` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrape_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`parish` varchar(100) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'success',
	`recordCount` int NOT NULL DEFAULT 0,
	`newBookings` int NOT NULL DEFAULT 0,
	`bondChanges` int NOT NULL DEFAULT 0,
	`durationMs` int,
	`error` text,
	`scrapedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scrape_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`hash` varchar(64) NOT NULL,
	`recordCount` int NOT NULL DEFAULT 0,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parish` varchar(100) NOT NULL,
	`sourceUrl` text NOT NULL,
	`sourceType` varchar(50) NOT NULL DEFAULT 'sheriff_roster',
	`isActive` boolean NOT NULL DEFAULT true,
	`pollIntervalMinutes` int NOT NULL DEFAULT 30,
	`lastPolledAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` text,
	`recordCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `sources_parish_unique` UNIQUE(`parish`)
);

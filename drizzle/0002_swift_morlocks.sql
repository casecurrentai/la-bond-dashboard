CREATE TABLE `api_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`endpoint` varchar(100),
	`success` boolean,
	`responseTimeMs` int,
	`billingPeriod` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`licenseNumber` varchar(100),
	`ownerName` varchar(200),
	`email` varchar(200) NOT NULL,
	`phone` varchar(20),
	`city` varchar(100),
	`state` varchar(2) DEFAULT 'LA',
	`subscriptionTier` enum('trial','starter','pro','agency') NOT NULL DEFAULT 'trial',
	`subscriptionStatus` enum('active','cancelled','past_due') NOT NULL DEFAULT 'active',
	`trialEndsAt` timestamp,
	`voiceProvider` varchar(50),
	`transferPhone` varchar(20),
	`minimumBudgetThreshold` decimal(10,2) DEFAULT '100',
	`stripeCustomerId` varchar(200),
	`apiKey` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roster_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parish` varchar(100) NOT NULL,
	`inmateName` varchar(200) NOT NULL,
	`inmateData` text NOT NULL,
	`cachedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `roster_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_agent_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`systemPrompt` text,
	`greetingMessage` text,
	`qualificationMessageTemplate` text,
	`disqualificationMessageTemplate` text,
	`maxCallDurationSeconds` int DEFAULT 300,
	`enablePaymentPlans` boolean DEFAULT true,
	`paymentPlanMinimumPercent` decimal(3,2) DEFAULT '0.50',
	`transferOnQualified` boolean DEFAULT true,
	`transferDelaySeconds` int DEFAULT 3,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voice_agent_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_api_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`callerName` varchar(200),
	`inmateNameSearched` varchar(200),
	`parish` varchar(100),
	`callerBudgetAvailable` decimal(10,2),
	`found` boolean,
	`inmateNameConfirmed` varchar(200),
	`bookingNumber` varchar(100),
	`totalBondAmount` decimal(10,2),
	`calculatedPremium` decimal(10,2),
	`screenerDecision` enum('QUALIFIED','UNQUALIFIED','NEEDS_MANUAL_REVIEW','PAYMENT_PLAN_ELIGIBLE','NOT_FOUND','ERROR'),
	`bondStatus` varchar(100),
	`charges` text,
	`responseTimeMs` int,
	`dataSource` enum('real-time','cache','fallback','mock') DEFAULT 'real-time',
	`scrapedAt` timestamp,
	`voiceProvider` varchar(50),
	`callId` varchar(200),
	`sessionId` varchar(200),
	`voicePromptSuggestion` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_api_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voice_calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`apiCallId` int,
	`callId` varchar(200),
	`callerPhone` varchar(20),
	`calledPhone` varchar(20),
	`callStartedAt` timestamp,
	`callEndedAt` timestamp,
	`callDurationSeconds` int,
	`callSummary` text,
	`transcript` text,
	`recordingUrl` varchar(500),
	`transferAttempted` boolean DEFAULT false,
	`transferSuccessful` boolean,
	`transferredToAgent` varchar(200),
	`sentimentScore` decimal(3,2),
	`callerSatisfaction` enum('satisfied','neutral','frustrated'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voice_calls_id` PRIMARY KEY(`id`)
);

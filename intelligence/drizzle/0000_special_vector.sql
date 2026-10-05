CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_tenant_created` ON `audit_events` (`tenant`,`created`);--> statement-breakpoint
CREATE TABLE `bid_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`title` text NOT NULL,
	`question` text NOT NULL,
	`content` text NOT NULL,
	`sources` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bid_tenant_created` ON `bid_drafts` (`tenant`,`created`);--> statement-breakpoint
CREATE TABLE `observations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`site` text NOT NULL,
	`period` text NOT NULL,
	`metric` text NOT NULL,
	`numerator` real NOT NULL,
	`denominator` real NOT NULL,
	`status` text NOT NULL,
	`source` text NOT NULL,
	`note` text NOT NULL,
	`actor` text NOT NULL,
	`updated` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_observation_grain` ON `observations` (`tenant`,`site`,`period`,`metric`);--> statement-breakpoint
CREATE INDEX `idx_observation_scope` ON `observations` (`tenant`,`period`,`status`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`site` text NOT NULL,
	`period` text NOT NULL,
	`metric` text NOT NULL,
	`numerator` real NOT NULL,
	`denominator` real NOT NULL,
	`source` text NOT NULL,
	`note` text NOT NULL,
	`actor` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL,
	`reviewed_by` text,
	`reviewed` text,
	`base_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submission_queue` ON `submissions` (`tenant`,`status`);
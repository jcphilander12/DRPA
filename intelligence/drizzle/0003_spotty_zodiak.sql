CREATE TABLE `integration_vault` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`owner` text NOT NULL,
	`provider` text NOT NULL,
	`encrypted` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_integration_owner` ON `integration_vault` (`tenant`,`owner`,`provider`);--> statement-breakpoint
CREATE TABLE `platform_records` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_platform_records_scope` ON `platform_records` (`tenant`,`kind`);--> statement-breakpoint
ALTER TABLE `observations` ADD `details` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `details` text DEFAULT '{}' NOT NULL;
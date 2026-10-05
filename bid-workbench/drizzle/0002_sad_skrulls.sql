CREATE TABLE `bid_archives` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`commissioner` text NOT NULL,
	`body` text NOT NULL,
	`archived_at` text NOT NULL,
	`archived_by` text NOT NULL,
	`note` text NOT NULL,
	`submitted_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `post_bid_reviews` (
	`project_id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	`mutation_id` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bid_audit` ADD `actor_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_audit` ADD `actor_role` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bid_audit` ADD `detail` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_audit_project_created` ON `bid_audit` (`project_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `files` ADD `visibility` text DEFAULT 'team' NOT NULL;
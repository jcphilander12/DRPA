CREATE TABLE `bid_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`target_id` text NOT NULL,
	`member_id` text NOT NULL,
	`access` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_assignments_member` ON `bid_assignments` (`member_id`);--> statement-breakpoint
CREATE TABLE `bid_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`target_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bid_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`target_id` text NOT NULL,
	`member_id` text NOT NULL,
	`content_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_checks_target` ON `bid_checks` (`project_id`,`target_id`);--> statement-breakpoint
CREATE TABLE `bid_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`target_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`text` text NOT NULL,
	`quote` text DEFAULT '' NOT NULL,
	`proposal` text DEFAULT '' NOT NULL,
	`base_hash` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`applied` integer DEFAULT 0 NOT NULL,
	`decision_note` text DEFAULT '' NOT NULL,
	`decided_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comments_target` ON `bid_comments` (`project_id`,`target_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);--> statement-breakpoint
ALTER TABLE `files` ADD `project_id` text;--> statement-breakpoint
ALTER TABLE `files` ADD `category` text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `target_id` text;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `mutation_id` text DEFAULT '' NOT NULL;
CREATE TABLE `evidence_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`department` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`object_key` text NOT NULL,
	`status` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_documents_tenant_department` ON `evidence_documents` (`tenant`,`department`);
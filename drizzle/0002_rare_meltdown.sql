CREATE TABLE `deletion_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`image_id` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deletion_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`storage_state` text DEFAULT 'pending' NOT NULL,
	`excel_state` text DEFAULT 'pending' NOT NULL,
	`outbox_id` integer NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`error` text,
	`attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deletion_jobs_participant_id_unique` ON `deletion_jobs` (`participant_id`);--> statement-breakpoint
CREATE TABLE `image_files` (
	`id` text PRIMARY KEY NOT NULL,
	`image_id` text NOT NULL,
	`object_key` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);

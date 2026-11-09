CREATE TABLE `participant_accounts` (
	`participant_id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participant_accounts_username_unique` ON `participant_accounts` (`username`);--> statement-breakpoint
CREATE TABLE `admin_account` (
	`id` integer PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL,
	CONSTRAINT "admin_singleton" CHECK("admin_account"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE `admin_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text,
	`detail` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL,
	`updated` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`subject` text NOT NULL,
	`revision` integer NOT NULL,
	`expires` integer NOT NULL,
	`created` text NOT NULL,
	CONSTRAINT "session_kind" CHECK("app_sessions"."kind" IN ('participant','admin')),
	CONSTRAINT "session_admin" CHECK("app_sessions"."kind" != 'admin' OR "app_sessions"."subject" = '1')
);
--> statement-breakpoint
CREATE TABLE `letter_trash` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`snapshot` text NOT NULL,
	`deleted_version` integer NOT NULL,
	`created` text NOT NULL,
	`restored` text
);
--> statement-breakpoint
ALTER TABLE `participants` ADD `letter_state` text DEFAULT 'active' NOT NULL;
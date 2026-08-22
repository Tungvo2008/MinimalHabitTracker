CREATE TABLE `habit_completions` (
	`habit_id` integer NOT NULL,
	`date` text NOT NULL,
	PRIMARY KEY(`habit_id`, `date`),
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '✨' NOT NULL,
	`color` text DEFAULT 'yellow' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
